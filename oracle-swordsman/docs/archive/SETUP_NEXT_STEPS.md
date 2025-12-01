# Setup Next Steps

## Current Status

✅ **Zebrad**: Running (mainnet, port 8233)
✅ **Zallet**: Running with mnemonic (newly generated)
✅ **Nillion API**: Connected (1.5M credits available)
✅ **Workload Resources**: Available (3 tiers, 2 artifacts)

## Key Generation Status

⚠️ **Zallet RPC Limitations**: 
- No address generation methods available via RPC
- CLI is also limited for key operations

**Options for Key Generation:**
1. **Use Zcash libraries directly** - Derive keys from mnemonic
2. **Extract from zallet database** - Read wallet.db directly
3. **Use zcash-cli** - If available on system
4. **Manual derivation** - Using ZIP-32 specification

## Immediate Next Steps

### 1. Set Up Nillion Workload Structure

We can proceed with creating the SecretSigner workload structure:

```typescript
// Create workload configuration
const workload = {
  name: 'oracle-secret-signer',
  artifactsVersion: '0.2.1',
  dockerCompose: '...', // SecretSigner service
  // ... config
};
```

### 2. Prepare for Key Storage

Once we have the keys:
- Store spending key in Nillion workload environment
- Configure Oracle Swordsman with addresses
- Set up signing workflow

### 3. Key Generation (To Complete)

**Option A: Use Zcash CLI Tools**
- Install zcash-cli if available
- Generate addresses via CLI
- Export keys

**Option B: Direct Library Derivation**
- Install Zcash libraries
- Derive from mnemonic using ZIP-32
- Generate all address types

**Option C: Extract from Zallet Database**
- Use database tools to read wallet.db
- Extract keys and addresses
- Import into Oracle Swordsman

## Recommended Path Forward

1. **Now**: Set up Nillion workload structure
2. **Next**: Resolve key generation (choose one option above)
3. **Then**: Create workload with SecretSigner service
4. **Finally**: Store keys and test signing

## Files Created

- `create-secretsigner-workload.ts` - Workload creation script
- `generate-keys-direct.ts` - Direct key generation (needs Zcash libs)
- `generate-keys-simple.ps1` - Simple key generation script
- `nillion-workload-client.ts` - Workload management client

## Resources

- **Nillion API**: https://api.nilcc.nillion.network
- **Credits**: 1,500,000 available
- **Workload Tiers**: 3 available (2 CPU, 4 CPU, 4 CPU + 1 GPU)
- **Artifacts**: 2 versions (0.2.1, 0.2.0)

