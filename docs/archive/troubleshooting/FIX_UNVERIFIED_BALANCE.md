# Fix: Unverified Balance (Transaction Already Confirmed)

## Problem

Your transaction shows:
- ✅ **602 confirmations** on blockchain explorer
- ✅ **Block height: 3150152**
- ❌ **Still showing as "unverified"** in zecwallet-cli
- ❌ **zecwallet-cli is at block: 3150096** (56 blocks behind!)

## Root Cause

**zecwallet-cli hasn't synced to the block containing your transaction yet.**

- Transaction is in block **3150152**
- zecwallet-cli is at block **3150096**
- Need to sync **56 more blocks**

## Solution: Let zecwallet-cli Sync

### Option 1: Wait for Automatic Sync (Recommended)

zecwallet-cli will automatically sync when connected to lightwalletd. Just:

1. **Keep zecwallet-cli running** (connected to lightwalletd)
2. **Wait a few minutes** - It will sync blocks automatically
3. **Check balance again** - Run `balance` command periodically

The sync happens in the background. You'll see the balance update once it catches up.

### Option 2: Force Rescan (If Needed)

If it's been a while and still not synced, you can try:

```bash
# In zecwallet-cli:
rescan
# or
sync
```

### Option 3: Check Sync Status

```bash
# In zecwallet-cli:
status
# or
info
# or check the block number shown in prompt
```

The prompt shows: `Block:3150096` - this should increase as it syncs.

## Why This Happens

1. **lightwalletd syncs from zebrad** - Needs to catch up to current block
2. **zecwallet-cli syncs from lightwalletd** - Needs to process blocks
3. **First sync takes time** - Especially if starting from an old block

## Expected Behavior

Once synced:
- `unverified_zbalance` → `verified_zbalance`
- `spendable_zbalance` will show the amount
- Transaction will appear in `list` command

## Check Progress

In zecwallet-cli, watch the block number in the prompt:
```
(main) Block:3150096 → Block:3150100 → ... → Block:3150152 ✅
```

Once it reaches **3150152** or higher, your transaction will be verified!

---

**Your transaction is confirmed on the blockchain - just need to wait for the wallet to sync!**

