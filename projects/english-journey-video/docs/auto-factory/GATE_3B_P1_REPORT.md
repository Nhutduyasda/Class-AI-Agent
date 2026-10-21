# Gate 3B-P1 — production pilot readiness

**PARTIAL. P2 paid execution NO-GO.** Implementation/offline preparation completed on Gate 3A baseline `24c02b9ebdb3244de3da931127d3255714309772`; existing Draft PR #10 and Video05 base preserved. No paid request, credential access, hosted deployment, schedule, cloud configuration or historical video edit. The owner has not approved Video06 or any synthesis.

## Audit / minimal additions

Read Gate 1B/2/3A reports, Gate 3 prerequisites, dashboard roadmap, security/budget, multi-mode/voice and web readiness. Reviewed real renderer/playback, bilingual plan/timing, Gate2 model/Git ledger/executor and dashboard API. Existing renderer is fixture-labelled; existing real audio path requires a historical Azure ledger and observed alignment records. Gate2 deliberately restricts execution to local test Git/mock adapters. Dashboard stores demo state in memory. These limitations cannot be solved by a new client button.

Additive changes: candidate script; reproducible A/B SSML/cost preparation reusing the existing XML/billing helpers and exact voices; provider-independent reviewed-manifest WAV importer with full decode, content-addressed immutable reuse, sample clock and canonical segment captions; a separate real Remotion pilot composition/runner; historical source decoder audit; pilot state contract plus visible blocked candidate in dashboard; tests and three pilot documents. Historical Video01–05, existing compositions and production controls remain unchanged.

## Media / rendering evidence

Library search found the owner-uploaded Video03-2026-10-16T04-08-41.749Z-82c45fd7.zip. It was materialized outside the repository and unpacked as data only. All six original WAVs matched manifest/receipt/ledger SHA-256, canonical text digest, Azure NamMinh provenance and historical authorization reference, and decoded completely through the new verifiedWave function. Historical synthesis authorization was not reused; source WAVs were not copied into historical output directories or rerendered. See gate3bp1-evidence/historical-audio.json. This proves authorized existing Vietnamese WAV decoding, not a new bilingual speech render.

The new full import/mix/render path was exercised with explicitly synthetic 440 Hz clips: 1,072,000 PCM samples at 48 kHz, 670 frames, 22.333s planned / 22.336s MP4 container, 1080×1920, 30fps, H.264/AAC. Actual Remotion rendered; full MP4 decode and byte hash checked. Hook/middle/final frames extracted from the MP4; inspected hook and practice frames show legible Vietnamese, frame-zero hook, answer choices and no face. Sample-window checks across every tone/silence boundary verify mux timing at the tested 50ms-offset windows; mono downmix measured ~0.707 source amplitude (-3dB), consistent at all six clips. This is synthetic mux evidence only, not speech alignment or pronunciation acceptance.

Renderer QA takes format/decode fields from the existing verifier without inheriting its silent-fixture/presenter labels. New QA always keeps technicalProduction NOT_EVALUATED and publicationAllowed false. WAV importer accepts only valid complete 48 kHz mono PCM16 RIFF, validates all chunk boundaries/lengths/hash, rejects path escapes and wrong text/language/voice, and preserves every source sample. Captions are whole-clip sentence cues, not fabricated word timestamps. Reviewed provenance hash must originate from an independent owner/receipt review; a caller's self-asserted manifest is not real security. No hosted upload authority is provided.

## Verification

Linux x64, Node 24.19.0, Git 2.51.1, FFmpeg 6.1.1, Remotion 4.0.535, installed Chrome Headless Shell 157.0.8080.0. Windows11 commands are documented but actual Windows execution remains UNVERIFIED.

| Checks | Result |
|---|---|
| New importer/plan/state/security plus actual new render tests | 15/15 |
| Historical authorized WAV decoder checks | 6/6 files |
| Gate1B engine/hardening + Gate2 controls | 88/88 (52+36) |
| Existing actual Remotion / FFmpeg fixtures | 9/9 (4+5) |
| Prior offline Node regressions | 93/93 |
| Python DSP / phrase | 6/6 and 4/4 |
| Dashboard API tests | 6/6 |
| Project + pilot TypeScript, dashboard build | PASS |
| Chromium desktop/mobile navigation, drafts, fixture review | PASS; additional pilot blocked-state check included |

Historical production-only discovery still has the same two missing-media failures (Video03 timeline; Video04 ledger/media). The recovered WAV bundle is only used outside historical directories and does not conceal those failures. Logs are retained in gate3bp1-evidence. Browser screenshots are in dashboard/evidence, including desktop-pilot-state.png. Browser requests stay loopback/data; no provider or workflow request. Static preparation module guard rejects credential/environment/network/dispatch imports, supplemented by inspection of imported shared billing helper. This is an offline boundary check, not proof of a secure future hosted executor.

## Remaining acceptance blockers

- Video06 script/hash and code/SSML plan need real owner approval. Candidate content is proposal only; no invented final duration from speech.
- No authentic Video06 WAV/Andrew sample; actual bilingual alignment, pronunciation, loudness, clipping, cadence, creative motion and owner listening review remain BLOCKED/UNVERIFIED. Existing Vietnamese WAV checks do not satisfy them.
- Pilot composition is a typography-based technical path; pacing/readability across real speech and subjective creative quality are not accepted. Current whole-sentence captions may need observed phrase alignment before final production; no word-level claim.
- Dashboard production ingestion/auth/persistence remains a future adapter. Current demo only displays a prepared job and validates typed future states; fixture MP4 review remains functional. No claim that a real production job is integrated or remotely operable.
- Current read-only GitHub audit: main/feature protected=false, public rulesets empty. Environments endpoint could not be re-read via connector allowlist; previous absence remains historical evidence only. No configuration changed. Hosted durable journal/checkpoint authority and trusted immutable executor are unverified.
- Real balance/liabilities/account pricing/tax, private retention/backup and commercial execution licensing must be verified. USD0.016095 is a public-reference audition estimate; proposed Azure USD0.03 and aggregate USD0.08 caps are not billing guarantees.
- minh-main identity retained with VOICE_ONLY; authentic face/body media absent and unnecessary for this pilot. Asset handoff is in FIRST_PRODUCTION_PILOT.md.

Stop at P1. No P2/Gate4 activation, paid calls, deployment or merge.

## Reproduction

From projects/english-journey-video:

```sh
node scripts/auto-factory/pilot/prepare.mjs
node --test scripts/auto-factory/pilot/pilot.test.ts
# Tests create only synthetic out/auto-factory-pilot content.
node scripts/auto-factory/pilot/render.ts out/auto-factory-pilot/e47a6945a22872b3d94e89aa1334c24cab1040b96a8dd25d3d9b2e48f6090cc8 44acd713c2d72faa811da00bc5676e768eb453e2ca157079268ddba7bf3d09da
node --test scripts/auto-factory/pilot/render.test.ts
npm run typecheck
# dashboard/: npm run build; npm test; npm run test:browser
```

The render lock refuses concurrent writers. Following a hard process kill, inspect that no renderer remains before removing a stale render.lock; never clear an active lock. Regeneration hashes are byte-bound to the current candidate and deterministic PCM fixture, not a promise of bit-identical MP4 across browser/encoder versions. Render tests hash the actual output against its own retained QA and verify content/format/sample windows.
