# ============================================================
# vercel-env.ps1 — Get/set env vars de un proyecto Vercel
# Uso:
#   Get:  .\scripts\infra\vercel-env.ps1 -ProjectId <id> [-Action get]
#   Set:  .\scripts\infra\vercel-env.ps1 -ProjectId <id> -Action set -Key VITE_API_URL -Value "https://..."
# ============================================================

param(
    [Parameter(Mandatory=$true)] [string]$ProjectId,
    [ValidateSet("get","set")] [string]$Action = "get",
    [string]$Key,
    [string]$Value,
    [ValidateSet("production","preview","development")] [string]$Target = "production"
)

$ErrorActionPreference = "Stop"
$credPath = "C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json"
$creds = Get-Content $credPath -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($creds.vercel.api_token)" }

if ($Action -eq "get") {
    Write-Host "`n--- ENV VARS (production) for project $ProjectId ---" -ForegroundColor Yellow
    try {
        $envs = Invoke-RestMethod -Uri "$($creds.vercel.api_base_url)/v9/projects/$ProjectId/env" -Headers $headers -Method Get
        foreach ($e in $envs.envs) {
            $val = $e.value
            if ($val.Length -gt 0) {
                $masked = $val.Substring(0, [Math]::Min(8, $val.Length)) + "***($($val.Length) chars)"
            } else { $masked = "(empty)" }
            $targets = ($e.target | ForEach-Object { $_ }) -join ","
            Write-Host ("{0,-30} {1}  [{2}]" -f $e.key, $masked, $targets)
        }
    } catch {
        Write-Error "Failed: $_"
    }
} else {
    if (-not $Key -or -not $Value) {
        Write-Error "Set action requires -Key and -Value"
    }
    Write-Host "Setting $Key on $ProjectId ($Target)..." -ForegroundColor Cyan
    $body = @{
        key = $Key
        value = $Value
        target = @($Target)
        type = "plain"
    } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri "$($creds.vercel.api_base_url)/v10/projects/$ProjectId/env" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Error "Failed: $_"
    }
}
