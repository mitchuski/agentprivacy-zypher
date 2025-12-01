# Extract addresses from terminal output and rebuild address file

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Extract & Rebuild Address File" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"
$scriptDir = $PSScriptRoot

# Load spellbook acts
$spellbookPath = Join-Path $scriptDir "..\..\..\spellbook\spellbook-acts.json"
if (-not (Test-Path $spellbookPath)) {
    Write-Host "❌ Spellbook file not found" -ForegroundColor Red
    exit 1
}

$spellbook = Get-Content $spellbookPath -Raw | ConvertFrom-Json
$spellbookActs = $spellbook.spellbooks.story.acts

Write-Host "✅ Loaded spellbook with $($spellbookActs.Count) acts" -ForegroundColor Green
Write-Host ""

# The export data from terminal (first 18 z-addresses, then 18 t-addresses)
# We'll read from a file or use the data directly

$exportFile = Join-Path $scriptDir "export.json"
if (-not (Test-Path $exportFile)) {
    Write-Host "⚠️  Export file not found: $exportFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please save your zecwallet-cli export JSON to:" -ForegroundColor White
    Write-Host "  $exportFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or paste it here and I'll create it..." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading export from: $exportFile" -ForegroundColor Yellow
$exportJson = Get-Content $exportFile -Raw
try {
    $exportData = $exportJson | ConvertFrom-Json
} catch {
    Write-Host "❌ Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found $($exportData.Count) addresses" -ForegroundColor Green
Write-Host ""

# Separate z and t addresses
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

if ($zAddresses.Count -lt 18 -or $tAddresses.Count -lt 18) {
    Write-Host "⚠️  Warning: Need 18 of each, found $($zAddresses.Count) z and $($tAddresses.Count) t" -ForegroundColor Yellow
}

# Build addresses
$addresses = @()

Write-Host "Building address structure..." -ForegroundColor Yellow
Write-Host ""

# Story Spellbook: 12 acts
for ($i = 0; $i -lt 12; $i++) {
    $act = $spellbookActs | Where-Object { $_.act_number -eq ($i + 1) } | Select-Object -First 1
    $actId = if ($act) { $act.id } else { "act-$($($i+1).ToString('00'))" }
    $actTitle = if ($act) { $act.title } else { "Act $($i + 1)" }
    
    # Z-address
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
    }
    
    # T-address
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
    }
}

# Zero Knowledge Spellbook: 6 addresses
for ($i = 0; $i -lt 6; $i++) {
    $zIndex = 12 + $i
    $tIndex = 12 + $i
    
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
    }
    
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
    }
}

# Build final structure
$addressData = [PSCustomObject]@{
    mnemonic = "STORED_SECURELY_IN_ENVIRONMENT"
    network = "mainnet"
    addresses = $addresses
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    note = "Addresses for frontend display. Private keys and mnemonic removed for security. All addresses mapped to Story Spellbook (12 acts) and Zero Knowledge Spellbook (6 addresses)."
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

# Save
$json = $addressData | ConvertTo-Json -Depth 10
$json | Set-Content $addressFile -Encoding UTF8

Write-Host "✅ Rebuilt address file!" -ForegroundColor Green
Write-Host "   Total addresses: $($addresses.Count)" -ForegroundColor White
Write-Host "   Story Spellbook: $($addresses | Where-Object { $_.spellbook -eq 'story' }).Count addresses" -ForegroundColor White
Write-Host "   Zero Knowledge: $($addresses | Where-Object { $_.spellbook -eq 'zero' }).Count addresses" -ForegroundColor White
Write-Host ""
Write-Host "Security: No private keys in file" -ForegroundColor Green
Write-Host ""

