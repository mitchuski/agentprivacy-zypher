# Setup lightwalletd to connect to Zebra and generate proper z-addresses

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup lightwalletd + zecwallet-cli" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Zebra is running
Write-Host "[1] Checking Zebra connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8233" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"jsonrpc":"2.0","method":"getinfo","params":[],"id":1}' -ErrorAction Stop
    Write-Host "  ✅ Zebra is running and accessible" -ForegroundColor Green
    Write-Host "     Block height: $($response.result.blocks)" -ForegroundColor White
} catch {
    Write-Host "  ❌ Cannot connect to Zebra at 127.0.0.1:8233" -ForegroundColor Red
    Write-Host "     Make sure Zebra is running" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Create lightwalletd configuration
Write-Host "[2] Creating lightwalletd configuration..." -ForegroundColor Yellow
$configDir = Join-Path $PSScriptRoot "..\..\lightwalletd-config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Read Zebra cookie file for authentication
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
if (-not (Test-Path $cookiePath)) {
    Write-Host "  ⚠️  Zebra cookie file not found at: $cookiePath" -ForegroundColor Yellow
    Write-Host "     You may need to configure authentication manually" -ForegroundColor Yellow
    $rpcUser = Read-Host "Enter Zebra RPC username (or press Enter for default)"
    $rpcPass = Read-Host "Enter Zebra RPC password (or press Enter for default)"
    if ([string]::IsNullOrEmpty($rpcUser)) { $rpcUser = "zebra" }
    if ([string]::IsNullOrEmpty($rpcPass)) { $rpcPass = "zebra" }
} else {
    $cookieContent = Get-Content $cookiePath -Raw
    $cookieParts = $cookieContent.Trim().Split(':')
    $rpcUser = $cookieParts[0]
    $rpcPass = $cookieParts[1]
    Write-Host "  ✅ Read authentication from cookie file" -ForegroundColor Green
}

# Create lightwalletd config file
$configFile = Join-Path $configDir "lightwalletd.conf"
$configContent = @"
# lightwalletd configuration for Zebra
# Connects to Zebra full node

# Zebra RPC connection
zebrad-rpcuser=$rpcUser
zebrad-rpcpass=$rpcPass
zebrad-rpcbind=127.0.0.1
zebrad-rpcport=8233

# lightwalletd server
grpc-bind-addr=127.0.0.1:9067
http-bind-addr=127.0.0.1:8080

# Logging
log-file=lightwalletd.log
log-level=INFO

# Network
network=mainnet
"@

Set-Content -Path $configFile -Value $configContent
Write-Host "  ✅ Configuration file created: $configFile" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for starting lightwalletd
Write-Host "[3] Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To start lightwalletd, run:" -ForegroundColor White
Write-Host "    lightwalletd --config-file=`"$configFile`"" -ForegroundColor Gray
Write-Host ""
Write-Host "  Or use the executable directly:" -ForegroundColor White
Write-Host "    lightwalletd.exe --grpc-bind-addr=127.0.0.1:9067 --http-bind-addr=127.0.0.1:8080 --zcash-conf-path=`"$configFile`"" -ForegroundColor Gray
Write-Host ""

# Step 4: Instructions for generating addresses
Write-Host "[4] After lightwalletd is running, generate addresses:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Connect zecwallet-cli:" -ForegroundColor White
Write-Host "    zecwallet-cli --server 127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""
Write-Host "  In zecwallet-cli, generate addresses:" -ForegroundColor White
Write-Host "    new z    # Generate shielded z-address" -ForegroundColor Gray
Write-Host "    new t    # Generate transparent t-address" -ForegroundColor Gray
Write-Host "    list     # List all addresses" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

