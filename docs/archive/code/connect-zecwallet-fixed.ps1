# Connect zecwallet-cli to lightwalletd (Fixed)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connect zecwallet-cli to lightwalletd" -ForegroundColor Cyan
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
    Write-Host "     Wait a few more seconds and try again" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✅ Port 9067 is accessible" -ForegroundColor Green
Write-Host ""

# Create wallet data directory
Write-Host "[3] Setting up wallet directory..." -ForegroundColor Yellow
$walletDir = "$env:USERPROFILE\zecwallet-data"
New-Item -ItemType Directory -Force -Path $walletDir | Out-Null
Write-Host "  ✅ Wallet directory: $walletDir" -ForegroundColor Green
Write-Host ""

# Connect zecwallet-cli
Write-Host "[4] Connecting zecwallet-cli..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Command:" -ForegroundColor White
Write-Host "    zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""
Write-Host "  Note: zecwallet-cli will detect network from lightwalletd" -ForegroundColor Yellow
Write-Host "        If it fails, lightwalletd may need to be fully synced first" -ForegroundColor Yellow
Write-Host ""

# Try to connect
Write-Host "  Starting zecwallet-cli..." -ForegroundColor White
Write-Host "  (If you see network errors, wait for lightwalletd to sync)" -ForegroundColor Gray
Write-Host ""

try {
    & zecwallet-cli --server http://127.0.0.1:9067
} catch {
    Write-Host ""
    Write-Host "  ❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Troubleshooting:" -ForegroundColor Yellow
    Write-Host "    1. Check lightwalletd logs:" -ForegroundColor Gray
    Write-Host "       Get-Content `"$env:USERPROFILE\lightwalletd-data\lightwalletd.log`" -Tail 20" -ForegroundColor DarkGray
    Write-Host "    2. Make sure lightwalletd is fully synced" -ForegroundColor Gray
    Write-Host "    3. Try again in a few minutes" -ForegroundColor Gray
    Write-Host ""
}

