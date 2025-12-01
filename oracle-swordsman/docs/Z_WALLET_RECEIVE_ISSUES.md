# Z-Wallet Receive Issues - Diagnostic Guide

## Why Your Z-Wallets Might Not Receive ZEC

### Issue 1: Simplified Address Generation ⚠️ **MOST LIKELY**

**Problem:**
Your Z-addresses were generated using a simplified method that may not be fully compatible with the Zcash network.

**Evidence:**
- See `docs/Z_ADDRESS_SIMPLIFIED_METHOD.md`
- Addresses look correct (zs1 prefix, right length) but may not work for receiving funds

**Solution:**
Regenerate addresses using proper Zcash tools:

```powershell
# Option 1: Use zecwallet-cli (RECOMMENDED)
zecwallet-cli --server http://127.0.0.1:9067
# Then in zecwallet-cli:
new z          # Generate proper z-address
list           # List all addresses
export         # Export wallet (SAVE THIS!)

# Option 2: Use Zebra RPC (if available)
# Via RPC call to zebrad
```

**After regenerating:**
1. Import addresses using `scripts/key-generation/parse-zecwallet-export.ps1`
2. Update `zcash-addresses-controlled.json` with proper addresses
3. Restart oracle service

---

### Issue 2: Missing Spending Keys 🔑

**Problem:**
Your address file shows `"privateKeysRemoved": true`, meaning spending keys are not available.

**Impact:**
- ✅ Addresses CAN receive ZEC (if properly generated)
- ❌ Wallet CANNOT detect received funds without spending keys
- ❌ Wallet CANNOT spend funds without spending keys

**Solution:**
1. If you have the mnemonic, regenerate addresses with spending keys
2. If you have zecwallet-cli export, import it with spending keys
3. Store spending keys securely (environment variables, secret management)

**Check:**
```powershell
# Check if spending keys are in your address file
Get-Content oracle-swordsman\zcash-addresses-controlled.json | Select-String "spendingKey"
```

---

### Issue 3: Wallet Not Monitoring Addresses 👁️

**Problem:**
Addresses may not be imported into the wallet (zecwallet-cli or lightwalletd).

**Check:**
```powershell
# Check if lightwalletd is running
Get-Process lightwalletd

# Check if addresses are in wallet
zecwallet-cli --server http://127.0.0.1:9067
# Then: list
```

**Solution:**
1. Import addresses into zecwallet-cli using the mnemonic or export
2. Ensure lightwalletd is running and synced
3. Verify addresses appear in `list` command

---

### Issue 4: Network Mismatch 🌐

**Problem:**
Addresses are marked "mainnet" but wallet/lightwalletd might be on testnet (or vice versa).

**Check:**
```powershell
# Check lightwalletd network
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20 | Select-String "network"

# Check config
Get-Content oracle-swordsman\.env | Select-String "ZCASH_NETWORK"
```

**Solution:**
Ensure all components use the same network:
- `ZCASH_NETWORK=mainnet` in `.env`
- lightwalletd configured for mainnet
- Addresses marked as "mainnet"

---

### Issue 5: lightwalletd Not Synced ⏳

**Problem:**
lightwalletd must be fully synced before it can detect transactions.

**Check:**
```powershell
# Check lightwalletd logs
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 50

# Look for:
# - "Connected to Zebra"
# - "Sync complete" or "Server ready"
# - Recent block heights
```

**Solution:**
1. Wait for lightwalletd to sync (may take several minutes)
2. Ensure Zebra (zebrad) is running and synced
3. Check that lightwalletd can connect to Zebra RPC (port 8233 for mainnet)

---

## Quick Diagnostic Steps

### Step 1: Verify Address Format
```powershell
# Check if addresses are valid format
$address = "zs1..." # Your z-address
if ($address -match "^zs1[a-z0-9]{76}$") {
    Write-Host "✅ Format looks correct"
} else {
    Write-Host "❌ Format incorrect"
}
```

### Step 2: Check Wallet Status
```powershell
# Check lightwalletd
Get-Process lightwalletd -ErrorAction SilentlyContinue

# Check Zebra
Get-Process zebrad -ErrorAction SilentlyContinue

# Test lightwalletd HTTP
Invoke-WebRequest -Uri "http://127.0.0.1:8080" -Method Get
```

### Step 3: Test Address in Wallet
```powershell
# Connect to wallet
zecwallet-cli --server http://127.0.0.1:9067

# In zecwallet-cli:
list           # Check if your addresses appear
balance        # Check balance
```

### Step 4: Verify Network
```powershell
# Check config
Get-Content oracle-swordsman\.env | Select-String "ZCASH_NETWORK"

# Should show: ZCASH_NETWORK=mainnet
```

---

## Recommended Fix (Priority Order)

### 1. **Regenerate Addresses Properly** (HIGHEST PRIORITY)
```powershell
# Use zecwallet-cli to generate proper addresses
zecwallet-cli --server http://127.0.0.1:9067
# Generate addresses with: new z
# Export with: export
# Import using: scripts/key-generation/parse-zecwallet-export.ps1
```

### 2. **Import Spending Keys**
- If you have mnemonic: regenerate addresses with spending keys
- If you have export: import it with `parse-zecwallet-export.ps1`
- Store spending keys securely

### 3. **Verify Wallet Sync**
- Ensure lightwalletd is running and synced
- Ensure Zebra is running and synced
- Wait for full sync before testing

### 4. **Test with Small Amount**
- Send a small test amount (0.0001 ZEC) to one address
- Wait for confirmation
- Check if wallet detects it

---

## Testing After Fix

1. **Send test transaction:**
   ```powershell
   # Use a test wallet to send small amount
   # Or use a faucet if on testnet
   ```

2. **Monitor wallet:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067
   # Then: list
   # Look for incoming transaction
   ```

3. **Check balance:**
   ```powershell
   # In zecwallet-cli:
   balance
   ```

---

## Summary

**Most likely issues:**
1. ⚠️ Simplified address generation (addresses may not work)
2. 🔑 Missing spending keys (can't detect/spend funds)
3. 👁️ Wallet not monitoring addresses (not imported)

**Quick fix:**
1. Regenerate addresses using `zecwallet-cli` (proper method)
2. Import with spending keys
3. Verify wallet is synced and monitoring addresses

---

**Last Updated:** 2025-01-XX


