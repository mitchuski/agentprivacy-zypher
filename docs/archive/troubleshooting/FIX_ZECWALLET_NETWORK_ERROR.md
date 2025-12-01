# Fix: zecwallet-cli "Couldn't get network" Error

## Problem

When running `zecwallet-cli` (without --server flag), you get:
```
thread 'main' panicked at 'Couldn't get network'
```

## Root Cause

zecwallet-cli needs to detect the network from lightwalletd, but:
1. lightwalletd must be fully synced with zebrad
2. lightwalletd's `GetLightdInfo` gRPC endpoint must be working
3. The connection must be established

## Solution

### Step 1: Ensure lightwalletd is Running and Synced

```powershell
# Check if running
Get-Process lightwalletd

# Check logs
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20
```

Look for:
- ✅ "Got sapling height" - Connected to zebrad
- ✅ "Starting gRPC server" - Ready for connections
- ❌ "error with getblockchaininfo" - Still syncing (wait longer)

### Step 2: Wait for Sync

lightwalletd needs to query zebrad to get network info. Wait until logs show:
- No more "error with getblockchaininfo" messages
- "Starting gRPC server" message appears

### Step 3: Use --server Flag

**Always specify the server explicitly:**

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

**Or with network specified:**

```powershell
zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
```

### Step 4: If Still Failing

If it still fails after lightwalletd is synced:

1. **Check lightwalletd can respond:**
   ```powershell
   # Test HTTP endpoint (should return 404, but connection works)
   Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing
   ```

2. **Restart lightwalletd:**
   ```powershell
   Stop-Process -Name lightwalletd -Force
   # Then restart using the script
   .\scripts\setup\start-lightwalletd.ps1
   ```

3. **Use public server temporarily:**
   ```powershell
   zecwallet-cli --server https://lwdv3.zecwallet.co
   ```

## Current Status

- ✅ **Zebrad**: Running and RPC accessible
- ✅ **lightwalletd**: Restarted, waiting for sync
- ⏳ **zecwallet-cli**: Will work once lightwalletd is synced

## Next Steps

1. **Wait for lightwalletd to sync** (watch logs)
2. **Try zecwallet-cli again** with `--server` flag
3. **Import viewing keys** once connected
4. **Verify transaction** is visible

---

**The key is: Always use `--server http://127.0.0.1:9067` flag when connecting!**

