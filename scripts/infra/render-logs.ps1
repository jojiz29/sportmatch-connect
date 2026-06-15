# ============================================================
# render-logs.ps1 — Tail de logs del servicio
# PowerShell 5.1 compatible
# Uso: .\scripts\infra\render-logs.ps1 [-Tail 100]
# ============================================================

param(
    [int]$Tail = 100
)

$ErrorActionPreference = "Stop"
$credPath = "C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json"
$creds = Get-Content $credPath -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($creds.render.api_token)" }
$svc = "$($creds.render.api_base_url)/services/$($creds.render.service_id)"

Write-Host "Fetching last $Tail log lines from Render..." -ForegroundColor Cyan
Write-Host ""

try {
    $logs = Invoke-RestMethod -Uri "$svc/logs?tail=$Tail" -Headers $headers -Method Get
    if ($logs -is [array]) {
        foreach ($l in $logs) {
            $ts = $l.timestamp
            $msg = $l.message
            $color = "Gray"
            if ($msg -like "*ERROR*") { $color = "Red" }
            elseif ($msg -like "*WARN*") { $color = "Yellow" }
            elseif ($msg -like "*Nest*") { $color = "Cyan" }
            elseif ($msg -like "*-*") { $color = "Cyan" }
            Write-Host "[$ts] $msg" -ForegroundColor $color
        }
    } else {
        Write-Host ($logs | ConvertTo-Json -Depth 4)
    }
} catch {
    Write-Error "Failed to fetch logs: $_"
}
