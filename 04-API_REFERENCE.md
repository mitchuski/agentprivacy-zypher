# API Reference

**Code templates, patterns, and integration examples**

---

## Quick Reference

### External APIs

| Service | Purpose | Authentication | Rate Limit |
|---------|---------|----------------|------------|
| **Nillion** | TEE + SecretSigner | API Key | TBD |
| **NEAR Cloud AI** | AI Verification | Bearer Token | 100/month free |
| **Pinata** | IPFS Gateway | JWT | 100GB free |
| **Zcash** | Blockchain | None (public RPC) | No limit |

### Internal APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/submit` | POST | Submit proverb |
| `/api/status/:code` | GET | Check status |
| `/api/stats` | GET | Get statistics |

---

## Nillion Integration

### Initialize Client

```typescript
import { NillionClient } from '@nillion/client-web';

const client = new NillionClient({
  network: 'testnet', // or 'mainnet'
  apiKey: process.env.NILLION_API_KEY!,
});
```

### SecretSigner: Store Key

```typescript
import { SecretSigner } from '@nillion/client-web';

// Store Zcash spending key
const keyStoreId = await SecretSigner.storeKey({
  client: client,
  privateKey: Buffer.from(zcashPrivateKey, 'hex'),
  algorithm: 'ECDSA',
});

console.log('Key stored:', keyStoreId);
// Save keyStoreId securely
```

### SecretSigner: Sign Transaction

```typescript
// Prepare transaction hash
const txHash = Buffer.from(transactionHash, 'hex');

// Sign with distributed key
const signature = await SecretSigner.sign({
  client: client,
  storeId: keyStoreId,
  message: txHash,
  algorithm: 'ECDSA',
});

console.log('Signature:', signature.toString('hex'));
```

### Get Attestation

```typescript
// Get TEE attestation
const attestation = await client.getAttestation();

console.log('Attestation:', attestation);

// Verify attestation
const valid = await client.verifyAttestation(attestation);
console.log('Valid:', valid); // true if TEE is authentic
```

### Error Handling

```typescript
try {
  const signature = await SecretSigner.sign({
    client: client,
    storeId: keyStoreId,
    message: txHash,
    algorithm: 'ECDSA',
  });
} catch (error: any) {
  if (error.code === 'KEY_NOT_FOUND') {
    console.error('Key not found, reinitialize');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network error, retry');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

---

## NEAR Cloud AI Integration

### Verify Proverb

```typescript
import axios from 'axios';

interface VerificationRequest {
  model: string;
  proverb: string;
  spellbook_acts: Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
  }>;
  context: string;
}

interface VerificationResponse {
  quality_score: number;
  matched_act: string;
  reasoning: string;
  approved: boolean;
}

async function verifyProverb(
  proverb: string,
  spellbookActs: any[]
): Promise<VerificationResponse> {
  const response = await axios.post<VerificationResponse>(
    'https://cloud.near.ai/v1/verify',
    {
      model: 'openai/gpt-oss-120b',
      proverb: proverb,
      spellbook_acts: spellbookActs,
      context: 'privacy_protocol',
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.NEAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    }
  );

  return response.data;
}
```

### With Retry Logic

```typescript
async function verifyWithRetry(
  proverb: string,
  spellbookActs: any[],
  maxRetries: number = 3
): Promise<VerificationResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await verifyProverb(proverb, spellbookActs);
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
```

### Fallback Verification

```typescript
function fallbackVerification(
  proverb: string,
  spellbookActs: any[]
): VerificationResponse {
  const lowerProverb = proverb.toLowerCase();
  
  // Check for key concepts
  const concepts = [
    'privacy', 'separation', 'architecture', 'delegation',
    'boundary', 'sovereignty', 'protection', 'encryption',
  ];
  
  const matches = concepts.filter(c => lowerProverb.includes(c));
  const score = Math.min(matches.length / concepts.length, 0.7);
  
  // Find matching act
  let matchedAct = spellbookActs[0]?.id || 'unknown';
  for (const act of spellbookActs) {
    for (const keyword of act.keywords) {
      if (lowerProverb.includes(keyword.toLowerCase())) {
        matchedAct = act.id;
        break;
      }
    }
  }
  
  return {
    quality_score: score,
    matched_act: matchedAct,
    reasoning: 'Fallback verification (AI service unavailable)',
    approved: score >= 0.5,
  };
}
```

---

## IPFS/Pinata Integration

### Fetch from Gateway

```typescript
import axios from 'axios';

