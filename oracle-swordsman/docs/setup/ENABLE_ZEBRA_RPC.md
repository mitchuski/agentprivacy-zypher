# Enable Zebrad RPC

Zebrad is currently running without RPC enabled. To generate keys, you need to enable RPC.

## Option 1: Restart zebrad with RPC flag (Quick)

1. Stop the current zebrad process (PID: 46388)
2. Start zebrad with RPC enabled:

```powershell
zebrad start --rpc-bind-addr 127.0.0.1:8233
```

## Option 2: Create zebrad.toml config file (Permanent)

1. Create config file: `%USERPROFILE%\.zebra\zebrad.toml`
2. Add RPC configuration:

```toml
[rpc]
bind_addr = "127.0.0.1:8233"
```

3. Restart zebrad (it will use the config automatically)

## After enabling RPC

Once RPC is enabled, zebrad will create a `.cookie` file at:
- Windows: `%LOCALAPPDATA%\zebra\.cookie`
- Linux/macOS: `~/.zebra/.cookie`

Then run:
```powershell
npx ts-node generate-keys.ts
```

This will generate:
- Donation z-address (for receiving submissions)
- Viewing key (for Oracle - can decrypt, cannot spend)
- Spending key (for testing - will move to Nillion TEE in production)
- Sanctuary t-address (for public inscriptions - 61.8%)
- Protocol fee z-address (for private pool - 38.2%)

