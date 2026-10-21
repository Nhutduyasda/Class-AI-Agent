# Video 06 — proposed A/B voice audition (not authorized)

Canonical input: briefs/english-video-06-candidate.json. Exact byte SHA-256: `79926b5736c3e2f1317205ff127e3b29547f35a2885bc7332675fec524b77d86`. It is explicitly unapproved. Machine-readable SSML, per-request hashes and costs: briefs/auto-factory/video06-auditions.json. Do not pass that file to the historical paid launcher: this preparation format intentionally has no executable authorization. A later reviewed bridge must bind a new approved script and plan to the existing bilingual/Gate 2 contracts.

Use the existing southeastasia resource only. Vietnamese sentences use vi-VN-NamMinhNeural; standalone English examples use en-US-AndrewNeural. No language autodetection in this pilot. Six independent sentence requests per variant avoid mid-sentence speaker switching. This is a deliberately priced split plan, not fallback after a failed multivoice call.

A: neutral, rate 0%, 180 ms trailing SSML break. B: hook +4%, Vietnamese body 0%, English examples -8%, 260 ms trailing break. Pitch remains default. Only speak/voice/prosody/break are emitted, with XML-escaped exact text. No express-as emotional styles, voice cloning, unsupported emphasis tags or reference-speaker imitation. Stress is directed through concise phrasing and visual emphasis, not claimed provider emotional support. Generic SSML support is documented; exact voice/region runtime behavior remains UNVERIFIED until an approved audition and catalogue check. If a feature fails, stop; no automatic substitute provider, retry or new split plan.

Public evidence checked 2026-10-21:
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-structure
- https://azure.microsoft.com/en-us/pricing/details/speech/
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech#pricing-note

The existing billing helper conservatively includes optional serialized SSML markup and escaped entities, excluding speak/voice tags. Total A+B: 12 requests, 1,073 billable-envelope characters, USD 0.016095 at the USD 15/million reference. See the JSON for each variant and request. Public pricing is not an account-specific quote or invoice; refresh regional/account pricing and tax before execution. Evidence expires at 2026-10-22 00:00 UTC (07:00 Vietnam). No TTS request was made.

Blind owner listening: randomize A/B labels, same playback level/device, listen to every Vietnamese/English transition. Score 1–5: hook clarity, Vietnamese naturalness, English pronunciation, rhythm/pauses, caption readability, visual pacing, usefulness. Reject clipped syllables, awkward language switching, wrong English or distracting cadence regardless of average score. Record variant/hash/timecode and concrete defect. An ASR transcript, waveform or AAC stream does not certify emotion or pronunciation. Keep the approved audition's WAVs for reuse: the production render should not request them again. If neither variant passes, any new synthesis requires a new scope/cost approval.
