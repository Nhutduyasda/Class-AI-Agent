import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { sha, wave } from "./media.ts";
import { verifyMp4 } from "../run.ts";
const root =
  "out/auto-factory-pilot/e47a6945a22872b3d94e89aa1334c24cab1040b96a8dd25d3d9b2e48f6090cc8";
test("actual pilot Remotion encode, full decode, frame proofs and synthetic-only QA", async () => {
  const m = JSON.parse(await readFile(join(root, "import.json"), "utf8")),
    q = JSON.parse(await readFile(join(root, "render-qa.json"), "utf8"));
  assert.equal(
    verifyMp4(join(root, "pilot.mp4"), m.durationInFrames).fullDecode,
    "PASS",
  );
  assert.equal(q.artifactSha256, sha(await readFile(join(root, "pilot.mp4"))));
  assert.equal(q.renderer, "REMOTION_RENDER_PASS");
  assert.equal(q.kind, "SYNTHETIC_OFFLINE");
  assert.equal(q.technicalProduction, "NOT_EVALUATED");
  assert.equal(q.publicationAllowed, false);
  for (const frame of [0, 335, 669])
    assert.ok(
      (await readFile(join(root, `frame-${frame}.png`))).length > 10000,
    );
});
test("AAC preserves tone/silence sample windows at all imported segment boundaries (not speech alignment)", async () => {
  const m = JSON.parse(await readFile(join(root, "import.json"), "utf8"));
  const source = wave(await readFile(join(root, "speech.wav"))).pcm;
  const decoded = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      join(root, "pilot.mp4"),
      "-map",
      "0:a:0",
      "-ar",
      "48000",
      "-ac",
      "1",
      "-f",
      "s16le",
      "-",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  const rms = (b: Buffer, at: number, n: number) => {
    let power = 0;
    for (let i = at; i < at + n; i++)
      power += (b.readInt16LE(i * 2) / 32768) ** 2;
    return Math.sqrt(power / n);
  };
  assert.ok(
    Math.abs(decoded.length - source.length) / 2 <= 1024,
    "AAC padding bounded by one frame",
  );
  for (const c of m.captions) {
    for (const at of [c.startSample + 2400, c.endSample + 2400]) {
      const a = rms(source, at, 1600),
        b = rms(decoded, at, 1600);
      // Remotion stereo AAC -> ffmpeg mono downmix has a measured -3 dB gain.
      // Compare signal presence and consistent gain, not identical amplitudes.
      if (a > 0.01) assert.ok(b / a > 0.69 && b / a < 0.73);
      else assert.ok(b < 0.002);
    }
  }
});
