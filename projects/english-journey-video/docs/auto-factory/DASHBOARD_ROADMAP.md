# Auto Video Factory — Remote Web Dashboard Roadmap (Option B)

Decision date: 2026-10-21. Owner selected a website accessible from desktop/mobile anywhere; no PAID hosting, compute, storage, model usage, new resource, credential activation or deployment is authorized by this decision. This is roadmap/design only. Gate 2 has NOT been implemented at this HEAD.

## Product principle and distinction

Owner operates the factory from an authenticated web dashboard; ChatGPT Work and Windows AI Agent are development/maintenance tools, not the day-to-day operating UI. The dashboard is a CONTROL PLANE, not an in-browser Remotion renderer and not a place to keep Azure or GitHub credentials.

A remote dashboard is NOT equivalent to remote video production. Production requires separately secured orchestration, a durable job/ledger store, media retention and render workers. A static site alone cannot generate real videos while the owner's machine is off.

Current code baseline: Gate 1B offline core + real Remotion fixture renders, not hosted execution, authenticated backend, real Azure voices, licensed presenter media or live product ingestion.

## Proposed low-cost architecture (subject to feasibility verification, not provisioned)

- Web UI: TypeScript/React with Vite and shadcn/ui or repo-compatible equivalents; responsive mobile-first, accessible, client receives NO API keys.
- Candidate static hosting: Cloudflare Pages Free for the interface only. Hosting selected/provisioned only after free-tier terms/limits, account access and owner deployment approval are verified.
- Candidate API: Cloudflare Workers/Pages Functions Free for SHORT, authenticated authorization/routing/validation calls. NOT Remotion/FFmpeg: Workers Free CPU limit is too small for media rendering. No public unauthenticated production dispatch.
- Candidate persistence/auth: Supabase Auth + PostgreSQL with owner-scoped RLS, protected media bucket and signed expiring URLs, subject to free-tier/storage/retention constraints and owner approval. Do not reuse unrelated project's database or service_role secrets; a dedicated project is not authorized here.
- Candidate render executor: GitHub Actions trusted immutable runner on approved branch, using the existing TypeScript/Remotion/FFmpeg engine. Must be explicitly authenticated/authorized from server-side only; the dashboard must NEVER hold a GitHub PAT, workflow dispatch token, Azure key or other secret.
- No assumption that any free tier is suitable for sustained media storage, high-volume jobs or commercial growth. Investigate alternatives and disclose restrictions before hosted rollout.
- GitHub Actions scheduled workflows normally need default-branch code; PR #10/main topology is not yet promoted and does not authorize change.
- Work through clear typed interfaces: browser -> authenticated API -> server-owned job request -> protected scheduler/ledger -> trusted render worker -> privately stored artifacts -> review UI. Paid execution never relies on browser-provided budget or job status.

## Minimum dashboard screens — Gate 3A

1. **Sign-in/access guard:** login/logout placeholder and an auth adapter contract; server-owned identity for actual hosted use. A local mock identity may be used only in clearly labeled LOCAL_DEMO_MODE; public hosted preview MUST NOT treat mock auth as access control for private/paid endpoints.
2. **Overview:** jobs by status, upcoming English schedule (DISABLED by default), estimated vs observed usage, protected reserve USD 2, production allocation USD 8, explicit UNVERIFIED real account balance.
3. **Create English Learning:** topic (manual or suggested demo), level, duration 20–35s trial, voice profile, presenter visibility AUTO/NO_PRESENTER/VOICE_ONLY/HANDS_ONLY/FACE_ONLY/HALF_BODY/FULL_BODY as allowed by engine, script preview and unpaid estimate. Must not fabricate verified speech/demo assets.
4. **Create Product Showcase:** Shopee/TikTok Shop HTTPS link with strict allowlist validation; indicate live fetching NOT SUPPORTED in Gate 3A. Collect manual product facts, field evidence/timestamps and licensed media receipts, price optional, disclose promotional status, source/claims audit and explicit hands-on truthfulness. Never imply URLs automatically work without an authorized API.
5. **Presenter/Voice:** shared minh-main identity and visibility guidance by category, asset readiness and rights statuses; learning-clear/review-energetic/narrative-natural/neutral-fallback metadata. Never show a placeholder face as authentic Minh.
6. **Jobs/Review Queue:** list/detail filters, status and immutable artifact identifiers, proof thumbnails, playable synthetic fixture if available, captions preview/export, technical QA status vs HUMAN_REVIEW_PENDING, accept/reject/notes against exact SHA (LOCAL_DEMO_MODE only until real server-owned persistence exists).
7. **Settings & spending:** scheduling toggle disabled with explanation until Gate 4; kill-switch state visibly disabled; hard per-video $0.08 and shared allocation $8 with $2 reserve; no user-editable browser value can override server budget checks.
8. **Responsive usability:** designed for narrow mobile screens and desktop, accessible forms/focus, error/loading/empty states, honest status and privacy indications.

## Architecture and API contracts — Gate 3A