interface Spellbook {
  version: string;
  created_at: string;
  description: string;
  acts: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    keywords: string[];
  }>;
}

async function fetchSpellbook(cid: string): Promise<Spellbook> {
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  
  const response = await axios.get<Spellbook>(url, {
    timeout: 10000,
    headers: {
      'Accept': 'application/json',
    },
  });
  
  return response.data;
}
```

### With Caching

```typescript
class IPFSCache {
  private cache: Map<string, any> = new Map();
  private ttl: number = 3600000; // 1 hour in ms

  async fetch(cid: string): Promise<any> {
    const cached = this.cache.get(cid);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetchSpellbook(cid);
    this.cache.set(cid, { data, timestamp: Date.now() });
    return data;
  }

  clear() {
    this.cache.clear();
  }
}

const ipfsCache = new IPFSCache();
```

### Upload to Pinata

```typescript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function uploadToPinata(filePath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        ...formData.getHeaders(),
      },
    }
  );

  return response.data.IpfsHash; // CID
}
```

---

## Zcash Integration

### Light Client Wrapper

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ZcashLightClient {
  private cliPath: string = 'zecwallet-cli';
  private server: string;
  private dataDir: string;

  constructor(server: string, dataDir: string) {
    this.server = server;
    this.dataDir = dataDir;
  }

  private async execute(command: string): Promise<string> {
    const cmd = `${this.cliPath} --server ${this.server} --data-dir ${this.dataDir} --command "${command}"`;
    const { stdout } = await execAsync(cmd);
    return stdout;
  }

  async getBalance(): Promise<{ transparent: number; shielded: number }> {
    const output = await this.execute('balance');
    // Parse output
    return {
      transparent: parseFloat(output.match(/transparent: ([\d.]+)/)?.[1] || '0'),
      shielded: parseFloat(output.match(/shielded: ([\d.]+)/)?.[1] || '0'),
    };
  }

  async send(
    to: string,
    amount: number,
    memo?: string
  ): Promise<string> {
    const memoArg = memo ? `--memo "${memo}"` : '';
    const output = await this.execute(`send ${to} ${amount} ${memoArg}`);
    
    // Extract txid
    const match = output.match(/[a-f0-9]{64}/);
    return match ? match[0] : '';
  }

  async listTransactions(): Promise<Array<{
    txid: string;
    amount: number;
    address: string;
    memo?: string;
    confirmations: number;
  }>> {
    const output = await this.execute('list');
    // Parse and return transactions
    return this.parseTransactionList(output);
  }

  private parseTransactionList(output: string): any[] {
    // Implementation depends on zecwallet-cli output format
    return [];
  }
}
```

### Monitor for New Transactions

```typescript
class TransactionMonitor {
  private client: ZcashLightClient;
  private lastHeight: number = 0;
  private callback: (tx: any) => Promise<void>;

  constructor(client: ZcashLightClient, callback: (tx: any) => Promise<void>) {
    this.client = client;
    this.callback = callback;
  }

  async start(intervalMs: number = 30000) {
    setInterval(async () => {
      try {
        const txs = await this.client.listTransactions();
        const newTxs = txs.filter(tx => tx.confirmations > 0);
        
        for (const tx of newTxs) {
          await this.callback(tx);
        }
      } catch (error) {
        console.error('Monitor error:', error);
      }
    }, intervalMs);
  }
}

// Usage
const monitor = new TransactionMonitor(zcashClient, async (tx) => {
  console.log('New transaction:', tx.txid);
  await processTransaction(tx);
});

monitor.start(30000); // Check every 30 seconds
```

### Parse Memo Field

