# Video 05 V1.1 — STOPPED, incomplete production

No final MP4 exists. No mix, six-scene timeline, aligned subtitles or proof frames have been produced. The composition source is an unrendered scaffold, not visually approved.

## Cost confirmation and actual attempts

The owner confirmed APPROVE-VIDEO05-USD0.05 in the private PowerShell launcher on 2026-10-19. The API key was entered hidden and was never read by Codex, stored in Git, or passed as a command argument. The new policy binds plan SHA aa774784c377120bb8474619b36afd74e66c66d9a26a840fbac9698dbe93ab98, maximum USD 0.05 before taxes/fees, six scene requests, one attempt each, no retries.

Authenticated GET catalogue evidence confirms both exact Neural voices in southeastasia. HOOK multi-voice succeeded and is the retained production WAV. PROBLEM was attempted once and the shared runner recorded FAILED_OR_AMBIGUOUS_NO_RETRY. SOLUTION, DEMO, BENEFIT and CTA each have zero attempts. No retry or split fallback was made. Preserve the ledger; do not reset it or rerun synthesis.

The shared baseline runner suppresses provider/decoder raw errors, and did not retain an HTTP status, Azure request ID or sanitized failure stage for PROBLEM. Therefore the evidence cannot establish whether the failure was an Azure rejection, transport/response failure or local validation failure; billing outcome is unknown. No PROBLEM WAV is available for recovery in this run folder. This is not evidence that Azure universally rejects multi-voice. Investigate provider-side evidence before defining any separately approved recovery plan; never reuse this ledger or assume the remaining ceiling authorizes extra attempts.

## Checks completed

- Latest fetched bilingual HEAD: 40de1db3fd7a30ee586afec9e01dbd0f9f0dd48e. Video 04: d3a73afb9bfc5c395fb026e7aeaf01a3cd828396. Dedicated Video 05 branch created from bilingual.
- Canonical six-scene narration: 1,151 Unicode code points. Only outer presentation quotes removed and whitespace runs joined with single spaces. Inner punctuation retained; intentional I am agree preserved.
- SSML: six multi-voice requests; UTF-16 offsets validated; all explicit English spans Andrew, Vietnamese Nam Minh, explicit AI/ChatGPT metadata. Zero unresolved language warnings.
- TypeScript typecheck: PASS.
- Existing bilingual/review unit tests: 39/39 PASS outside sandbox. Three initial sandbox failures came from Windows hard-link denial; the same offline tests passed with filesystem permission. No paid fixture calls.
- New Video 05 production tests: 4/4 PASS (exact copy, spans, pending cost policy cannot authorize synthesis, absent observed DEMO timing fails closed).
- HOOK: real Azure WAV, 369,644 bytes, 3.85 seconds, PCM 48 kHz / mono / 16-bit, full decode and receipt readback PASS. Independent readback validation also run.
- HOOK SHA-256: 6235294303d6c23e6be6e4a08ab1b396121797705a603deb5aab4b187916439c.
- Pronunciation, naturalness, transitions, emotion and subjective listening: NOT VERIFIED. Voice names and catalogue evidence are not listening evidence.
- Remaining five WAVs, complete exact-copy audible narration, alignment, mixing/loudness, six continuous scenes, MP4 format/decode/sync, safe-area rendering, first-three-seconds viewing, DEMO reveal timing and CTA: BLOCKED / NOT RUN due to synthesis stop. No PASS claimed.
- Source scaffold uses existing Remotion stack, original CSS/SVG and bundled DejaVu fonts (public/fonts/LICENSE.txt). No SeeCut resources. No new music generated, no asset-license claims beyond these sources.

## Reference cost, not invoice

Retail snapshot verified 2026-10-17T07:57:20.2572429Z, within the runner's seven-day validity at submission: USD 15 / million, Southeast Asia, public meter S1 Neural Text To Speech Characters. Owner resource tier is Standard S0; contract not inspected. Source: https://prices.azure.com/api/retail/prices .

| Scene | Characters | Planned USD | Attempts | Result |
|---|---:|---:|---:|---|
| HOOK | 50 | 0.000750 | 1 | VERIFIED |
| PROBLEM | 234 | 0.003510 | 1 | FAILED_OR_AMBIGUOUS_NO_RETRY |
| SOLUTION | 155 | 0.002325 | 0 | NOT_SUBMITTED |
| DEMO | 315 | 0.004725 | 0 | NOT_SUBMITTED |
| BENEFIT | 217 | 0.003255 | 0 | NOT_SUBMITTED |
| CTA | 180 | 0.002700 | 0 | NOT_SUBMITTED |
| Total planned | 1151 | 0.017265 | 2 | STOPPED |

Ledger reserved reference amount: USD 0.004260. Successful HOOK reference amount: USD 0.000750. PROBLEM actual charge unknown. No invoice total available. MP4 SHA-256: not applicable, no MP4.

Video 01–04 source/media/ledgers were not modified. Nothing merged to main or posted to TikTok.
