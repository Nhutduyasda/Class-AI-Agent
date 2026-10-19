# Video 05 V1.1 — final technical QA

Technical: **PASS**

- format: PASS
- duration: PASS
- fullDecode: PASS
- sixContinuousScenes: PASS
- approvedCopy: PASS
- subtitleTiming: PASS
- uncutSpeech: PASS
- demoRevealOrder: PASS
- correctSentenceReadingTime: PASS
- practiceSentenceReadingTime: PASS
- spendingHistoryPreserved: PASS
- sixRealVerifiedWavs: PASS
- loudness: PASS
- truePeak: PASS
- muxAudioSync: PASS
- voiceRoutingMetadata: PASS
- submittedSsmlExactCopy: PASS

Duration 108.567s; 1080 x 1920, 30fps, H.264/AAC. Loudness -16.01 LUFS; true peak -2.38 dBTP. Mux lag 0.0ms; waveform correlation 0.99998.

Six real WAVs, original HOOK retained. Separate ledgers contain 2 original attempts, 1 failed recovery-01 attempt and 5 authorized recovery-02 attempts: 8 total submissions, 6 retained WAVs, no automatic retries. Reference reserved cost USD 0.024285; not an invoice. Original ambiguous PROBLEM billing is unknown; recovery-01 returned HTTP 200 and failed local WAV_PROBE.

Canonical subtitles use observed audio endpoints; no ASR rewriting. Subjective pronunciation, voice naturalness, emotion, music balance and full-motion review are NOT VERIFIED; voice routing metadata and technical metrics do not certify these. Stills are a separate visual inspection. No main merge or TikTok posting.

MP4 SHA-256: `d15caf2df19d9f95d48c1ba5c02b5c436304508131a00c78f62c2ec258fecb9d`

## Listening checkpoints

ASR substitutions are not proof of an audible narration error. Check these against the real export; captions retain approved copy.

- 70.373s: canonical `mình thử viết thêm:`; ASR observed `mình thử việc thêm.`.

## Sampled actual-MP4 visual inspection

PASS for the inspected stills: opening.png, hook-2.5s.png, problem.png, solution.png, hint-before.png, correct-before.png, correct-after.png, practice-after.png, benefit.png, ending.png. Vietnamese text, first-frame red am ring, deliberate wrong sentence, delayed answer, correct/practice sentences and single comment CTA were legible and inside the configured critical-text safe area. This is a sampled still assessment; full-motion viewing and actual listening remain unverified.

Verification: TypeScript typecheck, 55 JavaScript tests, 6 DSP tests and 4 phrase-observation tests passed.