```typescript
interface ProverbMemo {
  tracking_code: string;
  proverb: string;
}

function parseMemo(memo: string): ProverbMemo {
  // Expected format: "TRACK:ABC123|proverb text here"
  const match = memo.match(/TRACK:([^|]+)\|(.*)/);
  
  if (!match) {
    throw new Error('Invalid memo format');
  }
  
  return {
    tracking_code: match[1],
    proverb: match[2],
  };
}

// Usage
try {
  const { tracking_code, proverb } = parseMemo(transaction.memo);
  console.log('Tracking:', tracking_code);
  console.log('Proverb:', proverb);
} catch (error) {
  console.error('Failed to parse memo:', error);
}
```

### Create Inscription Transaction

```typescript
async function createInscription(
  proverb: string,
  trackingCode: string,
  amount: number
): Promise<string> {
  const memo = `PROVERB:${trackingCode}:${proverb}`;
  
  // Truncate if too long (memo limit is ~512 bytes)
  const truncatedMemo = memo.length > 500 
    ? memo.substring(0, 497) + '...'
    : memo;
  
  const txid = await zcashClient.send(
    publicInscriptionAddress,
    amount,
    truncatedMemo
  );
  
  return txid;
}
```

---

## PostgreSQL Patterns

### Connection Pool

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

export default pool;
```

### Transactions

```typescript
async function processSubmissionAtomic(data: any) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert submission
    const submissionResult = await client.query(
      'INSERT INTO submissions (...) VALUES (...) RETURNING id',
      [...]
    );
    const submissionId = submissionResult.rows[0].id;
    
    // Insert verification
    await client.query(
      'INSERT INTO verifications (...) VALUES (...)',
      [submissionId, ...]
    );
    
    // Insert inscription
    await client.query(
      'INSERT INTO inscriptions (...) VALUES (...)',
      [submissionId, ...]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Query Helpers

```typescript
async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

// Usage
const submission = await queryOne<Submission>(
  'SELECT * FROM submissions WHERE tracking_code = $1',
  [trackingCode]
);
```

---

## Error Handling Patterns

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Should not reach here');
}

// Usage
const result = await retryWithBackoff(
  () => nearVerifier.verify(proverb, spellbook),
  3,
  1000
);
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures: number = 0;
  private lastFailTime: number = 0;
  private threshold: number;
  private timeout: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error('Circuit breaker opened');
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000);

try {
  const result = await breaker.execute(() =>
    nearVerifier.verify(proverb, spellbook)
  );
} catch (error) {
  // Handle circuit breaker error or actual error
}
```

---

## Logging Patterns

### Winston Logger

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Usage

```typescript
import logger from './logger';

logger.info('Processing submission', {
  tracking_code: trackingCode,
  proverb_length: proverb.length,
});

logger.error('Verification failed', {
  error: error.message,
  tracking_code: trackingCode,
  stack: error.stack,
});

logger.debug('Raw transaction', {
  txid: tx.txid,
  amount: tx.amount,
  memo: tx.memo,
});
```

---

## Testing Patterns

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { parseMemo } from '../src/utils';

describe('parseMemo', () => {
  it('should parse valid memo', () => {
    const memo = 'TRACK:ABC123|Privacy requires separation';
    const result = parseMemo(memo);
    
    expect(result.tracking_code).toBe('ABC123');
    expect(result.proverb).toBe('Privacy requires separation');
  });

  it('should throw on invalid format', () => {
    const memo = 'invalid memo';
    expect(() => parseMemo(memo)).toThrow('Invalid memo format');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from '@jest/globals';
import { db } from '../src/database';
import { zcashClient } from '../src/zcash-client';

describe('End-to-end submission', () => {
  it('should process complete submission', async () => {
    // Create test submission
    const submission = await db.createSubmission({
      tracking_code: 'TEST-' + Date.now(),
      sender_address: 't1test',
      proverb_text: 'Test proverb',
      amount_zec: 0.01,
      txid: 'test_txid',
    });

    expect(submission.id).toBeGreaterThan(0);
    expect(submission.status).toBe('pending');

    // Verify can be retrieved
    const retrieved = await db.getSubmissionByTrackingCode(
      submission.tracking_code
    );
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(submission.id);
  });
});
```

---

## Environment Variables Template

