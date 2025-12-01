# Address Control and Transaction Guide

## ⚠️ Security Notice

**This guide previously referenced private keys in JSON files. Private keys should NEVER be stored in files that are committed to git.**

## Generated Addresses

### Transparent Addresses (T-addresses)
1. `Ce7p98xTgU1zhYQ8u7sQStDDVLaz4iongc` (Path: m/44'/133'/0'/0/0)
2. `CMtAsmHqi6wzZKwNHhyCuR3JMixcs4Acsd` (Path: m/44'/133'/0'/0/1)
3. `CbweH58aKfCeJ3zibWmkgUgkcGqN2F9U5i` (Path: m/44'/133'/0'/0/2)

### Shielded Addresses (Z-addresses)
1. `zs1pgazk5q3haxap96mcyvlykue82p63qnt` (Path: m/32'/133'/0'/0)
2. `zs197s28fzc894c2cy9l5n2cj5h2z7wj685` (Path: m/32'/133'/0'/1)

## Control Verification

✅ **You have control of these addresses** - Private keys/spending keys should be stored securely in environment variables or secret management services.

## Key Storage

**NEVER store private keys in files committed to git!**

Store keys in:
- ✅ Environment variables (`.env` file - gitignored)
- ✅ Secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Encrypted key files (NOT in git)
- ❌ JSON files in the repository
- ❌ Documentation files
- ❌ Code files

## Sending Transactions

### Method 1: Using PowerShell Script

```powershell
# Send transparent transaction
.\send-funds.ps1 -FromAddress "Ce7p98xTgU1zhYQ8u7sQStDDVLaz4iongc" -ToAddress "CMtAsmHqi6wzZKwNHhyCuR3JMixcs4Acsd" -Amount 0.001

# Send shielded transaction
.\send-funds.ps1 -FromAddress "zs1pgazk5q3haxap96mcyvlykue82p63qnt" -ToAddress "zs197s28fzc894c2cy9l5n2cj5h2z7wj685" -Amount 0.001 -Shielded
```

### Method 2: Using TypeScript Interface

```typescript
import { sendTransaction, sendShieldedTransaction } from './send-transaction';

// Transparent
await sendTransaction(
  'Ce7p98xTgU1zhYQ8u7sQStDDVLaz4iongc',
  'CMtAsmHqi6wzZKwNHhyCuR3JMixcs4Acsd',
  0.001
);

// Shielded
await sendShieldedTransaction(
  'zs1pgazk5q3haxap96mcyvlykue82p63qnt',
  'zs197s28fzc894c2cy9l5n2cj5h2z7wj685',
  0.001
);
```

### Method 3: Direct RPC Calls

```powershell
# Using zcash-cli (if available)
zcash-cli sendtoaddress "CMtAsmHqi6wzZKwNHhyCuR3JMixcs4Acsd" 0.001

# Shielded
zcash-cli z_sendmany "zs1pgazk5q3haxap96mcyvlykue82p63qnt" '[{"address":"zs197s28fzc894c2cy9l5n2cj5h2z7wj685","amount":0.001}]'
```

## Checking Balances

```powershell
# Run transaction interface
npx ts-node send-transaction.ts

# Or use PowerShell
.\send-funds.ps1
```

## Requirements

1. **Zebrad running** with RPC enabled on port 8233
2. **RPC credentials** configured (use environment variables, NOT hardcoded)
3. **Addresses** generated (run `generate-addresses-proper.ts` first)
4. **Private keys** stored securely (environment variables or secret management)

## Files

- `zcash-addresses-controlled.json` - Addresses only (NO private keys)
- `send-transaction.ts` - TypeScript transaction interface
- `send-funds.ps1` - PowerShell transaction script
- `test-address-control.ts` - Control verification script

## Security Notes

- ⚠️ **NEVER commit private keys** - Store in environment variables or secret management
- ⚠️ **Never share private keys** - They control your funds
- ⚠️ **Test with small amounts first** - Verify everything works
- ⚠️ **Backup your mnemonic securely** - Can recover all addresses (store separately, encrypted)
- ⚠️ **Rotate keys if exposed** - If keys were ever in git, generate new ones immediately

## Next Steps

1. ✅ Addresses generated
2. ✅ Control verified
3. ⏳ Test with small transaction
4. ⏳ Verify transaction on blockchain
5. ⏳ Integrate with Oracle Swordsman
