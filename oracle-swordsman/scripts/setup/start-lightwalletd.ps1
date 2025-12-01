# Start lightwalletd connected to Zebra

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Start lightwalletd" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if lightwalletd is already running
$lightwalletdProcess = Get-Process -Name lightwalletd -ErrorAction SilentlyContinue
if ($lightwalletdProcess) {
    Write-Host "⚠️  lightwalletd is already running (PID: $($lightwalletdProcess.Id))" -ForegroundColor Yellow
    Write-Host "   Stop it first if you want to restart" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Create zcash.conf file for lightwalletd
Write-Host "[1] Creating zcash.conf for lightwalletd..." -ForegroundColor Yellow
$configDir = "$env:USERPROFILE\.config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$zcashConfPath = Join-Path $configDir "zcash.conf"

# Read Zebra cookie file for authentication
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
if (Test-Path $cookiePath) {
    $cookieContent = Get-Content $cookiePath -Raw
    $cookieParts = $cookieContent.Trim().Split(':')
    $rpcUser = $cookieParts[0]
    $rpcPass = $cookieParts[1]
    Write-Host "  ✅ Read authentication from cookie file" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Cookie file not found, using defaults" -ForegroundColor Yellow
    $rpcUser = "zebra"
    $rpcPass = "zebra"
}

# Create zcash.conf
$zcashConf = @"
# Zcash configuration for lightwalletd
# This file tells lightwalletd how to connect to Zebra

rpcuser=$rpcUser
rpcpassword=$rpcPass
rpcbind=127.0.0.1
rpcport=8233
"@

Set-Content -Path $zcashConfPath -Value $zcashConf
Write-Host "  ✅ Created: $zcashConfPath" -ForegroundColor Green
Write-Host ""

# Create data directory
Write-Host "[2] Creating data directory..." -ForegroundColor Yellow
$dataDir = "$env:USERPROFILE\.cache\lightwalletd"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

# Clean up any locked database files
$dbPath = Join-Path $dataDir "db\main"
if (Test-Path $dbPath) {
    Remove-Item -Path "$dbPath\lengths" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Cleaned up database files" -ForegroundColor Green
}

Write-Host "  ✅ Data directory: $dataDir" -ForegroundColor Green
Write-Host ""

# Start lightwalletd
Write-Host "[3] Starting lightwalletd..." -ForegroundColor Yellow
Write-Host ""

$logFile = Join-Path $dataDir "lightwalletd.log"

# Build command
$lightwalletdArgs = @(
    "--zcash-conf-path", "`"$zcashConfPath`"",
    "--data-dir", "`"$dataDir`"",
    "--log-file", "`"$logFile`"",
    "--grpc-bind-addr", "127.0.0.1:9067",
    "--http-bind-addr", "127.0.0.1:8080",
    "--no-tls-very-insecure"
)

Write-Host "  Command:" -ForegroundColor White
Write-Host "    lightwalletd.exe $($lightwalletdArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# Start in background
Start-Process -FilePath "lightwalletd.exe" -ArgumentList $lightwalletdArgs -WindowStyle Minimized

Write-Host "  ✅ lightwalletd started in background" -ForegroundColor Green
Write-Host ""
Write-Host "  Waiting 5 seconds for initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if it's running
$lightwalletdProcess = Get-Process -Name lightwalletd -ErrorAction SilentlyContinue
if ($lightwalletdProcess) {
    Write-Host "  ✅ lightwalletd is running (PID: $($lightwalletdProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  lightwalletd may have failed to start" -ForegroundColor Yellow
    Write-Host "     Check logs: $logFile" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4] Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Wait for lightwalletd to sync (may take a few minutes)" -ForegroundColor White
Write-Host "  2. Check logs: Get-Content `"$logFile`" -Tail 20" -ForegroundColor Gray
Write-Host "  3. Connect zecwallet-cli:" -ForegroundColor White
Write-Host "     zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host "  4. Generate addresses:" -ForegroundColor White
Write-Host "     new z    # Generate z-address" -ForegroundColor Gray
Write-Host "     new t    # Generate t-address" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