Do not couple React to scripts/auto-factory CLI or give it filesystem/process execution capability.
- Define typed API client/server boundary (e.g. `GET /api/jobs`, `POST /api/jobs/draft`, `GET /api/jobs/{id}`, `POST /api/jobs/{id}/review`, `GET /api/usage`, `GET /api/presenter`, `POST /api/products/validate-input`). Gate 3A route handlers may be local deterministic/mock with explicit contract and fail-closed for remote paid work.
- Reuse Gate 1/1B Zod contracts for modes, evidence, voice, render plan and review. Client-side validation is ergonomic only; server revalidates and owns IDs/revisions, actor permissions, timestamps, pricing and state transitions.
- Model typed job states (DRAFT, NEEDS_OWNER_INPUT, VALIDATED, PENDING_APPROVAL, QUEUED_DISABLED, PROCESSING, QA_BLOCKED, PENDING_OWNER_REVIEW, OWNER_ACCEPTED, OWNER_REJECTED, ERROR) as UI projection only. Actual authority remains Gate 2 event journal. UI cannot synthesize a false `PRODUCTION_QA_PASS`.
- The backend must be replaceable without rewriting UI. Distinguish `MOCK_OFFLINE` vs `AUTHENTICATED_REMOTE` and visually label mode. Never silently dispatch a paid task.
- No remote URL fetch in browser or server for marketplace links. No SSRF, arbitrary redirects, cookies, third-party login, scraper or copyrighted-media mirroring.
- Require server-authenticated owner identity, CSRF protection where cookie-based sessions are used, authorization on every resource, row-level owner scope, minimal rate limiting and upload limits before exposing a real backend publicly.
- Artifacts private by default; no public video bucket; any future playback/download uses short-lived server-authorized URLs. No user uploads to public repo, no private asset persistence in Git commit, no secret in frontend bundle.
- Make job IDs, cost estimates, review metadata and mock fixture provenance explicit. No fake "video produced" success states for a job that never rendered.

## Updated ordered gates and owner approvals

- Gate 0: architecture — done; revision addendum complete.
- Gate 1 + Gate 1B: dual-mode offline engine and real Remotion fixture runtime — passed for offline scope. Windows and authentic media unverified.
- **Gate 2 (next, unchanged):** durable Git CAS ledger, authorization, secure executor boundary, fake-provider tests. No production branch/secret/provisioning without approval.
- **Gate 3A (new):** build actual responsive dashboard SPA + typed API contract + deterministic LOCAL_DEMO_MODE and offline engine adapter; working navigation/forms/review. No paid calls, no provider credential, no cloud deployment. Target candidate Cloudflare Pages but do not activate.
- **Gate 3B (renamed original Gate 3):** single separately authorized real English production pilot, voice audition/real audio alignment + media storage review, authentic Minh asset only if appearance requested. Dashboard integrates real authorized backend when ready. No unapproved costs or publication.
- **Gate 4:** verified scheduling/control-plane and approved hosted dashboard integration, secure Auth/RLS and job/media persistence, monitoring/free-tier feasibility; separate approval to deploy publicly (even free) and turn on any schedule/spend. Default branch scheduling caveat applies.
- **Gate 5:** verify official Shopee/TikTok Shop access and allowed data/media use, manual evidence fallback, no bypass/scraping.
- **Gate 6:** owner-authorized real product showcase pilot with factual/rights/affiliate/voice/presenter reviews; independent GO/NO-GO.

Gate 3A can be developed in parallel with Gate 2 ONLY in separate temporary feature branches with no write conflicts, but its submission/paid controls remain fake until Gate 2 passes. For a simple stacked PR, execute Gate 2 first. Do not merge or rebase stack without owner approval.

## Gate 3A measurable acceptance

- Can start local server, navigate as demo owner, create one deterministic English draft and one manual-evidence product draft, preview validated script/estimated budget, view saved mock jobs, reject invalid URL/stale claims, see presenter/voice settings, review a fixture by exact video hash, and export captions. Require actual working buttons with honest behavior; no decorative fake controls.
- Demonstrate responsive UI at ~390px and desktop ≥1280px, keyboard access and no leaking tokens in bundle, network, logs, test fixtures or public assets.
- Test input validation, authorization boundary contract, CSRF approach, malicious product URLs, privacy enforcement design, state revisions, stale review, mock-only controls, disabled paid dispatch, handling absent media, empty/error/loading states.
- Gate 1B Remotion and prior offline suites remain green where applicable, except independently documented historical media-dependent failures.
- `HOSTED_REMOTE_PRODUCTION` and `LIVE_AUTH` marked BLOCKED until reviewed/provisioned/deployed. No hosted success claim from local mock demo.
- Stop after Gate 3A; Gate 3B starts only by separate owner instruction.

## Spend, cloud and deployment approvals

No new paid hosting plan, VPS, DB paid upgrade, paid storage, voice provider, avatar service or external media subscription; no service provisioning or deployment without owner authorization. Public free-tier preview could be evaluated later with explicit owner approval and only synthetic public demo data, provided security has been reviewed. The existing $10 budget is for constrained future production ($8 usable + $2 protected), not a budget to silently spend on infrastructure. Never present plan quotes or free-tier ceilings as verified account entitlements.
