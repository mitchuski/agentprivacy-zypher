# Fix: "Unknown consensus branch ID" Error During Rescan

## Problem

When running `rescan 3150150`, you get:
```
Error parsing Transaction: invalid consensus branch id: Unknown consensus branch ID
```

## Root Cause

This error occurs when zecwallet-cli encounters blocks that use consensus rules it doesn't recognize. This can happen if:
1. The wallet version doesn't support all consensus branches
2. Scanning across a network upgrade boundary
3. Block range includes unsupported consensus rules

## Solutions

### Solution 1: Rescan from Sapling Activation (Recommended)

Try rescanning from Sapling activation (block 419200), which is a stable starting point:

```bash
rescan 419200
```

This will scan from Sapling activation to current, which should handle all consensus branches properly.

### Solution 2: Rescan from Current Block

Since you're at block 3149185, try rescanning from your current position:

```bash
rescan 3149185
```

This will scan forward from where you are now.

### Solution 3: Rescan Without Block Number

Try a full rescan without specifying a block:

```bash
rescan
```

This will rescan from the beginning, which might handle consensus branches better.

### Solution 4: Check zecwallet-cli Version

The error might be due to an outdated zecwallet-cli version. Check your version:

```bash
# In zecwallet-cli
version
# or
help
```

If it's very old, you might need to update zecwallet-cli.

### Solution 5: Use Different Block Range

Try rescanning in smaller chunks:

```bash
# Rescan from a block well before your transaction
rescan 3150000
```

Or try from block 3150100 (closer to your transaction):

```bash
rescan 3150100
```

## Recommended Approach

1. **First, try Solution 1** (rescan from Sapling):
   ```bash
   rescan 419200
   ```
   This is the most reliable starting point.

2. **If that fails, try Solution 2** (from current block):
   ```bash
   rescan 3149185
   ```

3. **If still failing, check your zecwallet-cli version** and consider updating it.

## Expected Behavior

After a successful rescan:
- No consensus branch errors
- Progress shows blocks being scanned
- Eventually completes and shows balance as verified

## Note About the Error

The error appeared at batch 3/7, which suggests it was scanning blocks around:
- Batch 0: Blocks ~3150150-3149150
- Batch 1: Blocks ~3149150-3148150  
- Batch 2: Blocks ~3148150-3147150
- Batch 3: Blocks ~3147150-3146150 ← **Error here**

The error is likely in an older block range, not near your transaction. Rescanning from Sapling (419200) should avoid this issue since it's a known stable point.

---

**Try `rescan 419200` first - this should work around the consensus branch issue!**

