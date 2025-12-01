# Start Oracle Backend Service
# This script builds and starts the Oracle service

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Oracle Backend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from oracle-swordsman directory" -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating template .env file..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oracle_swordsman

# Zcash RPC Configuration (from Zebra)
ZCASH_RPC_URL=http://127.0.0.1:8233
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password

# NEAR Cloud AI Configuration
NEAR_CLOUD_AI_API_KEY=your_near_api_key
NEAR_CLOUD_AI_API_URL=https://api.near.cloud.ai

# IPFS Configuration
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
IPFS_CID=your_spellbook_cid

# Nillion Configuration (optional for now)
NILLION_USER_KEY=your_nillion_user_key
NILLION_NETWORK=mainnet

# API Configuration
API_PORT=3001
NODE_ENV=development
"@
    Set-Content -Path ".env" -Value $envTemplate
    Write-Host "   ✅ Created .env template - please update with your values" -ForegroundColor Green
    Write-Host ""
}

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "[1] Building TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Build complete" -ForegroundColor Green
} else {
    Write-Host "[1] Using existing build (dist folder found)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2] Starting Oracle service..." -ForegroundColor Yellow
Write-Host "   API will be available at: http://localhost:3001" -ForegroundColor White
Write-Host "   Wallet UI: http://localhost:3001/wallet" -ForegroundColor White
Write-Host "   Admin UI: http://localhost:3001/admin" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the service
npm start

