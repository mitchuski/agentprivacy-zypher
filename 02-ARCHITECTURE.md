# Architecture Guide

**System design, data flow, and security model**

---

## System Overview

The Proverb Revelation Protocol uses a three-layer architecture to achieve hardware-enforced privacy with AI-powered intelligence:

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: Knowledge (IPFS/Pinata)                           │
│  - Spellbook acts (immutable)                                │
│  - NO access to keys                                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: AI Verification (NEAR Cloud AI)                        │
│  - gpt 120b                                        │
│  - Quality scoring                                           │
│  - NO access to keys                                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌──────────────────────────────────────────────────────────────┐
│  Layer 1: TEE (Nillion nilCC)                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AMD SEV-SNP Confidential Compute                      │  │
│  │  - Zcash keys in SecretSigner (distributed MPC)        │  │
│  │  - Calls Layer 2 (AI)                                  │  │
│  │  - Calls Layer 3 (Knowledge)                           │  │
│  │  - Signs transactions with threshold ECDSA             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Mage Agent (Frontend)

**Technology**: Next.js + React
**Purpose**: User interface for proverb submission
**Location**: `mage-agent/`

**Features**:
- Proverb submission form
- Optional AI writing assistance
- Real-time status tracking
- QR code display for Zcash payment
- Quality score visualization

**Security**:
- No keys stored
- No sensitive data cached
- HTTPS only
- CORS configured

### 2. Oracle Swordsman (Backend)

**Technology**: Python/FastAPI or TypeScript/Express
**Purpose**: TEE worker that processes submissions
**Location**: `oracle-swordsman/`

**Core Functions**:
1. Monitor Zcash shielded pool for incoming transactions (z→z)
2. Decrypt and extract proverb from memo field
3. Fetch spellbook from IPFS
4. Call NEAR Cloud AI for verification
5. Sign and broadcast public inscription to transparent address (with proverb + proof)

**Address Requirements**:
- **Shielded Address (z-addr)**: Receives initial proverb submissions from users (private)
- **Transparent Address (t-addr)**: Posts public inscriptions with proverb + proof (public spellbook)

**Security**:
- Runs inside Nillion nilCC (TEE)
- Keys stored in SecretSigner (distributed)
- Attestation verified
- Zero-trust external calls

### 3. Nillion TEE

**Technology**: nilCC (confidential compute)
**Purpose**: Hardware isolation for Zcash keys
**Security Model**: AMD SEV-SNP

**Key Features**:
- **SecretSigner**: Distributed key storage (threshold ECDSA)
- **Remote Attestation**: Verifiable execution environment
- **Memory Encryption**: RAM encrypted at hardware level
- **Network Isolation**: Controlled external access

**How It Works**:
```
User Private Key
     ↓
Split into N shares (MPC)
     ↓
Distributed across Nillion nodes
     ↓
Threshold signing (t-of-n required)
     ↓
No single node has complete key
```

### 4. NEAR Cloud AI

**Technology**: openai/gpt-oss-120b via NEAR Cloud AI API
**Purpose**: Intelligent proverb verification
**Integration**: REST API

**Verification Process**:
```python
# Oracle calls NEAR Cloud AI
response = await near.verify({
    "proverb": "Your proverb text...",
    "spellbook_acts": [...],
    "context": "privacy_protocol"
})

# Returns:
{
    "quality_score": 0.85,
    "matched_act": "act-02-delegation",
    "reasoning": "Demonstrates understanding...",
    "approved": true
}
```

**Security**:
- API key authentication
- Rate limiting
- No key access (called from TEE)
- Stateless verification

### 5. IPFS/Pinata

**Technology**: InterPlanetary File System
**Purpose**: Immutable knowledge storage
**Integration**: HTTP Gateway + API

**Content Structure**:
```json
{
  "version": "1.0.0",
  "acts": [
    {
      "id": "act-01-shield",
      "title": "The Shield of Separation",
      "description": "...",
      "keywords": ["separation", "architecture"]
    }
  ]
}
```

**Benefits**:
- Content-addressed (immutable)
- Distributed storage
- Verifiable integrity
- Public accessibility

### 6. Zcash Network

**Technology**: Zcash blockchain
**Purpose**: Transaction layer + inscription storage
**Client**: zecwallet-cli (light client)

