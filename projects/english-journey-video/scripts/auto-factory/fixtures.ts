import { hash, type BriefType } from "../../src/auto-factory/engine.ts";
export const NOW = "2026-10-21T04:00:00Z";

const scene = (id: string, spoken: string, language: "vi-VN" | "en-US" = "vi-VN", claimIds: string[] = []) => ({
  id,
  spoken,

  spans: [{
    start: 0,
    end: spoken.length,
    text: spoken,
    language
  }],

  frames: 180,
  claimIds
});

const base = {
  schemaVersion: 1 as const,
  execution: "OFFLINE" as const,
  createdAt: NOW,
  localDate: "2026-10-21",
  presenterId: "minh-main" as const,
  wardrobe: "SMART_CASUAL" as const,
  expression: "EXPLAINING" as const,
  gesture: "EXPLAINING" as const
};

export const learning: BriefType = {
  ...base,
  runId: "fixture-learning",
  mode: "ENGLISH_LEARNING",
  visibility: "VOICE_ONLY",
  voiceProfile: "learning-clear",

  learning: {
    point: "Dùng an trước âm nguyên âm.",
    level: "A1",
    examples: ["I ate an apple."]
  },

  scenes: [{
    ...scene("hook", "Chọn a hay an trước apple?"),
    frames: 120
  }, {
    ...scene("example", "I ate an apple.", "en-US"),
    frames: 240
  }, scene("explain", "Dùng an trước âm nguyên âm."), scene("cta", "Thử đặt một câu với an nhé.")]
};

export function product(
  category: "PHONE_CASE" | "ART" | "FASHION",
  visibility: "HANDS_ONLY" | "NO_PRESENTER" | "FACE_ONLY" | "FULL_BODY",
  platform: "SHOPEE" | "TIKTOK_SHOP" = "SHOPEE"
): BriefType {
  const facts = category === "FASHION" ? ["Áo mẫu minh họa.", "Màu xanh theo dữ liệu mẫu.", "Cỡ M theo dữ liệu mẫu."] : category === "ART" ? ["Tranh mẫu minh họa.", "Nền trắng theo dữ liệu mẫu.", "Khổ A4 theo dữ liệu mẫu."] : ["Ốp mẫu minh họa.", "Màu xanh theo dữ liệu mẫu.", "Dành cho máy mẫu theo dữ liệu mẫu."];

  return {
    ...base,
    runId: `fixture-${category.toLowerCase().replace("_", "-")}`,
    mode: "PRODUCT_SHOWCASE",
    visibility,
    voiceProfile: "review-energetic",

    product: {
      platform,
      inputUrl: platform === "SHOPEE" ? "https://shopee.vn/offline-fixture-i.1.1" : "https://shop.tiktok.com/view/product/123",
      name: facts[0],
      category,
      sourceAccessType: "MANUAL_PROVIDED_EVIDENCE",
      capturedAt: NOW,

      evidence: facts.map((value, i) => ({
        id: `e-${i}`,
        source: "owner-supplied fictional fixture; not marketplace verification",
        capturedAt: NOW,
        expiresAt: "2026-10-22T04:00:00Z",
        field: `fact-${i}`,
        value
      })),

      attributes: facts.map((value, i) => ({
        name: `fact-${i}`,
        value,
        evidenceId: `e-${i}`
      })),

      claims: facts.map((text, i) => ({
        id: `c-${i}`,
        text,
        evidenceIds: [`e-${i}`],
        type: "PRODUCT_FACT"
      })),

      assets: [{
        id: "diagram",
        sha256: hash("original geometric placeholder v1"),
        source: "original geometric placeholder v1",
        rightsBasis: "ORIGINAL_SYNTHETIC_FIXTURE",
        authorizedUseScope: "OFFLINE_DEMO_ONLY",
        reviewed: true
      }],

      cta: "Xem thông tin mẫu trước khi lựa chọn.",
      disclosure: "Dữ liệu giả lập, không phải đánh giá trải nghiệm.",
      claimedHandsOn: false
    },

    scenes: [
      ...facts.map((text, i) => scene(`fact-${i}`, text, "vi-VN", [`c-${i}`])),
      scene("cta", "Xem thông tin mẫu trước khi lựa chọn.")
    ]
  };
}

export const fixtures = [
  learning,
  product("PHONE_CASE", "HANDS_ONLY"),
  product("FASHION", "FACE_ONLY", "TIKTOK_SHOP"),
  product("ART", "NO_PRESENTER")
];
