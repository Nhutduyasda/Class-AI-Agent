import { z } from "zod";
import { createHash } from "node:crypto";
import { checkTimeline } from "./playback.ts";
export const hash = (x: unknown): string => createHash("sha256").update(typeof x === "string" ? x : JSON.stringify(x)).digest("hex");
const str = z.string().min(1).max(2000), id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/), time = z.iso.datetime();
export const Visibility = z.enum(["NO_PRESENTER", "VOICE_ONLY", "HANDS_ONLY", "FACE_ONLY", "HALF_BODY", "FULL_BODY"]);
export const Wardrobe = z.enum(["SMART_CASUAL", "FORMAL_SHIRT", "CASUAL_DAILY", "EXPERT_DARK", "OUTDOOR_ACTIVE"]);
export const Expression = z.enum(["NEUTRAL", "HAPPY", "FRIENDLY", "SURPRISED", "THINKING", "CONFIDENT", "EXPLAINING", "ENCOURAGING"]);
export const Gesture = z.enum(["GREETING", "INTRODUCING", "EXPLAINING", "POINTING", "THINKING", "IDEA", "INTERACTING", "ENDING"]);

export const Presenter = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.literal("minh-main"),
  displayName: z.literal("Minh"),
  visualAgeRange: z.literal("24-30"),
  role: z.literal("MAIN_HOST"),
  style: z.tuple([z.literal("modern"), z.literal("friendly"), z.literal("trustworthy")]),

  personality: z.tuple([
    z.literal("enthusiastic"),
    z.literal("positive"),
    z.literal("approachable"),
    z.literal("intelligent"),
    z.literal("inspiring")
  ]),

  channelUse: z.array(z.enum(["ENGLISH_LEARNING", "PRODUCT_SHOWCASE", "EDUCATIONAL", "TUTORIAL", "REVIEW"])).min(2),

  recognition: z.strictObject({
    ethnicity: z.literal("young Asian male"),
    hair: z.literal("thick slightly wavy dark brown/black hair"),
    eyes: z.literal("brown"),
    smile: z.literal("natural friendly smile"),
    appearance: z.literal("clean modern smart-casual appearance")
  }),

  wardrobe: z.array(Wardrobe).length(5),
  expressions: z.array(Expression).length(8),
  gestures: z.array(Gesture).length(8),
  assetStatus: z.literal("TEXT_REFERENCE_ONLY")
});

export const minh = Presenter.parse({
  schemaVersion: 1,
  id: "minh-main",
  displayName: "Minh",
  visualAgeRange: "24-30",
  role: "MAIN_HOST",
  style: ["modern", "friendly", "trustworthy"],
  personality: ["enthusiastic", "positive", "approachable", "intelligent", "inspiring"],
  channelUse: ["ENGLISH_LEARNING", "PRODUCT_SHOWCASE", "EDUCATIONAL", "TUTORIAL", "REVIEW"],

  recognition: {
    ethnicity: "young Asian male",
    hair: "thick slightly wavy dark brown/black hair",
    eyes: "brown",
    smile: "natural friendly smile",
    appearance: "clean modern smart-casual appearance"
  },

  wardrobe: Wardrobe.options,
  expressions: Expression.options,
  gestures: Gesture.options,
  assetStatus: "TEXT_REFERENCE_ONLY"
});

export const Voice = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.enum(["learning-clear", "review-energetic", "narrative-natural", "neutral-fallback"]),
  pacing: z.enum(["MEASURED", "DYNAMIC", "NATURAL", "NEUTRAL"]),
  pauseMs: z.number().int().min(0).max(1000),
  emphasis: z.array(str).max(8),
  segmentation: z.literal("SENTENCE"),
  intent: str,

  hints: z.strictObject({
    breaks: z.boolean(),
    ratePercent: z.literal(0),
    pitch: z.literal("default"),
    expressiveStyle: z.null(),
    cloneReference: z.null()
  }),

  routing: z.literal("EXPLICIT_SPANS_ONLY")
});

export const voices = Object.fromEntries(
  (["learning-clear", "review-energetic", "narrative-natural", "neutral-fallback"] as const).map((v, i) => [v, Voice.parse({
    schemaVersion: 1,
    id: v,
    pacing: ["MEASURED", "DYNAMIC", "NATURAL", "NEUTRAL"][i],
    pauseMs: [250, 150, 220, 200][i],
    emphasis: [],
    segmentation: "SENTENCE",
    intent: ["clear teaching", "credible product explanation", "natural storytelling", "neutral narration"][i],

    hints: {
      breaks: true,
      ratePercent: 0,
      pitch: "default",
      expressiveStyle: null,
      cloneReference: null
    },

    routing: "EXPLICIT_SPANS_ONLY"
  })])
);

