# Implementation gates and acceptance

Gate 0 stops at this four-file architecture PR. No factory runtime, schema implementation, credentials, cloud resources, paid calls or workflow activation. Gate completion below requires evidence, not only code or test names.

## Gate 1 — offline contracts and vertical slice

Order: implement strict versioned schemas/state reducer → fixture TopicPlanner/ScriptGenerator and validator → explicit voice router wrapping existing plan builder → in-memory CAS ledger simulator/CostGuard → generic render input adapter and fixture ReviewQueue. Use only fixtures and synthetic labelled audio. Preserve all old compositions and scripts. No network, keys, schedule or live provider transport. Candidate namespace `scripts/auto-factory/`, `src/auto-factory/`, `schemas/auto-factory/`; not files to create in Gate 0.

Acceptance: one offline CLI turns a fixture topic into a deterministic validated plan and review item, with fixture provenance clearly visible. A synthetic 1080×1920 H.264/AAC render proves the new generic path when browser dependencies are available; never label it real Azure production. Invalid or ambiguous language/copy stops before rendering or simulated charging. USD 8 aggregate / 0.08 video / one-date-slot invariants tested in integer units. All historical tracked file hashes unchanged.

## Gate 2 — durable authority and isolated provider boundary

Implement Git CAS journal adapter, reconciliation tool, readback and rollback checkpoint; separately review trusted workflow and branch/environment configuration proposal. Provider adapter remains fake by default. Verify current service prices, LLM choice or offline alternative, billing opening liabilities and environment/protection capabilities. Owner must explicitly authorize any future GitHub configuration changes, credentials provisioning and paid execution; this gate description is not that authorization.

Acceptance: destroy runners/restart twice without duplicate attempts or balance reset; two competing processes cannot both reserve a daily slot; corruption/rewind/storage outage blocks dispatch. Trust tests prove untrusted refs cannot reach environment or ledger-write credentials. Workflow remains dispatch-only and paid mode disabled; zero real API calls required to pass infrastructure tests. Document remaining owner setup rather than silently create resources.

## Gate 3 — one separately authorized production pilot

After explicit owner approval of script/hash, code SHA, service maxima and request count, use existing resource only. Implement generic renderer/browser discovery, locked Python/model/font assets, provenance import, technical QA/captions and durable owner-review handoff. Identify existing durable media storage and verify retention before paid work. Do not use historical Video 05 render command as the generic factory renderer.

Acceptance: at most one real video within USD 0.08 aggregate reservation and remaining production balance; every paid service call has prior durable authorization; no ambiguous automatic retry. MP4 full decode, 1080×1920 30fps H.264/AAC, canonical captions, verified audio lineage, loudness/sync checks, proof frames and owner listening/motion/English review recorded separately. Output pending owner review; no publication. Any ambiguity stops pilot rather than making another video.

## Gate 4 — operational readiness and scheduling decision

Exercise dry-run scheduling, pause/recovery, timezone/date dedupe, cost reconciliation and quota handling. Stage a trusted control-plane workflow proposal compatible with current default branch and stacked integration PR. Owner separately decides branch promotion/merges, environment approvals, auto-script policy and schedule activation. No activation inferred from passing tests.

Acceptance: simulated daily runs across timezone boundaries and delayed/duplicate triggers; no catch-up burst or second paid video from reruns; review queue survives artifact expiry; kill switch stops before next call; backups restore with checkpoint; maximum one scheduled video/day and all-service balance invariants hold. Production daily automation is NO-GO until trusted scheduling location and immutable executor are approved. Publication remains excluded permanently from these gates.

## Exact verification plan

Existing offline regression command (from project directory):
```sh
node --test scripts/bilingual/*.test.mjs scripts/marketing05/*.test.mjs scripts/marketing04/*.test.mjs scripts/review/*.test.mjs scripts/marketing03/*.test.mjs scripts/marketing02/*.test.mjs scripts/voiceover/*.test.mjs
python3 scripts/bilingual/audio_test.py
python3 scripts/marketing05/observed_test.py
```
Typecheck after reviewed dependencies are installed: `npm ci --ignore-scripts` then `npm run typecheck`. Installation/network failures are blockers/limitations, not passing checks. Do not run historical synthesis/build commands to test this documentation change. Gate 0 test results and limitations are recorded in PRODUCTION_RUNBOOK.md.

Required NEW cases for Gate 1–4 (test names/contracts to implement, not existing coverage claims):

