# Test Address API Endpoint

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Address API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3001"

# Test 1: Check if API is running
Write-Host "1. Testing API connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/api/wallet/addresses" -Method Get -ErrorAction Stop
    Write-Host "   ✅ API is responding (Status: $($response.StatusCode))" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Found $($data.addresses.Count) addresses" -ForegroundColor Green
    Write-Host "   Network: $($data.network)" -ForegroundColor White
    
    # Show first few addresses
    Write-Host "`n   First 5 addresses:" -ForegroundColor Yellow
    $data.addresses | Select-Object -First 5 | ForEach-Object {
        Write-Host "     - $($_.label): $($_.address.Substring(0, 20))..." -ForegroundColor White
        Write-Host "       Type: $($_.type), Act: $($_.act_title)" -ForegroundColor Gray
    }
    
    # Check for act mappings
    $withActs = ($data.addresses | Where-Object { $_.act_id }).Count
    Write-Host "`n   Addresses with act mappings: $withActs" -ForegroundColor White
    
} catch {
    Write-Host "   ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
    Write-Host "`n   Make sure Oracle is running: npm start" -ForegroundColor Yellow
}

Write-Host ""

