# ============================================================
# vercel-status.ps1 — Estado de los proyectos Vercel
# PowerShell 5.1 compatible
# Uso: .\scripts\infra\vercel-status.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$credPath = "C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json"
$creds = Get-Content $credPath -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($creds.vercel.api_token)" }

Write-Host ""
Write-Host "=== VERCEL ACCOUNT ===" -ForegroundColor Cyan
try {
    $user = Invoke-RestMethod -Uri "$($creds.vercel.api_base_url)/v2/user" -Headers $headers -Method Get
    Write-Host "User: $($user.user.username) ($($user.user.email))"
    Write-Host "Plan: $($user.user.billing.plan) - Active: $($user.user.active)"
    if ($user.user.avatar) {
        Write-Host "Avatar: $($user.user.avatar)"
    }
} catch {
    Write-Warning "Could not fetch user: $_"
}

Write-Host ""
Write-Host "--- PROJECTS ---" -ForegroundColor Yellow
try {
    $projects = Invoke-RestMethod -Uri "$($creds.vercel.api_base_url)/v9/projects?limit=30" -Headers $headers -Method Get
    foreach ($p in $projects.projects) {
        $name = $p.name
        $isKnown = $false
        foreach ($k in $creds.vercel.known_projects) {
            if ($k -eq $name) { $isKnown = $true; break }
        }
        $marker = ""
        if ($isKnown) { $marker = "★ " } else { $marker = "  " }
        $color = "Gray"
        if ($isKnown) { $color = "Cyan" }
        Write-Host ("{0}{1,-40} ID: {2}" -f $marker, $name, $p.id) -ForegroundColor $color

        # Last deploy
        try {
            $deploys = Invoke-RestMethod -Uri "$($creds.vercel.api_base_url)/v6/deployments?projectId=$($p.id)&limit=1" -Headers $headers -Method Get
            $d = $deploys.deployments | Select-Object -First 1
            if ($d) {
                $statusColor = "Gray"
                if ($d.state -eq "READY") { $statusColor = "Green" }
                elseif ($d.state -eq "ERROR") { $statusColor = "Red" }
                elseif ($d.state -eq "BUILDING" -or $d.state -eq "QUEUED") { $statusColor = "Yellow" }
                $commitMsg = ""
                if ($d.meta -and $d.meta.githubCommitMessage) {
                    $commitMsg = $d.meta.githubCommitMessage.Substring(0, [Math]::Min(60, $d.meta.githubCommitMessage.Length))
                }
                Write-Host ("    Last deploy: {0} [{1}] {2}" -f $d.created, $d.state, $d.url) -ForegroundColor $statusColor
                if ($commitMsg) {
                    Write-Host ("    Commit:      {0}" -f $commitMsg) -ForegroundColor DarkGray
                }
            }
        } catch {
            # Silent: some projects may not have deploys yet
        }
    }
} catch {
    Write-Error "Failed to list projects: $_"
}
Write-Host ""
