# Implementation Plan: Zcash Spellbook Economics Layer
## Building the Dual Agent Economy with Zero-Knowledge Infrastructure

**Status:** Planning Phase  
**Target:** Full production implementation of spellbook economics  
**Foundation:** Current UI improvements (inversion pattern) + Zcash integration

---

## 📋 Executive Summary

This plan outlines the complete implementation of the spellbook economics layer as described in `why-zcash-spellbook-economics.md`. The system enables:

- **Mage Learning Ceremony (0.01 ZEC)**: Public knowledge commitments, private fee collection
- **Swordsman Protection Ceremony (1 ZEC)**: Public stake proof, private protocol storage
- **Slash Mechanism**: 44% penalty for failed comprehension, 50/50 distribution
- **Treasury Management**: Shielded treasury with transparent commitments
- **VRC Callbacks**: Bilateral trust through proverb exchange
- **Guardian Verification**: Hybrid algorithmic + human comprehension testing

---

## 🎯 Phase 1: Oracle Infrastructure (Zypher)

### 1.1 Core Oracle Service

**Purpose:** Cryptographic router managing dual ledger operations

**Components:**

#### A. Transaction Monitor Service
```typescript
// src/services/oracle/transaction-monitor.ts
- Monitor Zcash blockchain for incoming transactions
- Parse rpp-v1 memos (mage learning) and protection memos
- Distinguish between 0.01 ZEC (learning) and 1 ZEC (protection)
- Route to appropriate handlers
- Maintain transaction state database
```

**Key Functions:**
- `monitorZcashBlockchain()` - Poll Zcash node for new transactions
- `parseTransactionMemo()` - Extract protocol, taleId, proverb
- `classifyTransaction()` - Determine if learning (0.01) or protection (1.0)
- `routeToHandler()` - Send to learning handler or protection handler

#### B. Dual Ledger Router
```typescript
// src/services/oracle/ledger-router.ts
- Transparent ledger: Post public commitments (proverb hashes)
- Shielded ledger: Route private payments to treasury
- Bridge operations: Move between ledgers with ZK proofs
- Maintain commitment registry
```

**Key Functions:**
- `postTransparentCommitment()` - Hash proverb, post to transparent address
- `routeShieldedPayment()` - Send 0.01 ZEC to shielded treasury
- `recordPublicStake()` - Record 1 ZEC stake on transparent ledger
- `storePrivateProtocol()` - Encrypt and store protection protocols in shielded storage

#### C. Treasury Manager
```typescript
// src/services/oracle/treasury-manager.ts
- Track shielded treasury balance
- Manage slash distributions (50/50 split)
- Calculate successful guardian rewards
- Maintain treasury accounting
```

**Key Functions:**
- `trackTreasuryBalance()` - Monitor shielded treasury address
- `distributeSlash()` - Split 0.44 ZEC: 0.22 to treasury, 0.22 to successful guardians
- `calculateGuardianRewards()` - Proportional distribution to successful guardians
- `returnStake()` - Return 1 ZEC to successful guardian or 0.56 ZEC to failed guardian

### 1.2 Database Schema

