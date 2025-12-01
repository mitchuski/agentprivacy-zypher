# Zebra RPC Method Not Found Errors

## Problem

The backend is trying to use **wallet RPC methods** that don't exist in Zebra:

- ❌ `getbalance` - Wallet method (not in Zebra)
- ❌ `getaddressesbyaccount` - Wallet method (not in Zebra)  
- ❌ `listtransactions` - Wallet method (not in Zebra)
- ❌ `z_getbalance` - Wallet method (not in Zebra)
- ❌ `z_listaddresses` - Wallet method (not in Zebra)

**Zebra is a full node**, not a wallet. It only provides **blockchain RPC methods** like:
- ✅ `getblockchaininfo` - Works!
- ✅ `getblock` - Works!
- ✅ `getrawtransaction` - Works!

## Why This Happens

The code was written for **zecwallet-cli** (light wallet) or **zcashd** (full node with wallet), which have wallet RPC methods. Zebra is a different implementation that separates the full node from wallet functionality.

## Solutions

### Option 1: Use zecwallet-cli (Light Wallet) - EASIEST

Run zecwallet-cli alongside zebrad:
- Zebra provides the blockchain data
- zecwallet-cli provides wallet RPC methods
- Backend connects to zecwallet-cli instead of zebrad

**Configuration:**
```env
# In .env, change to use zecwallet-cli
ZCASH_RPC_HOST=127.0.0.1
ZCASH_RPC_PORT=9067  # zecwallet-cli default port
```

### Option 2: Use Viewing Keys to Scan Blockchain - COMPLEX

Since you have viewing keys in `zcash-addresses-controlled.json`, we could:
1. Use viewing keys to scan the blockchain
2. Query Zebra for blocks/transactions
3. Decrypt memos using viewing keys

This requires significant code changes.

### Option 3: Use zcashd (Full Node with Wallet) - ALTERNATIVE

Switch from Zebra to zcashd:
- Has both full node and wallet functionality
- Supports all the RPC methods the code expects
- But zcashd is deprecated in favor of Zebra

## Recommended: Option 1 (zecwallet-cli)

Since you already have viewing keys, the easiest solution is to run **zecwallet-cli** which:
- Connects to zebrad as its backend
- Provides wallet RPC methods
- Automatically decrypts memos using viewing keys
- Works with the existing code

### Setup zecwallet-cli

1. **Install zecwallet-cli** (if not already installed):
```bash
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli
```

2. **Start zecwallet-cli** pointing to zebrad:
```bash
zecwallet-cli --server http://127.0.0.1:8233
```

3. **Import viewing keys** from your address file:
```bash
# In zecwallet-cli:
import-viewing-key <viewing_key_from_address_file>
```

4. **Update backend .env**:
```env
ZCASH_RPC_HOST=127.0.0.1
ZCASH_RPC_PORT=9067  # zecwallet-cli default
```

5. **Restart backend** - it will now connect to zecwallet-cli instead of zebrad

## Current Status

✅ **Zebrad connected** - Full node is working
✅ **Backend running** - API server is up
❌ **Wallet methods failing** - Need wallet RPC interface
⚠️ **Transaction monitoring disabled** - Can't detect transactions without wallet methods

## Next Steps

1. Set up zecwallet-cli (Option 1) - **Recommended**
2. Or implement viewing key scanning (Option 2) - More complex
3. Or switch to zcashd (Option 3) - Not recommended (deprecated)

---

**Note**: The address file reading errors are a separate issue - the file exists but there's a JSON parsing problem. This is less critical than the RPC method issue.

