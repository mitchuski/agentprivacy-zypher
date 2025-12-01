# Build address file WITHOUT private keys - secure version for frontend

param(
    [string]$ExportFile = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Secure Address File (No Private Keys)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"
$scriptDir = $PSScriptRoot

# Load spellbook acts for mapping
$spellbookPath = Join-Path $scriptDir "..\..\..\spellbook\spellbook-acts.json"
if (-not (Test-Path $spellbookPath)) {
    Write-Host "⚠️  Spellbook file not found, using default act names" -ForegroundColor Yellow
    $spellbookActs = @()
    for ($i = 1; $i -le 12; $i++) {
        $spellbookActs += @{ act_number = $i; id = "act-$($i.ToString('00'))"; title = "Act $i" }
    }
} else {
    $spellbook = Get-Content $spellbookPath -Raw | ConvertFrom-Json
    $spellbookActs = $spellbook.spellbooks.story.acts
}

# Get export data
if (-not $ExportFile -or -not (Test-Path $ExportFile)) {
    Write-Host "Usage: .\build-secure-address-file.ps1 -ExportFile path\to\export.json" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or save export to: scripts\key-generation\export.json" -ForegroundColor Gray
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
}

# Read existing mnemonic if available (but don't store it in file)
$existingMnemonic = "STORED_SECURELY_IN_ENVIRONMENT"
if (Test-Path $addressFile) {
    $existing = Get-Content $addressFile -Raw | ConvertFrom-Json
    if ($existing.mnemonic -and $existing.mnemonic -ne "STORED_SECURELY_IN_ENVIRONMENT") {
        Write-Host "⚠️  Note: Mnemonic found in existing file - should be moved to secure storage" -ForegroundColor Yellow
    }
}

# Build address structure WITHOUT private keys
$addresses = @()

Write-Host "Building secure address structure (NO private keys)..." -ForegroundColor Yellow

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
            # NO private keys - only viewing key for viewing transactions
            viewingKey = $zAddr.viewing_key
            address = $zAddr.address
            network = "mainnet"
            # Note: spendingKey should be stored securely (env var, secret management)
            # spendingKey: stored in SECURE_KEY_STORAGE (not in this file)
        }
        Write-Host "  ✅ Story Act $($i + 1) z-address: $($zAddr.address.Substring(0, 20))..." -ForegroundColor Green
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
            # Note: privateKey should be stored securely (env var, secret management)
            # privateKey: stored in SECURE_KEY_STORAGE (not in this file)
        }
        Write-Host "  ✅ Story Act $($i + 1) t-address: $($tAddr.address)" -ForegroundColor Green
    }
}

# Zero Knowledge Spellbook: 6 addresses
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
            # Note: spendingKey stored securely
        }
        Write-Host "  ✅ Zero Knowledge Address $($i + 1) z-address: $($zAddr.address.Substring(0, 20))..." -ForegroundColor Green
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
            # Note: privateKey stored securely
        }
        Write-Host "  ✅ Zero Knowledge Address $($i + 1) t-address: $($tAddr.address)" -ForegroundColor Green
    }
}

# Build final structure (NO private keys, NO mnemonic)
$addressData = [PSCustomObject]@{
    mnemonic = "STORED_SECURELY_IN_ENVIRONMENT"  # Not stored in file
    network = "mainnet"
    addresses = $addresses
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    note = "Addresses for frontend display. Private keys and mnemonic removed for security. Keys should be stored in environment variables or secret management service."
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

Write-Host ""
Write-Host "✅ Created secure address file: $addressFile" -ForegroundColor Green
Write-Host "   Total addresses: $($addresses.Count)" -ForegroundColor White
Write-Host "   Story Spellbook: 24 addresses (12 z + 12 t)" -ForegroundColor White
Write-Host "   Zero Knowledge: 12 addresses (6 z + 6 t)" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security:" -ForegroundColor Yellow
Write-Host "   ✅ Private keys removed" -ForegroundColor Green
Write-Host "   ✅ Mnemonic removed" -ForegroundColor Green
Write-Host "   ✅ Only viewing keys included (for viewing transactions)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Store private keys securely:" -ForegroundColor Red
Write-Host "   - Environment variables (ZCASH_PRIVATE_KEYS_JSON)" -ForegroundColor White
Write-Host "   - Secret management service (AWS Secrets Manager, etc.)" -ForegroundColor White
Write-Host "   - Encrypted key file (NOT in git)" -ForegroundColor White
Write-Host ""

