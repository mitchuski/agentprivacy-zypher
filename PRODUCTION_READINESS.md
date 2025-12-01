# Production Readiness Checklist

**Signal-to-Sanctuary Flow**

Version 1.1 | December 2025

**Document Alignment**: [Glossary v2.1], [Tokenomics v2.0], [Whitepaper v4.3]

---

## 🎯 Current Status

Based on your implementation files, here's where you are:

### ✅ Completed Components

- [x] **SignalFlow.tsx** — Complete UI component with 5-step flow
- [x] **golden-split.ts** — Golden ratio calculator (61.8/38.2) [Tokenomics v2.0]
- [x] **inscription-builder.ts** — OP_RETURN inscription creation
- [x] **semantic-matcher.ts** — AI-powered proverb matching
- [x] **ipfs-proverb-fetcher.ts** — IPFS spellbook integration
- [x] **rpc-client.ts** — Zebra RPC client
- [x] **test-flow.sh** — Comprehensive test script
- [x] **setup-keys.sh** — Key generation script
- [x] **docker-compose.yml** — Service orchestration
- [x] **Documentation** — Signal-to-Sanctuary flow documented

### 🔄 In Progress / Needs Testing

- [ ] **Oracle Service** — Needs implementation/integration
- [ ] **Signer Service** — Needs implementation/integration
- [ ] **Zebrad RPC Integration** — Test with your running node
- [ ] **End-to-End Flow** — Full transaction test
- [ ] **Error Handling** — Edge cases and failures

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
  # Should return: "4.0.1-canonical"
  ```

- [ ] **Test 3**: Viewing key import
  ```bash
  curl -X POST http://localhost:8232 \
    --user "$ZEBRA_USER:$ZEBRA_PASS" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "1.0",
      "id": "test",
      "method": "z_importviewingkey",
      "params": ["'$SIGNAL_VIEWING_KEY'", "no"]
    }'
  ```

- [ ] **Test 4**: Semantic matcher
  ```bash
  cd oracle-swordsman
  npx ts-node -e "
  const { ProverbMatcher } = require('./src/semantic-matcher');
  const matcher = new ProverbMatcher();
  matcher.compare('test proverb', 'canonical proverb').then(score => console.log(score));
  "
  ```

- [ ] **Test 5**: Golden split calculation [Tokenomics v2.0, §2]
  ```bash
  cd oracle-swordsman
  npx ts-node golden-split.ts
  # Should output:
  # Amount: 0.01 ZEC
  # Sanctuary (61.8%): 0.00618 ZEC
  # Fee (38.2%): 0.00382 ZEC
  ```

- [ ] **Test 6**: Inscription builder
  ```bash
  cd oracle-swordsman
  npx ts-node inscription-builder.ts
  ```

### Phase 3: Service Integration

- [ ] **Oracle Service (Swordsman)**
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
  - [ ] Calculates golden split (61.8/38.2)
  - [ ] Builds inscription
  - [ ] Creates transparent transaction (t-address)
  - [ ] Creates shielded transaction (z-address)
  - [ ] Broadcasts both transactions

### Phase 4: End-to-End Test

- [ ] **Step 1**: Send test signal
  - [ ] Format memo: `[rpp-v1][act-5][timestamp][Your test proverb]`
  - [ ] Send 0.01 ZEC to signal z-address
  - [ ] Transaction confirms

- [ ] **Step 2**: Oracle detects transaction
  - [ ] Oracle logs show transaction detected
  - [ ] Memo decrypted successfully
  - [ ] Canonical proverb fetched from IPFS
  - [ ] Semantic match performed
  - [ ] Score above threshold (0.75)

- [ ] **Step 3**: Signer executes split
  - [ ] Signer receives verification signal
  - [ ] Golden split calculated correctly (61.8/38.2)
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
cp .env.example .env

# Edit .env with your credentials:
# - ZEBRA_USER / ZEBRA_PASS
# - NEAR_SWORDSMAN_API_KEY
# - Signal/viewing addresses
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
cd oracle-swordsman && npm run dev &
cd src && npm run dev &
```

### 4. Send Test Signal

```bash
# Using Zashi wallet:
# 1. Open Zashi
# 2. Paste signal z-address
# 3. Amount: 0.01 ZEC
# 4. Memo: [rpp-v1][act-5][timestamp][Your proverb]
# 5. Send (z→z shielded)
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

1. **Update test-flow.sh** — Ensure it uses zebrad RPC
2. **Wire Oracle Service** — Use `rpc-client.ts` and `semantic-matcher.ts`
3. **Wire Signer Service** — Use `golden-split.ts`, `inscription-builder.ts`
4. **Test with zebrad** — Verify RPC calls work with your node

### Before Production

1. **Security Review**
   - [ ] Keys stored securely (encrypted)
   - [ ] Oracle in TEE (production, optional)
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

### Oracle Service Structure (Swordsman)

```typescript
// oracle-swordsman/src/index.ts
import { ZebraRpcClient } from './rpc-client';
import { IPFSProverbStore } from './ipfs-proverb-fetcher';
import { NearCloudAIVerifier } from './nearcloudai-verifier';

