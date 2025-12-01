# Fix: zecwallet-cli Consensus Branch and Frozen Issues

## Problem

- zecwallet-cli might be frozen
- Transaction was sent to a Sapling z-address (zs1...)
- Need to ensure correct consensus branch

## Understanding Sapling Addresses

**Sapling z-addresses** (starting with `zs1`) have been active since:
- **Block 419200** (Sapling activation on mainnet)
- Your transaction is at block **3150152**, which is well after Sapling activation
- This should work fine - no special consensus branch needed

## Check if zecwallet-cli is Frozen

### Method 1: Check Process Status

```powershell
Get-Process zecwallet-cli -ErrorAction SilentlyContinue
```

If it shows a process, it's running (might just be slow).

### Method 2: Check if Block Number Changes

In your zecwallet-cli terminal:
- Watch the prompt: `(main) Block:3149185`
- Wait 1-2 minutes
- Check if the number increases
- If it doesn't change, it might be frozen

### Method 3: Try a Command

In zecwallet-cli, try:
```bash
help
```

If it responds, it's not frozen (just syncing slowly).
If it doesn't respond, it might be frozen.

## Fix: Ensure Correct Network and Consensus

### Step 1: Verify Network

Make sure you're connected to **mainnet**:

```powershell
# When starting zecwallet-cli, use:
zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
```

Or check in zecwallet-cli:
```bash
# The prompt should show:
(main) Block:XXXXX
# Not:
(test) Block:XXXXX
```

### Step 2: Restart zecwallet-cli with Correct Settings

If it's frozen or on wrong network:

1. **Exit zecwallet-cli** (Ctrl+C or type `exit`)

2. **Restart with explicit mainnet:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
   ```

3. **Re-import viewing key:**
   ```bash
   import-viewing-key zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c
   ```

4. **Let it sync** - Don't run rescan yet, just let it sync forward

### Step 3: Check lightwalletd Network

Verify lightwalletd is on mainnet:

```powershell
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 10 | Select-String -Pattern "chain|network|main"
```

Should show `"chain":"main"` or `"chainName":"main"`.

## If zecwallet-cli is Actually Frozen

### Option 1: Restart zecwallet-cli

1. **Kill the process:**
   ```powershell
   Stop-Process -Name zecwallet-cli -Force -ErrorAction SilentlyContinue
   ```

2. **Restart:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
   ```

3. **Re-import viewing key and let it sync**

### Option 2: Check for Errors

Look for error messages in the zecwallet-cli terminal:
- Connection errors
- Consensus branch errors
- Network errors

### Option 3: Use Public Server (Temporary)

If local setup continues to have issues:

```powershell
zecwallet-cli --server https://lwdv3.zecwallet.co --network mainnet
```

This connects to a public mainnet server.

## Consensus Branch for Sapling

**Good news:** Sapling addresses (zs1...) don't need special consensus branch handling:
- Sapling activated at block **419200** (mainnet)
- Your transaction is at block **3150152** (well after activation)
- Standard mainnet consensus should work

The consensus branch error you saw earlier was likely from:
- Scanning old blocks with different consensus rules
- Version mismatch in zecwallet-cli
- Not being on the right network

## Recommended Fix

1. **Restart zecwallet-cli with explicit mainnet:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
   ```

2. **Re-import viewing key**

3. **Let it sync naturally** - Don't rescan yet

4. **Once synced to 3150152+**, check balance

5. **If balance still unverified**, then try rescan from 3150150

---

**The key: Make sure you're on mainnet and let it sync forward naturally!**

