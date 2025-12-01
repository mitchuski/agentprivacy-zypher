# Update zcash-addresses-controlled.json with addresses from zecwallet-cli export

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Addresses from Export" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"

# Export data from terminal (first 18 z-addresses and 18 t-addresses)
# Based on the terminal selection provided

# Extract addresses from the export
# The export format has: address, private_key (or spendingKey), viewing_key

# For now, we'll create a script that reads from a saved export file
# The user should save the export JSON to a file first

Write-Host "To import your addresses:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Save export to file and run:" -ForegroundColor White
Write-Host "  1. Save the export JSON from zecwallet-cli to: export.json" -ForegroundColor Gray
Write-Host "  2. Run: .\parse-zecwallet-export.ps1 -ExportFile export.json" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Interactive mode:" -ForegroundColor White
Write-Host "  .\parse-zecwallet-export.ps1 -Interactive" -ForegroundColor Gray
Write-Host "  (Then paste the export JSON when prompted)" -ForegroundColor Gray
Write-Host ""

# Check if export file exists
$exportFile = Join-Path $PSScriptRoot "export.json"
if (Test-Path $exportFile) {
    Write-Host "Found export.json, processing..." -ForegroundColor Green
    & (Join-Path $PSScriptRoot "parse-zecwallet-export.ps1") -ExportFile $exportFile
} else {
    Write-Host "No export.json found. Please:" -ForegroundColor Yellow
    Write-Host "  1. Copy the export JSON from zecwallet-cli" -ForegroundColor White
    Write-Host "  2. Save it to: scripts\key-generation\export.json" -ForegroundColor Gray
    Write-Host "  3. Run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run: .\parse-zecwallet-export.ps1 -Interactive" -ForegroundColor Cyan
}

