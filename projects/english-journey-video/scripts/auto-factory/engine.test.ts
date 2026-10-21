import { test } from "node:test";
import assert from "node:assert/strict";

import {
  Brief,
  Presenter,
  minh,
  Voice,
  voices,
  plan,
  validate,
  validateUrl,
  reserve,
  transition,
  resume,
  hash,
  paidTransport,
  visibilityPolicy,
} from "../../src/auto-factory/engine.ts";

import { fixtures, learning, product, NOW } from "./fixtures.ts";
const copy = <T>(x: T): T => structuredClone(x);

const bad = (f: (x: any) => void, base: any = learning) => {
  const x = copy(base);
  f(x);
  assert.throws(() => plan(x, NOW));
};

test("all fixtures route through one engine with deterministic SHA", () => {
  for (const f of fixtures) {
    assert.equal(hash(plan(f, NOW)), hash(plan(copy(f), NOW)));
    assert.equal(plan(f, NOW).paidRequests, 0);
  }
});

for (const [name, mut] of Object.entries({
  mode: (x: any) => x.mode = "REVIEW",
  version: (x: any) => x.schemaVersion = 2,
  unknown: (x: any) => x.clone = true,
  visibility: (x: any) => x.visibility = "HANDS_ONLY",
  duration: (x: any) => x.scenes[0].frames = 1,
  span: (x: any) => x.scenes[0].spans[0].start = 2,
  language: (x: any) => x.scenes[0].spans[0].language = "xx",
  claim: (x: any) => x.scenes[0].claimIds = ["unsupported"]
}))
  test(`reject ${name}`, () => bad(mut));

test("presenter strict metadata and presets", () => {
  assert.equal(Presenter.parse(minh).wardrobe.length, 5);

  assert.throws(() => Presenter.parse({
    ...minh,
    id: "other"
  }));

  assert.throws(() => Presenter.parse({
    ...minh,
    asset: "fake-photo"
  }));
});

for (const visibility of ["FACE_ONLY", "HALF_BODY", "VOICE_ONLY", "NO_PRESENTER"]) test(`lesson visibility ${visibility}`, () => assert.ok(plan({
  ...learning,
  visibility
}, NOW)));

test("small product rejects face and fashion rejects hands", () => {
  bad(x => x.visibility = "FACE_ONLY", fixtures[1]);
  bad(x => x.visibility = "HANDS_ONLY", fixtures[2]);
});

test("fashion full body and art none supported", () => {
  assert.ok(plan(product("FASHION", "FULL_BODY"), NOW));
  assert.ok(plan(product("ART", "NO_PRESENTER", "TIKTOK_SHOP"), NOW));
});

for (const url of [
  "http://shopee.vn/a",
  "https://shopee.vn.evil.com/a",
  "https://127.0.0.1/a",
  "https://user:pass@shopee.vn/a",
  "file:///tmp/a",
  "https://shopee.vn:8443/a",
  "https://shopee.vn/a#x",
  "https://shopee.vn/"
])
  test(`reject URL ${url}`, () => assert.throws(() => validateUrl("SHOPEE", url)));

test("missing evidence, unsupported claims and false hands-on blocked", () => {
  bad(x => x.product.evidence = [], fixtures[1]);
  bad(x => x.product.claims[0].text = "Chống sốc tuyệt đối", fixtures[1]);
  bad(x => x.product.claimedHandsOn = true, fixtures[1]);
  bad(x => x.scenes[0].spoken = "Tôi đã thử rồi", fixtures[1]);
});

test("stale evidence fails closed", () => {
  assert.throws(() => plan(fixtures[1], "2026-10-23T00:00:00Z"));
});

test("price matching plus 24h freshness", () => {
  const x: any = copy(fixtures[1]);

  x.product.evidence.push({
    id: "price",
    source: "fictional",
    field: "price",
    value: "100000",
    capturedAt: "2026-10-19T00:00:00Z",
    expiresAt: "2026-10-25T00:00:00Z"
  });

  x.product.price = {
    amount: 100000,
    currency: "VND",
    evidenceId: "price"
  };

  assert.throws(() => plan(x, NOW), /STALE_PRICE/);
  x.product.evidence.at(-1).capturedAt = NOW;
  assert.ok(plan(x, NOW));
});

