# English Journey Marketing Video 04 V1.1

Title: A, AN, THE — Học rồi mà vẫn phải đoán?

The owner approved all six scenes, immutable dialogue, Azure Nam Minh and a USD 0.05 budget in the production prompt dated 17 October 2026. Video 01–03 are preserved. This branch starts from the latest fetched Video 03 branch because the main branch does not contain the video project.

## Reproduction

- `npm ci` with the existing lockfile; Node 24 and FFmpeg/ffprobe in PATH.
- Local Python environment: numpy, scipy, faster-whisper. The existing music helper imports the existing voice provider module; edge-tts is an import dependency only and is never used for synthesis in this production.
- Paid voice: `scripts/marketing04/voice-runner.mjs`, derived from the verified Windows direct-WAV receiver. The owner enters the resource key through a private PowerShell SecureString prompt. No keys in source, arguments, logs or long-lived environment variables.
- Voice runner records attempts before sending, writes exclusive WAV/receipt files, verifies SHA-256, full decode and PCM format, and stops on any failure. A second run cannot reset/overwrite the runtime ledger. One synthesis attempt per scene, no retries, no other paid provider.
- `python scripts/marketing04/build.py <local-faster-whisper-small-model>`: offline ASR, phrase alignment, audio normalization, original music/SFX, timeline, SRT/VTT. The full approved text is retained. ASR substitution evidence is included; human pronunciation and phrase sync remain pending.
- `node scripts/marketing04/render.mjs --proofs`, then `node scripts/marketing04/render.mjs`.
- `npm run typecheck`, `node --test scripts/marketing04/production.test.mjs`, `npm run test:review`.
- `python scripts/marketing04/qa.py <delivery-folder>` and `npm run review:prepare -- --candidate out/marketing04/English-Journey-Marketing-04-V1.1-NamMinh.mp4 --timeline out/marketing04/timeline.json --brief briefs/marketing-video-04-approved.json --output out/marketing04/review`.

Raw WAV, the mix, SRT/VTT, MP4, receipts, ledger and proof images are delivered outside Git. Copy the delivered mix.wav to public/marketing04/mix.wav to render again. No audio stretching, no line cutting and no resynthesis during layout fixes.

The score and SFX are generated locally by the existing project helper (original note/pattern synthesis); illustrations are original inline SVG. Fonts and their license are retained from the baseline. No SeeCut resources.

Technical QA does not establish expressive voice quality, marketing effectiveness or retention. Direct subjective audio listening and full-motion review are BLOCKED pending owner review. No merge or TikTok posting is authorized/performed here.
