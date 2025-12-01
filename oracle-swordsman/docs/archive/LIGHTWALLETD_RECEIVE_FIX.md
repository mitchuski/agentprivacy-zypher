# Fix: Z-Wallets Not Receiving ZEC (lightwalletd Issue)

## The Problem

You generated addresses using `zecwallet-cli` (which is correct), but they're not receiving ZEC. Since you're using lightwalletd, the issue is likely that **the wallet isn't monitoring your addresses**.

## Key Insight

When you generate addresses with `zecwallet-cli --server http://127.0.0.1:9067`, those addresses are stored in **zecwallet-cli's wallet database**. However:

1. **If lightwalletd restarts** → The wallet connection is lost
2. **If zecwallet-cli restarts** → The wallet needs to be reloaded
3. **If the wallet isn't loaded** → Addresses aren't being monitored

## Diagnostic Steps

### Step 1: Run Diagnostic Script

```powershell
cd oracle-swordsman
.\scripts\diagnostics\check-lightwalletd-receive.ps1
```

This will check:
- ✅ lightwalletd is running
- ✅ lightwalletd is synced
- ✅ Zebra is running
- ✅ Addresses are in your address file

### Step 2: Check if Wallet is Monitoring Addresses

```powershell
# Connect to zecwallet-cli
zecwallet-cli --server http://127.0.0.1:9067

# In zecwallet-cli:
list          # Do your addresses appear here?
balance       # What's the balance?
```

**If addresses don't appear in `list`:**
- The wallet isn't monitoring them
- You need to import the wallet/mnemonic

## Solutions

### Solution 1: Import Wallet into zecwallet-cli (RECOMMENDED)

If you have the **mnemonic** from when you generated addresses:

```powershell
# Connect to zecwallet-cli
zecwallet-cli --server http://127.0.0.1:9067

# In zecwallet-cli:
import        # Import wallet
# Then paste your mnemonic when prompted
list          # Verify addresses appear
```

### Solution 2: Import Wallet Export

If you have the **export** from when you generated addresses:

```powershell
# Save export to file
# Then import it
zecwallet-cli --server http://127.0.0.1:9067

# In zecwallet-cli:
import        # Import wallet
# Paste the export JSON when prompted
list          # Verify addresses appear
```

### Solution 3: Add Spending Keys Back

You mentioned you can add spending keys back. This is important!

1. **Add spending keys to address file:**
   ```powershell
   # Edit zcash-addresses-controlled.json
   # Add "spendingKey" field to each z-address entry
   ```

2. **Import addresses with spending keys:**
   ```powershell
   # Use the import script
   .\scripts\key-generation\parse-zecwallet-export.ps1
   ```

3. **Reload wallet in zecwallet-cli:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067
   # Then: import (with mnemonic or export)
   ```

## Common Issues

### Issue 1: lightwalletd Not Synced

**Symptom:** Addresses can't receive funds even if properly imported

**Fix:**
```powershell
# Check lightwalletd logs
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 50

# Look for:
# - "Sync complete" or "Server ready"
# - Recent block heights

# If still syncing, wait for it to complete
```

### Issue 2: Wallet Not Persisted

**Symptom:** Addresses disappear after restarting zecwallet-cli

**Fix:**
- Always import mnemonic/export when starting zecwallet-cli
- Or use `--data-dir` to specify persistent wallet location:
  ```powershell
  zecwallet-cli --server http://127.0.0.1:9067 --data-dir "$env:USERPROFILE\zecwallet-data"
  ```

### Issue 3: lightwalletd Connection Lost

**Symptom:** zecwallet-cli can't connect to lightwalletd

**Fix:**
```powershell
# 1. Check lightwalletd is running
Get-Process lightwalletd

# 2. Check HTTP endpoint
Invoke-WebRequest -Uri "http://127.0.0.1:8080" -Method Get

# 3. Restart lightwalletd if needed
.\scripts\setup\start-lightwalletd-manual.ps1
```

## Verification Steps

After applying fixes:

1. **Check wallet has addresses:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067
   list          # Should show your addresses
   ```

2. **Check lightwalletd is synced:**
   ```powershell
   Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20
   # Should show "Sync complete" or recent block heights
   ```

3. **Test with small amount:**
   - Send a small test amount (0.0001 ZEC) to one address
   - Wait for confirmation
   - Check balance in zecwallet-cli: `balance`

## Quick Checklist

- [ ] lightwalletd is running
- [ ] lightwalletd is synced
- [ ] Zebra is running
- [ ] zecwallet-cli can connect to lightwalletd
- [ ] Addresses appear in `zecwallet-cli list`
- [ ] Spending keys are in address file (or wallet has mnemonic)
- [ ] Wallet is loaded in zecwallet-cli

## Summary

**Most likely issue:** The wallet (zecwallet-cli) isn't monitoring your addresses because:
1. The wallet wasn't imported/reloaded after restart
2. The mnemonic/export wasn't used to load the wallet
3. lightwalletd isn't fully synced

**Quick fix:**
1. Ensure lightwalletd is running and synced
2. Import wallet into zecwallet-cli using mnemonic or export
3. Verify addresses appear in `list` command
4. Add spending keys back to address file if needed

---

**Last Updated:** 2025-01-XX


