# Current Flow Analysis: Nillion + NEAR Cloud AI + Proverb + Onchain Inscriptions

## Complete Flow Trace

### 1. Transaction Detection
**File**: `src/transaction-monitor.ts`
- ✅ Monitors Zcash blockchain for new transactions
- ✅ Validates amount (0.01 ZEC ± tolerance)
- ✅ Validates memo format
- ✅ Extracts submission data (tracking code, proverb, tale ID)
- ✅ Emits `newSubmission` event

**Nillion Usage**: ❌ None

---

### 2. Submission Processing
**File**: `src/index.ts` → `processSubmission()`

**Step 2.1: Validation**
```typescript
const validation = validateProverb(proverbText);
```
- ✅ Validates proverb format
- ✅ Checks if already processed

**Nillion Usage**: ❌ None

**Step 2.2: Database Record**
```typescript
const dbSubmission = await db.createSubmission({...});
```
- ✅ Creates submission record
- ✅ Stores tracking code, proverb, amount, txid

**Nillion Usage**: ❌ None

**Step 2.3: Fetch Spellbook from IPFS**
```typescript
spellbook = await ipfsClient.fetchSpellbook();
```
- ✅ Fetches spellbook from IPFS/Pinata
- ✅ Gets acts with proverbs for matching

**Nillion Usage**: ❌ None

**Step 2.4: AI Verification (NEAR Cloud AI)**
```typescript
verification = await nearVerifier.verify(proverbText, spellbook);
```
- ✅ **NEAR Cloud AI is used here**
- ✅ Calls `nearcloudai-verifier.ts`
- ✅ Uses OpenAI-compatible API (`openai/gpt-oss-120b`)
- ✅ Returns quality score, matched act, reasoning
- ✅ Saves verification to database

**Nillion Usage**: ❌ None (NEAR Cloud AI handles verification)

**Step 2.5: Inscription (if approved)**
```typescript
if (verification.approved) {
  await inscribeProverb(dbSubmission, submissionData);
}
```
- ✅ Only proceeds if AI approves (quality_score >= 0.5)

**Nillion Usage**: ❌ None (yet)

---

### 3. Inscription Creation
**File**: `src/index.ts` → `inscribeProverb()`

**Step 3.1: Build Inscription**
```typescript
const result = await transactionBuilder.createInscription({...});
```
- ✅ Uses `TransactionBuilder` class
- ✅ Calculates 61.8/38.2 split (or 44/56 depending on config)
- ✅ Creates public memo (for t-address)
- ✅ Creates private memo (for z-address)

**Nillion Usage**: ❌ None

**Step 3.2: Send Transactions**
**File**: `src/transaction-builder.ts` → `createInscription()`

```typescript
const publicResult = await this.sendWithRetry(
  this.publicAddress,  // t-address
  split.public,
  publicMemo,
  'public'
);

const privateResult = await this.sendWithRetry(
  this.privateAddress,  // z-address
  split.private,
  privateMemo,
  'private'
);
```

**Nillion Usage**: ❌ **NOT USED**

**What Actually Happens**:
- Calls `zcashClient.send()` directly
- Uses Zcash RPC commands:
  - `sendtoaddress` for transparent addresses
  - `z_sendmany` for shielded addresses
- **Signing happens in Zcash node/wallet** (not Nillion)

---

### 4. Transaction Signing (Current Implementation)
**File**: `src/zcash-client.ts` → `send()`

```typescript
if (toAddress.startsWith('t') || toAddress.startsWith('tm')) {
  // Transparent address
  txid = await this.execCommandJSON<string>('sendtoaddress', toAddress, amount);
} else {
  // Shielded address
  const opid = await this.execCommandJSON<string>('z_sendmany', fromAddress, JSON.stringify(recipients));
  // Wait for operation...
}
```

**Nillion Usage**: ❌ **NOT USED**

**What Actually Happens**:
- Zcash RPC commands handle signing internally
- Keys are in Zcash wallet/node
- No TEE isolation
- No Nillion SecretSigner

---

## Nillion Status

