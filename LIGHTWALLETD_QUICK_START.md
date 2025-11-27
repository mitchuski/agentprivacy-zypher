# lightwalletd Quick Start Guide

**Status**: ✅ lightwalletd is built and installed!

---

## Current Status

✅ **Go installed**: go1.25.4  
✅ **lightwalletd built**: `$env:USERPROFILE\go\bin\lightwalletd.exe`  
✅ **Configuration created**: `$env:USERPROFILE\.config\zcash.conf`  
✅ **Data directory created**: `$env:USERPROFILE\.cache\lightwalletd`  
✅ **Zebra configured**: Cookie auth disabled for lightwalletd  

⚠️ **Zebra RPC**: Port 8232 not accessible (may need restart)  
⚠️ **lightwalletd**: Not running yet  

---

## Next Steps

### 1. Restart Zebra (if RPC port not accessible)

Zebra needs to be restarted to apply the config change (`enable_cookie_auth = false`):

```powershell
# Stop Zebra
Get-Process zebrad | Stop-Process

# Start Zebra
zebrad start
```

Wait a few minutes for Zebra to initialize, then verify RPC:

```powershell
.\test-zebra-rpc.ps1
```

### 2. Start lightwalletd

Once Zebra RPC is accessible:

```powershell
.\start-lightwalletd.ps1
```

Or manually:

```powershell
# Add Go bin to PATH
$env:Path += ";$env:USERPROFILE\go\bin"

# Start lightwalletd
lightwalletd `
  --zcash-conf-path "$env:USERPROFILE\.config\zcash.conf" `
  --data-dir "$env:USERPROFILE\.cache\lightwalletd" `
  --log-file "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" `
  --grpc-bind-addr 127.0.0.1:9067 `
  --no-tls-very-insecure
```

**Note**: `--no-tls-very-insecure` is for testing only. For production, use proper TLS certificates.

### 3. Verify lightwalletd is Running

```powershell
# Check process
Get-Process lightwalletd

# Check port
Test-NetConnection -ComputerName 127.0.0.1 -Port 9067

# View logs
Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 20
```

### 4. Connect Wallet to lightwalletd

Once lightwalletd is running and synced:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Zebra      │ ◄────── │ lightwalletd │ ◄────── │  Wallet     │
│  (zebrad)   │  RPC    │  (local)     │  gRPC   │ (zecwallet) │
│  Port 8232  │         │  Port 9067   │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Data Flow:**
1. Wallet → lightwalletd (port 9067)
2. lightwalletd → Zebra RPC (port 8232)
3. Zebra provides blockchain data
4. lightwalletd caches and serves to wallet

---

## Troubleshooting

### Zebra RPC Not Accessible

1. **Check Zebra is running:**
   ```powershell
   Get-Process zebrad
   ```

2. **Restart Zebra** to apply config changes:
   ```powershell
   Get-Process zebrad | Stop-Process
   zebrad start
   ```

3. **Wait for initialization** (may take a few minutes)

4. **Test RPC:**
   ```powershell
   .\test-zebra-rpc.ps1
   ```

### lightwalletd Won't Start

1. **Check Zebra RPC is accessible** (see above)

2. **Check logs:**
   ```powershell
   Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 50
   ```

3. **Verify config file exists:**
   ```powershell
   Test-Path "$env:USERPROFILE\.config\zcash.conf"
   ```

### lightwalletd Can't Connect to Zebra

1. **Verify Zebra config:**
   ```powershell
   Get-Content "$env:USERPROFILE\.config\zebrad.toml" | Select-String "enable_cookie_auth"
   ```
   Should show: `enable_cookie_auth = false`

2. **Verify Zebra RPC is listening:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 8232
   ```

3. **Check Zebra is synced** (lightwalletd needs synced backend)

---

## Files Created

- ✅ `lightwalletd.exe` - Built binary at `$env:USERPROFILE\go\bin\lightwalletd.exe`
- ✅ `$env:USERPROFILE\.config\zcash.conf` - Empty config (uses default Zebra RPC)
- ✅ `$env:USERPROFILE\.cache\lightwalletd\` - Data directory
- ✅ `start-lightwalletd.ps1` - Startup script
- ✅ `test-zebra-rpc.ps1` - RPC test script
- ✅ `verify-lightwalletd-setup.ps1` - Verification script

---

## Production Considerations

### TLS Certificate (Required for Production)

For production, generate a proper TLS certificate:

```powershell
# Using OpenSSL (if installed)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start with TLS
lightwalletd --tls-cert cert.pem --tls-key key.pem ...
```

**Remove `--no-tls-very-insecure` flag for production!**

### Running as Service

For production, run lightwalletd as a Windows service using NSSM or Task Scheduler.

---

## Verification

Run the verification script anytime:

```powershell
.\verify-lightwalletd-setup.ps1
```

This checks all components and their status.

---

**Last Updated**: 2025-01-27  
**Status**: ✅ Built and ready to start