```sql
-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  txid VARCHAR(64) UNIQUE NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'learning' or 'protection'
  tale_id VARCHAR(100) NOT NULL,
  proverb_hash VARCHAR(64) NOT NULL, -- SHA256 of proverb
  proverb_encrypted TEXT, -- Encrypted for protection transactions
  sender_address VARCHAR(255), -- z-address (for reference only)
  receiver_address VARCHAR(255) NOT NULL,
  block_height INTEGER,
  timestamp TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'confirmed', 'processed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guardians table
CREATE TABLE guardians (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  tale_id VARCHAR(100) NOT NULL,
  stake_amount DECIMAL(18, 8) NOT NULL, -- Should be 1.0 ZEC
  status VARCHAR(20) NOT NULL, -- 'staked', 'testing', 'passed', 'failed', 'returned'
  reconstruction_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  comprehension_score DECIMAL(5, 2), -- 0-100
  credential_issued BOOLEAN DEFAULT FALSE,
  credential_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning transactions (Mages)
CREATE TABLE learning_transactions (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  tale_id VARCHAR(100) NOT NULL,
  proverb TEXT NOT NULL, -- Public commitment
  proverb_hash VARCHAR(64) NOT NULL,
  fee_amount DECIMAL(18, 8) NOT NULL, -- Should be 0.01 ZEC
  treasury_routed BOOLEAN DEFAULT FALSE,
  commitment_posted BOOLEAN DEFAULT FALSE,
  commitment_txid VARCHAR(64), -- Transparent ledger TXID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Slash events
CREATE TABLE slash_events (
  id UUID PRIMARY KEY,
  guardian_id UUID REFERENCES guardians(id),
  slash_amount DECIMAL(18, 8) NOT NULL, -- 0.44 ZEC
  treasury_portion DECIMAL(18, 8) NOT NULL, -- 0.22 ZEC
  guardian_portion DECIMAL(18, 8) NOT NULL, -- 0.22 ZEC
  distribution_txid VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Successful guardian rewards
CREATE TABLE guardian_rewards (
  id UUID PRIMARY KEY,
  guardian_id UUID REFERENCES guardians(id),
  base_return DECIMAL(18, 8) NOT NULL, -- 1.0 ZEC
  slash_bonus DECIMAL(18, 8) NOT NULL, -- Share of failed guardian slashes
  total_return DECIMAL(18, 8) NOT NULL,
  return_txid VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Treasury accounting
CREATE TABLE treasury_accounting (
  id UUID PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL, -- 'inflow', 'outflow', 'slash_distribution'
  amount DECIMAL(18, 8) NOT NULL,
  balance_after DECIMAL(18, 8) NOT NULL,
  reference_txid VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 API Endpoints

```typescript
// src/app/api/oracle/transactions/route.ts
POST /api/oracle/transactions
- Receive transaction notifications from Zcash node
- Parse and classify transactions
- Store in database
- Trigger appropriate handlers

GET /api/oracle/transactions/:txid
- Get transaction status and details

// src/app/api/oracle/guardians/route.ts
GET /api/oracle/guardians
- List all guardians with status

GET /api/oracle/guardians/:id
- Get guardian details and status

POST /api/oracle/guardians/:id/reconstruct
- Submit reconstruction attempt
- Trigger comprehension verification

// src/app/api/oracle/treasury/route.ts
GET /api/oracle/treasury/balance
- Get current treasury balance (aggregated, not exact for privacy)

GET /api/oracle/treasury/accounting
- Get treasury accounting history

// src/app/api/oracle/commitments/route.ts
GET /api/oracle/commitments/:tale_id
- Get all public commitments (proverb hashes) for a tale
- Used for discovery and verification
```

---

## 🎯 Phase 2: Zcash Integration

### 2.1 Zcash Node Connection

**Options:**
1. **Lightwalletd** - Light client connection (recommended for production)
2. **Full Node** - Direct Zcash node (more control, more resources)
3. **Third-party API** - ChainRift, BlockCypher (less privacy, easier setup)

**Implementation:**
```typescript
// src/services/zcash/zcash-client.ts
import { ZcashRPC } from 'zcash-rpc-client';

class ZcashClient {
  private rpc: ZcashRPC;
  
  async initialize() {
    // Connect to Zcash node or lightwalletd
    this.rpc = new ZcashRPC({
      host: process.env.ZCASH_RPC_HOST,
      port: process.env.ZCASH_RPC_PORT,
      user: process.env.ZCASH_RPC_USER,
      password: process.env.ZCASH_RPC_PASSWORD,
    });
  }
  
  async monitorTransactions(address: string) {
    // Monitor for incoming transactions
  }
  
  async parseMemo(txid: string) {
    // Extract and decode memo field
  }
  
  async sendShieldedTransaction(to: string, amount: number, memo: string) {
    // Send z→z transaction
  }
  
  async getShieldedBalance(address: string) {
    // Get balance of shielded address
  }
}
```

### 2.2 Transaction Parsing

```typescript
// src/services/zcash/transaction-parser.ts

interface ParsedTransaction {
  txid: string;
  amount: number;
  type: 'learning' | 'protection';
  protocol: string;
  taleId: string;
  timestamp: number;
  proverb: string;
  senderAddress: string;
  receiverAddress: string;
}

function parseTransaction(tx: ZcashTransaction): ParsedTransaction {
  // 1. Extract memo field
  // 2. Decode base64 memo
  // 3. Parse rpp-v1 format
  // 4. Classify by amount (0.01 = learning, 1.0 = protection)
  // 5. Return structured data
}
```

### 2.3 Dual Ledger Operations

#### Transparent Ledger (Public Commitments)
```typescript
// src/services/zcash/transparent-ledger.ts

