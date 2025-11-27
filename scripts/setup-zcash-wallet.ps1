# Zcash Wallet Setup Script
# Run this after zecwallet-cli is installed

param(
    [string]$WalletDir = "$PSScriptRoot\..\zcash-wallet",
    [string]$Server = "https://zec.rocks:443"
)

Write-Host "=== Zcash Wallet Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if zecwallet-cli is installed
$zecwalletPath = Get-Command zecwallet-cli -ErrorAction SilentlyContinue
if (-not $zecwalletPath) {
    Write-Host "zecwallet-cli not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install zecwallet-cli first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Install Rust:" -ForegroundColor Yellow
    Write-Host "   Visit: https://rustup.rs/" -ForegroundColor Yellow
    Write-Host "   Or run: Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile 'rustup-init.exe'; .\rustup-init.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Build zecwallet-cli:" -ForegroundColor Yellow
    Write-Host "   cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Add to PATH (if needed):" -ForegroundColor Yellow
    Write-Host "   `$env:Path += ';`$env:USERPROFILE\.cargo\bin'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "zecwallet-cli found: $($zecwalletPath.Source)" -ForegroundColor Green
Write-Host ""

# Create wallet directory
Write-Host "Creating wallet directory: $WalletDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $WalletDir -Force | Out-Null

if (Test-Path $WalletDir) {
    Write-Host "Wallet directory created successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create wallet directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start zecwallet-cli:" -ForegroundColor Yellow
Write-Host "   zecwallet-cli --server $Server --data-dir `"$WalletDir`"" -ForegroundColor White
Write-Host ""
Write-Host "2. In zecwallet-cli, run these commands:" -ForegroundColor Yellow
Write-Host "   new              # Create new wallet (if first time)" -ForegroundColor White
Write-Host "   address          # Get transparent address (for receiving)" -ForegroundColor White
Write-Host "   new z            # Get shielded address (for private pool)" -ForegroundColor White
Write-Host "   backup           # Get seed phrase (SAVE SECURELY!)" -ForegroundColor White
Write-Host "   sync             # Start syncing (takes 4-6 hours first time)" -ForegroundColor White
Write-Host ""
Write-Host "3. Get testnet ZEC:" -ForegroundColor Yellow
Write-Host "   Visit: https://faucet.zecpages.com/" -ForegroundColor White
Write-Host "   Enter your transparent address" -ForegroundColor White
Write-Host ""
Write-Host "4. Add to .env file:" -ForegroundColor Yellow
Write-Host "   ZCASH_DATA_DIR=$WalletDir" -ForegroundColor White
Write-Host "   ZCASH_PUBLIC_INSCRIPTION_ADDRESS=[your transparent address]" -ForegroundColor White
Write-Host "   ZCASH_PRIVATE_SHIELDED_ADDRESS=[your shielded address]" -ForegroundColor White
Write-Host ""

