# Setup lightwalletd + zecwallet-cli for Proper Z-Address Generation

**Goal:** Generate production-ready z-addresses using lightwalletd connected to your Zebra node.

---

## Prerequisites

✅ **Zebra (zebrad)** - Running and synced  
✅ **lightwalletd.exe** - Installed (found in PATH)  
✅ **zecwallet-cli.exe** - Installed (found in PATH)  

---

## Step 1: Verify Zebra is Running

```powershell
# Check if Zebra is running
Get-Process zebrad

# Test Zebra RPC (should be on port 8233 for mainnet)
Test-NetConnection -ComputerName 127.0.0.1 -Port 8233
```

**Note:** Zebra must be fully synced before lightwalletd can work properly.

---

## Step 2: Start lightwalletd

Run the setup script:

```powershell
cd oracle-swordsman
.\scripts\setup\start-lightwalletd.ps1
```

Or manually:

```powershell
# Create config directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cache\lightwalletd"

# Read Zebra credentials from cookie file
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
$cookieContent = Get-Content $cookiePath -Raw
$cookieParts = $cookieContent.Trim().Split(':')
$rpcUser = $cookieParts[0]
$rpcPass = $cookieParts[1]

# Create zcash.conf
$zcashConf = @"
rpcuser=$rpcUser
rpcpassword=$rpcPass
rpcbind=127.0.0.1
rpcport=8233
"@
Set-Content -Path "$env:USERPROFILE\.config\zcash.conf" -Value $zcashConf

# Start lightwalletd
lightwalletd.exe `
  --zcash-conf-path "$env:USERPROFILE\.config\zcash.conf" `
  --data-dir "$env:USERPROFILE\.cache\lightwalletd" `
  --log-file "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" `
  --grpc-bind-addr 127.0.0.1:9067 `
  --http-bind-addr 127.0.0.1:8080 `
  --no-tls-very-insecure
```

**Note:** `--no-tls-very-insecure` is for testing only. For production, use proper TLS certificates.

---

## Step 3: Wait for lightwalletd to Sync

lightwalletd needs to sync with Zebra. This may take a few minutes:

```powershell
# Check logs
Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 20 -Wait
```

Look for messages like:
- `Connected to Zebra`
- `Syncing blocks...`
- `Sync complete`

---

## Step 4: Connect zecwallet-cli

Once lightwalletd is running and synced:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

You should see the zecwallet-cli prompt.

---

## Step 5: Generate Proper Z-Addresses

In the zecwallet-cli prompt:

```bash
# Generate shielded z-address
new z

# Generate another z-address (repeat as needed)
new z

# Generate transparent t-address (optional)
new t

# List all addresses
list

# Export wallet (save this output!)
export
```

**Important:** Save the export output! It contains your mnemonic and keys.

---

## Step 6: Export Addresses

After generating addresses, you can:

1. **List addresses in zecwallet-cli:**
   ```
   list
   ```

2. **Export wallet data:**
   ```
   export
   ```

3. **Copy the addresses** and add them to your `zcash-addresses-controlled.json` file.

---

## Step 7: Import Addresses into Oracle System

You'll need to:

1. **Extract addresses** from zecwallet-cli output
2. **Get spending keys** (from export or zecwallet-cli)
3. **Add to address file** with proper format

**Format for address file:**
```json
{
  "type": "shielded",
  "index": 0,
  "path": "m/32'/133'/0'/0",
  "spendingKey": "hex-encoded-spending-key",
  "viewingKey": "hex-encoded-viewing-key",
  "address": "zs1...",
  "network": "mainnet"
}
```

---

## Troubleshooting

### lightwalletd Won't Start

1. **Check Zebra is running:**
   ```powershell
   Get-Process zebrad
   ```

2. **Check Zebra RPC is accessible:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 8233
   ```

3. **Check logs:**
   ```powershell
   Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 50
   ```

### lightwalletd Can't Connect to Zebra

1. **Verify zcash.conf exists:**
   ```powershell
   Test-Path "$env:USERPROFILE\.config\zcash.conf"
   ```

2. **Check credentials match Zebra:**
   ```powershell
   Get-Content "$env:USERPROFILE\.config\zcash.conf"
   Get-Content "$env:LOCALAPPDATA\zebra\.cookie"
   ```

3. **Verify Zebra is synced** (lightwalletd needs synced backend)

### zecwallet-cli Can't Connect

1. **Check lightwalletd is running:**
   ```powershell
   Get-Process lightwalletd
   ```

2. **Test gRPC port:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 9067
   ```

3. **Check lightwalletd logs** for connection errors

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Zebra      │ ◄────── │ lightwalletd │ ◄────── │  Wallet     │
│  (zebrad)  │  RPC     │  (local)     │  gRPC   │ (zecwallet) │
│  Port 8233  │         │  Port 9067   │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Data Flow:**
1. Wallet → lightwalletd (port 9067) - gRPC
2. lightwalletd → Zebra RPC (port 8233) - JSON-RPC
3. Zebra provides blockchain data
4. lightwalletd caches and serves to wallet

---

## Files Created

- `$env:USERPROFILE\.config\zcash.conf` - lightwalletd config
- `$env:USERPROFILE\.cache\lightwalletd\` - Data directory
- `$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log` - Log file

---

## Next Steps

After generating addresses:

1. ✅ Export addresses from zecwallet-cli
2. ✅ Add to `zcash-addresses-controlled.json`
3. ✅ Restart Oracle service to load new addresses
4. ✅ Verify addresses appear in wallet interface

---

**Last Updated:** 2025-11-28