async function postPublicCommitment(proverb: string, taleId: string) {
  // 1. Hash proverb: SHA256(proverb)
  // 2. Create transparent transaction with hash in memo
  // 3. Send to transparent address (public discovery)
  // 4. Return transaction ID
}

async function recordPublicStake(amount: number, taleId: string) {
  // 1. Create transparent transaction showing 1 ZEC stake
  // 2. Include tale_id in memo
  // 3. Send to public treasury address
  // 4. Return transaction ID for verification
}
```

#### Shielded Ledger (Private Operations)
```typescript
// src/services/zcash/shielded-ledger.ts

async function routeToShieldedTreasury(amount: number, memo: string) {
  // 1. Receive shielded transaction
  // 2. Forward to shielded treasury address
  // 3. Maintain privacy (amounts hidden)
  // 4. Log for accounting (aggregated only)
}

async function storePrivateProtocol(protocol: string, guardianId: string) {
  // 1. Encrypt protection protocol
  // 2. Store in shielded storage (IPFS + encryption or Zcash memo)
  // 3. Link to guardian ID
  // 4. Only accessible with decryption key
}
```

---

## 🎯 Phase 3: Guardian Comprehension System

### 3.1 Hybrid Verification Architecture

```typescript
// src/services/verification/comprehension-verifier.ts

interface ComprehensionResult {
  passed: boolean;
  score: number; // 0-100
  feedback: string;
  requiresHumanReview: boolean;
}

class ComprehensionVerifier {
  // Algorithmic component (Soulbae)
  async algorithmicCheck(reconstruction: string, originalProverb: string, taleContent: string): Promise<ComprehensionResult> {
    // 1. Semantic similarity scoring (using Soulbae RAG)
    // 2. Compression quality evaluation
    // 3. Context coherence check
    // 4. Return pass/fail with score
  }
  
  // Human component (First Person or credentialed guardians)
  async humanReview(guardianId: string, reconstruction: string): Promise<ComprehensionResult> {
    // 1. Queue for human review
    // 2. First Person or peer guardian reviews
    // 3. Final approval/rejection
    // 4. Issue credential if passed
  }
  
  // Hybrid process
  async verifyComprehension(guardianId: string, reconstruction: string): Promise<ComprehensionResult> {
    const guardian = await getGuardian(guardianId);
    const tale = await getTale(guardian.taleId);
    
    // Step 1: Algorithmic check
    const algoResult = await this.algorithmicCheck(
      reconstruction,
      tale.proverb,
      tale.content
    );
    
    if (!algoResult.passed) {
      // Immediate fail, trigger slash
      return { ...algoResult, requiresHumanReview: false };
    }
    
    // Step 2: Human review for final approval
    return await this.humanReview(guardianId, reconstruction);
  }
}
```

### 3.2 Soulbae Integration for Algorithmic Verification

```typescript
// src/services/verification/soulbae-verifier.ts

async function verifyWithSoulbae(reconstruction: string, originalProverb: string, taleId: string) {
  // Call Soulbae API with:
  // - Reconstruction text
  // - Original proverb
  // - Tale context
  // - Request semantic similarity score
  
  const response = await fetch('https://soulbae-api.near.shade/verify', {
    method: 'POST',
    body: JSON.stringify({
      reconstruction,
      originalProverb,
      taleId,
      verificationType: 'comprehension'
    })
  });
  
  return response.json(); // { score: 0-100, passed: boolean, feedback: string }
}
```

### 3.3 Slash Mechanism Implementation

```typescript
// src/services/oracle/slash-handler.ts

async function handleFailedComprehension(guardianId: string) {
  const guardian = await getGuardian(guardianId);
  
  // Calculate slash: 44% of 1 ZEC = 0.44 ZEC
  const slashAmount = 0.44;
  const returnAmount = 0.56; // 56% returned
  
  // Split slash: 50/50
  const treasuryPortion = 0.22; // 50% of slash
  const guardianPortion = 0.22; // 50% of slash (to be distributed)
  
  // 1. Update guardian status to 'failed'
  await updateGuardianStatus(guardianId, 'failed');
  
  // 2. Record slash event
  await recordSlashEvent(guardianId, slashAmount, treasuryPortion, guardianPortion);
  
  // 3. Route 0.22 ZEC to shielded treasury
  await routeToShieldedTreasury(treasuryPortion, `slash-treasury-${guardianId}`);
  
  // 4. Add 0.22 ZEC to guardian reward pool
  await addToGuardianRewardPool(guardianPortion);
  
  // 5. Return 0.56 ZEC to failed guardian
  await returnStake(guardian.senderAddress, returnAmount, `failed-return-${guardianId}`);
  
  // 6. Distribute guardian portion to successful guardians
  await distributeGuardianRewards();
}
```

### 3.4 Successful Guardian Rewards

```typescript
// src/services/oracle/reward-distributor.ts

