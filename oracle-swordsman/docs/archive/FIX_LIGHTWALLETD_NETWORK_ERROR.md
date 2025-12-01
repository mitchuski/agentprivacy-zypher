# Fix: zecwallet-cli "Couldn't get network" Error

## The Problem

When you run:
```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

You get:
```
thread 'main' panicked at 'Couldn't get network'
```

## Root Cause

This error means **lightwalletd can't detect the network** because:
1. lightwalletd isn't fully synced with Zebra yet
2. lightwalletd can't connect to Zebra RPC
3. lightwalletd hasn't finished initializing

## Solution Steps

### Step 1: Check Zebra is Running

```powershell
Get-Process zebrad
```

Should show zebrad process running.

### Step 2: Check Zebra RPC is Accessible

```powershell
# Check if Zebra is listening on RPC port
netstat -an | Select-String "127.0.0.1:8233" | Select-String "LISTENING"
```

If nothing shows, Zebra RPC might not be enabled. Check Zebra config.

### Step 3: Verify lightwalletd Config

```powershell
Get-Content "$env:USERPROFILE\.config\zcash.conf"
```

Should show:
```
rpcuser=__cookie__
rpcpassword=<password from cookie>
rpcbind=127.0.0.1
rpcport=8233
```

### Step 4: Restart lightwalletd and Wait for Sync

```powershell
# Stop existing lightwalletd
Stop-Process -Name lightwalletd -Force -ErrorAction SilentlyContinue

# Start fresh
$configPath = "$env:USERPROFILE\.config\zcash.conf"
$dataDir = "$env:USERPROFILE\lightwalletd-data"
lightwalletd.exe `
  --zcash-conf-path $configPath `
  --data-dir $dataDir `
  --log-file "$dataDir\lightwalletd.log" `
  --grpc-bind-addr 127.0.0.1:9067 `
  --http-bind-addr 127.0.0.1:8080 `
  --no-tls-very-insecure `
  --nocache
```

**Important:** Wait for lightwalletd to sync. Watch the logs:
```powershell
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20 -Wait
```

Look for:
- ✅ "Connected to Zebra"
- ✅ "Sync complete" or "Server ready"
- ❌ "error with getblockchaininfo" (means still syncing)

### Step 5: Try zecwallet-cli Again

Once lightwalletd is synced (no more errors in logs):

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

Should connect successfully.

## Alternative: Use Public Server (Temporary)

If local lightwalletd continues to have issues, you can use a public server:

```powershell
# Mainnet
zecwallet-cli --server https://lwdv3.zecwallet.co

# Then generate addresses and export them
# Import them into your local setup later
```

## Quick Diagnostic

Run this to check everything:

```powershell
# Check services
Write-Host "Zebra:" -ForegroundColor Yellow
Get-Process zebrad -ErrorAction SilentlyContinue

Write-Host "`nlightwalletd:" -ForegroundColor Yellow
Get-Process lightwalletd -ErrorAction SilentlyContinue

Write-Host "`nlightwalletd logs (last 5 lines):" -ForegroundColor Yellow
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 5 -ErrorAction SilentlyContinue

Write-Host "`nZebra RPC test:" -ForegroundColor Yellow
Test-NetConnection -ComputerName 127.0.0.1 -Port 8233 -InformationLevel Quiet
```

## Expected Timeline

- **First startup:** 2-5 minutes for lightwalletd to sync
- **Subsequent startups:** 30 seconds - 2 minutes (if cache works)
- **With --nocache:** Slower but avoids permission issues

## Common Issues

### Issue 1: "Access is denied" in logs

**Fix:** Use `--nocache` flag or run as Administrator

### Issue 2: "No connection could be made" to Zebra

**Fix:** 
1. Check Zebra is running
2. Check Zebra RPC is enabled (should listen on 127.0.0.1:8233)
3. Verify cookie file exists: `$env:LOCALAPPDATA\zebra\.cookie`

### Issue 3: lightwalletd keeps restarting

**Fix:** Check logs for fatal errors, may need to fix database permissions

## Summary

**The "Couldn't get network" error = lightwalletd not synced yet**

**Solution:**
1. ✅ Ensure Zebra is running
2. ✅ Restart lightwalletd
3. ⏳ **Wait for sync** (check logs)
4. ✅ Then connect zecwallet-cli

**Patience is key** - first sync takes a few minutes!

---

**Last Updated:** 2025-01-XX


