# Production Setup - Step by Step

**Complete guide to set up and test the full production flow**

---

## ✅ Current Status

Based on test results:
- ✅ **Configuration**: All environment variables set
- ✅ **Z-Address**: Found and ready (`zs1pgazk5q3haxap96mcyvlykue82p63qnt`)
- ✅ **IPFS/Spellbook**: Loaded successfully (42 acts)
- ✅ **NEAR Cloud AI**: Responding and verifying proverbs
- ⚠️ **Nillion TEE**: Connected but key not stored yet
- ❌ **Database**: Missing `proverb_stats` view
- ❌ **Zcash Balance**: Zebrad doesn't support `getbalance` method

---

## 🔧 Step 1: Fix Database Schema

**Issue:** Missing `proverb_stats` view

**Fix:**
```sql
-- Create proverb_stats view
CREATE OR REPLACE VIEW proverb_stats AS
SELECT 
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE status = 'verified') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(v.quality_score) as avg_quality_score,
  SUM(amount_zec) as total_zec_received
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id;
```

**Run:**
```bash
psql -U proverb_user -d proverb_protocol -f ../scripts/schema.sql
```

---

## 🔧 Step 2: Fix Zcash Balance Method

**Issue:** Zebrad doesn't support `getbalance` RPC method (it's a full node, not a wallet)

**Solution:** Use `listunspent` for transparent addresses and skip shielded balance check for now

**Status:** This is expected - Zebrad is a full node. Balance checking will work differently.

---

## 📋 Step 3: Store Nillion Key

**Current:** Nillion is connected but key not stored

**Action:** Store your Zcash spending key in Nillion SecretSigner

**Option A: Use SecretSigner Workload (Recommended)**
```bash
# If workload is deployed, use setup script
npx ts-node scripts/deployment/setup-with-keys.ts
```

**Option B: Manual Key Storage**
- Deploy SecretSigner workload first
- Then store key via workload API

---

## 🚀 Step 4: Start Full Production Flow

### 4.1 Start Oracle Service

```bash
npm run dev
```

**Expected Output:**
```
✓ Database connected
✓ Zcash client connected
✓ IPFS client connected
✓ NEAR Cloud AI ready
✓ Nillion initialized
✓ API server started on port 3001
✓ Transaction monitor started
```

### 4.2 Verify Wallet Interface

Open: http://localhost:3000/wallet

**Check:**
- ✅ Addresses load
- ✅ Balances display (may show 0 if using Zebrad)
- ✅ Proverb section loads

---

## 🧪 Step 5: Test Full Flow

### 5.1 Create Test Proverb Submission

**Using Zashi Wallet or Zallet:**

1. **Create Memo:**
   ```
   rpp-v1
   tale:act-i
   Privacy is the foundation of freedom.
   ```

2. **Send Transaction:**
   - To: `zs1pgazk5q3haxap96mcyvlykue82p63qnt` (your z-address)
   - Amount: 0.01 ZEC (minimum)
   - Memo: (paste the memo above)

3. **Wait for Confirmation:**
   - Transaction needs 1+ confirmation
   - Oracle checks every 30 seconds (default)

### 5.2 Monitor Processing

**Watch Oracle Logs:**
```bash
# In Oracle terminal, you should see:
[INFO] New submission detected: TEST-xxxxx
[INFO] Parsing memo...
[INFO] Verifying with NEAR Cloud AI...
[INFO] Proverb verified: quality_score=0.75
[INFO] Creating inscription transactions...
[INFO] Signing with Nillion...
[INFO] Broadcasting transactions...
[INFO] Submission complete
```

### 5.3 Check Results

**In Wallet Interface:**
1. Refresh page: http://localhost:3000/wallet
2. Check "Successful Proverbs" section
3. Your proverb should appear with:
   - Tracking code
   - Quality score
   - Matched act
   - AI reasoning
   - Transaction IDs

---

## 📊 Step 6: Verify End-to-End

**Checklist:**
- [ ] Transaction detected by Oracle
- [ ] Memo parsed correctly
- [ ] Proverb verified by NEAR Cloud AI
- [ ] Database submission created
- [ ] Verification record created
- [ ] Inscription transactions created (if Nillion key stored)
- [ ] Results visible in wallet interface

---

## 🔍 Troubleshooting

### Database Error: "proverb_stats does not exist"
**Fix:** Run schema update (see Step 1)

### Zebrad Balance Error: "Method not found"
**Status:** Expected - Zebrad is full node, not wallet
**Workaround:** Use `listunspent` for specific addresses

### Nillion Key Not Stored
**Action:** Deploy SecretSigner workload and store key
**Note:** Transactions can still be created, just won't be signed automatically

### Oracle Not Detecting Transactions
**Check:**
- Zebrad is synced
- Transaction has memo
- Memo format is correct (RPP-v1)
- Transaction has 1+ confirmation

---

## 🎯 Success Criteria

**Full flow is working when:**
1. ✅ Oracle service starts without errors
2. ✅ Test submission is detected
3. ✅ Proverb is verified
4. ✅ Results appear in wallet interface
5. ✅ All transaction IDs are visible

---

## 📝 Next Steps After Testing

1. **Monitor Real Submissions**
   - Watch for incoming transactions
   - Verify processing time
   - Check error rates

2. **Optimize Performance**
   - Adjust check intervals
   - Fine-tune verification thresholds
   - Monitor resource usage

3. **Production Hardening**
   - Set up monitoring/alerts
   - Configure backups
   - Document runbooks

---

**Last Updated:** 2025-11-28

