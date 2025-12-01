# Continue Production Setup
# This script helps you continue from where the production flow setup left off

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Continue Production Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix Database
Write-Host "[1] Fix Database (proverb_stats view)" -ForegroundColor Yellow
Write-Host "   Running database fix script..." -ForegroundColor White
$dbScript = Join-Path $PSScriptRoot "database\apply-fix.ps1"
if (Test-Path $dbScript) {
    & $dbScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Database fix had issues, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Database fix script not found, run manually:" -ForegroundColor Yellow
    Write-Host "      psql -U proverb_user -d proverb_protocol -f scripts/database/fix-proverb-stats.sql" -ForegroundColor White
}
Write-Host ""

# Step 2: Check Nillion Setup
Write-Host "[2] Check Nillion SecretSigner Setup" -ForegroundColor Yellow
Write-Host "   Current status: Key not stored (needs workload deployment)" -ForegroundColor White
Write-Host ""
Write-Host "   Options:" -ForegroundColor Cyan
Write-Host "   A. Deploy SecretSigner workload:" -ForegroundColor White
Write-Host "      npx ts-node scripts/deployment/setup-with-keys.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "   B. Build SecretSigner image first (if needed):" -ForegroundColor White
Write-Host "      npm run build:secretsigner" -ForegroundColor Gray
Write-Host ""
Write-Host "   Note: Oracle can run without Nillion key stored," -ForegroundColor Yellow
Write-Host "         but transactions won't be signed automatically" -ForegroundColor Yellow
Write-Host ""

# Step 3: Start Oracle Service
Write-Host "[3] Start Oracle Service" -ForegroundColor Yellow
Write-Host "   Command: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   Expected output:" -ForegroundColor Cyan
Write-Host "   ✓ Database connected" -ForegroundColor Green
Write-Host "   ✓ Zcash client connected" -ForegroundColor Green
Write-Host "   ✓ IPFS client connected" -ForegroundColor Green
Write-Host "   ✓ NEAR Cloud AI ready" -ForegroundColor Green
Write-Host "   ✓ Nillion initialized" -ForegroundColor Green
Write-Host "   ✓ API server started on port 3001" -ForegroundColor Green
Write-Host "   ✓ Transaction monitor started" -ForegroundColor Green
Write-Host ""

# Step 4: Test Submission
Write-Host "[4] Test Proverb Submission" -ForegroundColor Yellow
Write-Host "   A. Using test script:" -ForegroundColor White
Write-Host "      npm run test:submission" -ForegroundColor Gray
Write-Host ""
Write-Host "   B. Real transaction (using Zashi/Zallet):" -ForegroundColor White
Write-Host "      1. Create memo:" -ForegroundColor Gray
Write-Host "         rpp-v1" -ForegroundColor DarkGray
Write-Host "         tale:act-i" -ForegroundColor DarkGray
Write-Host "         Privacy is the foundation of freedom." -ForegroundColor DarkGray
Write-Host ""
Write-Host "      2. Send to z-address: zs1pgazk5q3haxap96mc..." -ForegroundColor Gray
Write-Host "      3. Amount: 0.01 ZEC (minimum)" -ForegroundColor Gray
Write-Host "      4. Include memo in transaction" -ForegroundColor Gray
Write-Host ""

# Step 5: Monitor Results
Write-Host "[5] Monitor Results" -ForegroundColor Yellow
Write-Host "   A. Check Oracle logs for processing" -ForegroundColor White
Write-Host "   B. Check wallet interface: http://localhost:3000/wallet" -ForegroundColor White
Write-Host "   C. Verify in database:" -ForegroundColor White
Write-Host "      psql -U proverb_user -d proverb_protocol -c 'SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to Continue!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Yellow
Write-Host "  1. Fix database: .\scripts\database\apply-fix.ps1" -ForegroundColor White
Write-Host "  2. Start Oracle: npm run dev" -ForegroundColor White
Write-Host "  3. Test: npm run test:submission" -ForegroundColor White
Write-Host ""

