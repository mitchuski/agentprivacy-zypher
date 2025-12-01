# Production Flow Testing Script
# Tests the complete flow without Nillion

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Flow Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3000"

# Test 1: Oracle Status
Write-Host "1. Testing Oracle Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/oracle/status" -Method Get
    Write-Host "   ✅ Oracle is running" -ForegroundColor Green
    Write-Host "      Network: $($response.network)" -ForegroundColor White
    Write-Host "      Block Height: $($response.blockHeight)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Oracle not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Wallet Addresses
Write-Host "`n2. Testing Wallet Addresses..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/wallet/addresses" -Method Get
    $addressCount = $response.addresses.Count
    Write-Host "   ✅ Found $addressCount addresses" -ForegroundColor Green
    
    $zAddresses = ($response.addresses | Where-Object { $_.type -eq "shielded" }).Count
    $tAddresses = ($response.addresses | Where-Object { $_.type -eq "transparent" }).Count
    Write-Host "      Z-addresses: $zAddresses" -ForegroundColor White
    Write-Host "      T-addresses: $tAddresses" -ForegroundColor White
    
    if ($addressCount -lt 36) {
        Write-Host "   ⚠️  Expected 36 addresses, found $addressCount" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to get addresses: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Balances
Write-Host "`n3. Testing Balances..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/wallet/balances" -Method Get
    $totalBalance = ($response.balances | Measure-Object -Property balance -Sum).Sum
    Write-Host "   ✅ Total balance: $totalBalance ZEC" -ForegroundColor Green
    
    if ($totalBalance -lt 0.01) {
        Write-Host "   ⚠️  Low balance - need at least 0.01 ZEC for testing" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to get balances: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Submissions
Write-Host "`n4. Testing Submissions..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/submissions" -Method Get
    $submissionCount = $response.submissions.Count
    Write-Host "   ✅ Found $submissionCount submissions" -ForegroundColor Green
    
    $pending = ($response.submissions | Where-Object { $_.status -eq "pending" }).Count
    $verified = ($response.submissions | Where-Object { $_.status -eq "verified" }).Count
    $completed = ($response.submissions | Where-Object { $_.status -eq "completed" }).Count
    
    Write-Host "      Pending: $pending" -ForegroundColor White
    Write-Host "      Verified: $verified" -ForegroundColor White
    Write-Host "      Completed: $completed" -ForegroundColor White
} catch {
    Write-Host "   ❌ Failed to get submissions: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Proverbs
Write-Host "`n5. Testing Proverbs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/wallet/proverbs?limit=10" -Method Get
    $proverbCount = $response.proverbs.Count
    Write-Host "   ✅ Found $proverbCount verified proverbs" -ForegroundColor Green
    
    if ($proverbCount -gt 0) {
        $firstProverb = $response.proverbs[0]
        Write-Host "      Latest: $($firstProverb.trackingCode)" -ForegroundColor White
        Write-Host "      Quality: $($firstProverb.qualityScore)" -ForegroundColor White
        Write-Host "      Status: $($firstProverb.status)" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Failed to get proverbs: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: NEAR Cloud AI (if submission exists)
Write-Host "`n6. Testing NEAR Cloud AI Connection..." -ForegroundColor Yellow
try {
    # Try to get model attestation (doesn't require a submission)
    $response = Invoke-RestMethod -Uri "$API_BASE/api/oracle/status" -Method Get
    if ($response.nearCloudAi) {
        Write-Host "   ✅ NEAR Cloud AI configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  NEAR Cloud AI not configured" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not verify NEAR Cloud AI status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Send 0.01 ZEC to your Oracle z-address with memo" -ForegroundColor White
Write-Host "  2. Wait 30 seconds for detection" -ForegroundColor White
Write-Host "  3. Check submissions: curl $API_BASE/api/submissions" -ForegroundColor White
Write-Host "  4. Monitor logs: tail -f logs/oracle.log" -ForegroundColor White
Write-Host "  5. Check inscriptions: curl $API_BASE/api/wallet/proverbs" -ForegroundColor White
Write-Host ""

