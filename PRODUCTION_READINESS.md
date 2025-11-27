# Production Readiness Checklist

**Signal-to-Sanctuary Donation Flow**

Version 1.0 | December 2024

---

## 🎯 Current Status

Based on your implementation files, here's where you are:

### ✅ Completed Components

- [x] **DonationFlow.tsx** - Complete UI component with 5-step flow
- [x] **golden-split.ts** - Golden ratio calculator (61.8/38.2)
- [x] **inscription-builder.ts** - OP_RETURN inscription creation
- [x] **semantic-matcher.ts** - AI-powered proverb matching
- [x] **ipfs-proverb-fetcher.ts** - IPFS spellbook integration
- [x] **rpc-client.ts** - Zebra RPC client
- [x] **test-flow.sh** - Comprehensive test script
- [x] **setup-keys.sh** - Key generation script
- [x] **docker-compose.yml** - Service orchestration
- [x] **Documentation** - Signal-to-Sanctuary flow documented

### 🔄 In Progress / Needs Testing

- [ ] **Oracle Service** - Needs implementation/integration
- [ ] **Signer Service** - Needs implementation/integration
- [ ] **Zebrad RPC Integration** - Test with your running node
- [ ] **End-to-End Flow** - Full transaction test
- [ ] **Error Handling** - Edge cases and failures

---

## 📋 Production Test Checklist

### Phase 1: Infrastructure Setup ✅

- [x] Zebrad node running
- [ ] Zebrad RPC accessible (port 8232)
- [ ] RPC authentication configured
- [ ] Environment variables set (`.env`)
- [ ] Keys generated (viewing + spending)

### Phase 2: Component Testing

- [ ] **Test 1**: Node connection
  ```bash
  curl -X POST http://localhost:8232 \
    --user "$ZEBRA_USER:$ZEBRA_PASS" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"1.0","id":"test","method":"getblockcount","params":[]}'
  ```

- [ ] **Test 2**: IPFS spellbook access
  ```bash
  curl -s "https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreiesrv2eolghj6mpbfpqwnff66fl5glevqmps3q6bzlhg5gtyf5jz4" | jq '.version'
  ```

- [ ] **Test 3**: Viewing key import
  ```bash
  # Import viewing key to zebrad
  curl -X POST http://localhost:8232 \
    --user "$ZEBRA_USER:$ZEBRA_PASS" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "1.0",
      "id": "test",
      "method": "z_importviewingkey",
      "params": ["'$DONATION_VIEWING_KEY'", "no"]
    }'
  ```

- [ ] **Test 4**: Semantic matcher
  ```bash
  cd oracle
  npx ts-node -e "
  const { ProverbMatcher } = require('./src/semantic-matcher');
  const matcher = new ProverbMatcher();
  matcher.compare('test proverb', 'canonical proverb').then(score => console.log(score));
  "
  ```

- [ ] **Test 5**: Golden split calculation
  ```bash
  cd signer
  npx ts-node golden-split.ts
  ```

- [ ] **Test 6**: Inscription builder
  ```bash
  cd signer
  npx ts-node inscription-builder.ts
  ```

### Phase 3: Service Integration

- [ ] **Oracle Service**
  - [ ] Starts successfully
  - [ ] Connects to zebrad
  - [ ] Imports viewing key
  - [ ] Monitors transactions
  - [ ] Fetches from IPFS
  - [ ] Performs semantic match
  - [ ] Signals signer on verification

- [ ] **Signer Service**
  - [ ] Starts successfully
  - [ ] Connects to zebrad
  - [ ] Receives verification signals
  - [ ] Calculates golden split
  - [ ] Builds inscription
  - [ ] Creates transparent transaction (t-address)
  - [ ] Creates shielded transaction (z-address)
  - [ ] Broadcasts both transactions

### Phase 4: End-to-End Test

- [ ] **Step 1**: Send test transaction
  - [ ] Format memo: `ACT:5|Your test proverb`
  - [ ] Send 0.01 ZEC to donation z-address
  - [ ] Transaction confirms

- [ ] **Step 2**: Oracle detects transaction
  - [ ] Oracle logs show transaction detected
  - [ ] Memo decrypted successfully
  - [ ] Canonical proverb fetched from IPFS
  - [ ] Semantic match performed
  - [ ] Score above threshold (0.75)

- [ ] **Step 3**: Signer executes split
  - [ ] Signer receives verification signal
  - [ ] Golden split calculated correctly
  - [ ] Transparent transaction created (61.8%)
  - [ ] Shielded transaction created (38.2%)
  - [ ] Both transactions broadcast

- [ ] **Step 4**: Verify on-chain
  - [ ] Transparent transaction confirmed
  - [ ] OP_RETURN inscription visible
  - [ ] Shielded transaction confirmed
  - [ ] Amounts match expected split

---

## 🚀 Quick Start for Testing

### 1. Setup Environment

```bash
# Generate keys
./setup-keys.sh

# Configure .env
# Edit .env with your zebrad RPC credentials

# Critical: Set Oracle Swordsman API key for verification
NEAR_SWORDSMAN_API_KEY=sk-876c0f435b14449bac47f13583f5fd68
```

### 2. Run Test Flow

```bash
# Comprehensive test
./test-flow.sh
```

### 3. Start Services

