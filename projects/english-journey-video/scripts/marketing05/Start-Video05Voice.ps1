$ErrorActionPreference = 'Stop'
Set-PSDebug -Off
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
try {
    if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { throw 'PRIVATE_TERMINAL_REQUIRED' }
    $reviewText = & node.exe (Join-Path $PSScriptRoot 'preflight.mjs') $project
    if ($LASTEXITCODE -ne 0) { throw 'PREFLIGHT_STOPPED' }
    $review = $reviewText | ConvertFrom-Json
    Write-Host 'ENGLISH JOURNEY VIDEO 05 V1.1 — NEW COST CONFIRMATION'
    $review.rows | Format-Table scene,characters,usd | Out-Host
    Write-Host ('Reference total USD {0:F6}; maximum USD 0.05 before taxes/fees. Six requests, no retries.' -f $review.estimatedUsd)
    Write-Host ('Retail price: USD 15 / million, verified ' + $review.priceCheckedAt + '. Not an invoice.')
    Write-Host 'Nam Minh (Vietnamese) + Andrew (English); existing southeastasia resource only.'
    Write-Host 'The next step checks both voices using authenticated GET before any paid POST.'
    $approval = Read-Host ('Type exactly ' + $review.confirmation + ' to authorize this Video 05 plan')
    if ($approval -cne $review.confirmation) { throw 'COST_NOT_APPROVED' }
    $folder = Join-Path $project 'out\bilingual\marketing-video-05'
    [void](New-Item -ItemType Directory -Force -Path $folder)
    $policyPath = Join-Path $folder 'authorization.json'
    $policy = $review.policy
    $policy.liveSynthesisAllowed = $true
    $policy | Add-Member -NotePropertyName approvalId -NotePropertyValue ('VIDEO05-USD0.05-' + [Guid]::NewGuid().ToString('N'))
    $policy | Add-Member -NotePropertyName approvedAt -NotePropertyValue ([DateTime]::UtcNow.ToString('o'))
    $policy | Add-Member -NotePropertyName expiresAt -NotePropertyValue ([DateTime]::UtcNow.AddHours(12).ToString('o'))
    $bytes = [Text.UTF8Encoding]::new($false).GetBytes(($policy | ConvertTo-Json -Depth 10))
    $file = [IO.File]::Open($policyPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $file.Write($bytes,0,$bytes.Length); $file.Flush($true) } finally { $file.Dispose() }
    & (Join-Path $project 'scripts\bilingual\Start-BilingualVoice.ps1') -Mode Run -ProjectRoot $project -Plan (Join-Path $project 'docs\reviews\marketing05\ssml-plan.json') -Authorization $policyPath
    Write-Host 'Return to Codex after completion. Preserve all WAV, receipts and ledger. Do not rerun synthesis.'
} catch {
    Write-Host 'STOPPED. No retry. Preserve policy, ledger and WAV files. No key or raw error is displayed.'
}
Read-Host 'Press Enter to close'
