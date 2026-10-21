import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readiness, verifyReadiness, canonical } from "./readiness.mjs";
const price = JSON.parse(
  await readFile("briefs/auto-factory/video06-price-reference.json", "utf8"),
);
const index = JSON.parse(
  await readFile("briefs/auto-factory/video06-readiness-index.json", "utf8"),
);
const sha = (x) => createHash("sha256").update(x).digest("hex");
for (const option of index.options) {
  const bytes = await readFile(option.scriptPath),
    plan = JSON.parse(await readFile(option.planPath, "utf8"));
  test(`${option.version} exact/canonical/script/plan hashes and deterministic regeneration`, () => {
    assert.equal(verifyReadiness(plan, bytes, option.version, price), true);
    assert.equal(sha(bytes), option.scriptFileSha256);
    assert.equal(
      sha(canonical(JSON.parse(bytes))),
      option.canonicalScriptSha256,
    );
    assert.equal(
      sha(
        canonical(
          Object.fromEntries(
            Object.entries(plan).filter(([k]) => k !== "planSha256"),
          ),
        ),
      ),
      option.planSha256,
    );
    assert.equal(plan.approved, false);
    assert.equal(plan.approvedScriptSha256, null);
    assert.equal(
      sha(Buffer.from(JSON.stringify(plan, null, 2) + "\n")),
      option.planFileSha256,
    );
  });
  test(`${option.version} explicit UTF16 routing and visual-only errors`, () => {
    const segments = JSON.parse(bytes).segments;
    for (const [i, segment] of segments.entries()) {
      const span = plan.languageSpans[i].spans[0];
      assert.equal(span.text, segment.text);
      assert.equal(span.end, segment.text.length);
      assert.equal(span.start, 0);
      assert.equal(span.language, segment.language);
      assert.equal(
        span.voice,
        segment.language === "vi-VN"
          ? "vi-VN-NamMinhNeural"
          : "en-US-AndrewNeural",
      );
    }
    for (const variant of plan.audition.variants) {
      const english = variant.requests.filter((r) => r.language === "en-US");
      assert.deepEqual(
        english.map((r) => r.text),
        ["I am hungry.", "I am tired."],
      );
      assert.ok(
        variant.requests.every(
          (r) => !r.text.includes("I hungry") && !r.text.includes("I tired"),
        ),
      );
    }
  });
  test(`${option.version} all SSML parses, routes exactly and uses only supported generic tags`, () => {
    const requests = plan.audition.variants.flatMap((v) => v.requests);
    const result = execFileSync(
      "python3",
      [
        "-c",
        `import sys,json,xml.etree.ElementTree as E
for r in json.load(sys.stdin):
 root=E.fromstring(r['ssml']);tags=[e.tag.split('}')[-1] for e in root.iter()]
 assert set(tags)<=set(['speak','voice','prosody','break'])
 assert ''.join(root.itertext())==r['text']
 voices=[e for e in root.iter() if e.tag.split('}')[-1]=='voice'];assert len(voices)==1 and voices[0].attrib['name']==r['voice']
print('VALID')`,
      ],
      { input: JSON.stringify(requests), encoding: "utf8" },
    );
    assert.equal(result.trim(), "VALID");
  });
  test(`${option.version} cost is summed in integer microUSD; no hidden production re-synthesis`, () => {
    assert.equal(plan.audition.requestCount, 12);
    assert.equal(
      plan.audition.estimatedMicrousd,
      plan.audition.billableCharacters * 15,
    );
    for (const variant of plan.audition.variants) {
      assert.equal(variant.requestCount, 6);
      assert.equal(
        variant.estimatedMicrousd,
        variant.requests.reduce(
          (n, r) => n + Math.ceil(r.billableCharacters * price.usdPerMillion),
          0,
        ),
      );
    }
    assert.equal(plan.paidExecutionAllowed, false);
    assert.equal(plan.publicationAllowed, false);
  });
  test(`${option.version} changed text/language/SSML/cost/hash/approval is rejected`, () => {
    for (const mutate of [
      (p) => (p.languageSpans[0].spans[0].language = "en-US"),
      (p) => (p.audition.variants[0].requests[0].ssml += " "),
      (p) => p.audition.billableCharacters++,
      (p) => (p.planSha256 = "0".repeat(64)),
      (p) => (p.approved = true),
    ]) {
      const p = structuredClone(plan);
      mutate(p);
      assert.throws(
        () => verifyReadiness(p, bytes, option.version, price),
        /MISMATCH/,
      );
    }
  });
}
test("original V1 files and historical reviewed runtime stay unchanged", async () => {
  assert.equal(
    sha(await readFile("briefs/english-video-06-candidate.json")),
    "79926b5736c3e2f1317205ff127e3b29547f35a2885bc7332675fec524b77d86",
  );
  assert.equal(
    index.previousReviewedRuntimeCodeSha,
    "3bf3c3a807e4f1a96f7dafdcd9e3ce7a4fae875c",
  );
  assert.notEqual(
    index.previousReviewedRuntimeCodeSha,
    index.p1DocumentationHead,
  );
  assert.equal(index.selectedCandidate, null);
  assert.equal(index.approvedPlanSha256, null);
});
test("frame-zero/reveal and practice timings are proposals, not word timestamps", async () => {
  const p = JSON.parse(await readFile(index.options[1].planPath, "utf8"));
  assert.equal(p.storyboard.frameZero.text, "I hungry ❌");
  assert.equal(p.storyboard.frameZero.revealText, "I am hungry ✓");
  assert.equal(p.storyboard.frameZero.plannedRevealFrame, 15);
  assert.equal(
    p.storyboard.timingBasis,
    "EDITORIAL_PROPOSAL_NOT_AUDIO_MEASURED",
  );
  assert.equal(p.storyboard.practiceHoldProposedMs, 1500);
});
test("cost snapshots and all preparation sources are bound; no spending capability", async () => {
  for (const x of index.preparationSourceDigests)
    assert.equal(sha(await readFile(x.path)), x.sha256);
  assert.equal(index.combinedBothCandidates.requests, 24);
  assert.equal(
    index.combinedBothCandidates.estimatedMicrousd,
    index.options.reduce((n, p) => n + p.estimatedMicrousd, 0),
  );
  assert.equal(index.decision, "NO_GO");
  assert.equal(index.paidExecutionAllowed, false);
  const code = await readFile(
    "scripts/auto-factory/pilot/readiness.mjs",
    "utf8",
  );
  assert.doesNotMatch(
    code,
    /process\.env|fetch\s*\(|node:http|workflow_dispatch|execFile/,
  );
});

test("invalid language, script approval and price cannot become readiness authority", async () => {
  const bytes = await readFile(index.options[1].scriptPath),
    s = JSON.parse(bytes);
  for (const mutate of [
    (x) => (x.segments[0].language = "fr-FR"),
    (x) => (x.approved = true),
    (x) => (x.segments[1].text = "wrong\ntext"),
  ]) {
    const p = structuredClone(s);
    mutate(p);
    assert.throws(() => readiness(Buffer.from(JSON.stringify(p)), "v2", price));
  }
  assert.throws(() => readiness(bytes, "v3", price));
  assert.throws(() => readiness(bytes, "v2", { ...price, usdPerMillion: -1 }));
});
test("owner package distinguishes runtime and documentation, authorizes neither option", async () => {
  const p = JSON.parse(
    await readFile(
      "docs/auto-factory/PAID_PILOT_APPROVAL_PACKAGE.json",
      "utf8",
    ),
  );
  assert.equal(p.reviewedRuntimeCodeSha, index.previousReviewedRuntimeCodeSha);
  assert.equal(p.p1DocumentationHead, index.p1DocumentationHead);
  assert.notEqual(p.reviewedRuntimeCodeSha, p.p1DocumentationHead);
  assert.equal(p.selectedCandidate, null);
  assert.equal(p.actualRequestAuthorization, null);
  assert.equal(p.paidExecutionAllowed, false);
  assert.equal(p.hostedDecision, "NO_GO");
  assert.equal(p.localDecision, "NO_GO");
  assert.deepEqual(p.candidateOptions, index.options);
  assert.deepEqual(p.preparationSourceDigests, index.preparationSourceDigests);
  assert.equal(p.combinedBothExceedProposedAzureCeiling, true);
});
