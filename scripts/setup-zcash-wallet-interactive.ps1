# Interactive Zcash Wallet Setup Script
# This script helps you create and configure your Zcash wallet

param(
    [string]$WalletDir = "$PSScriptRoot\..\zcash-wallet",
    [string]$Server = "https://zec.rocks:443"
)

Write-Host "=== Zcash Wallet Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if zecwallet-cli is available
try {
    $version = zecwallet-cli --version 2>&1
    Write-Host "✅ zecwallet-cli found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ zecwallet-cli not found in PATH" -ForegroundColor Red
    Write-Host "   Add to PATH: `$env:Path += ';`$env:USERPROFILE\.cargo\bin'" -ForegroundColor Yellow
    exit 1
}

# Create wallet directory
if (-not (Test-Path $WalletDir)) {
    New-Item -ItemType Directory -Path $WalletDir -Force | Out-Null
    Write-Host "✅ Created wallet directory: $WalletDir" -ForegroundColor Green
} else {
    Write-Host "✅ Wallet directory exists: $WalletDir" -ForegroundColor Green
}

# Check if wallet already exists
$walletFile = Join-Path $WalletDir "zecwallet-light-wallet.dat"
if (Test-Path $walletFile) {
    Write-Host ""
    Write-Host "⚠️  Wallet already exists at: $walletFile" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to create a new wallet? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Using existing wallet. Starting zecwallet-cli..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Starting zecwallet-cli..." -ForegroundColor Cyan
        Write-Host "Server: $Server" -ForegroundColor White
        Write-Host "Data Dir: $WalletDir" -ForegroundColor White
        Write-Host ""
        zecwallet-cli --server $Server --data-dir $WalletDir
        exit 0
    }
}

Write-Host ""
Write-Host "=== Starting zecwallet-cli ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "In the zecwallet-cli prompt, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create new wallet:" -ForegroundColor White
Write-Host "   new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Get transparent address (for receiving submissions):" -ForegroundColor White
Write-Host "   address" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Get shielded address (for private pool):" -ForegroundColor White
Write-Host "   new z" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Get backup seed phrase (SAVE SECURELY!):" -ForegroundColor White
Write-Host "   backup" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start syncing (takes 4-6 hours first time):" -ForegroundColor White
Write-Host "   sync" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Check balance:" -ForegroundColor White
Write-Host "   balance" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Exit when done:" -ForegroundColor White
Write-Host "   exit" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to start zecwallet-cli..." -ForegroundColor Cyan
Read-Host

Write-Host "Starting zecwallet-cli..." -ForegroundColor Green
Write-Host ""

zecwallet-cli --server $Server --data-dir $WalletDir




