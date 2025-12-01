# Production Flow Setup Guide

**Step-by-step guide to set up and test the full production flow**

---

## ✅ Prerequisites Checklist

Before starting, verify all components are ready:

- [x] Frontend running and connected (port 3000)
- [x] Z-address created from seed
- [x] Nillion TEE responding
- [x] Zebrad node working
- [x] Zallet wallet working
- [x] Wallet interface running (port 3001)

---

## 📋 Step-by-Step Production Flow

### Step 1: Verify Z-Address Control

**Goal:** Confirm you can control the z-address from your seed

**Actions:**
1. Verify z-address is in `zcash-addresses-controlled.json`
2. Test signing capability with the address
3. Confirm viewing key access

**Commands:**
```bash
# Check addresses file
cat zcash-addresses-controlled.json

# Test address control
npx ts-node scripts/key-generation/validate-address.ts
```

---

### Step 2: Verify Zebrad Node Connection

**Goal:** Ensure Oracle can communicate with Zebra node

**Actions:**
1. Check Zebra is running and synced
2. Verify RPC is accessible
3. Test basic RPC commands

**Commands:**
```bash
# Check if zebrad is running
Get-Process -Name zebrad -ErrorAction SilentlyContinue

# Test RPC connection
npx ts-node tests/integration/test-zebra-simple.ts
```

**Expected:** Should connect and return node info

---

### Step 3: Verify Zallet Wallet

**Goal:** Ensure Zallet is synced and ready

**Actions:**
1. Check Zallet is running
2. Verify wallet is synced
3. Confirm RPC is accessible

**Commands:**
```bash
# Check if zallet is running
Get-Process -Name zallet -ErrorAction SilentlyContinue

# Check zallet status (if RPC available)
# zallet status
```

**Expected:** Wallet should be synced and ready

---

### Step 4: Verify Nillion TEE Connection

**Goal:** Ensure SecretSigner workload is running

**Actions:**
1. Test Nillion API connection
2. Verify workload is deployed
3. Test SecretSigner endpoints

**Commands:**
```bash
# Test Nillion API
npx ts-node tests/integration/test-nillion.ts

# Test workloads
npx ts-node tests/integration/test-nillion-workloads.ts

# Test SecretSigner (if workload deployed)
npx ts-node tests/integration/test-secretsigner.ts
```

**Expected:** API should connect, workload should be listed

---

### Step 5: Verify Database Connection

**Goal:** Ensure PostgreSQL is ready

**Actions:**
1. Test database connection
2. Verify schema is applied
3. Check tables exist

**Commands:**
```bash
# Test database
npx ts-node tests/integration/test-foundation.ts
```

**Expected:** Database should connect and return stats

---

### Step 6: Start Oracle Swordsman Service

**Goal:** Start the main Oracle service

**Actions:**
1. Verify all environment variables are set
2. Start the service
3. Monitor startup logs

**Commands:**
```bash
# Check environment
cat .env | Select-String -Pattern "NEAR|NILLION|DATABASE|ZCASH"

# Start service
npm run dev
```

**Expected:** Service should start without errors, all connections should initialize

---

### Step 7: Test Full Flow - Submit a Proverb

**Goal:** Test end-to-end proverb submission

**Actions:**
1. Create a test proverb transaction
2. Send to your z-address with memo
3. Monitor Oracle processing
4. Verify in wallet interface

**Flow:**
```
1. User creates proverb: "Privacy is the foundation of freedom."
2. User sends ZEC to z-address with memo:
   rpp-v1
   tale:act-i
   Privacy is the foundation of freedom.
3. Oracle detects transaction
4. Oracle parses memo
5. Oracle verifies with NEAR Cloud AI
6. Oracle creates inscription (61.8% public, 38.2% private)
7. Oracle signs with Nillion SecretSigner
8. Oracle broadcasts transactions
9. User sees result in wallet interface
```

---

### Step 8: Monitor in Wallet Interface

**Goal:** View results in the wallet UI

**Actions:**
1. Open wallet interface: http://localhost:3000/wallet
2. Check addresses and balances
3. View successful proverbs
4. Monitor transaction status

**What to Check:**
- Addresses show correct balances
- Proverb appears in "Successful Proverbs" section
- Transaction IDs are visible
- Quality scores and AI reasoning displayed

---

## 🔧 Troubleshooting

### If Zebrad Connection Fails
- Check `config/zallet.toml` has correct `validator_address`
- Verify cookie file exists: `C:\Users\mitch\AppData\Local\zebra\.cookie`
- Check RPC port: 8233 for mainnet

### If Nillion Connection Fails
- Verify API key in `.env`
- Check workload is deployed
- Test API endpoint directly

### If Database Connection Fails
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure schema is applied

### If Oracle Service Won't Start
- Check all environment variables
- Review startup logs
- Verify all dependencies installed

---

## 📊 Success Criteria

**Full flow is working when:**
- ✅ Oracle service starts without errors
- ✅ All connections initialize successfully
- ✅ Test proverb submission is detected
- ✅ Proverb is verified by NEAR Cloud AI
- ✅ Inscription transactions are created
- ✅ Transactions are signed by Nillion
- ✅ Results appear in wallet interface

---

## 🚀 Next Steps After Setup

1. **Monitor First Real Submission**
   - Watch logs for processing
   - Verify all steps complete
   - Check wallet interface for results

2. **Optimize Performance**
   - Adjust check intervals
   - Monitor resource usage
   - Fine-tune error handling

3. **Production Hardening**
   - Set up monitoring/alerts
   - Configure backups
   - Document runbooks

---

**Last Updated:** 2025-11-28

