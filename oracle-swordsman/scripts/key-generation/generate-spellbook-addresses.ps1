# Generate addresses for spellbook acts
# Story Spellbook: 12 acts (12 z-addresses + 12 t-addresses)
# Zero Knowledge Spellbook: 6 z-addresses + 6 t-addresses
# Total: 18 z-addresses + 18 t-addresses

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generate Spellbook Addresses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check lightwalletd
Write-Host "[1] Checking lightwalletd..." -ForegroundColor Yellow
$lightwalletdProcess = Get-Process -Name lightwalletd -ErrorAction SilentlyContinue
if (-not $lightwalletdProcess) {
    Write-Host "  ❌ lightwalletd is not running" -ForegroundColor Red
    Write-Host "     Start it first: .\scripts\setup\quick-start-lightwalletd.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ lightwalletd is running (PID: $($lightwalletdProcess.Id))" -ForegroundColor Green

$portTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 9067 -InformationLevel Quiet
if (-not $portTest) {
    Write-Host "  ❌ Port 9067 not accessible" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Port 9067 is accessible" -ForegroundColor Green
Write-Host ""

# Address requirements
Write-Host "[2] Address Requirements:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Story Spellbook (First Spellbook):" -ForegroundColor White
Write-Host "    - 12 z-addresses (one per act)" -ForegroundColor Gray
Write-Host "    - 12 t-addresses (one per act)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Zero Knowledge Spellbook (Z Spellbook):" -ForegroundColor White
Write-Host "    - 6 z-addresses" -ForegroundColor Gray
Write-Host "    - 6 t-addresses" -ForegroundColor Gray
Write-Host ""
Write-Host "  Total: 18 z-addresses + 18 t-addresses = 36 addresses" -ForegroundColor Cyan
Write-Host ""

# Instructions
Write-Host "[3] Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  This script will help you generate addresses using zecwallet-cli." -ForegroundColor White
Write-Host "  Since zecwallet-cli is interactive, you'll need to run commands manually." -ForegroundColor White
Write-Host ""
Write-Host "  Step 1: Connect zecwallet-cli" -ForegroundColor Cyan
Write-Host "    zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""
Write-Host "  Step 2: Generate Story Spellbook addresses (12 acts)" -ForegroundColor Cyan
Write-Host "    Run these commands 12 times each:" -ForegroundColor White
Write-Host "      new z    # Generate z-address for act 1" -ForegroundColor Gray
Write-Host "      new t    # Generate t-address for act 1" -ForegroundColor Gray
Write-Host "      new z    # Generate z-address for act 2" -ForegroundColor Gray
Write-Host "      new t    # Generate t-address for act 2" -ForegroundColor Gray
Write-Host "      ... (repeat for all 12 acts)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Step 3: Generate Zero Knowledge Spellbook addresses (6 addresses)" -ForegroundColor Cyan
Write-Host "    Run these commands 6 times each:" -ForegroundColor White
Write-Host "      new z    # Generate z-address 1" -ForegroundColor Gray
Write-Host "      new t    # Generate t-address 1" -ForegroundColor Gray
Write-Host "      new z    # Generate z-address 2" -ForegroundColor Gray
Write-Host "      new t    # Generate t-address 2" -ForegroundColor Gray
Write-Host "      ... (repeat for all 6)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Step 4: Export and save" -ForegroundColor Cyan
Write-Host "    list      # List all addresses" -ForegroundColor Gray
Write-Host "    export    # Export wallet (SAVE THIS OUTPUT!)" -ForegroundColor Gray
Write-Host ""

# Generate command list
Write-Host "[4] Quick Command List:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Copy and paste these commands into zecwallet-cli:" -ForegroundColor White
Write-Host ""

# Story Spellbook: 12 acts
Write-Host "  # Story Spellbook - Act 1" -ForegroundColor DarkGray
Write-Host "  new z" -ForegroundColor Gray
Write-Host "  new t" -ForegroundColor Gray
Write-Host ""

for ($i = 2; $i -le 12; $i++) {
    Write-Host "  # Story Spellbook - Act $i" -ForegroundColor DarkGray
    Write-Host "  new z" -ForegroundColor Gray
    Write-Host "  new t" -ForegroundColor Gray
    Write-Host ""
}

# Zero Knowledge Spellbook: 6 addresses
Write-Host "  # Zero Knowledge Spellbook - Address 1" -ForegroundColor DarkGray
Write-Host "  new z" -ForegroundColor Gray
Write-Host "  new t" -ForegroundColor Gray
Write-Host ""

for ($i = 2; $i -le 6; $i++) {
    Write-Host "  # Zero Knowledge Spellbook - Address $i" -ForegroundColor DarkGray
    Write-Host "  new z" -ForegroundColor Gray
    Write-Host "  new t" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "  # Export all addresses" -ForegroundColor DarkGray
Write-Host "  list" -ForegroundColor Gray
Write-Host "  export" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to Generate!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next: Open a new terminal and run:" -ForegroundColor Yellow
Write-Host "    zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
Write-Host ""

