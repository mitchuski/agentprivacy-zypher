# Setup Guide

**Prerequisites, installation, and environment configuration**

---

## System Requirements

### Hardware
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB available space
- **Network**: Stable internet connection

### Operating System
- **Linux**: Ubuntu 20.04+ (recommended)
- **macOS**: 11+ (supported)
- **Windows**: Windows 10/11 (supported, tested on Windows 10)

---

## Prerequisites Installation

### Core Tools

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential git curl wget pkg-config \
    libssl-dev python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (optional, for production)
sudo apt install -y nginx
```

### Rust (for zecwallet-cli)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Source environment
source $HOME/.cargo/env

# Verify installation
rustc --version  # Should show 1.70+
```

### Node.js 20

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20
nvm install 20
nvm use 20

# Verify installation
node --version   # Should show v20.x
npm --version    # Should show 10.x
```

### Zcash Light Client

**Linux/macOS:**
```bash
# Install zecwallet-cli
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli

# Verify installation
zecwallet-cli --version
```

**Windows:**
```powershell
# Install Rust first (if not installed)
# Download from https://rustup.rs/ or use:
# Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
# .\rustup-init.exe

# Add Rust to PATH (if needed)
$env:Path += ";$env:USERPROFILE\.cargo\bin"

# Install zecwallet-cli
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli

# Verify installation
zecwallet-cli --version
```

**Note**: Some `zecwallet-cli` versions don't support the `--data-dir` flag. The code has been updated to handle this automatically.

---

## API Keys & Accounts

### 1. Nillion (TEE)

**Sign up**:
1. Join Discord: https://discord.gg/nillion
2. Go to #developers channel
3. Request: "API key for Proverb Protocol - TEE hackathon project"
4. Save: `NILLION_API_KEY`

**Install SDK**:
```bash
# TypeScript/JavaScript
npm install -g @nillion/client-web

# Python (if needed)
pip install nillion-client --break-system-packages
```

### 2. NEAR Cloud AI (AI Verification)

**Sign up**:
1. Visit: https://cloud.near.ai/
2. Create account
3. Generate API key
4. Save: `NEAR_API_KEY`

**Pricing**:
- Free tier: 100 requests/month
- Paid: ~$0.03/request (Claude 3.5 Sonnet)

### 3. Pinata (IPFS)

**Sign up**:
1. Visit: https://www.pinata.cloud/
2. Create account
3. Generate API key (JWT)
4. Save: `PINATA_JWT`

**Pricing**:
- Free tier: 1GB storage
- Paid: $20/month (100GB)

### 4. PostgreSQL

**Setup**:
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user
sudo -u postgres createuser -P proverb_user
# Enter password when prompted

# Create database
sudo -u postgres createdb -O proverb_user proverb_protocol

# Verify connection
psql -U proverb_user -d proverb_protocol -h localhost
# Enter password, then \q to quit
```

---

## Project Structure

```bash
# Create main directory
mkdir -p ~/proverb-protocol
cd ~/proverb-protocol

# Create subdirectories
mkdir -p {oracle-swordsman/src,mage-agent/src,scripts,logs,spellbook,zcash-wallet}

# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Environment
.env
.env.local

# Logs
*.log
logs/

# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Database
*.db
*.sqlite

# Zcash
zcash-wallet/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

git add .gitignore
git commit -m "Initial commit"
```

---

## Environment Configuration

### Create .env File

