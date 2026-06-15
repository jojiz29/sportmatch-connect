# ============================================================
# render-status.ps1 — Estado completo del servicio Render
# PowerShell 5.1 compatible (sin ?. ni ?:)
# Uso: .\scripts\infra\render-status.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$credPath = "C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json"

if (-not (Test-Path -LiteralPath $credPath)) {
    Write-Error "Credenciales no encontradas en $credPath"
    exit 1
}

$creds = Get-Content $credPath -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($creds.render.api_token)" }
$svc = "$($creds.render.api_base_url)/services/$($creds.render.service_id)"

Write-Host ""
Write-Host "=== RENDER SERVICE STATUS ===" -ForegroundColor Cyan
Write-Host "Service: $($creds.render.service_name)"
Write-Host "URL:     $($creds.render.service_url)"
Write-Host "Repo:    $($creds.render.github_repo)@$($creds.render.branch)"

# Service details
try {
    $serviceResp = Invoke-RestMethod -Uri $svc -Headers $headers -Method Get
    $detail = $serviceResp | Select-Object -First 1
    Write-Host ""
    Write-Host "--- SERVICE DETAIL ---" -ForegroundColor Yellow
    Write-Host "ID:           $($detail.id)"
    Write-Host "Name:         $($detail.name)"
    Write-Host "Type:         $($detail.type)"
    Write-Host "Region:       $($detail.region)"
    Write-Host "Plan:         $($detail.plan)"
    $suspendedText = "ACTIVE"
    if ($detail.suspended) { $suspendedText = "SUSPENDED" }
    Write-Host "Status:       $suspendedText"
    Write-Host "Branch:       $($detail.branch)"
    Write-Host "Auto-Deploy:  $($detail.autoDeploy)"

    if ($detail.lastSuccessfulDeploy) {
        Write-Host "Last Deploy:  $($detail.lastSuccessfulDeploy.createdAt)"
    }
    if ($detail.serviceDetails) {
        Write-Host "Service URL:  $($detail.serviceDetails.url)"
    }
} catch {
    Write-Warning "No se pudo obtener detalle: $_"
}

# Env vars (masked)
Write-Host ""
Write-Host "--- ENV VARS (masked) ---" -ForegroundColor Yellow
try {
    $envResp = Invoke-RestMethod -Uri "$svc/env-vars" -Headers $headers -Method Get
    foreach ($entry in $envResp) {
        # Render API returns { envVar: { key, value }, cursor }
        $e = $entry.envVar
        $val = $e.value
        if ([string]::IsNullOrEmpty($val)) {
            $masked = "(empty)"
        } elseif ($val.Length -gt 12) {
            $masked = $val.Substring(0, 8) + "***($($val.Length) chars)"
        } else {
            $masked = "***($($val.Length) chars)"
        }
        Write-Host ("{0,-40} {1}" -f $e.key, $masked)
    }
} catch {
    Write-Warning "No se pudieron obtener env vars: $_"
}

# Recent deploys
Write-Host ""
Write-Host "--- RECENT DEPLOYS ---" -ForegroundColor Yellow
try {
    $deploys = Invoke-RestMethod -Uri "$svc/deploys?limit=5" -Headers $headers -Method Get
    foreach ($d in $deploys) {
        $statusText = "[$($d.status.ToUpper())]"
        $color = "Gray"
        if ($d.status -eq "live") { $color = "Green" }
        elseif ($d.status -eq "build_failed") { $color = "Red" }
        elseif ($d.status -eq "build_succeeded") { $color = "Cyan" }

        $commitMsg = ""
        if ($d.commit) { $commitMsg = $d.commit.message }
        Write-Host ("{0,-22} {1} {2}" -f $d.createdAt, $statusText, $commitMsg) -ForegroundColor $color
    }
} catch {
    Write-Warning "No se pudieron obtener deploys: $_"
}

# Live health check
Write-Host ""
Write-Host "--- LIVE HEALTH CHECK ---" -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $resp = Invoke-WebRequest -Uri "$($creds.render.service_url)/health" -Method Get -TimeoutSec 30 -UseBasicParsing
    $sw.Stop()
    Write-Host ("Status: {0}  Latency: {1}ms" -f $resp.StatusCode, $sw.ElapsedMilliseconds) -ForegroundColor Green
    Write-Host "Body:   $($resp.Content)" -ForegroundColor Gray
} catch {
    $sw.Stop()
    Write-Host ("Status: TIMEOUT/ERROR  Latency: {0}ms" -f $sw.ElapsedMilliseconds) -ForegroundColor Red
    Write-Host "Error:  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
