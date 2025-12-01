# Generate Proper Z-Addresses - Quick Guide

## ✅ Current Status

- ✅ **lightwalletd**: Running (PID: 43400)
- ✅ **gRPC Port**: Accessible (127.0.0.1:9067)
- ✅ **HTTP Port**: Accessible (127.0.0.1:8080)
- ✅ **zecwallet-cli**: Connected and synced (523 blocks)

---

## 🚀 Generate Addresses Now

### Step 1: Open New Terminal

Open a **new PowerShell terminal** (keep lightwalletd running in the background).

### Step 2: Connect zecwallet-cli

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

You should see zecwallet-cli connect and sync.

### Step 3: Generate Addresses

Once connected, run these commands in zecwallet-cli:

```bash
# Generate shielded z-addresses (repeat as needed)
new z
new z
new z

# Generate transparent t-address (optional)
new t

# List all addresses
list

# Export wallet (SAVE THIS OUTPUT!)
export
```

**Important:** The `export` command shows your mnemonic and keys. Save this securely!

---

## 📝 Extract Addresses

### From `list` command:
You'll see output like:
```
Addresses:
  zs1abc123... (shielded)
  zs1def456... (shielded)
  t1xyz789... (transparent)
```

### From `export` command:
You'll get:
- Mnemonic (24 words)
- Spending keys
- Viewing keys
- All addresses

---

## 🔄 Add to Oracle System

### Option A: Use the Mnemonic (Recommended)

1. Copy the mnemonic from `export` output
2. Update `zcash-addresses-controlled.json` with the new mnemonic
3. Run: `npm run generate:addresses` to regenerate addresses

### Option B: Manual Entry

1. Copy addresses from `list` command
2. Get spending keys from `export` output
3. Add to `zcash-addresses-controlled.json` manually

---

## ✅ Verify

After adding addresses:

1. Restart Oracle service (if running)
2. Check wallet interface: http://localhost:3000/wallet
3. Verify new addresses appear

---

## 🎯 Quick Commands

**Connect zecwallet-cli:**
```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

**In zecwallet-cli:**
```bash
new z    # Generate z-address
list     # List addresses
export   # Export wallet
```

---

**Ready to go!** Open a new terminal and run `zecwallet-cli --server http://127.0.0.1:9067`

