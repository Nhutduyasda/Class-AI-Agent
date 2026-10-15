# ChatGPT Work — Build approved English Journey Marketing Video 02 (LOCKED V1.1)

## Source
Repo: `Nhutduyasda/Class-AI-Agent`
Branch: `feat/english-journey-marketing-video-02`
Scope: `projects/english-journey-video/`

This instruction is for a **later Work production run**; adding this file alone does not render any video.

**Read before any editing:**
- `AGENTS.md`
- `docs/MARKETING_VIDEO_02_APPROVED_SCRIPT.md`
- `briefs/marketing-video-02-approved.json` — canonical source of exact dialogue
- `docs/MARKETING_VIDEO_02_QA.md`
- `docs/VIDEO_REVIEW_PIPELINE.md`
- `skills/editorial-shot-planning/SKILL.md`
- `skills/video-self-review/SKILL.md`
- `skills/video-version-comparison/SKILL.md`
- Existing Marketing Video 01 production for reusable Remotion/TTS architecture.

## Mission
Produce a playable TikTok marketing/educational Video 02 about knowing vocabulary meanings but forgetting or failing to use the words; present a workflow for understanding, using, checking and deliberately reviewing words. This is **not** a Lesson 15 diary or Video 01 remake.

### Editorial source LOCK
1. Keep every spoken sentence and all six stages **exactly** as approved; do not silently shorten or paraphrase for runtime. Subtitle segmentation may differ, not wording.
2. Storyboard times 0–6, 6–17, 17–30, 30–52, 52–65, 65–75 seconds are creative suggestions. Natural audio-driven timing wins; report actual runtime (can exceed 75s).
3. Start with a recognizable hook from frame 0, e.g. on-screen `HỌC TRƯỚC — QUÊN SAU?`. Cold viewer must know the subject within first 3s.
4. DEMO uses the exact word `improve` = cải thiện and correct sentence `I want to improve my English.`. The sentence is already correct! Show a natural successful check, not fabricated spelling/grammar mistakes.
5. This is an educational illustration, NOT evidence of a specific genuine learner session. Label mockups `Minh họa`; show actual screenshots only when genuinely captured and permissioned.
6. Vocabulary Log is deliberately kept by the learner; don't claim cross-chat sync or magic AI memory. CTA must be exclusively `BẮT ĐẦU`.

## Production
1. Fetch latest branch and inspect the current PRs, compositions and review scripts. Preserve Video 01 and all existing assets. Create a distinctly named `Marketing02` composition and independent output paths; no regression to Video 01.
2. Use existing Remotion/FFmpeg, TTS and audio mixing stack. Prefer owner-selected Nam Minh only if licensing/availability are verified. Never spend credits or use unauthorized voices/sound.
3. Create shotbook with speaking times and source-of-evidence notes. Render attractive but restrained visuals in English Journey dark-green/mint style.
4. Use actual TTS timings to synchronize visuals/captions, with readable font and safe overlay margins. Respect Vietnamese spelling and accurate English text.
5. Export real MP4 1080×1920 30fps H.264/AAC, voice, music, SFX (if justified), SRT/VTT, actual timeline manifest, proof frames and provenance.
6. Run `npm run test:review` plus appropriate **Video 02** technical QA and `npm run review:prepare -- --candidate <actual-video-02.mp4> --timeline <actual-video-02-timeline.json> --brief briefs/marketing-video-02-approved.json`. Do not reuse the Video 01 QA results as Video 02 evidence.
7. If able to actually view/listen to video, evaluate beginning, message, demo, pronunciation, soundtrack, readability and CTA with timestamps. Otherwise mark subjective review BLOCKED. The viewer/owner must finally approve.
8. Any new render version comparison must follow two genuine reverse-order view/listen evaluations. Never invent scores or claim improved viewer retention.

## Deliver
- Real accessible Video 02 MP4 and source/render instructions.
- Six or more real proof images including 0s/2.5s/demo/CTA.
- Voice/music source with explicit marketing rights status.
- Technical QA, actual duration and human-review status.
- No auto publication, no main merge, no paid service without permission.

**Script approval is not publishing approval.**