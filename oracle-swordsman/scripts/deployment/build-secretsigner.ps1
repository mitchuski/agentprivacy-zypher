# Build SecretSigner Docker Image (PowerShell)

Write-Host "Building SecretSigner Docker image..." -ForegroundColor Cyan

Set-Location secretsigner

# Build image
docker build -t secret-signer:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SecretSigner image built successfully" -ForegroundColor Green
    Write-Host "   Image: secret-signer:latest" -ForegroundColor White
    Write-Host ""
    Write-Host "To test locally:" -ForegroundColor Yellow
    Write-Host "  docker run -p 8080:8080 \`" -ForegroundColor Gray
    Write-Host "    -e PRIVATE_KEY=your-key-hex \`" -ForegroundColor Gray
    Write-Host "    -e NETWORK=mainnet \`" -ForegroundColor Gray
    Write-Host "    secret-signer:latest" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

