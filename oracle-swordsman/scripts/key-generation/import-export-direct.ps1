# Direct import from terminal selection - parse the export data

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Import zecwallet-cli Export" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"

# The export data from terminal (first 18 z-addresses and 18 t-addresses)
# We'll read from a file or parse directly

Write-Host "Please provide the export data:" -ForegroundColor Yellow
Write-Host "  1. Save the export JSON to a file, OR" -ForegroundColor White
Write-Host "  2. Run: .\parse-zecwallet-export.ps1 -Interactive" -ForegroundColor Gray
Write-Host ""

# For now, create a template script that the user can run
Write-Host "Creating import script..." -ForegroundColor Yellow

$scriptContent = @'
# Import script - paste your export JSON here

$exportJson = @'
PASTE_YOUR_EXPORT_JSON_HERE
'@

$exportData = $exportJson | ConvertFrom-Json

# Separate addresses
$zAddresses = @()
$tAddresses = @()

foreach ($addr in $exportData) {
    if ($addr.address -like "zs1*") {
        $zAddresses += $addr
    } elseif ($addr.address -like "t1*") {
        $tAddresses += $addr
    }
}

Write-Host "Found $($zAddresses.Count) z-addresses and $($tAddresses.Count) t-addresses" -ForegroundColor Green

# Continue with formatting...
'@

$importScript = Join-Path $PSScriptRoot "import-export-manual.ps1"
$scriptContent | Set-Content $importScript

Write-Host "✅ Created: $importScript" -ForegroundColor Green
Write-Host "   Edit this file and paste your export JSON, then run it" -ForegroundColor Yellow
Write-Host ""