test("Vietnamese surrounding narration remains Nam Minh", () => {
  const x: any = copy(learning), s = x.scenes[0];
  s.spoken = "Nếu trả lời sai, mình có thể nhờ AI giải thích thêm bằng ví dụ đơn giản hơn";

  s.spans = [{
    start: 0,
    end: s.spoken.length,
    text: s.spoken,
    language: "vi-VN"
  }];

  const p = plan(x, NOW);
  assert.equal(p.shots[0].routing[0].voice, "vi-VN-NamMinhNeural");
  assert.equal(p.shots[1].routing[0].voice, "en-US-AndrewNeural");
});

test("unsupported SSML, prosody, cloning metadata rejected", () => {
  for (const key of ["expressiveStyle", "cloneReference", "ratePercent"]) {
    const v: any = copy(voices["review-energetic"]);
    v.hints[key] = "cheerful";
    assert.throws(() => Voice.parse(v));
  }

  bad(x => {
    x.scenes[0].spoken = "<speak>hi</speak>";
  });
});

const empty = () => ({
  schemaVersion: 1,
  kind: "SIMULATION_ONLY",
  revision: 0,
  openingLiability: 0,
  reservations: []
});

const reservation = (amount = 80000) => ({
  runId: "run-one",
  localDate: "2026-10-21",
  inputSha256: hash("plan"),
  microusd: amount
});

test("cost boundaries reserve exclusion and aggregate liability", () => {
  assert.equal(reserve(empty(), reservation(), 0).reservations[0].microusd, 80000);
  assert.throws(() => reserve(empty(), reservation(80001), 0));

  assert.throws(() => reserve({
    ...empty(),
    openingLiability: 8000000
  }, reservation(1), 0));

  assert.ok(reserve({
    ...empty(),
    openingLiability: 7920000
  }, reservation(), 0));

  assert.throws(() => reserve(empty(), reservation(-1), 0));
});

test("idempotent reservations and daily slot", () => {
  const l = reserve(empty(), reservation(), 0);
  assert.deepEqual(reserve(l, reservation(), 1), l);

  assert.throws(() => reserve(l, {
    ...reservation(),
    runId: "run-two"
  }, 1));

  assert.throws(() => reserve(l, {
    ...reservation(),
    microusd: 1
  }, 1));

  assert.throws(() => reserve(l, reservation(), 0));
});

test("state transition resume hash and revision guards", () => {
  const p = plan(learning, NOW),
        r = {
          schemaVersion: 1,
          runId: p.runId,
          inputSha256: hash(p),
          state: "PLANNED",
          revision: 0
        };

  assert.equal(resume(r, p).state, "PLANNED");
  assert.equal(transition(r, "VALIDATED", 0).revision, 1);
  assert.throws(() => transition(r, "RENDERED", 0));
  assert.throws(() => transition(r, "VALIDATED", 2));

  assert.throws(() => resume({
    ...r,
    inputSha256: hash("tamper")
  }, p));
});

test("offline plan makes no network or paid calls", () => {
  const old = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls++;
    throw Error("NETWORK_FORBIDDEN");
  };

  try {
    fixtures.forEach(f => plan(f, NOW));
    assert.throws(paidTransport, /OFFLINE_NO_TRANSPORT/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = old;
  }
});

test("rule-based default shot selection", () => {
  assert.equal(visibilityPolicy("ENGLISH_LEARNING"), "VOICE_ONLY");
  assert.equal(visibilityPolicy("PRODUCT_SHOWCASE", "PHONE_CASE"), "HANDS_ONLY");
  assert.equal(visibilityPolicy("PRODUCT_SHOWCASE", "ART"), "NO_PRESENTER");
  assert.equal(visibilityPolicy("PRODUCT_SHOWCASE", "FASHION"), "HALF_BODY");
});
