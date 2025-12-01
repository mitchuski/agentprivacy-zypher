# Remove all private keys from address file for security

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remove Private Keys from Address File" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$addressFile = Join-Path $PSScriptRoot "..\..\zcash-addresses-controlled.json"

if (-not (Test-Path $addressFile)) {
    Write-Host "❌ Address file not found: $addressFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading address file..." -ForegroundColor Yellow
$data = Get-Content $addressFile -Raw | ConvertFrom-Json

# Count keys before removal
$keysRemoved = 0
$addressesWithKeys = 0

foreach ($addr in $data.addresses) {
    if ($addr.privateKey -or $addr.spendingKey) {
        $addressesWithKeys++
    }
}

Write-Host "Found $addressesWithKeys addresses with private keys" -ForegroundColor White
Write-Host ""

# Remove private keys but keep metadata
foreach ($addr in $data.addresses) {
    if ($addr.privateKey) {
        $keysRemoved++
        $addr.PSObject.Properties.Remove('privateKey')
    }
    if ($addr.spendingKey) {
        $keysRemoved++
        $addr.PSObject.Properties.Remove('spendingKey')
    }
    # Keep viewingKey for shielded addresses (needed for viewing, not spending)
    # But we could remove it too if desired
}

# Update metadata
$data.updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$data.note = "Addresses for frontend display. Private keys removed for security. Keys should be stored securely (environment variables, secret management) and only accessed server-side."

# Save cleaned file
$json = $data | ConvertTo-Json -Depth 10
$json | Set-Content $addressFile -Encoding UTF8

Write-Host "✅ Removed $keysRemoved private keys from address file" -ForegroundColor Green
Write-Host "   File updated: $addressFile" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Private keys should be stored securely:" -ForegroundColor Yellow
Write-Host "   - Environment variables" -ForegroundColor White
Write-Host "   - Secret management service" -ForegroundColor White
Write-Host "   - Encrypted key file (not in git)" -ForegroundColor White
Write-Host "   - Only accessible server-side for transaction signing" -ForegroundColor White
Write-Host ""

