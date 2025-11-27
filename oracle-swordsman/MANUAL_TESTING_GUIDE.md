# Manual Testing Guide for Oracle Swordsman

**Test the Oracle service manually without waiting for real transactions**

---

## 🎯 Quick Manual Test

### 1. Start Oracle Service

```bash
cd oracle-swordsman
npm run dev
```

The service will:
- Connect to database
- Connect to IPFS
- Start API server on port 3001
- Start monitoring for transactions

### 2. Test API Endpoints

#### Health Check
```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok","service":"oracle-swordsman"}
```

#### Get Statistics
```bash
curl http://localhost:3001/api/stats
```

#### Check Submission Status
```bash
# Replace TRACKING_CODE with actual tracking code from database
curl http://localhost:3001/api/status/TRACKING_CODE
```

---

## 🧪 Manual Submission Test

### Option 1: Direct Database Insert (Fastest)

Connect to PostgreSQL and insert a test submission:

```sql
-- Connect to database
psql $DATABASE_URL

-- Insert test submission
INSERT INTO submissions (
  tracking_code,
  sender_address,
  proverb_text,
  amount_zec,
  txid,
  memo_text,
  status
) VALUES (
  'TEST-' || extract(epoch from now())::text,
  'zs1test123...',
  'Privacy requires separation of concerns.',
  0.01,
  'test-txid-' || extract(epoch from now())::text,
  'ACT:1|Privacy requires separation of concerns.',
  'pending'
) RETURNING *;
```

The Oracle will pick it up on the next monitoring cycle (default: 30 seconds).

### Option 2: Use Admin API (Recommended)

See `ADMIN_INTERFACE.md` for the admin interface that lets you:
- Submit test proverbs
- Review all submissions
- View verification results
- Manually trigger verification

### Option 3: Test with Real Transaction

1. **Generate a test memo**:
   ```
   ACT:5|To see without the power to act is to be bound by what you witness.
   ```

2. **Send test transaction** (using Zashi or zcash-cli):
   ```bash
   # Using zcash-cli (if you have a test wallet)
   zcash-cli z_sendmany \
     "your_from_address" \
     '[{"address":"'$DONATION_Z_ADDRESS'","amount":0.01,"memo":"ACT:5|To see without the power..."}]'
   ```

3. **Monitor Oracle logs**:
   ```bash
   # In another terminal
   tail -f oracle-swordsman/logs/oracle.log
   ```

4. **Check status via API**:
   ```bash
   # Get tracking code from logs or database
   curl http://localhost:3001/api/status/TRACKING_CODE
   ```

---

## 🔍 Manual Verification Test

### Test NEAR Cloud AI Verification Directly

```bash
cd oracle-swordsman
npm run test:near
```

Or use the Node.js REPL:

```bash
cd oracle-swordsman
node -e "
const { nearVerifier } = require('./dist/nearcloudai-verifier');
const { ipfsClient } = require('./dist/ipfs-client');

(async () => {
  const spellbook = await ipfsClient.fetchSpellbook();
  const result = await nearVerifier.verify(
    'Privacy requires separation of concerns.',
    spellbook
  );
  console.log(JSON.stringify(result, null, 2));
})();
"
```

### Test with Different Proverbs

```bash
# Exact match (should return quality_score: 1.0)
node -e "
const { nearVerifier } = require('./dist/nearcloudai-verifier');
const { ipfsClient } = require('./dist/ipfs-client');
(async () => {
  const spellbook = await ipfsClient.fetchSpellbook();
  const act1 = spellbook.acts.find(a => a.id === 'act-01-shield');
  if (act1 && act1.proverb) {
    const result = await nearVerifier.verify(act1.proverb, spellbook);
    console.log('Exact match:', result);
  }
})();
"

# Semantic match (should return quality_score: 0.7-0.9)
node -e "
const { nearVerifier } = require('./dist/nearcloudai-verifier');
const { ipfsClient } = require('./dist/ipfs-client');
(async () => {
  const spellbook = await ipfsClient.fetchSpellbook();
  const result = await nearVerifier.verify(
    'To protect privacy, we must separate different concerns.',
    spellbook
  );
  console.log('Semantic match:', result);
})();
"

# Low quality (should return quality_score: < 0.5)
node -e "
const { nearVerifier } = require('./dist/nearcloudai-verifier');
const { ipfsClient } = require('./dist/ipfs-client');
(async () => {
  const spellbook = await ipfsClient.fetchSpellbook();
  const result = await nearVerifier.verify(
    'The weather is nice today.',
    spellbook
  );
  console.log('Low quality:', result);
})();
"
```

---

## 📊 Database Queries for Manual Review

### View All Submissions

```sql
SELECT 
  id,
  tracking_code,
  status,
  proverb_text,
  amount_zec,
  txid,
  created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 20;
```

### View Submissions with Verifications

```sql
SELECT 
  s.id,
  s.tracking_code,
  s.status,
  s.proverb_text,
  s.amount_zec,
  v.quality_score,
  v.matched_act,
  v.reasoning,
  v.verified_at
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id
ORDER BY s.created_at DESC
LIMIT 20;
```

### View Pending Submissions

```sql
SELECT * FROM submissions WHERE status = 'pending';
```

### View Approved Submissions

```sql
SELECT 
  s.*,
  v.quality_score,
  v.matched_act
FROM submissions s
JOIN verifications v ON s.id = v.submission_id
WHERE s.status = 'approved'
ORDER BY s.created_at DESC;
```

### View Rejected Submissions

```sql
SELECT 
  s.*,
  v.quality_score,
  v.reasoning
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id
WHERE s.status = 'rejected'
ORDER BY s.created_at DESC;
```

---

## 🛠️ Troubleshooting Manual Tests

### Oracle Not Processing Submissions

1. **Check if Oracle is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check logs**:
   ```bash
   tail -f oracle-swordsman/logs/oracle.log
   ```

3. **Check database connection**:
   ```bash
   cd oracle-swordsman
   npm run verify
   ```

4. **Manually trigger processing** (if using admin interface):
   ```bash
   curl -X POST http://localhost:3001/api/admin/process-pending
   ```

### Verification Failing

1. **Check NEAR API key**:
   ```bash
   echo $NEAR_SWORDSMAN_API_KEY
   # Should show: sk-876c0f435b14449bac47f13583f5fd68
   ```

2. **Test NEAR connection**:
   ```bash
   cd oracle-swordsman
   npm run test:near
   ```

3. **Check IPFS access**:
   ```bash
   curl -s "https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreiesrv2eolghj6mpbfpqwnff66fl5glevqmps3q6bzlhg5gtyf5jz4" | jq '.version'
   ```

### Database Issues

1. **Test connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check tables exist**:
   ```sql
   \dt
   ```

3. **View recent submissions**:
   ```sql
   SELECT COUNT(*) FROM submissions;
   ```

---

## 🎯 Next Steps

1. **Use Admin Interface**: See `ADMIN_INTERFACE.md` for a web-based admin panel
2. **Review Submissions**: Use database queries or admin API
3. **Test End-to-End**: Send real transaction and monitor flow
4. **Check Production Readiness**: See `PRODUCTION_READINESS.md`

---

**Tip**: The admin interface (`/admin` endpoint) provides a much easier way to test and review submissions than manual database queries!

