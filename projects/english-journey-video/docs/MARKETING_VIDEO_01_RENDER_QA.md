# Marketing Video 01 — render acceptance

**Status: NOT APPROVED for publication.** This is a rendered review candidate, not a certified natural-voice marketing asset. The agent runtime does not support audio perception; human listening, expressive performance, mixed-language pronunciation, music suitability, mono/mobile listening and cold-viewer understanding remain BLOCKED pending owner review. ASR or an AAC stream cannot clear those gates. Edge consumer voice commercial-use rights are not verified. No paid service, TikTok posting or main merge.

## Script and format

Approved narration is consumed verbatim from `briefs/marketing-video-01-approved.json`; exact reconstruction from real word tokens and six-stage order are asserted by `scripts/marketing/qa.py`. Both English sentences are unchanged. The source script remains locked. No TOEIC result, guarantee, official ChatGPT partnership, fake screenshots/testimonials or automatic memory-sync claim. Error Log is explicitly a process illustration.

Natural-rate HoaiMy voice (+0%) is provisional. Real audition A (HoaiMy) and B (NamMinh) both contain the same approved hook+problem; no listening winner is claimed. Directions are documented in `MARKETING_VIDEO_01_PRODUCTION.md`. English terms need human pronunciation review; no full English sentence is forced through Vietnamese narration.

**Runtime: 66.00 seconds (1980 frames)**. The 45–55 second target is NOT MET. Untrimmed six recordings plus breathing room and a seven-second corrected-sentence reading hold determine this runtime. Speech was not accelerated or script shortened. A shorter editorial cut requires separately approved revised copy; the delivered candidate retains this approved script.

## Visual review

Seven layout stills were actually rendered and visually inspected: hook, problem, solution, demo-before, demo-after, benefit, CTA. Vietnamese accents render correctly with bundled DejaVu; no clipping observed in samples. Key content lies within x96–920, y180–1565; captions at y1360–1510 above bottom platform reserve, up to two lines. Sampled before/after match the exact supplied sentences, highlight two spellings and missing connector, and disclose other phrasing changes. Final encode proof frames must be extracted by QA, not represented by layout-only images.

Opening audience/problem text is present at frame zero, with no intro fade. Original vector learner and uncertain path explain the hook; scattered learning blocks contrast with numbered Reading & Grammar/Vocabulary/Error Log path. Authentic correction and explicit log→next-review lead to the single CTA. No generated imagery is portrayed as a real application screenshot. Real-phone readability and single-view comprehension await human review.

## Technical evidence

Run `npm run qa:marketing` after rendering. Authoritative measured findings live in `out/marketing-technical-qa.json`: counted video frames, codecs/dimensions/FPS, complete decode, actual MP4 loudness/true peak, source-export waveform correlation and three-stem regression proving voice/music/SFX survive the AAC encode. The builder exports real 48 kHz separate stems, transcript, SRT/VTT and word timing manifest. Renderer hash guards prevent stale brief/audio alignment.

Music: original locally synthesized 90 BPM instrumental, no imported samples/song; fades and speech-envelope ducking. See `assets/marketing-video-01-license-manifest.json`. Numerical levels establish a speech-first starting mix, not subjective listening acceptance.

## Gate summary

| Criterion | Status |
|---|---|
| Exact approved wording, stage order, authentic English | Automated PASS when QA assertions complete |
| Hook audience/problem text within three seconds | Sample visual PASS; cold-viewer comprehension pending |
| Vector process illustrations, Error Log, single CTA | Sample visual PASS; editorial acceptance pending |
| Real 1080×1920 / 30 FPS H.264 / AAC, full decode | Measured by QA after encode |
| Actual voice/music/SFX and synchronized timestamp source | Measured by QA after encode |
| 45–55 second target | NOT MET — 66 seconds, approved words retained |
| Expressive natural voice / pronunciation / full listening | BLOCKED — cannot honestly hear audio in this runtime |
| Music taste, mono/mobile listen, phone readability | Human review pending |
| Edge voice rights for marketing publication | NOT VERIFIED |
| Owner approval / ready to post | NOT APPROVED |

Review both auditions and the complete MP4 before choosing voice/approving publication. If performance is flat, replace with a consented human recording or an explicitly authorized licensed provider and regenerate the actual alignment; do not treat music as a cure for robotic narration.

## Actual MP4 results

Technical **PASS**: 1980 counted frames, 1080×1920, 30 FPS, H.264 yuv420p; AAC stereo 48 kHz. Full audio/video decode succeeded. Final mix −16.01 LUFS, true peak −3.15 dBTP. Source/export correlation 0.999973, mux lag 0.0 ms. Independent 16 kHz stem projection: voice 0.999007, music 0.998444, SFX 0.998955 (near-unity coefficients confirm all three in actual AAC output). High-frequency stereo sparse sampling was not used as the final stem estimator; mono resampling preserves the useful comparison through lossy AAC.

All seven final-export proof frames were extracted, not substituted with layout images. Final contact sheet visually checked for exact text and safe placement. Full playback listening remains BLOCKED.

Local free Whisper base recognized the main six-stage flow from the final mixed MP4, without reference prompt, but misrecognized ChatGPT as “chát”, English Journey as “Inlet's Junior”, Reading as “rích đình”, and and as “anh”, plus Vietnamese word errors. These are pronunciation-review flags, not proof of what a human heard; the ASR model itself may err. Do not mark pronunciation PASS. Raw observations are delivered in `marketing-asr-observations.json`.
