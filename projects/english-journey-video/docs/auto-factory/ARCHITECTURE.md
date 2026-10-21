# Auto Video Factory — Gate 0 architecture

Status: DESIGN ONLY, 2026-10-21. No production authorization, workflow, secret, resource or paid request is introduced. Gate 1 requires a separate instruction.

## Verified integration audit

Fetched repository and GitHub metadata for PRs 1–9. All nine are open drafts, not merged. Main is `62ea04bebbea42c6fb5ecededa6a25a48ac1f468`; its tree has no `projects/english-journey-video/`. Selected baseline is Video 05 `60b05cbe11a2abc986049dcbd294b8bf1a7d24a5`. All heads below are ancestors of this baseline; this is a linear inherited stack, not nine independent implementations to cherry-pick. No merge conflict resolution is needed for this documentation-only extension. Future base movement requires re-audit; it is not permission to rebase or overwrite.

| PR | Branch suffix after feat/english-journey- | Verified head | Base |
|---|---|---|---|
| 1 | video-agent-pilot | 52ac406dcf9e0e18411f839c7a035ba2cec5c0fa | main |
| 2 | video-v2-story-voice-music | 2eb17e1ce8a8dbc6dbf5c7e1858e006ab2c1e0cd | main |
| 3 | marketing-video-01 | 00b682e93a04e2cd54d6126337d7e3af0524953a | main |
| 4 | video-review-loop | 1a4205eb988644906d5db39525d0ddea13b2384b | marketing-video-01 |
| 5 | marketing-video-02 | a2de06ba058c11d09de7ee87703c56e9410d6e19 | video-review-loop |
| 6 | marketing-video-03 | 5fe0ed0eafed022ea02ea71e8771331df567b14c | marketing-video-02 |
| 7 | marketing-video-04 | d3a73afb9bfc5c395fb026e7aeaf01a3cd828396 | marketing-video-03 |
| 8 | bilingual-voice | 40de1db3fd7a30ee586afec9e01dbd0f9f0dd48e | marketing-video-04 |
| 9 | marketing-video-05 | 60b05cbe11a2abc986049dcbd294b8bf1a7d24a5 | bilingual-voice |

PR titles/bodies can describe earlier scope; inspected source, not those descriptions, is the implementation baseline. Preserve the stack and every historical brief, ledger, receipt and output. Integration PR base is `feat/english-journey-marketing-video-05`, never main without owner approval.

## Reuse and compatibility inventory

