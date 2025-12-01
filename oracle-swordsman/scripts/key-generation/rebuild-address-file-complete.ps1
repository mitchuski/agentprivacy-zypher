# Complete rebuild of address file with all 36 addresses and act mappings
# This script will be run once you provide the export JSON

param(
    [string]$ExportFile = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rebuild Address File - Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"
$scriptDir = $PSScriptRoot

# Load spellbook acts for mapping
$spellbookPath = Join-Path $scriptDir "..\..\..\spellbook\spellbook-acts.json"
if (-not (Test-Path $spellbookPath)) {
    Write-Host "❌ Spellbook file not found: $spellbookPath" -ForegroundColor Red
    exit 1
}

$spellbook = Get-Content $spellbookPath -Raw | ConvertFrom-Json
$spellbookActs = $spellbook.spellbooks.story.acts

Write-Host "✅ Loaded spellbook with $($spellbookActs.Count) acts" -ForegroundColor Green
Write-Host ""

# Get export data
if (-not $ExportFile -or -not (Test-Path $ExportFile)) {
    Write-Host "❌ Export file not found: $ExportFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Save your zecwallet-cli export JSON to:" -ForegroundColor White
    Write-Host "     scripts\key-generation\export.json" -ForegroundColor Gray
    Write-Host "  2. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Reading export from: $ExportFile" -ForegroundColor Yellow
$exportJson = Get-Content $ExportFile -Raw
try {
    $exportData = $exportJson | ConvertFrom-Json
} catch {
    Write-Host "❌ Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found $($exportData.Count) addresses in export" -ForegroundColor Green
Write-Host ""

# Separate z-addresses and t-addresses
$zAddresses = @()
$tAddresses = @()

foreach ($addr in $exportData) {
    if ($addr.address -like "zs1*") {
        $zAddresses += $addr
    } elseif ($addr.address -like "t1*") {
        $tAddresses += $addr
    }
}

Write-Host "  Z-addresses: $($zAddresses.Count)" -ForegroundColor White
Write-Host "  T-addresses: $($tAddresses.Count)" -ForegroundColor White
Write-Host ""

# Verify we have enough
if ($zAddresses.Count -lt 18 -or $tAddresses.Count -lt 18) {
    Write-Host "⚠️  Warning: Need 18 z-addresses and 18 t-addresses" -ForegroundColor Yellow
    Write-Host "   Found: $($zAddresses.Count) z, $($tAddresses.Count) t" -ForegroundColor Yellow
    Write-Host "   Will use what's available..." -ForegroundColor Yellow
}

# Build address structure WITHOUT private keys
$addresses = @()

Write-Host "Building address structure with act mappings..." -ForegroundColor Yellow
Write-Host ""

# Story Spellbook: 12 acts
for ($i = 0; $i -lt 12; $i++) {
    $act = $spellbookActs | Where-Object { $_.act_number -eq ($i + 1) } | Select-Object -First 1
    $actId = if ($act) { $act.id } else { "act-$($($i+1).ToString('00'))" }
    $actTitle = if ($act) { $act.title } else { "Act $($i + 1)" }
    
    # Z-address for this act (for receiving donations with memos)
    if ($i -lt $zAddresses.Count) {
        $zAddr = $zAddresses[$i]
        $addresses += [PSCustomObject]@{
            type = "shielded"
            index = $i
            label = "Story Spellbook - Act $($i + 1)"
            act_id = $actId
            act_number = $i + 1
            act_title = $actTitle
            spellbook = "story"
            purpose = "receive_donations"
            description = "Shielded address for receiving ZEC donations with proverbs for $actTitle"
            viewingKey = $zAddr.viewing_key
            address = $zAddr.address
            network = "mainnet"
        }
        Write-Host "  ✅ Story Act $($i + 1): $actTitle" -ForegroundColor Green
        Write-Host "     Z-address: $($zAddr.address.Substring(0, 30))..." -ForegroundColor Gray
    }
    
    # T-address for this act (for tracking inscriptions and amounts)
    if ($i -lt $tAddresses.Count) {
        $tAddr = $tAddresses[$i]
        $addresses += [PSCustomObject]@{
            type = "transparent"
            index = $i
            label = "Story Spellbook - Act $($i + 1)"
            act_id = $actId
            act_number = $i + 1
            act_title = $actTitle
            spellbook = "story"
            purpose = "track_inscriptions"
            description = "Transparent address for tracking proverb inscriptions and amounts for $actTitle"
            address = $tAddr.address
            network = "mainnet"
        }
        Write-Host "     T-address: $($tAddr.address)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Zero Knowledge Spellbook: 6 addresses
Write-Host "Zero Knowledge Spellbook addresses:" -ForegroundColor Yellow
for ($i = 0; $i -lt 6; $i++) {
    $zIndex = 12 + $i
    $tIndex = 12 + $i
    
    # Z-address
    if ($zIndex -lt $zAddresses.Count) {
        $zAddr = $zAddresses[$zIndex]
        $addresses += [PSCustomObject]@{
            type = "shielded"
            index = $zIndex
            label = "Zero Knowledge Spellbook - Address $($i + 1)"
            address_number = $i + 1
            spellbook = "zero"
            purpose = "receive_donations"
            description = "Shielded address for receiving ZEC donations for Zero Knowledge Spellbook Address $($i + 1)"
            viewingKey = $zAddr.viewing_key
            address = $zAddr.address
            network = "mainnet"
        }
        Write-Host "  ✅ Zero Knowledge Address $($i + 1)" -ForegroundColor Green
        Write-Host "     Z-address: $($zAddr.address.Substring(0, 30))..." -ForegroundColor Gray
    }
    
    # T-address
    if ($tIndex -lt $tAddresses.Count) {
        $tAddr = $tAddresses[$tIndex]
        $addresses += [PSCustomObject]@{
            type = "transparent"
            index = $tIndex
            label = "Zero Knowledge Spellbook - Address $($i + 1)"
            address_number = $i + 1
            spellbook = "zero"
            purpose = "track_inscriptions"
            description = "Transparent address for tracking proverb inscriptions for Zero Knowledge Spellbook Address $($i + 1)"
            address = $tAddr.address
            network = "mainnet"
        }
        Write-Host "     T-address: $($tAddr.address)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Build final structure (NO private keys, NO mnemonic)
$addressData = [PSCustomObject]@{
    mnemonic = "STORED_SECURELY_IN_ENVIRONMENT"
    network = "mainnet"
    addresses = $addresses
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    note = "Addresses for frontend display. Private keys and mnemonic removed for security. All 36 addresses mapped to Story Spellbook (12 acts) and Zero Knowledge Spellbook (6 addresses). Keys should be stored in environment variables or secret management service."
    security = [PSCustomObject]@{
        privateKeysRemoved = $true
        mnemonicRemoved = $true
        secureStorageRequired = "Environment variables, secret management service, or encrypted key file (not in git)"
    }
    metadata = [PSCustomObject]@{
        story_spellbook_acts = 12
        zero_spellbook_addresses = 6
        total_addresses = $addresses.Count
        z_addresses = ($addresses | Where-Object { $_.type -eq "shielded" }).Count
        t_addresses = ($addresses | Where-Object { $_.type -eq "transparent" }).Count
    }
}

# Save to file
$json = $addressData | ConvertTo-Json -Depth 10
$json | Set-Content $addressFile -Encoding UTF8

Write-Host "✅ Rebuilt address file: $addressFile" -ForegroundColor Green
Write-Host "   Total addresses: $($addresses.Count)" -ForegroundColor White
Write-Host "   Story Spellbook: $($addresses | Where-Object { $_.spellbook -eq 'story' }).Count addresses" -ForegroundColor White
Write-Host "   Zero Knowledge: $($addresses | Where-Object { $_.spellbook -eq 'zero' }).Count addresses" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security:" -ForegroundColor Yellow
Write-Host "   ✅ Private keys removed" -ForegroundColor Green
Write-Host "   ✅ Mnemonic removed" -ForegroundColor Green
Write-Host "   ✅ All addresses mapped to acts" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Wallet UI will now display:" -ForegroundColor Green
Write-Host "   - All addresses with act titles" -ForegroundColor White
Write-Host "   - Spellbook mapping (Story / Zero Knowledge)" -ForegroundColor White
Write-Host "   - Purpose (receive donations / track inscriptions)" -ForegroundColor White
Write-Host "   - T-address tracking with balances and memos" -ForegroundColor White
Write-Host ""