```bash
# .env.example

# ===========================================
# Nillion Configuration
# ===========================================
NILLION_API_KEY=your_nillion_api_key_here
NILLION_NETWORK=testnet

# ===========================================
# NEAR Cloud AI
# ===========================================
NEAR_API_KEY=your_near_api_key_here
NEAR_MODEL=gpt oss 120b

# ===========================================
# IPFS/Pinata
# ===========================================
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY=https://gateway.pinata.cloud
SPELLBOOK_CID=your_spellbook_cid_here

# ===========================================
# Zcash
# ===========================================
ZCASH_NETWORK=testnet
ZCASH_SERVER=https://zec.rocks:443
ZCASH_DATA_DIR=/path/to/zcash-wallet

# ===========================================
# PostgreSQL
# ===========================================
DATABASE_URL=postgresql://user:password@localhost:5432/proverb_protocol

# ===========================================
# Oracle Settings
# ===========================================
ORACLE_CHECK_INTERVAL=30
ORACLE_RETRY_ATTEMPTS=3
ORACLE_RETRY_DELAY=60

# ===========================================
# Economics
# ===========================================
PROVERB_COST=0.01
PUBLIC_SPLIT=0.618
PRIVATE_SPLIT=0.382
NETWORK_FEE=0.0001

# ===========================================
# Logging
# ===========================================
LOG_LEVEL=info
LOG_FILE=logs/proverb-protocol.log

# ===========================================
# Frontend
# ===========================================
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NETWORK=testnet
```

---

## Common Pitfalls

### 1. Memo Size Limits

```typescript
// ❌ Wrong: Can exceed Zcash memo limit
const memo = `PROVERB:${code}:${veryLongProverb}`;

// ✅ Correct: Truncate if needed
const maxLength = 500;
const truncated = proverb.length > maxLength
  ? proverb.substring(0, maxLength - 3) + '...'
  : proverb;
const memo = `PROVERB:${code}:${truncated}`;
```

### 2. Async Error Handling

```typescript
// ❌ Wrong: Unhandled promise rejection
processSubmission(tx); // Fire and forget

// ✅ Correct: Handle errors
processSubmission(tx).catch(error => {
  logger.error('Processing failed', { error, txid: tx.txid });
});
```

### 3. Database Connections

```typescript
// ❌ Wrong: Create new pool each time
function query() {
  const pool = new Pool(...);
  return pool.query(...);
}

// ✅ Correct: Reuse pool
const pool = new Pool(...);
function query() {
  return pool.query(...);
}
```

### 4. API Rate Limits

```typescript
// ❌ Wrong: No rate limiting
for (const proverb of proverbs) {
  await near.verify(proverb);
}

// ✅ Correct: Add delays
for (const proverb of proverbs) {
  await near.verify(proverb);
  await sleep(1000); // 1 second between requests
}
```

---

## Performance Tips

### 1. Batch Database Operations

```typescript
// ❌ Slow: N queries
for (const item of items) {
  await db.query('INSERT INTO table VALUES ($1)', [item]);
}

// ✅ Fast: 1 query
const values = items.map((item, i) => `($${i + 1})`).join(',');
await db.query(`INSERT INTO table VALUES ${values}`, items);
```

### 2. Cache IPFS Fetches

```typescript
// ❌ Slow: Fetch every time
const spellbook = await ipfs.fetch(cid);

// ✅ Fast: Cache result
let cachedSpellbook: Spellbook | null = null;
async function getSpellbook(): Promise<Spellbook> {
  if (!cachedSpellbook) {
    cachedSpellbook = await ipfs.fetch(cid);
  }
  return cachedSpellbook;
}
```

### 3. Parallel Processing

```typescript
// ❌ Slow: Sequential
for (const tx of transactions) {
  await process(tx);
}

// ✅ Fast: Parallel (with limit)
await Promise.all(
  transactions.map(tx => process(tx))
);
```

---

## Security Checklist

- [ ] Never log private keys
- [ ] Never commit .env files
- [ ] Validate all user inputs
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Use HTTPS everywhere
- [ ] Verify Nillion attestation
- [ ] Hash sensitive data
- [ ] Implement CORS properly
- [ ] Use secure random for tracking codes

---

## Next Steps

✅ **API Reference Complete!**

You now have:
- Complete integration examples
- Error handling patterns
- Testing templates
- Performance tips
- Security checklist

**Next**: Use `docs/05-ROADMAP.md` to track your implementation progress