### Where Nillion IS Used
1. **Initialization** (`src/index.ts:281`):
   ```typescript
   nillionSigner.initialize().catch((error: any) => {
     logger.error('Nillion initialization failed', { error: error.message });
     logger.warn('Continuing anyway - signing will fail until Nillion is configured');
   });
   ```
   - ✅ Nillion client is initialized
   - ⚠️ But errors are caught and ignored
   - ⚠️ System continues without Nillion

### Where Nillion IS NOT Used
1. ❌ **Transaction Signing**: Not called by `TransactionBuilder`
2. ❌ **Key Storage**: Keys not stored in Nillion SecretSigner
3. ❌ **TEE Isolation**: No hardware-enforced signing

### Nillion Code Available But Unused
- ✅ `src/nillion-signer.ts` - Signer class exists
- ✅ `src/nillion-api-client.ts` - API client exists
- ✅ `src/nillion-workload-client.ts` - Workload client exists
- ✅ `src/secretsigner-client.ts` - SecretSigner client exists
- ❌ **None of these are called during inscription flow**

---

## Architecture Compliance Check

### ✅ Components Working as Planned

1. **NEAR Cloud AI** ✅
   - Used for proverb verification
   - Returns quality scores
   - Matches proverbs to acts
   - Separate API key for Swordsman (not Mage)

2. **IPFS/Pinata** ✅
   - Spellbook fetched from IPFS
   - Acts with proverbs available
   - Used for AI verification context

3. **Proverb Processing** ✅
   - Memo parsing works
   - Tracking codes extracted
   - Tale IDs extracted
   - Validation working

4. **Onchain Inscriptions** ✅
   - Transactions created
   - Public inscription to t-address (61.8% or 44%)
   - Private transfer to z-address (38.2% or 56%)
   - Memos included
   - Database records created

### ❌ Components NOT Working as Planned

1. **Nillion TEE Signing** ❌
   - **Planned**: Keys in TEE, signing via Nillion SecretSigner
   - **Actual**: Keys in Zcash wallet, signing via RPC
   - **Impact**: No hardware isolation for signing operations

---

## Complete Flow Diagram

```
USER SENDS ZEC (z→z) with memo
  ↓
TRANSACTION MONITOR detects transaction
  ✅ Validates amount, memo format
  ✅ Extracts submission data
  ↓
PROCESS SUBMISSION
  ✅ Validate proverb format
  ✅ Create database record
  ✅ Fetch spellbook from IPFS
  ✅ Verify with NEAR Cloud AI  ← NEAR CLOUD AI USED HERE
  ✅ Save verification result
  ↓
IF APPROVED:
  ↓
INSCRIBE PROVERB
  ✅ Calculate split (61.8/38.2 or 44/56)
  ✅ Create memos
  ✅ Build transactions
  ↓
SEND TRANSACTIONS
  ❌ Uses zcashClient.send() directly
  ❌ NO NILLION SIGNING
  ❌ Zcash RPC handles signing internally
  ↓
TRANSACTIONS BROADCAST
  ✅ Public inscription (t-address)
  ✅ Private transfer (z-address)
  ✅ Database records updated
```

---

## Summary

### ✅ Following Plan
- ✅ NEAR Cloud AI verification
- ✅ IPFS spellbook fetching
- ✅ Proverb processing
- ✅ Onchain inscriptions (public + private)

### ❌ NOT Following Plan
- ❌ Nillion TEE signing (not used)
- ❌ Hardware isolation (keys in Zcash wallet, not TEE)
- ❌ SecretSigner workload (not called)

### Current Security Model
- ⚠️ Keys stored in Zcash wallet/node
- ⚠️ Signing happens in Zcash process
- ⚠️ No TEE isolation
- ✅ NEAR Cloud AI doesn't see keys (good)
- ✅ IPFS doesn't see keys (good)
- ✅ Database doesn't store keys (good)

### To Enable Nillion
Would need to:
1. Build unsigned transactions (raw format)
2. Get transaction hash
3. Call `nillionSigner.signTransaction(txHash)`
4. Attach signature
5. Broadcast pre-signed transaction

This requires refactoring `TransactionBuilder` and `ZcashClient` to support raw transactions and manual signing.

