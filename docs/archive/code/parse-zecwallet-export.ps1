# Parse zecwallet-cli export and format for zcash-addresses-controlled.json

param(
    [string]$ExportFile = "",
    [switch]$Interactive = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Parse zecwallet-cli Export" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"

# Get export data
$exportData = $null

if ($Interactive) {
    Write-Host "Paste the JSON export from zecwallet-cli (press Enter twice when done):" -ForegroundColor Yellow
    $lines = @()
    $emptyCount = 0
    while ($true) {
        $line = Read-Host
        if ([string]::IsNullOrWhiteSpace($line)) {
            $emptyCount++
            if ($emptyCount -ge 2) { break }
        } else {
            $emptyCount = 0
            $lines += $line
        }
    }
    $exportJson = $lines -join "`n"
    try {
        $exportData = $exportJson | ConvertFrom-Json
    } catch {
        Write-Host "❌ Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} elseif ($ExportFile -and (Test-Path $ExportFile)) {
    Write-Host "Reading export from file: $ExportFile" -ForegroundColor Yellow
    $exportJson = Get-Content $ExportFile -Raw
    try {
        $exportData = $exportJson | ConvertFrom-Json
    } catch {
        Write-Host "❌ Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\parse-zecwallet-export.ps1 -Interactive" -ForegroundColor Gray
    Write-Host "  .\parse-zecwallet-export.ps1 -ExportFile path\to\export.json" -ForegroundColor Gray
    exit 0
}

if (-not $exportData -or $exportData.Count -eq 0) {
    Write-Host "❌ No addresses found in export" -ForegroundColor Red
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

# Verify we have enough addresses
$requiredZ = 18  # 12 for Story + 6 for Zero Knowledge
$requiredT = 18  # 12 for Story + 6 for Zero Knowledge

if ($zAddresses.Count -lt $requiredZ) {
    Write-Host "⚠️  Warning: Only $($zAddresses.Count) z-addresses found, need $requiredZ" -ForegroundColor Yellow
}
if ($tAddresses.Count -lt $requiredT) {
    Write-Host "⚠️  Warning: Only $($tAddresses.Count) t-addresses found, need $requiredT" -ForegroundColor Yellow
}

# Read existing address file
$existingData = @{}
if (Test-Path $addressFile) {
    $existing = Get-Content $addressFile -Raw | ConvertFrom-Json
    $existingData.mnemonic = $existing.mnemonic
    $existingData.network = $existing.network
    $existingData.addresses = @()
} else {
    Write-Host "⚠️  Address file not found, will create new one" -ForegroundColor Yellow
    $existingData.mnemonic = "REPLACE_WITH_MNEMONIC_FROM_EXPORT"
    $existingData.network = "mainnet"
    $existingData.addresses = @()
}

# Format addresses with labels
Write-Host "Formatting addresses with spellbook labels..." -ForegroundColor Yellow

# Story Spellbook: 12 acts (indices 0-11)
# We need: 12 z-addresses (indices 0-11) and 12 t-addresses (indices 0-11)
for ($i = 0; $i -lt 12; $i++) {
    # Add z-address for this act
    if ($i -lt $zAddresses.Count) {
        $zAddr = $zAddresses[$i]
        $addrObj = [PSCustomObject]@{
            type = "shielded"
            index = $i
            label = "Story Spellbook - Act $($i + 1)"
            spendingKey = $zAddr.private_key
            viewingKey = $zAddr.viewing_key
            address = $zAddr.address
            network = "mainnet"
        }
        $existingData.addresses += $addrObj
        Write-Host "  ✅ Story Act $($i + 1) z-address" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing z-address for Story Act $($i + 1)" -ForegroundColor Yellow
    }
    
    # Add t-address for this act
    if ($i -lt $tAddresses.Count) {
        $tAddr = $tAddresses[$i]
        $addrObj = [PSCustomObject]@{
            type = "transparent"
            index = $i
            label = "Story Spellbook - Act $($i + 1)"
            privateKey = $tAddr.private_key
            address = $tAddr.address
            network = "mainnet"
        }
        $existingData.addresses += $addrObj
        Write-Host "  ✅ Story Act $($i + 1) t-address" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing t-address for Story Act $($i + 1)" -ForegroundColor Yellow
    }
}

# Zero Knowledge Spellbook: 6 addresses (indices 12-17)
# We need: 6 z-addresses (indices 12-17) and 6 t-addresses (indices 12-17)
for ($i = 0; $i -lt 6; $i++) {
    $zIndex = 12 + $i
    $tIndex = 12 + $i
    
    # Add z-address
    if ($zIndex -lt $zAddresses.Count) {
        $zAddr = $zAddresses[$zIndex]
        $addrObj = [PSCustomObject]@{
            type = "shielded"
            index = $zIndex
            label = "Zero Knowledge Spellbook - Address $($i + 1)"
            spendingKey = $zAddr.private_key
            viewingKey = $zAddr.viewing_key
            address = $zAddr.address
            network = "mainnet"
        }
        $existingData.addresses += $addrObj
        Write-Host "  ✅ Zero Knowledge Address $($i + 1) z-address" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing z-address for Zero Knowledge Address $($i + 1)" -ForegroundColor Yellow
    }
    
    # Add t-address
    if ($tIndex -lt $tAddresses.Count) {
        $tAddr = $tAddresses[$tIndex]
        $addrObj = [PSCustomObject]@{
            type = "transparent"
            index = $tIndex
            label = "Zero Knowledge Spellbook - Address $($i + 1)"
            privateKey = $tAddr.private_key
            address = $tAddr.address
            network = "mainnet"
        }
        $existingData.addresses += $addrObj
        Write-Host "  ✅ Zero Knowledge Address $($i + 1) t-address" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing t-address for Zero Knowledge Address $($i + 1)" -ForegroundColor Yellow
    }
}

# Add metadata
$existingData.generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$existingData.updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$existingData.note = "Addresses generated from zecwallet-cli export. Story Spellbook: 12 acts (24 addresses). Zero Knowledge Spellbook: 6 addresses (12 addresses)."

# Save to file
$json = $existingData | ConvertTo-Json -Depth 10
$json | Set-Content $addressFile -Encoding UTF8

Write-Host "✅ Updated $addressFile" -ForegroundColor Green
Write-Host "   Total addresses: $($existingData.addresses.Count)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Update the mnemonic in the file if you have it from the export!" -ForegroundColor Yellow
Write-Host ""

