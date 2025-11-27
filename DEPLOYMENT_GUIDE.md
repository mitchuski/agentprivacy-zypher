# Deployment Guide
## ZK Spellbook with NEAR Cloud AI (Soulbae)

**Time to deploy: 30 minutes**  
**Difficulty: Intermediate**

---

## 📋 Prerequisites

### Required Accounts

- [x] **NEAR Cloud AI API Key** - For AI verification
- [x] **Zcash Wallet** - With z-address for receiving donations
- [x] **Vercel/Netlify** - For hosting tale pages
- [x] **Domain** - agentprivacy.ai or similar (optional but recommended)

### Required Software

```bash
# Node.js and npm
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# NEAR CLI
npm install -g near-cli

# NEAR Cloud AI API
npm install -g @near-ai/shade-agent

# Zcash CLI (optional, for VRC callbacks)
# Or use block explorer API
```

### Required Files

Download from repo:
```bash
git clone https://github.com/mitchuski/agentprivacy-zypher
cd zkspellbook-final

# Verify structure:
# ├── soulbae/              (NEAR Cloud AI config)
# ├── story/                (Tale pages)
# └── vrc-callbacks/        (Monitoring scripts)
```

---

## 🚀 Step 1: Configure NEAR Cloud AI

**Time: 15 minutes**

### 1.1: Configure NEAR Account

```bash
# Login to NEAR
near login

# Create sub-account for Soulbae
near create-account soulbae.YOUR_ACCOUNT.near \
  --masterAccount YOUR_ACCOUNT.near \
  --initialBalance 10
```

### 1.2: Prepare Soulbae Configuration

```bash
cd soulbae

# Edit shade-agent-config.yml
nano shade-agent-config.yml
```

**Configuration file:**
```yaml
# shade-agent-config.yml
agent:
  name: "soulbae"
  version: "1.0.0"
  description: "The Mage of the First Person Spellbook"
  
account:
  near_account: "soulbae.YOUR_ACCOUNT.near"
  network: "mainnet"  # or "testnet" for testing

model:
  provider: "anthropic"
  model: "claude-sonnet-4-5-20250929"
  temperature: 0.7
  max_tokens: 500

tee:
  enabled: true
  provider: "aws-nitro"
  attestation: true
  isolation_level: "maximum"

rag:
  enabled: true
  training_data: "./spellbook-rag.json"
  character_file: "./soulbae-character.md"
  chunk_size: 1000
  overlap: 200

privacy:
  log_conversations: false
  store_user_data: false
  privacy_budget: 16  # φ × 10 queries per session

endpoints:
  chat: "/chat"
  proverb: "/derive-proverb"
  attestation: "/attestation"

hosting:
  domain: "agentprivacy.ai"
  subdomain: "mage"
  ssl: true
```

### 1.3: Deploy to NEAR

```bash
# Build Soulbae
npm install
npm run build

# Configure NEAR Cloud AI API
shade-agent deploy \
  --config shade-agent-config.yml \
  --account soulbae.YOUR_ACCOUNT.near \
  --network mainnet

# Wait for deployment (2-3 minutes)
# Output will show:
# ✓ Agent deployed to: https://agentprivacy.ai/mage
# ✓ TEE attestation: 0x1234...abcd
# ✓ Contract: soulbae.YOUR_ACCOUNT.near
```

### 1.4: Verify Deployment

```bash
# Test Soulbae endpoint
curl https://agentprivacy.ai/mage/attestation

# Expected response:
# {
#   "attestation": "0x1234...abcd",
#   "tee_provider": "aws-nitro",
#   "timestamp": "2025-11-15T10:30:00Z",
#   "agent": "soulbae.YOUR_ACCOUNT.near"
# }

# Test chat endpoint
curl -X POST https://agentprivacy.ai/mage/chat \
  -H "Content-Type: application/json" \
  -d '{
    "tale_id": "act1-blades-awakening",
    "message": "Help me understand protective boundaries"
  }'

# Expected: Proverb suggestion response
```

