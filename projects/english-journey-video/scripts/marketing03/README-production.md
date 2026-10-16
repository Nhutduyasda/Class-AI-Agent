# Video 03 V1.1 — Offline production from owner audio

No Azure credential or synthesis call is needed. Keep the original owner ZIP.

```bash
npm ci
python3 -m pip install -r scripts/marketing03/requirements-production.txt
python3 scripts/marketing03/verify-input.py /path/to/owner-audio.zip
python3 scripts/marketing03/align.py
python3 scripts/marketing03/build.py
node scripts/marketing03/setup-browser.mjs --install
npm run typecheck
node --test scripts/marketing03/*.test.mjs scripts/review/*.test.mjs
node scripts/marketing03/render.mjs --proofs
node scripts/marketing03/render.mjs
python3 scripts/marketing03/qa-production.py
npm run review:prepare -- --candidate out/marketing03/English-Journey-Marketing-03-V1.1-NamMinh.mp4 --timeline out/marketing03/timeline.json --brief briefs/marketing-video-03-approved.json --output out/marketing03/review
```

First-time ASR downloads a public small model; no paid API. Cache source observations in raw/*.asr.json. The handed-off archive includes observations so the render can be rebuilt without downloading ASR. Source WAVs are verified and normalized only in derived mix, never overwritten or accelerated. Do not rerun Azure for missing files. Render filename is dedicated to Video 03; existing Video 01/02 untouched. Output folder contains unapproved review media, not a publication decision.
