# Reproduce Video 02

Run from projects/english-journey-video. Uses the existing Remotion stack; no paid API or cloud account.

1. `npm ci`
2. `python3 -m pip install -r scripts/marketing02/requirements.txt`
3. `python3 scripts/marketing02/download_models.py`
4. `npm run build:marketing02`
5. `npm run typecheck`
6. `npm run proofs:marketing02`
7. `npm run render:marketing02`
8. `npm run qa:marketing02`
9. `npm run test:review` and `npm run test:voice`
10. `npm run review:prepare -- --candidate out/marketing02/English-Journey-Marketing-02.mp4 --timeline out/marketing02/timeline.json --brief briefs/marketing-video-02-approved.json --output out/marketing02/review`

The delivered production ZIP includes the rendered PCM mix and public/marketing02/manifest.json. With those files, rendering can be repeated without generating speech or downloading models. FFmpeg/ffprobe and the Remotion headless browser are required. `npx remotion browser ensure` installs that browser.

The renderer has a narrow fallback for Work's denied network-interface enumeration: a loopback interface for the local rendering server. It does not change TLS verification or call external services.

Dialogue and authored captions stay exact. Pronunciation lexicon affects TTS input only: AI → ây ai, ChatGPT → chát gi pi ti, uppercase BẮT ĐẦU → lowercase bắt đầu; these express the same spoken terms. The English word improve and full English example use native English local synthesis. No audio time stretching. Caption cues are measured whole-phrase PCM boundaries, not estimated word times.

Full listening remains required. Do not publish based on technical PASS. Model-chain commercial rights and voice quality remain pending acceptance. See license manifest and QA report.
