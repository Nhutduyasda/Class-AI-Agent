# Windows11 local executor — mock verification handoff only

**Windows readiness UNVERIFIED. Real paid pilot BLOCKED.** These commands never call Azure or read a real key. This is not a paid launch instruction. Code, fake approval and ledger say MOCK_ONLY/OFFLINE_SIMULATION_ONLY; CLI rejects every mode except initialize-mock/run-mock. Actual owner script approval, actual billing and a reviewed real transport are absent. V1 and historical Videos01–05 are unchanged.

## Trust/build phase without credentials

Use a fresh isolated checkout at the exact final PR10 commit supplied in the handoff. Compare that immutable SHA with the reviewed commit outside the repository; do not approve a moving branch. The checkout must be clean (including staged/untracked files). Node24.19.0, FFmpeg6.1.1 and Git2.51.1 are pinned; Git's2.51.1.windows.1 build suffix is accepted but the full executable SHA256 remains pinned. No automatic upgrade/download is performed by the executor. A different runtime requires an explicitly reviewed pin change, not bypass.

Install dependencies only in a credential-free shell, with frozen lockfile and lifecycle scripts disabled. Validate the source/lockfile, tool executable hashes and installed zod tree before any mock request. The runtime does not load a provider key. Keep any real provider credential out of the test session. Do not paste it into ChatGPT, config, arguments, transcripts or logs. The PowerShell handoff checks only whether common provider-key environment names exist and refuses the session if present; it never reads their values. The runtime Git subprocess environment allowlists process launch prerequisites and disables interactive/global/system Git configuration. No installs, upgrades, arbitrary endpoint/command or real HTTP transport exist in the mock dispatch process.

```powershell
# In a fresh clone, at the exact reviewed SHA, with no provider credentials present:
Set-Location -LiteralPath 'C:\Private\FactoryCode\projects\english-journey-video'
git rev-parse HEAD
git status --porcelain
node --version
git --version
ffmpeg -version
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
```

The executor hashes its required transitive source graph, package/lockfile, zod installed files, Node/Git/FFmpeg executables and exact code commit. It compares the currently loaded code/dependency bytes with the reviewed checkout as well. Build manifest creation is a credential-free step, not proof of independent owner review. A malicious local administrator or a compromised Node/OS is outside the verified mock threat model. Real credential isolation/ACL/anti-tamper proof still needs Windows security review.

## Owner-selected private paths

Select private media, backup, checkpoint and mock work paths **outside the entire Git repository**, not merely outside this project folder. Media/backup/checkpoint/journal/writer must not overlap. Do not use public/shareable sync folders or repository artifacts for actual private media. Do not assume two directories on one disk are independent storage. Choose an independent backup device/destination and checkpoint retention method later; verify Windows ACLs and recovery/rollback behavior before production. Node POSIX mode0600/0700 is not proof of Windows ACL enforcement.

Example fake-only test invocation (replace paths with owner-selected PRIVATE destinations, all initially empty):

```powershell
.\scripts\auto-factory\local\Verify-LocalMock.ps1 `
  -ProjectRoot (Get-Location).Path `
  -PrivateMedia 'D:\PrivateFactoryMock\Media-Đ' `
  -PrivateBackup 'E:\PrivateFactoryMockBackup' `
  -CheckpointRoot 'E:\PrivateFactoryMockCheckpoint' `
  -MockWork 'D:\PrivateFactoryMockWork'
```

These drive letters are examples, not selected or verified destinations. The script runs TypeScript and fake-only recovery tests, creates a **mock** build/authorization outside the repository, explicitly initializes an isolated local bare **test** journal, sends12 mock requests and resumes the same plan. Expected first run:12 new mock calls; resumed run:0 new mock calls/12 cache hits. No code path accepts production scope or sets paidExecutionAllowed=true. The mock setup emits a synthetic one-hour approval/price window and a fake opening liability of12345microUSD. Those fields are explicitly simulation evidence, not real account/owner/billing verification. Never reuse them as paid authorization.

If initialization reports existing files/ledger, stop and inspect; do not delete/reset them to obtain a clean PASS. A missing journal/checkpoint during resume is BLOCKED, not an invitation to initialize. A stale executor.lock or checkpoint lock after a hard kill requires evidence that no process remains, then an owner-reviewed recovery; there is no automatic stale-lock release. Unknown attempts keep their reservation/liability and block subsequent dispatch.

## Required mock verification evidence

Run and retain console output, exact commit/tool versions/hashes and private mock journal/checkpoint outside Git:

```powershell
node --test scripts/auto-factory/local/local.test.ts
node --test scripts/auto-factory/pilot/readiness.test.mjs
# Existing retained P1 fixture regression and new V2 integration:
node scripts/auto-factory/pilot/render-v2.ts
node --test scripts/auto-factory/pilot/v2.test.ts
```

New local tests cover external authorization, clean code/dependency/hash binding, expired mock pricing, wrong request/attempt count, unknown opening balance, budget exposure, real-provider rejection, Unicode paths, immutable media, hash-authorized backup/restore, unavailable journal/storage, branch rollback, restart at pre/post reservation/dispatch/response and two independent OS processes. Test-only crash-worker terminates a Node child abruptly at selected durable Gate2 boundaries; ambiguous state never retries. Intentional fault injection may terminate a child; it must not terminate the owner's live work. All test roots are private temporary **mock** repositories. Fake canary is never a real credential.

The Windows suite must also retain `icacls` evidence for actual chosen roots, proof the checkpoint/backup is independent of the journal's failure/rollback domain, storage-disconnect/write-denial tests on those actual devices and hash-verified restore onto a separate destination. Existing Linux directories prove logical path separation only. No Windows execution, ACL, power-loss/fsync or independent-device proof has been performed here.

## Retention format and restore

Prepared sections: authorized-wav/, ssml/, receipts/, imports/, captions/, mp4/, qa/, owner-reviews/, ledger-evidence/. Mock request receipts say MOCK_RECEIPT_NOT_AUDIO; no WAV is fabricated from a receipt hash. Future genuine WAVs go through the existing reviewed media importer. SSML and receipt exports are exclusive/fsync/readback checked; changing existing bytes fails rather than silently replacing them. No credential storage directory is provided.

`backupFiles(media,backup,explicitPaths)` copies only explicitly named files under those sections, validates paths/symlinks and writes an immutable hash manifest. Retain SHA256 of the exact manifest bytes through an independent channel. `restore(backup,newTarget,retainedManifestSha256)` first verifies that external hash and every file hash, then restores exclusively and verifies readback. A backup that supplies its own new hash is not independent evidence. Tests corrupt data and confirm refusal. The currently prepared backup is a bounded snapshot, not a rolling production backup service; archive separate snapshots for successive states. Store actual journal/checkpoint exports and owner review records with verified snapshots before real operation; this task does not enroll a production retention destination.

## Recovery: no retry

Stop further execution; preserve journal, independent checkpoint, locks, response/quarantine, receipts and source WAVs unchanged. Identify the last acknowledged reservation/DISPATCHING boundary. A timeout/crash/lost receipt does not prove NOT_SENT. Compare genuine usage/billing and append an evidence-backed settlement through a later reviewed reconciliation process; never edit history, reset opening liabilities or change run ID to evade the latch. Existing Gate2 reconciliation is exercised with fake evidence only. No live reconciliation command is enabled by this handoff. Disabling a process does not cancel/refund a request.