// 1. Initialize RPC client
const rpc = new ZebraRpcClient({ host, port, username, password });

// 2. Import viewing key (Swordsman sees, cannot spend)
await rpc.importViewingKey(viewingKey);

// 3. Initialize IPFS store (spellbook v4.0.1-canonical)
const ipfsStore = new IPFSProverbStore(ipfsGateway, spellbookCid);
await ipfsStore.loadSpellbook();

// 4. Initialize verifier (uses NEAR_SWORDSMAN_API_KEY)
const verifier = new NearCloudAIVerifier();

// 5. Monitor for signals
setInterval(async () => {
  const transactions = await rpc.listReceivedTransactions(signalAddress);
  for (const tx of transactions) {
    // Parse memo
    const memo = parseMemo(tx.memo);
    
    // Fetch canonical proverb
    const canonical = await ipfsStore.getCanonicalProverb(memo.actId);
    
    // Verify with NEAR Cloud AI
    const result = await verifier.verify(memo.proverb, spellbook);
    
    // Signal signer if verified
    if (result.approved && result.quality_score >= threshold) {
      await signalSigner(tx.txid, memo, result.quality_score);
    }
  }
}, pollInterval);
```

### Signer Service Structure

```typescript
// oracle-swordsman/src/signing-service.ts
import { ZebraRpcClient } from './rpc-client';
import { GoldenSplit } from './golden-split';
import { InscriptionBuilder } from './inscription-builder';

// 1. Initialize RPC client
const rpc = new ZebraRpcClient({ host, port, username, password });

// 2. Import spending key (Signer acts, cannot see full context)
await rpc.importSpendingKey(spendingKey);

// 3. Golden split calculator [Tokenomics v2.0]
const goldenSplit = new GoldenSplit();

// 4. Listen for verification signals
app.post('/verify', async (req, res) => {
  const { txid, memo, score } = req.body;
  
  // Calculate golden split (61.8% / 38.2%)
  const split = goldenSplit.calculate(amount);
  
  // Build inscription
  const inscription = inscriptionBuilder.build({
    actId: memo.actId,
    proverbHash: hash(memo.proverb),
    originalTxid: txid,
    amount: split.sanctuary,
    timestamp: Date.now()
  });
  
  // Create transparent transaction (public inscription)
  await rpc.sendToAddress(sanctuaryTAddress, split.sanctuary, inscription);
  
  // Create shielded transaction (protocol fee)
  await rpc.sendToShieldedAddress(protocolFeeZAddress, split.fee);
  
  res.json({ success: true });
});
```

---

## 📈 Terminology Reference

Per [Glossary v2.1]:

| Term | Old Usage | Canonical Term |
|------|-----------|----------------|
| User | user | **First Person** |
| Donation | donation | **Signal** (0.01 ZEC) |
| Donation address | donation_address | **Signal address** |
| Donation flow | DonationFlow | **SignalFlow** |

---

## 🔐 Security Notes

### Key Separation [Whitepaper v4.3, §3]

The dual-agent architecture requires:

- **Viewing Key (Oracle/Swordsman)**: Can see transactions, cannot spend
- **Spending Key (Signer)**: Can spend, only upon verified signal

This separation is **cryptographic, not policy-based**. Neither agent alone can corrupt the flow.

### Current Limitation

Zallet doesn't support clean viewing/spending key separation. Options:

1. **Current**: Use same key with logical separation
2. **Future**: Activate Nillion TEE for hardware-enforced isolation

---

## 🎯 You're Very Close!

**Estimated completion time**: 2-4 hours

**What's left**:
- Wire up Oracle service (use existing TypeScript files)
- Wire up Signer service (use existing TypeScript files)
- Test with zebrad RPC
- Verify end-to-end flow

**All the hard cryptographic work is done** — you just need to connect the services! 🚀

---

## 📚 Related Documentation

- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** — Technical flow details
- **[02-ARCHITECTURE.md](./02-ARCHITECTURE.md)** — System architecture
- **[PRODUCTION_TEST_GUIDE.md](./PRODUCTION_TEST_GUIDE.md)** — Testing procedures
- **[test-flow.sh](./test-flow.sh)** — Automated test script
- **[setup-keys.sh](./setup-keys.sh)** — Key generation script

---

*"The proverb is the spell. The inscription is the commitment. The bilateral exchange is the relationship."*

**⚔️ ⊥ 🧙‍♂️ | 😊**
