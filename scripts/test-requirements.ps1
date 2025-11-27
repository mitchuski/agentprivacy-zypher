# Test Requirements Script for Proverb Revelation Protocol
# Tests all prerequisites and dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Requirements Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# 1. Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 20) {
        Write-Host "  ✓ Node.js $nodeVersion (v20+ required)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Node.js $nodeVersion (v20+ required)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    $allPassed = $false
}

# 2. npm
Write-Host "[2/7] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    $npmMajor = [int]($npmVersion -split '\.')[0]
    if ($npmMajor -ge 10) {
        Write-Host "  ✓ npm $npmVersion (v10+ required)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ npm $npmVersion (v10+ required)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    $allPassed = $false
}

# 3. Rust
Write-Host "[3/7] Checking Rust..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version
    $rustMatch = $rustVersion -match 'rustc (\d+)\.(\d+)'
    if ($rustMatch) {
        $rustMajor = [int]$matches[1]
        $rustMinor = [int]$matches[2]
        if ($rustMajor -gt 1 -or ($rustMajor -eq 1 -and $rustMinor -ge 70)) {
            Write-Host "  ✓ Rust $rustVersion (1.70+ required)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Rust $rustVersion (1.70+ required)" -ForegroundColor Red
            $allPassed = $false
        }
    } else {
        Write-Host "  ✓ Rust installed (version check failed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Rust not found (required for zecwallet-cli)" -ForegroundColor Red
    $allPassed = $false
}

# 4. zecwallet-cli
Write-Host "[4/7] Checking zecwallet-cli..." -ForegroundColor Yellow
try {
    $zecVersion = zecwallet-cli --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $zecVersion -match 'version|zecwallet') {
        Write-Host "  ✓ zecwallet-cli installed" -ForegroundColor Green
        Write-Host "    Version: $zecVersion" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ zecwallet-cli not found" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ zecwallet-cli not found" -ForegroundColor Red
    Write-Host "    Install with: cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli" -ForegroundColor Gray
    $allPassed = $false
}

# 5. PostgreSQL
Write-Host "[5/7] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $pgVersion -match 'psql|PostgreSQL') {
        Write-Host "  ✓ PostgreSQL installed" -ForegroundColor Green
        Write-Host "    Version: $pgVersion" -ForegroundColor Gray
        
        # Try to check if service is running (Windows)
        $pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
        if ($pgService) {
            Write-Host "    Service found: $($pgService.Name)" -ForegroundColor Gray
        } else {
            Write-Host "    Note: Check if PostgreSQL service is running" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ PostgreSQL not found" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ PostgreSQL not found" -ForegroundColor Red
    $allPassed = $false
}

# 6. Nillion SDK
Write-Host "[6/7] Checking Nillion SDK..." -ForegroundColor Yellow
try {
    $nillionCheck = npm list -g @nillion/client-web 2>&1
    if ($LASTEXITCODE -eq 0 -or $nillionCheck -notmatch 'empty|not found') {
        Write-Host "  ✓ @nillion/client-web installed globally" -ForegroundColor Green
    } else {
        # Check local installation
        if (Test-Path "oracle-swordsman/node_modules/@nillion") {
            Write-Host "  ✓ @nillion/client-web installed locally" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ @nillion/client-web not found" -ForegroundColor Yellow
            Write-Host "    Install with: npm install -g @nillion/client-web" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ⚠ Could not verify Nillion SDK" -ForegroundColor Yellow
}

# 7. Project Dependencies
Write-Host "[7/7] Checking project dependencies..." -ForegroundColor Yellow

# Check oracle-swordsman
if (Test-Path "oracle-swordsman/package.json") {
    if (Test-Path "oracle-swordsman/node_modules") {
        Write-Host "  ✓ oracle-swordsman dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ oracle-swordsman dependencies missing" -ForegroundColor Red
        Write-Host "    Run: cd oracle-swordsman && npm install" -ForegroundColor Gray
        $allPassed = $false
    }
} else {
    Write-Host "  ⚠ oracle-swordsman/package.json not found" -ForegroundColor Yellow
}

# Check frontend
if (Test-Path "agentprivacy-ai-firstmage/package.json") {
    if (Test-Path "agentprivacy-ai-firstmage/node_modules") {
        Write-Host "  ✓ frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ frontend dependencies missing" -ForegroundColor Red
        Write-Host "    Run: cd agentprivacy-ai-firstmage && npm install" -ForegroundColor Gray
        $allPassed = $false
    }
} else {
    Write-Host "  ⚠ agentprivacy-ai-firstmage/package.json not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✓ All critical requirements met!" -ForegroundColor Green
} else {
    Write-Host "✗ Some requirements are missing" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Install missing prerequisites (see 01-SETUP.md)" -ForegroundColor Gray
    Write-Host "  2. Run: cd oracle-swordsman && npm install" -ForegroundColor Gray
    Write-Host "  3. Run: cd agentprivacy-ai-firstmage && npm install" -ForegroundColor Gray
}
Write-Host "========================================" -ForegroundColor Cyan

