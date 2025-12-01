# Next Steps After Viewing Key Import

## ✅ Viewing Key Imported Successfully!

Great! Now let's verify your test transaction and get the backend to detect it.

## 🔍 Verify Transaction in zecwallet-cli

In your zecwallet-cli terminal, try these commands:

### 1. Check Balance
```bash
balance
```
Should show the amount you sent to the address.

### 2. List Addresses
```bash
list
# or
addresses
```
Should show the address you imported the viewing key for.

### 3. Check Transactions
```bash
# Some versions use:
show
# or
transactions
# or just check the balance command output
```

## 🔧 Update Backend to Detect Transactions

The backend currently tries to use wallet RPC methods that don't exist in zebrad. We need to update it to use **lightwalletd's gRPC interface**.

### Option 1: Use lightwalletd gRPC (Recommended)

Update the backend to:
1. Connect to lightwalletd's gRPC (port 9067)
2. Use viewing keys to scan for transactions
3. Query blocks and decrypt memos

### Option 2: Manual Detection (Temporary)

For now, you can manually check transactions in zecwallet-cli, and we can add an API endpoint to manually submit transactions for processing.

## 📋 What We Need to Do

1. ✅ **Verify transaction visible** - Check in zecwallet-cli
2. ⏳ **Update zcash-client.ts** - Use lightwalletd gRPC instead of zebrad JSON-RPC
3. ⏳ **Implement viewing key scanning** - Query blocks and decrypt memos
4. ⏳ **Test transaction detection** - Backend should automatically detect new transactions

---

**After you confirm the transaction is visible in zecwallet-cli, let me know and I'll update the backend code to use lightwalletd's gRPC interface!**