const Span = z.strictObject({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  text: str,
  language: z.enum(["vi-VN", "en-US"])
});

const Scene = z.strictObject({
  id,
  spoken: str,
  spans: z.array(Span).min(1).max(30),
  frames: z.number().int().min(30).max(300),
  claimIds: z.array(id).max(8)
});

const Evidence = z.strictObject({
  id,
  source: str,
  capturedAt: time,
  expiresAt: time,
  field: str,
  value: str
});

export const Product = z.strictObject({
  platform: z.enum(["SHOPEE", "TIKTOK_SHOP"]),
  inputUrl: z.string().url().max(2048),
  name: str,
  category: z.enum(["PHONE_CASE", "DESK", "ART", "FASHION"]),
  sourceAccessType: z.literal("MANUAL_PROVIDED_EVIDENCE"),
  capturedAt: time,
  evidence: z.array(Evidence).min(1).max(30),

  attributes: z.array(z.strictObject({
    name: str,
    value: str,
    evidenceId: id
  })).min(1).max(20),

  claims: z.array(z.strictObject({
    id,
    text: str,
    evidenceIds: z.array(id).min(1),
    type: z.literal("PRODUCT_FACT")
  })).min(1).max(20),

  assets: z.array(z.strictObject({
    id,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    source: str,
    rightsBasis: z.literal("ORIGINAL_SYNTHETIC_FIXTURE"),
    authorizedUseScope: z.literal("OFFLINE_DEMO_ONLY"),
    reviewed: z.literal(true)
  })).min(1),

  price: z.strictObject({
    amount: z.number().positive(),
    currency: z.literal("VND"),
    evidenceId: id
  }).optional(),

  cta: str,
  disclosure: str.optional(),
  claimedHandsOn: z.literal(false)
});

const common = {
  schemaVersion: z.literal(1),
  runId: id,
  execution: z.literal("OFFLINE"),
  createdAt: time,
  localDate: z.iso.date(),
  presenterId: z.literal("minh-main"),
  visibility: Visibility,
  wardrobe: Wardrobe,
  expression: Expression,
  gesture: Gesture,
  voiceProfile: Voice.shape.id,
  scenes: z.array(Scene).min(3).max(8)
};

export const Brief = z.discriminatedUnion("mode", [z.strictObject({
  ...common,
  mode: z.literal("ENGLISH_LEARNING"),

  learning: z.strictObject({
    point: str,
    level: z.literal("A1"),
    examples: z.array(str).length(1)
  })
}), z.strictObject({
  ...common,
  mode: z.literal("PRODUCT_SHOWCASE"),
  product: Product
})]);

export type BriefType = z.infer<typeof Brief>;

function check(ok: unknown, code: string): asserts ok {
  if (!ok)
    throw Error(code);
}

export function validateUrl(platform: string, url: string) {
  check(["SHOPEE", "TIKTOK_SHOP"].includes(platform), "UNSUPPORTED_PLATFORM");
  const u = new URL(url);
  check(u.protocol === "https:" && !u.username && !u.password && !u.port && !u.hash, "UNSAFE_URL");

  check(
    (platform === "SHOPEE" ? ["shopee.vn"] : ["shop.tiktok.com", "www.tiktok.com"]).includes(u.hostname),
    "UNSUPPORTED_DOMAIN"
  );

  check(u.pathname !== "/" && !/%(?:00|0a|0d)/i.test(url), "INVALID_PRODUCT_URL");
  return u.href;
}

export function visibilityPolicy(
  mode: "ENGLISH_LEARNING" | "PRODUCT_SHOWCASE",
  category?: string,
  requested?: z.infer<typeof Visibility>
) {
  const allowed = mode === "ENGLISH_LEARNING" ? ["FACE_ONLY", "HALF_BODY", "VOICE_ONLY", "NO_PRESENTER"] : category === "FASHION" ? ["FACE_ONLY", "HALF_BODY", "FULL_BODY", "VOICE_ONLY", "NO_PRESENTER"] : ["HANDS_ONLY", "VOICE_ONLY", "NO_PRESENTER"];
  const selected = requested ?? (mode === "ENGLISH_LEARNING" ? "VOICE_ONLY" : category === "ART" ? "NO_PRESENTER" : category === "FASHION" ? "HALF_BODY" : "HANDS_ONLY");
  check(allowed.includes(selected), "INVALID_SHOT");
  return Visibility.parse(selected);
}

