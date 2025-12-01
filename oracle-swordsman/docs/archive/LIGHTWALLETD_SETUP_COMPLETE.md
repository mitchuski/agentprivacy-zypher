# lightwalletd Setup - Complete Guide

## Current Status

✅ **Tools Installed:**
- `lightwalletd.exe` - Found in PATH
- `zecwallet-cli.exe` - Found in PATH
- `zebrad` - Running and synced

✅ **Configuration Created:**
- `$env:USERPROFILE\.config\zcash.conf` - lightwalletd config with Zebra credentials

⚠️ **Issue:** lightwalletd has a file permission issue with the database file on Windows.

---

## Solution: Run lightwalletd Manually

Due to Windows file permission issues, run lightwalletd in a separate terminal window:

### Step 1: Open New PowerShell Terminal

Open a new PowerShell window (run as Administrator if needed).

### Step 2: Start lightwalletd

```powershell
# Navigate to project
cd C:\Users\mitch\agentprivacy_zypher\oracle-swordsman

# Start lightwalletd (in foreground to see output)
lightwalletd.exe `
  --zcash-conf-path "$env:USERPROFILE\.config\zcash.conf" `
  --data-dir "$env:USERPROFILE\lightwalletd-data" `
  --log-file "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" `
  --grpc-bind-addr 127.0.0.1:9067 `
  --http-bind-addr 127.0.0.1:8080 `
  --no-tls-very-insecure
```

**Note:** If you get permission errors, try:
- Running PowerShell as Administrator
- Using a different data directory (e.g., `C:\lightwalletd-data`)
- Or use `--nocache` flag (slower but avoids database issues)

### Step 3: Wait for Sync

Watch the terminal output. You should see:
- `Connected to Zebra`
- `Syncing blocks...`
- `Sync complete` or `Server ready`

**First sync may take a few minutes.**

### Step 4: In Another Terminal - Connect zecwallet-cli

Once lightwalletd is running and synced, open another terminal:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

### Step 5: Generate Proper Z-Addresses

In zecwallet-cli:

```bash
# Generate shielded z-address (repeat as needed)
new z

# Generate another z-address
new z

# Generate transparent t-address (optional)
new t

# List all addresses
list

# Export wallet (SAVE THIS!)
export
```

**Important:** Save the `export` output - it contains your mnemonic and keys!

---

## Alternative: Use --no-cache Flag

If database permission issues persist, use `--no-cache`:

```powershell
lightwalletd.exe `
  --zcash-conf-path "$env:USERPROFILE\.config\zcash.conf" `
  --no-cache `
  --log-file "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" `
  --grpc-bind-addr 127.0.0.1:9067 `
  --http-bind-addr 127.0.0.1:8080 `
  --no-tls-very-insecure
```

This avoids database file issues but is slower (doesn't cache blocks).

---

## Extract Addresses from zecwallet-cli

After generating addresses with `new z`, use `list` to see them:

```
Addresses:
  zs1abc123... (shielded)
  zs1def456... (shielded)
  t1xyz789... (transparent)
```

Copy these addresses and add them to your `zcash-addresses-controlled.json` file.

---

## Add Addresses to Oracle System

You have two options:

### Option A: Use the Mnemonic from Export

1. Run `export` in zecwallet-cli
2. Copy the mnemonic
3. Update your `zcash-addresses-controlled.json` with the new mnemonic
4. Regenerate addresses using your existing scripts

### Option B: Manual Entry

1. Copy addresses from `list` command
2. Get spending keys (from `export` or zecwallet-cli commands)
3. Add to `zcash-addresses-controlled.json` manually

---

## Verification

After adding addresses:

1. **Restart Oracle service** (if running)
2. **Check wallet interface:** http://localhost:3000/wallet
3. **Verify addresses appear**

---

## Troubleshooting

### Permission Errors

- **Run PowerShell as Administrator**
- **Use different data directory:** `--data-dir C:\lightwalletd-data`
- **Use --no-cache flag** (avoids database files)

### lightwalletd Won't Connect to Zebra

1. **Verify Zebra is running:**
   ```powershell
   Get-Process zebrad
   ```

2. **Check Zebra RPC:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 8233
   ```

3. **Verify config:**
   ```powershell
   Get-Content "$env:USERPROFILE\.config\zcash.conf"
   ```

### zecwallet-cli Can't Connect

1. **Check lightwalletd is running:**
   ```powershell
   Get-Process lightwalletd
   ```

2. **Test gRPC port:**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 9067
   ```

3. **Check lightwalletd logs** for errors

---

## Quick Reference

**Start lightwalletd:**
```powershell
lightwalletd.exe --zcash-conf-path "$env:USERPROFILE\.config\zcash.conf" --data-dir "$env:USERPROFILE\lightwalletd-data" --grpc-bind-addr 127.0.0.1:9067 --http-bind-addr 127.0.0.1:8080 --no-tls-very-insecure
```

**Connect zecwallet-cli:**
```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

**Generate addresses:**
```bash
new z    # z-address
new t    # t-address
list     # list all
export   # export wallet
```

---

**Ready to generate proper z-addresses!** Follow the steps above to start lightwalletd and use zecwallet-cli.