**✅ Checkpoint: Soulbae is live and TEE-attested**

---

## 📖 Step 2: Deploy Tale Pages

**Time: 5 minutes**

### 2.1: Configure Tale Templates

```bash
cd ../story

# Edit template with your z-address
nano act1-blades-awakening.html
```

**Find and replace:**
```javascript
// Line ~45
const SPELLBOOK_ADDRESS = 'zs1spellbook...';  // OLD

// Replace with:
const SPELLBOOK_ADDRESS = 'zs1YOUR_ACTUAL_ADDRESS';  // NEW

// Line ~50
const SOULBAE_URL = 'https://agentprivacy.ai/mage';  // Verify correct
```

**Apply to all tales:**
```bash
# Quick replace in all HTML files
for file in act*.html; do
  sed -i 's/zs1spellbook.../zs1YOUR_ACTUAL_ADDRESS/g' "$file"
  sed -i 's|https://demo.agentprivacy.ai/mage|https://agentprivacy.ai/mage|g' "$file"
done
```

### 2.2: Test Locally

```bash
# Serve locally
npx http-server -p 3000

# Open browser
open http://localhost:3000/act1-blades-awakening.html

# Test flow:
# 1. Click "Talk to Soulbae" → Opens mage URL
# 2. Chat with Soulbae → Get proverb suggestions
# 3. Copy proverb back to tale page
# 4. Click "Copy to Zashi" → Memo copied
# 5. Verify memo format in clipboard
```

### 2.3: Deploy to Production

**Option A: Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Configure domain
vercel domains add agentprivacy.ai
vercel alias set [deployment-url] agentprivacy.ai/story
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.

# Configure domain in Netlify dashboard
```

**Option C: Any Static Host**
```bash
# Just upload the HTML files
# To: AWS S3, GitHub Pages, etc.
```

### 2.4: Verify Deployment

```bash
# Test tale page
curl https://agentprivacy.ai/story/act1-blades-awakening.html

# Should return HTML with:
# - Tale content ✓
# - Soulbae link ✓
# - Copy button ✓
# - Your z-address ✓
```

**✅ Checkpoint: Tales are live and linked to Soulbae**

---

## 🔄 Step 3: Set Up VRC Callbacks

**Time: 10 minutes**

### 3.1: Configure Monitoring

```bash
cd ../vrc-callbacks

# Edit configuration
nano config.json
```

**Configuration:**
```json
{
  "zcash": {
    "network": "mainnet",
    "your_address": "zs1YOUR_ACTUAL_ADDRESS",
    "node_url": "http://localhost:8232",
    "rpc_user": "user",
    "rpc_password": "pass"
  },
  "monitoring": {
    "poll_interval": 60,
    "batch_size": 100
  },
  "vrc": {
    "auto_respond": true,
    "response_amount": 0.0001,
    "custom_proverbs": {
      "act1-blades-awakening": [
        "The mage who receives guards as their own",
        "What the blade protects, the spell amplifies"
      ],
      "act2-mages-projection": [
        "Delegation without surrender is the art",
        "Trust given, trust earned, trust proven"
      ]
    }
  }
}
```

### 3.2: Install Dependencies

```bash
# Node.js version
npm install

# Or Python version
pip install zcash-rpc requests python-dotenv

# Or Bash version (minimal dependencies)
# Uses zcash-cli and jq
```

### 3.3: Start Monitoring

**Option A: Manual (Testing)**
```bash
# Watch for donations
./watch-donations.sh

# In another terminal, manually respond
./send-vrc-callback.sh \
  zs1sender_address \
  "Your proverb response" \
  act1-blades-awakening
```

**Option B: Automated (Production)**
```bash
# Set up as systemd service
sudo cp vrc-callback.service /etc/systemd/system/
sudo systemctl enable vrc-callback
sudo systemctl start vrc-callback

# Check logs
sudo journalctl -u vrc-callback -f
```

**Option C: Cron (Simple)**
```bash
# Add to crontab
crontab -e

