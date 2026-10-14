# English Journey — TikTok Video Agent (pilot)

A small, review-first video pipeline for the **English Journey** Vietnamese English-learning journal. This folder is isolated inside the existing repository and does not modify its top-level AI Agent configuration.

**Status:** folder/skills and pilot brief prepared. The Remotion renderer and MP4 are an explicit *ChatGPT Work* implementation task; they are **not** already generated.

## Start with Work

1. Open ChatGPT **Work** mode and connect the GitHub repository `Nhutduyasda/Class-AI-Agent`.
2. Choose branch `feat/english-journey-video-agent-pilot` (do not modify `main`).
3. Paste the exact instructions in [prompts/WORK_VIDEO_PILOT.md](prompts/WORK_VIDEO_PILOT.md).
4. Ask Work to produce **one** actual vertical MP4, show 3 sample frames and share the output for your approval. Do **not** auto-post it.
5. Review English correctness and factual accuracy before posting.

## Skills

| Folder | Purpose | Source |
| --- | --- | --- |
| `skills/short-form-video/` | Vertical 9:16 structure, hooks, pacing and retention-aware edits | vendored iart-ai, MIT |
| `skills/caption-animation/` | Voice-aligned captions and smartphone safe areas | vendored iart-ai, MIT |
| `skills/english-journey-story/` | Evidence-based, trustworthy English-learning storyboards | local |
| `skills/production-qa/` | Correct text/audio/technical output checks | local |

The first two folders (including `references/`) are copies from [iart-ai/tiktok-video-skills](https://github.com/iart-ai/tiktok-video-skills), reproduced under the upstream MIT license in `third_party/`. Do not assume other upstream packs are installed. Countdown and broadcast lower-thirds are intentionally omitted from this pilot.

## Pilot
- Brief: [briefs/pilot-lesson15.json](briefs/pilot-lesson15.json)
- Work prompt: [prompts/WORK_VIDEO_PILOT.md](prompts/WORK_VIDEO_PILOT.md)
- Source footage: none needed; use text-led motion graphics, not a fabricated ChatGPT screenshot.
- Assets: original shapes and text only; narration optional, with disclosure in handoff.
- Expected: `out/lesson15-writing-retry.mp4` (1080x1920 portrait, about 30 seconds), 3 PNG proof frames, and a short QA report.

## Guardrails
- The English learning evidence must be exact; do not claim the user passed TOEIC 790 or promise rapid fluency.
- Include no personal information, login tokens, copyrighted music, watermark, impersonation or fabricated audience testimonials.
- Do not post or publish externally without explicit owner approval.
- Avoid paid API calls, paid voice services or stock subscriptions without owner permission.
- Keep output assets out of Git by default; deliver the MP4 via Work. Commit reproducible source code + brief to the working branch, not `main`.

## Why no ready-to-run renderer yet?
This first commit provides actual skills and a deterministic creative brief. Work will create the renderer, test dependencies, render, and iterate against the QA checklist. This avoids presenting an untested video as completed.
