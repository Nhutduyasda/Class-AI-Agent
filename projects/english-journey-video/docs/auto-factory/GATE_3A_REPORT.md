# Gate 3A — dashboard offline MVP

Baseline: PR #10 HEAD `9364b2c8010fb0ea9da2f21d882f93ed6f078445`; Gate 2 report records implementation PASS and hosted production NO-GO. Gate 3A changes only the new `dashboard/` directory and these three docs. Draft PR base remains Video 05. No Video 01–05 history, Remotion composition, control journal, workflow, cloud resource or secret is changed.

## Implemented and evidence

React 19 + Vite 7 + TypeScript app in `dashboard/` has eight responsive screens: Overview, English Learning, Product Showcase, Video Jobs, Preview & Review, Presenter Minh, Voice Profiles, Budget & Scheduling. The local loopback API, not the browser, creates IDs, checks revisions and SHA-256 for review, and validates input with Zod plus the existing Gate 1 engine's `plan`, `validateUrl` and `visibilityPolicy`. The browser imports only `dashboard/src/contracts.ts`, not Node video execution code. API/adapter is replaceable; this local transport is not a hosted backend.

English creation is limited to two prepared A1 micro-lessons (24 seconds default, 20–35 supported); explicit spans route standalone English to Andrew and Vietnamese to Nam Minh in engine validation. No speech generated. Product manual input requires allowlisted HTTPS domain, claim exactly matching its evidenced attribute, source label and fresh capture time; missing/stale/price/hands-on assertions fail. The server never fetches the URL. The synthetic geometric asset contract is OFFLINE_DEMO_ONLY; a text source label is not independent proof of product truth or commercial media rights. A draft is VALIDATED with no MP4, no QA and no charge. UI shows missing media as missing.

When local Gate 1B MP4s exist, the API reads known fixed fixture paths, validates plan/review schemas and verifies video SHA and plan SHA against QA and review metadata, then serves only on loopback. Browser preview, scene captions, technical QA and accept/reject with notes work against exact SHA/revision; acceptance changes only ephemeral demo state and cannot publish. The fixture carries synthetic tone, no speech, and no authentic Minh imagery. Absent/corrupted fixture is omitted, not fabricated. No private production media URL exists; loopback fixture URL must never be deployed publicly.

Budget display separates owner-declared $10 ($8 production / $2 reserve), $0.08/video planned ceiling, estimated draft ceilings and $0 mock confirmed charges. Actual provider balance UNVERIFIED. Paid execution, scheduler, publication and hosted operation have no implementation in this dashboard.

The mock identity `local-demo-owner` is explicitly `UNTRUSTED_DEMO`; it provides no authentication. State is memory-only and resets when the API restarts. A disabled scheduling button and no dispatch endpoint make this demo non-operational for production.

## Verification

Linux x64, Node v24.19.0, Chromium Headless Shell 157.0.8080.0-remotion-v3, Vite 7.1.12, React 19.2.0. `npm ci --ignore-scripts --no-audit --no-fund` in dashboard, `npm run build`, `npm test`, `npm run test:browser` (starts both loopback servers and pinned Chromium in the same network namespace). Browser test covers eight nav pages, one learning draft, empty product rejection, fixture video element and four actual screenshots; widths 1440×900 and 390×844, no horizontal overflow. Screenshots in `dashboard/evidence/desktop-overview.png`, `desktop-review.png`, `mobile-overview.png`, `mobile-product.png`. Chrome internal `data:` icons are not external network calls; application requests are loopback-only.

A browser-discovered local datetime bug was corrected: the product evidence field now initializes with local wall-clock input instead of UTC text, preventing a valid current timestamp from being parsed as future in another timezone. An old ignored FFmpeg run.lock was inspected (empty, no owner process) and removed for the repeat run; first run failed on the lock, repeat passed.

Prior regressions: Gate 2 control 36 tests; Gate 1B engine/hardening 52; Remotion 4; FFmpeg fixture 5; prior offline Node 93; DSP 6; phrase 4. Full historical discovery has the same two missing-media failures (Video 03/04), no replacement files. Exact current command output and counts should be attached in PR review evidence; tests must be rerun after source changes. Windows execution remains UNVERIFIED.

## Decision and limits

Gate 3A PASS for the local demo: dashboard 5/5, browser navigation/forms/review/media/responsive check PASS, all current offline regressions green. Remote production NO-GO: actual authentication/authorization, durable job/review persistence, private media storage, CSRF/rate limits, hosted Git journal trust, credential isolation and owner-approved cloud deployment are absent. Hosted provider free-tier figures are account-dependent; see WEB_DEPLOYMENT_READINESS.md. No real product truth, authentic media, speech, voice quality, production QA or publication is asserted. Gate 3B/4 require separate authorization.
