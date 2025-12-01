# Fixes Applied

## Issues Fixed

### 1. ✅ `--no-cache` Flag Error
**Problem:** `unknown flag: --no-cache`

**Fix:** Changed to `--nocache` (no dash) in `start-lightwalletd-manual.ps1`

The script now uses the correct flag automatically.

### 2. ⚠️ zecwallet-cli "Couldn't get network" Error
**Problem:** zecwallet-cli panics with "Couldn't get network"

**Cause:** lightwalletd is not running or not fully synced

**Solution:** Start lightwalletd first and wait for it to sync

---

## Current Status

❌ **lightwalletd:** Not running  
✅ **Zebra:** Running and synced  
✅ **Configuration:** Created  

---

## Next Steps

### Step 1: Start lightwalletd

The script is now fixed. Run:

```powershell
.\scripts\setup\start-lightwalletd-manual.ps1
```

This will:
- ✅ Use correct `--nocache` flag
- ✅ Start lightwalletd in foreground (so you can see output)
- ✅ Avoid database permission issues

### Step 2: Wait for Sync

Watch the terminal output. You should see:
- `Starting lightwalletd process`
- `Connected to Zebra`
- `Syncing blocks...` (may take a few minutes)
- `Server ready` or similar

**Important:** Wait until lightwalletd is fully synced before connecting zecwallet-cli.

### Step 3: Verify lightwalletd is Ready

In another terminal, test:

```powershell
# Test HTTP endpoint
Invoke-WebRequest -Uri "http://127.0.0.1:8080" -Method Get

# Test gRPC port
Test-NetConnection -ComputerName 127.0.0.1 -Port 9067
```

Both should succeed when lightwalletd is ready.

### Step 4: Connect zecwallet-cli

Once lightwalletd is synced:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

zecwallet-cli will automatically detect the network (mainnet) from lightwalletd.

### Step 5: Generate Addresses

In zecwallet-cli:

```bash
new z    # Generate z-address
new z    # Generate another
list     # List all addresses
export   # Export wallet (SAVE THIS!)
```

---

## Troubleshooting

### lightwalletd Still Has Permission Errors

1. **Run PowerShell as Administrator**
2. **Or use a different data directory:**
   ```powershell
   lightwalletd.exe --data-dir C:\lightwalletd-data ...
   ```

### zecwallet-cli Still Can't Get Network

1. **Make sure lightwalletd is fully synced** (check logs)
2. **Wait a few more minutes** for sync to complete
3. **Check lightwalletd is responding:**
   ```powershell
   Invoke-WebRequest -Uri "http://127.0.0.1:8080"
   ```

---

## Summary

✅ **Fixed:** `--nocache` flag (was `--no-cache`)  
⚠️ **Action Needed:** Start lightwalletd and wait for sync  
📝 **See:** `docs/ZECWALLET_CLI_NETWORK_FIX.md` for detailed troubleshooting

---

**Ready to proceed:** Run `.\scripts\setup\start-lightwalletd-manual.ps1` in a new terminal window.

