# Production Testing Guide (Without Nillion)

## Testing Strategy

**Phase 1: Core Flow Testing (Current - No Nillion)**
- ✅ Test ZEC control and mainnet connectivity
- ✅ Test transaction detection
- ✅ Test NEAR Cloud AI verification
- ✅ Test first inscription
- ✅ Verify onchain results

**Phase 2: Nillion Integration (Later)**
- Add Nillion signing after core flow is proven
- Migrate keys to SecretSigner workload
- Test TEE-isolated signing

---

## Pre-Flight Checklist

### 1. Environment Configuration

```bash
# Verify mainnet configuration
NETWORK=mainnet
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password

# NEAR Cloud AI
NEAR_SWORDSMAN_API_KEY=your_swordsman_key
NEAR_MODEL=openai/gpt-oss-120b

# Database
DATABASE_URL=postgresql://user:pass@localhost/oracle

# Economics
PROVERB_COST=0.01
PUBLIC_SPLIT=0.618
PRIVATE_SPLIT=0.382
```

### 2. Zcash Node Status

```bash
# Check Zebra/zebrad is running and synced
# Should show mainnet and recent block height
```

### 3. Database Ready

```bash
# Verify database schema is up to date
# Check proverb_stats view exists
```

### 4. Address File Ready

```bash
# Verify zcash-addresses-controlled.json exists
# Should have all 36 addresses mapped to acts
# NO private keys (secure)
```

---

## Testing Steps

### Step 1: Verify ZEC Control

**Test 1.1: Check Balance**
```bash
# Via API
curl http://localhost:3000/api/wallet/balances

# Or check directly
# Should show balances on your addresses
```

**Test 1.2: Send Test Transaction**
```bash
# Send small amount (0.001 ZEC) between your own addresses
# Verify it appears in wallet UI
# Verify balance updates
```

**Test 1.3: Verify Mainnet**
```bash
# Check block height matches mainnet
# Verify network info shows mainnet
curl http://localhost:3000/api/oracle/status
```

### Step 2: Test Transaction Detection

**Test 2.1: Send Test Submission**
```bash
# Send 0.01 ZEC to your Oracle z-address with memo:
# Format: "TRACK:TEST001|Your test proverb here"

# Monitor logs for detection
tail -f logs/oracle.log
```

**Test 2.2: Verify Detection**
```bash
# Check database
SELECT * FROM submissions WHERE tracking_code = 'TEST001';

# Check API
curl http://localhost:3000/api/submissions
```

### Step 3: Test NEAR Cloud AI Verification

**Test 3.1: Manual Verification**
```bash
# Trigger verification for test submission
curl -X POST http://localhost:3000/api/admin/submissions/1/verify

# Check result
curl http://localhost:3000/api/submissions/1
```

**Test 3.2: Verify Quality Score**
- Should get quality_score (0-1)
- Should get matched_act
- Should get reasoning
- Should be approved if quality >= 0.5

### Step 4: Test First Inscription

**Test 4.1: Ensure Submission is Approved**
```bash
# If not approved, check quality score
# May need to adjust proverb to match spellbook better
```

**Test 4.2: Monitor Inscription**
```bash
# Watch logs for inscription creation
tail -f logs/oracle.log | grep -i inscription

# Should see:
# - "Inscribing proverb"
# - "Sending public inscription..."
# - "Sending private transaction..."
# - "Inscription complete"
```

**Test 4.3: Verify Onchain**
```bash
# Check database for inscription records
SELECT * FROM inscriptions WHERE submission_id = 1;

# Get transaction IDs
# public_txid: Check on Zcash explorer
# private_txid: Check on Zcash explorer (shielded)

# Verify amounts:
# public_amount should be ~0.00618 ZEC (61.8%)
# private_amount should be ~0.00382 ZEC (38.2%)
```

**Test 4.4: Verify Memos**
```bash
# Public inscription (t-address) should have memo with:
# - Tracking code
# - Proverb text
# - Tale ID

# Check via Zcash explorer or:
curl http://localhost:3000/api/wallet/proverbs
```

### Step 5: Verify End-to-End

