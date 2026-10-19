# Video 05 V1.1 production adapter

The original approved brief remains canonical: briefs/marketing-video-05-approved.json. Recovery briefs contain exact unchanged scene subsets plus provenance only. See recovery-01/INVESTIGATION.md for the Windows EOF diagnosis and frozen failure history. No original budget was reused for an extra attempt.

## Audio origins

- HOOK: original out/bilingual/marketing-video-05, original plan/receipt retained.
- PROBLEM, SOLUTION, DEMO, BENEFIT, CTA: out/bilingual/marketing-video-05-recovery-02, separately approved five-request plan capped at USD 0.02.
- recovery-01 remains a separate failed one-request ledger. Never reset, merge or relabel it as successful.
- audio-assembly.json is a verification manifest, explicitly not a synthesis/spending ledger. It preserves each origin plan, ledger, SSML and audio hash. The timeline uses the canonical six-scene assembly clock only after receipt and exact-SSML equivalence checks. Original receipts are not rewritten.

## Offline continuation only

With the already verified private WAVs, receipts and all three ledgers available locally, use an existing Python environment with numpy, scipy and faster-whisper and an existing local faster-whisper-small model. No downloads or ASR API are required. From the project directory:

```powershell
& $python scripts/marketing05/build.py --model $model
node scripts/marketing05/timeline.mjs
& $python scripts/marketing05/build.py --mix
node scripts/marketing05/render.mjs --proofs
node scripts/marketing05/render.mjs
& $python scripts/marketing05/qa.py
npm.cmd run review:prepare -- --candidate out/marketing05-production/English-Journey-Marketing-05-V1.1-Bilingual.mp4 --timeline out/marketing05-production/timeline.json --brief briefs/marketing-video-05-approved.json --output out/marketing05-production/video-review
```

Do not run either spent private synthesis launcher. The scripts refuse a previously started recovery, preserve exclusive WAV destinations and stop ambiguous attempts without retries. All remaining rendering, mixing and caption corrections use cached WAVs only.

## Timing and audio

Two local recognition passes provide observed Vietnamese/English phrase endpoints. Presentation quote marks are removed only in ASR context to avoid curly-quote repetition; they remain in canonical copy and captions. Phrase boundaries follow punctuation, language transitions, seven-word maximum and observed DEMO cue starts. Monotonic selection uses actual pass endpoints without interpolation, clipping overlaps or invented word timestamps. Missing evidence stops the pipeline. ASR substitution text is preserved separately for listening checks, never substituted into approved captions. No karaoke/word-highlight claim is made.

The shared bilingual clock, RIFF verifier, normalizer and existing original score/SFX generator are reused. Request and measured voice ranges are normalized, gain ramps preserve samples, music ducks under speech, and no audio is stretched or pitch-shifted. All six scene durations follow decoded PCM counts with 800ms frame-rounded tails. Timeline markers control the prompt, hint, am strikeout, correct sentence and practice sentence; the correct answer is not shown before the hint.

## Verification and assets

Use the bilingual/diagnostics/review/Video 05 Node tests, scripts/bilingual/audio_test.py, scripts/marketing05/observed_test.py and TypeScript typecheck. Final qa.py decodes the actual MP4, probes format, measures loudness/true peak, checks waveform mux drift and extracts actual MP4 proof frames. Visual still review and objective metrics do not certify pronunciation, emotional quality, full-motion quality or retention. Those remain owner listening/viewing decisions.

All graphics are original CSS/SVG. DejaVu fonts are bundled with public/fonts/LICENSE.txt; the license permits use/distribution subject to its terms. Music/SFX use the existing original generator in scripts/v2/build.py, not external recordings or SeeCut. No Video 01–04 production was modified or rerendered; shared verifier/timing defect fixes are separately tested. No merge to main or TikTok posting.
