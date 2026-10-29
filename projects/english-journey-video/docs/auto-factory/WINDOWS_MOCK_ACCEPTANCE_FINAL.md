# Windows mock acceptance final — 2026-10-29

Status: BLOCKED / NOT EXECUTED ON WINDOWS. Host here is Linux, not the owner's Windows11 machine. No owner-local compatibility branch, F: filesystem, ACL, Windows identity or Credential Manager access is available to this session.

The source fix replaces Node devNull with Git-native NUL on Windows; Linux/macOS retain /dev/null. trust.ts shares the selector; ledger hooks are explicitly disabled. New git-isolation.test.ts verifies mapping, configuration isolation and actual local-hook suppression. Linux test results are in GATE_3_FINAL_REPORT.md; Windows success is not inferred.

## Exact local mock handoff

Use the immutable final PR HEAD reported in the consolidated handoff, not a moving branch. Preserve any owner-local uncommitted work in its existing checkout; create a separate clean clone and compare any prepared fix with this diff before integration. Do not overwrite local work.

In a credential-free PowerShell session with previously verified portable tools on process-scoped PATH:

```powershell
Set-Location -LiteralPath '<clean-checkout>\projects\english-journey-video'
git rev-parse HEAD
git status --porcelain --untracked-files=all
node --version
git --version
ffmpeg -version
ffprobe -version
npm ci --ignore-scripts --no-audit --no-fund
.\scripts\auto-factory\local\Verify-LocalMock.ps1 `
  -ProjectRoot (Get-Location).Path `
  -PrivateMedia '<new-private-media-root>' `
  -PrivateBackup '<new-private-backup-root-on-independent-device>' `
  -CheckpointRoot '<new-independent-checkpoint-root>' `
  -MockWork '<new-private-mock-work-root>'
```

Replace placeholders with inspected owner-approved directories outside the entire repository and without overlap. This script remains MOCK_ONLY and includes both new isolation regressions. Expected first-run12/resume0; retain full output and independently retained manifest hashes. On failure preserve locks/journal/checkpoints; do not reset to manufacture a pass. Node24.19.0/Git2.51.1/FFmpeg6.1.1 remain pinned; verify binary hashes independently. FFprobe version/hash must also be retained before real-media acceptance.

ACL work is not executed here. Before restricting ONLY newly created project directories, retain Get-Acl/icacls output and original ACL backup. Confirm filesystem supports Windows ACLs; preserve owner/SYSTEM/Administrators and prohibit unauthorized ordinary-user modification/deletion, including via parent delete-child rights. Test with a separate non-authorized ordinary identity and retained owner access. Do not change an entire volume. A separate F: USB device can still be disconnected, lost or fail; same-host administrator compromise is a residual risk. Test actual disconnect/write failure, independently anchored backup hashes and restore to a separate clean destination. Never store keys with media/backups. Any missing test remains NO-GO.
