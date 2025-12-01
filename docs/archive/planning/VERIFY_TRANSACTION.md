# Verify Your Test Transaction

## ✅ Viewing Key Imported Successfully!

Great! The viewing key is imported. Now let's verify your test transaction is visible.

## 🔍 In zecwallet-cli, Check:

### 1. Check Balance
```bash
balance
```
Should show the amount you sent (e.g., 0.01 ZEC or whatever you sent).

### 2. List Transactions
```bash
list
```
Or try:
```bash
# Some versions use different commands
show
# or
transactions
```

### 3. Check Address
```bash
# List addresses to see which one received
addresses
# or
list addresses
```

## 📋 What to Look For

Your test transaction should show:
- **Amount**: The ZEC you sent
- **Memo**: The encrypted memo (if you included one)
- **Confirmations**: Should be 1+ if confirmed
- **TXID**: The transaction ID

## ⚠️ If Transaction Not Visible

1. **Wait for rescan**: After importing viewing key, zecwallet-cli needs to rescan the blockchain
2. **Check lightwalletd sync**: Make sure lightwalletd is fully synced
3. **Verify address**: Make sure you sent to the correct address that matches the viewing key

## 🔧 Next: Get Backend to Detect It

Once you confirm the transaction is visible in zecwallet-cli, we need to update the backend to:
- Use lightwalletd's gRPC interface instead of zebrad's JSON-RPC
- Query transactions using viewing keys
- Detect new transactions automatically

---

**After you verify the transaction is visible, let me know and we'll update the backend!**

