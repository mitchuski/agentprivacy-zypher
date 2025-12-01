# Reassessing the Approach: Direct Viewing Key Scanning

## Current Problem

We've been trying to use:
```
zebrad → lightwalletd → zecwallet-cli → backend
```

But we're getting:
- Consensus branch errors
- Sync issues
- Block number not updating
- Complex setup chain

## Root Issue

**The backend doesn't actually need zecwallet-cli or lightwalletd!**

The backend just needs to:
1. **Scan blocks for transactions** to addresses we control
2. **Decrypt memos** using viewing keys
3. **Detect new submissions**

## Better Approach: Direct Viewing Key Scanning

### Option 1: Backend Uses Viewing Keys Directly with Zebrad

Instead of going through lightwalletd/zecwallet-cli, the backend could:

1. **Query zebrad directly** for blocks
2. **Use viewing keys** to scan blocks for relevant transactions
3. **Decrypt memos** using viewing keys
4. **Detect new transactions** automatically

**Benefits:**
- ✅ No dependency on lightwalletd or zecwallet-cli
- ✅ Direct control over scanning
- ✅ No consensus branch issues
- ✅ Simpler architecture

**Implementation:**
- Use zebrad's `getblock` RPC to get blocks
- Scan blocks for Sapling outputs
- Use viewing keys to decrypt and check if transactions are to our addresses
- Process memos to detect submissions

### Option 2: Use lightwalletd gRPC Directly (No zecwallet-cli)

The backend could connect directly to lightwalletd's gRPC interface:

1. **Use gRPC client** to connect to lightwalletd (port 9067)
2. **Get compact blocks** using `GetBlockRange`
3. **Scan blocks** using viewing keys
4. **Decrypt memos** from transactions

**Benefits:**
- ✅ No zecwallet-cli needed
- ✅ lightwalletd handles block processing
- ✅ Still uses lightwalletd (which is working)

**Implementation:**
- Install `@grpc/grpc-js` and `@grpc/proto-loader`
- Load lightwalletd proto files
- Implement gRPC client for `GetBlockRange`
- Scan blocks with viewing keys

### Option 3: Keep Current Setup but Fix Issues

If we want to keep the current approach:

1. **Fix lightwalletd-zebrad connection** issues
2. **Fix consensus branch errors** in zecwallet-cli
3. **Get zecwallet-cli syncing properly**
4. **Backend queries zecwallet-cli** (if it exposes RPC)

**But this is complex and error-prone.**

## Recommended: Option 1 (Direct Viewing Key Scanning)

**Why this is best:**
- Simplest architecture
- Direct control
- No intermediate services
- Works with what we have (zebrad + viewing keys)

**What needs to be implemented:**
1. Block scanning using zebrad RPC
2. Sapling output detection
3. Viewing key decryption
4. Memo parsing

**Libraries needed:**
- Zcash libraries for Sapling cryptography
- Viewing key decryption functions
- Memo parsing (already have this)

## Current Status

- ✅ **Zebrad**: Working and synced
- ✅ **Viewing keys**: Available in address file
- ⚠️ **lightwalletd**: Working but causing issues
- ❌ **zecwallet-cli**: Consensus branch errors, sync issues
- ❌ **Backend**: Can't detect transactions yet

## Next Steps

1. **Decide on approach** (recommend Option 1)
2. **Implement viewing key scanning** in backend
3. **Test transaction detection** with your test transaction
4. **Remove dependency** on lightwalletd/zecwallet-cli for backend

---

**Recommendation: Implement direct viewing key scanning in the backend. It's simpler and more reliable!**

