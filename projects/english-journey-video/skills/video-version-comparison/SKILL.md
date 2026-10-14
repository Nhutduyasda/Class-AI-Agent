---
name: video-version-comparison
description: Compare two genuine renders in counterbalanced order and preserve explicit reviewer evidence without inventing AI judgments.
---

# Video version comparison

Compare the old and revised Marketing Video 01 only when both real video files exist. Never compare a generated storyboard to a rendered MP4.

## Evidence protocol
- Prepare both candidates with npm run review:prepare -- --candidate <candidate.mp4> --baseline <baseline.mp4> --timeline <timeline.json> --brief <approved-brief.json>.
- Watch both videos end-to-end and listen with speech/music in place (or ask an actual video-capable reviewer to do so).
- Pass 1: present candidate first, baseline second. Pass 2: reverse their order. Write observations without consulting pass 1 while judging pass 2 if possible.
- In each pass record preference as candidate/baseline/tie, concrete timestamped reasons, and whether the full video was viewed and heard.
- Dimensions: problem understandable by 3s, clear marketing story, voice expressiveness, music balance, pacing, visual proof credibility, readable captions, single CTA.
- Submit the completed worksheet to npm run review:compare -- --input <review.json> [--output <report.json>].
- The script reports candidate wins ONLY if both valid passes select candidate; disagreement is inconclusive and retains existing baseline.

## Decisions
Technical PASS does not mean editorial PASS. A two-pass win is advisory only. Owner must explicitly approve the final video for publication. Keep the signed-off copy fixed. Preserve both renders, licenses and audit trail. Never invent results when watching/listening tools are absent.
