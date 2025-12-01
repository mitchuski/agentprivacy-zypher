# Fix: Unverified Balance at Correct Block Height

## Problem

- ✅ Wallet is at correct block height (3150152+)
- ✅ Transaction is confirmed (602 confirmations)
- ❌ Balance still shows as `unverified_zbalance`
- ❌ `verified_zbalance` is still 0

## Root Causes

### 1. Wallet Needs to Rescan

Even though you're at the right block height, the wallet might not have **scanned** that block with your viewing key yet.

### 2. Viewing Key Mismatch

The viewing key you imported might not match the address that received the transaction.

### 3. Transaction Not Decrypted

The wallet needs to decrypt the transaction using the viewing key to verify it.

## Solutions

### Solution 1: Force Rescan (Most Likely Fix)

In zecwallet-cli, try:

```bash
# Rescan from a specific block (use block before your transaction)
rescan 3150150

# Or rescan from Sapling activation
rescan 419200

# Or just rescan (from beginning)
rescan
```

**Note:** Rescanning can take a while. Let it run in the background.

### Solution 2: Check Viewing Key Matches Address

1. **Get the receiving address from transaction:**
   - Check the transaction on explorer
   - Note which z-address received the funds

2. **Verify viewing key matches:**
   - The viewing key you imported should correspond to that address
   - If you imported the wrong viewing key, import the correct one

3. **Re-import correct viewing key:**
   ```bash
   import-viewing-key <correct_viewing_key>
   rescan 3150150  # Rescan after importing
   ```

### Solution 3: Check Transaction Details

In zecwallet-cli:

```bash
# List all transactions
list

# Check if transaction appears
# If it doesn't appear, the viewing key might be wrong
```

### Solution 4: Sync Status

Check if wallet is fully synced:

```bash
# In zecwallet-cli
status
# or
info
```

Make sure it shows you're fully synced, not just at the right height.

## Quick Diagnostic Commands

Run these in zecwallet-cli:

```bash
# 1. Check current block
# (Look at prompt: Block:3150152)

# 2. Check balance
balance

# 3. List transactions
list

# 4. Check addresses
addresses
# or
list addresses

# 5. Try rescan
rescan 3150150
```

## Expected Behavior After Rescan

Once rescan completes:
- `unverified_zbalance` → Should decrease
- `verified_zbalance` → Should increase to match
- `spendable_zbalance` → Should show the amount
- Transaction should appear in `list` command

## If Rescan Doesn't Work

1. **Verify viewing key is correct:**
   - Check your address file for the viewing key
   - Make sure it matches the address that received the transaction

2. **Re-import viewing key:**
   ```bash
   import-viewing-key <viewing_key>
   rescan 3150150
   ```

3. **Check lightwalletd is synced:**
   ```powershell
   Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 10
   ```

4. **Restart zecwallet-cli:**
   - Exit zecwallet-cli
   - Reconnect: `zecwallet-cli --server http://127.0.0.1:9067`
   - Re-import viewing key
   - Rescan

---

**Most likely fix: Run `rescan 3150150` in zecwallet-cli to force it to scan that block with your viewing key!**

