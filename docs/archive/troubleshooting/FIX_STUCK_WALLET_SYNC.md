# Fix: zecwallet-cli Block Number Not Updating

## Problem

The block number in the zecwallet-cli prompt is not increasing:
```
(main) Block:3149185 (type 'help') >>
```
The number stays the same even after waiting.

## Root Causes

1. **zecwallet-cli not receiving blocks from lightwalletd**
2. **lightwalletd not running or not synced**
3. **Connection issue between zecwallet-cli and lightwalletd**
4. **zecwallet-cli waiting for something (stuck)**
5. **Network/consensus issue**

## Diagnostic Steps

### Step 1: Check if zecwallet-cli is Responsive

In your zecwallet-cli terminal, try:
```bash
help
```

- **If it responds**: Wallet is running but not syncing
- **If it doesn't respond**: Wallet might be frozen

### Step 2: Check lightwalletd Status

```powershell
# Check if running
Get-Process lightwalletd

# Check logs
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20
```

Look for:
- ✅ "Adding block to cache" - lightwalletd is syncing
- ✅ Recent timestamps - lightwalletd is active
- ❌ "error" or "fatal" - lightwalletd has issues

### Step 3: Check Connection

```powershell
# Test gRPC port
Test-NetConnection -ComputerName localhost -Port 9067
```

Should show port is open.

### Step 4: Check Zebrad Status

```powershell
Get-Process zebrad
```

Zebrad must be running for lightwalletd to work.

## Solutions

### Solution 1: Restart zecwallet-cli (Most Common Fix)

1. **Exit zecwallet-cli:**
   - Press `Ctrl+C` or type `exit`

2. **Restart:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
   ```

3. **Re-import viewing key:**
   ```bash
   import-viewing-key zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c
   ```

4. **Watch the prompt** - Block number should start increasing

### Solution 2: Restart lightwalletd

If lightwalletd is not syncing:

```powershell
# Stop lightwalletd
Stop-Process -Name lightwalletd -Force -ErrorAction SilentlyContinue

# Restart (using your script or manually)
$configPath = "$env:USERPROFILE\.config\zcash.conf"
$dataDir = "$env:USERPROFILE\lightwalletd-data"
Start-Process -FilePath "lightwalletd.exe" `
  -ArgumentList @(
    "--zcash-conf-path", $configPath,
    "--data-dir", $dataDir,
    "--log-file", "$dataDir\lightwalletd.log",
    "--grpc-bind-addr", "127.0.0.1:9067",
    "--http-bind-addr", "127.0.0.1:8080",
    "--no-tls-very-insecure",
    "--nocache"
  ) `
  -WindowStyle Minimized

# Wait a few seconds
Start-Sleep -Seconds 5

# Check if started
Get-Process lightwalletd
```

Then restart zecwallet-cli.

### Solution 3: Check for Errors

Look at your zecwallet-cli terminal for:
- Connection errors
- Network errors
- Consensus errors
- Any red text or error messages

### Solution 4: Force Sync Command

In zecwallet-cli, try:
```bash
sync
```

Some versions have a sync command that forces a sync.

### Solution 5: Use Public Server (Temporary Test)

To test if it's a local setup issue:

```powershell
# Exit current zecwallet-cli
# Then start with public server:
zecwallet-cli --server https://lwdv3.zecwallet.co --network mainnet
```

If this works, the issue is with your local lightwalletd setup.

## Expected Behavior After Fix

Once working:
- Block number should increase: `Block:3149185 → 3149190 → ...`
- Should sync toward current network height (~3150785)
- Eventually reach your transaction block (3150152)

## Quick Fix Checklist

1. ✅ **Check zecwallet-cli responds** (`help` command)
2. ✅ **Check lightwalletd is running**
3. ✅ **Check lightwalletd is syncing** (logs show "Adding block")
4. ✅ **Restart zecwallet-cli** with `--network mainnet`
5. ✅ **Re-import viewing key**
6. ✅ **Watch block number increase**

---

**Most likely fix: Restart zecwallet-cli with explicit `--network mainnet` flag!**

