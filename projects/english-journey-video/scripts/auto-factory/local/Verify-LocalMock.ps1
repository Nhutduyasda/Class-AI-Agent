[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$ProjectRoot,
 [Parameter(Mandatory=$true)][string]$PrivateMedia,
 [Parameter(Mandatory=$true)][string]$PrivateBackup,
 [Parameter(Mandatory=$true)][string]$CheckpointRoot,
 [Parameter(Mandatory=$true)][string]$MockWork
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# Presence checks only. Never read/display credential values; this handoff needs none.
foreach ($credentialName in @('AZURE_SPEECH_KEY','SPEECH_KEY','OPENAI_API_KEY')) {
 if (Test-Path "Env:$credentialName") { throw 'Remove provider credentials from this fake-only test session first.' }
}
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$node = (Get-Command node -CommandType Application).Source
$git = (Get-Command git -CommandType Application).Source
$ffmpeg = (Get-Command ffmpeg -CommandType Application).Source
if ((& $node --version) -ne 'v24.19.0') { throw 'Pinned Node v24.19.0 required.' }
$gitVersion = & $git --version
if ($gitVersion -notmatch '^git version 2\.51\.1(\.windows\.1)?$') { throw 'Pinned Git 2.51.1 required.' }
$ffVersion = (& $ffmpeg -version | Select-Object -First 1)
if ($ffVersion -notmatch '^ffmpeg version 6\.1\.1([\s-]|$)') { throw 'Pinned FFmpeg 6.1.1 required.' }
Push-Location -LiteralPath $project
try {
 # Build/tests happen with no provider credential present. Install dependencies separately before this script.
 & $node node_modules/typescript/bin/tsc --noEmit
 if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed.' }
 & $node --test scripts/auto-factory/local/local.test.ts scripts/auto-factory/local/boundary.test.ts scripts/auto-factory/local/setup.test.ts scripts/auto-factory/local/git-isolation.test.ts
 if ($LASTEXITCODE -ne 0) { throw 'Mock fault tests failed.' }
 & $node scripts/auto-factory/local/setup.ts $project $PrivateMedia $PrivateBackup $CheckpointRoot $MockWork $git $ffmpeg
 if ($LASTEXITCODE -ne 0) { throw 'Fake-only setup blocked.' }
 $config = Join-Path $MockWork 'mock-config.json'
 & $node scripts/auto-factory/local/cli.ts initialize-mock $config
 if ($LASTEXITCODE -ne 0) { throw 'Mock initialization failed.' }
 & $node scripts/auto-factory/local/cli.ts run-mock $config
 if ($LASTEXITCODE -ne 0) { throw 'Mock run blocked; preserve all recovery files.' }
 & $node scripts/auto-factory/local/cli.ts run-mock $config
 if ($LASTEXITCODE -ne 0) { throw 'Mock resume blocked; do not reset ledger.' }
 Write-Output 'MOCK ONLY completed. Confirm 12 first-run calls and 0 resumed calls. Paid production remains BLOCKED.'
} finally { Pop-Location }
