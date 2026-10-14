---
name: production-qa
description: Verify a rendered TikTok English education video end to end, including factual English text, legibility, audio alignment, formatting and file integrity.
version: 1.0.0
---

# Production QA

## Pre-render
- Compare every displayed English text span to the brief; preserve "wrong" errors intentionally only in BEFORE frames.
- Confirm contrast, safe zone (reserve bottom 320px and right action rail) and Vietnamese diacritics.
- Use only original or permitted materials, no fabricated testimonials.

## Render checks
- Final MP4 exists, playable video stream, 1080x1920 portrait, 30 fps, duration 25–40 sec for the silent pilot or 35–45 sec for the voice upgrade.
- If narration claimed, require an actual audio stream, measured loudness/peak, real word timestamps, and complete uncut speech within each scene. Listen to the final export for Vietnamese/English pronunciation and sync; if listening is unavailable, mark that gate blocked instead of claiming PASS. If voice omitted, say "silent captions-only" in QA report.
- Inspect first, middle, end proof PNGs plus actual exported MP4; check hook, revised sentence duration, safe area and text clipping.
- Run ffprobe and log video/audio codecs, dimensions, frame rate, duration and file size.
- No abrupt black frames or obvious glitch in final scene.

## Output
`out/lesson15-writing-retry.mp4`
`out/proof-hook.png`
`out/proof-middle.png`
`out/proof-end.png`
`out/QA_REPORT.md`

If verification is blocked, be explicit; do not mark unrendered work as done. No posting/uploading TikTok until owner approves.
