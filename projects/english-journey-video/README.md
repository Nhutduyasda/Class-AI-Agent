# English Journey — rendered TikTok pilot

A local Remotion/React pipeline for truthful, text-led Vietnamese English lessons. No paid API, remote font, stock footage, music, ChatGPT screenshot, or publishing integration is required.

## Render again

Requirements: Node.js 22+ (tested 24.19.0), npm, FFmpeg/ffprobe on PATH, and a Chromium-compatible browser. Dependencies and a browser are downloaded on first setup; no voice service is used.

```bash
cd projects/english-journey-video
npm ci
npx remotion browser ensure
npm run typecheck
npm run proofs
npm run render
npm run qa
```

Outputs are in `out/`: `lesson15-writing-retry.mp4`, three requested decoded proof PNGs (`proof-hook`, `proof-middle`, `proof-end`), two extra BEFORE/AFTER proofs, `ffprobe.json`, and an SRT reading transcript. `npm run studio` opens the editing preview. Optional `CHROME_PATH=/absolute/path/to/chrome` selects an installed browser.

**This pilot is silent captions-only.** Natural free Vietnamese TTS was not installed in the execution environment; paid voice tools were not used. Captions are editorial reading cues, not speech alignment or fabricated word timestamps. The SRT provides the lesson reading transcript, not a claimed voice transcription.

## Source and reuse

- `src/index.tsx`: composition registration, Zod schema and metadata from brief.
- `src/Video.tsx`: five scene templates, original shapes, exact English strings from brief, frame-driven motion and progress.
- `src/story.ts`: validated brief and Vietnamese editorial reading cues.
- `scripts/shared.mjs`: brief loading, continuity validation and bundling.
- `scripts/render.mjs`: H.264 MP4 rendering, 2 concurrent workers, CRF 18, yuv420p.
- `scripts/proofs.mjs`: pre-render layout stills.
- `scripts/qa.mjs`: actual MP4 probing, full decode, proof-frame extraction and SRT.
- `public/fonts/`: bundled DejaVu Sans regular/bold with upstream license, supporting Vietnamese offline.

For another correction lesson, duplicate `briefs/pilot-lesson15.json`, update approved sentences, beat text and timeline, and revise the editorial teaching cards/cues in `src/Video.tsx` and `src/story.ts` for the actual lesson. This is a reusable five-beat template, **not an automatic grammar checker**. Pass the new brief to each production script:

```bash
npm run proofs -- briefs/my-lesson.json
npm run render -- briefs/my-lesson.json
npm run qa -- briefs/my-lesson.json
```

Keep width/height/FPS at 1080/1920/30. All five beats must cover the duration without gaps. Review every lesson's teaching text and proof stills before rendering. Do not reuse Lesson 15 copy for an unrelated mistake. Remotion Studio opens with the pilot defaults; use its composition props for alternatives.

## Pilot timing and design

0–4s hook; 4–11s exact BEFORE; 11–18s two error categories; 18–27s exact AFTER; 27–30s grounded practice payoff. The first frame contains the hook. Cards slide 16px into place over 0.28 seconds; no fade from black, no frame-timed text removal within the corrected sentence. Captions change by short editorial phrases. The entire AFTER sentence stays readable for nine seconds.

Critical content sits within x=96…920 and y=250…1555, leaving the right 160px and bottom 365px clear. Preview images must be checked on a phone before publication; platform overlays vary. The safe margin is a design precaution, not a platform guarantee.

## Environment-specific execution note

The ChatGPT render host denied Node's network-interface enumeration (`uv_interface_addresses`); the production run used a temporary preload outside the repository that falls back to the loopback interface only when that system call fails. This does not modify dependencies or video source and is not needed on a normal developer machine. The browser was downloaded by Remotion. No cloud deploy or TikTok publishing occurred.

## QA and review

See `docs/PILOT_QA_REPORT.md` for the measured output, inspections and limitations, and `docs/QA_CHECKLIST.md` for acceptance criteria. Output binaries stay ignored in Git. Source changes belong to `feat/english-journey-video-agent-pilot`; owner approval is required before posting.

## Skills and licenses

All four project skill files were read before production. Story and production rules take priority over unverified upstream retention heuristics. Silent phrase captions intentionally omit karaoke and voice alignment. Vendored short-form/caption skills retain the upstream MIT license in `third_party/`; bundled font licensing is in `public/fonts/LICENSE.txt`.
