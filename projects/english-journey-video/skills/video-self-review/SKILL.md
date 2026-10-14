---
name: video-self-review
description: Prepare actual rendered MP4s for objective technical inspection plus evidence-based visual and listening review.
---

# Video self-review — no fabricated perception

## Input and outputs
Input: an existing MP4, optional scene timeline JSON, approved brief JSON. Output: objective probe, proof images at important moments, short audio extracts and a review worksheet. Output is NOT a publication approval.

## Procedure
1. Run npm run review:prepare -- --candidate out/english-journey-marketing-video-01.mp4 --timeline out/marketing-timeline.json --brief briefs/marketing-video-01-approved.json.
2. Read out/video-review/candidate/report.json. Resolve every objective blocker (missing sound, FPS, resolution, invalid timeline).
3. Inspect the rendered proof images, especially frame 0, first 3 seconds, all six scenes and CTA. If Work has a video-native reviewing tool, watch the **whole video**, not just stills.
4. Listen to the actual narration and music in their full temporal context. A speech recognizer or audio-stream detector is not evidence of expressive, natural Vietnamese pronunciation.
5. Create a review with precise timecodes, viewer confusion points, visual fixes, and audio fixes. Keep subjective grades separate from objective test results.
6. Fix no more than two major weaknesses in the next iteration; re-render the real video, prepare a new review package, and repeat at most 3 versions.

## Hard stops
- Technical checks cannot certify emotional quality, marketing persuasion or watch-time retention.
- If tools cannot play video/audio, mark subjective checks BLOCKED / NEEDS HUMAN REVIEW. Do not claim to have watched or listened.
- If script requires a copy change, STOP for owner authorization. No silent rewrite.
- Unclear rights for commercial TTS/music/assets -> publication NOT APPROVED.
- Do not post, spend money or merge main.
