# Connect zecwallet-cli to lightwalletd

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connect zecwallet-cli" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if lightwalletd is running
Write-Host "[1] Checking lightwalletd..." -ForegroundColor Yellow
$lightwalletdProcess = Get-Process -Name lightwalletd -ErrorAction SilentlyContinue
if (-not $lightwalletdProcess) {
    Write-Host "  ❌ lightwalletd is not running" -ForegroundColor Red
    Write-Host "     Start it first: .\scripts\setup\start-lightwalletd-manual.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ lightwalletd is running (PID: $($lightwalletdProcess.Id))" -ForegroundColor Green
Write-Host ""

# Test connection
Write-Host "[2] Testing connection..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 9067 -InformationLevel Quiet
if (-not $portTest) {
    Write-Host "  ⚠️  Port 9067 not accessible" -ForegroundColor Yellow
    Write-Host "     lightwalletd may still be starting up" -ForegroundColor Gray
} else {
    Write-Host "  ✅ Port 9067 is accessible" -ForegroundColor Green
}
Write-Host ""

# Connect zecwallet-cli
Write-Host "[3] Connecting zecwallet-cli..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Command:" -ForegroundColor White
Write-Host "    zecwallet-cli --server http://127.0.0.1:9067 --network mainnet" -ForegroundColor Gray
Write-Host ""

Write-Host "  Note: zecwallet-cli needs --network flag to specify mainnet" -ForegroundColor Yellow
Write-Host ""

# Try to connect
try {
    & zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
} catch {
    Write-Host "  ❌ Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Troubleshooting:" -ForegroundColor Yellow
    Write-Host "    1. Make sure lightwalletd is fully synced" -ForegroundColor Gray
    Write-Host "    2. Check lightwalletd logs for errors" -ForegroundColor Gray
    Write-Host "    3. Try: zecwallet-cli --server http://127.0.0.1:9067 --network mainnet" -ForegroundColor Gray
}