```bash
# Create environment file
cat > .env << 'EOF'
# ============================================
# Nillion Configuration
# ============================================
NILLION_API_KEY=your_nillion_api_key_here
NILLION_NETWORK=testnet

# ============================================
# NEAR Cloud AI Configuration
# ============================================
NEAR_API_KEY=your_near_api_key_here
NEAR_MODEL=gpt oss 120b

# ============================================
# IPFS/Pinata Configuration
# ============================================
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY=https://your-gateway.mypinata.cloud
SPELLBOOK_CID=QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay  # Current: v4.0.0-canonical

# ============================================
# Zcash Configuration
# ============================================
# Testnet
ZCASH_NETWORK=testnet
ZCASH_SERVER=https://zec.rocks:443
ZCASH_DATA_DIR=C:\Users\yourusername\agentprivacy_zypher\zcash-wallet  # Windows path
# ZCASH_DATA_DIR=/home/yourusername/proverb-protocol/zcash-wallet  # Linux/macOS path

# Addresses (get from wallet setup)
ZCASH_SHIELDED_RECEIVE_ADDRESS=zs1...   # Shielded address (receives user submissions)
ZCASH_PUBLIC_INSCRIPTION_ADDRESS=t1...  # Transparent address (posts to spellbook)

# Mainnet (for production)
# ZCASH_NETWORK=mainnet
# ZCASH_SERVER=https://mainnet.lightwalletd.com:9067

# ============================================
# PostgreSQL Configuration
# ============================================
DATABASE_URL=postgresql://proverb_user:your_password@localhost:5432/proverb_protocol

# ============================================
# Oracle Swordsman Configuration
# ============================================
ORACLE_CHECK_INTERVAL=30  # seconds
ORACLE_RETRY_ATTEMPTS=3
ORACLE_RETRY_DELAY=60  # seconds

# ============================================
# Economic Model
# ============================================
PROVERB_COST=0.01  # ZEC
PUBLIC_SPLIT=0.618  # 61.8%
PRIVATE_SPLIT=0.382  # 38.2%
NETWORK_FEE=0.0001  # ZEC

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/proverb-protocol.log

# ============================================
# Frontend Configuration (Mage Agent)
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NETWORK=testnet
EOF

# Secure the file
chmod 600 .env
```

### Fill in Your Keys

```bash
# Edit with your actual API keys
nano .env

# Or use environment-specific files
cp .env .env.development
cp .env .env.production
```

---

## Database Setup

### Create Schema

```bash
# Create schema file
cat > scripts/schema.sql << 'EOF'
-- Proverb Protocol Database Schema

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    tracking_code VARCHAR(64) UNIQUE NOT NULL,
    sender_address VARCHAR(128) NOT NULL,
    proverb_text TEXT NOT NULL,
    amount_zec DECIMAL(18, 8) NOT NULL,
    txid VARCHAR(128) NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'pending',
    memo_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification results table
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    ai_provider VARCHAR(64) NOT NULL,
    quality_score DECIMAL(5, 4),
    matched_act VARCHAR(256),
    reasoning TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'verified'
);

-- Inscriptions table
CREATE TABLE IF NOT EXISTS inscriptions (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    public_txid VARCHAR(128),
    private_txid VARCHAR(128),
    public_amount DECIMAL(18, 8),
    private_amount DECIMAL(18, 8),
    network_fee DECIMAL(18, 8),
    inscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    block_height INTEGER,
    status VARCHAR(32) DEFAULT 'confirmed'
);

-- Spellbook acts table (cached from IPFS)
CREATE TABLE IF NOT EXISTS spellbook_acts (
    id SERIAL PRIMARY KEY,
    act_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(128),
    ipfs_cid VARCHAR(128),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oracle status table
CREATE TABLE IF NOT EXISTS oracle_status (
    id SERIAL PRIMARY KEY,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submissions_processed INTEGER DEFAULT 0,
    verifications_completed INTEGER DEFAULT 0,
    inscriptions_made INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    status VARCHAR(32) DEFAULT 'running'
);

-- Indexes for performance
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_tracking ON submissions(tracking_code);
CREATE INDEX idx_verifications_submission ON verifications(submission_id);
CREATE INDEX idx_inscriptions_submission ON inscriptions(submission_id);
CREATE INDEX idx_oracle_status_timestamp ON oracle_status(check_timestamp DESC);

-- Views for monitoring
CREATE OR REPLACE VIEW submission_pipeline AS
SELECT 
    s.id,
    s.tracking_code,
    s.status AS submission_status,
    v.quality_score,
    v.matched_act,
    i.public_txid,
    i.inscribed_at,
    s.created_at
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id
LEFT JOIN inscriptions i ON s.id = i.submission_id
ORDER BY s.created_at DESC;

-- Proverb statistics view
CREATE OR REPLACE VIEW proverb_stats AS
SELECT 
    COUNT(*) AS total_submissions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed,
    AVG(v.quality_score) AS avg_quality_score,
    SUM(amount_zec) AS total_zec_received
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id;
EOF

# Apply schema
psql -U proverb_user -d proverb_protocol -h localhost -f scripts/schema.sql
```