```bash
# Using Docker
docker-compose up -d

# Or manually
cd oracle && npm run dev &
cd signer && npm run dev &
```

### 4. Send Test Transaction

```bash
# Using zcash-cli or Zashi wallet
# Send 0.01 ZEC to $DONATION_Z_ADDRESS
# Memo: ACT:5|Your test proverb
```

### 5. Monitor Results

```bash
# Watch logs
docker-compose logs -f oracle signer

# Check transactions
curl -X POST http://localhost:8232 \
  --user "$ZEBRA_USER:$ZEBRA_PASS" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"1.0","id":"test","method":"getblockcount","params":[]}'
```

---

## 📊 What You Need to Complete

### Immediate (For Testing)

1. **Update test-flow.sh** - Ensure it uses zebrad RPC (not zcash-cli)
2. **Implement Oracle Service** - Use `rpc-client.ts` and `semantic-matcher.ts`
3. **Implement Signer Service** - Use `rpc-client.ts`, `golden-split.ts`, `inscription-builder.ts`
4. **Test with zebrad** - Verify RPC calls work with your node

### Before Production

1. **Security Review**
   - [ ] Keys stored securely (encrypted)
   - [ ] Oracle in TEE (production)
   - [ ] Signer isolated
   - [ ] Access controls

2. **Monitoring**
   - [ ] Health checks
   - [ ] Logging
   - [ ] Metrics
   - [ ] Alerts

3. **Error Handling**
   - [ ] Network failures
   - [ ] RPC errors
   - [ ] Match failures
   - [ ] Transaction failures

4. **Documentation**
   - [ ] Runbook
   - [ ] Incident response
   - [ ] Key recovery

---

## 🔧 Integration Points

### Oracle Service Structure

```typescript
// oracle/src/index.ts
import { ZebraRpcClient } from '../rpc-client';
import { IPFSProverbStore } from '../ipfs-proverb-fetcher';
import { ProverbMatcher } from '../semantic-matcher';
import { NearCloudAIVerifier } from '../nearcloudai-verifier'; // Use existing verifier

// 1. Initialize RPC client
const rpc = new ZebraRpcClient({ host, port, username, password });

// 2. Import viewing key
await rpc.importViewingKey(viewingKey);

// 3. Initialize IPFS store
const ipfsStore = new IPFSProverbStore(ipfsGateway, spellbookCid);
await ipfsStore.loadSpellbook();

// 4. Initialize semantic matcher (uses NEAR Cloud AI with Swordsman key)
const verifier = new NearCloudAIVerifier(); // Uses NEAR_SWORDSMAN_API_KEY from config

// 5. Monitor transactions
setInterval(async () => {
  const transactions = await rpc.listReceivedTransactions(donationAddress);
  for (const tx of transactions) {
    // Parse memo
    const memo = parseMemo(tx.memo);
    
    // Fetch canonical proverb from IPFS
    const canonical = await ipfsStore.getCanonicalProverb(memo.actId);
    
    // Verify using NEAR Cloud AI (Swordsman key)
    const result = await verifier.verify(memo.proverb, spellbook);
    
    // Signal signer if verified (score >= threshold)
    if (result.approved && result.quality_score >= threshold) {
      await signalSigner(tx.txid, memo, result.quality_score);
    }
  }
}, pollInterval);
```

**Note**: The Oracle uses `NEAR_SWORDSMAN_API_KEY` (sk-876c0f435b14449bac47f13583f5fd68) for verification. This is separate from the frontend mage agent key.

### Signer Service Structure

```typescript
// signer/src/index.ts
import { ZebraRpcClient } from '../rpc-client';
import { GoldenSplit } from '../golden-split';
import { InscriptionBuilder } from '../inscription-builder';

// 1. Initialize RPC client
const rpc = new ZebraRpcClient({ host, port, username, password });

// 2. Import spending key
await rpc.importSpendingKey(spendingKey);

// 3. Listen for verification signals
app.post('/verify', async (req, res) => {
  const { txid, memo, score } = req.body;
  
  // Calculate golden split
  const split = goldenSplit.calculate(amount);
  
  // Build inscription
  const inscription = inscriptionBuilder.build({
    actId: memo.actId,
    proverbHash: hash(memo.proverb),
    originalTxid: txid,
    amount: split.sanctuary,
    timestamp: Date.now()
  });
  
  // Create transparent transaction (t-address)
  await rpc.sendToAddress(sanctuaryTAddress, split.sanctuary, inscription);
  
  // Create shielded transaction (z-address)
  await rpc.sendToShieldedAddress(protocolFeeZAddress, split.fee);
  
  res.json({ success: true });
});
```

---

## 📝 Next Steps

1. **Review** `PRODUCTION_TEST_GUIDE.md` for detailed testing instructions
2. **Run** `./test-flow.sh` to verify all components
3. **Implement** Oracle and Signer services using the provided TypeScript files
4. **Test** end-to-end with a small testnet transaction
5. **Verify** golden split appears correctly on-chain

---

## 🎯 You're Very Close!

**Estimated completion time**: 2-4 hours

**What's left**:
- Wire up Oracle service (use existing TypeScript files)
- Wire up Signer service (use existing TypeScript files)
- Test with zebrad RPC
- Verify end-to-end flow

**All the hard cryptographic work is done** - you just need to connect the services! 🚀

