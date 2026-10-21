# Auto Factory dashboard — local demo guide

Prerequisites: Node 24.19+ and npm; run in `projects/english-journey-video/dashboard/`. No `.env`, Azure key, GitHub token, Supabase project or login required.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run api
```

Open a second terminal in the same directory:

```sh
npm run dev
```

Open `http://127.0.0.1:5173/` on the same machine. API listens only on `127.0.0.1:4174`. Do not expose either process to the internet or a shared network. `npm run build` checks TypeScript and compiles static frontend; `npm test` checks the local server contracts. Node 24 supports native TypeScript stripping; Windows PowerShell uses the same npm commands. Windows browser/runtime execution has not been verified by this report.

Choose English Learning, select one of the two offline A1 lessons, set duration, voice direction and allowed presenter visibility, then save a draft. Product Showcase accepts manual Shopee/TikTok Shop HTTPS references; enter product name, claim, matching evidenced attribute, source label and time. It does not open the URL. A missing field or unsupported claim is an error. Only synthetic fixture media is available here; do not import unlicensed product imagery. Drafts appear in Video Jobs and Preview & Review with absent media marked clearly.

If `out/auto-factory-remotion/` contains the verified Gate 1B fixture MP4s plus QA, plan and review JSON, Preview & Review offers a playable local fixture. These are geometric layouts with synthetic tone. Inspect captions and QA, add a note and approve/reject once. Each decision is pinned to the exact artifact hash and revision; it is a demo review, never publication authorization. Export captions from the review panel. If fixtures are absent or corrupted, the list is empty and no video is pretended to exist.

Presenter Minh is text identity only. Voice Profiles are direction metadata; paid synthesis is disabled. Budget and Scheduling show policy, UNVERIFIED account balance and disabled operations. Closing/restarting the API clears draft and review changes. A browser refresh while API stays running retains memory state.

For UI regression and four real screenshots run `npm run test:browser` from the dashboard directory. This starts the local API, Vite and the Gate 1B Chromium Headless Shell, runs browser interactions at desktop/mobile widths, and stops the owned processes. The script expects Gate 1B fixtures for video preview. You can set `BROWSER_EXECUTABLE` to a compatible local Chromium path; Windows automation remains unverified. A standalone browser is optional for normal demo use.
