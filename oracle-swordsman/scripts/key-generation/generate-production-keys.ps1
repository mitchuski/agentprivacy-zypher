# Generate Production Zcash Keys via Zallet RPC
# This script generates all necessary keys for the Oracle Swordsman

param(
    [string]$ZalletRpcUrl = "http://127.0.0.1:28232",
    [string]$ZalletUser = "zallet",
    [string]$ZalletPass = "zallet123",
    [string]$OutputFile = "production-keys.json"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Zcash Key Generation for Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Setup authentication
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ZalletUser}:${ZalletPass}"))
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Basic $auth"
}

$keys = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    network = "mainnet"
    addresses = @{}
    keys = @{}
}

# 1. Generate shielded address (z-address)
Write-Host "[1] Generating shielded address (z-address)..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "z_getnewaddress"
        params = @()
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ZalletRpcUrl -Method Post -Headers $headers -Body $body
    if ($response.result) {
        $zAddress = $response.result
        $keys.addresses.shielded = $zAddress
        Write-Host "  ✅ Shielded address: $zAddress" -ForegroundColor Green
    } else {
        throw "Failed: $($response.error.message)"
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Generate transparent address (t-address)
Write-Host "`n[2] Generating transparent address (t-address)..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        id = 2
        method = "getnewaddress"
        params = @()
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ZalletRpcUrl -Method Post -Headers $headers -Body $body
    if ($response.result) {
        $tAddress = $response.result
        $keys.addresses.transparent = $tAddress
        Write-Host "  ✅ Transparent address: $tAddress" -ForegroundColor Green
    } else {
        throw "Failed: $($response.error.message)"
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Export viewing key (for monitoring z-address)
Write-Host "`n[3] Exporting viewing key..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        id = 3
        method = "z_exportviewingkey"
        params = @($zAddress)
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ZalletRpcUrl -Method Post -Headers $headers -Body $body
    if ($response.result) {
        $viewingKey = $response.result
        $keys.keys.viewing = $viewingKey
        Write-Host "  ✅ Viewing key exported" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not export viewing key: $($response.error.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Viewing key export failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Export transparent private key
Write-Host "`n[4] Exporting transparent private key..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        id = 4
        method = "dumpprivkey"
        params = @($tAddress)
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ZalletRpcUrl -Method Post -Headers $headers -Body $body
    if ($response.result) {
        $tPrivKey = $response.result
        $keys.keys.transparent_private = $tPrivKey
        Write-Host "  ✅ Transparent private key exported" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not export transparent key: $($response.error.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Transparent key export failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Export shielded spending key (for signing)
Write-Host "`n[5] Exporting shielded spending key..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        id = 5
        method = "z_exportkey"
        params = @($zAddress)
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ZalletRpcUrl -Method Post -Headers $headers -Body $body
    if ($response.result) {
        $spendingKey = $response.result
        $keys.keys.shielded_spending = $spendingKey
        Write-Host "  ✅ Shielded spending key exported" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not export spending key: $($response.error.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Spending key export failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Save to file
Write-Host "`n[6] Saving keys to file..." -ForegroundColor Yellow
try {
    $keys | ConvertTo-Json -Depth 10 | Set-Content $OutputFile
    Write-Host "  ✅ Keys saved to: $OutputFile" -ForegroundColor Green
    Write-Host "`n⚠️  SECURITY WARNING:" -ForegroundColor Red
    Write-Host "  - Keep this file secure!" -ForegroundColor Yellow
    Write-Host "  - Do NOT commit to git!" -ForegroundColor Yellow
    Write-Host "  - For production: Store spending key in Nillion TEE" -ForegroundColor Yellow
} catch {
    Write-Host "  ❌ Failed to save file: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Key Generation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Shielded Address (z-addr):" -ForegroundColor White
Write-Host "  $($keys.addresses.shielded)" -ForegroundColor Gray
Write-Host ""
Write-Host "Transparent Address (t-addr):" -ForegroundColor White
Write-Host "  $($keys.addresses.transparent)" -ForegroundColor Gray
Write-Host ""
if ($keys.keys.viewing) {
    Write-Host "Viewing Key:" -ForegroundColor White
    Write-Host "  $($keys.keys.viewing)" -ForegroundColor Gray
    Write-Host ""
}
if ($keys.keys.shielded_spending) {
    Write-Host "Spending Key:" -ForegroundColor White
    Write-Host "  $($keys.keys.shielded_spending)" -ForegroundColor Gray
    Write-Host ""
}
if ($keys.keys.transparent_private) {
    Write-Host "Transparent Private Key:" -ForegroundColor White
    Write-Host "  $($keys.keys.transparent_private)" -ForegroundColor Gray
    Write-Host ""
}
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Store spending key in Nillion TEE workload" -ForegroundColor White
Write-Host "  2. Configure Oracle Swordsman with addresses" -ForegroundColor White
Write-Host "  3. Update .env file with addresses" -ForegroundColor White
Write-Host ""


