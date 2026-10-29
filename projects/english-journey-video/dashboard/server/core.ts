import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import {
  Draft,
  Product,
  ReviewAction,
  type Job,
  type Overview,
} from "../src/contracts.ts";
import {
  minh,
  voices,
  plan,
  hash,
  RenderPlan,
  ReviewItem,
  validateUrl,
  visibilityPolicy,
} from "../../src/auto-factory/engine.ts";
import { PilotState } from "../src/pilot.ts";
const fixtureRoot = resolve(
  import.meta.dirname,
  "../../out/auto-factory-remotion",
);
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const dirs = [
  "remotion-learning",
  "fixture-phone-case",
  "fixture-fashion",
] as const;
export class DemoStore {
  private jobs = new Map<string, Job>();
  private media = new Map<string, string>();
  private sequence = 0;
  async init() {
    const bytes = await readFile(
      resolve(
        import.meta.dirname,
        "../../briefs/english-video-06-candidate.json",
      ),
    );
    const candidate = JSON.parse(bytes.toString());
    const id = "pilot-video06-preparation";
    this.jobs.set(id, {
      id,
      revision: 0,
      mode: "ENGLISH_LEARNING",
      title: "Video 06 — Chờ duyệt kịch bản",
      status: "VALIDATED",
      fixture: false,
      artifactSha256: null,
      script: candidate.segments.map((s: { text: string }) => s.text),
      captions: [],
      qa: null,
      estimateMicrousd: 80000,
      voiceProfile: "learning-clear",
      visibility: "VOICE_ONLY",
      mediaAvailable: false,
      reviewNotes: null,
      pilot: PilotState.parse({
        productionJobId: id,
        scriptVersion: "candidate-v1",
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
      }),
    });
    for (const dir of dirs) {
      try {
        const base = join(fixtureRoot, dir);
        const [qa, planData, review, bytes] = await Promise.all([
          readFile(join(base, "qa.json"), "utf8").then(JSON.parse),
          readFile(join(base, "plan.json"), "utf8").then(JSON.parse),
          readFile(join(base, "review.json"), "utf8").then(JSON.parse),
          readFile(join(base, "remotion.mp4")),
        ]);
        RenderPlan.parse(planData);
        ReviewItem.parse(review);
        if (
          sha(bytes) !== qa.sha256 ||
          review.videoSha256 !== qa.sha256 ||
          hash(planData) !== qa.planSha256 ||
          review.planSha256 !== qa.planSha256 ||
          qa.fixture !== "OFFLINE_FIXTURE_PASS" ||
          qa.renderer !== "REMOTION_RENDER_PASS" ||
          qa.publicationAllowed !== false
        )
          continue;
        const id = "offline-" + dir;
        this.jobs.set(id, {
          id,
          revision: 0,
          mode: planData.mode,
          title:
            dir === "remotion-learning"
              ? "A hay an?"
              : dir === "fixture-fashion"
                ? "Fashion fixture"
                : "Ốp điện thoại fixture",
          status: "PENDING_OWNER_REVIEW",
          fixture: true,
          artifactSha256: qa.sha256,
          script: planData.shots.map((s: { spoken: string }) => s.spoken),
          captions: planData.shots.map(
            (s: { spoken: string; startFrame: number; endFrame: number }) => ({
              text: s.spoken,
              startFrame: s.startFrame,
              endFrame: s.endFrame,
            }),
          ),
          qa,
          estimateMicrousd: 0,
          voiceProfile: planData.voiceDirection.id,
          visibility: planData.shots[0].visibility,
          mediaAvailable: true,
          reviewNotes: null,
        });
        this.media.set(id, join(base, "remotion.mp4"));
      } catch {
        /* fixture is optional; never invent a video */
      }
    }
  }
  overview(): Overview {
    return {
      schemaVersion: 1,
      mode: "MOCK_OFFLINE",
      identity: { id: "local-demo-owner", kind: "UNTRUSTED_DEMO" },
      jobs: [...this.jobs.values()],
      presenter: {
        id: minh.id,
        assetStatus: minh.assetStatus,
        visibility: [
          "NO_PRESENTER",
          "VOICE_ONLY",
          "HANDS_ONLY",
          "FACE_ONLY",
          "HALF_BODY",
          "FULL_BODY",
        ],
      },
      voices: Object.keys(voices),
      budget: {
        ownerDeclaredUsd: 10,
        productionUsd: 8,
        reserveUsd: 2,
        perVideoUsd: 0.08,
        actualBalance: "UNVERIFIED",
        confirmedMicrousd: 0,
        estimatedMicrousd: [...this.jobs.values()]
          .filter((j) => !j.fixture)
          .reduce((n, j) => n + j.estimateMicrousd, 0),
        schedule: "DISABLED",
        paidExecution: false,
      },
    };
  }
  validateProduct(raw: unknown) {
    const x = Product.parse(raw);
    validateUrl(x.platform, x.inputUrl);
    visibilityPolicy("PRODUCT_SHOWCASE", x.category, x.visibility);
    if (x.claim !== x.attribute)
      throw Error("CLAIM_REQUIRES_MATCHING_FIELD_EVIDENCE");
    const age = Date.now() - Date.parse(x.capturedAt);
    if (age < 0 || age > 86400000) throw Error("EVIDENCE_STALE_OR_FUTURE");
    if (/\b(?:price|giá|₫|vnd)\b/iu.test(x.claim))
      throw Error("PRICE_REQUIRES_SEPARATE_FRESH_EVIDENCE");
    if (/(?:tôi|mình) (?:đã )?(?:thử|dùng|test|trải nghiệm)/iu.test(x.claim))
      throw Error("FAKE_HANDS_ON");
    return { valid: true as const, claims: [x.claim] };
  }
  create(raw: unknown): Job {
    const x = Draft.parse(raw);
    if (x.mode === "PRODUCT_SHOWCASE") this.validateProduct(x);
    else visibilityPolicy("ENGLISH_LEARNING", undefined, x.visibility);
    const id = "demo-" + (++this.sequence).toString().padStart(4, "0");
    let script: string[];
    if (x.mode === "ENGLISH_LEARNING") {
      const lessons: Record<string, [string, string]> = {
        "Dùng a hay an trước apple": [
          "I ate an apple.",
          "Dùng an trước âm nguyên âm.",
        ],
        "Dùng a trước âm phụ âm": [
          "She is a teacher.",
          "Dùng a trước âm phụ âm.",
        ],
      };
      const item = lessons[x.topic];
      if (!item) throw Error("UNSUPPORTED_OFFLINE_TOPIC");
      script = [
        `Hôm nay: ${x.topic}.`,
        item[0],
        item[1],
        "Thử đặt một câu với a hoặc an nhé.",
      ];
    } else {
      script = [x.claim, x.cta, ...(x.disclosure ? [x.disclosure] : [x.cta])];
    }
    const now = new Date().toISOString(),
      date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    const scenes = script.map((spoken, i) => ({
      id: ["hook", "example", "explain", "cta"][i] || `scene-${i}`,
      spoken,
      spans: [
        {
          start: 0,
          end: spoken.length,
          text: spoken,
          language:
            x.mode === "ENGLISH_LEARNING" && i === 1 ? "en-US" : "vi-VN",
        },
      ],
      frames:
        x.mode === "ENGLISH_LEARNING"
          ? Math.floor((x.duration * 30) / script.length)
          : 240,
      claimIds:
        x.mode === "PRODUCT_SHOWCASE" && spoken === x.claim
          ? ["claim-one"]
          : [],
    }));
    const brief =
      x.mode === "ENGLISH_LEARNING"
        ? {
            schemaVersion: 1,
            runId: id,
            execution: "OFFLINE",
            createdAt: now,
            localDate: date,
            presenterId: "minh-main",
            wardrobe: "SMART_CASUAL",
            expression: "EXPLAINING",
            gesture: "EXPLAINING",
            mode: x.mode,
            visibility: x.visibility,
            voiceProfile: x.voiceProfile,
            learning: { point: x.topic, level: "A1", examples: [script[1]] },
            scenes,
          }
        : {
            schemaVersion: 1,
            runId: id,
            execution: "OFFLINE",
            createdAt: now,
            localDate: date,
            presenterId: "minh-main",
            wardrobe: "SMART_CASUAL",
            expression: "EXPLAINING",
            gesture: "EXPLAINING",
            mode: x.mode,
            visibility: x.visibility,
            voiceProfile: x.voiceProfile,
            product: {
              platform: x.platform,
              inputUrl: x.inputUrl,
              name: x.name,
              category: x.category,
              sourceAccessType: "MANUAL_PROVIDED_EVIDENCE",
              capturedAt: x.capturedAt,
              evidence: [
                {
                  id: "name-evidence",
                  source: x.evidenceSource,
                  capturedAt: x.capturedAt,
                  expiresAt: new Date(
                    Date.parse(x.capturedAt) + 86400000,
                  ).toISOString(),
                  field: "name",
                  value: x.name,
                },
                {
                  id: "field-evidence",
                  source: x.evidenceSource,
                  capturedAt: x.capturedAt,
                  expiresAt: new Date(
                    Date.parse(x.capturedAt) + 86400000,
                  ).toISOString(),
                  field: "attribute",
                  value: x.attribute,
                },
              ],
              attributes: [
                {
                  name: "attribute",
                  value: x.attribute,
                  evidenceId: "field-evidence",
                },
              ],
              claims: [
                {
                  id: "claim-one",
                  text: x.claim,
                  evidenceIds: ["field-evidence"],
                  type: "PRODUCT_FACT",
                },
              ],
              assets: [
                {
                  id: "synthetic-fixture",
                  sha256: "0".repeat(64),
                  source: "Built-in geometric placeholder",
                  rightsBasis: "ORIGINAL_SYNTHETIC_FIXTURE",
                  authorizedUseScope: "OFFLINE_DEMO_ONLY",
                  reviewed: true,
                },
              ],
              cta: x.cta,
              disclosure: x.disclosure || undefined,
              claimedHandsOn: false,
            },
            scenes,
          };
    plan(brief, now);
    const job: Job = {
      id,
      revision: 0,
      mode: x.mode,
      title: x.mode === "ENGLISH_LEARNING" ? x.topic : x.name,
      status: "VALIDATED",
      fixture: false,
      artifactSha256: null,
      script,
      captions: [],
      qa: null,
      estimateMicrousd: 80000,
      voiceProfile: x.voiceProfile,
      visibility: x.visibility,
      mediaAvailable: false,
      reviewNotes: null,
    };
    this.jobs.set(id, job);
    return job;
  }
  review(id: string, raw: unknown): Job {
    const x = ReviewAction.parse(raw),
      j = this.jobs.get(id);
    if (!j) throw Error("JOB_NOT_FOUND");
    if (j.revision !== x.revision) throw Error("STALE_REVISION");
    if (!j.artifactSha256 || j.artifactSha256 !== x.artifactSha256)
      throw Error("ARTIFACT_HASH_MISMATCH");
    if (j.status !== "PENDING_OWNER_REVIEW") throw Error("REVIEW_NOT_PENDING");
    const updated = {
      ...j,
      revision: j.revision + 1,
      status: x.decision === "APPROVE" ? "OWNER_ACCEPTED" : "OWNER_REJECTED",
      reviewNotes: x.notes,
    } as Job;
    this.jobs.set(id, updated);
    return updated;
  }
  async mediaFor(id: string) {
    const j = this.jobs.get(id),
      file = this.media.get(id);
    if (!j || !file || !j.artifactSha256) throw Error("MEDIA_UNAVAILABLE");
    const bytes = await readFile(file);
    if (sha(bytes) !== j.artifactSha256) throw Error("MEDIA_INTEGRITY_FAILED");
    return bytes;
  }
}
