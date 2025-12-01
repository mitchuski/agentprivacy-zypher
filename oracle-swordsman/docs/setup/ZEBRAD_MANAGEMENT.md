# Zebrad Node Management Guide

Complete guide for managing your zebrad (Zcash full node) for the Oracle Swordsman.

## Quick Reference

### Check if zebrad is running
```powershell
Get-Process zebrad -ErrorAction SilentlyContinue
```

### Start zebrad
```powershell
zebrad start
```

### Stop zebrad
```powershell
# Find the process ID first
$pid = (Get-Process zebrad).Id
Stop-Process -Id $pid -Force
```

### Check zebrad status
```powershell
# Check if process is running
Get-Process zebrad -ErrorAction SilentlyContinue | Select-Object Id, StartTime, CPU

# Check if RPC is accessible (if cookie file exists)
Test-Path "$env:LOCALAPPDATA\zebra\.cookie"
```

---

## Setup Steps

### 1. Enable RPC in zebrad

**Option A: Using config file (Recommended - Permanent)**

Config file location: `C:\Users\mitch\AppData\Roaming\zebrad.toml`

```toml
[network]
network = "Mainnet"

[rpc]
listen_addr = "127.0.0.1:8233"
enable_cookie_auth = true
cookie_dir = "C:\Users\mitch\AppData\Local\zebra"
```

**Option B: Using environment variable (Temporary)**

```powershell
$env:ZEBRA_RPC__LISTEN_ADDR = "127.0.0.1:8233"
zebrad start
```

### 2. Start zebrad

```powershell
# Start with default config (uses zebrad.toml if it exists)
zebrad start

# Or specify config file explicitly
zebrad -c "C:\Users\mitch\AppData\Roaming\zebrad.toml" start
```

### 3. Verify RPC is working

After starting zebrad, wait 5-10 seconds, then check:

```powershell
# Check if cookie file was created
Test-Path "$env:LOCALAPPDATA\zebra\.cookie"

# If it exists, RPC is enabled
if (Test-Path "$env:LOCALAPPDATA\zebra\.cookie") {
    Write-Host "RPC is enabled!" -ForegroundColor Green
    Get-Item "$env:LOCALAPPDATA\zebra\.cookie" | Select-Object FullName, LastWriteTime
}
```

---

## Common Tasks

### Start zebrad in background (detached)

```powershell
Start-Process zebrad -ArgumentList "start" -WindowStyle Hidden
```

### View zebrad logs

Zebrad logs to stdout. To capture logs:

```powershell
# Start with logging to file
zebrad start 2>&1 | Tee-Object -FilePath "zebrad.log"
```

### Check sync status

```powershell
# Using the Oracle's test script
npx ts-node test-zebra-direct.ts
```

Or manually check via RPC (once RPC is enabled):

```powershell
# Read cookie file
$cookie = Get-Content "$env:LOCALAPPDATA\zebra\.cookie" -Raw
$creds = $cookie.Trim().Split(':')
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds[0]):$($creds[1])"))

# Call RPC
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "getblockchaininfo"
    params = @()
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8233" `
    -Method Post `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Basic $auth"
    } `
    -Body $body

$response.result | ConvertTo-Json
```

### Restart zebrad

```powershell
# Stop
$pid = (Get-Process zebrad).Id
Stop-Process -Id $pid -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start again
zebrad start
```

---

## Troubleshooting

### Problem: Cookie file not found

**Symptoms:**
- `npx ts-node generate-keys.ts` fails with "Cookie file not found"
- RPC calls fail

**Solutions:**
1. Make sure zebrad is running: `Get-Process zebrad`
2. Check if RPC is enabled in config: `Get-Content "$env:APPDATA\zebrad.toml" | Select-String "rpc"`
3. Restart zebrad to pick up config changes
4. Wait 5-10 seconds after starting for cookie file to be created

### Problem: RPC connection refused

**Symptoms:**
- Cannot connect to `127.0.0.1:8233`
- Port is not listening

**Solutions:**
1. Verify RPC is enabled in config file
2. Check if port 8233 is in use: `Test-NetConnection -ComputerName 127.0.0.1 -Port 8233`
3. Make sure `listen_addr = "127.0.0.1:8233"` is in `[rpc]` section
4. Restart zebrad

### Problem: Zebrad won't start

**Symptoms:**
- Process exits immediately
- Error messages

**Solutions:**
1. Check for existing process: `Get-Process zebrad`
2. Check config file syntax: `zebrad generate` (generates example)
3. Check disk space (zebrad needs ~50GB for mainnet)
4. Check logs if available

### Problem: Slow sync

**Symptoms:**
- Blocks behind
- High CPU usage

**Solutions:**
1. This is normal - initial sync takes hours/days
2. Check progress: `getblockchaininfo` RPC call
3. Be patient - zebrad syncs in background
4. You can use it while syncing (just slower)

---

## Configuration File Locations

- **Windows Config:** `%APPDATA%\zebrad.toml` (usually `C:\Users\<user>\AppData\Roaming\zebrad.toml`)
- **Cookie File:** `%LOCALAPPDATA%\zebra\.cookie` (usually `C:\Users\<user>\AppData\Local\zebra\.cookie`)
- **Data Directory:** `%LOCALAPPDATA%\zebra` (blockchain state, etc.)

---

## Useful Commands Summary

```powershell
# Check if running
Get-Process zebrad -ErrorAction SilentlyContinue

# Start
zebrad start

# Stop
Stop-Process -Id (Get-Process zebrad).Id -Force

# Check RPC enabled
Test-Path "$env:LOCALAPPDATA\zebra\.cookie"

# View config
Get-Content "$env:APPDATA\zebrad.toml"

# Generate keys (after RPC is enabled)
npx ts-node generate-keys.ts
```

---

## Next Steps After Setup

Once zebrad is running with RPC enabled:

1. **Generate keys:**
   ```powershell
   npx ts-node generate-keys.ts
   ```

2. **Test connection:**
   ```powershell
   npx ts-node test-zebra-direct.ts
   ```

3. **Start Oracle service:**
   ```powershell
   npm run dev
   ```

