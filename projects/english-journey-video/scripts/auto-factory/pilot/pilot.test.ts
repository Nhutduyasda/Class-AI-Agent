import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  Script,
  Manifest,
  sha,
  wave,
  importMedia,
  saveImport,
  sentenceSubtitles,
} from "./media.ts";
import { audition } from "./prepare.mjs";
import { PilotState } from "../../../dashboard/src/pilot.ts";
const bytes = await readFile("briefs/english-video-06-candidate.json"),
  script = Script.parse(JSON.parse(bytes.toString()));
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "pilot-Đ-"));
  const segments = [];
  for (const s of script.segments) {
    const file = s.id + ".wav";
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=48000:duration=3.5",
      "-c:a",
      "pcm_s16le",
      join(root, file),
    ]);
    segments.push({
      ...s,
      visual: undefined,
      file,
      voice:
        s.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural",
      sha256: sha(await readFile(join(root, file))),
    });
  }
  const m = Manifest.parse({
    schemaVersion: 1,
    scriptSha256: sha(bytes),
    kind: "SYNTHETIC_OFFLINE",
    sourceReference: "generated tone",
    rightsBasis: "original fixture",
    authorizationReference: "offline-test-only",
    segments: segments.map(({ visual, ...s }) => s),
  });
  return { root, m };
}
test("offline import full decode, sample clock, exact captions, reuse and boundaries", async () => {
  const { root, m } = await fixture();
  try {
    const r = await importMedia(bytes, m, root, sha(JSON.stringify(m)));
    assert.equal(r.durationSamples, 6 * 168000 + 5 * 9600 + 16000);
    assert.equal(r.captions[1].language, "en-US");
    assert.equal(r.captions[1].startSample, 177600);
    assert.equal(r.captions[1].text, "I am hungry.");
    assert.equal(r.qa.publicationAllowed, false);
    assert.equal(r.qa.wordAlignment, "NOT_AVAILABLE");
    assert.ok(
      sentenceSubtitles(r.captions).includes(
        "00:00:03,700 --> 00:00:07,200\nI am hungry.",
      ),
    );
    assert.ok(sentenceSubtitles(r.captions, true).startsWith("WEBVTT"));
    assert.equal(wave(r.audio).samples, r.durationSamples);
    assert.equal(
      await saveImport(r, join(root, "cache")),
      await saveImport(r, join(root, "cache")),
    );
    // Retain only synthetic evidence in ignored out/, never historical directories.
    await saveImport(r, "out/auto-factory-pilot");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
for (const [label, mutate, pattern] of [
  [
    "untrusted approval",
    (m: any) => (m.authorizationReference = "changed"),
    /UNTRUSTED/,
  ],
  [
    "script hash",
    (m: any) => (m.scriptSha256 = "0".repeat(64)),
    /SCRIPT_BINDING/,
  ],
  ["wrong language", (m: any) => (m.segments[1].language = "vi-VN"), /ROUTING/],
  [
    "wrong voice",
    (m: any) => (m.segments[1].voice = "vi-VN-NamMinhNeural"),
    /ROUTING/,
  ],
  ["canonical text", (m: any) => (m.segments[0].text += " extra"), /ROUTING/],
  [
    "wrong hash",
    (m: any) => (m.segments[0].sha256 = "0".repeat(64)),
    /MEDIA_HASH/,
  ],
  ["missing audio", (m: any) => (m.segments[0].file = "missing.wav"), /ENOENT/],
] as const)
  test(label, async () => {
    const { root, m } = await fixture();
    try {
      const original = sha(JSON.stringify(m));
      mutate(m);
      await assert.rejects(
        importMedia(
          bytes,
          m,
          root,
          label === "untrusted approval" ? original : sha(JSON.stringify(m)),
        ),
        pattern,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
test("corrupt, truncated and length-lied WAV fail closed", async () => {
  const { root, m } = await fixture();
  try {
    const b = await readFile(join(root, "hook.wav"));
    assert.throws(() => wave(b.subarray(0, b.length - 2)), /CONTAINER/);
    const c = Buffer.from(b);
    c.writeUInt32LE(0xffffffff, 40);
    assert.throws(() => wave(c), /TRUNCATED/);
    const d = Buffer.from(b);
    d.writeUInt16LE(3, 20);
    assert.throws(() => wave(d), /PCM/);
    await writeFile(join(root, "hook.wav"), b.subarray(0, 50));
    m.segments[0].sha256 = sha(b.subarray(0, 50));
    await assert.rejects(
      importMedia(bytes, m, root, sha(JSON.stringify(m))),
      /CONTAINER/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("no face mode or false script approval; duplicate ids rejected", () => {
  assert.throws(() => Script.parse({ ...script, visibility: "FACE_ONLY" }));
  assert.throws(() => Script.parse({ ...script, approved: true }));
  assert.throws(() =>
    Script.parse({
      ...script,
      segments: [script.segments[0], script.segments[0]],
    }),
  );
});
test("A/B costs use existing conservative billing; no live authority", () => {
  const p = audition(script, bytes, { usdPerMillion: 15 });
  assert.equal(p.requestCount, 12);
  assert.equal(p.billableCharacters, 1073);
  assert.equal(p.estimatedMicrousd, 16095);
  assert.equal(p.paidExecutionAllowed, false);
  assert.equal(p.approvedScriptSha256, null);
  assert.equal(
    p.variants
      .flatMap((v) => v.requests)
      .every((r) => !r.ssml.includes("express-as")),
    true,
  );
  assert.equal(
    p.variants[0].requests.map((r) => r.text).join(""),
    p.variants[1].requests.map((r) => r.text).join(""),
  );
});
test("dashboard state cannot elevate paid or stale approval", () => {
  const p = {
    productionJobId: "pilot",
    scriptVersion: "v1",
    scriptSha256: sha(bytes),
    approvedScriptSha256: null,
    mediaProvenance: "MISSING",
    voiceConfiguration: ["vi-VN-NamMinhNeural", "en-US-AndrewNeural"],
    audioStatus: "BLOCKED",
    renderStatus: "NOT_STARTED",
    qaStatus: "NOT_EVALUATED",
    ownerDecision: "PENDING",
    paidExecutionAllowed: false,
    publicationAllowed: false,
  };
  assert.ok(PilotState.parse(p));
  for (const change of [
    { paidExecutionAllowed: true },
    { publicationAllowed: true },
    { approvedScriptSha256: "0".repeat(64) },
    { audioStatus: "IMPORTED" },
    { renderStatus: "RENDERED" },
  ])
    assert.throws(() => PilotState.parse({ ...p, ...change }));
});

test("preparation modules contain no credential reads or network/dispatch imports", async () => {
  for (const name of [
    "media.ts",
    "import.ts",
    "render.ts",
    "prepare.mjs",
    "historical-check.ts",
  ]) {
    const source = await readFile("scripts/auto-factory/pilot/" + name, "utf8");
    assert.doesNotMatch(
      source,
      /process\.env|fetch\s*\(|node:https|node:http|SPEECH_KEY|workflow_dispatch|Start-BilingualVoice/,
    );
  }
});
