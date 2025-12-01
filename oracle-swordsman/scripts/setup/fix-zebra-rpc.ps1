# Fix Zebra RPC Configuration
# This script ensures Zebra RPC is properly enabled

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Zebra RPC Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current Zebra status
Write-Host "[1] Checking Zebra status..." -ForegroundColor Yellow
$zebradProcess = Get-Process zebrad -ErrorAction SilentlyContinue
if ($zebradProcess) {
    Write-Host "  ✅ Zebra is running (PID: $($zebradProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Zebra is not running" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Check/Update config file
Write-Host "[2] Checking Zebra config..." -ForegroundColor Yellow
$zebraConfigPath = "$env:APPDATA\zebrad.toml"
$configDir = Split-Path $zebraConfigPath -Parent

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "  ✅ Created config directory" -ForegroundColor Green
}

# Create/Update config with correct RPC settings
$configContent = @"
[network]
network = "Mainnet"

[rpc]
bind_addr = "127.0.0.1:8233"
enable_cookie_auth = true
cookie_dir = "C:/Users/$env:USERNAME/AppData/Local/zebra"
"@

Set-Content -Path $zebraConfigPath -Value $configContent
Write-Host "  ✅ Config file updated: $zebraConfigPath" -ForegroundColor Green
Write-Host ""
Write-Host "  Config contents:" -ForegroundColor White
Get-Content $zebraConfigPath | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
Write-Host ""

# Step 3: Restart Zebra
Write-Host "[3] Restarting Zebra to apply config..." -ForegroundColor Yellow
if ($zebradProcess) {
    Write-Host "  Stopping current Zebra process..." -ForegroundColor Gray
    Stop-Process -Name zebrad -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

Write-Host "  Starting Zebra..." -ForegroundColor Gray
Start-Process -FilePath "zebrad" -ArgumentList "start" -WindowStyle Hidden
Start-Sleep -Seconds 10

# Step 4: Verify RPC is working
Write-Host "[4] Verifying RPC is enabled..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if RPC port is listening
$rpcListening = netstat -an | Select-String "127.0.0.1:8233.*LISTENING"
if ($rpcListening) {
    Write-Host "  ✅ Zebra RPC is listening on 127.0.0.1:8233!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  RPC port not listening yet" -ForegroundColor Yellow
    Write-Host "     This may take 30-60 seconds for Zebra to fully start" -ForegroundColor Gray
}

# Check cookie file
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
if (Test-Path $cookiePath) {
    Write-Host "  ✅ Cookie file exists: $cookiePath" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Cookie file not found yet (may be created soon)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test lightwalletd connection
Write-Host "[5] Testing lightwalletd connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$lightwalletdLog = "$env:USERPROFILE\lightwalletd-data\lightwalletd.log"
if (Test-Path $lightwalletdLog) {
    $recentLogs = Get-Content $lightwalletdLog -Tail 5 | Select-String -Pattern "getblockchaininfo|Connected|error" -Context 0,0
    if ($recentLogs -match "error") {
        Write-Host "  ⚠️  lightwalletd still showing connection errors" -ForegroundColor Yellow
        Write-Host "     Wait a bit longer for Zebra to fully initialize" -ForegroundColor Gray
    } else {
        Write-Host "  ✅ No recent errors in lightwalletd logs" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Zebra config updated at: $zebraConfigPath" -ForegroundColor Green
Write-Host "✅ Zebra restarted" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 30-60 seconds for Zebra to fully start" -ForegroundColor White
Write-Host "  2. Check RPC: netstat -an | Select-String '127.0.0.1:8233.*LISTENING'" -ForegroundColor Gray
Write-Host "  3. Try zecwallet-cli: zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""
Write-Host "If RPC still doesn't work:" -ForegroundColor Yellow
Write-Host "  - Check Zebra logs for errors" -ForegroundColor White
Write-Host "  - Verify Zebra version supports RPC: zebrad --version" -ForegroundColor White
Write-Host "  - Try starting Zebra manually to see error messages" -ForegroundColor White
Write-Host ""


