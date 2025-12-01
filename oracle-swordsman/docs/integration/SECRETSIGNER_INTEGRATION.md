# SecretSigner Integration Guide

## Overview

SecretSigner is a service that runs inside a Nillion nilCC workload to securely store and sign transactions using Zcash private keys. The keys are stored in a Trusted Execution Environment (TEE) and never leave the secure workload.

## Architecture

```
Oracle Swordsman
    ↓
Nillion Workload Client
    ↓
Nillion nilCC Workload (TEE)
    ↓
SecretSigner Service
    ↓
Zcash Transaction Signing
```

## Components

### 1. NillionWorkloadClient
- Manages nilCC workloads
- Creates and monitors workloads
- Provides workload URLs for SecretSigner

### 2. SecretSignerClient
- Client for SecretSigner service
- Communicates with workload via HTTP
- Handles key storage and signing operations

### 3. NillionSigner
- High-level interface for Oracle Swordsman
- Integrates SecretSigner with transaction building
- Manages key lifecycle

## Setup Process

### Step 1: Create Workload

```typescript
import { NillionWorkloadClient } from './src/nillion-workload-client';

const workloadClient = new NillionWorkloadClient();

// List available resources
const tiers = await workloadClient.listWorkloadTiers();
const artifacts = await workloadClient.listArtifacts();

// Create workload
const workload = await workloadClient.createWorkload({
  name: 'oracle-secret-signer',
  artifactsVersion: '0.2.1',
  dockerCompose: '...', // SecretSigner service
  // ... config
});
```

### Step 2: Initialize SecretSigner Client

```typescript
import { SecretSignerClient } from './src/secretsigner-client';

const secretSignerClient = new SecretSignerClient(workloadClient);
secretSignerClient.setWorkloadUrl(workload.publicUrl);
```

### Step 3: Store Zcash Key

```typescript
// Generate or import Zcash spending key
const spendingKey = Buffer.from('...'); // Hex-encoded key

// Store in SecretSigner
const keyStore = await secretSignerClient.storeKey({
  privateKey: spendingKey.toString('hex'),
  algorithm: 'ECDSA',
  label: 'zcash-spending-key',
});

const keyStoreId = keyStore.keyStoreId;
```

### Step 4: Initialize NillionSigner

```typescript
import { nillionSigner } from './src/nillion-signer';

// Initialize with workload URL
nillionSigner.initializeSecretSigner(workload.publicUrl);

// Store key
await nillionSigner.initializeKey(spendingKey);
```

### Step 5: Sign Transactions

```typescript
// Build transaction hash
const txHash = buildTransactionHash(...);

// Sign using SecretSigner
const signature = await nillionSigner.signTransaction(txHash);

// Use signature in transaction
```

## SecretSigner Service API

The SecretSigner service should expose the following endpoints:

### POST /api/secretsigner/store
Store a private key in the TEE.

**Request:**
```json
{
  "privateKey": "hex-encoded-key",
  "algorithm": "ECDSA",
  "label": "optional-label"
}
```

**Response:**
```json
{
  "keyStoreId": "unique-id",
  "algorithm": "ECDSA",
  "createdAt": "2025-11-27T..."
}
```

### POST /api/secretsigner/sign
Sign a message using a stored key.

**Request:**
```json
{
  "keyStoreId": "unique-id",
  "message": "hex-encoded-message",
  "algorithm": "ECDSA"
}
```

**Response:**
```json
{
  "signature": "hex-encoded-signature",
  "keyStoreId": "unique-id"
}
```

### GET /api/secretsigner/keys
List all stored keys (optional).

**Response:**
```json
{
  "keys": ["key-id-1", "key-id-2"]
}
```

### GET /health
Health check endpoint.

**Response:**
```
200 OK
```

## Docker Compose Template

```yaml
version: '3.8'

services:
  secret-signer:
    image: nillion/secret-signer:latest
    container_name: oracle-secret-signer
    ports:
      - "8080:8080"
    environment:
      - PRIVATE_KEY=${PRIVATE_KEY}
      - NETWORK=mainnet
      - LOG_LEVEL=info
    command: 
      - "--port"
      - "8080"
      - "--network"
      - "mainnet"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Security Considerations

1. **Key Storage**: Keys are stored in TEE and never leave the workload
2. **Network**: All communication should use HTTPS
3. **Authentication**: Workload should authenticate requests
4. **Attestation**: Verify workload attestation before storing keys

## Testing

### Test SecretSigner Connection

```typescript
const isHealthy = await secretSignerClient.healthCheck();
console.log('SecretSigner healthy:', isHealthy);
```

### Test Key Storage

```typescript
const keyStore = await secretSignerClient.storeKey({
  privateKey: 'test-key-hex',
  algorithm: 'ECDSA',
});
console.log('Key stored:', keyStore.keyStoreId);
```

### Test Signing

```typescript
const signature = await secretSignerClient.sign({
  keyStoreId: keyStore.keyStoreId,
  message: 'test-message-hex',
  algorithm: 'ECDSA',
});
console.log('Signature:', signature.signature);
```

## Troubleshooting

### Workload Not Accessible
- Check workload status: `await workloadClient.getWorkloadStatus(workloadId)`
- Verify workload URL is correct
- Check network connectivity

### SecretSigner Service Not Responding
- Check workload logs
- Verify service is running in workload
- Test health endpoint directly

### Key Storage Fails
- Verify key format (hex-encoded)
- Check algorithm is supported
- Ensure workload has sufficient resources

## Next Steps

1. ✅ Create workload structure
2. ⏳ Implement SecretSigner Docker service
3. ⏳ Generate Zcash keys
4. ⏳ Store keys in workload
5. ⏳ Test signing workflow

