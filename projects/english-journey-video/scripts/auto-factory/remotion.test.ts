import { execFileSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { verifyMp4 } from "./run.ts";
import { verifyMedia } from "./remotion.ts";

for (const [id, frames] of [["remotion-learning", 660], ["fixture-phone-case", 720], ["fixture-fashion", 720]] as const) test(`actual Remotion ${id} bytes and input contracts`, async () => {
  const dir = join("out/auto-factory-remotion", id), qa = JSON.parse(await readFile(join(dir, "qa.json"), "utf8")), p = JSON.parse(await readFile(join(dir, "plan.json"), "utf8")), m = JSON.parse(await readFile(join(dir, "media.json"), "utf8"));
  assert.equal(verifyMp4(join(dir, "remotion.mp4"), frames).fullDecode, "PASS");
  assert.equal(createHash("sha256").update(await readFile(join(dir, "remotion.mp4"))).digest("hex"), qa.sha256);
  assert.equal(qa.renderer, "REMOTION_RENDER_PASS");
  assert.equal(qa.publicationAllowed, false);
  await verifyMedia(join(dir, "media"), p, m);

  for (let i = 1; i < qa.proofs.length - 1; i += 2) {
    assert.equal(qa.proofs[i + 1].frame, qa.proofs[i].frame + 1);
    assert.notEqual(qa.proofs[i].sha256, qa.proofs[i + 1].sha256);
  }

  assert.equal(p.durationInFrames, frames);

  const samples = execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    join(dir, "remotion.mp4"),
    "-map",
    "0:a:0",
    "-ac",
    "1",
    "-ar",
    "8000",
    "-f",
    "f32le",
    "-"
  ], {
    maxBuffer: 2000000
  });

  let power = 0;

  for (let i = 0; i < samples.length; i += 4)
    power += samples.readFloatLE(i) ** 2;

  assert.ok(
    Math.sqrt(power / (samples.length / 4)) > .001,
    "rendered AAC must contain synthetic tone, not silence"
  );
});

test("actual local presenter fixture metadata and hash checked; identity stays unverified", async () => {
  const {
    mkdtemp,
    copyFile
  } = await import("node:fs/promises");

  const {
    tmpdir
  } = await import("node:os");

  const root = await mkdtemp(join(tmpdir(), "ej-asset-Đ-"));
  const png = await readFile("out/auto-factory-remotion/fixture-fashion/frame-0.png");
  await writeFile(join(root, "still.png"), png);
  const p = JSON.parse(await readFile("out/auto-factory-remotion/fixture-fashion/plan.json", "utf8"));

  const media = {
    schemaVersion: 1,

    captions: p.shots.map((s: any) => ({
      sceneId: s.id,
      text: s.spoken,
      startFrame: s.startFrame,
      endFrame: s.endFrame
    })),

    presenterAssets: [{
      assetId: "fixture-still",
      presenterId: "minh-main",
      file: "still.png",
      sha256: createHash("sha256").update(png).digest("hex"),
      fileType: "image/png",
      width: 1080,
      height: 1920,
      rightsBasis: "ORIGINAL_OFFLINE_FIXTURE",
      usageRestrictions: ["offline placeholder only"],
      sourceReference: "Actual render proof text card, not Minh imagery",
      visibility: "FACE_ONLY",
      reviewStatus: "APPROVED_OFFLINE_ONLY",
      identityVerified: false
    }]
  };

  assert.equal((await verifyMedia(root, p, media)).presenterAssets[0].identityVerified, false);
  media.presenterAssets[0].width = 10;
  await assert.rejects(verifyMedia(root, p, media), /ASSET_PROBE/);
});
