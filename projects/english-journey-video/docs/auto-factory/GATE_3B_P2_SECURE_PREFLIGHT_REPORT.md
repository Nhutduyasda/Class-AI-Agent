# Gate 3B-P2 Secure Preflight

Decision: **PARTIAL. Real paid pilot: NO-GO.** Zero paid requests and USD 0 spent in this gate. Azure transport remains unconditionally disabled. Windows readiness is UNVERIFIED; all execution evidence was produced on Linux. No credentials were read, infrastructure deployed, schedules enabled, production refs created, historical media modified, or PR merged.

## Baseline and immutable identities

Started from PR #10 HEAD `abc68b337a0d6aff4bed6b663bdf39c7cf5bfd58`; preserved its history and draft/base. V1 remains unchanged. V2 is a recommendation, not owner approval.

- Prior offline runtime review: `3bf3c3a807e4f1a96f7dafdcd9e3ce7a4fae875c`.
- Prior P1.5 preparation: `a0ae1513d3f99b9787d9d6a4ca24b1d15a083924`.
- V2 exact script file SHA256: `04033938eb32dd5d2f72113863b89b87a8dac8fc4cbc3a694ba43c921abd5afc`.
- V2 canonical readiness plan: `8487406dca081a9ae91fe0bd9e1fe8602fe32f06e1b784edd3bc7b1a50a19b83`.
- Readiness file byte SHA256: `6836db73d76ba69f18c9bcac8ea725abef1f6eb3c0bd9e5b0553886c7cb045e8`.

The documentation commit is not an authorization. `P2_SECURE_PREFLIGHT.json` lists all 12 SSML hashes. The owner-reviewed executable remains null. Mock evidence code SHAs identify disposable clean fixture commits, not this repository's reviewed production executable. A later owner must approve the implementation commit and exact exported build manifest; any changed executable, dependency, script, plan or SSML invalidates that approval.

## Implementation

Reused Gate 2 policy, state machine, durable Git ledger and mock executor; only extended its Git launcher with an optional absolute executable path. Added a local mock boundary under `scripts/auto-factory/local/`, not a replacement video engine.

The boundary pins Node 24.19.0, FFmpeg 6.1.1 and Git 2.51.1 (Windows suffix allowed, exact binary SHA still required), verifies clean immutable checkout, ordered source/dependency hashes, binary hashes and matching currently loaded modules. Builds/tests are credential-free. External strict mock authorization binds code/build, script, readiness and every SSML hash, expiry, fixed production identity, one attempt per request and spending limits. Roots must be outside the entire repository and non-overlapping. There is no real credential input or real provider transport. This is not an OS sandbox: local administrator compromise is outside these checks.

The fixed module-owned mock transport records acknowledged durable reservation and DISPATCHING before dispatch. Existing CAS/hash-chain/checkpoint recovery validates restarts; ambiguous dispatched outcomes latch reconciliation and cannot retry. Cached verified requests send zero additional calls. The exclusive local lock fails closed after a crash; no automatic stale-lock deletion is provided. The opening liability survives recovery; production allocation USD 8, reserve USD 2 and aggregate per-video ceiling USD 0.08 remain enforced. Test authority stays `test-local-video06`, never production authority.

## Actual verification

| Evidence | Actual result |
| --- | --- |
| Local executor/recovery suite | 16/16 PASS, including four abrupt child-process deaths, two-process race, tamper, stale price, missing authorization, rollback, storage failure and ambiguity |
| Boundary/redaction/backup authority | 2/2 PASS, fake secret only; real command rejected without echoing secret |
| Credential-free setup and CLI | 1/1 PASS; initialization sends zero, repeated setup refuses existing journal |
| V2 render integration | 3/3 PASS, real Remotion H.264/AAC output and full FFmpeg decode |
| Gate 1B + Gate 2 regressions | 88/88 PASS |
| P1 + P1.5 + bilingual regressions | 65/65 PASS |
| Original Remotion/FFmpeg regressions | 9/9 PASS |
| Project and new local TypeScript | PASS |
| Windows 11 / ACL / independent storage | UNVERIFIED |
| Authentic speech / creative owner QA | BLOCKED / PENDING |

