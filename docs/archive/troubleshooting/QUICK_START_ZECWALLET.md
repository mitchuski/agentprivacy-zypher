# Quick Start: zecwallet-cli

## ✅ Current Status

- **Zebrad**: ✅ Running (port 8233)
- **lightwalletd**: ✅ Running (port 9067) 
- **Backend**: ✅ Running (port 3001)
- **zecwallet-cli**: ⏳ Start in new terminal

## 🚀 Start zecwallet-cli

**Open a NEW PowerShell terminal** and run:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

This connects zecwallet-cli to lightwalletd (which is connected to zebrad).

## 📋 Once zecwallet-cli is Running

### Import Viewing Keys

You can import viewing keys from your address file:

```bash
# In zecwallet-cli prompt:
import-viewing-key zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c
```

### Check Your Test Transaction

Once viewing keys are imported, zecwallet-cli can see transactions:

```bash
# List transactions
list

# Get balance
balance
```

## ⚠️ Backend RPC Issue

**Important**: The backend is currently trying to connect directly to zebrad for wallet RPC methods, but zebrad doesn't have wallet methods.

**The backend needs to:**
- Either connect to zecwallet-cli's RPC (if it exposes one)
- Or use lightwalletd's gRPC interface
- Or implement viewing key scanning to query zebrad directly

**Current error**: "Method not found" because zebrad doesn't have `getbalance`, `listtransactions`, etc.

## 🔧 Next Steps

1. ✅ Start zecwallet-cli (you're doing this now)
2. ⏳ Import viewing keys into zecwallet-cli
3. ⏳ Update backend to use correct RPC endpoint
4. ⏳ Test transaction detection

---

**Note**: zecwallet-cli is primarily a CLI tool. The backend may need to use lightwalletd's gRPC interface directly, or we need to implement viewing key scanning for zebrad.

