# Interactive script to generate addresses with zecwallet-cli

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generate Proper Z-Addresses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check lightwalletd
Write-Host "[1] Checking lightwalletd..." -ForegroundColor Yellow
$lightwalletdProcess = Get-Process -Name lightwalletd -ErrorAction SilentlyContinue
if (-not $lightwalletdProcess) {
    Write-Host "  ❌ lightwalletd is not running" -ForegroundColor Red
    Write-Host "     Start it first: .\scripts\setup\start-lightwalletd-manual.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ lightwalletd is running (PID: $($lightwalletdProcess.Id))" -ForegroundColor Green

$portTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 9067 -InformationLevel Quiet
if ($portTest) {
    Write-Host "  ✅ Port 9067 is accessible" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Port 9067 not accessible" -ForegroundColor Yellow
}
Write-Host ""

# Instructions
Write-Host "[2] Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run this command in a NEW terminal window:" -ForegroundColor White
Write-Host "    zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""
Write-Host "  Once connected, run these commands in zecwallet-cli:" -ForegroundColor White
Write-Host "    new z          # Generate shielded z-address" -ForegroundColor Gray
Write-Host "    new z          # Generate another z-address (repeat as needed)" -ForegroundColor Gray
Write-Host "    new t          # Generate transparent t-address (optional)" -ForegroundColor Gray
Write-Host "    list           # List all addresses" -ForegroundColor Gray
Write-Host "    export         # Export wallet (SAVE THIS OUTPUT!)" -ForegroundColor Gray
Write-Host ""

Write-Host "[3] After generating addresses:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option A: Use the mnemonic from 'export' command" -ForegroundColor White
Write-Host "    - Copy the mnemonic from export output" -ForegroundColor Gray
Write-Host "    - Update zcash-addresses-controlled.json with new mnemonic" -ForegroundColor Gray
Write-Host "    - Regenerate addresses using existing scripts" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option B: Manually add addresses" -ForegroundColor White
Write-Host "    - Copy addresses from 'list' command" -ForegroundColor Gray
Write-Host "    - Get spending keys from export" -ForegroundColor Gray
Write-Host "    - Add to zcash-addresses-controlled.json" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to Generate!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

