import { z } from "zod";
export const Mode = z.enum(["ENGLISH_LEARNING", "PRODUCT_SHOWCASE"]);
export const Visibility = z.enum([
  "NO_PRESENTER",
  "VOICE_ONLY",
  "HANDS_ONLY",
  "FACE_ONLY",
  "HALF_BODY",
  "FULL_BODY",
]);
export const Voice = z.enum([
  "learning-clear",
  "review-energetic",
  "narrative-natural",
  "neutral-fallback",
]);
export const Learning = z.strictObject({
  mode: z.literal("ENGLISH_LEARNING"),
  topic: z.string().trim().min(3).max(100),
  level: z.literal("A1"),
  duration: z.number().int().min(20).max(35),
  template: z.literal("MICRO_LESSON"),
  voiceProfile: Voice,
  visibility: Visibility,
});
export const Product = z.strictObject({
  mode: z.literal("PRODUCT_SHOWCASE"),
  platform: z.enum(["SHOPEE", "TIKTOK_SHOP"]),
  inputUrl: z.string().max(2048),
  name: z.string().trim().min(2).max(100),
  category: z.enum(["PHONE_CASE", "DESK", "ART", "FASHION"]),
  attribute: z.string().trim().min(2).max(100),
  evidenceSource: z.string().trim().min(3).max(200),
  capturedAt: z.iso.datetime(),
  claim: z.string().trim().min(2).max(200),
  asset: z.literal("SYNTHETIC_FIXTURE"),
  cta: z.string().trim().min(3).max(140),
  disclosure: z.string().trim().max(140),
  voiceProfile: Voice,
  visibility: Visibility,
});
export const Draft = z.discriminatedUnion("mode", [Learning, Product]);
export const ReviewAction = z.strictObject({
  revision: z.number().int().nonnegative(),
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().trim().min(2).max(1000),
});
export type DraftInput = z.infer<typeof Draft>;
export type Job = {
  id: string;
  revision: number;
  mode: z.infer<typeof Mode>;
  title: string;
  status:
    | "VALIDATED"
    | "PENDING_OWNER_REVIEW"
    | "OWNER_ACCEPTED"
    | "OWNER_REJECTED";
  fixture: boolean;
  artifactSha256: string | null;
  script: string[];
  captions: { startFrame: number; endFrame: number; text: string }[];
  qa: Record<string, unknown> | null;
  estimateMicrousd: number;
  voiceProfile: z.infer<typeof Voice>;
  visibility: z.infer<typeof Visibility>;
  mediaAvailable: boolean;
  reviewNotes: string | null;
};
export type Overview = {
  schemaVersion: 1;
  mode: "MOCK_OFFLINE";
  identity: { id: "local-demo-owner"; kind: "UNTRUSTED_DEMO" };
  jobs: Job[];
  presenter: {
    id: "minh-main";
    assetStatus: "TEXT_REFERENCE_ONLY";
    visibility: string[];
  };
  voices: string[];
  budget: {
    ownerDeclaredUsd: 10;
    productionUsd: 8;
    reserveUsd: 2;
    perVideoUsd: 0.08;
    actualBalance: "UNVERIFIED";
    confirmedMicrousd: 0;
    estimatedMicrousd: number;
    schedule: "DISABLED";
    paidExecution: false;
  };
};
export interface AuthAdapter {
  currentIdentity(): Promise<{
    id: string;
    kind: "UNTRUSTED_DEMO" | "VERIFIED_OWNER";
  }>;
  requireOwner(): Promise<void>;
}
export interface DashboardAdapter {
  overview(): Promise<Overview>;
  create(input: DraftInput): Promise<Job>;
  validateProduct(
    input: z.infer<typeof Product>,
  ): Promise<{ valid: true; claims: string[] }>;
  review(id: string, action: z.infer<typeof ReviewAction>): Promise<Job>;
}
