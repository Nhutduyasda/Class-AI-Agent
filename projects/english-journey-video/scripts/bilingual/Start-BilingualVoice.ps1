param(
    [ValidateSet('CheckVoices','Run')][string]$Mode = 'CheckVoices',
    [string]$ProjectRoot = '',
    [string]$Plan = '',
    [string]$Authorization = ''
)
$ErrorActionPreference = 'Stop'
Set-PSDebug -Off
$secret = $null
$child = $null
$info = $null
function Invoke-PrivateRunner([string[]]$Parts, [bool]$WithKey) {
    $script:info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = (Get-Command node.exe -ErrorAction Stop).Source
    foreach ($part in $Parts) { if ($part.Contains('"') -or $part.Contains("`n") -or $part.Contains("`r")) { throw 'INVALID_ARGUMENT' } }
    $info.Arguments = ($Parts | ForEach-Object { '"' + $_ + '"' }) -join ' '
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    foreach ($name in @('SPEECH_KEY','SPEECH_STS_TOKEN','SPEECH_ENTRA_ACCESS_TOKEN','SPEECH_BEARER_TOKEN','SPEECH_AUTH_MODE','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE','NODE_TLS_REJECT_UNAUTHORIZED','SSLKEYLOGFILE')) { $info.EnvironmentVariables.Remove($name) }
    if ($WithKey) {
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        try { $info.EnvironmentVariables['SPEECH_KEY'] = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr); $info.EnvironmentVariables['SPEECH_AUTH_MODE'] = 'key' }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    }
    $script:child = New-Object System.Diagnostics.Process
    $child.StartInfo = $info
    try { [void]$child.Start() } finally { $info.EnvironmentVariables.Remove('SPEECH_KEY') }
    $errorsTask = $child.StandardError.ReadToEndAsync()
    $stdout = $child.StandardOutput.ReadToEnd()
    $child.WaitForExit()
    [void]$errorsTask.GetAwaiter().GetResult()
    if ($child.ExitCode -ne 0) { throw 'RUNNER_STOPPED_NO_RETRY' }
    return ($stdout | ConvertFrom-Json)
}
try {
    if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { throw 'PRIVATE_TERMINAL_REQUIRED' }
    if (-not $ProjectRoot) { $ProjectRoot = Join-Path $PSScriptRoot '..\..' }
    $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
    $runner = Join-Path $ProjectRoot 'scripts\bilingual\runner.mjs'
    if ($Mode -eq 'Run') {
        if (-not $Plan -or -not $Authorization) { throw 'NEW_PLAN_AND_AUTHORIZATION_REQUIRED' }
        $Plan = (Resolve-Path -LiteralPath $Plan).Path
        $Authorization = (Resolve-Path -LiteralPath $Authorization).Path
        $preflight = Invoke-PrivateRunner -Parts @($runner,'--preflight',$ProjectRoot,$Plan,$Authorization) -WithKey $false
        Write-Host ('Already authorized: {0} requests / {1} billable envelope characters / USD {2:F6}. No retries.' -f $preflight.requests,$preflight.billableCharacters,$preflight.estimatedUsd)
    } else { Write-Host 'Voice catalogue check only. GET request; no synthesis.' }
    $evidenceFolder = Join-Path $ProjectRoot 'out\bilingual'
    [void](New-Item -ItemType Directory -Force -Path $evidenceFolder)
    $voiceEvidence = Join-Path $evidenceFolder ('voice-check-' + [Guid]::NewGuid().ToString('N') + '.json')
    $secret = Read-Host 'API key for english-journey-namminh (hidden; never paste into Codex)' -AsSecureString
    if ($secret.Length -eq 0) { throw 'EMPTY_KEY' }
    $voices = Invoke-PrivateRunner -Parts @($runner,'--check-voices',$voiceEvidence) -WithKey $true
    Write-Host $voices.status
    Write-Host ('Evidence: ' + $voiceEvidence)
    if ($Mode -eq 'Run') {
        $result = Invoke-PrivateRunner -Parts @($runner,'--run',$ProjectRoot,$Plan,$Authorization,$voiceEvidence) -WithKey $true
        Write-Host $result.status
        Write-Host ('Output: ' + $result.output)
    }
} catch {
    Write-Host 'STOPPED_NO_RETRY. Inspect policy, voice evidence and ledger. Never reset an ambiguous attempt. No raw error or credential is displayed.'
    exit 1
} finally {
    if ($secret) { $secret.Dispose() }
    if ($info) { $info.EnvironmentVariables.Remove('SPEECH_KEY') }
    if ($child) { $child.Dispose() }
}