# Run every 5 minutes
*/5 * * * * /path/to/vrc-callbacks/check-and-respond.sh
```

### 3.4: Test VRC Flow

```bash
# Send yourself a test donation
zcash-cli z_sendmany "zs1YOUR_ADDRESS" \
  '[{"address":"zs1YOUR_ADDRESS","amount":0.01,"memo":"5b7270702d76315d0a5b616374312d626c616465732d6177616b656e696e675d0a5b313639393536343830305d0a5b5365766 574682063617069746c20666c6f7773207468726f756768206761746573"]}'

# Wait for confirmation (1-2 minutes)
# Check logs to see VRC callback sent
tail -f vrc-callback.log

# Verify response in wallet
zcash-cli z_listreceivedbyaddress "zs1YOUR_ADDRESS" 1
```

**✅ Checkpoint: VRC callbacks working automatically**

---

## 🎬 Step 4: Final Testing

**Time: 10 minutes**

### Complete End-to-End Test

```bash
# 1. Open tale page in browser
open https://agentprivacy.ai/story/act1-blades-awakening.html

# 2. Click "Talk to Soulbae"
# → Should open https://agentprivacy.ai/mage
# → Chat interface loads
# → TEE attestation visible

# 3. Have conversation
# Input: "What does this tale mean for my data?"
# Output: Soulbae provides contextual guidance

# 4. Get proverb suggestions
# Soulbae suggests 2-3 proverbs
# Copy one back to tale page

# 5. Click "Copy to Zashi"
# → Modal shows success
# → Clipboard contains formatted memo

# 6. Open Zashi wallet
# Paste memo
# Set amount (e.g., 0.1 ZEC)
# Send z→z transaction

# 7. Wait for confirmation (2-3 minutes)
# Check your wallet for incoming transaction

# 8. Verify VRC callback
# Check recipient's wallet in 5-10 minutes
# Should receive your proverb response
```

### Verification Checklist

- [ ] Soulbae responds to chat
- [ ] TEE attestation validates
- [ ] Tale page loads correctly
- [ ] Copy button works
- [ ] Memo format is correct
- [ ] Transaction confirms on-chain
- [ ] VRC callback sends automatically
- [ ] Recipient receives response

**If all checked: Production ready! 🎉**

---

## 🔧 Troubleshooting

### Soulbae Issues

**Problem:** TEE attestation fails
```bash
# Check NEAR Cloud AI API logs
shade-agent logs soulbae.YOUR_ACCOUNT.near

# Verify AWS Nitro is enabled
shade-agent config show | grep tee

# Restart agent
shade-agent restart soulbae.YOUR_ACCOUNT.near
```

**Problem:** RAG not working
```bash
# Verify training data loaded
curl https://agentprivacy.ai/mage/health

# Re-upload training data
shade-agent rag upload \
  --agent soulbae.YOUR_ACCOUNT.near \
  --data ./spellbook-rag.json
```

### Tale Page Issues

**Problem:** Soulbae link broken
```html
<!-- Check line ~50 in HTML -->
<a href="https://agentprivacy.ai/mage?context=act1">
  <!-- Must match your Soulbae URL -->
</a>
```

**Problem:** Copy button not working
```javascript
// Check clipboard permissions in browser
// Must be HTTPS or localhost
// Test with: navigator.clipboard.writeText("test")
```

### VRC Callback Issues

**Problem:** Not detecting donations
```bash
# Verify Zcash node is synced
zcash-cli getblockchaininfo

# Check wallet is scanning
zcash-cli z_listreceivedbyaddress "zs1YOUR_ADDRESS" 0

# Increase polling frequency
nano config.json  # Set poll_interval: 30
```

**Problem:** Callbacks not sending
```bash
# Check wallet balance (need ZEC for fees)
zcash-cli z_getbalance "zs1YOUR_ADDRESS"

# Verify callback memo format
cat vrc-callback.log | grep "Memo:"

