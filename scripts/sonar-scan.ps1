param (
    [string]$Token = ""
)

$HostUrl = 'http://localhost:9000'

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '            SportMatch Connect — SonarQube Scan' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan

# 1. Check if SonarQube server is running
Write-Host "Checking if SonarQube is running at $HostUrl..." -ForegroundColor Gray
$serverCheck = Test-NetConnection -ComputerName localhost -Port 9000 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $serverCheck) {
    Write-Host 'Error: SonarQube server is not running or not reachable on port 9000.' -ForegroundColor Red
    Write-Host 'Please start the SonarQube container first by running: npm run sonar:up' -ForegroundColor Yellow
    Exit 1
}
Write-Host 'SonarQube server is reachable!' -ForegroundColor Green

# 2. Run the scanner
Write-Host 'Launching SonarQube scanner via npx sonarqube-scanner...' -ForegroundColor Gray

$scanArgs = @()
if ($Token) {
    $scanArgs += "-Dsonar.token=$Token"
} else {
    Write-Host 'Warning: No token provided. If your SonarQube instance requires authentication, the scan may fail.' -ForegroundColor Yellow
    Write-Host 'Tip: You can pass a token using: .\scripts\sonar-scan.ps1 -Token YOUR_TOKEN' -ForegroundColor Yellow
}

# Run npx sonarqube-scanner
npx sonarqube-scanner $scanArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host '==========================================================' -ForegroundColor Green
    Write-Host '   Scan Completed Successfully!' -ForegroundColor Green
    Write-Host '   View results at: http://localhost:9000/dashboard?id=sportmatch-connect' -ForegroundColor Green
    Write-Host '==========================================================' -ForegroundColor Green
} else {
    Write-Host 'Scan failed. Please check the logs above for errors.' -ForegroundColor Red
    Exit $LASTEXITCODE
}