export function validate(input: unknown, now: string) {
  const b = Brief.parse(input);
  visibilityPolicy(b.mode, b.mode === "PRODUCT_SHOWCASE" ? b.product.category : undefined, b.visibility);
  check(Number.isFinite(Date.parse(now)), "INVALID_CLOCK");
  Presenter.parse(minh);
  Voice.parse(voices[b.voiceProfile]);
  check(new Set(b.scenes.map(s => s.id)).size === b.scenes.length, "DUPLICATE_SCENE");

  for (const s of b.scenes) {
    check(s.spoken === s.spoken.normalize("NFC") && !/[<>\x00-\x1f]/.test(s.spoken), "INVALID_TEXT");
    let end = 0;

    for (const p of s.spans) {
      check(
        p.start === end && p.end <= s.spoken.length && p.end > p.start && s.spoken.slice(p.start, p.end) === p.text && !/[\uD800-\uDBFF]/.test(s.spoken[p.end - 1]) && !/[\uDC00-\uDFFF]/.test(s.spoken[p.start]),
        "INVALID_SPAN"
      );

      end = p.end;
    }

    check(end === s.spoken.length, "SPAN_COVERAGE");
  }

  const duration = b.scenes.reduce((n, s) => n + s.frames, 0) / 30;
  check(duration >= 20 && duration <= (b.mode === "ENGLISH_LEARNING" ? 35 : 45), "INVALID_DURATION");

  if (b.mode === "ENGLISH_LEARNING") {
    check(["FACE_ONLY", "HALF_BODY", "VOICE_ONLY", "NO_PRESENTER"].includes(b.visibility), "INVALID_SHOT");
    check(b.scenes.every(s => s.claimIds.length === 0), "UNSUPPORTED_CLAIM");

    check(
      b.scenes.flatMap(s => s.spans).filter(s => s.language === "en-US").map(s => s.text).join("") === b.learning.examples[0],
      "EXAMPLE_ROUTING"
    );
  } else {
    const p = b.product;

    check(
      !b.scenes.some(s => /(tôi|mình) (đã )?(thử|test|dùng|trải nghiệm)|i (tested|tried|used)/iu.test(s.spoken)),
      "FAKE_HANDS_ON"
    );

    validateUrl(p.platform, p.inputUrl);

    check(
      (p.category === "FASHION" ? ["FACE_ONLY", "HALF_BODY", "FULL_BODY", "VOICE_ONLY", "NO_PRESENTER"] : ["HANDS_ONLY", "VOICE_ONLY", "NO_PRESENTER"]).includes(b.visibility),
      "INVALID_SHOT"
    );

    const ev = new Map(p.evidence.map(e => [e.id, e]));
    check(ev.size === p.evidence.length, "DUPLICATE_EVIDENCE");
    check(p.evidence.some(e => e.value === p.name), "PRODUCT_NAME_EVIDENCE_REQUIRED");

    for (const e of p.evidence) check(
      Date.parse(e.capturedAt) <= Date.parse(now) && Date.parse(e.expiresAt) > Date.parse(now) && Date.parse(e.expiresAt) > Date.parse(e.capturedAt),
      "STALE_EVIDENCE"
    );

    for (const a of p.attributes) check(
      ev.get(a.evidenceId)?.field === a.name && ev.get(a.evidenceId)?.value === a.value,
      "MISSING_ATTRIBUTE_EVIDENCE"
    );

    for (const c of p.claims) {
      check(c.evidenceIds.every(e => ev.get(e)?.value === c.text), "UNSUPPORTED_CLAIM");
    }

    const claims = new Map(p.claims.map(c => [c.id, c.text]));
    check(claims.size === p.claims.length, "DUPLICATE_CLAIM");

    for (const s of b.scenes) {
      check(s.claimIds.every(id => claims.get(id) === s.spoken), "UNSUPPORTED_SCRIPT_CLAIM");
      check(s.claimIds.length > 0 || s.spoken === p.cta || s.spoken === p.disclosure, "UNSUPPORTED_SCRIPT_TEXT");
    }

    if (p.price) {
      const e = ev.get(p.price.evidenceId);

      check(
        e?.field === "price" && e.value === String(p.price.amount) && Date.parse(now) - Date.parse(e.capturedAt) <= 86400000,
        "STALE_PRICE"
      );
    }
  }

  return b;
}

export const RenderPlan = z.strictObject({
  schemaVersion: z.literal(1),
  execution: z.literal("OFFLINE"),
  provenance: z.literal("SYNTHETIC_SILENT_CAPTION_FIXTURE"),
  runId: id,
  mode: z.enum(["ENGLISH_LEARNING", "PRODUCT_SHOWCASE"]),
  briefSha256: z.string().regex(/^[a-f0-9]{64}$/),
  presenterSha256: z.string().regex(/^[a-f0-9]{64}$/),
  voiceDirection: Voice,
  width: z.literal(1080),
  height: z.literal(1920),
  fps: z.literal(30),
  durationInFrames: z.number().int().min(600).max(1350),

  shots: z.array(Scene.extend({
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    visibility: Visibility,
    presenterId: z.literal("minh-main"),
    wardrobe: Wardrobe,
    expression: Expression,
    gesture: Gesture,

    routing: z.array(Span.extend({
      voice: z.enum(["vi-VN-NamMinhNeural", "en-US-AndrewNeural"])
    })).min(1)
  })).min(3).max(8),

  paidRequests: z.literal(0)
});

