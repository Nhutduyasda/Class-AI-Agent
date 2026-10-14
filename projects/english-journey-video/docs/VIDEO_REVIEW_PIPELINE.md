# English Journey — Video QA upgrade (Remotion retained)

**Scope:** independent editorial planning, measurable export checks and honest A/B review of Marketing Video 01. The previously approved six-stage narration remains locked. This work does NOT vendor SeeCut or its non-commercially licensed scripts; no SeeCut source, templates or assets were copied.

## How this fits existing video production

Existing production commands stay unchanged:
- npm run build:marketing
- npm run typecheck
- npm run proofs:marketing
- npm run render:marketing
- npm run qa:marketing

Then prepare evidence from a real MP4:

    npm run test:review
    npm run review:prepare -- --candidate out/english-journey-marketing-video-01.mp4 --timeline out/marketing-timeline.json --brief briefs/marketing-video-01-approved.json

Optional baseline (must be a separate, actually rendered MP4):

    npm run review:prepare -- --candidate out/english-journey-marketing-video-01-v2.mp4 --baseline out/english-journey-marketing-video-01.mp4 --timeline out/marketing-timeline.json --brief briefs/marketing-video-01-approved.json --output out/video-review-v2

Outputs go to out/video-review (ignored/generated media). Per video: ffprobe technical results, selected decoded JPEG frames at hook and all scene midpoints, hook/end WAV clips, actionable report.json. A template for human/video-native review is written alongside.

## Counterbalanced comparison

After two actual full watches and full listening sessions, fill in both passes in pairwise-template.json, with nonempty reasons and the actual observations. Pass 1 order = candidate then baseline; Pass 2 = baseline then candidate. A reviewer should compare the videos, not metadata, and mark those facts truthfully.

    npm run review:compare -- --input out/video-review/pairwise-template.json --output out/video-review/comparison.json

Only two consistent validated preferences constitute a candidate win. A tie or disagreement gives INCONCLUSIVE. Missing reviews are INCOMPLETE. The report never grants publication approval.

## Why this helps

Existing marketing QA validates files, timing and audio streams, but cannot prove a person understands the context or hears a natural voice. The new proof pack intentionally samples the hook in the first 3s and every narrative stage. A human or genuinely video-capable reviewer must still judge whether the creative communication improves. This keeps the cheap reproducible Remotion stack rather than adopting a different renderer/CLI.

## Rights and deployment

- This project is commercial-intent marketing; do not import SeeCut assets or code (PolyForm Noncommercial license).
- Only run local tooling and services already approved. Do not use paid voice, music, avatars or video review APIs without owner approval.
- Do not publish, merge to main or claim a video is ready before owner decision.
- Large generated files remain out of Git. Commit only scripts, prompts, skill instructions and QA summaries without private data.
- If an environment lacks FFmpeg, an MP4 or video watching/listening, report BLOCKED with exact missing capability rather than a fictitious PASS.
