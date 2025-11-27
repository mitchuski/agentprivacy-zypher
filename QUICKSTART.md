# Quick Start Guide

**Get up and running in 30 minutes**

---

## 🎯 Signal-to-Sanctuary Donation Flow

**New**: Complete implementation ready for testing with zebrad node!

- **Test Guide**: `PRODUCTION_TEST_GUIDE.md` - Complete testing instructions
- **Status**: `PRODUCTION_READINESS.md` - What's complete and what's left
- **Integration**: `SIGNAL_TO_SANCTUARY_INTEGRATION.md` - File locations and next steps

**Quick Test** (with zebrad node):
```bash
./setup-keys.sh    # Generate keys and configure
./test-flow.sh     # Run comprehensive test
```

**Key Features**:
- ✅ Golden Split (61.8% t-address / 38.2% z-address)
- ✅ Viewing key separation (Oracle can see, cannot spend)
- ✅ Spending key separation (Signer can spend, only on verification)
- ✅ Semantic proverb matching
- ✅ IPFS spellbook integration
- ✅ OP_RETURN inscription builder

---

## Prerequisites

Before starting, ensure you have:
- Ubuntu 20.04+ (or WSL2)
- Internet connection
- 8GB+ RAM
- 50GB+ storage
- Basic terminal knowledge

---

## 1. Clone Repository (1 min)

```bash
# Clone the repo
git clone https://github.com/yourusername/proverb-protocol
cd proverb-protocol

# Or if starting fresh:
mkdir -p ~/proverb-protocol
cd ~/proverb-protocol
git init
```

---

## 2. Install Dependencies (10 min)

```bash
# Run the automated installation script
./scripts/install-all.sh

# Or manually:
# Install system packages
sudo apt update && sudo apt install -y \
    build-essential git curl wget \
    postgresql postgresql-contrib

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20

# Install zecwallet-cli
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli
```

---

## 3. Setup API Keys (5 min)

### Nillion
1. Join Discord: https://discord.gg/nillion
2. Go to #developers channel
3. Request API key: "API key for Proverb Protocol hackathon project"
4. Save key when received

### NEAR Cloud AI
1. Visit: https://cloud.near.ai/
2. Create account
3. Generate API key
4. Copy key

### Pinata
1. Visit: https://www.pinata.cloud/
2. Create account
3. Generate JWT token
4. Copy token

---

## 4. Configure Environment (2 min)

```bash
# Copy environment template
cp .env.example .env

# Edit with your keys
nano .env

# Add your API keys:
# NILLION_API_KEY=nillion_...
# NEAR_API_KEY=your_key_here
# PINATA_JWT=Bearer ...
```

---

## 5. Setup Database (3 min)

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create user and database
sudo -u postgres createuser -P proverb_user
# Enter password when prompted

sudo -u postgres createdb -O proverb_user proverb_protocol

# Apply schema
psql -U proverb_user -d proverb_protocol -h localhost < scripts/schema.sql
```

---

## 6. Setup Zcash Wallet (5 min + 4-6 hours sync)

**Linux/macOS:**
```bash
# Start light client (this will sync in background)
zecwallet-cli --server https://zec.rocks:443 \
              --data-dir ~/proverb-protocol/zcash-wallet &

# Wait a few minutes, then connect
zecwallet-cli --server https://zec.rocks:443 \
              --data-dir ~/proverb-protocol/zcash-wallet
```

**Windows:**
```powershell
# Start light client (note: some versions don't support --data-dir)
zecwallet-cli --server https://zec.rocks:443

# In the CLI (for both platforms):
# Create wallet
new

# Get addresses
new z          # Shielded address (for receiving user submissions)
address        # Transparent address (for public inscriptions to spellbook)

# Save these addresses to your .env file!

# Request testnet ZEC
# Visit: https://faucet.zecpages.com/
```

---

## 7. Spellbook Status (Already Complete!)

The spellbook is already created and uploaded:
- **Version**: 4.0.0-canonical
- **IPFS CID**: `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **Location**: `spellbook/spellbook-acts.json`

**To Update Spellbook** (if needed):

**Windows:**
```powershell
.\upload-spellbook.ps1 -JwtToken "YOUR_PINATA_JWT"
```

**Linux/macOS:**
```bash
curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "Authorization: Bearer YOUR_PINATA_JWT" \
  -F file=@spellbook/spellbook-acts.json
```

Then update `.env` with the new CID.

---

## 8. Test Installation (2 min)

```bash
# Test Oracle Swordsman
cd oracle-swordsman
npm install
npm run test

# Expected output:
# ✓ Configuration loaded
# ✓ Database connected
# ✓ Zcash client working
# ✓ IPFS accessible
```

---

## 9. Start Development (now)

```bash
# Terminal 1: Oracle Swordsman
cd oracle-swordsman
npm run dev

# Terminal 2: Mage Agent
cd mage-agent
npm install
npm run dev

# Terminal 3: Watch logs
tail -f logs/proverb-protocol.log
```

---

## 10. Test End-to-End (5 min)

1. Open browser: http://localhost:3000
2. Write a test proverb
3. Submit and get payment info
4. Send testnet ZEC with memo
5. Watch Oracle process it
6. See inscription confirmed!

---

## Quick Verification Checklist

After setup, verify everything:

```bash
# Check versions
rustc --version  # Should show 1.70+
node --version   # Should show v20.x
psql --version   # Should show 12+

# Check services
sudo systemctl status postgresql  # Should be running

# Check environment
source .env
echo $NILLION_API_KEY    # Should show your key
echo $NEAR_API_KEY  # Should show your key
echo $PINATA_JWT         # Should show your token

# Check database
psql -U proverb_user -d proverb_protocol -h localhost -c "SELECT 1;"
# Should return: 1

# Check Zcash
zecwallet-cli --data-dir ~/proverb-protocol/zcash-wallet --command "balance"
# Should show balance (after sync)
```

---

## Troubleshooting

### PostgreSQL won't start
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Can't connect to database
```bash
# Check if user exists
sudo -u postgres psql -c "\du"

# Recreate if needed
sudo -u postgres createuser -P proverb_user
```

### Zcash sync too slow
```bash
# Try different server
zecwallet-cli --server https://mainnet.lightwalletd.com:9067

# Or just wait - first sync takes 4-6 hours
# Subsequent syncs are fast (<1 minute)
```

### API keys not working
- Double-check you copied them correctly
- Ensure no extra spaces
- Try regenerating keys
- Check rate limits

---

## Next Steps

✅ **Setup Complete!**

Now:
1. Read `docs/02-ARCHITECTURE.md` to understand the system
2. Follow `docs/03-BUILD_GUIDE.md` to implement features
3. Use `docs/05-ROADMAP.md` to track progress

---

## Quick Commands

```bash
# Start Oracle
cd oracle-swordsman && npm run dev

# Start Frontend
cd mage-agent && npm run dev

# Check logs
tail -f logs/proverb-protocol.log

# Check database
psql -U proverb_user -d proverb_protocol -h localhost

# Check Zcash
zecwallet-cli --data-dir ~/proverb-protocol/zcash-wallet --command "balance"

# Test spellbook
curl https://gateway.pinata.cloud/ipfs/$SPELLBOOK_CID
```

---

## Getting Help

- **Documentation**: See `docs/` folder
- **Issues**: Open GitHub issue
- **Community**: 
  - Nillion: https://discord.gg/nillion
  - Zcash: https://forum.zcashcommunity.com/
  - NEAR Cloud AI: https://cloud.near.ai

---

**Ready to build!** 🗡️🪄🤖
