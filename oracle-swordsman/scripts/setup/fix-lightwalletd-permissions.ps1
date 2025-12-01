# Fix lightwalletd permission issues

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix lightwalletd Permissions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any running lightwalletd
Write-Host "[1] Stopping lightwalletd..." -ForegroundColor Yellow
Get-Process lightwalletd -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "  ✅ Stopped" -ForegroundColor Green
Write-Host ""

# Remove problematic database files
Write-Host "[2] Cleaning up database files..." -ForegroundColor Yellow
$dataDirs = @(
    "$env:USERPROFILE\.cache\lightwalletd\db",
    "$env:USERPROFILE\lightwalletd-data\db"
)

foreach ($dbPath in $dataDirs) {
    if (Test-Path $dbPath) {
        try {
            Remove-Item -Path $dbPath -Recurse -Force -ErrorAction Stop
            Write-Host "  ✅ Removed: $dbPath" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Could not remove: $dbPath" -ForegroundColor Yellow
            Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
            Write-Host "     Try running PowerShell as Administrator" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Check if we can create files in data directory
Write-Host "[3] Testing file permissions..." -ForegroundColor Yellow
$testDir = "$env:USERPROFILE\lightwalletd-data"
New-Item -ItemType Directory -Force -Path $testDir | Out-Null

$testFile = Join-Path $testDir "test-write.txt"
try {
    "test" | Out-File -FilePath $testFile -Force
    Remove-Item -Path $testFile -Force
    Write-Host "  ✅ File permissions OK" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  File permission issue: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "     Try running PowerShell as Administrator" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[4] Solution:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option A: Use --no-cache flag (recommended)" -ForegroundColor White
Write-Host "    .\scripts\setup\start-lightwalletd-manual.ps1" -ForegroundColor Gray
Write-Host "    (Already configured with --no-cache)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option B: Run as Administrator" -ForegroundColor White
Write-Host "    1. Right-click PowerShell" -ForegroundColor Gray
Write-Host "    2. Run as Administrator" -ForegroundColor Gray
Write-Host "    3. Run: .\scripts\setup\start-lightwalletd-manual.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option C: Use different data directory" -ForegroundColor White
Write-Host "    lightwalletd.exe --data-dir C:\lightwalletd-data ..." -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