export function plan(input: unknown, now: string) {
  const b = validate(input, now);
  let startFrame = 0;

  const shots = b.scenes.map(s => {
    const shot = {
      ...s,
      startFrame,
      endFrame: startFrame + s.frames,
      visibility: b.visibility,
      presenterId: b.presenterId,
      wardrobe: b.wardrobe,
      expression: b.expression,
      gesture: b.gesture,

      routing: s.spans.map(p => ({
        ...p,
        voice: p.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural"
      }))
    };

    startFrame += s.frames;
    return shot;
  });

  const result = RenderPlan.parse({
    schemaVersion: 1 as const,
    execution: "OFFLINE" as const,
    provenance: "SYNTHETIC_SILENT_CAPTION_FIXTURE" as const,
    runId: b.runId,
    mode: b.mode,
    briefSha256: hash(b),
    presenterSha256: hash(minh),
    voiceDirection: voices[b.voiceProfile],
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: startFrame,
    shots,
    paidRequests: 0 as const
  });

  checkTimeline(result);
  return result;
}

export const States = ["PLANNED", "VALIDATED", "RENDER_PLANNED", "RENDERED", "QA_PASSED", "PENDING_OWNER_REVIEW"] as const;

export const Run = z.strictObject({
  schemaVersion: z.literal(1),
  runId: id,
  inputSha256: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(States),
  revision: z.number().int().nonnegative()
});

export function transition(input: unknown, to: typeof States[number], revision: number) {
  const r = Run.parse(input);
  check(r.revision === revision, "STALE_REVISION");
  check(r.revision === States.indexOf(r.state), "STATE_REVISION_INTEGRITY");
  check(States.indexOf(to) === States.indexOf(r.state) + 1, "INVALID_TRANSITION");

  return Run.parse({
    ...r,
    state: to,
    revision: revision + 1
  });
}

const Reservation = z.strictObject({
  runId: id,
  localDate: z.iso.date(),
  inputSha256: z.string().regex(/^[a-f0-9]{64}$/),
  microusd: z.number().int().min(0).max(80000)
});

export const Ledger = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("SIMULATION_ONLY"),
  revision: z.number().int().nonnegative(),
  openingLiability: z.number().int().min(0).max(8000000),
  reservations: z.array(Reservation)
});

export function reserve(input: unknown, r: unknown, expected: number) {
  const l = Ledger.parse(input), q = Reservation.parse(r);
  check(l.revision === expected, "STALE_REVISION");

  check(
    l.revision === l.reservations.length && new Set(l.reservations.map(x => x.runId)).size === l.reservations.length && new Set(l.reservations.map(x => x.localDate)).size === l.reservations.length,
    "LEDGER_INTEGRITY"
  );

  check(
    l.openingLiability + l.reservations.reduce((n, x) => n + x.microusd, 0) <= 8000000,
    "LEDGER_BALANCE_INVALID"
  );

  const prev = l.reservations.find(x => x.runId === q.runId);

  if (prev) {
    check(hash(prev) === hash(q), "RERUN_CHANGED");
    return l;
  }

  check(!l.reservations.some(x => x.localDate === q.localDate), "DAILY_LIMIT");

  check(
    l.openingLiability + l.reservations.reduce((n, x) => n + x.microusd, 0) + q.microusd <= 8000000,
    "PRODUCTION_LIMIT"
  );

  return Ledger.parse({
    ...l,
    revision: l.revision + 1,
    reservations: [...l.reservations, q]
  });
}

export const ReviewItem = z.strictObject({
  schemaVersion: z.literal(1),
  runId: id,
  planSha256: z.string().regex(/^[a-f0-9]{64}$/),
  videoSha256: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.literal("PENDING_OWNER"),
  fixture: z.literal(true),
  publicationAllowed: z.literal(false)
});

export function resume(input: unknown, p: ReturnType<typeof plan>) {
  const r = Run.parse(input);
  check(r.revision === States.indexOf(r.state), "STATE_REVISION_INTEGRITY");
  check(r.inputSha256 === hash(p) && r.runId === p.runId, "RESUME_INTEGRITY");
  return r;
}

export function paidTransport(): never {
  throw Error("OFFLINE_NO_TRANSPORT");
}
