# Windows Mock Acceptance & Whole-System Cash Budget — owner handoff

Status: PLAN / OWNER-RUN VERIFICATION REQUIRED. Created 2026-10-21 from Gate 3B-P2 HEAD b0940d5351a86ddb19486f4141402d27bd3fe41d. No Windows runs or paid requests were executed by this document change.

## Corrected financial interpretation (OWNER CONFIRMED)

The USD 10 is **total cash the owner is willing to spend on Auto Video Factory as a whole**, NOT an Azure Speech gift balance, prepaid Azure credit, nor a monthly hosting allowance. Do not infer Azure subscription credit from this statement.

- Absolute all-service owner cash envelope: USD 10, inclusive of TTS, LLM/image/avatar APIs, cloud compute, paid hosting, storage, bandwidth, tax/fees and outstanding relevant liabilities. The accounting opening liabilities/provider billing are still UNVERIFIED. Do not count existing ChatGPT subscription as API credit.
- Internal policy cap for potential approved expenditures: USD 8 across all services, and USD 2 protected cash reserve, not to be spent without a separate explicit policy decision.
- Current-authorized new cash/API spend in this phase: USD 0. Paid provider transport and hosting remain DISABLED/NO-GO.
- Aggregate all-service ceiling per eventual video USD 0.08 remains the existing application policy; this is NOT a cloud hard billing cap or evidence the final media can cost ≤ USD 0.08.
- Candidate V2 only, A/B neutral+dynamic: 12 proposed Azure requests, 993 conservatively counted characters, historical public-reference estimate USD 0.014895. Proposed Azure cap USD 0.03, all-service pilot cap USD 0.08. None of these requests/caps is authorized; account-specific pricing, taxes, existing charges, billing access and paid execution remain unverified. The reference evidence expires at 2026-10-22T00:00Z; refresh before any paid approval, do not extend it by changing the date.
- For an eventual V2 pilot, if separately approved, Azure proposed ceiling USD 0.03 leaves only USD 0.05 of the same USD 0.08 video envelope for all other paid components and tax/unknown variance; DO NOT treat this as a request or purchase authorization.
- Proposed initial no-cost configuration: local Windows mock/test/render, manual scripts/fixtures, no paid LLM, no avatar/image subscription, no paid hosting/storage/VPS, no production remote deploy. Future free tiers are candidates only, subject to account and usage verification and explicit approval even for a free public deployment.
- Future monthly paid hosting would be a RECURRING expense and must be separately evaluated/approved against the same total cash envelope; no perpetual cloud-production claim at USD 10. All paid activity is blocked if the owner cannot prove account-specific price, tax and opening liability or if quotas/provider spending controls are insufficient.

## Acceptance sequence: Windows 11, NO provider credential

1. Verify owner-machine prerequisites, available logical drives AND physical independence. Required by the current immutable P2 mock implementation: Node v24.19.0, Git 2.51.1 (or 2.51.1.windows.1), FFmpeg 6.1.1, ffprobe, PowerShell, repository access. The script and trust manifest require exact binary SHA checks. If versions differ, STOP and request a reviewed compatibility/pin revision; do not bypass hashes or modify source/checks to force PASS.
2. Use a fresh separate checkout of public repository at exactly b0940d5351a86ddb19486f4141402d27bd3fe41d; check clean worktree before install/run. Example owner steps, change paths only with care:

\`\`\`powershell
$CodeRoot = 'C:\Private\FactoryCode'
git clone https://github.com/Nhutduyasda/Class-AI-Agent.git $CodeRoot
git -C $CodeRoot checkout --detach b0940d5351a86ddb19486f4141402d27bd3fe41d
Set-Location -LiteralPath "$CodeRoot\projects\english-journey-video"
git rev-parse HEAD
git status --porcelain
node --version
git --version
ffmpeg -version
ffprobe -version
\`\`\`

Stop if HEAD is not exact, tree is not clean, or any needed binary/version is missing. Never run a real Azure launcher. Do not add secrets or paste key values into terminal or chat.
3. In a credential-free terminal, install pinned dependencies and typecheck (the mock launcher separately checks absence of provider-key environment-variable NAMES without accessing values):

\`\`\`powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
\`\`\`

4. Choose distinct **empty** mock paths outside the entire repository. D:/E: are placeholders and must EXIST. Preferred for eventually proving backup independence: media+mock on one verified physical storage device, backup/checkpoint on a genuinely different independent device/failure domain with its ACL/retention separately verified. Merely having two drive letters does not establish independence. If only one disk is available, run a clearly labelled LOGICAL-MOCK smoke test using four disjoint directories outside repo, but report INDEPENDENT_STORAGE=UNVERIFIED and Windows production readiness PARTIAL/NO-GO. Never pretend cloud/USB costs are $0 if they are not.
5. With versions and paths confirmed, from the project directory run the provided mock-only launcher, replacing four example paths with owner's chosen ones:

\`\`\`powershell
.\scripts\auto-factory\local\Verify-LocalMock.ps1 `
  -ProjectRoot (Get-Location).Path `
  -PrivateMedia 'D:\PrivateFactoryMock\Media-Đ' `
  -PrivateBackup 'E:\PrivateFactoryMockBackup' `
  -CheckpointRoot 'E:\PrivateFactoryMockCheckpoint' `
  -MockWork 'D:\PrivateFactoryMockWork'
\`\`\`

Do NOT rerun from scratch on existing journals or delete state/locks on failure. The controlled launcher validates environment/build, tests mock fault cases, initializes a TEST-ONLY Git journal, sends 12 MOCK requests first time and 0 new requests on resume. Fake one-hour pricing windows, synthetic approvals, fake liabilities and receipts are NOT evidence of real Azure usage.
6. Retain and compare: exact HEAD, tool versions and binary hashes, unit/security PASS counts, first 12 vs resumed 0 requests, ledger hash-chain/checkpoint receipts, ambiguity/rollback blocked behavior, \`icacls\` for private storage roots, proof of independent device/domain where claimed, backup manifest's independently retained SHA and hash-verified restore to a different destination. Redact local personal paths/names when sharing logs. Never share secrets.
7. Mark acceptance:
  - Windows mock functional PASS: real Windows run, pinned tools/hashes, all fake tests PASS, 12 then 0, no paid API, no bypass, valid checkpoint/restore evidence.
  - Windows storage durability FULL PASS only with independent failure domain, ACL/write-disconnect/fail-closed tests, hash-verified restore and acceptance evidence.
  - Production paid readiness remains NO-GO even if mock passes: real credential broker/transport, authorization, account-specific billing, independent production journal/anchor and exact owner approval still absent.
  - Any missing storage separation or tool mismatch => PARTIAL/BLOCKED with specific reason; do not overclaim.
  
## No-retry and stop rules

Never run the old paid bilingual launcher as a shortcut; \`Verify-LocalMock.ps1\` is MOCK_ONLY. No Azure keys/LLM keys in mock process. Crash/timeout/failed storage acknowledgement is a STOP, not a reason to reset/reinitialize/refetch or regenerate paid speech. Preserve event journal and independent checkpoint, and reconcile ambiguous liabilities manually in a later authorized gate.

## What to return to the reviewer

- Sanitized \`git rev-parse HEAD\`, \`git status --porcelain\`, node/git/ffmpeg/ffprobe version outputs.
- Physical-disk / logical-drive situation (without serial numbers); paths selected only as neutral labels.
- Sanitized mock-only test result summary; first-run 12, resume 0 or the exact blocker.
- ACL/backup/restore proof where available; any failure with exact error code.
- Explicit note that no real provider credentials or paid calls were used.

References: \`WINDOWS_LOCAL_EXECUTOR_HANDOFF.md\`, \`GATE_3B_P2_SECURE_PREFLIGHT_REPORT.md\`, \`P2_SECURE_PREFLIGHT.json\`, \`SECURITY_AND_BUDGET.md\`. This document is planning only; it does not modify provider settings, immutable reviewed executable or approval JSON.
