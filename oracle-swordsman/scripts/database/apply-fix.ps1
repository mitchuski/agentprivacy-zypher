# Apply Database Fix Script
# Creates the proverb_stats view in the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Applying Database Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptPath "fix-proverb-stats.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 SQL File: $sqlFile" -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ psql not found in PATH" -ForegroundColor Red
    Write-Host "   Please ensure PostgreSQL is installed and psql is in your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 Applying database fix..." -ForegroundColor Yellow
Write-Host ""

# Apply SQL file
$env:PGPASSWORD = "proverb_password"
psql -U proverb_user -d proverb_protocol -h localhost -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database fix applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify view exists: psql -U proverb_user -d proverb_protocol -c 'SELECT * FROM proverb_stats;'" -ForegroundColor White
    Write-Host "  2. Start Oracle service: npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to apply database fix" -ForegroundColor Red
    Write-Host "   Check PostgreSQL connection and credentials" -ForegroundColor Yellow
    exit 1
}