async function handleSuccessfulComprehension(guardianId: string) {
  const guardian = await getGuardian(guardianId);
  
  // Get all successful guardians for this tale
  const successfulGuardians = await getSuccessfulGuardians(guardian.taleId);
  const totalSuccessful = successfulGuardians.length;
  
  // Get total guardian reward pool (from failed guardian slashes)
  const rewardPool = await getGuardianRewardPool(guardian.taleId);
  
  // Calculate bonus: proportional share of reward pool
  const bonusAmount = rewardPool / totalSuccessful;
  
  // Total return: 1 ZEC base + bonus
  const totalReturn = 1.0 + bonusAmount;
  
  // 1. Update guardian status to 'passed'
  await updateGuardianStatus(guardianId, 'passed');
  
  // 2. Issue credential
  const credential = await issueCredential(guardianId, guardian.taleId);
  
  // 3. Record reward
  await recordGuardianReward(guardianId, 1.0, bonusAmount, totalReturn);
  
  // 4. Return stake + bonus
  await returnStake(guardian.senderAddress, totalReturn, `success-return-${guardianId}`);
  
  // 5. Update credential in guardian record
  await updateGuardianCredential(guardianId, credential.id);
}
```

---

## 🎯 Phase 4: VRC Callback System

### 4.1 Callback Generation

```typescript
// src/services/vrc/callback-generator.ts