**Test 5.1: Complete Flow**
1. Send 0.01 ZEC with proverb memo
2. Wait for detection (30 seconds)
3. Verify NEAR Cloud AI verification
4. Verify inscription created
5. Check onchain transactions
6. Verify wallet UI shows results

**Test 5.2: Check Wallet UI**
```bash
# Open wallet interface
http://localhost:3000/wallet

# Should show:
# - All addresses with balances
# - Act mappings
# - Successful proverbs with t-address tracking
```

---

## Monitoring During Tests

### Log Files
```bash
# Oracle logs
tail -f logs/oracle.log

# API logs
tail -f logs/api.log

# Database logs (if enabled)
```

### Key Metrics to Watch
- Transaction detection rate
- NEAR Cloud AI response times
- Inscription success rate
- Transaction confirmation times
- Balance updates

### Error Indicators
- ❌ "Nillion initialization failed" - OK (expected, not using Nillion)
- ❌ "Transaction send failed" - Check Zcash node
- ❌ "Verification failed" - Check NEAR API key
- ❌ "Failed to fetch spellbook" - Check IPFS/Pinata

---

## Production Safety

### Before Going Live

1. **Start with Small Amounts**
   - Test with 0.01 ZEC first
   - Verify everything works
   - Then scale up

2. **Monitor First Few Transactions**
   - Watch logs closely
   - Verify each step
   - Check onchain confirmations

3. **Have Rollback Plan**
   - Can stop Oracle if issues
   - Transactions already onchain are permanent
   - But can prevent new inscriptions

4. **Test Recovery**
   - Stop Oracle
   - Restart Oracle
   - Verify it picks up where it left off

---

## Common Issues & Solutions

### Issue: Transactions Not Detected
**Solution:**
- Check Zcash node is synced
- Verify Oracle is monitoring correct addresses
- Check memo format matches expected pattern

### Issue: NEAR Cloud AI Fails
**Solution:**
- Verify API key is correct
- Check API key has credits
- Verify network connectivity
- Check logs for specific error

### Issue: Inscription Fails
**Solution:**
- Check Oracle has sufficient balance
- Verify addresses are correct
- Check Zcash node is responding
- Verify transaction builder initialized

### Issue: Wrong Split Amounts
**Solution:**
- Check PUBLIC_SPLIT and PRIVATE_SPLIT env vars
- Default is 0.618/0.382 (golden ratio)
- Can be 0.44/0.56 if configured differently

---

## Success Criteria

✅ **Ready for Production When:**
- [ ] ZEC control verified (can send/receive)
- [ ] Mainnet connectivity confirmed
- [ ] Transaction detection working
- [ ] NEAR Cloud AI verification working
- [ ] First inscription successful
- [ ] Onchain transactions visible
- [ ] Wallet UI showing results
- [ ] Database records complete

---

## Next Steps After Testing

Once core flow is proven:

1. **Document Results**
   - Record first inscription TXIDs
   - Note any issues encountered
   - Document performance metrics

2. **Plan Nillion Integration**
   - Design raw transaction building
   - Plan key migration to SecretSigner
   - Design signing flow
   - Test in staging first

3. **Security Hardening**
   - Move keys to Nillion TEE
   - Enable TEE-isolated signing
   - Test signing flow
   - Monitor attestations

---

## Quick Test Commands

```bash
# Check Oracle status
curl http://localhost:3000/api/oracle/status

# Check wallet addresses
curl http://localhost:3000/api/wallet/addresses

# Check balances
curl http://localhost:3000/api/wallet/balances

# Check submissions
curl http://localhost:3000/api/submissions

# Check proverbs
curl http://localhost:3000/api/wallet/proverbs

# Manual verification trigger
curl -X POST http://localhost:3000/api/admin/submissions/1/verify
```

---

## Notes

- **Nillion errors are expected** - System continues without it
- **Keys are in Zcash wallet** - Not in TEE (will add later)
- **Signing via RPC** - Not hardware-isolated (will add later)
- **Core flow works** - NEAR AI + IPFS + Inscriptions all functional

Good luck with your first production inscription! 🚀

