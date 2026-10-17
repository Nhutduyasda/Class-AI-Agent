$ErrorActionPreference = 'Stop'
Set-PSDebug -Off
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$runner = Join-Path $project 'scripts\marketing04\voice-runner.mjs'
$delivery = Join-Path $project 'out\marketing04\delivery'
$secret = $null
$child = $null
$info = $null
try {
    if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { throw 'PRIVATE_TERMINAL_REQUIRED' }
    $planText = & node.exe $runner --plan $project $delivery
    if ($LASTEXITCODE -ne 0) { throw 'PREFLIGHT_FAILED' }
    $plan = $planText | ConvertFrom-Json
    Write-Host ('Video 04: {0} requests, {1} characters, reference USD {2:F6}, limit USD 0.05.' -f $plan.requests,$plan.characters,$plan.estimatedUsd)
    Write-Host 'Nam Minh / southeastasia / Standard S0 / +0% / default pitch. Already authorized. No retries.'
    $secret = Read-Host 'API key for english-journey-namminh (hidden; do not paste into Codex)' -AsSecureString
    if ($secret.Length -eq 0) { throw 'EMPTY_KEY' }
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = (Get-Command node.exe).Source
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.Arguments = '"' + $runner + '" --run "' + $project + '" "' + $delivery + '"'
    foreach ($name in @('SPEECH_KEY','SPEECH_STS_TOKEN','SPEECH_ENTRA_ACCESS_TOKEN','SPEECH_BEARER_TOKEN','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE','NODE_TLS_REJECT_UNAUTHORIZED','SSLKEYLOGFILE')) { $info.EnvironmentVariables.Remove($name) }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $info.EnvironmentVariables['SPEECH_KEY'] = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr); $info.EnvironmentVariables['SPEECH_AUTH_MODE'] = 'key' }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $child = New-Object System.Diagnostics.Process
    $child.StartInfo = $info
    try { [void]$child.Start() } finally { $info.EnvironmentVariables.Remove('SPEECH_KEY') }
    $errorsTask = $child.StandardError.ReadToEndAsync()
    $resultText = $child.StandardOutput.ReadToEnd()
    $child.WaitForExit()
    [void]$errorsTask.GetAwaiter().GetResult()
    $result = $resultText | ConvertFrom-Json
    Write-Host $result.status
    if ($child.ExitCode -ne 0) { throw 'STOPPED_NO_RETRY' }
    Write-Host ('Six verified WAV saved in: ' + $delivery)
    Write-Host 'Return to Codex. Do not run synthesis again.'
} catch {
    Write-Host 'STOPPED_NO_RETRY. Preserve ledger and files. Do not retry. No credential or raw error is displayed.'
} finally {
    if ($secret) { $secret.Dispose() }
    if ($info) { $info.EnvironmentVariables.Remove('SPEECH_KEY') }
    if ($child) { $child.Dispose() }
}
Read-Host 'Press Enter to close'
