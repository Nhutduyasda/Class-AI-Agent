# Gate 1B — final integration verification

Starting HEAD independently verified with fetch and GitHub PR #10: `8f8aa3b3c3f8dc5ca438c6ab34958f60f51cb9ce`. Existing branch and Draft PR base remain unchanged. This is targeted offline hardening; no Gate 2 persistent ledger/credential/control-plane implementation.

## Demonstrated corrections

- A forged state/revision pair previously passed resume; state index and revision must now agree in resume and transition.
- RENDER_PLANNED resume previously skipped saved-plan integrity checks; it now checks the plan before rendering.
- Already-overdrawn persisted ledger could return an idempotent reservation before validating its aggregate balance; aggregate validation now precedes the cached return.
- Product name was not bound to evidence even though attributes/claims were; a matching evidence value is now required. Evidence expiry must follow capture time. Manual provenance remains owner-supplied data, not a verified marketplace fact.
- FFmpeg paths embedded absolute filenames in filter strings and fixed a Linux font. Caption/font basenames now resolve in the per-run working directory; font is copied from a platform candidate or explicit --font input. Unique pending files and a whole-run exclusive lock prevent concurrent temporary-file clobbering. Crash-stale locks fail closed; only remove after confirming no process is running and preserving evidence.
- Generic Remotion previously omitted audio completely. A browser-safe playback contract now carries audio SHA/sample rate/sample count/observed duration and exact canonical caption intervals. Node-side media verifier checks raw bytes, probe metadata, decode and path containment before starting the renderer.
- Timeline continuity, caption coverage/copy, asset visibility/review/type bindings and non-finite duration metadata now fail closed. Explicit invalid browser paths cannot silently select a different browser.

## Real runtime evidence

The actual entry point is `src/auto-factory/Composition.tsx`, composition `AutoFactory`. `scripts/auto-factory/remotion.ts` uses @remotion/bundler and renderer 4.0.535; selectComposition resolves inputProps and dynamic metadata, then renderMedia produces the MP4. FFmpeg only creates the synthetic tone and performs independent decode/probe/proof extraction; it is not a replacement renderer in this path.

Pinned setup: the installed Remotion 4.0.535 source (`dist/browser/get-chrome-download-url.js`, BrowserFetcher cache marker) selects Chromium Headless Shell 157.0.8080.0, remotion-v3 build. Existing compatible browser discovery ran first; the owner-authorized development setup downloaded that exact version through ensureBrowser. No cloud resource or paid API. Default render command does not install a browser: setup is an explicit separate `--install-browser` command. Standard Windows Chrome/Edge or an explicit `--browser PATH` are supported discovery candidates; version is recorded per run.

Three actual exports: learning 660 frames / 22 seconds, phone-case 720 frames / 24 seconds, fashion 720 frames / 24 seconds. The learning fixture deliberately differs from the 24-second default to verify dynamic duration. Each output is 1080×1920, 30 fps H.264/yuv420p and AAC, full decoded. AAC/container duration may include encoder padding (learning observed 22.016s); video frame count is exact and format tolerance is 50ms. Original WAV is 48kHz PCM with observed sample duration verified. The audio is a low-volume 440Hz offline sine tone, not silence disguised as narration and not a voice sample.

Proof PNGs are extracted from the actual encoded output at frame zero, every scene boundary minus one and at the boundary, and the final frame. Boundary images change; inspected learning example frame shows the canonical English sentence and expected scene color/label. Whole-file/PNG hashes are integrity receipts, not proof of speech alignment or an automatic claim that every glyph is correct. Media/plan/QA/review JSON includes exact hashes and versions in `gate1b-evidence/`.

Output reproducibility means the checked-in fixture, plan, renderer versions and command reproduce the same scene/timing contract. It does not promise byte-identical H.264 across OS/font/browser/encoder changes. Every output has its own raw-byte SHA receipt. Dynamic plan changes invalidate earlier receipts.

## QA authority

- OFFLINE_FIXTURE_PASS: offline format/decode checks passed.
- REMOTION_RENDER_PASS: renderMedia executed and its actual output passed checks.
- AUDIO_ALIGNMENT_UNVERIFIED: tone and canonical scene captions test playback plumbing only; authentic speech alignment is not measured.
- PRESENTER_ASSET_UNVERIFIED: no authentic Minh visual has been imported or generated.
- TECHNICAL_PRODUCTION_QA_PASS: **not granted**; production loudness, real speech timing, source authenticity and full acceptance are outside these fixtures.
- HUMAN_REVIEW_PENDING: full owner review remains pending; publicationAllowed=false on every queue item.

Subjective pronunciation, natural bilingual transitions and emotional narration are DEFERRED TO GATE 3. No Azure call, voice cloning, paid audition or real marketplace fetching occurred.

## Presenter asset readiness

