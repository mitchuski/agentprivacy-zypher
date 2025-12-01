# Build and Deploy SecretSigner

## Step 1: Build Docker Image

### Windows (PowerShell):
```powershell
.\build-secretsigner.ps1
```

### Linux/Mac:
```bash
chmod +x build-secretsigner.sh
./build-secretsigner.sh
```

### Manual:
```bash
cd secretsigner
docker build -t secret-signer:latest .
cd ..
```

## Step 2: Test Locally

```bash
docker run -p 8080:8080 \
  -e PRIVATE_KEY=your_private_key_from_env \
  -e NETWORK=mainnet \
  -e LOG_LEVEL=info \
  secret-signer:latest
```

Then test:
```bash
npm run test:secretsigner
```

Or manually:
```bash
curl http://localhost:8080/health
```

## Step 3: Update Workload Config

The workload config is already updated with `secret-signer:latest` image.

To verify:
```bash
cat secretsigner-workload-config-with-keys.json
```

## Step 4: Create Workload

Uncomment the workload creation code in `setup-with-keys.ts`:

```typescript
// Uncomment these lines:
console.log('[4] Creating workload...');
const workload = await workloadClient.createWorkload(workloadConfig);
console.log('  ✅ Workload created!');
console.log(`     ID: ${workload.id}`);
console.log(`     URL: ${workload.publicUrl || 'N/A'}`);
console.log(`     Status: ${workload.status}\n`);

// Initialize SecretSigner client
if (workload.publicUrl) {
  nillionSigner.initializeSecretSigner(workload.publicUrl);
  console.log('  ✅ SecretSigner client initialized\n');
}
```

Then run:
```bash
npx ts-node setup-with-keys.ts
```

## Step 5: Test Workload

Once the workload is created, test the SecretSigner service:

```bash
# Update SECRETSIGNER_URL in test-secretsigner.ts
# Then run:
npm run test:secretsigner
```

## Step 6: Integrate with Oracle Swordsman

Update Oracle Swordsman to use the workload URL:

```typescript
import { nillionSigner } from './src/nillion-signer';

// Initialize with workload URL
nillionSigner.initializeSecretSigner(workload.publicUrl);

// Use for signing
const signature = await nillionSigner.signTransaction(txHash);
```

## Troubleshooting

### Image not found
- Ensure Docker image is built: `docker images | grep secret-signer`
- Check image name matches config: `secret-signer:latest`

### Workload creation fails
- Check Nillion credits: `npm run test:workloads`
- Verify API key is set: `echo $NILLION_API_KEY`
- Check Docker image exists locally

### SecretSigner not responding
- Check workload status: `await workloadClient.getWorkloadStatus(workloadId)`
- Verify workload URL is correct
- Check workload logs in Nillion dashboard

## Next Steps

1. ✅ Build Docker image
2. ✅ Test locally
3. ⏳ Create workload
4. ⏳ Test workload endpoints
5. ⏳ Integrate with Oracle Swordsman
6. ⏳ Test end-to-end signing