# Manual test
./send-vrc-callback.sh \
  zs1test_address \
  "Test proverb" \
  act1-blades-awakening \
  --dry-run
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Daily health check script
#!/bin/bash

# Check Soulbae
curl -f https://agentprivacy.ai/mage/health || echo "Soulbae down!"

# Check tale pages
curl -f https://agentprivacy.ai/story/act1-blades-awakening.html || echo "Tales down!"

# Check VRC callbacks
if ! pgrep -f "watch-donations.sh" > /dev/null; then
  echo "VRC monitor down!"
fi
```

### Logs to Monitor

```bash
# Soulbae logs (NEAR Cloud AI)
shade-agent logs soulbae.YOUR_ACCOUNT.near --tail 100

# VRC callback logs
tail -f vrc-callback.log

# Zcash node logs (if running local node)
tail -f ~/.zcash/debug.log
```

### Metrics Dashboard (Optional)

```bash
# Simple metrics collection
cat > metrics.sh << 'EOF'
#!/bin/bash

echo "=== ZK Spellbook Metrics ==="
echo "Date: $(date)"
echo ""

# Donations received
echo "Donations (last 24h): $(
  zcash-cli z_listreceivedbyaddress "zs1YOUR_ADDRESS" 1 |
  jq '[.[] | select(.confirmations <= 288)] | length'
)"

# VRC callbacks sent
echo "VRC Callbacks (last 24h): $(
  grep -c "VRC sent" vrc-callback.log |
  tail -n 288
)"

# Soulbae conversations
echo "Soulbae Chats (last 24h): $(
  shade-agent metrics soulbae.YOUR_ACCOUNT.near --period 24h |
  jq '.conversations'
)"
EOF

chmod +x metrics.sh

# Run daily via cron
echo "0 0 * * * /path/to/metrics.sh >> /path/to/metrics.log" | crontab -
```

---

## 🚀 Going Live Checklist

Before announcing to the world:

### Pre-Launch

- [ ] Soulbae TEE attestation validates
- [ ] All 30 tale pages deployed
- [ ] z-address balance sufficient for VRC callbacks
- [ ] VRC monitoring running as service
- [ ] Health checks configured
- [ ] SSL certificates active
- [ ] Domain DNS configured
- [ ] Backup z-address secured

### Launch

- [ ] Test with small donation (0.01 ZEC)
- [ ] Verify VRC callback received
- [ ] Check all tale pages load
- [ ] Test on mobile devices
- [ ] Share with beta testers
- [ ] Monitor logs for errors

### Post-Launch

- [ ] Daily health checks
- [ ] Weekly metrics review
- [ ] Respond to VRCs within 24h
- [ ] Update proverbs seasonally
- [ ] Back up VRC database
- [ ] Monitor NEAR contract

---

## 📞 Support

### Documentation

- **PROJECT_OVERVIEW.md** - Architecture
- **SOULBAE_CONFIG.md** - Agent details
- **VRC_PROTOCOL.md** - Callback specs

### Community

- **Discord:** discord.gg/0xagentprivacy
- **GitHub:** https://github.com/mitchuski/agentprivacy-zypher
- **Email:** mage@agentprivacy.ai
- **Security:** security@proverbprotocol.com

### Debugging Help

```bash
# Run diagnostic script
./diagnose.sh

# Output includes:
# - Soulbae status
# - Tale page connectivity
# - VRC monitor status
# - Zcash node sync
# - Common issues & fixes
```

---

## ✅ Deployment Complete!

You now have:

1. ✅ **Soulbae** - NEAR Cloud AI at agentprivacy.ai/mage
2. ✅ **Tale Pages** - 30 spellbook tales at agentprivacy.ai/story/*
3. ✅ **VRC Callbacks** - Automated bilateral proverb responses

**Total deployment time: ~30 minutes**  
**Status: Production-ready**  
**Next: Win $25k bounty** 🏆

---

*"The proverb is the spell. The inscription is the commitment. The bilateral exchange is the relationship."*

**Now go win that hackathon!** 🚀
