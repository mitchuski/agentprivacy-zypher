# Fix: Consensus Branch Error - Wallet Needs to Sync First

## Problem

- Current block: **3149185**
- Transaction block: **3150152**
- **You're 967 blocks behind!**

The consensus branch error occurs because the wallet is trying to rescan blocks it hasn't fully synced to yet, or there's a version mismatch.

## Root Cause

The wallet needs to **sync forward** to block 3150152+ before it can properly verify transactions in that block range. Rescanning while behind can cause consensus branch errors.

## Solutions

### Solution 1: Let Wallet Sync Forward Naturally (Recommended)

**Stop rescanning** and let the wallet sync forward automatically:

1. **Don't run any rescan commands**
2. **Keep zecwallet-cli running** (connected to lightwalletd)
3. **Watch the block number in the prompt** - it should increase:
   ```
   Block:3149185 → 3149200 → ... → 3150152 ✅
   ```
4. **Once it reaches 3150152 or higher**, check balance:
   ```bash
   balance
   ```
5. **If balance still unverified**, then try rescan:
   ```bash
   rescan 3150150
   ```

### Solution 2: Check lightwalletd Sync Status

The wallet syncs from lightwalletd, which syncs from zebrad. Check if lightwalletd is fully synced:

```powershell
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20
```

Look for:
- Current block height
- Any sync errors
- Make sure lightwalletd is at block 3150152+

### Solution 3: Try Rescan from Future Block

If you want to force it, try rescanning from a block that's definitely after the problematic range:

```bash
# Try rescanning from a block well after your transaction
rescan 3150200
```

This might avoid the consensus branch issue.

### Solution 4: Check zecwallet-cli Version

The consensus branch error might indicate an outdated zecwallet-cli version. Check:

```bash
# In zecwallet-cli
version
```

If it's very old, consider updating zecwallet-cli.

### Solution 5: Skip Problematic Blocks

If the error is in a specific block range, you might need to:
1. Wait for wallet to sync past that range
2. Then rescan from a block after the problematic range

## Recommended Approach

**Best solution: Let it sync naturally**

1. ✅ **Stop running rescan commands**
2. ✅ **Keep zecwallet-cli running**
3. ✅ **Wait for block number to reach 3150152+**
4. ✅ **Check balance** - it might verify automatically
5. ✅ **If still unverified, then rescan from 3150150**

## Why This Happens

- zecwallet-cli syncs blocks from lightwalletd
- It processes blocks sequentially
- Rescanning while behind can cause issues with consensus branch detection
- The wallet needs to be at or past the transaction block to properly verify it

## Expected Timeline

- **967 blocks to sync** ≈ 20-30 minutes (at ~75 seconds per block)
- **Watch the prompt** - block number should increase
- **Once at 3150152+**, the transaction should be visible

---

**Stop rescanning and let the wallet sync forward to block 3150152+ first!**