| Gate | Inputs / fault injection | Expected assertion |
|---|---|---|
| 1 | Unknown fields/version, missing spans, stale UTF-16 offsets, decomposed Unicode, surrogate split, path traversal, duplicate IDs | Reject before provider call; exact canonical text survives. |
| 1 | Vietnamese sentence including “Nếu trả lời sai, mình có thể nhờ AI giải thích thêm bằng ví dụ đơn giản hơn”; explicit English quotation; names/acronyms | Entire Vietnamese sentence stays Nam Minh; only marked English uses Andrew; unresolved ambiguity blocks. |
| 1 | Estimate 80000 vs 80001 microUSD; cumulative 8000000 vs 8000001; reserve 2000000; LLM plus TTS | Equality allowed only within allocation; overshoot rejected; reserve never consumed. |
| 1 | Edited approved script/policy/plan; fixture audio passed as Azure | Invalidate approval; reject provenance mismatch. |
| 2 | Two writers same ref/date; rerun with new Actions run ID | Exactly one durable reservation/attempt, no duplicate video. |
| 2 | Crash before/after reservation, dispatch marker, HTTP send, response save, receipt commit | No automatic redispatch; uncertain outcome freezes paid pipeline; charge retained. |
| 2 | Missing/corrupt/rewound journal; unavailable remote; stale quote; conflicting opening balance | Zero outbound paid calls. |
| 2 | PR/fork/ref override, malicious SSML URL, log exception, package install hook | No secret access/endpoint change; canary absent from stdout/log/artifact using fake secrets only. |
| 3 | Long/truncated WAV, 200 response with corrupt body, hash/copy mismatch | Quarantine, no retry, no QA pass. |
| 3 | Offline tone render and separately authorized real pilot | Full decode, dimensions/codecs, no clipped speech, canonical subtitles; abs mux lag ≤40ms; loudness −16±1 LUFS, true peak ≤−1.5dBTP; safe-area proof frames inspected. |
| 4 | 23:59/00:00 Vietnam, delayed/missed/duplicate cron, cancellation, workflow rerun | Correct date slot, no catch-up batch; kill switch checked before every request. |
| 4 | Expired temporary artifact, rejected owner review, restored journal | Durable index resolves retained media; rejection never publishes or resynthesizes automatically. |

## Gate 1 handoff

Start from this PR's verified HEAD; re-fetch Video 05/main and verify no unexpected divergence. Read AGENTS.md and these four docs. Implement only Gate 1 with fixtures; run new contract/state/budget/routing tests plus existing regressions and typecheck. Report exact HEAD, diff, evidence and limitations. Do not read/create secrets, call paid APIs, set schedules, create resources, merge or implement Gate 2. Stop for owner review.

## Approved target-scope amendment — read before Gate 1

Read `MULTI_MODE_AND_VOICE.md`. Gate 1 must now accept explicit `ENGLISH_LEARNING` and `PRODUCT_SHOWCASE` tagged modes, mode-specific offline fixtures, product field/asset provenance validators, expressive voice direction *metadata* and voice-routing regression tests. No marketplace network calls, scraped product data, real TTS auditions or paid generation in Gate 1. An offline synthetic video may be rendered per mode if tooling is available. Preserve all earlier Gate 1 acceptance requirements.

Gates 2–4 retain durable authority, restricted pilot and English scheduler progression; any real voice audition requires new owner spending approval. Add Gate 5 for authorized marketplace/manual intake adapters and Gate 6 for separately approved real product-video pilot, legal/asset/claims review and independent launch decision. DO NOT describe Gate 5/6 as already implemented. Reference-video imitation is at the level of pacing, hook, subtitle styling and voice direction, never unlicensed voice cloning.

## Gate 1B targeted acceptance

See GATE_1B_REPORT.md and gate1b-evidence. Actual AutoFactory Remotion render, dynamic metadata, synthetic audio input and canonical scene captions are tested separately from the earlier FFmpeg fixture harness. Real presenter identity assets and authentic speech/emotion acceptance remain future work; technical production QA is not granted to fixtures. No Gate 2 implementation or production authorization follows automatically.

## Remote Dashboard option B — roadmap amendment, before Gate 3A

Owner selected a remotely accessible authenticated web dashboard as the daily operating UI instead of Work/AI Agent. Read `DASHBOARD_ROADMAP.md` for the normative cloud/web architecture, UI scope, honest mock-mode behavior, budgets, security and sequencing. Gate 2 remains the NEXT security/ledger implementation. Insert NEW Gate 3A for local working React dashboard + typed offline/mock API (no cloud deployment), rename the original real paid pilot to Gate 3B, then retain Gates 4–6 with cloud/auth and marketplace constraints. No new resource, paid hosting, secrets, production work or schedule authorization is conferred. Work/AI Agent remain development tools; actual remote use requires separately approved protected backend and deployment.
