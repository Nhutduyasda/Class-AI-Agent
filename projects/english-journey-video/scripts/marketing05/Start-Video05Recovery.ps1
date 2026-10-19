$ErrorActionPreference = 'Stop'
Set-PSDebug -Off
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
try {
    if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { throw 'PRIVATE_TERMINAL_REQUIRED' }
    $text = & node.exe (Join-Path $PSScriptRoot 'review-recovery.mjs') $project
    if ($LASTEXITCODE -ne 0) { throw 'RECOVERY_PREFLIGHT_STOPPED' }
    $review = $text | ConvertFrom-Json
    Write-Host 'VIDEO 05 V1.1 — RECOVERY 01 — NEW COST PERMISSION REQUIRED'
    Write-Host 'HOOK is preserved. Exactly 5 NEW multivoice requests, one per scene. No retries.'
    $review.rows | Format-Table scene,characters,usd | Out-Host
    Write-Host ('New estimate USD {0:F6}; new ceiling USD 0.02 before taxes/fees.' -f $review.newEstimatedUsd)
    Write-Host ('Historical reference reservation USD {0:F6}; combined estimate USD {1:F6}.' -f $review.historicalReservedUsd,$review.combinedReferenceEstimatedUsd)
    Write-Host 'Combined reservation ceiling: USD 0.024260. These are reference prices, not invoice totals.'
    Write-Host 'IMPORTANT: The old PROBLEM request may already have been billed. Root cause remains UNKNOWN.'
    Write-Host 'Your confirmation explicitly permits ONE ADDITIONAL PROBLEM attempt plus SOLUTION/DEMO/BENEFIT/CTA.'
    Write-Host 'Original ledger and authorization remain immutable. No split fallback or substitute provider.'
    $approval = Read-Host ('Type exactly ' + $review.confirmation)
    if ($approval -cne $review.confirmation) { throw 'RECOVERY_COST_NOT_APPROVED' }
    $folder = Join-Path $project 'out\bilingual\marketing-video-05-recovery-01'
    [void](New-Item -ItemType Directory -Force -Path $folder)
    $policyPath = Join-Path $folder 'authorization.json'
    $policy = $review.policy
    $policy.liveSynthesisAllowed = $true
    $policy.additionalProblemAttemptExplicitlyApproved = $true
    $policy | Add-Member -NotePropertyName approvalId -NotePropertyValue ('VIDEO05-RECOVERY-5REQ-USD0.02-' + [Guid]::NewGuid().ToString('N'))
    $policy | Add-Member -NotePropertyName approvedAt -NotePropertyValue ([DateTime]::UtcNow.ToString('o'))
    $policy | Add-Member -NotePropertyName expiresAt -NotePropertyValue ([DateTime]::UtcNow.AddHours(12).ToString('o'))
    $bytes = [Text.UTF8Encoding]::new($false).GetBytes(($policy | ConvertTo-Json -Depth 10))
    $file = [IO.File]::Open($policyPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $file.Write($bytes,0,$bytes.Length); $file.Flush($true) } finally { $file.Dispose() }
    & (Join-Path $project 'scripts\bilingual\Start-BilingualVoice.ps1') -Mode Run -ProjectRoot $project -Plan (Join-Path $project 'docs\reviews\marketing05\recovery-01\ssml-plan.json') -Authorization $policyPath
    Write-Host 'Return to Codex. Never rerun this launcher or reset either ledger.'
} catch {
    Write-Host 'STOPPED_NO_RETRY. Preserve all artifacts. No raw error or secret is displayed.'
}
Read-Host 'Press Enter to close'
