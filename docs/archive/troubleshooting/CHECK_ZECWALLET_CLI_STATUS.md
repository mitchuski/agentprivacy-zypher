# How to Check zecwallet-cli Sync Status

## Quick Methods

### Method 1: Look at the Prompt (Easiest)

The block number is shown directly in the zecwallet-cli prompt:

```
(main) Block:3149185 (type 'help') >>
```

**The number after `Block:` is your current block height.**

- Current: `Block:3149185`
- Target: `Block:3150152` (your transaction)
- Need to sync: **967 blocks**

### Method 2: Use Commands in zecwallet-cli

In your zecwallet-cli terminal, try:

```bash
# Check status
status

# Get wallet info
info

# Show help (lists all commands)
help

# Check balance (also shows sync info)
balance
```

### Method 3: Check if Transaction is Visible

```bash
# List transactions
list

# If your transaction appears, you're synced enough
```

## What to Look For

### ✅ Wallet is Syncing

- Block number in prompt increases over time
- `Block:3149185 → 3149200 → ... → 3150152`
- No errors in the terminal

### ❌ Wallet is Stuck

- Block number doesn't change
- Errors appear in terminal
- Connection issues

## Expected Sync Rate

- **~75 seconds per block** (Zcash block time)
- **967 blocks** ≈ **20-24 hours** to sync
- But zecwallet-cli syncs faster than this (processes multiple blocks)

## Quick Status Check

**Just look at your zecwallet-cli prompt:**

```
(main) Block:3149185 (type 'help') >>
```

Compare to:
- **Zebrad**: Block 3150785
- **Your transaction**: Block 3150152
- **Current**: Block 3149185
- **Behind by**: 967 blocks

## Tips

1. **Keep zecwallet-cli running** - It syncs automatically
2. **Watch the prompt** - Block number should increase
3. **Be patient** - Syncing 967 blocks takes time
4. **Once at 3150152+**, check balance - transaction should appear

---

**The easiest way: Just look at the `Block:` number in your zecwallet-cli prompt!**

