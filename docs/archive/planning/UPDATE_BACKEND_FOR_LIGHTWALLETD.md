# Update Backend to Use lightwalletd gRPC

## Current Issue

The backend tries to use wallet RPC methods (`getbalance`, `listtransactions`, etc.) that don't exist in zebrad. We need to use **lightwalletd's gRPC interface** instead.

## Solution: Use lightwalletd gRPC

lightwalletd provides gRPC methods that can:
- Get blocks: `GetBlockRange` 
- Get transactions: `GetTaddressTransactions` (for transparent)
- For shielded: Scan blocks using viewing keys and decrypt memos

## Implementation Plan

### Step 1: Install gRPC Client

```bash
cd oracle-swordsman
npm install @grpc/grpc-js @grpc/proto-loader
```

### Step 2: Create lightwalletd gRPC Client

Create `src/lightwalletd-client.ts` that:
- Connects to lightwalletd gRPC (port 9067)
- Uses viewing keys from address file
- Scans blocks for transactions
- Decrypts memos using viewing keys

### Step 3: Update zcash-client.ts

Replace zebrad JSON-RPC calls with lightwalletd gRPC calls:
- `getBalance()` → Use `GetTaddressBalance` + scan shielded addresses
- `listTransactions()` → Use `GetBlockRange` + scan with viewing keys
- `getNewSubmissions()` → Scan new blocks since last check

### Step 4: Update Transaction Monitor

The transaction monitor will:
1. Get latest block height from lightwalletd
2. Scan new blocks using viewing keys
3. Decrypt memos from shielded transactions
4. Detect new submissions

## Quick Fix (Temporary)

For now, we can:
1. Keep backend running (it will show errors but API still works)
2. Manually check transactions in zecwallet-cli
3. Add a manual submission endpoint to process transactions you find

---

**Let me know if you want me to implement the lightwalletd gRPC client now, or if you prefer to verify the transaction first!**

