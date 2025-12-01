# Check Backend Status
# Verifies all required services are running

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Backend Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check if Oracle service is running
Write-Host "[1] Checking Oracle API service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Oracle API is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Oracle API responded with status: $($response.StatusCode)" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Oracle API is not running" -ForegroundColor Red
    Write-Host "      Start with: npm start (in oracle-swordsman directory)" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check if Zebra is running
Write-Host "[2] Checking Zebra node..." -ForegroundColor Yellow
try {
    $cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
    if (Test-Path $cookiePath) {
        $zebradProcess = Get-Process -Name zebrad -ErrorAction SilentlyContinue
        if ($zebradProcess) {
            Write-Host "   ✅ Zebra is running (PID: $($zebradProcess.Id))" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Zebra process not found" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        Write-Host "   ⚠️  Zebra cookie file not found" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Could not check Zebra status" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check database connection
Write-Host "[3] Checking database connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/wallet/addresses" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Database connection working" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database may have issues (status: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not verify database (API may not be running)" -ForegroundColor Yellow
}

Write-Host ""

# Summary
if ($allGood) {
    Write-Host "✅ All services are running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services need attention" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Start:" -ForegroundColor Cyan
    Write-Host "  1. Ensure Zebra is running" -ForegroundColor White
    Write-Host "  2. cd oracle-swordsman" -ForegroundColor White
    Write-Host "  3. npm run build (if needed)" -ForegroundColor White
    Write-Host "  4. npm start" -ForegroundColor White
}

Write-Host ""

