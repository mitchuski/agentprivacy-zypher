# Zcash Keys and Nillion Workload Setup

## Current Status

✅ **Zebrad**: Running (mainnet, port 8233)
✅ **Zallet**: Running (syncing with zebrad)
⏳ **Zallet RPC**: Waiting for sync to complete (port 28232)

## Key Generation Script

Created `generate-production-keys.ps1` which will generate:

1. **Shielded Address (z-address)** - For receiving user submissions
2. **Transparent Address (t-address)** - For public inscriptions
3. **Viewing Key** - For Oracle to monitor transactions (read-only)
4. **Spending Key** - For signing transactions (will go to Nillion TEE)
5. **Transparent Private Key** - For t-address operations

## Once Zallet RPC is Ready

Run the key generation script:
```powershell
.\generate-production-keys.ps1
```

This will:
- Generate all addresses and keys
- Save them to `production-keys.json`
- Display summary with all keys

## Next Steps After Key Generation

### 1. Store Spending Key in Nillion TEE

The spending key needs to be stored in a Nillion nilCC workload for secure signing.

**Option A: Create SecretSigner Workload**
```typescript
// Use nillion-workload-client.ts
const workload = await nillionWorkloadClient.createWorkload({
  name: "secret-signer-oracle",
  dockerCompose: "...", // SecretSigner service
  // ... workload config
});
```

**Option B: Use Nillion SecretSigner API** (if available)
- Check Nillion docs for SecretSigner-specific API
- May be separate from nilCC API

### 2. Configure Oracle Swordsman

Update `.env` with generated addresses:
```env
# Zcash Addresses
ZCASH_SHIELDED_RECEIVE_ADDRESS=zs1...  # z-address
ZCASH_PUBLIC_INSCRIPTION_ADDRESS=t1...  # t-address
ZCASH_VIEWING_KEY=...  # For monitoring
```

### 3. Store Spending Key Securely

**For Production:**
- Store spending key in Nillion TEE workload
- Never store in `.env` file
- Use Nillion SecretSigner for signing

**For Testing:**
- Can temporarily store in `.env`
- Move to Nillion TEE before production

## Nillion Workload Setup

### Check Available Resources

```typescript
import { nillionWorkloadClient } from './nillion-workload-client';

// List available workload tiers
const tiers = await nillionWorkloadClient.listWorkloadTiers();
console.log('Available tiers:', tiers);

// List available artifacts (VM images)
const artifacts = await nillionWorkloadClient.listArtifacts();
console.log('Available artifacts:', artifacts);
```

### Create SecretSigner Workload

Once we have the SecretSigner Docker image/service:

```typescript
const workload = await nillionWorkloadClient.createWorkload({
  name: "oracle-secret-signer",
  artifactsVersion: "latest", // From artifacts list
  dockerCompose: `
    services:
      secret-signer:
        image: nillion/secret-signer:latest
        ports:
          - "8080:8080"
        environment:
          - PRIVATE_KEY=${spendingKey}
  `,
  publicContainerName: "secret-signer",
  publicContainerPort: 8080,
  memory: 2048, // MB - must match available tier
  cpus: 2,       // Must match available tier
  disk: 20,      // GB - must match available tier
});
```

### Use Workload for Signing

```typescript
// Set active workload
nillionWorkloadClient.setActiveWorkload(workload.id, workload.url);

// Sign transaction via workload
const signature = await nillionWorkloadClient.callWorkloadSecretSigner(
  workload.url,
  "sign",
  {
    keyStoreId: "...",
    message: txHash.toString('hex'),
    algorithm: "ECDSA"
  }
);
```

## Files Created

1. **`generate-production-keys.ps1`** - Key generation script
2. **`nillion-workload-client.ts`** - Workload management client
3. **`nillion-api-client.ts`** - nilCC API client (updated)
4. **`NILLION_NILCC_API_FINDINGS.md`** - API documentation findings

## Security Notes

⚠️ **IMPORTANT:**
- Never commit private keys to git
- Store spending key in Nillion TEE for production
- Viewing key is safe to use (read-only)
- Transparent private key needed for t-address operations

## Resources

- **Nillion nilCC API**: https://api.nilcc.nillion.network
- **API Docs**: https://nillion-docs-git-feat-nilcc-nillion.vercel.app/build/compute/api-reference
- **OpenAPI Spec**: https://api.nilcc.nillion.network/openapi.json
- **Account Credits**: 1,500,000 (ready for workload creation)

