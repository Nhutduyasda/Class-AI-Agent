# Bilingual upgrade — offline QA

Implementation/offline status: **PASS**. Azure live/acoustic acceptance: **BLOCKED pending new cost authorization and private-key catalogue check**.

## Actual checks

- 34 Node unit/integration tests passed: language spans, exact copy, wrong/correct examples, article context/phonemes, names, unknown-token handling, metadata offsets, XML escaping, voice selection, SSML billable count, policy/hash/mode/budget guards, approved-source reread before a request, current price/voice evidence, Windows paths, strict RIFF, verified WAV receipts/readback, cached reuse, corrupt cache, ambiguous attempt/no-retry, concurrent session lock, canonical subtitles, actual timing constraints and Remotion clock. `node-tests.txt` contains the execution results.
- 6 Python DSP tests passed: silence-only edge fades and gap sample counts; reject unsafe joins; WAV roundtrip; no rate/pitch/sample-count changes; loudness/true peak; clipping refusal; full fixture mixer; reject mock media in the production mixer. The full DSP fixture measured −16.02 LUFS and −14.51 dBTP. This is a tone fixture, **not speech** and not pronunciation/voice-quality evidence. `audio-tests.txt` records the run.
- TypeScript `tsc --noEmit` passed for existing compositions and the new clock hook. Python syntax compilation and PowerShell parse checks completed separately.
- Existing Video 04's 3 production tests and existing 5 review tests passed. Its source WAV/ledger/media were read only. No old video was rendered or synthesized.
- Legacy Video 03 auth/direct receiver suite: initial Windows checkout run failed due CRLF vs pinned LF brief bytes and absent `python3`/default Python codepage. Isolated baseline archive reproduced the issue. With the original LF Git blob, a process-local Python3 executable alias and `PYTHONUTF8=1`, **all 28 baseline tests passed** (`legacy-baseline-tests.txt`). Historical files in the active checkout were not changed to make tests green; `legacy-windows-default-tests.txt` retains the environment-failure evidence. This is an existing Windows environment caveat, not a claim that the default legacy checkout suite passed unchanged.
- The new adapter uses explicit UTF-8 and buffer-based decoder input; old Video 01–04 modules, briefs, ledgers and media remain unchanged. Node/FFmpeg fixture tests requiring hard-link/fsync were run outside the Windows sandbox after sandbox hard-link denial. A storage preflight now blocks before any paid request when storage primitives are unavailable.
- All four required English examples and the wrong-grammar baseline example were tested offline with exact text retained. No synthetic voice was generated or evaluated.
- Independent Python XML parsing reconstructed the sample's canonical text exactly from SSML. The CLI plan smoke test reproduced the sample hash/cost, and the disabled policy was rejected by the CLI preflight without any credential or network call.

## Cost and security

Real Azure synthesis requests in this upgrade: **0**. New synthesis spend: **0**. No historical budget reused. Sample plan: one request, 184 canonical code points, 225 billable-envelope characters, USD 0.003375 retail estimate; proposed cap USD 0.005, not yet approved. Policy template is disabled.

No key requested/read, no browser/clipboard credential extraction, no secrets logged or committed. Runtime key entry remains in a separate PowerShell SecureString prompt. Ledger reserves attempt/cost before submission; any failed/ambiguous request stops the entire chain and cannot silently become a split-mode retry. No merge/main or TikTok publication.

## Remaining live gates

1. Owner grants the separate one-request sample cost.
2. Private launcher authenticates the specified existing resource key and verifies both exact voices in the regional catalogue.
3. One real multi-voice sample verifies actual service acceptance and produces a WAV/receipt. Failure means stop without retry.
4. Observed alignment, measured real voice balance and direct listening verify pronunciation, switching pauses, isolated articles and subtitle/motion sync. Documentation support and fixture DSP tests do not certify these subjective gates.
