# Zallet RPC Limitations

## Current Status

✅ **Zallet RPC Server**: Running on port 28232
✅ **Authentication**: Working (zallet:your_zallet_password_here)
✅ **Connection**: Successful
✅ **listaddresses method**: Works (returns 0 addresses)

❌ **Address Generation Methods**: Not found
- `z_getnewaddress` - Method not found
- `getnewaddress` - Method not found  
- `createaddress` - Method not found
- `newaddress` - Method not found

## Issue

Zallet's RPC interface appears to have limited wallet methods compared to `zcashd`. The standard Zcash RPC methods for address generation are not available.

## Possible Solutions

### Option 1: Check Zallet RPC Documentation
- Zallet may use different method names
- May require wallet to be fully initialized first
- May need mnemonic to be generated/imported

### Option 2: Use Zallet CLI
- Generate addresses via CLI commands
- May need to check zallet's actual CLI interface
- Could script CLI commands instead of RPC

### Option 3: Use Alternative Wallet
- `zcash-cli` (if available)
- `zcash-wallet-cli` (light client)
- Direct key generation tools

### Option 4: Manual Address Generation
- Generate keys manually using Zcash libraries
- Import into zallet wallet
- Use for production

## Next Steps

1. **Check Zallet Documentation**: Find correct RPC method names
2. **Verify Wallet Initialization**: Ensure mnemonic is set up
3. **Try CLI Approach**: Use zallet CLI commands if RPC is limited
4. **Alternative Tools**: Consider other Zcash wallet tools

## Current Working Methods

- `listaddresses` - ✅ Works (returns empty array - wallet may be new)

## Resources

- Zallet GitHub: https://github.com/zcash/wallet
- Zallet Documentation: Check for RPC method list
- Zcash RPC Docs: May differ from zallet's implementation

