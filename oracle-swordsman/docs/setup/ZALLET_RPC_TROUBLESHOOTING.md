# Zallet RPC Troubleshooting

## Current Situation

Zallet is running but the JSON-RPC server on port 28232 is not starting.

## What We've Done

1. ✅ Fixed config: `validator_address` moved to `[indexer]` section
2. ✅ Zallet is running (process active)
3. ✅ Config file is correct format
4. ❌ RPC port 28232 not listening

## Possible Causes

1. **Zallet needs to sync first**: The indexer might need to sync with zebrad before RPC becomes available
2. **Alpha software limitation**: Zallet is in alpha, RPC might have bugs
3. **Config issue**: Despite correct format, something might be missing
4. **Port conflict**: Another service might be using port 28232

## Troubleshooting Steps

### 1. Check if zallet is syncing

Zallet might need to sync with zebrad before RPC starts. Check if zallet is actively syncing:

```powershell
# Check zallet process
Get-Process zallet

# Check if it's using CPU (indicates activity)
Get-Process zallet | Select-Object CPU, WorkingSet
```

### 2. Check for port conflicts

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 28232
netstat -ano | findstr :28232
```

### 3. Try different RPC port

Edit config to use a different port:

```toml
[rpc]
bind = ["127.0.0.1:28233"]  # Try different port
```

### 4. Check zallet logs

Run zallet in foreground to see errors:

```powershell
zallet --datadir "C:\Users\mitch\zebra-wallet" start
```

Look for RPC-related error messages.

### 5. Verify config is being read

Zallet should log which config it's using. Check startup messages for config path.

## Current Config

**Location**: `C:\Users\mitch\AppData\Roaming\zallet\zallet.toml`

```toml
[indexer]
validator_address = "127.0.0.1:8233"

[rpc]
bind = ["127.0.0.1:28232"]

[[rpc.auth]]
user = "zallet"
password = "your_zallet_password_here"
```

## Alternative: Generate Addresses Manually

While troubleshooting zallet RPC, you can:

1. **Use Zashi mobile wallet** to generate addresses
2. **Export viewing keys** from your wallet
3. **Add to .env** manually
4. **Proceed with testing**

## Next Steps

1. Wait 5-10 minutes for zallet to potentially sync and start RPC
2. Check zallet process activity (CPU usage)
3. Try running zallet in foreground to see errors
4. Or use alternative method for immediate testing

