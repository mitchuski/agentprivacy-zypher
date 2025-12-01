# Continue Production Setup

**Status:** Production flow setup complete, ready for next steps

---

## ✅ Completed

- Configuration: Ready
- Z-Address: Ready (zs1pgazk5q3haxap96mc...)
- IPFS/Spellbook: Ready (42 acts)
- NEAR Cloud AI: Ready (verified test proverb)
- Nillion: Connected (key not stored)
- Database: Needs `proverb_stats` view
- Zcash Balance: Zebrad limitation (expected)

---

## 🔧 Step 1: Fix Database

**Issue:** Missing `proverb_stats` view

**Solution:** Run the database fix script

**Windows PowerShell:**
```powershell
cd oracle-swordsman
.\scripts\database\apply-fix.ps1
```

**Manual (if script doesn't work):**
```bash
psql -U proverb_user -d proverb_protocol -f scripts/database/fix-proverb-stats.sql
```

**Verify:**
```bash
psql -U proverb_user -d proverb_protocol -c "SELECT * FROM proverb_stats;"
```

**Expected:** Should return stats with all zeros (no submissions yet)

---

## 🔐 Step 2: Store Nillion Key (Optional)

**Current:** Nillion is connected but key not stored

**Impact:** Oracle can run, but transactions won't be signed automatically

**Option A: Deploy SecretSigner Workload (Recommended)**

1. **Build SecretSigner image (if needed):**
   ```powershell
   npm run build:secretsigner
   ```

2. **Deploy workload with keys:**
   ```powershell
   npx ts-node scripts/deployment/setup-with-keys.ts
   ```

3. **Verify workload is running:**
   - Check Nillion dashboard
   - Test SecretSigner endpoint

**Option B: Skip for Now**

- Oracle will still process submissions
- Transactions can be signed manually later
- Can add Nillion key later without disruption

---

## 🚀 Step 3: Start Oracle Service

**Command:**
```powershell
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

**If errors occur:**
- Check `.env` file has all required variables
- Verify PostgreSQL is running
- Verify Zebrad node is accessible
- Check Nillion API key is valid

**Endpoints:**
- API: http://localhost:3001
- Admin: http://localhost:3001/admin
- Wallet UI: http://localhost:3001/wallet

---

## 🧪 Step 4: Test Submission

### Option A: Test Script

**Run test submission:**
```powershell
npm run test:submission
```

**What it tests:**
- Z-address retrieval
- Memo parsing
- NEAR Cloud AI verification
- Database submission creation
- Transaction builder initialization

### Option B: Real Transaction

**Using Zashi Wallet or Zallet:**

1. **Create memo:**
   ```
   rpp-v1
   tale:act-i
   Privacy is the foundation of freedom.
   ```

2. **Send transaction:**
   - **To:** `zs1pgazk5q3haxap96mcyvlykue82p63qnt` (your z-address)
   - **Amount:** 0.01 ZEC (minimum)
   - **Memo:** (paste the memo above)

3. **Wait for confirmation:**
   - Transaction needs 1+ confirmation
   - Oracle checks every 30 seconds (default)

---

## 📊 Step 5: Monitor Results

### Check Oracle Logs

**Watch for:**
```
[INFO] New submission detected: TEST-xxxxx
[INFO] Parsing memo...
[INFO] Verifying with NEAR Cloud AI...
[INFO] Proverb verified: quality_score=0.75
[INFO] Creating inscription transactions...
[INFO] Signing with Nillion...
[INFO] Broadcasting transactions...
[INFO] Submission complete
```

### Check Wallet Interface

**Open:** http://localhost:3000/wallet

**Verify:**
- Addresses load correctly
- Balances display (may show 0 with Zebrad)
- Proverb appears in "Successful Proverbs" section
- Quality score and AI reasoning visible
- Transaction IDs displayed

### Check Database

**Query submissions:**
```sql
psql -U proverb_user -d proverb_protocol -c "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;"
```

**Check stats:**
```sql
psql -U proverb_user -d proverb_protocol -c "SELECT * FROM proverb_stats;"
```

---

## 🔍 Troubleshooting

### Database Error: "proverb_stats does not exist"

**Fix:** Run Step 1 (database fix)

### Zebrad Balance Error: "Method not found"

**Status:** Expected - Zebrad is full node, not wallet

**Workaround:** Use `listunspent` for specific addresses (already handled in code)

### Nillion Key Not Stored

**Impact:** Transactions can still be created, just won't be signed automatically

**Action:** Deploy SecretSigner workload (Step 2) or skip for now

### Oracle Not Detecting Transactions

**Check:**
- Zebrad is synced
- Transaction has memo
- Memo format is correct (RPP-v1)
- Transaction has 1+ confirmation
- Oracle service is running

### NEAR Cloud AI Verification Fails

**Check:**
- NEAR_API_KEY is set in `.env`
- API endpoint is accessible
- Spellbook loaded correctly (42 acts)

---

## 📋 Quick Reference

**All Commands:**
```powershell
# 1. Fix database
.\scripts\database\apply-fix.ps1

# 2. Start Oracle
npm run dev

# 3. Test submission
npm run test:submission

# 4. Check status
npm run verify
```

**Useful Scripts:**
- `npm run verify` - Test all connections
- `npm run test:submission` - Test submission flow
- `npm run build:secretsigner` - Build SecretSigner image

---

## 🎯 Success Criteria

**Full flow is working when:**
1. ✅ Oracle service starts without errors
2. ✅ Test submission is detected
3. ✅ Proverb is verified by NEAR Cloud AI
4. ✅ Database submission created
5. ✅ Results appear in wallet interface
6. ✅ Transaction IDs are visible (if Nillion key stored)

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

**Last Updated:** 2025-01-28

