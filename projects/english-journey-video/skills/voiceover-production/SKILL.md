---
name: voiceover-production
description: Produce natural Vietnamese narration, optional native English examples, real TTS audio, word-timed subtitles and verified Remotion MP4 audio for English Journey. Use when adding voiceover, replacing a TTS provider, synchronizing speech with scenes/captions, or auditing pronunciation and audio quality.
---

# Voiceover Production

## Default for new approved English Journey marketing briefs

Use the shared Azure-only bilingual adapter in `scripts/bilingual/`, configured by `config/bilingual-voice.json` and documented in `docs/BILINGUAL_VOICE.md`: Nam Minh for Vietnamese and Andrew for English. This default supersedes the free-provider suggestion below for NEW marketing productions; historical lessons and Video 01–04 remain unchanged. Preserve exact canonical text, use pronunciation spans for ambiguous terms, and require a new exact-plan cost policy before paid synthesis. Never reuse a previous video's budget. The secure Windows launcher prompts for the key privately once; default planning and all fixture tests are offline.

## Ground the narration

Read the project AGENTS.md, lesson brief, story/caption/QA skills and existing renderer. Extend the current design. Preserve the exact approved BEFORE and AFTER strings. Do not pronounce intentional BEFORE spelling errors as if they were valid vocabulary.

Write a short narration plan per scene in `briefs/lesson15-voiceover.json` (or the next lesson's equivalent). Use conversational Vietnamese, short clauses and ordinary punctuation for pauses; avoid ad-like enthusiasm, exaggerated promises and speed-reading. Name each segment, scene, language, voice, rate and transcript. Prefer `vi-VN-HoaiMyNeural` through edge-tts for a free test. Use a native English voice for English example sentences or isolated vocabulary; do not force the Vietnamese voice to read a full English sentence.

## Synthesize through the provider boundary

Use the project `scripts/voiceover/providers.py` contract: return an actual audio file and tokens `{text,startMs,endMs}` measured against that audio. Keep each request short. Use the configured rate (normally -5% or 0%), never auto-speed up an overlong lesson. Cache by provider/voice/rate/text and preserve raw boundary metadata. Require explicit approval before adding or running a paid provider; Azure/ElevenLabs are replacement interfaces, not enabled services.

Respect configured HTTPS proxy and trust the host's CA bundle; never disable TLS verification. Bound retries and timeouts, fail without replacing a good output, and identify the provider failure honestly. Check a free alternative only if it is available and appropriate; do not silently fall back to paid tools or create accounts.

## Build one audio clock

Decode segments to a common PCM sample rate before concatenation. Measure duration with ffprobe. Add deliberate short pauses between segments; do not overlap spoken phrases. Derive scene endpoints from decoded segment durations plus trailing silence, rounded upward to video frames. Keep the complete spoken phrase in its own scene. Allow 35–45 seconds for the voice pilot; if outside the range, revise the script and regenerate changed clips rather than cutting audio or inventing timestamps.

Export the WAV/MP3 mix, a manifest containing segment and scene offsets, transcript, and subtitle SRT/VTT. Offset each provider's real word boundaries by the corresponding segment's exact sample-based position in the mix. Never distribute words evenly over a sentence. If reliable word boundaries are unavailable, transcribe/align the exact synthesized recording with an available free aligner or fail the synchronized-caption acceptance criterion.

Group adjacent timed tokens into readable short phrase pages, at most two lines in the safe caption band. Drive active-word color and any emphasis from the token times and `useCurrentFrame()`. Burn the same pages into Remotion and emit sidecars from those pages. Rebuild the timeline whenever narration changes; never reuse stale subtitles.

## Listen and verify before declaring success

Listen to the complete final export's audio, including each Vietnamese phrase, English vocabulary/example, transitions and ending. Check tone, diacritics/pronunciation, English past tense, pauses and absence of clipped syllables. Record what was actually listened to; speech recognition or an audio-stream flag is not a substitute for listening. If the environment cannot play/listen to audio, explicitly mark listening QA blocked rather than PASS.

Probe the final MP4: require 1080×1920, 30 FPS, a playable AAC audio stream, expected duration and clean full decode. Measure integrated loudness and true peak (target about -16 LUFS mono, no clipping; allow a documented small tolerance). Confirm normalized audio has not been stretched and ends before the final video frame. Compare the decoded MP4 audio to the source mix for mux timing drift.

Inspect proof frames from the final MP4 at hook, teaching, English example, CTA and sampled active words. Require readable Vietnamese, the correct current highlighted word, exact approved English and safe area. Verify scene boundaries occur after the outgoing narration. Save technical and listening findings separately in QA. Deliver MP4, standalone audio, transcript/subtitles, QA and reproducible source. Commit only within the project feature branch; require owner review before TikTok posting.