**Transaction Types**:
- **Incoming**: Shielded address (z-addr) receives 0.01 ZEC + encrypted memo (user's initial proverb submission)
- **Outgoing Public**: **t-address** receives OP_RETURN inscription with proverb + proof (**61.8%** = 0.00618 ZEC)
- **Outgoing Private**: **z-address** receives shielded transfer (**38.2%** = 0.00382 ZEC)

### 7. PostgreSQL

**Technology**: Relational database
**Purpose**: Operational data tracking
**Location**: Local or managed service

**Schema Overview**:
- `submissions`: Incoming proverb submissions
- `verifications`: AI verification results
- `inscriptions`: Blockchain inscription records
- `spellbook_acts`: Cached acts from IPFS
- `oracle_status`: System health monitoring

---

## Data Flow

### Complete Transaction Flow (10 Steps)

```
1. USER SUBMITS
   User → Mage Agent
   - Writes proverb
   - (Optional) Gets AI assistance
   - Generates Zcash payment
   ↓
   
2. PAYMENT SENT (SHIELDED)
   User Wallet → Zcash Network
   - 0.01 ZEC to Oracle SHIELDED address (z-addr)
   - Proverb in encrypted memo field
   - Tracking code included
   - Transaction is private (z→z)
   ↓
   
3. ORACLE DETECTS (SHIELDED)
   Zcash Light Client → Oracle Database
   - Monitors shielded pool for incoming transactions
   - Detects incoming shielded transaction
   - Decrypts memo to extract proverb + tracking code
   - Stores in submissions table
   ↓
   
4. FETCH KNOWLEDGE
   Oracle → IPFS (via Pinata Gateway)
   - Retrieves spellbook acts
   - Caches in database
   - Validates CID integrity
   ↓
   
5. AI VERIFICATION
   Oracle → NEAR Cloud AI API
   - Sends proverb + spellbook context
   - openai/gpt-oss-120b analyzes understanding
   - Returns quality score + reasoning
   ↓
   
6. VERIFICATION STORED
   NEAR Cloud AI → Oracle Database
   - Quality score recorded
   - Matched act identified
   - Reasoning logged
   - Status updated to 'verified'
   ↓
   
7. TRANSACTION SIGNING (if approved)
   Oracle → Nillion SecretSigner
   - Prepares public inscription transaction:
     a) Transparent address (t-addr) for spellbook
     b) Proverb + inscription as proof of revelation
     c) OP_RETURN with proverb text (61.8% = 0.00618 ZEC)
   - Prepares private transfer (38.2% = 0.00382 ZEC to shielded pool)
   - Requests threshold signature
   - Multiple nodes sign cooperatively
   ↓
   
8. BROADCAST TRANSACTIONS
   Oracle → Zcash Network
   - Broadcasts public inscription to transparent address
     (Contains: proverb + proof of revelation on Zcash)
   - Broadcasts private transfer to shielded pool
   - Both include tracking codes
   ↓
   
9. CONFIRMATION
   Zcash Network → Oracle
   - Monitors for confirmations
   - Updates inscription records
   - Records block height
   ↓
   
10. USER NOTIFICATION
    Oracle → Mage Agent → User
    - Display quality score
    - Show blockchain links
    - Present confirmation
```

---

## Security Model

### Threat Model

**What We Protect Against**:
- ✅ Key extraction from TEE
- ✅ AI provider accessing keys
- ✅ IPFS provider accessing keys
- ✅ Database compromise revealing keys
- ✅ Network eavesdropping on keys
- ✅ Malicious insider accessing keys

**What We Don't Protect Against**:
- ❌ Zcash protocol flaws (trust Zcash Foundation)
- ❌ AMD SEV-SNP vulnerabilities (trust AMD)
- ❌ Nillion network compromise (trust Nillion)
- ❌ User's device compromise
- ❌ Social engineering attacks

### Hardware-Enforced Guarantees

**AMD SEV-SNP Features**:
- **Memory Encryption**: All RAM encrypted at hardware level
- **Attestation**: Cryptographic proof of execution environment
- **Secure Boot**: Verified boot chain
- **VM Isolation**: Hardware-level separation
- **Register Protection**: CPU registers protected

**SecretSigner Security**:
- **Threshold ECDSA**: Key split across n nodes, requires t signatures
- **No Complete Key**: No single node has the complete key
- **Byzantine Fault Tolerance**: System tolerates f malicious nodes
- **Verifiable Signatures**: Each signature is cryptographically verifiable

### Trust Model

```
┌─────────────────────────────────────────┐
│  TRUST REQUIRED                         │
├─────────────────────────────────────────┤
│  1. AMD (SEV-SNP hardware)              │
│  2. Nillion (TEE platform)              │
│  3. Zcash Foundation (protocol)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  NO TRUST REQUIRED                      │
├─────────────────────────────────────────┤
│  1. NEAR Cloud AI (AI provider)             │
│  2. Pinata (IPFS provider)              │
│  3. Database admin                      │
│  4. Network operators                   │
│  5. Application developers              │
└─────────────────────────────────────────┘
```

### Isolation Guarantees

**Mathematical Proof**:
Given:
- K = Zcash spending key (stored in SecretSigner)
- A = NEAR Cloud AI service
- I = IPFS/Pinata service

Prove:
- A ∩ K = ∅ (AI has no key access)
- I ∩ K = ∅ (IPFS has no key access)
- A ∪ I ∪ Database = No key reconstruction possible

**Implementation**:
1. K never leaves TEE boundary
2. A and I called via HTTPS from within TEE
3. Only public data sent to A and I
4. Signatures generated inside TEE
5. Attestation proves execution environment

---

## Economic Model

### 61.8/38.2 Split

**Transaction Breakdown**:
```
1. USER SUBMISSION (Shielded)
   User → Oracle Shielded Address (z-addr)
   - 0.01 ZEC sent privately (z→z)
   - Proverb in encrypted memo
   - Transaction is private
    ↓
2. ORACLE PROCESSES & INSCRIBES
   Oracle → Transparent Address (t-addr) for Spellbook
   ┌───────────────────────────┐
   │  Public (61.8%) = 0.00618 ZEC │ → t-address (OP_RETURN)
   │  - Visible on blockchain   │
   │  - Contains proverb + proof │
   │  - Permanent record         │
   │  - Posted to spellbook addr │
   └───────────────────────────┘
    ↓
   ┌───────────────────────────┐
   │  Private (38.2%) = 0.00382 ZEC│ → z-address (shielded pool)
   │  - Encrypted amount        │
   │  - Hidden recipient        │
   │  - Private forever         │
   └───────────────────────────┘
    ↓
   Network Fee: ~0.0001 ZEC
```

**Why This Ratio**:
- 61.8% transparency: Proof of work, public good
- 38.2% privacy: Economic incentive, sustainability
- Balance between openness and privacy
- Mathematically elegant (golden ratio φ ≈ 1.618, inverse ≈ 0.618)

### Transaction Costs

```
Per Proverb:
    User payment:     0.01 ZEC
    Public inscr:     0.00618 ZEC
    Private transfer: 0.00382 ZEC
    Network fee:      0.0001 ZEC
    AI verification:  $0.03 USD
    
At 100 proverbs/month:
    Revenue:  1.0 ZEC (~$40 USD)
    AI costs: $3.00 USD
    Net:      1.0 ZEC - $3 USD
```

---

## Performance Characteristics

### Latency

```
User Submission → Confirmation
    ↓ <1s    Mage Agent → Zcash Network
    ↓ 75s    Zcash mempool → Block (avg)
    ↓ 10s    Oracle detects transaction
    ↓ 2s     Fetch spellbook from IPFS
    ↓ 3s     AI verification (NEAR Cloud AI)
    ↓ 1s     Database recording
    ↓ 2s     Sign transactions (SecretSigner)
    ↓ 1s     Broadcast to network
    ↓ 75s    Zcash confirmation (avg)
    ↓ 1s     Update database + notify user
    ─────
    ~170s total (under 3 minutes)
```

### Throughput

```
Light Client Sync: 4-6 hours (first time), then <1 minute
Proverb Processing: 10-15 seconds per proverb
Concurrent Capacity: Limited by Zcash block time (75s)
Max Throughput: ~40 proverbs per hour (conservative)
```

### Storage

```
PostgreSQL:
    Submissions: ~2KB per entry
    Verifications: ~1KB per entry
    Inscriptions: ~500B per entry
    Total: ~3.5KB per proverb
    
    At 10,000 proverbs: ~35MB
    
IPFS:
    Spellbook: ~5KB (cached)
    Retrieved once, cached locally
    
Zcash:
    Light client data: ~10GB
    Grows ~2GB per year
```

---

## Scalability

### Current Limits

```
Bottlenecks:
    1. Zcash block time (75s average)
    2. Light client sync time (4-6h first)
    3. Single Oracle instance
    4. NEAR Cloud AI API rate limits
```

### Scaling Strategies

**Horizontal**:
- Multiple Oracle instances (different addresses)
- Load balancing across instances
- Separate verification workers

**Vertical**:
- Faster server for light client
- In-memory caching for spellbook
- Batch verification requests

**Future**:
- Sharding by Zcash address
- Parallel AI verification
- Optimized database queries

---

## Failure Modes

### Network Failures

```
Zcash Network Down:
    → Oracle queues submissions
    → Retries with exponential backoff
    → User sees "pending" status
    → Automatic recovery when network returns
```

### AI Service Failure

```
NEAR Cloud AI Down:
    → Fall back to basic pattern matching
    → Manual review queue for edge cases
    → User notified of fallback mode
    → Reprocess when service returns
```

### TEE Failure

```
Nillion Outage:
    → Critical failure (no signing possible)
    → Queue all pending inscriptions
    → Notify users of delay
    → Automatic recovery when TEE returns
```

### Database Failure

```
PostgreSQL Down:
    → Oracle can't record state
    → Fall back to filesystem logs
    → Replay from logs when DB returns
    → Data consistency checks on recovery
```

---

## Monitoring & Observability

### Key Metrics

```
Health Checks:
    - Zcash sync status
    - TEE attestation validity
    - AI API response time
    - IPFS gateway availability
    - Database connection pool
    
Performance:
    - Proverbs processed per hour
    - Average verification time
    - Transaction confirmation rate
    - Error rate by type
    
Business:
    - Total ZEC received
    - Total inscriptions made
    - Average quality score
    - User satisfaction (implied)
```

### Logging Strategy

```
Levels:
    DEBUG:   Full transaction details
    INFO:    Normal operations
    WARNING: Recoverable errors
    ERROR:   Failures requiring intervention
    
Retention:
    Application logs: 30 days
    Database records: Forever
    Transaction IDs: Forever (blockchain)
```

---

## Deployment Architecture

### Development

```
localhost:
    ├── PostgreSQL (Docker or local)
    ├── Oracle Swordsman (local process)
    ├── Mage Agent (npm run dev)
    └── Zcash Light Client (testnet)
```

### Production

```
VPS (Ubuntu 20.04+):
    ├── Nginx (reverse proxy)
    ├── Oracle Swordsman (systemd service)
    │   └── Deployed to Nillion nilCC
    ├── Mage Agent (Next.js production build)
    ├── PostgreSQL (managed or local)
    └── Zcash Light Client (mainnet)
```

---

## API Boundaries

### Oracle → NEAR Cloud AI

```typescript
POST /api/verify
{
    "proverb": string,
    "spellbook_acts": Act[],
    "context": string
}

Response:
{
    "quality_score": number,    // 0.0 - 1.0
    "matched_act": string,      // Act ID
    "reasoning": string,        // Explanation
    "approved": boolean
}
```

### Oracle → IPFS

```http
GET https://gateway.pinata.cloud/ipfs/{CID}

Response: JSON (spellbook acts)
```

### Oracle → SecretSigner

```typescript
const signature = await SecretSigner.sign({
    client: nillionClient,
    storeId: keyStoreId,
    message: transactionHash,
    algorithm: 'ECDSA'
});
```

### Mage Agent → Oracle

```http
POST /api/submit
{
    "proverb": string,
    "tracking_code": string
}

GET /api/status/{tracking_code}

Response:
{
    "status": "pending" | "verified" | "inscribed",
    "quality_score": number,
    "txid": string
}
```

---

## Configuration Management

### Environment Variables

```bash
# Critical (required)
NILLION_API_KEY           # TEE access
NEAR_API_KEY         # AI verification
PINATA_JWT                # IPFS access
DATABASE_URL              # PostgreSQL
ZCASH_DATA_DIR            # Light client

# Optional (with defaults)
ORACLE_CHECK_INTERVAL=30  # seconds
LOG_LEVEL=info
RETRY_ATTEMPTS=3
```

### Secrets Management

**Development**:
- `.env` file (gitignored)
- Local environment variables

**Production**:
- Environment variables (systemd)
- Secret management service (AWS Secrets Manager, etc.)
- Nillion encrypted storage for Zcash keys

---

## Next Steps

✅ **Architecture Understood!**

You now understand:
- Three-layer isolation model
- Complete data flow (10 steps)
- Security guarantees
- Economic model
- Performance characteristics

**Next**: Read `docs/03-BUILD_GUIDE.md` to start implementing

**Reference**: Use `docs/04-API_REFERENCE.md` for code patterns
