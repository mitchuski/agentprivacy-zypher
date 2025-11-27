# Quick status check for Oracle Swordsman
Write-Host "`n=== Oracle Swordsman Status Check ===`n"

# Check if port is open
$portCheck = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($portCheck) {
    Write-Host "✅ Port 3001 is OPEN" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3001 is not open" -ForegroundColor Red
}

# Check health endpoint
try {
    $response = Invoke-RestMethod -Uri http://localhost:3001/health -TimeoutSec 2
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "   Service: $($response.service)" -ForegroundColor Cyan
    Write-Host "`n🎯 Admin Interface: http://localhost:3001/admin" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    Write-Host "   Service may still be starting or there's an error" -ForegroundColor Yellow
}

# Check Node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
Write-Host "`n📊 Node processes running: $($nodeProcesses.Count)" -ForegroundColor Cyan

Write-Host "`n"


