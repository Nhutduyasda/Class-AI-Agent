# Paste this into ChatGPT Work (GitHub repo already connected)

Work in my GitHub repository **Nhutduyasda/Class-AI-Agent** on the existing branch **feat/english-journey-video-agent-pilot**. The only allowed work area is **projects/english-journey-video/**; do not modify the rest of the repo or merge into main.

Goal: **BUILD and RENDER one real TikTok pilot video MP4**, then show me the MP4 and proof frames for manual approval. Do not stop after writing a proposal or a storyboard.

1. Read `projects/english-journey-video/AGENTS.md`, `README.md`, `briefs/pilot-lesson15.json`, all four `skills/*/SKILL.md` files, and `docs/QA_CHECKLIST.md`. Use the vendored third-party references only when useful.
2. Implement a minimal, reproducible video renderer *inside this folder* using Remotion (Node + React) and FFmpeg where available. Choose compatible package versions, create `package.json`, source code in `src/`, and a concise README with commands. Keep dependencies modest. Avoid external stock footage and paid APIs.
3. Render exactly one test: `out/lesson15-writing-retry.mp4` (portrait 1080×1920, 30fps, target ~30 sec). Use the exact BEFORE and AFTER sentences from the JSON brief, readable Vietnamese text, hook → correction → payoff, subtle code-generated motion graphics. This is **not a fake ChatGPT chat screenshot**.
4. Prefer free/offline natural Vietnamese TTS if already available; verify actual audio. If no usable voice is available, create a **silent captions-first MP4** and state the limitation. Never pretend narration exists. Do not use unlicensed background music.
5. Render PNG evidence for hook/mid/end. Inspect them visually, run ffprobe on the produced MP4, fix defects and document technical specs, factual checks and any limitations in `out/QA_REPORT.md`.
6. Commit **only reproducible source files and documentation** to this feature branch or present a reviewable PR; do not commit generated large MP4 unless file size and repo policy justify it. Share the video itself directly as a downloadable Work artifact and the three proof images if supported. If artifacts cannot be transferred through GitHub, give me an explicit accessible download through Work (not an invented URL).
7. Do **not** post to TikTok, spend money, add credentials/secrets, or modify my other GitHub projects. Let me inspect the video first.

Success means: I receive an actual playable MP4 and reproducible project code, with factual English and no fabricated claims. If anything blocks rendering or sharing, show the exact blocker and provide the most complete verified result rather than claiming it is done.
