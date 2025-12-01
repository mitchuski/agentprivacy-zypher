# Quick Start: Generate Proper Z-Addresses with lightwalletd

**Goal:** Generate production-ready z-addresses using lightwalletd + zecwallet-cli

---

## ✅ Prerequisites Check

Both tools are already installed:
- ✅ `lightwalletd.exe` - Found in PATH
- ✅ `zecwallet-cli.exe` - Found in PATH
- ✅ `zebrad` - Running (PID: 30512)

---

## Step 1: Start lightwalletd

Run the startup script:

```powershell
cd oracle-swordsman
.\scripts\setup\start-lightwalletd.ps1
```

This will:
- ✅ Create zcash.conf with Zebra credentials
- ✅ Create data directory
- ✅ Start lightwalletd in background

**Or start manually:**

```powershell
# Read Zebra credentials
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
$cookieContent = Get-Content $cookiePath -Raw
$cookieParts = $cookieContent.Trim().Split(':')
$rpcUser = $cookieParts[0]
$rpcPass = $cookieParts[1]

# Create config
$configDir = "$env:USERPROFILE\.config"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
$zcashConf = @"
rpcuser=$rpcUser
rpcpassword=$rpcPass
rpcbind=127.0.0.1
rpcport=8233
"@
Set-Content -Path "$configDir\zcash.conf" -Value $zcashConf

# Create data dir
$dataDir = "$env:USERPROFILE\.cache\lightwalletd"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

# Start lightwalletd
Start-Process -FilePath "lightwalletd.exe" -ArgumentList @(
    "--zcash-conf-path", "$configDir\zcash.conf",
    "--data-dir", $dataDir,
    "--log-file", "$dataDir\lightwalletd.log",
    "--grpc-bind-addr", "127.0.0.1:9067",
    "--http-bind-addr", "127.0.0.1:8080",
    "--no-tls-very-insecure"
) -WindowStyle Minimized
```

---

## Step 2: Wait for lightwalletd to Sync

Check logs to see sync progress:

```powershell
Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 20 -Wait
```

Look for:
- `Connected to Zebra`
- `Syncing blocks...`
- `Sync complete`

**Note:** First sync may take a few minutes.

---

## Step 3: Connect zecwallet-cli

Once lightwalletd is synced:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

You should see the zecwallet-cli prompt.

---

## Step 4: Generate Proper Z-Addresses

In zecwallet-cli, run:

```bash
# Generate shielded z-address (repeat as needed)
new z

# Generate transparent t-address (optional)
new t

# List all addresses
list

# Export wallet (SAVE THIS OUTPUT!)
export
```

**Important:** The `export` command shows your mnemonic and keys. Save this securely!

---

## Step 5: Extract Addresses

From the `list` or `export` output, copy the addresses. They'll look like:
- `zs1...` (shielded z-addresses)
- `t1...` or `tm...` (transparent addresses)

---

## Step 6: Add to Oracle System

You can either:

**Option A: Manual Entry**
- Copy addresses from zecwallet-cli
- Add to `zcash-addresses-controlled.json` manually

**Option B: Use Export Data**
- Use the mnemonic from `export` command
- Regenerate addresses using your existing scripts
- The addresses will match what zecwallet-cli generated

---

## Verification

After adding addresses:

1. **Restart Oracle service** (if running)
2. **Check wallet interface:** http://localhost:3000/wallet
3. **Verify addresses appear** in the interface

---

## Troubleshooting

### lightwalletd Won't Start

```powershell
# Check if already running
Get-Process lightwalletd

# Check logs
Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 50

# Verify Zebra is accessible
Test-NetConnection -ComputerName 127.0.0.1 -Port 8233
```

### zecwallet-cli Can't Connect

```powershell
# Check lightwalletd is running
Get-Process lightwalletd

# Test gRPC port
Test-NetConnection -ComputerName 127.0.0.1 -Port 9067

# Check lightwalletd logs
Get-Content "$env:USERPROFILE\.cache\lightwalletd\lightwalletd.log" -Tail 20
```

---

## Next Steps

After generating addresses:

1. ✅ Save the export output (contains mnemonic/keys)
2. ✅ Add addresses to `zcash-addresses-controlled.json`
3. ✅ Restart Oracle service
4. ✅ Verify in wallet interface

---

**Ready to start?** Run: `.\scripts\setup\start-lightwalletd.ps1`

