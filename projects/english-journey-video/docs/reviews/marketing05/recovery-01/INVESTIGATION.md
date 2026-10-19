# Video 05 safe recovery investigation

Verified remote/local starting HEAD: 485e25ad25e8a44d958c2e7d18f35e79fadf21c0. The HEAD supplied in the recovery request differs and was not assumed valid. No main merge.

## Read-only artifact investigation

Searched runtime, current deliveries and Documents/Codex production folders for PROBLEM WAV/receipt, pending responses and safe logs, excluding dependency/Git directories. Before recovery-01, only Video 03/04 PROBLEM files were present. They were not reused or modified. Video 05 had only the valid HOOK WAV/receipt, old authorization, ledger and voice catalogue evidence. No original PROBLEM response or request-specific telemetry was recoverable. No Azure CLI or authenticated Azure Monitor connector was available, so cloud metrics were not read. A Speech key is not assumed to grant resource-management access. No new resource or cloud configuration was created.

The six original SSML documents parse as XML and concatenate to exact approved narration. PROBLEM uses Nam Minh / Andrew / Nam Minh, with a separate same-voice span for explicit Vietnamese metadata Nghe. Quotes/punctuation and whitespace are preserved. Neither recovery changes its SSML, voices, rate or pitch. Original text and SSML hashes remain unchanged.

The original transport performed one POST with a 60-second timeout, no redirect/retry, response byte cap 60 MB. Original validation parsed strict RIFF, decoded the full WAV, then probed streams over stdin before creating any file. Its catch discarded failure stage and HTTP/request metadata. Consequently the original failure cannot be attributed conclusively or billed conclusively from local evidence. Original HOOK proved that a short multi-voice request was accepted, not that all longer requests passed local validation.

## Recovery-01 outcome

Owner privately confirmed five requests capped at USD 0.02, including exactly one additional PROBLEM attempt. New policy and ledger were stored separately. PROBLEM returned HTTP 200 but failed WAV_PROBE; new diagnostics preserved this stage safely. The four later scenes remained unsubmitted. No automatic retry or split fallback occurred. Original ledger bytes remain unchanged.

The recovery-01 response was still validated before being written, so that WAV was not retained. This implementation gap has now been fixed for future requests; existing missing audio cannot be recreated from metadata, request ID or billing.

## Reproduced Windows defect and repair

On Windows / Node v24.19.0, ffprobe -show_streams can finish after reading enough stdin to identify the stream, while execFileSync is still writing a longer PCM buffer. Node reports code EOF although ffprobe status is 0, stderr is empty and stdout contains valid PCM 48 kHz mono metadata. The 1,440,044-byte / 15-second offline PCM reproducer failed all three times. A historical valid 1,347,644-byte Video 04 WAV independently reproduced the same failure without modification.

Adding -count_frames forces ffprobe to drain the entire input; the repaired verifier passes synthetic 15-, 30- and 90-second PCM fixtures with full FFmpeg decode and SHA-256. This is a confirmed local defect consistent with the recovery-01 WAV_PROBE failure. The lost recovery response prevents proving that it was the only issue with that particular payload. It does not prove that the original ambiguous request had the identical cause.

Future RIFF/WAVE responses are now written exclusively and fsynced to a quarantine file, with payload SHA-256 and exact plan/SSML/text provenance, before decoder validation. Failed validation retains these artifacts; success exclusively commits WAV and receipt. Arbitrary non-audio HTTP bodies are neither persisted nor logged. Existing good WAVs are never overwritten. Regression tests cover request limits, timeout, HTTP status/request ID, stream failure, secret redaction, no retry, long stdin buffers, destination collision and quarantine provenance.

Diagnostics allowlist only stage, error type, safe system code, integer HTTP status and UUID/hex request ID, plus failure timestamp. No raw messages, stacks, credentials, headers or response bodies enter logs/ledgers. EOF is now included in the safe code list. Resource-level metrics and invoice outcome remain unverified.

## Cost and further recovery

Original reservation USD 0.004260 plus recovery-01 reservation USD 0.003510 = USD 0.007770 historical reference, not invoice cost. PROBLEM has two prior submissions; actual charges are unknown. HOOK remains retained and is never resynthesized.

Recovery-02 is a separate, initially disabled five-request plan: one further PROBLEM attempt (third overall), then SOLUTION, DEMO, BENEFIT, CTA. New estimate USD 0.016515, new ceiling USD 0.02 before taxes/fees, combined reference estimate USD 0.024285 and combined reservation ceiling USD 0.027770. Both preceding ledgers/authorizations are hash-bound and immutable. Neither previous approval authorizes the new attempt. Private confirmation must explicitly acknowledge PROBLEM3. No split fallback or provider substitution.
