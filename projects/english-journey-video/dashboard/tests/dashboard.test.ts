import { test } from "node:test";
import { strict as assert } from "node:assert";
import { DemoStore } from "../server/core.ts";
import { Draft, ReviewAction } from "../src/contracts.ts";
const learning = {
  mode: "ENGLISH_LEARNING",
  topic: "Dùng a hay an trước apple",
  level: "A1",
  duration: 24,
  template: "MICRO_LESSON",
  voiceProfile: "learning-clear",
  visibility: "VOICE_ONLY",
} as const;
const product = {
  mode: "PRODUCT_SHOWCASE",
  platform: "SHOPEE",
  inputUrl: "https://shopee.vn/demo-case",
  name: "Ốp mẫu",
  category: "PHONE_CASE",
  attribute: "Màu xanh",
  evidenceSource: "Ảnh người dùng cung cấp",
  capturedAt: new Date().toISOString(),
  claim: "Màu xanh",
  asset: "SYNTHETIC_FIXTURE",
  cta: "Xem thông tin chi tiết.",
  disclosure: "",
  voiceProfile: "review-energetic",
  visibility: "HANDS_ONLY",
} as const;
test("learning and product drafts are server validated, never rendered or charged", async () => {
  const s = new DemoStore(),
    a = s.create(learning),
    b = s.create(product);
  assert.equal(a.status, "VALIDATED");
  assert.equal(b.visibility, "HANDS_ONLY");
  assert.equal(b.mediaAvailable, false);
  assert.equal(s.overview().budget.confirmedMicrousd, 0);
  assert.equal(s.overview().budget.paidExecution, false);
});
test("unsupported URL, missing evidence and claim fail", () => {
  const s = new DemoStore();
  assert.throws(() =>
    s.create({ ...product, inputUrl: "http://169.254.169.254/latest" }),
  );
  assert.throws(() =>
    s.create({ ...product, inputUrl: "https://evil.example/item" }),
  );
  assert.throws(() => s.create({ ...product, evidenceSource: "" }));
  assert.throws(() => s.create({ ...product, claim: "Chống sốc" }));
  assert.throws(() =>
    s.create({ ...product, capturedAt: "2020-01-01T00:00:00.000Z" }),
  );
});
test("visibility and paid variants fail, voice routing and captions use engine", () => {
  const s = new DemoStore();
  assert.throws(() => s.create({ ...product, visibility: "FULL_BODY" }));
  assert.throws(() => s.create({ ...learning, visibility: "HANDS_ONLY" }));
  assert.throws(() =>
    Draft.parse({ ...learning, voiceProfile: "clone-voice" }),
  );
  assert.throws(() => Draft.parse({ ...learning, execution: "PAID" }));
  assert.equal(s.create(learning).script[1], "I ate an apple.");
  assert.equal(
    s.create({ ...learning, topic: "Dùng a trước âm phụ âm" }).script[1],
    "She is a teacher.",
  );
  assert.throws(() => s.create({ ...learning, topic: "Other topic" }));
});
test("fixture review pins revision and SHA; no publication", async () => {
  const s = new DemoStore();
  await s.init();
  const fixture = s.overview().jobs.find((j) => j.mediaAvailable);
  assert.ok(fixture);
  const bytes = await s.mediaFor(fixture.id);
  assert.ok(bytes.length > 1000);
  assert.throws(() =>
    s.review(fixture.id, {
      revision: 0,
      artifactSha256: "0".repeat(64),
      decision: "APPROVE",
      notes: "Reviewed fixture",
    }),
  );
  const result = s.review(fixture.id, {
    revision: 0,
    artifactSha256: fixture.artifactSha256,
    decision: "APPROVE",
    notes: "Reviewed fixture",
  });
  assert.equal(result.revision, 1);
  assert.equal(result.status, "OWNER_ACCEPTED");
  assert.throws(() =>
    s.review(fixture.id, {
      revision: 0,
      artifactSha256: fixture.artifactSha256,
      decision: "REJECT",
      notes: "Stale review",
    }),
  );
  assert.equal(s.overview().budget.paidExecution, false);
});
test("missing fixture is explicit rather than fabricated", async () => {
  const s = new DemoStore();
  await assert.rejects(s.mediaFor("missing"));
  assert.equal(s.overview().jobs.length, 0);
});

test("Video06 preparation remains pending and cannot review a missing artifact", async () => {
  const s = new DemoStore();
  await s.init();
  const p = s.overview().jobs.find((j) => j.pilot);
  assert.ok(p?.pilot);
  assert.equal(p.pilot.approvedScriptSha256, null);
  assert.equal(p.pilot.audioStatus, "BLOCKED");
  assert.equal(p.pilot.paidExecutionAllowed, false);
  assert.throws(
    () =>
      s.review(p.id, {
        revision: 0,
        artifactSha256: "0".repeat(64),
        decision: "APPROVE",
        notes: "No media",
      }),
    /ARTIFACT_HASH/,
  );
});
