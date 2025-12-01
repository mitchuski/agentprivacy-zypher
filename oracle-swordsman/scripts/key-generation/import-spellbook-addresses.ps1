# Import spellbook addresses from zecwallet-cli export
# This script helps import addresses into zcash-addresses-controlled.json

param(
    [string]$ExportFile = "",
    [switch]$Interactive = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Import Spellbook Addresses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"

if ($Interactive) {
    Write-Host "Interactive Mode:" -ForegroundColor Yellow
    Write-Host "  1. After generating addresses with zecwallet-cli, run 'export'" -ForegroundColor White
    Write-Host "  2. Copy the export output" -ForegroundColor White
    Write-Host "  3. Paste it here when prompted" -ForegroundColor White
    Write-Host ""
    
    $exportText = Read-Host "Paste the export output (or press Enter to skip)"
    if ([string]::IsNullOrWhiteSpace($exportText)) {
        Write-Host "  ⚠️  No export text provided" -ForegroundColor Yellow
        exit 0
    }
} elseif ($ExportFile -and (Test-Path $ExportFile)) {
    Write-Host "Reading export from file: $ExportFile" -ForegroundColor Yellow
    $exportText = Get-Content $ExportFile -Raw
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\import-spellbook-addresses.ps1 -Interactive" -ForegroundColor Gray
    Write-Host "  .\import-spellbook-addresses.ps1 -ExportFile path\to\export.txt" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or manually update zcash-addresses-controlled.json with:" -ForegroundColor Yellow
    Write-Host "  - Story Spellbook: 12 z-addresses + 12 t-addresses (indices 0-11)" -ForegroundColor Gray
    Write-Host "  - Zero Knowledge Spellbook: 6 z-addresses + 6 t-addresses (indices 12-17)" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Address Mapping:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Story Spellbook (12 acts):" -ForegroundColor White
Write-Host "    Act 1:  z-address[0], t-address[0]" -ForegroundColor Gray
Write-Host "    Act 2:  z-address[1], t-address[1]" -ForegroundColor Gray
Write-Host "    Act 3:  z-address[2], t-address[2]" -ForegroundColor Gray
Write-Host "    ..." -ForegroundColor Gray
Write-Host "    Act 12: z-address[11], t-address[11]" -ForegroundColor Gray
Write-Host ""
Write-Host "  Zero Knowledge Spellbook (6 addresses):" -ForegroundColor White
Write-Host "    Address 1: z-address[12], t-address[12]" -ForegroundColor Gray
Write-Host "    Address 2: z-address[13], t-address[13]" -ForegroundColor Gray
Write-Host "    Address 3: z-address[14], t-address[14]" -ForegroundColor Gray
Write-Host "    Address 4: z-address[15], t-address[15]" -ForegroundColor Gray
Write-Host "    Address 5: z-address[16], t-address[16]" -ForegroundColor Gray
Write-Host "    Address 6: z-address[17], t-address[17]" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Extract addresses from export output" -ForegroundColor White
Write-Host "  2. Map them according to the mapping above" -ForegroundColor White
Write-Host "  3. Update zcash-addresses-controlled.json with proper labels" -ForegroundColor White
Write-Host ""
Write-Host "Example address entry format:" -ForegroundColor Cyan
Write-Host '  {' -ForegroundColor Gray
Write-Host '    "type": "shielded",' -ForegroundColor Gray
Write-Host '    "index": 0,' -ForegroundColor Gray
Write-Host '    "label": "Story Spellbook - Act 1",' -ForegroundColor Gray
Write-Host '    "spendingKey": "...",' -ForegroundColor Gray
Write-Host '    "viewingKey": "...",' -ForegroundColor Gray
Write-Host '    "address": "zs1...",' -ForegroundColor Gray
Write-Host '    "network": "mainnet"' -ForegroundColor Gray
Write-Host '  }' -ForegroundColor Gray
Write-Host ""

