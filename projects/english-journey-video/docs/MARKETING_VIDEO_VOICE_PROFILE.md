# English Journey — Voice continuity reference

## Owner feedback (2026-10-15)
**Video 02 visual/content: ACCEPTABLE FOR CURRENT REVISION. Voice: REJECTED** — it does not match the recognizable sound of Marketing Video 01 and feels unnatural. This is not an approval of publication.

## Verified in repo
| | Marketing Video 01 | Marketing Video 02 (rejected) |
|---|---|---|
| Builder | `scripts/marketing/build.py` | `scripts/marketing02/build.py` |
| Synth engine | `scripts/voiceover/providers.py` -> edge-tts | Piper local |
| Vietnamese voice | `vi-VN-NamMinhNeural` | `vi_VN-vais1000-medium` |
| Voice speed setting | `rate=+0%` | Vietnamese `length_scale=2.0` |
| English wording | No standalone native-English TTS for lesson sentence | Switched to `en_US-ljspeech-medium` for full English example |
| Actual run QA | `docs/MARKETING_VIDEO_01_RENDER_QA.md` | `docs/reviews/marketing02/QA_REPORT.md` |

The Video 02 producer records that Piper was used because Edge voice commercial rights were unverified. This change of voice **explains the continuity mismatch**. Technical loudness PASS is not a naturalness or timbre MATCH.

## Production target
- Match Video 01's audible narrator identity (voice engine/voice identifier) and comparable rate, pauses, pronunciation, equalization/loudness, not merely "male Vietnamese".
- Use the actual Video 01 final MP4 or `out/marketing-voice.wav` as audible reference when available. If not available, reconstruct a short clean Video 01 audition with the documented configuration; label a recreated reference clearly.
- Narration script remains exclusively and exactly `briefs/marketing-video-02-approved.json`.
- Avoid a patched-together male Vietnamese main voice + unmistakably different female/native-English voice without owner listening and selection.
- Regenerate all audio-driven caption and scene timings; fix animations by shifting timing only, not by changing concepts or approved words.
- Report chosen provider, voice ID, rate/pitch, segmentation strategy, volume/EQ/music ducking, sample/audio rights and checksums.

## Licensing gate (commercial marketing)
The Video 01 narrator is an Edge consumer `edge-tts` voice; its commercial output rights are NOT established by the current project manifests. The fact a preview existed does NOT grant publication rights.

Microsoft's Azure TTS paid-tier output terms currently expressly permit commercial use of its prebuilt neural voice outputs; the official supported voice list includes `vi-VN-NamMinhNeural`. This is a potential licensed route, **not permission to create a paid account or charge credits** without owner approval. Source references:
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms

The agent may use a permitted internal-preview path only to the extent actual terms allow; if an authorized matching voice is unavailable, it MUST stop and report the rights blocker. Do not quietly substitute Piper or any other voice as "Nam Minh". A consented human narrator re-recording is another option only with appropriate consent and usage terms.

**Publication gate:** owner must listen and approve continuity/emotion, and independent commercial usage rights must be verified. No TikTok publishing, main merge, spending or lock-script modifications.
