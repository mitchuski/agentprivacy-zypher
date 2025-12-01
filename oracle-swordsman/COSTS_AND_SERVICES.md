# Costs & Services Guide

## Current Setup (Local Development)

**You're running everything locally - NO server costs!**

### ✅ Free Services (No Payment Required)

1. **Zcash Node (Zebra)**
   - Running on your local machine
   - **Cost: $0** (just your computer's resources)

2. **PostgreSQL Database**
   - Running locally
   - **Cost: $0**

3. **Oracle Backend**
   - Running on `localhost:3001`
   - **Cost: $0**

4. **Frontend (Next.js)**
   - Running on `localhost:3000`
   - **Cost: $0**

### ⚠️ Optional Services (May Have Free Tiers)

#### 1. NEAR Cloud AI (AI Verification)

**Status**: Used for proverb verification

**Free Tier**:
- ✅ **100 requests/month FREE**
- Perfect for testing and development

**Paid Tier** (if you exceed free tier):
- ~$0.03 per request
- Only needed if processing >100 proverbs/month

**To Get Free API Key**:
1. Visit: https://cloud.near.ai/
2. Sign up (free)
3. Get API key
4. Add to `.env`: `NEAR_SWORDSMAN_API_KEY=your_key`

**For Testing**: Free tier is plenty!

---

#### 2. IPFS/Pinata (Spellbook Storage)

**Status**: Used to store spellbook acts

**Free Tier**:
- ✅ **1GB storage FREE**
- ✅ **Unlimited bandwidth**
- Perfect for spellbook storage

**Paid Tier** (if you exceed free tier):
- $20/month for 100GB
- Only needed if storing large files

**To Get Free Account**:
1. Visit: https://www.pinata.cloud/
2. Sign up (free)
3. Get JWT token
4. Add to `.env`: `PINATA_JWT=your_token`

**For Testing**: Free tier is enough!

---

#### 3. Nillion (TEE - Trusted Execution Environment)

**Status**: ⚠️ **NOT CURRENTLY USED**

**Current Setup**:
- Code exists but Nillion is **not active**
- System works without it (uses direct Zcash RPC)
- You can test everything without Nillion

**If You Want to Use Nillion** (optional):
- **Free tier available** (for development)
- Production: ~$50/month for TEE compute
- **Not required for testing!**

**To Get Free API Key** (if you want to test):
1. Join Discord: https://discord.gg/nillion
2. Go to #developers channel
3. Request API key for development
4. Add to `.env`: `NILLION_API_KEY=your_key`

**For Testing**: **Skip Nillion** - not needed!

---

## Summary: What You Need to Pay

### For Local Development/Testing: **$0**

Everything runs locally:
- ✅ Zebra node (local)
- ✅ PostgreSQL (local)
- ✅ Backend (local)
- ✅ Frontend (local)
- ✅ NEAR Cloud AI (100 free requests/month)
- ✅ Pinata IPFS (1GB free storage)

**Total Cost: $0/month** for testing! 🎉

---

### For Production Deployment (Later)

Only if you want to deploy to a server:

**Monthly Fixed Costs**:
- VPS/Server: ~$24/month (DigitalOcean, AWS, etc.)
- Pinata IPFS: $20/month (if >1GB)
- Nillion TEE: $50/month (if using TEE signing)
- **Total: ~$94/month** (only if deploying)

**Variable Costs** (per proverb):
- NEAR Cloud AI: $0.03/proverb (after free tier)
- Zcash network fee: ~$0.004/proverb

**But you're not deploying yet - just testing locally!**

---

## What You Should Do Now

### 1. Get Free API Keys (Optional but Recommended)

**NEAR Cloud AI** (for proverb verification):
```powershell
# Visit https://cloud.near.ai/
# Sign up (free)
# Get API key
# Add to oracle-swordsman/.env:
NEAR_SWORDSMAN_API_KEY=sk-your-key-here
```

**Pinata** (for spellbook storage):
```powershell
# Visit https://www.pinata.cloud/
# Sign up (free)
# Get JWT token
# Add to oracle-swordsman/.env:
PINATA_JWT=your-jwt-token-here
```

### 2. Skip Nillion (For Now)

- ✅ System works without it
- ✅ You can test everything locally
- ✅ Add Nillion later if needed

### 3. Test Everything Locally

- ✅ No server needed
- ✅ No hosting costs
- ✅ Everything runs on your machine

---

## Quick Cost Check

**Current Status**: 
- ✅ Running locally
- ✅ Using free tiers
- ✅ **Total Cost: $0/month**

**You're good to go!** No payments required for testing. 🚀

---

## When You'd Need to Pay

Only if you:
1. **Deploy to production** (need VPS/server)
2. **Process >100 proverbs/month** (exceed NEAR free tier)
3. **Store >1GB on IPFS** (exceed Pinata free tier)
4. **Use Nillion TEE** (optional, ~$50/month)

**For now**: Just test locally - it's all free! ✅