---

## Zcash Wallet Setup

### Initialize Light Client

**Linux/macOS:**
```bash
# Create wallet directory
mkdir -p ~/proverb-protocol/zcash-wallet

# Start light client (testnet)
# Note: If your version doesn't support --data-dir, omit it
zecwallet-cli --server https://zec.rocks:443 \
              --data-dir ~/proverb-protocol/zcash-wallet

# Wait for sync (takes 4-6 hours for first sync)
# You'll see sync progress in the output
```

**Windows:**
```powershell
# Create wallet directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\agentprivacy_zypher\zcash-wallet"

# Start light client (testnet)
# Note: Some versions don't support --data-dir flag
zecwallet-cli --server https://zec.rocks:443

# Wait for sync (takes 4-6 hours for first sync)
# You'll see sync progress in the output
```

### Create Addresses

```zecwallet-cli
# In the zecwallet-cli prompt:

# Create new wallet
new

# Get shielded address (for receiving user submissions - z→z transactions)
new z

# Get transparent address (for public inscriptions to spellbook)
address

# List all addresses
addresses

# Save these addresses!
```

### Get Testnet ZEC

```bash
# Request from faucet
# Visit: https://faucet.zecpages.com/

# Or use CLI (if available)
curl -X POST https://faucet.zecpages.com/api/claim \
  -H "Content-Type: application/json" \
  -d '{"address":"your_t_address_here"}'
```

---

## Spellbook Creation

### Current Spellbook

The spellbook is already created and uploaded to IPFS:
- **Version**: 4.0.0-canonical
- **IPFS CID**: `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **Description**: Complete Spellbook - Canonical Edition combining First Person Spellbook and Zero Knowledge Spellbook with Relationship Proverb Protocol inscriptions
- **Location**: `spellbook/spellbook-acts.json`

The spellbook contains:
- **Story Spellbook**: 11 acts teaching privacy and delegation architecture
- **Zero Knowledge Spellbook**: Additional privacy concepts
- **Relationship Proverb Protocol**: Integration for AI verification

To update the spellbook, edit `spellbook/spellbook-acts.json` and re-upload to Pinata (see upload script: `upload-spellbook.ps1`).

### Upload to IPFS

**Current Status**: Spellbook is already uploaded with CID `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`

**To Update Spellbook**:

**Windows (PowerShell):**
```powershell
# Use the provided script
.\upload-spellbook.ps1 -JwtToken "YOUR_PINATA_JWT"

# Or manually:
$jwt = "YOUR_PINATA_JWT"
$file = "spellbook\spellbook-acts.json"
$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($file)
$fileName = [System.IO.Path]::GetFileName($file)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: application/json",
    "",
    [System.Text.Encoding]::UTF8.GetString($fileBytes),
    "--$boundary--"
) -join "`r`n"

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

$response = Invoke-RestMethod -Uri "https://api.pinata.cloud/pinning/pinFileToIPFS" -Method Post -Headers $headers -Body $bodyLines
$response.IpfsHash  # This is your new CID
```

**Linux/macOS:**
```bash
# Use curl to upload
curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "Authorization: Bearer YOUR_PINATA_JWT" \
  -F file=@spellbook/spellbook-acts.json

