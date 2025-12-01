# Start zecwallet-cli

## ✅ Current Status

- **Zebrad**: ✅ Running on port 8233
- **lightwalletd**: ✅ Running on port 9067 (gRPC)
- **zecwallet-cli**: ⏳ Needs to be started

## 🚀 Start zecwallet-cli

Open a **new terminal window** and run:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

This will:
- Connect to lightwalletd (which connects to zebrad)
- Start an interactive wallet session
- Allow you to import viewing keys and manage addresses

## 📝 Import Viewing Keys

Once zecwallet-cli is running, you can import viewing keys from your address file:

```bash
# In zecwallet-cli prompt:
import-viewing-key <viewing_key_from_address_file>
```

Or import from the address file directly (if you have a script for that).

## ⚙️ Backend Configuration

The backend needs to connect to a wallet RPC interface. Options:

### Option 1: Use zecwallet-cli RPC (if available)
- Check if zecwallet-cli exposes an RPC port
- Update backend `.env` to point to that port

### Option 2: Use lightwalletd gRPC directly
- Backend would need to use gRPC instead of JSON-RPC
- Requires code changes to use gRPC client

### Option 3: Keep current setup (will need fixes)
- Backend tries to use wallet methods that don't exist in Zebra
- Need to implement viewing key scanning instead

## 🔄 Next Steps

1. **Start zecwallet-cli** in a new terminal
2. **Import viewing keys** from your address file
3. **Update backend config** to use the correct RPC endpoint
4. **Restart backend** to connect to wallet RPC

---

**Note**: The backend is currently trying to use wallet RPC methods that only exist in wallet software (zecwallet-cli, zcashd), not in full nodes (zebrad). We need to either:
- Connect backend to zecwallet-cli's RPC (if it has one)
- Or implement viewing key scanning to query zebrad directly

