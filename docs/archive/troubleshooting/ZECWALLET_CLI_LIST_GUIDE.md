# zecwallet-cli `list` Command Guide

## What to Expect

When you run `list` in zecwallet-cli, you should see output like:

```
Addresses:
  zs1abc123def456... (shielded)
  zs1xyz789uvw012... (shielded)
  t1ghi345jkl678... (transparent)
```

Or it might show more details:
```
Address 0: zs1abc123def456... (shielded, balance: 0.0)
Address 1: zs1xyz789uvw012... (shielded, balance: 0.0)
Address 2: t1ghi345jkl678... (transparent, balance: 0.0)
```

## What to Check

### ✅ If Your Addresses Appear

**Good news!** The wallet is monitoring your addresses. This means:

1. ✅ Addresses are in the wallet database
2. ✅ Wallet is connected to lightwalletd
3. ✅ Wallet should be able to detect received funds

**Next steps:**
1. Check `balance` command to see current balances
2. Verify addresses match your `zcash-addresses-controlled.json` file
3. If addresses can receive but you're not seeing funds:
   - Check lightwalletd is fully synced
   - Wait for confirmations (may take a few minutes)
   - Check `balance` command again

### ❌ If Your Addresses DON'T Appear

**This is the problem!** The wallet isn't monitoring your addresses. This means:

1. ❌ Wallet database doesn't have your addresses
2. ❌ Wallet needs to be imported/reloaded
3. ❌ Addresses won't receive funds until wallet is loaded

**Fix: Import the wallet**

#### Option A: Import with Mnemonic

If you have the mnemonic from when you generated addresses:

```bash
# In zecwallet-cli:
import
# Then paste your mnemonic (24 words) when prompted
list          # Verify addresses appear now
```

#### Option B: Import with Export Data

If you have the export JSON from when you generated addresses:

```bash
# In zecwallet-cli:
import
# Then paste the export JSON when prompted
list          # Verify addresses appear now
```

#### Option C: Generate New Wallet

If you don't have mnemonic/export, you'll need to generate new addresses:

```bash
# In zecwallet-cli:
new z         # Generate new z-address
new z         # Generate more as needed
list          # List new addresses
export        # SAVE THIS OUTPUT! (contains mnemonic)
```

## Common Output Scenarios

### Scenario 1: Empty List

```
Addresses:
(empty)
```

**Meaning:** No addresses in wallet  
**Fix:** Import wallet with mnemonic or export data

### Scenario 2: Different Addresses

```
Addresses:
  zs1different123... (shielded)
  zs1different456... (shielded)
```

**Meaning:** Wallet has different addresses (from different mnemonic)  
**Fix:** Import the correct mnemonic/export that matches your address file

### Scenario 3: Some Addresses Missing

```
Addresses:
  zs1abc123... (shielded)      # ✅ This one appears
  # Missing: zs1xyz789...      # ❌ This one doesn't
```

**Meaning:** Only some addresses are in the wallet  
**Fix:** Import the complete wallet (all addresses should be in the same wallet)

### Scenario 4: Connection Error

```
Error: Could not connect to server
```

**Meaning:** lightwalletd is not running or not accessible  
**Fix:**
1. Check lightwalletd is running: `Get-Process lightwalletd`
2. Start lightwalletd if needed: `.\scripts\setup\start-lightwalletd-manual.ps1`
3. Wait for sync, then reconnect

## Verification Steps

After running `list`:

1. **Count addresses:**
   - Compare count with your `zcash-addresses-controlled.json`
   - Should match (or be more if you generated extras)

2. **Verify address format:**
   - Z-addresses should start with `zs1` (mainnet)
   - T-addresses should start with `t1` (mainnet)
   - Length: z-addresses ~78 chars, t-addresses ~34 chars

3. **Check balances:**
   ```bash
   balance       # Check total balance
   ```

4. **Match with address file:**
   - Compare addresses from `list` with `zcash-addresses-controlled.json`
   - They should match exactly

## Troubleshooting

### `list` Command Not Found

If `list` doesn't work, try:
- `addresses` (some versions use this)
- `show` (alternative command)
- Check zecwallet-cli version: `version`

### Addresses Appear But Balance is 0

This is normal if:
- No funds have been sent yet
- Funds are still confirming (check `balance` again after a few minutes)
- lightwalletd is still syncing (check logs)

### Addresses Don't Match Address File

**Problem:** Addresses in wallet don't match your `zcash-addresses-controlled.json`

**Fix:**
1. Import the correct mnemonic that matches your address file
2. Or update address file with addresses from wallet
3. Make sure you're using the same mnemonic everywhere

## Quick Reference

```bash
# Connect to zecwallet-cli
zecwallet-cli --server http://127.0.0.1:9067

# In zecwallet-cli:
list          # List all addresses
balance       # Check balance
import        # Import wallet (mnemonic or export)
export        # Export wallet (save this!)
new z         # Generate new z-address
new t         # Generate new t-address
```

## Next Steps After `list`

### If Addresses Appear ✅

1. ✅ Wallet is monitoring addresses
2. ✅ Can receive funds
3. ⚠️  Check lightwalletd sync status
4. ⚠️  Add spending keys to address file if missing
5. ✅ Test with small amount to verify

### If Addresses Don't Appear ❌

1. ❌ Import wallet with mnemonic/export
2. ❌ Verify addresses appear after import
3. ❌ Check lightwalletd is synced
4. ✅ Then test receiving funds

---

**Last Updated:** 2025-01-XX


