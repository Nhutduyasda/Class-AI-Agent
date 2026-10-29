# Gate 2 — durable control implementation

Source baseline independently fetched and verified: f4e20463ba83f27e40520321feb146673e88f081. Existing feat/english-journey-auto-video-factory and Draft PR #10 are preserved, based on the Video 05 branch. Only new control/schema/test/docs namespaces and small gate/runbook additions change; no existing video engine, historical Video 01–05 source/media/ledgers/receipts, presenter identity, dependency pins or workflows change.

Integration update: remote advanced during this task to `b6940c69de5bcb4aeeb1c904b6f8a35b10b556f4` (dashboard roadmap only). That commit is preserved as the new parent; both appended documentation sections are retained. Runtime/control/test/schema files are identical to the fully tested Gate 2 implementation. The new sequence is Gate 3A local dashboard, then Gate 3B real pilot, each by separate instruction. No dashboard code or deployment is introduced here.

## Implemented

- model.ts: strict versioned policy/plan/authorization/event/journal contracts, stable attempt identity, canonical SHA-256 chain, deterministic lifecycle replay, scoped mode/daily-slot controls and integer micro-USD projection.
- git-ledger.ts: actual local Git fetch/object/commit/non-force push adapter, expected revision, parent-based CAS, exact event/commit readback, independently retained high-water checkpoints with locking and rollback/prefix detection. Transport is restricted to local bare repos and refs/heads/test-*; no hosted production ledger ref exists.
- executor.ts: bound plan preparation, sequential acknowledged reservation/dispatch, module-owned frozen mock adapters, disabled real provider, exact cached receipts, no uncertain retry, conservative crash reconciliation and allowlisted diagnostics.
- Isolated bare Git tests use real independent writer repositories and two OS processes. They are actual Git transaction tests, not an in-memory mock of CAS. Mock provider calls remain fake and cannot access credentials.
- Six exported JSON schemas supplement runtime cross-field/replay checks; JSON Schema alone cannot validate a whole event history or trusted Git ancestry.

## Accounting and lifecycle

The immutable policy holds USD 10 total, USD 8 production and USD 2 protected reserve. Planned maxima across LLM/speech/all requests must fit USD 0.08 per video. Reservation projection subtracts opening liabilities, confirmed costs and outstanding reservations; unknown charges are a labelled subset of outstanding exposure, not subtracted twice. DISPATCHING increments submitted requests and seals the attempt before any mock call. Confirmed mock charges replace reservations, never erase the original events. If a confirmed amount exceeds its quote, the entire liability is recorded; further per-video/aggregate spending is blocked. No application-side guard is described as a provider-enforced cap.

One SCHEDULED English Learning date slot is claimed with reservation using Asia/Ho_Chi_Minh; reservation/dispatch must match the actual local day, preventing backdated catch-up bursts. Manual Product Showcase requires ON_DEMAND and a separately hash-bound approval. The same workflow rerun ID cannot create a different attempt. Ambiguous attempts globally block later paid simulations. Successful verified results are reused without another provider call. Real opening liabilities, balance, price and provider billing remain UNVERIFIED; all verified fixtures are explicitly MOCK-only.

## Security and hosted configuration

No real HTTP provider, credential loader or secret/config mutation was implemented. Unknown fields, arbitrary executable refs/endpoints, raw product metadata and untrusted adapters are rejected at the boundary. Fake canary transport failures are sanitized and absent from returned errors/journals/receipt artifacts. Product evidence handling and rendering stay outside the control module.

Read-only GitHub audit found main and feature protected=false, zero environments, no public rulesets, and authenticated detailed protection GET unavailable without credentials (401). No admin configuration was changed. See SECURE_EXECUTION.md for exact limitations and future staged Actions design. Local Git PASS is not evidence of hosted branch protection or real billing readiness.

## Verification

Platform: Linux x64, Node v24.19.0, Git 2.51.1. No dependency upgrade. Windows execution remains UNVERIFIED.

| Verification | Result |
|---|---|
| New Gate 2 control/Git/security tests | 36/36 PASS |
| Prior Gate 1B contract/hardening tests | 52/52 PASS |
| Actual retained Remotion output regressions | 4/4 PASS |
| Prior FFmpeg fixture regressions | 5/5 PASS |
| Prior offline Node regressions | 93/93 PASS |
| Python DSP / phrase tests | 6/6 and 4/4 PASS |
| Project and control CLI/test TypeScript | PASS |
| Full historical Node discovery | 95 PASS, 2 known missing-media failures |

The historical failures are Video 03 missing out/marketing03/timeline.json and Video 04 missing out/marketing04/ledger.json / original WAV evidence. No replacement production media was manufactured. The current Remotion/FFmpeg fixtures are reused unchanged; this Gate does not rerender or synthesize narration.

Executed from projects/english-journey-video:
```sh
node scripts/auto-factory/control/schemas.ts
node --test scripts/auto-factory/control/control.test.ts
node scripts/auto-factory/control/demo.ts
node --test scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts
node --test scripts/auto-factory/remotion.test.ts
node --test scripts/auto-factory/render.test.ts
node --test scripts/bilingual/*.test.mjs scripts/marketing05/*.test.mjs scripts/review/*.test.mjs scripts/marketing03/auth.test.mjs scripts/marketing03/direct-audio.test.mjs scripts/marketing02/*.test.mjs scripts/voiceover/*.test.mjs
python3 scripts/bilingual/audio_test.py
python3 scripts/marketing05/observed_test.py
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --esModuleInterop --skipLibCheck scripts/auto-factory/control/*.ts
```

Full historical discovery additionally includes scripts/marketing03/production.test.mjs and scripts/marketing04/*.test.mjs. Logs, GitHub configuration observations, environment versions and a real local-Git mock journal/checkpoint/commit-ancestry example are in gate2-evidence. The demo reaches revision 9 with two mock receipts, 200 confirmed mock microUSD, zero outstanding exposure and 7999800 remaining simulated production microUSD. This is not a real balance or invoice.

The final test suite includes two OS processes racing the same expected revision (exactly one accepted reservation), independent new writer/restart, all five crash boundaries, timeout/missing receipt, changed workflow run ID, lost acknowledgement after accepted commit, direct remote corruption/rewind, valid rehashed prefix replacement, missing checkpoint/storage, exact budget boundaries, mock overrun accounting, expired pricing, unknown balance, mode-specific authorization, disabled real provider, untrusted adapter/function/getter rejection and a canary that remains absent from diagnostics/journal artifacts. Scheduled reservation/dispatch must match the actual local day, preventing catch-up bursts. Git dispatch markers count possibly-submitted requests conservatively; they do not prove actual provider/network submission.

## Decision

**Gate 2 implementation: PASS.** The requested local durable adapter and fail-closed mock boundary are implemented and tested. No unresolved critical correctness/security defect was demonstrated in this offline scope.

**Hosted production: HOSTED_PRODUCTION_NO_GO.** Real protection, protected approval authority, durable external anchor retention, credentials, provider execution, actual opening liabilities/billing and hosted trust controls remain unverified/unconfigured. The adapter intentionally rejects hosted URLs and production refs; enabling them is a separate reviewed change, not a flag to turn on after these tests. Application-side policies are not provider-enforced spending limits.

Future decisions and evidence are listed in GATE_3_PREREQUISITES.md. Stop after Gate 2; no Gate 3 work, schedule, production ledger ref, paid API, marketplace fetch, publication or main merge is authorized or performed.
