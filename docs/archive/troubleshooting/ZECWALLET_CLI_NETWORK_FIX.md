# Fix: zecwallet-cli "Couldn't get network" Error

## Problem

When connecting zecwallet-cli to local lightwalletd, you get:
```
thread 'main' panicked at 'Couldn't get network'
```

## Cause

zecwallet-cli tries to detect the network from the lightwalletd server, but:
1. lightwalletd may not be fully synced yet
2. lightwalletd may not be running
3. The gRPC connection may not be established

## Solution

### Step 1: Ensure lightwalletd is Running and Synced

```powershell
# Check if lightwalletd is running
Get-Process lightwalletd

# Check logs to see if it's synced
Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 20
```

Look for messages like:
- `Connected to Zebra`
- `Syncing blocks...`
- `Sync complete` or `Server ready`

### Step 2: Wait for lightwalletd to Fully Sync

lightwalletd needs to sync with Zebra before zecwallet-cli can connect. This may take a few minutes on first startup.

### Step 3: Test lightwalletd HTTP Endpoint

```powershell
# Test HTTP endpoint (port 8080)
Invoke-WebRequest -Uri "http://127.0.0.1:8080" -Method Get
```

If this works, lightwalletd is running.

### Step 4: Connect zecwallet-cli

Once lightwalletd is synced:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

**Note:** zecwallet-cli will automatically detect the network (mainnet/testnet) from lightwalletd.

## Alternative: Use Public Server (For Testing)

If local lightwalletd continues to have issues, you can use a public server temporarily:

```powershell
# Mainnet
zecwallet-cli --server https://lwdv3.zecwallet.co

# Testnet
zecwallet-cli --server https://testnet.lightwalletd.com:9067
```

Then generate addresses and export them to use with your local setup.

## Troubleshooting

### lightwalletd Not Syncing

1. **Check Zebra is running:**
   ```powershell
   Get-Process zebrad
   ```

2. **Check Zebra RPC:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 8233
   ```

3. **Check lightwalletd config:**
   ```powershell
   Get-Content "$env:USERPROFILE\.config\zcash.conf"
   ```

### zecwallet-cli Still Fails

1. **Try with explicit data directory:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067 --data-dir "$env:USERPROFILE\zecwallet-data"
   ```

2. **Check lightwalletd logs for errors:**
   ```powershell
   Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 50
   ```

3. **Wait longer** - lightwalletd may still be syncing

## Expected Behavior

Once lightwalletd is fully synced and running:

1. ✅ HTTP endpoint responds (port 8080)
2. ✅ gRPC endpoint is ready (port 9067)
3. ✅ zecwallet-cli can connect and detect network
4. ✅ You can generate addresses with `new z`

---

**Last Updated:** 2025-11-28

