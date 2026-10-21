# First production pilot — owner approval package, NOT authorization

Status: P1 preparation only; P2 paid execution NO-GO. Code implementation is on the existing Draft PR #10. Bind approval to the exact final HEAD reported in PR metadata/final handoff; do not approve a moving branch. `git rev-parse HEAD` supplies the reviewed code SHA on Windows/Linux. No script/code approval is inferred from this document or a mock review button.

## Proposed micro-lesson

Video06 candidate v1, A1, target 20–35 seconds, VOICE_ONLY, presenter identity minh-main. Exact script/hash and six explicit language spans are in briefs/english-video-06-candidate.json. The hash is `79926b5736c3e2f1317205ff127e3b29547f35a2885bc7332675fec524b77d86` (whole UTF-8 file bytes). Approved script SHA: **NONE — PENDING OWNER**.

| Beat | Exact spoken text / voice | Visual / duration basis |
|---|---|---|
| Hook | Muốn nói mình đói? Đừng dịch từng chữ từ tiếng Việt. / Nam Minh | “Nói mình đói thế nào?” visible at frame 0; original text design |
| Example | I am hungry. / Andrew | Full English sentence |
| Explain | Câu này nghĩa là: Tôi đói. Khi nói mình đang đói, nhớ có động từ trước tính từ. / Nam Minh | I + am + hungry |
| Practice | Thử nhé: muốn nói tôi mệt, bạn chọn câu nào? / Nam Minh | A. I tired. / B. I am tired. |
| Answer | I am tired. / Andrew | Reveal correct example |
| Close | Đáp án B. Giờ thử nói lại cả câu nhé. / Nam Minh | Repeat correct sentence; no second CTA |

This is an illustrative lesson, not a claim about an actual learner error. Known prior scripts concern articles, past-tense correction and AI learning workflows; no matching hungry/tired lesson was found in the available briefs. Full published-channel history is not available, so deduplication is limited. Speech length is not yet measured. Reject an import outside 20–35 seconds; do not accelerate/cut speech to force the target. Practice pause quality needs owner listening; the current 200 ms inter-segment import gap is a technical default, not an accepted teaching rhythm. No storyboard seconds are presented as measured speech timing.

## Proposed cost / prerequisites

- Reviewed code SHA: exact final HEAD from PR #10 / `git rev-parse HEAD`; owner approval must retain that immutable value.
- Script approved SHA: absent. Candidate SHA above; any edit changes the required approval.
- Audition plan: video06-auditions.json; all 12 request hashes and exact voices/text included. 1,073 conservative billable characters, USD 0.016095 reference A+B estimate. No additional production TTS if the selected WAVs pass and can be reused.
- Proposed Azure maximum authorization: USD 0.03 before approval; proposed total all-service application ceiling USD 0.08 including tax/other liability allowance. These are proposed refusal thresholds, not guaranteed provider billing caps. If current account/tax pricing cannot fit them, NO-GO and reprice before permission.
- LLM/image/avatar/cloud services proposed: none, USD 0 new service requests. Render locally using existing software. Commercial software/license applicability must still be checked for the actual executor/team. No hosting purchase is proposed.
- Real remaining balance, pending charges, currency/tax and account billing evidence: required; currently UNVERIFIED. Owner-declared USD 10, production USD 8, protected reserve USD 2 remain policy only.
- Pricing evidence/expiry: VOICE_AUDITION_PLAN.md and video06-price-reference.json. Refresh before execution; never use a stale quote.
- Retention proposal: owner-controlled private Windows directory plus an owner-selected durable private backup for source WAV/receipts/manifest/MP4/subtitles/QA. **Destination and backup are not verified.** Public Git repository/Actions artifacts are not approved private retention.
- Trusted executor: immutable reviewed code/workflow/policy hashes, protected branch/ref restrictions, real owner approval origin, secretless install/render jobs, minimal isolated credential step, verified trusted clock and least privilege. Current feature branch protected=false; main protected=false; rulesets collection empty. Environments endpoint is unavailable through the present connector allowlist; historical absence is not re-certified.
- Production ledger: Gate 2 local bare-Git test transport only. Hosted protected journal, independent checkpoint retention and rollback recovery still unconfigured/unverified. Do not enable hosted URLs with a flag.
- Ambiguity: durable acknowledged DISPATCHING before network; timeout/missing receipt/crash globally blocks subsequent calls. No retry/failover/split fallback. Reconcile immutable ledger with billing evidence, retain reservations, never erase liabilities. Rollback disables execution; it does not refund or un-send requests.

