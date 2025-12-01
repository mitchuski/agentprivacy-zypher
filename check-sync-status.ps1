# Quick Sync Status Check Script
# Checks Zebrad and Zallet sync status

Write-Host ""
Write-Host "=== Zcash Sync Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Zebrad
Write-Host "[1] Checking Zebrad..." -ForegroundColor Yellow
try {
    $cookie = Get-Content "$env:LOCALAPPDATA\zebra\.cookie" -ErrorAction Stop
    $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($cookie.Trim()))
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8233" `
      -Method POST `
      -Body '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}' `
      -ContentType "application/json" `
      -Headers @{Authorization="Basic $auth"} `
      -UseBasicParsing `
      -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    $zebradHeight = $data.result.blocks
    $zebradProgress = [math]::Round($data.result.verificationprogress * 100, 2)
    Write-Host "  ✅ Zebrad block height: $zebradHeight" -ForegroundColor Green
    Write-Host "  ✅ Sync progress: $zebradProgress%" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Could not connect to Zebrad" -ForegroundColor Red
    Write-Host "     Make sure Zebrad is running" -ForegroundColor Yellow
    $zebradHeight = $null
}

# Check Zallet
Write-Host ""
Write-Host "[2] Checking Zallet..." -ForegroundColor Yellow
$zalletProc = Get-Process zallet -ErrorAction SilentlyContinue
if ($zalletProc) {
    Write-Host "  ✅ Zallet is running (PID: $($zalletProc.Id))" -ForegroundColor Green
    
    # Test Zallet RPC
    try {
        $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("zallet:zallet123"))
        $body = @{
            jsonrpc = "2.0"
            id = 1
            method = "getinfo"
            params = @()
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:28232" `
            -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Basic $auth"
            } `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✅ Zallet RPC is accessible" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Zallet RPC not responding (may still be syncing)" -ForegroundColor Yellow
        Write-Host "     RPC will be available once Zallet finishes syncing" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ Zallet is not running" -ForegroundColor Red
    Write-Host "     Start it: zallet start" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "[3] Sync Status Summary" -ForegroundColor Yellow
if ($zebradHeight) {
    Write-Host "  Zebrad: $zebradHeight blocks" -ForegroundColor White
    if ($zalletProc) {
        Write-Host "  Zallet: Running (check RPC for wallet status)" -ForegroundColor White
    } else {
        Write-Host "  Zallet: Not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== End of Status Check ===" -ForegroundColor Cyan
Write-Host ""
