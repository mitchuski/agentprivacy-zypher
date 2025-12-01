# Nillion Usage Status

## Current Implementation

**Nillion is NOT currently being used for the op_return deshield flow.**

### What's Actually Happening

The Oracle currently uses **direct Zcash RPC calls** to create transactions:

1. **Transaction Building** (`transaction-builder.ts`):
   - Uses `zcashClient.send()` directly
   - No Nillion signing involved
   - Creates transactions via standard Zcash RPC

2. **Transaction Sending** (`zcash-client.ts`):
   - Uses `sendtoaddress` for transparent addresses
   - Uses `z_sendmany` for shielded addresses
   - Both are standard Zcash RPC commands
   - No cryptographic signing via Nillion

3. **Nillion Integration** (`nillion-signer.ts`):
   - ✅ Code exists and is initialized
   - ✅ `signTransaction()` method available
   - ❌ **NOT called** by transaction builder
   - ❌ **NOT used** for op_return deshield flow

### Architecture Intent vs. Reality

**Intended Architecture** (from docs):
```
Oracle → Nillion SecretSigner → Sign Transaction → Broadcast
```

**Current Reality**:
```
Oracle → Zcash RPC (sendtoaddress/z_sendmany) → Broadcast
```

### Why Nillion Isn't Being Used

1. **Transaction Builder doesn't call it**: `TransactionBuilder.createInscription()` calls `zcashClient.send()` directly
2. **ZcashClient uses RPC**: The `send()` method uses standard RPC commands that handle signing internally
3. **No manual signing**: Transactions are signed by the Zcash node/wallet, not by Nillion

### Security Implications

**Current State**:
- ⚠️ Private keys are stored in the Zcash wallet/node
- ⚠️ Signing happens in the Zcash node process
- ⚠️ No TEE isolation for signing operations

**With Nillion** (intended):
- ✅ Private keys stored in TEE (Nillion SecretSigner)
- ✅ Signing happens in hardware-isolated environment
- ✅ Keys never exposed to Oracle process

### How to Enable Nillion Signing

To actually use Nillion for the op_return deshield flow, you would need to:

1. **Modify Transaction Builder** to:
   - Build unsigned transaction
   - Get transaction hash
   - Call `nillionSigner.signTransaction(txHash)`
   - Attach signature to transaction
   - Broadcast signed transaction

2. **Modify ZcashClient** to:
   - Support building raw/unsigned transactions
   - Support attaching signatures
   - Support broadcasting pre-signed transactions

3. **Store keys in Nillion**:
   - Initialize Nillion with spending keys
   - Use SecretSigner workload for signing

### Current Transaction Flow

```
User sends ZEC (z→z) with memo
  ↓
Oracle detects transaction
  ↓
Oracle verifies proverb (NEAR Cloud AI)
  ↓
Oracle builds inscription transaction
  ↓
Oracle calls zcashClient.send()  ← NO NILLION HERE
  ↓
Zcash node signs transaction (using local wallet keys)
  ↓
Transaction broadcast to network
```

### Intended Transaction Flow (with Nillion)

```
User sends ZEC (z→z) with memo
  ↓
Oracle detects transaction
  ↓
Oracle verifies proverb (NEAR Cloud AI)
  ↓
Oracle builds unsigned transaction
  ↓
Oracle gets transaction hash
  ↓
Oracle calls nillionSigner.signTransaction(txHash)  ← NILLION HERE
  ↓
Nillion TEE signs transaction (keys never leave TEE)
  ↓
Oracle attaches signature to transaction
  ↓
Transaction broadcast to network
```

## Summary

**Question**: Does the Oracle still use Nillion for op_return deshield flow?

**Answer**: **NO** - Nillion code exists but is not being used. The system currently uses direct Zcash RPC calls that handle signing internally via the Zcash node/wallet.

**To enable Nillion**: Significant refactoring needed to build unsigned transactions, sign via Nillion, and broadcast pre-signed transactions.

