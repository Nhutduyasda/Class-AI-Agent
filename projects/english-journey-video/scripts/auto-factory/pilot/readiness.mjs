// Offline content/authorization preparation only. No provider transport or credential access.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { audition } from "./prepare.mjs";
import { Script } from "./media.ts";
const sha = (x) => createHash("sha256").update(x).digest("hex");
export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function readiness(bytes, version, price) {
  if (!["v1", "v2"].includes(version)) throw Error("INVALID_CANDIDATE_VERSION");
  const script = Script.parse(JSON.parse(bytes.toString("utf8")));
  for (const s of script.segments) {
    if (s.text !== s.text.normalize("NFC") || /[\x00-\x1f]/.test(s.text))
      throw Error("INVALID_CANONICAL_TEXT");
  }
  const speech = script.segments.map((s) => ({
    id: s.id,
    language: s.language,
    text: s.text,
  }));
  const a = audition(script, bytes, price);
  const spans = script.segments.map((s) => ({
    sceneId: s.id,
    offsetUnit: "UTF16",
    spans: [
      {
        start: 0,
        end: s.text.length,
        text: s.text,
        language: s.language,
        voice:
          s.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural",
      },
    ],
  }));
  const payload = {
    schemaVersion: 1,
    candidateVersion: version,
    scriptFileSha256: sha(bytes),
    canonicalScriptSha256: sha(canonical(script)),
    canonicalSpeechSha256: sha(canonical(speech)),
    canonicalization:
      "Recursive sorted JSON keys; arrays retain order; NFC text; UTF8 SHA256. File hash binds exact original bytes.",
    approved: false,
    approvedScriptSha256: null,
    languageSpans: spans,
    audition: a,
    storyboard: {
      timingBasis: "EDITORIAL_PROPOSAL_NOT_AUDIO_MEASURED",
      fps: 30,
      targetSeconds: [20, 35],
      frameZero:
        version === "v2"
          ? {
              text: "I hungry ❌",
              revealText: "I am hungry ✓",
              plannedRevealFrame: 15,
              hook: script.segments[0].text,
            }
          : {
              text: "Nói mình đói thế nào?",
              revealText: "I am hungry.",
              plannedRevealFrame: null,
              hook: script.segments[0].text,
            },
      shots: script.segments.map((s) => ({ sceneId: s.id, visual: s.visual })),
      practiceHoldProposedMs: 1500,
      answerReveal:
        "After full practice audio plus proposed hold; English answer and correct option begin together. Actual frame set only from verified WAV samples.",
      captionPlan:
        "Canonical full sentence cues from imported WAV sample boundaries; no invented word timestamps. Visual-only wrong answers never enter spoken captions.",
    },
    creativeReview: [
      "Frame zero is readable within safe area on a phone.",
      "V2 correct answer visible at proposed frame15; no fade from black.",
      "Only correct standalone English examples use Andrew; Vietnamese uses NamMinh.",
      "Wrong sentences are illustrative visual-only text, never spoken or attributed to a real learner.",
      "The grammar explanation applies to this I/am sentence, not every adjective.",
      "Practice hold and answer reveal give enough time to choose; measure with genuine audio.",
      "20–35s is a target, not measured speech; no speedup/trimming to force duration.",
      "Owner hears both variants and checks pronunciation, naturalness, pacing and usefulness.",
    ],
    paidExecutionAllowed: false,
    publicationAllowed: false,
  };
  return { ...payload, planSha256: sha(canonical(payload)) };
}
export function verifyReadiness(p, bytes, version, price) {
  const expected = readiness(bytes, version, price);
  if (canonical(expected) !== canonical(p))
    throw Error("READINESS_PLAN_MISMATCH");
  return true;
}
export async function generate() {
  const price = JSON.parse(
    await readFile("briefs/auto-factory/video06-price-reference.json", "utf8"),
  );
  const options = [];
  for (const version of ["v1", "v2"]) {
    const path =
      version === "v1"
        ? "briefs/english-video-06-candidate.json"
        : "briefs/english-video-06-candidate-v2.json";
    const bytes = await readFile(path),
      p = readiness(bytes, version, price),
      planPath = `briefs/auto-factory/video06-${version}-readiness.json`;
    await writeFile(planPath, JSON.stringify(p, null, 2) + "\n");
    options.push({
      version,
      scriptPath: path,
      scriptFileSha256: p.scriptFileSha256,
      canonicalScriptSha256: p.canonicalScriptSha256,
      canonicalSpeechSha256: p.canonicalSpeechSha256,
      planPath,
      planSha256: p.planSha256,
      planFileSha256: sha(await readFile(planPath)),
      variants: p.audition.variants.map((v) => ({
        variant: v.variant,
        requestCount: v.requestCount,
        billableCharacters: v.billableCharacters,
        estimatedMicrousd: v.estimatedMicrousd,
      })),
      requestCount: p.audition.requestCount,
      billableCharacters: p.audition.billableCharacters,
      estimatedMicrousd: p.audition.estimatedMicrousd,
    });
  }
  const index = {
    schemaVersion: 1,
    previousReviewedRuntimeCodeSha: "3bf3c3a807e4f1a96f7dafdcd9e3ce7a4fae875c",
    p1DocumentationHead: "72274a9d1202b63f3064727213dd6aaab9c6d7a6",
    preparationSourceDigests: await Promise.all(
      [
        "scripts/auto-factory/pilot/readiness.mjs",
        "scripts/auto-factory/pilot/prepare.mjs",
        "scripts/auto-factory/pilot/media.ts",
        "scripts/bilingual/core.mjs",
      ].map(async (path) => ({ path, sha256: sha(await readFile(path)) })),
    ),
    options,
    combinedBothCandidates: {
      requests: options.reduce((n, x) => n + x.requestCount, 0),
      billableCharacters: options.reduce((n, x) => n + x.billableCharacters, 0),
      estimatedMicrousd: options.reduce((n, x) => n + x.estimatedMicrousd, 0),
    },
    selectionRequired: true,
    selectedCandidate: null,
    approvedScriptSha256: null,
    approvedPlanSha256: null,
    paidExecutionAllowed: false,
    decision: "NO_GO",
  };
  await writeFile(
    "briefs/auto-factory/video06-readiness-index.json",
    JSON.stringify(index, null, 2) + "\n",
  );
  console.log(JSON.stringify(index, null, 2));
  return index;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await generate();
