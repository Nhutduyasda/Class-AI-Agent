# Gate3B-P1.5 — script and paid-pilot preparation

**P1.5 PASS within zero-paid-request content/authorization preparation. P2 NO-GO for both hosted and local execution.** This does not upgrade P1's authentic-speech acceptance from PARTIAL. No synthesis, credential access, deployment, cloud/protection/ledger-ref creation, publication, schedule or merge. No provider or paid executor was enabled.

Verified baseline: PR10 Draft, head72274a9d1202b63f3064727213dd6aaab9c6d7a6, base feat/english-journey-marketing-video-05; no newer remote work at start. Historical reviewed offline runtime code is3bf3c3a807e4f1a96f7dafdcd9e3ce7a4fae875c. The baseline documentation HEAD is a different commit. Current P1.5 adds offline preparation code and documentation only; its immutable preparation commit is bound separately in the approval package after testing. The final documentation-binding HEAD is supplied by the PR/final handoff, not falsely stored as the historical runtime SHA. Neither a SHA nor a repository JSON flag is real owner authorization.

## Content result

V1 original candidate and original audition JSON remain byte-identical. V2 shows an illustrative I hungry ❌ at frame0 and proposes I am hungry ✓ at frame15. Incorrect English is visual-only. Both correct standalone English examples use Andrew; all Vietnamese narration uses NamMinh. The V2 spoken explanation avoids embedded English tokens to reduce unnatural language switching; the screen explicitly shows the I/am/hungry relationship. The claim is restricted to this exact sentence, not a universal rule for adjectives. Full scripts, costs, storyboard/reveal/caption plan and review checklist: VIDEO06_SCRIPT_OPTIONS.md.

20–35s remains an unmeasured target. Proposed frame15 and1.5s practice hold are editorial plans, not observed audio timing. There is no new V2 MP4 or authentic speech. The current P1 renderer is unchanged and is not claimed to implement V2's new reveal plan. A later renderer/voice bridge needs explicit implementation review and audio-derived timing before production. No script is approved or automatically selected.

## Integrity / plan result

Each candidate has exact file SHA256, recursive sorted-key canonical script SHA256, canonical ordered speech SHA256 and full-scene UTF16 language spans. Each request retains exact text, allowlisted voice, XML SSML, SSML SHA256 and conservative billable envelope. Each readiness plan has a canonical payload hash (excluding its own planSha256 field); the index separately binds the exact serialized plan-file SHA. V1/V2 plan hashes cannot be interchanged. A new generator creates both readiness JSONs and their index; tests regenerate and verify all metadata and reject changed routing, SSML, price, hash, text or approval.

SSML plans use only speak/voice/prosody/break. Existing neutral/dynamic rates/pauses and billing helper are reused; no emotional style, voice clone, real API or new provider. Both variants have the same spoken words; optional markup is conservatively included in character estimates. Valid XML is parsed independently with Python ElementTree. Generic feature syntax validation is not proof of exact voice/region synthesis support or subjective quality.

| Option | Requests | Conservative characters | Reference USD |
|---|---:|---:|---:|
| V1 neutral |6|535|0.008025|
| V1 dynamic |6|538|0.008070|
| V1 A+B |12|1073|0.016095|
| V2 neutral |6|495|0.007425|
| V2 dynamic |6|498|0.007470|
| V2 A+B |12|993|0.014895|
| Both candidates/all four auditions |24|2066|0.030990|

All values use the preserved USD15/million public reference; no account-price/tax/balance evidence obtained. Pricing expiry remains2026-10-22 00:00UTC, not silently extended. All four auditions exceed the proposed Azure USD0.03 ceiling even before tax. Proposed all-service ceiling USD0.08 is not permission or a provider-enforced billing cap. Select a candidate/direction scope and reprice before a new cost-bound approval. Actual new paid requests/cost:0 / USD0.

## Security and local feasibility

Fresh read-only GitHub collection audit: main and feature protected=false; rulesets empty. No administrative configuration or secrets accessed/changed. Environment availability is not re-certified. Current unprotected feature cannot receive Azure credentials as a trusted production branch.

PAID_PILOT_APPROVAL_PACKAGE.json now leaves selectedCandidate, approvedScriptSha256, approvedPlanSha256 and actualRequestAuthorization null, includes both candidate/hash/cost options, and distinguishes reviewed runtime SHA from P1 documentation/preparation code. Missing: real script approval, opening balance and unresolved historical charges, current account-specific pricing/tax, exact private destination/backup, trusted executor, durable production ledger and live request authority. No-retry reconciliation is specified, but its production integration is not demonstrated.

Windows local-first is feasible in principle for one approved pilot; current executable readiness is NO-GO. Existing hidden-prompt launcher does not establish the factory's durable journal/CAS/independent anchor/global ambiguity latch. Gate2 mocks/test refs must not be relabelled production. LOCAL_FIRST_PILOT_FEASIBILITY.md precisely lists needed clean immutable checkout/dependency verification, outside-repo approval, minimal credential process, production journal/readback/rollback control, independent backup, no-retry settlement and Windows fault tests. No run/enable command for a paid pilot is supplied or executed.

## Validation

Linux / Node24.19.0 / Python3; no new dependencies. New script/hash/routing/XML/estimate/tamper/authorization tests:15/15. P1 import/render plus bilingual regressions: 50/50 PASS. Gate1B/Gate2 controls: 88/88 PASS. Exact results/logs are in gate3bp15-evidence. Existing MP4 fixtures were read for regression only, no new render requested. Project TypeScript checked. Two historical missing production-media failures remain known limitations, not repaired with manufactured artifacts. No Windows paid-executor test or hosted-production acceptance is claimed.

Reproduce from projects/english-journey-video:

```sh
node scripts/auto-factory/pilot/readiness.mjs
node --test scripts/auto-factory/pilot/readiness.test.mjs
node --test scripts/auto-factory/pilot/pilot.test.ts scripts/auto-factory/pilot/render.test.ts scripts/bilingual/bilingual.test.mjs
node --test scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts scripts/auto-factory/control/control.test.ts
npm run typecheck
```

The readiness command only writes offline plans/index; it does not create an executable paid policy. The approval package's later commit binding is not regenerated by that command; content/source/plan hashes are, and tests verify consistency. Stop at P1.5.