## Offline / later approved media handoff

Prerequisites: Node 24.19+ (native TypeScript), npm locked dependencies, ffmpeg/ffprobe in PATH, installed Remotion browser. From projects/english-journey-video:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node scripts/auto-factory/pilot/prepare.mjs
node --test scripts/auto-factory/pilot/pilot.test.ts
npm run typecheck
```

The preparation command never synthesizes. Later an owner-reviewed plan adapter/executor must be implemented and independently approved; P1 does not connect this audition JSON to a paid runner. After previously authorized WAVs exist, create a Manifest matching media.ts: schemaVersion 1, scriptSha256, kind AUTHORIZED_SPEECH, sourceReference, rightsBasis, authorizationReference and ordered segments with id/language/voice/exact text/file/SHA-256. Attach genuine request receipts/ledger and independently check them. Have the owner/reviewer retain SHA-256 of JSON.stringify(parsed manifest); a digest copied from an untrusted manifest is not provenance verification.

```powershell
node scripts/auto-factory/pilot/import.ts briefs/english-video-06-candidate.json C:/Private/Pilot/manifest.json C:/Private/Pilot <reviewed-manifest-sha256> C:/Private/Pilot/cache
# Review import.json; hash its exact bytes, then use the returned content-addressed directory:
node scripts/auto-factory/pilot/render.ts C:/Private/Pilot/cache/<audio-sha256> <reviewed-import-json-byte-sha256>
```

Import never modifies source WAVs. It accepts RIFF PCM 48 kHz mono 16-bit only; unsupported formats require a separately reviewed lossless conversion, not silent resampling. Exact sample counts preserve complete clips; explicit gaps are added without trimming/stretching. Captions cover complete imported sentence clips, including any provider silence, not inferred word onsets. Word timestamps remain unavailable. Current labels/QA never certify a new production as publishable.

Render output: 1080×1920, 30fps, H.264/AAC; full decode and hook/middle/end frames. Before production QA, inspect caption safe areas throughout, measure actual speech loudness/true peak, compare decoded AAC timing to the source waveform at every sentence boundary, and listen for clipped syllables. Those checks are not replaced by synthetic-tone evidence. Current P1 adds the controlled path and handoff; authentic Video06 timing/listening/creative acceptance remains BLOCKED.

## Minh / dashboard

VOICE_ONLY needs no face media. Later FACE_ONLY/HALF_BODY/FULL_BODY requires an owner-approved identity reference package: original high-resolution front/three-quarter/profile views, desired wardrobe/expression/gestures, transparent stills or licensed footage as applicable, each asset's hash/MIME/dimensions/source/rights/usage/expiry/review record. Face/lip-sync service permission, identity consent, licensing and pricing are separate. No unrelated face is substituted.

Dashboard shows the candidate version/hash, production job ID, voices and blocked media/render/QA/owner state. PilotState defines future imported/rendered states. Real production ingestion/auth/persistence and authenticated owner review are still future adapters; no unauthenticated upload/dispatch endpoint is added. Existing fixture preview/hash/revision review stays mock-only. This is compatibility preparation, not a claim of an end-to-end hosted production dashboard.

Reviewed implementation commit: `3bf3c3a807e4f1a96f7dafdcd9e3ce7a4fae875c`. The following handoff commit only binds this immutable code identity in documentation; it does not change runtime code or grant approval.
