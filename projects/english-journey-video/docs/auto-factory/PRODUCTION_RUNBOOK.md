# Production runbook — design only

## Gate 0 status

Integration branch: `feat/english-journey-auto-video-factory`; source Video 05 `60b05cbe11a2abc986049dcbd294b8bf1a7d24a5`; PR base `feat/english-journey-marketing-video-05`. Only four docs in this directory change. No output, historical ledger, workflow or dependency changes. Final PR URL and commit are reported in the delivery response to avoid a self-referencing commit hash.

Verified: source tree and PR 1–9 metadata, ancestor chain, current pinned package manifest and selected adapters/renderers/tests. Not verified: current Azure balance/invoices/voice catalogue, GitHub environment/protection configuration, production media availability, complete dependency vulnerability status, human voice quality, production renderer on hosted runners. Those checks must not be implied by Gate 0.

## Future daily operation

1. Trusted scheduler validates enabled policy and timezone; atomically claims one daily slot. Missing/late trigger may skip a day; never promise exact trigger time or automatic catch-up.
2. Select a nonduplicate topic; generate offline or under separate capped LLM reservation. Validate exact script and explicit language spans. Initial pilot waits for owner script approval.
3. Verify approved code/policy hashes, opening balance, durable journal, current price evidence, available voices, storage, decoder and request count. Any mismatch blocks.
4. Reserve each paid maximum durably, persist dispatch once and send once. Reconcile response with hash-bound plan, full WAV decode and canonical timing. Do not retry ambiguous synthesis/generation.
5. Credential-free renderer produces a new run-scoped MP4 and captions; technical QA checks actual file bytes. Write evidence, artifact hashes and pending owner-review index. No completed historical output is overwritten.
6. Owner watches/listens to complete video and checks English correctness, pronunciation, natural routing, claims and captions. Record accepted/rejected against exact video SHA. Acceptance does not post anywhere.

## Recovery and rollback

Disable production policy/workflow first and verify no new dispatch; in-flight requests may still bill. Preserve journal, quarantined response, hashes and logs with allowlisted diagnostics. Never delete a lock or reset attempts to “fix” a stuck paid request. Fetch durable history and compare owner checkpoint. Missing/ambiguous evidence freezes further paid work pending reconciliation; no guessed refund or automatic split mode.

Verified cached audio may be reused only when plan/request/text/voice/provenance hashes and full decode match. A technical render retry is allowed without credentials, using exactly the same retained audio; its output gets a new version and QA record. Do not call Azure to repair a renderer failure. Human-rejected script needs new approval and a separately priced plan; old spending remains.

Code rollback: select a previously reviewed immutable executor SHA and disable newer policy, never force-push the integration/base/history branches. Ledger schema/policy epoch must remain readable; incompatible rollback blocks execution. Gate 0 rollback is a normal revert of its documentation commit only. No media migration or cleanup accompanies it. Durable ledger restoration uses append-only reconciliation with accepted checkpoint, never a fresh zero-balance ledger. If media retention or provider invoice remains uncertain, report the limitation and stop paid work.

## Owner setup checklist for later gates

Confirm current remaining USD 10 and liabilities; approve LLM provider or fixture-only generation; verify GitHub minutes/storage and environment protection capabilities; identify existing durable media destination; configure approved production branch and minimal secrets privately; authorize pilot's exact cost/request/code/script hashes. These are future prerequisites, not requests to expose secrets in chat. Day-to-day production then receives credentials automatically from its protected environment, without a Windows key prompt. Schedule activation and any main/control-plane merge require separate approval.

## Gate 0 verification results

- `npm ci --ignore-scripts --no-audit --no-fund`: succeeded, 257 packages; package/lock files unchanged. No vulnerability audit was performed.
- `npm run typecheck`: PASS on Node v24.19.0, Linux; does not certify Windows/hosted production render.
- Offline Node subset: 93/93 PASS using `node --test scripts/bilingual/*.test.mjs scripts/marketing05/*.test.mjs scripts/review/*.test.mjs scripts/marketing03/auth.test.mjs scripts/marketing03/direct-audio.test.mjs scripts/marketing02/*.test.mjs scripts/voiceover/*.test.mjs`.
- Full discovery command from IMPLEMENTATION_GATES: 95 PASS / 2 FAIL (97 discovered test records). Video 03 production suite cannot load missing `out/marketing03/timeline.json`; Video 04 real-receipt test lacks `out/marketing04/ledger.json` and original WAVs. These are historical media-dependent checks, not a passing full suite. No fixture was fabricated to replace real media. Initial run before npm install additionally failed dependency resolution; resolved after installation.
- `python3 scripts/bilingual/audio_test.py`: 6/6 PASS; synthetic DSP fixtures only.
- `python3 scripts/marketing05/observed_test.py`: 4/4 PASS.
- `git diff --check`: PASS. Ancestor checks for all PR 1–8 heads against Video 05: PASS. Final tracked diff restricted to four new docs; no historical tracked file changed.
- No paid API calls, voice-catalogue request, price refresh, secret access, render, schedule, merge or publication. Historical media QA remains unverified locally.

## Gate 0 scope change before Gate 1 handoff

The owner introduced a second future mode: evidence-backed product showcases from Shopee/TikTok Shop references, plus configurable more dynamic spoken delivery inspired by an uploaded reference MP4. Read `MULTI_MODE_AND_VOICE.md`. Gate 1 is now two-mode OFFLINE contract/render preparation. Live marketplace fetch, login/OAuth, scraping, affiliate links, paid voice auditions and real product video production are NOT authorized by Gate 0. Keep the original 93/93 + 6/6 + 4/4 QA evidence tied to its historical commit; no new tests have been executed by this documentation extension.

Before future product launch, owner must supply evidence/permissions for product data and assets; if API authorization is absent, choose manual fact-sheet + licensed media intake or block. Owner separately reviews factual claims, disclosures, emotional voice sample and full video prior to posting.
