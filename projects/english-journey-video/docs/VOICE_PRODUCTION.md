# Voiceover pipeline contract

Use the current five-scene Remotion composition and approved brief. The voice plan is separate from the original silent brief.

## Provider adapter

Implement `TTSProvider.synthesize(text, voice, rate, cache_dir)` asynchronously. Return `SynthesisResult` with a real local audio file plus exact `{text,startMs,endMs}` tokens relative to that file. Tokens must cover the full authored transcript, including punctuation reconstructed from it. Provider word boundaries or a genuine alignment of that exact recording are acceptable. Evenly interpolated times are not.

Only Edge is enabled. Future Azure/ElevenLabs adapters must return the same contract, use appropriate native-language voices, keep credentials in environment variables, and obtain owner approval before any paid request. Do not create accounts or automatically fallback to paid providers.

## Timing model

1. Decode each synthesized segment to mono 48 kHz PCM.
2. Place segments sequentially, keeping their entire decoded audio, with 0.18s inter-segment pauses.
3. Add 0.22s at each scene end, then align that endpoint upward to a 30 FPS boundary.
4. Add each segment's sample-based position to its provider word boundaries.
5. Normalize the complete mix in two passes to -16 LUFS without changing its sample count.
6. Group real tokens into pages of at most six words/42 characters, respecting punctuation and segment identity.
7. Use those same pages for burned captions, SRT and VTT. Caption visibility and highlighting use `[startMs,endMs)`.

The full recording remains intact. Provider tail silence is retained rather than risking clipped phonemes. Revision of an overlong script requires synthesis again; it is not solved by speeding playback, truncating a sentence or shortening a scene arbitrarily.

## Generated assets and integrity

`public/voice/<id>/` contains `narration.wav`, `manifest.json`, and preview `props.json`. These are generated and Git-ignored. `out/` contains user-facing exports and QA evidence. Cached source TTS metadata is stored in `.cache/tts` under a hash of provider, version, voice, rate and text.

The manifest records the source-brief/plan SHA-256 hashes, segment/scene offsets, sample count, subtitle pages and provider word boundaries. Rendering rejects stale hashes or invalid timing. The optional final-export waveform correlation check detects mux delay or substitution. ASR is an independent machine check; direct listening remains a separate quality gate.

## Review gates

Run typecheck and timing regression tests. Inspect rendered captions/English cards and check AAC audio, duration, loudness, peak, decoded-frame count and clean full decode. Confirm all scenes contain their complete spoken phrases. Listen to the final export before accepting pronunciation/naturalness; do not infer that a stream or ASR result alone clears that gate.
