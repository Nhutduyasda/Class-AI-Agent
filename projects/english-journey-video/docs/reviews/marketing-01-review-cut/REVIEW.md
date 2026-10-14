# Marketing Video 01 — review cut

Status: actual render; technical QA PASS after final rerender; subjective comparison INCOMPLETE; publication NOT APPROVED.

## Baseline provenance
Existing owner-requested Nam Minh export, english-journey-marketing-video-01-nam-minh.mp4, retrieved from the prior deliverable. SHA256 8e56d06c8c0c4b50fa78a318414568c6d93c886f5a841f7b8c528b8c2c91af7a. Baseline file preserved byte-for-byte. Fresh audio/timeline built with the existing locked-script pipeline. Existing baseline passes standard QA against reconstructed source: correlation 0.99914550, mux lag 0.0 ms.

## Inspection and focused changes
- Hook at 0, 1, 2.5s: target user and problem already visible, no logo-only delay. Baseline illustration static; revision animates the dashed connection and gently accents the question mark. All opening text stays visible from frame 0. This is a modest visual change, not evidence of higher retention.
- Layout: still samples reserve right rail and bottom area; unchanged caption band. Solution baseline settles all rows well before the voice lists Reading (26.82s), Vocabulary (27.56s), error tracking (28.52s). Revision leaves rows slightly scattered then aligns each on those real token anchors. A first rendered attempt crowded rows; final attempt removes vertical travel and caps rotation at ±2 degrees.
- Pacing: 65.33s exceeds approved 45–55s target; NOT MET. Hook scene lasts 6s, solution 13.33s and demo 17.33s. Narration is unchanged at +0%; no accelerated speech or arbitrary shortening. Whether these holds feel slow requires full watching/listening.
- Voice: owner-selected Nam Minh retained. No new emotional-direction or pronunciation PASS claimed. Full listening unavailable: BLOCKED.
- Communication: authentic BEFORE/AFTER, two spelling errors and missing and remain; original SVG/React illustrations, no fake chat screenshots. Error Log remains explicit logging; single comment BẮT ĐẦU CTA preserved. Cold-viewer comprehension and persuasion NOT EVALUATED.

## Skill audit
All three new skills read: editorial-shot-planning requires exact copy and actual timings; video-self-review separates decoded media evidence from perception; video-version-comparison requires real reverse-order watches. Five reviewer tests plus six voice-timing tests PASS (11 total), TypeScript PASS. These tests do not certify creative quality. The unfilled pairwise worksheet yields INCOMPLETE with no winner, intentionally.

## Rights and cost
No SeeCut code/assets imported. Existing original SVG, algorithmic score/SFX and DejaVu font reused. No paid calls. Existing Edge consumer voice commercial rights remain NOT VERIFIED: review-only pilot, commercial publication blocked pending rights clearance or consented human recording.

## Reproduce
`npm ci`; `npm run build:marketing`; `npm run test:review`; `npm run test:voice`; `npm run typecheck`; `npm run render:marketing -- --revision`; `npm run qa:marketing -- out/english-journey-marketing-video-01-review-cut.mp4`. Baseline rendering command remains unchanged; revision is opt-in. In this sandbox Node os.networkInterfaces fails with uv_interface_addresses EPERM; a temporary, uncommitted preload supplies IPv4 loopback only on that error for Remotion local serving. Browser downloaded by Remotion. No renderer safeguards disabled.

## Handoff
MP4 plus baseline MP4, actual decoded proof frames, two WAV clips per version, exact transcript/subtitles, timeline, source/export technical metrics and blank human pairwise worksheet in review evidence archive. A/B preference INCOMPLETE. Full temporal review, emotion, pronunciation, phone playback and real TikTok-overlay check remain BLOCKED / NOT EVALUATED. No main merge or TikTok publishing.

## Final measured evidence

| Check | Baseline | Candidate |
|---|---|---|
| Resolution / FPS | 1080×1920 / 30 | 1080×1920 / 30 |
| Duration | 65.333s | 65.333s |
| Codec | H.264 + AAC | H.264 + AAC |
| Copy lock | PASS | PASS |
| Loudness | -16.19 LUFS | -16.20 LUFS |
| True peak | -1.47 dBTP | -1.47 dBTP |
| Mux lag | 0ms | 0ms |

Candidate SHA256: e2214bb36e37b2a83a6f61e96f2addf62d6bd2af6c44914e59b546ace8232c54. Final decoded samples inspected at opening, 1s, 2.5s, six scene midpoints and corrected sentence; extra side-by-side frames at 1, 24.67, 27.2 and 29.5s show the limited visual change. Final solution midpoint is legible without row collision. This is frame inspection, not full video perception.