| Existing source | Decision / limitation |
|---|---|
| scripts/bilingual/core.mjs, plan.mjs | Reuse hash-bound plans, XML escaping, exact copy, voice allowlist and cost envelope. Heuristic lexicon is not a general language detector. |
| scripts/bilingual/runner.mjs | Reuse postOnce and authorization logic behind a new durable reservation boundary. Existing runPlan uses local ledger/session.lock and cannot itself enforce lifetime or daily limits across runners. |
| scripts/bilingual/wave.mjs, diagnostics.mjs | Reuse full decode, exclusive files, quarantine and allowlisted diagnostics. Receipts attest processing linkage, not cryptographic proof from Azure or human voice quality. |
| scripts/bilingual/Start-BilingualVoice.ps1; marketing05 launchers | Preserve manual Windows recovery. Hidden prompt and private-terminal check are unsuitable for unattended CI. New CI entry point is required. |
| src/BilingualVoiceClock.ts, VoiceCaptions.tsx; bilingual timing/audio/align | Reuse sample timing and canonical caption plumbing. ASR observations must never rewrite approved copy. |
| src/Marketing*.tsx; scripts/marketing*/build.py, render.mjs, qa*.py | Keep historical compositions. Extract a NEW input-driven composition rather than modifying old videos. Video 05 render.mjs hardcodes Windows Edge and output paths. |
| scripts/review/* and production tests | Reuse technical evidence; motion/listening remains human review. |
| scripts/voiceover/providers.py | Legacy Edge provider with retry; exclude from factory dependency graph. No fallback to Edge/Piper or historical paid launchers. |
| docs/reviews/marketing05/{ledger.json,recovery-01,recovery-02,final} | Historical evidence only. Eight submitted requests reported across three ledgers; reference USD 0.024285 is not invoiced spending. Media excluded from Git; this audit does not verify historical MP4 bytes or subjective listening. |
| briefs/marketing-video-01..05-approved.json | Immutable examples, not authorization for new production. Marketing template uses hook/problem/solution/demo/benefit/cta. |

Pinned npm inventory: all Remotion packages 4.0.535, React/ReactDOM 19.2.0, Zod 4.5.4, TypeScript 5.9.3 and React type packages 19.2.2. Keep package-lock.json; do not upgrade in Gate 0. Runtime dependencies include Node, Python, FFmpeg/ffprobe, browser, numpy/scipy and optional faster-whisper/model assets. Existing Python requirements are split among marketing02 and marketing03; Gate 1 must inventory installed imports and Gate 3 must lock a reproducible factory environment. No evidence of conflicting Remotion versions in package.json; full install/security audit and hosted OS compatibility are not certified. No existing .github workflow was found at this baseline. Fonts, music and models need asset hashes and commercial-use license records; no SeeCut assets.

## Pipeline and authority boundaries

DailyScheduler → TopicPlanner → ScriptGenerator → ScriptValidator → LanguageAndVoiceRouter → CostGuard/ProductionLedger → AzureSpeechProvider → AudioProvenanceVerifier → VideoRenderer → QualityAssurance → ReviewQueue. Each paid LLM generation also passes CostGuard/ProductionLedger BEFORE the call. Captions derive from canonical script plus observed timing. No publication component or publishing credential exists.

Offline mode has no credentials or network transports and uses explicitly labelled fixtures. Paid production consumes an independently approved policy for immutable trusted code and bounded plans. Owner publication approval is separate and cannot be inferred from script approval, technical PASS or queue status.

## Stable JSON v1 contracts (normative design, not implemented schemas)

Every record is UTF-8 JSON with schemaVersion=1, UTC createdAt, runId and SHA-256 references. Reject unknown fields, unsupported versions, NaN, path escapes, oversized strings/arrays and unresolved required fields. Monetary values are integer USD microdollars (1 USD = 1000000); round each reservation upward. Hash raw immutable UTF-8 bytes; do not hash a reserialized object unless its serialization convention is explicitly specified. IDs are safe bounded ASCII. Artifacts use relative logical paths plus bytes and sha256, never URLs to arbitrary content.

Common run envelope example:
```json
{"schemaVersion":1,"runId":"ej-20261022-001","createdAt":"2026-10-22T00:00:00Z","localDate":"2026-10-22","timezone":"Asia/Ho_Chi_Minh","mode":"offline","codeSha":"<40-hex>","policySha256":"<64-hex>","state":"PLANNED"}
```

| Component | Input → output contract | Dependencies / failure |
|---|---|---|
| DailyScheduler | Schedule{timezone,localDate,maxDaily:1,enabled:false} → RunEnvelope | Durable unique localDate slot; duplicate/manual rerun reuses runId; no catch-up burst. |
| TopicPlanner | TopicRequest{kind,level,historyRevision} → Topic{topicId,kind,level,objective,fingerprint,sourceRefs[]} | Durable history dedupe; no scraping; conflict stops. |
| ScriptGenerator | Topic + Template + generation policy → ScriptDraft{topicId,templateVersion,scenes[],claims[],captionDraft} | Offline fixtures first; paid LLM only through same ledger, bounded input/output tokens, one attempt. Model/provider remains unselected. |
| ScriptValidator | ScriptDraft → Validation{scriptSha256,errors[],warnings[],requiresReview} | Strict schema, grammar examples, truthful illustrative labels, no unsupported learning claims; deterministic tests cannot certify all teaching accuracy. |
| LanguageAndVoiceRouter | Script{scenes:[{id,spoken,spans:[{start,end,text,language}]}]} → existing BILINGUAL_V1 plan + routing report | Offsets follow existing UTF-16 convention, NFC text, sorted exact coverage, no split surrogate; Vietnamese Nam Minh, explicit English examples Andrew. Reject ambiguity; Vietnamese surrounding prose stays Vietnamese. |
| AzureSpeechProvider | Approved plan + durable attempt authorization → SpeechResponse{requestId,responseArtifact,diagnosticCode} | Exact endpoint/voices, no redirects, no retry; paid provider never exposed to free-form executable prompts. |
| AudioProvenanceVerifier | SpeechResponse + plan → AudioManifest{planSha256,files:[{scene,sha256,bytes,durationSamples,sampleRate,receiptSha256}],provenanceKind} | Existing WAV decode/hash; fixture provenance cannot pass production. |
| VideoRenderer | RenderInput{scriptSha256,audioManifestSha256,timelineSha256,assetManifestSha256,width:1080,height:1920,fps:30} → VideoArtifact | New generic Remotion composition and FFmpeg; credentials absent. |
| QualityAssurance | VideoArtifact + canonical script/timing → QAReport{technicalChecks[],humanReview:"PENDING",passed:boolean,captionArtifact} | Decode, dimensions, codecs, clipping/sync, text safe areas and proof frames. Fail keeps output quarantined. |
| CostGuard | CostPlan{requests:[{id,provider,estimateMicrousd,maxMicrousd,priceEvidenceSha256}],totalMaxMicrousd} + Policy → Reservation | Atomic aggregate and per-video checks; stale pricing, unknown balance or missing journal fails closed. |
| ProductionLedger | Expected revision + Event{eventId,runId,requestId,type,amountMicrousd,previousHash,payloadSha256} → durable acknowledgement{revision,commitSha,eventHash} | CAS and readback before transport; details in SECURITY_AND_BUDGET. |
| ReviewQueue | QA PASS + artifacts → ReviewItem{runId,scriptSha256,videoSha256,qaSha256,status:"PENDING_OWNER",captionSha256} | Durable index and retained artifacts; human accept/reject records immutable decision, never publishes. |

Templates v1: marketing six-stage structure with one CTA; learning micro-lesson with hook/example/explanation/practice/answer/CTA. Each scene has id, exact spoken text, explicit language spans and visual intent. Generated scripts start unapproved; an approved hash or separately approved bounded auto-script policy is required before paid voice. Initial pilot requires individual owner script approval; broader daily auto-script authority is a future explicit decision.

## State machine

PLANNED → TOPIC_SELECTED → SCRIPT_DRAFT → SCRIPT_VALIDATED → SCRIPT_APPROVED → COST_RESERVED → AUDIO_PENDING → AUDIO_VERIFIED → RENDERED → QA_PASSED → PENDING_OWNER_REVIEW → OWNER_ACCEPTED or OWNER_REJECTED. Terminal alternatives: BLOCKED, FAILED_TECHNICAL, AMBIGUOUS_PAID. Each transition carries expected revision and input hashes; only technical steps without paid side effects can resume idempotently. No transition to PUBLISHED exists. Any paid request reserved/submitting without a verified outcome becomes AMBIGUOUS_PAID and blocks further paid work pending owner reconciliation. Script edits invalidate plan, approval, downstream artifacts and cost authorization; they never erase spending.
