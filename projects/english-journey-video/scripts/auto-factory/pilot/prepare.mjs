import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Script } from "./media.ts";
import { billing, escapeXml } from "../../bilingual/core.mjs";
const hash = (b) => createHash("sha256").update(b).digest("hex");
export function audition(script, scriptBytes, price) {
  Script.parse(script);
  if (
    JSON.stringify(JSON.parse(scriptBytes.toString())) !==
    JSON.stringify(script)
  )
    throw Error("SCRIPT_BYTES_MISMATCH");
  if (!Number.isFinite(price.usdPerMillion) || price.usdPerMillion <= 0)
    throw Error("INVALID_PRICE");
  const variants = ["neutral", "dynamic"].map((variant) => {
    const requests = script.segments.map((s, i) => {
      const voice =
        s.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural";
      // No emotional styles, emphasis tags or pitch assumptions. Generic prosody + break only.
      const rate =
        variant === "neutral"
          ? "0%"
          : s.language === "en-US"
            ? "-8%"
            : i === 0
              ? "+4%"
              : "0%";
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${s.language}"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(s.text)}</prosody><break time="${variant === "neutral" ? 180 : 260}ms"/></voice></speak>`;
      const count = billing(ssml).billableCharacters;
      return {
        id: s.id,
        language: s.language,
        voice,
        text: s.text,
        ssml,
        ssmlSha256: hash(ssml),
        billableCharacters: count,
        estimatedMicrousd: Math.ceil(count * price.usdPerMillion),
      };
    });
    return {
      variant,
      requests,
      requestCount: requests.length,
      billableCharacters: requests.reduce(
        (n, r) => n + r.billableCharacters,
        0,
      ),
      estimatedMicrousd: requests.reduce((n, r) => n + r.estimatedMicrousd, 0),
    };
  });
  return {
    schemaVersion: 1,
    scriptSha256: hash(scriptBytes),
    scriptApproval: "PENDING_OWNER",
    approvedScriptSha256: null,
    reviewedCodeSha256: null,
    variants,
    requestCount: variants.reduce((n, v) => n + v.requestCount, 0),
    billableCharacters: variants.reduce((n, v) => n + v.billableCharacters, 0),
    estimatedMicrousd: variants.reduce((n, v) => n + v.estimatedMicrousd, 0),
    pricing: {
      ...price,
      accountPriceVerified: false,
      expiresAt: "2026-10-22T00:00:00Z",
    },
    proposedAllServiceCeilingMicrousd: 80000,
    estimateIsNotAuthorization: true,
    paidExecutionAllowed: false,
  };
}
if (
  process.argv[1]?.endsWith("/prepare.mjs") ||
  process.argv[1]?.endsWith("\\prepare.mjs")
) {
  const bytes = await readFile("briefs/english-video-06-candidate.json");
  const p = audition(
    JSON.parse(bytes),
    bytes,
    JSON.parse(
      await readFile(
        "briefs/auto-factory/video06-price-reference.json",
        "utf8",
      ),
    ),
  );
  await mkdir("briefs/auto-factory", { recursive: true });
  await writeFile(
    "briefs/auto-factory/video06-auditions.json",
    JSON.stringify(p, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      scriptSha256: p.scriptSha256,
      requests: p.requestCount,
      characters: p.billableCharacters,
      estimateUsd: p.estimatedMicrousd / 1e6,
    }),
  );
}
