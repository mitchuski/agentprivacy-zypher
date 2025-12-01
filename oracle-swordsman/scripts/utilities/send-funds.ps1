# Send Zcash Transaction Script
# Interactive script to send funds from your addresses

param(
    [string]$FromAddress = "",
    [string]$ToAddress = "",
    [double]$Amount = 0,
    [switch]$Shielded = $false
)

$RpcUrl = "http://127.0.0.1:8233"
$RpcUser = "soulbae"
$RpcPass = "soulbisfirstsword"

# Load addresses
$addressesPath = "zcash-addresses-controlled.json"
if (-not (Test-Path $addressesPath)) {
    Write-Host "❌ Addresses file not found. Run generate-addresses-proper.ts first." -ForegroundColor Red
    exit 1
}

$addresses = (Get-Content $addressesPath | ConvertFrom-Json).addresses

function Invoke-ZcashRpc {
    param([string]$Method, [array]$Params = @())
    
    $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${RpcUser}:${RpcPass}"))
    
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = $Method
        params = $Params
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $RpcUrl -Method Post -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Basic $auth"
        } -Body $body
        
        if ($response.error) {
            throw $response.error.message
        }
        
        return $response.result
    } catch {
        Write-Host "  ❌ RPC Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Get-AddressBalance {
    param([string]$Address)
    
    if ($Address -match "^[tC]") {
        return Invoke-ZcashRpc "getreceivedbyaddress" @($Address, 0)
    } elseif ($Address -match "^zs1") {
        return Invoke-ZcashRpc "z_getbalance" @($Address)
    }
    return 0
}

function Send-Transaction {
    param([string]$From, [string]$To, [double]$Amount, [bool]$IsShielded)
    
    Write-Host "`nSending transaction..." -ForegroundColor Cyan
    Write-Host "  From: $From" -ForegroundColor White
    Write-Host "  To: $To" -ForegroundColor White
    Write-Host "  Amount: $Amount ZEC" -ForegroundColor White
    Write-Host "  Type: $(if ($IsShielded) { 'Shielded' } else { 'Transparent' })" -ForegroundColor White
    Write-Host ""
    
    if ($IsShielded) {
        $txid = Invoke-ZcashRpc "z_sendmany" @($From, @(@{address=$To; amount=$Amount}), 1, 0.0001)
    } else {
        $txid = Invoke-ZcashRpc "sendtoaddress" @($To, $Amount)
    }
    
    if ($txid) {
        Write-Host "  ✅ Transaction sent!" -ForegroundColor Green
        Write-Host "  TXID: $txid" -ForegroundColor White
        return $txid
    } else {
        Write-Host "  ❌ Transaction failed" -ForegroundColor Red
        return $null
    }
}

# Main
Write-Host "========================================" -ForegroundColor Green
Write-Host "Zcash Transaction Interface" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check connection
Write-Host "[1] Checking RPC connection..." -ForegroundColor Cyan
$info = Invoke-ZcashRpc "getinfo"
if ($info) {
    Write-Host "  ✅ Connected to Zcash node" -ForegroundColor Green
    Write-Host "     Network: $(if ($info.testnet) { 'testnet' } else { 'mainnet' })" -ForegroundColor White
} else {
    Write-Host "  ❌ Could not connect. Make sure zebrad is running." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Show addresses
Write-Host "[2] Your Addresses:" -ForegroundColor Cyan
Write-Host ""

$tAddresses = $addresses | Where-Object { $_.type -eq "transparent" }
$zAddresses = $addresses | Where-Object { $_.type -eq "shielded" }

Write-Host "Transparent Addresses:" -ForegroundColor Yellow
foreach ($addr in $tAddresses | Select-Object -First 3) {
    $balance = Get-AddressBalance $addr.address
    Write-Host "  $($addr.address)" -ForegroundColor White
    Write-Host "    Balance: $balance ZEC" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Shielded Addresses:" -ForegroundColor Yellow
foreach ($addr in $zAddresses | Select-Object -First 2) {
    $balance = Get-AddressBalance $addr.address
    Write-Host "  $($addr.address)" -ForegroundColor White
    Write-Host "    Balance: $balance ZEC" -ForegroundColor Gray
}
Write-Host ""

# Send transaction if parameters provided
if ($FromAddress -and $ToAddress -and $Amount -gt 0) {
    Send-Transaction -From $FromAddress -To $ToAddress -Amount $Amount -IsShielded $Shielded
} else {
    Write-Host "[3] To send a transaction, use:" -ForegroundColor Cyan
    Write-Host "  .\send-funds.ps1 -FromAddress <from> -ToAddress <to> -Amount <amount>" -ForegroundColor White
    Write-Host "  .\send-funds.ps1 -FromAddress <from> -ToAddress <to> -Amount <amount> -Shielded" -ForegroundColor White
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    if ($tAddresses.Count -ge 2) {
        Write-Host "  .\send-funds.ps1 -FromAddress `"$($tAddresses[0].address)`" -ToAddress `"$($tAddresses[1].address)`" -Amount 0.001" -ForegroundColor Gray
    }
    Write-Host ""
}

