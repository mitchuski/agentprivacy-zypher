# Verify Rust and zecwallet-cli are in PATH
# Run this in a NEW PowerShell window to verify PATH is set correctly

Write-Host "=== Verifying Rust Installation ===" -ForegroundColor Cyan
Write-Host ""

# Check Rust
try {
    $rustVersion = rustc --version 2>&1
    Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found in PATH" -ForegroundColor Red
    Write-Host "   Add to PATH: $env:USERPROFILE\.cargo\bin" -ForegroundColor Yellow
}

# Check Cargo
try {
    $cargoVersion = cargo --version 2>&1
    Write-Host "✅ Cargo: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Cargo not found in PATH" -ForegroundColor Red
}

# Check zecwallet-cli
try {
    $zecwalletVersion = zecwallet-cli --version 2>&1
    Write-Host "✅ zecwallet-cli: $zecwalletVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ zecwallet-cli not found in PATH" -ForegroundColor Red
    Write-Host "   Location should be: $env:USERPROFILE\.cargo\bin\zecwallet-cli.exe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "If any are missing, add to PATH:" -ForegroundColor Yellow
Write-Host "  [Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';$env:USERPROFILE\.cargo\bin', 'User')" -ForegroundColor White
Write-Host ""