The shared identity remains minh-main. Plans support all six visibility modes. NO_PRESENTER and VOICE_ONLY use no visible asset; visible assets can bind HANDS_ONLY, FACE_ONLY, HALF_BODY or FULL_BODY. The manifest carries asset ID, presenter ID, local logical filename, SHA-256, MIME type, width/height, rights basis, usage restrictions, source reference, visibility and review status. Only reviewed offline assets can enter an offline render. Identity remains explicitly unverified even for an approved fixture asset. Local file metadata/hash must match the manifest; paths/URLs cannot initiate an external fetch.

No owner reference image is used in these render inputs. No substitute is presented as the real Minh. Future adapter boundary: a still-image adapter supplies PNG/JPEG with crop/visibility metadata; hands-only footage and half/full-body footage supply MP4 with dimension/duration/rights receipts; an optional lip-sync/avatar provider would supply an artifact through the same verified local-media interface, with its own future consent, capability, cost and license approval. The renderer is not coupled to an image-generation service. Live providers are not implemented here.

## Cross-platform procedure and limits

Executed on Linux x64, Node 24.19.0 native TypeScript, Remotion 4.0.535, Chromium 157.0.8080.0 and FFmpeg/ffprobe 6.1.1. Node native TS needs explicit .ts imports; project noEmit typecheck now permits them. No package/dependency upgrades. Browser JSX imports remain bundle-resolved. No PowerShell launcher executes or reads secrets. Windows execution is UNVERIFIED; do not claim a Windows PASS from Linux tests.

Windows 11 PowerShell, from projects/english-journey-video (install Node 24.19.0 and FFmpeg/ffprobe with libx264 on PATH first):

```powershell
node --version
ffmpeg -version
ffprobe -version
npm ci --ignore-scripts --no-audit --no-fund
node scripts/auto-factory/remotion.ts --install-browser
node scripts/auto-factory/remotion.ts
# Or explicitly select an existing compatible browser:
node scripts/auto-factory/remotion.ts --browser 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node --test scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts
node --test scripts/auto-factory/remotion.test.ts
npm run typecheck
# Optional legacy FFmpeg fixture harness, with explicit installed font:
node scripts/auto-factory/run.ts --font 'C:\Windows\Fonts\arial.ttf'
node --test scripts/auto-factory/render.test.ts
```

The browser bootstrap is a development software download, not paid production. If proxy/CDN policy prevents it, use a compatible existing browser path or report BLOCKED; do not relabel FFmpeg output as Remotion. Unicode working directories use Node path/file APIs and shell-free argument arrays; FFmpeg filters see only fixed ASCII local filenames. Unit tests exercise a Unicode temporary root. Font availability and Windows launch still require the above actual owner-machine check. Media is created under isolated new Gate 1B paths; historical video folders are untouched. No font/browser binary is included in the handoff bundle.

## Verification results and decision

**Gate 1B: PASS for the requested offline integration scope.** No unresolved critical defect was demonstrated after the corrections and checks below. This is not production, Windows, authentic presenter, voice quality or marketplace readiness.

- Existing Gate 1 contract tests plus new hardening tests: **52/52 PASS** (34 existing + 18 new).
- Actual Remotion MP4/media integration tests: **4/4 PASS**, including non-silent tone in rendered AAC and actual PNG metadata validation with identity still unverified.
- Prior FFmpeg fixture integration tests: **5/5 PASS**.
- Prior offline Node regression subset: **93/93 PASS**.
- Full historical Node discovery: **95 PASS / 2 FAIL**, unchanged absent Video 03 timeline and Video 04 ledger/WAV production files. No historical media was manufactured.
- Python DSP **6/6 PASS**, phrase tests **4/4 PASS**.
- Project and standalone CLI/test TypeScript checks PASS. Diff whitespace check PASS.
- Linux Unicode + apostrophe output-root smoke run: three FFmpeg fixture exports succeed with copied font and relative filter inputs. Windows runtime remains UNVERIFIED.

Commands executed include:
```sh
node --test scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts
node scripts/auto-factory/remotion.ts
node --test scripts/auto-factory/remotion.test.ts
node --test scripts/auto-factory/render.test.ts
node --test scripts/bilingual/*.test.mjs scripts/marketing05/*.test.mjs scripts/review/*.test.mjs scripts/marketing03/auth.test.mjs scripts/marketing03/direct-audio.test.mjs scripts/marketing02/*.test.mjs scripts/voiceover/*.test.mjs
python3 scripts/bilingual/audio_test.py
python3 scripts/marketing05/observed_test.py
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --esModuleInterop --skipLibCheck scripts/auto-factory/*.ts
```
Full historical discovery additionally includes scripts/marketing03/production.test.mjs and scripts/marketing04/*.test.mjs. Complete logs are retained beside this report. Gate 1B changes only offline engine/contract/test/docs and a TypeScript compiler compatibility flag; historical Video 01–05 files, dependency pins and workflows are unchanged. No merge, paid calls, secret/credential access, live product request or scheduling. Stop here; Gate 2 needs a separate owner instruction.