# Save the returned CID and update .env
```

### Verify IPFS Access

```bash
# Test retrieval (current spellbook)
curl https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay

# Or use your gateway:
curl https://YOUR_GATEWAY.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay

# Should return your JSON file with version 4.0.0-canonical
```

---

## Verification Checklist

### System Components

```bash
# Check Rust
rustc --version
# ✓ Should show 1.70+

# Check Node.js
node --version
# ✓ Should show v20.x

# Check PostgreSQL
psql --version
# ✓ Should show 12+

# Check zecwallet-cli
zecwallet-cli --version
# ✓ Should show version info

# Check Nillion SDK
npm list -g @nillion/client-web
# ✓ Should show installed version
```

### Database Connection

```bash
# Test connection
psql -U proverb_user -d proverb_protocol -h localhost -c "SELECT 1;"
# ✓ Should return 1

# Check tables
psql -U proverb_user -d proverb_protocol -h localhost -c "\dt"
# ✓ Should show all tables
```

### API Keys

```bash
# Load environment
source .env

# Check Nillion
echo $NILLION_API_KEY
# ✓ Should show your key

# Check NEAR Cloud AI
echo $NEAR_API_KEY
# ✓ Should show your key

# Check Pinata
echo $PINATA_JWT
# ✓ Should show your JWT
```

### Zcash Wallet

**Linux/macOS:**
```bash
# Check sync status
zecwallet-cli --server https://zec.rocks:443 \
              --data-dir ~/proverb-protocol/zcash-wallet \
              --command "sync"

# Check balance
zecwallet-cli --data-dir ~/proverb-protocol/zcash-wallet \
              --command "balance"
# ✓ Should show non-zero balance for testnet
```

**Windows:**
```powershell
# Check sync status (if --data-dir supported)
zecwallet-cli --server https://zec.rocks:443 --command "sync"

# Check balance
zecwallet-cli --server https://zec.rocks:443 --command "balance"
# ✓ Should show non-zero balance for testnet
```

**Note**: If your `zecwallet-cli` version doesn't support `--data-dir`, the wallet uses the default location. The code handles this automatically.

---

## Common Issues

### PostgreSQL Connection Refused

```bash
# Check if running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Check firewall
sudo ufw allow 5432/tcp
```

### Zcash Sync Taking Too Long

```bash
# Use different server
zecwallet-cli --server https://mainnet.lightwalletd.com:9067

# Or wait - first sync takes 4-6 hours
# Subsequent syncs are much faster
```

### Nillion API Key Not Working

```bash
# Verify in Discord
# Check rate limits
# Try regenerating key
```

### IPFS Upload Failing

```bash
# Check Pinata JWT
# Verify file size (<25MB for free tier)
# Try web interface instead
```

---

## Next Steps

✅ **Setup Complete!**

You now have:
- All tools installed
- API keys configured
- Database created
- Zcash wallet synced
- Spellbook uploaded to IPFS
- Environment configured

**Next**: Read `docs/02-ARCHITECTURE.md` to understand the system design

**Then**: Follow `docs/03-BUILD_GUIDE.md` to start implementing

---

## Quick Commands Reference

```bash
# Start Zcash light client
zecwallet-cli --server https://zec.rocks:443 --data-dir ~/proverb-protocol/zcash-wallet

# Connect to database
psql -U proverb_user -d proverb_protocol -h localhost

# Check logs
tail -f logs/proverb-protocol.log

# Verify IPFS
curl https://gateway.pinata.cloud/ipfs/$SPELLBOOK_CID

# Test environment
source .env && env | grep NILLION
```

---

## Production Notes

When moving to production:
1. Use mainnet Zcash server
2. Generate new API keys
3. Use production database
4. Set up monitoring
5. Configure backups
6. Use SSL/TLS
7. Set up firewall rules

See production deployment guide for details.