async function generateVRCallback(donationTxid: string, receivedProverb: string) {
  // 1. Get donation transaction details
  const donation = await getTransaction(donationTxid);
  
  // 2. Generate response proverb (using Soulbae or First Person)
  const responseProverb = await generateResponseProverb(
    receivedProverb,
    donation.taleId
  );
  
  // 3. Format VRC callback memo
  const callbackMemo = formatVRCCallback({
    protocol: 'vrc-callback-v1',
    proverb: responseProverb,
    taleId: donation.taleId,
    nextTaleUrl: getNextTaleUrl(donation.taleId)
  });
  
  // 4. Send callback transaction
  const callbackTx = await sendShieldedTransaction(
    donation.senderAddress,
    0.0001, // Symbolic amount
    callbackMemo
  );
  
  // 5. Record VRC relationship
  await recordVRC(donationTxid, callbackTx.txid, receivedProverb, responseProverb);
  
  return callbackTx;
}
```

### 4.2 VRC Relationship Database

```sql
CREATE TABLE vrc_relationships (
  id UUID PRIMARY KEY,
  donation_txid VARCHAR(64) NOT NULL,
  callback_txid VARCHAR(64) NOT NULL,
  received_proverb TEXT NOT NULL,
  response_proverb TEXT NOT NULL,
  tale_id VARCHAR(100) NOT NULL,
  relationship_strength DECIMAL(5, 2), -- Based on semantic similarity
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Phase 5: Frontend Integration

### 5.1 Real-time Transaction Status

```typescript
// src/components/TransactionStatus.tsx

interface TransactionStatus {
  txid: string;
  status: 'pending' | 'confirmed' | 'processed' | 'failed';
  type: 'learning' | 'protection';
  amount: number;
  taleId: string;
}

// Poll API for transaction status
// Display in SwordsmanPanel
// Show commitment hash for learning transactions
// Show stake proof for protection transactions
```

### 5.2 Guardian Dashboard

```typescript
// src/app/guardian/page.tsx

- List all guardian stakes
- Show status (staked, testing, passed, failed)
- Submit reconstruction attempts
- View comprehension feedback
- Track credential issuance
- Monitor reward calculations
```

### 5.3 Treasury Dashboard (Aggregated)

```typescript
// src/app/treasury/page.tsx

- Show aggregated treasury balance (privacy-preserving)
- Display accounting history (inflows, outflows)
- Show slash distributions
- Guardian reward pool status
- Network statistics
```

### 5.4 Public Commitment Explorer

```typescript
// src/app/commitments/page.tsx

- Browse all public commitments (proverb hashes)
- Filter by tale
- Verify commitments on transparent ledger
- Discover new proverbs
- Link to VRC relationships
```

---

## 🎯 Phase 6: Credential System

### 6.1 Verifiable Credential Issuance

```typescript
// src/services/credentials/credential-issuer.ts

interface SpellbookCredential {
  id: string;
  type: 'first-spellbook';
  guardianId: string;
  taleId: string;
  issuedAt: Date;
  issuer: string; // Zypher oracle
  proof: string; // Cryptographic proof
}

async function issueCredential(guardianId: string, taleId: string): Promise<SpellbookCredential> {
  // 1. Create credential structure
  // 2. Sign with oracle private key
  // 3. Store on-chain or IPFS
  // 4. Return credential with proof
  // 5. Make soulbound (non-transferable)
}
```

### 6.2 Credential Verification

```typescript
// src/services/credentials/credential-verifier.ts

async function verifyCredential(credentialId: string): Promise<boolean> {
  // 1. Fetch credential
  // 2. Verify signature
  // 3. Check revocation status
  // 4. Validate issuer
  // 5. Return verification result
}
```

---

## 🎯 Phase 7: Security & Privacy

### 7.1 Key Management

```typescript
// src/services/security/key-manager.ts

- Oracle private keys (HSM or secure key storage)
- Treasury address management
- Encryption keys for private protocols
- Credential signing keys
```

### 7.2 Privacy Preservation

```typescript
// src/services/privacy/privacy-preserver.ts

- Never log exact amounts in public logs
- Aggregate treasury statistics only
- Encrypt private protocols
- Use shielded transactions for all private operations
- Minimize data collection
```

### 7.3 Audit Trail

```typescript
// src/services/audit/audit-logger.ts

- Log all oracle operations (without sensitive data)
- Maintain cryptographic proofs
- Enable public verification of transparent operations
- Preserve privacy of shielded operations
```

---

## 🎯 Phase 8: Testing & Deployment

### 8.1 Testnet Deployment

1. Deploy to Zcash testnet
2. Test with small amounts
3. Verify slash mechanism
4. Test VRC callbacks
5. Validate credential issuance

### 8.2 Mainnet Deployment

1. Deploy oracle infrastructure
2. Initialize treasury addresses
3. Set up monitoring
4. Gradual rollout
5. Community testing

---

## 📊 Implementation Timeline

### Phase 1-2: Foundation (Weeks 1-4)
- Oracle infrastructure
- Zcash integration
- Database setup
- Basic transaction monitoring

### Phase 3-4: Core Features (Weeks 5-8)
- Guardian comprehension system
- Slash mechanism
- VRC callbacks
- Reward distribution

### Phase 5-6: Frontend & Credentials (Weeks 9-12)
- Frontend integration
- Credential system
- Dashboards
- Public commitment explorer

### Phase 7-8: Security & Launch (Weeks 13-16)
- Security hardening
- Testnet deployment
- Mainnet preparation
- Community launch

---

## 🔧 Technical Stack

**Backend:**
- Next.js API routes
- PostgreSQL database
- Zcash RPC client
- Soulbae API integration
- IPFS for credential storage

**Frontend:**
- React/Next.js (existing)
- Real-time status updates
- Transaction monitoring
- Guardian dashboard

**Infrastructure:**
- Oracle service (Node.js)
- Database (PostgreSQL)
- Zcash node/lightwalletd
- Secure key storage (HSM or encrypted)

---

## 🎯 Success Metrics

1. **Transaction Processing**: < 5 minute confirmation time
2. **Slash Accuracy**: 100% correct slash calculations
3. **Privacy**: Zero information leakage from shielded operations
4. **Verification**: < 24 hour human review turnaround
5. **Treasury**: Accurate accounting with privacy preservation

---

## 🚀 Next Steps

1. **Review and approve plan**
2. **Set up development environment**
3. **Initialize database schema**
4. **Connect to Zcash testnet**
5. **Build oracle service foundation**
6. **Implement transaction monitoring**
7. **Test with mock transactions**
8. **Iterate and refine**

---

**This plan transforms the current UI (which correctly displays the inversion) into a fully functional dual agent economy powered by zero-knowledge cryptography.**

