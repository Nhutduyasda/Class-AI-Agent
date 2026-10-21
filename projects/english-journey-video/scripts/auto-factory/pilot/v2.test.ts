import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { verifyMp4 } from "../run.ts";
import { sha, wave } from "./media.ts";
const root = "out/auto-factory-v2-preflight";
test("actual V2 render full decode, frame0 error, correction frame15, practice/answer frame proofs", async () => {
  const q = JSON.parse(await readFile(join(root, "qa.json"), "utf8")),
    p = JSON.parse(await readFile(join(root, "input.json"), "utf8"));
  assert.equal(
    verifyMp4(join(root, "pilot-v2.mp4"), p.durationInFrames).fullDecode,
    "PASS",
  );
  assert.equal(
    q.artifactSha256,
    sha(await readFile(join(root, "pilot-v2.mp4"))),
  );
  assert.equal(q.technicalProduction, "NOT_EVALUATED");
  assert.equal(q.publicationAllowed, false);
  assert.equal(q.practiceHoldSamples, 72000);
  assert.equal(p.revealFrame, 15);
  const hash = async (n: number) =>
    sha(await readFile(join(root, `frame-${n}.png`)));
  assert.equal((await hash(0)).length, 64);
  assert.notEqual(await hash(14), await hash(15));
  assert.notEqual(
    await hash(p.answerRevealFrame - 1),
    await hash(p.answerRevealFrame),
  );
  const practice = p.captions.find((c: any) => c.sceneId === "practice"),
    answer = p.captions.find((c: any) => c.sceneId === "answer");
  assert.equal(answer.startSample - practice.endSample, 72000);
  assert.deepEqual(
    p.captions
      .filter((c: any) => c.language === "en-US")
      .map((c: any) => c.voice),
    ["en-US-AndrewNeural", "en-US-AndrewNeural"],
  );
  assert.ok(
    p.captions.every(
      (c: any) => !c.text.includes("I hungry") && !c.text.includes("I tired"),
    ),
  );
});
test("synthetic sample clock preserves complete clips and practice silence after mux", async () => {
  const p = JSON.parse(await readFile(join(root, "input.json"), "utf8")),
    source = wave(await readFile(join(root, "speech.wav")));
  assert.equal(source.samples, 1134400);
  assert.equal(p.durationInFrames, 709);
  const pcm = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      join(root, "pilot-v2.mp4"),
      "-map",
      "0:a:0",
      "-ac",
      "1",
      "-ar",
      "48000",
      "-f",
      "s16le",
      "-",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  assert.ok(Math.abs(pcm.length / 2 - source.samples) <= 1024);
  const practice = p.captions.find((c: any) => c.sceneId === "practice"),
    answer = p.captions.find((c: any) => c.sceneId === "answer");
  for (let s = practice.endSample + 4800; s < answer.startSample - 4800; s++) {
    assert.equal(source.pcm.readInt16LE(s * 2), 0);
    assert.ok(Math.abs(pcm.readInt16LE(s * 2)) < 66);
  }
});

test('tone frequencies follow declared Vietnamese/English routing without claiming real voices',async()=>{const p=JSON.parse(await readFile(join(root,'input.json'),'utf8')),pcm=wave(await readFile(join(root,'speech.wav'))).pcm;for(const c of p.captions){const start=c.startSample+4800,n=4800;function power(hz:number){let re=0,im=0;for(let k=0;k<n;k++){const x=pcm.readInt16LE((start+k)*2)/32768,phase=2*Math.PI*hz*k/48000;re+=x*Math.cos(phase);im+=x*Math.sin(phase);}return re*re+im*im;}const correct=c.language==='en-US'?660:440,other=correct===660?440:660;assert.ok(power(correct)>power(other)*1000);}});
