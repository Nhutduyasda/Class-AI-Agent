# English Journey Lesson 15 — Pilot QA

Status: **PASS — actual MP4 rendered and verified; ready for owner review.**

## Deliverable and measured encode

- Output: `out/lesson15-writing-retry.mp4`
- Resolution: **1080 × 1920**, portrait 9:16; square pixels.
- Frame rate: **30/1 FPS** (constant); **900 decoded frames**.
- Duration: **30.000000 seconds**.
- Video: **H.264**, High profile, **yuv420p**; MP4 container.
- Size: **693,471 bytes** (approximately 677 KiB).
- Audio: **none — silent captions-only**. No installed suitable natural Vietnamese TTS was available. No music, paid voice/API, or fake audio-alignment claim.
- Full FFmpeg decode completed without errors. Blackdetect produced no black-interval warnings.
- Machine probe details: `out/ffprobe.json`. `npm run qa` repeats probe, duration/frame/dimension assertions, full decode, proof extraction and SRT export.

## Content checks

BEFORE (exact brief text; errors intentional):

> After work I went to the supermarke bought food yesteday

AFTER (exact approved brief text):

> After work yesterday, I went to the supermarket and bought food for dinner.

The components render `facts.original` and `facts.revised` directly. Runtime checks also require corresponding beat text to match. Original errors are confined to the labeled BEFORE card. Teaching cards use the correct spellings `supermarket` and `yesterday`, then show `went … and bought …` to teach the conjunction. These are the two teaching categories. The revised sentence uses past-tense `went` and `bought` correctly.

The AFTER caption explains natural placement of `yesterday`; it does not claim the original end position is always ungrammatical. `for dinner` is explicitly identified as added meaning during rewriting, rather than a mandatory grammar correction. No TOEIC score, fluency guarantee or learning-effect claim was added.

## Visual and timing checks

- Pre-render layout images inspected for all five scenes.
- Final proof images **decoded from the actual MP4** inspected: hook frame 0 (0s), middle frame 450 (15s), final frame 899 (29.9667s).
- Extra actual-MP4 BEFORE (frame 180, 6s) and AFTER (frame 660, 22s) inspected, confirming full English strings and wrapping.
- Scene-boundary frames 120, 330, 540, 675 and 810 inspected in `out/transition-check.png`; no missing text, black frame, clipped card or transient overlap observed.
- Hook already visible at frame zero; no fade from black. Text motion is frame-driven, with a restrained 16px scene entrance over 0.28 seconds.
- BEFORE held 7 seconds; complete AFTER sentence held 9 seconds. Five-beat duration totals 30 seconds without gaps.
- DejaVu Sans regular/bold bundled locally. Font coverage check found **zero missing non-ASCII glyphs** in source. Vietnamese diacritics, curly quotation marks and arrows visually checked.
- Main text and captions remain within x=96…920 and y=250…1555. Right 160px and bottom 365px reserved; Vietnamese phrase captions at y=1280 with clear contrast. Full-size PNGs retain readable text with no clipping.
- The final scene stays visible through the last frame. It closes the learning payoff; it does not attempt a seamless first/last-frame loop.

## Source verification and scope

- Read project AGENTS.md, README, pilot brief, all four project skills and QA checklist before editing.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Pinned dependency versions; Remotion browser downloaded and used for actual render.
- Documented temporary host-only loopback workaround for Node network-interface enumeration. Normal render commands and optional CHROME_PATH are in README.
- Only `projects/english-journey-video/` source files changed. Binaries remain Git-ignored.
- Original shapes/text and permitted bundled font only; no copyrighted soundtrack, fake chat screenshots or personal data.
- No TikTok upload, deployment, paid service, main-branch merge or other-project edits.

## Known limits and review

This is a silent pilot, not a narrated video. The SRT is a reading transcript, not a speech transcription. The five-scene renderer is reusable, but new lessons require manual verification of their Vietnamese teaching cards/cues. No audience retention performance is promised. Platform overlays differ: owner should preview on an actual phone and approve content before posting. Visual inspection used the rendered export's decoded frames plus full-stream integrity checks; no claim of a human watching the video on TikTok is made.