Final logs and sanitized journal/checkpoint are in `gate3bp2-evidence/`. Full mock test sends 12 requests; repeat sends 0. The small retained journal evidence sends 1 then resumes with 0, with SHA256-bound journal/checkpoint and preserved opening liability 12,345 microUSD. Both directories are on one Linux test filesystem: this demonstrates algorithmic checkpoint verification, **not independent durable production storage**. Exact recovery behavior and Windows commands are in `WINDOWS_LOCAL_EXECUTOR_HANDOFF.md`.

## V2 creative path

Separate V2 composition preserves the previous renderer. The real mock render is 1080×1920, 30fps, 709 frames, H.264/AAC; container duration 23.637s. PCM has 1,134,400 observed samples (23.6333s). Incorrect phrase is visible at frame zero, correction at frame 15, practice at frame 333, answer at frame 483 after 1.5s silence. Source-derived clip captions are shifted with the audio; no invented word timestamps. Original SVG cross/check symbols avoid missing font glyphs. Frame proofs were visually inspected.

MP4 SHA256: `c277045e4bdd708a8aaebe2a090d4cf32fa75610b31a388cb27e6db67ea5fea7`.

VI/EN routes validate against NamMinh/Andrew plans; test tones are explicitly synthetic 440/660Hz and cannot validate pronunciation or emotion. VOICE_ONLY uses no face or unlicensed asset. Technical fixture PASS is separate from production QA: authentic speech alignment remains BLOCKED, production technical QA NOT_EVALUATED, owner review pending and publication false. No historical Video 03–04 artifacts were manufactured; known missing historical-media acceptance blockers remain unchanged.

## Private retention and recovery handoff

Owner-selected private Windows media root stores authorized WAV, SSML, receipts, imports, immutable hashes, SRT/VTT, MP4, QA, owner reviews and ledger evidence. No private media is committed. Explicit immutable backup snapshots require a separately selected private destination. Restore checks an independently retained manifest SHA and every file before writing; symlinks/escapes and content collisions fail closed. ACL confidentiality, separate physical failure domain, backup retention and real restore on Windows must be demonstrated by the owner. Same-volume directories are insufficient proof.

A future credential broker must be separately implemented/reviewed: fixed exported executable only, no Git/npm/package scripts or upgrades, least-privilege Windows identity, DPAPI/Credential Manager or equivalently reviewed OS-backed storage, no plaintext/logged keys and explicit network allowlist. Current mock CLI must never be repurposed by injecting real credentials. Real transport remains absent/disabled.

## Remaining approvals and evidence

1. Explicit V2 script/hash approval and neutral-six/dynamic-six audition approval (12 total, one attempt each).
2. Owner review of exact executable commit plus immutable build/dependency/binary manifest and all per-request SSML/plan hashes, expiry and authorization outside Git.
3. Real Azure remaining balance, pending charges/opening liabilities, fresh account-specific pricing, tax and expiry. Reference estimate is not billing evidence.
4. Explicit private media/backup destinations, Windows ACL/runtime proof, independent journal/checkpoint integrity and hash-verified restore proof.
5. Reviewed production credential broker/transport, trusted executor identity and authorization authenticity controls. An unprotected feature branch is not trusted credential execution.
6. Recovery procedure: no paid retry after uncertain dispatch; isolate executor, preserve lock/journal/checkpoint, reconcile provider receipt/billing independently, record resolution, then obtain new authorization if another attempt is ever proposed.

Planning envelope only: 993 conservatively counted characters; reference Azure estimate USD 0.014895; proposed Azure ceiling USD 0.03 and total all-service ceiling USD 0.08, not approved. No new service is proposed. Tax/account pricing may invalidate the estimate; reject rather than enlarge authorization. Production-grade local ledger and independent checkpoint cannot yet be demonstrated. Hosted trusted executor/protected durable ledger also remain unverified. Therefore both local and hosted real execution remain **NO-GO**. Stop at secure preflight; no Gate 4.
