import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyMp4, run } from "./run.ts";
const root = "out/auto-factory";

for (const id of ["fixture-learning", "fixture-phone-case", "fixture-fashion"]) test(`actual ${id} MP4 full decode and SHA receipt`, async () => {
  const qa = verifyMp4(join(root, id, "fixture.mp4"), 720);
  assert.equal(qa.fullDecode, "PASS");
  const old = JSON.parse(await readFile(join(root, id, "qa.json"), "utf8"));

  const {
    createHash
  } = await import("node:crypto");

  assert.equal(createHash("sha256").update(await readFile(join(root, id, "fixture.mp4"))).digest("hex"), old.sha256);
});

test("bad format/corrupt MP4 rejected", async () => {
  const dir = await mkdtemp(join(tmpdir(), "factory-bad-"));
  const p = join(dir, "bad.mp4");
  await writeFile(p, "not video");
  assert.throws(() => verifyMp4(p, 720));
});

test("completed run resumes without resynthesis or changed hashes", async () => {
  const before = await readFile(join(root, "review-queue.json"), "utf8");
  await run(root);
  assert.equal(await readFile(join(root, "review-queue.json"), "utf8"), before);
});
