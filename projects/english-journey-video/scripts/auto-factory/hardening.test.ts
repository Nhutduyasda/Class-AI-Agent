import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, symlink, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { plan, hash, resume, transition, reserve, validate, States } from "../../src/auto-factory/engine.ts";
import { Playback, AudioInput, PresenterAsset, validatePlayback, checkTimeline, qaStates } from "../../src/auto-factory/playback.ts";
import { learning, fixtures, NOW } from "./fixtures.ts";
import { run } from "./run.ts";
import { verifyMedia, browserPath } from "./remotion.ts";
const p = plan(learning, NOW);

const media = () => ({
  schemaVersion: 1,

  captions: p.shots.map(s => ({
    sceneId: s.id,
    text: s.spoken,
    startFrame: s.startFrame,
    endFrame: s.endFrame
  })),

  presenterAssets: []
});

test("forged checkpoint revision blocked on resume and transition", () => {
  const r = {
    schemaVersion: 1,
    runId: p.runId,
    inputSha256: hash(p),
    state: "RENDER_PLANNED",
    revision: 0
  };

  assert.throws(() => resume(r, p), /STATE_REVISION/);
  assert.throws(() => transition(r, "RENDERED", 0), /STATE_REVISION/);
});

test("overdrawn persisted ledger rejected even on idempotent reservation", () => {
  const q = {
    runId: "run-one",
    localDate: "2026-10-21",
    inputSha256: hash(p),
    microusd: 80000
  };

  assert.throws(() => reserve({
    schemaVersion: 1,
    kind: "SIMULATION_ONLY",
    revision: 1,
    openingLiability: 8000000,
    reservations: [q]
  }, q, 1), /BALANCE/);
});

test("product name requires evidence", () => {
  const b: any = structuredClone(fixtures[1]);
  b.product.name = "Invented brand";
  assert.throws(() => validate(b, NOW), /PRODUCT_NAME/);
});

test("discontinuous and inconsistent scene timelines blocked", () => {
  for (const key of ["startFrame", "endFrame", "frames"]) {
    const x = structuredClone(p);
    (x.shots[1] as any)[key]++;
    assert.throws(() => checkTimeline(x));
  }
});

test("canonical caption copy, boundaries and coverage enforced", () => {
  const x = media();
  assert.ok(validatePlayback(p, x));

  for (const key of ["text", "startFrame", "endFrame"]) {
    const a: any = structuredClone(x);
    a.captions[1][key] = key === "text" ? "wrong" : 5;
    assert.throws(() => validatePlayback(p, a));
  }

  assert.throws(() => validatePlayback(p, {
    ...x,
    captions: []
  }));
});

test("audio contract accepts observed offline samples and rejects mismatched duration", () => {
  const audio = {
    file: "tone.wav",
    sha256: "a".repeat(64),
    sampleRate: 48000,
    durationSamples: 1152000,
    observedDurationSeconds: 24,
    provenance: "SYNTHETIC_OFFLINE",
    alignment: "UNVERIFIED"
  };

  assert.ok(validatePlayback(p, {
    ...media(),
    audio
  }));

  assert.throws(() => validatePlayback(p, {
    ...media(),

    audio: {
      ...audio,
      durationSamples: 10
    }
  }));

  assert.throws(() => AudioInput.parse({
    ...audio,
    file: "https://evil/audio.wav"
  }));

  assert.throws(() => AudioInput.parse({
    ...audio,
    file: "../tone.wav"
  }));
});

const asset = {
  assetId: "minh-still",
  presenterId: "minh-main",
  file: "minh.png",
  sha256: "b".repeat(64),
  fileType: "image/png",
  width: 1080,
  height: 1920,
  rightsBasis: "OWNER_PROVIDED_PERMISSION",
  usageRestrictions: ["offline only"],
  sourceReference: "owner reference not supplied yet",
  visibility: "FACE_ONLY",
  reviewStatus: "APPROVED_OFFLINE_ONLY",
  identityVerified: false
};

for (const visibility of ["HANDS_ONLY", "FACE_ONLY", "HALF_BODY", "FULL_BODY"]) test(`asset manifest supports ${visibility}`, () => assert.ok(PresenterAsset.parse({
  ...asset,
  visibility
})));

test("no visible asset for voice-only and no-presenter plans", () => {
  assert.ok(validatePlayback(p, media()));

  assert.throws(() => validatePlayback(p, {
    ...media(),
    presenterAssets: [asset]
  }), /ASSET_BINDING/);
});

test("unreviewed, mismatched MIME and asserted identity rejected", () => {
  const x = structuredClone(p);
  x.shots.forEach(s => s.visibility = "FACE_ONLY");

  assert.throws(() => validatePlayback(x, {
    ...media(),

    presenterAssets: [{
      ...asset,
      reviewStatus: "UNVERIFIED"
    }]
  }));

  assert.throws(() => validatePlayback(x, {
    ...media(),

    presenterAssets: [{
      ...asset,
      fileType: "video/mp4"
    }]
  }));

  assert.throws(() => PresenterAsset.parse({
    ...asset,
    identityVerified: true
  }));
});

test("silent fixture statuses never imply production readiness", () => {
  for (const yes of [true, false]) {
    const q = qaStates(yes);
    assert.equal(q.publicationAllowed, false);
    assert.equal(q.technicalProduction, "NOT_EVALUATED");
    assert.equal(q.audio, "AUDIO_ALIGNMENT_UNVERIFIED");
    assert.equal(q.presenter, "PRESENTER_ASSET_UNVERIFIED");
  }

  assert.equal(qaStates(true).renderer, "REMOTION_RENDER_PASS");
});

test("media hash mismatch stops before decoder or renderer", async () => {
  const dir = await mkdtemp(join(tmpdir(), "factory-unicode-Đ-"));
  await writeFile(join(dir, "tone.wav"), "not audio");

  await assert.rejects(verifyMedia(dir, p, {
    ...media(),

    audio: {
      file: "tone.wav",
      sha256: "a".repeat(64),
      sampleRate: 48000,
      durationSamples: 48000,
      observedDurationSeconds: 1,
      provenance: "SYNTHETIC_OFFLINE",
      alignment: "UNVERIFIED"
    }
  }), /MEDIA_HASH/);
});

test("invalid browser path does not trigger install or fetch", async () => {
  const old = globalThis.fetch;

  globalThis.fetch = async () => {
    throw Error("NETWORK");
  };

  try {
    const b = await browserPath();
    assert.ok(b.length > 0);
  } finally {
    globalThis.fetch = old;
  }
});

test("explicit missing browser fails without fallback", async () => {
  await assert.rejects(browserPath("/definitely-missing/chrome"), /BROWSER_PATH_INVALID/);
});

test("RENDER_PLANNED tampered plan stops before renderer", async () => {
  const root = await mkdtemp(join(tmpdir(), "ej-plan-Đ-")), dir = join(root, p.runId);
  await mkdir(dir);

  await writeFile(join(dir, "state.json"), JSON.stringify({
    schemaVersion: 1,
    runId: p.runId,
    inputSha256: hash(p),
    state: "RENDER_PLANNED",
    revision: 2
  }));

  await writeFile(join(dir, "plan.json"), JSON.stringify({
    ...p,
    durationInFrames: 1
  }));

  await assert.rejects(run(root), /PLAN_FILE_INTEGRITY/);
});

test("exclusive run lock blocks concurrent invocation", async () => {
  const root = await mkdtemp(join(tmpdir(), "ej-lock-"));
  await writeFile(join(root, "run.lock"), "existing");

  await assert.rejects(run(root), {
    code: "EEXIST"
  });
});
