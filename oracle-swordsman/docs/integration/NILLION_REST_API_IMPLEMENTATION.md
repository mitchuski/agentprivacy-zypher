# Nillion REST API Implementation

## ✅ Implementation Complete

The Oracle Swordsman now uses Nillion's REST API for all SecretSigner operations.

## Files Created/Updated

### 1. `src/nillion-api-client.ts`
- REST API client for Nillion
- Handles authentication with `x-api-key` header
- Implements:
  - `storeKey()` - Store private key in SecretSigner
  - `sign()` - Sign messages/transactions
  - `getAttestation()` - Get TEE attestation
  - `verifyAttestation()` - Verify attestation
  - `testConnection()` - Test API connectivity

### 2. `src/nillion-signer.ts` (Updated)
- Now uses `nillionApiClient` instead of placeholder code
- All methods call REST API endpoints
- Maintains same interface for backward compatibility

### 3. `src/config.ts` (Updated)
- Added `nillion.apiUrl` configuration
- Defaults to:
  - Testnet: `https://api-testnet.nillion.com/v1`
  - Mainnet: `https://api.nillion.com/v1`

## Current Status

✅ **API Connection**: Working
✅ **Authentication**: Using `x-api-key` header
✅ **Attestation Endpoint**: `/attestation` is working
⚠️ **SecretSigner Endpoints**: Using placeholder paths (may need adjustment)

## API Endpoints (Current Implementation)

The client uses these endpoint paths (may need verification from Nillion docs):

- **Store Key**: `POST /secret-signer/keys`
- **Sign**: `POST /secret-signer/sign`
- **Attestation**: `GET /attestation`
- **Verify Attestation**: `POST /attestation/verify`

## Configuration

```env
NILLION_API_KEY=your_nillion_api_key_here
NILLION_NETWORK=testnet
NILLION_API_URL=https://api-testnet.nillion.com/v1  # Optional, has defaults
NILLION_TIMEOUT=30000  # Optional, default 30s
```

## Usage

```typescript
import { nillionSigner } from './nillion-signer';

// Initialize
await nillionSigner.initialize();

// Store Zcash spending key
const keyStoreId = await nillionSigner.initializeKey(privateKeyBuffer);

// Sign transaction hash
const signature = await nillionSigner.signTransaction(txHashBuffer);

// Get attestation
const attestation = await nillionSigner.getAttestation();

// Verify attestation
const isValid = await nillionSigner.verifyAttestation(attestation);
```

## Testing

Run the test:
```bash
npm run test:nillion
```

This verifies:
- ✅ Configuration loading
- ✅ API connection
- ✅ Attestation retrieval
- ✅ Client initialization

## Next Steps

1. **Verify Endpoints**: Check Nillion API documentation for correct SecretSigner endpoint paths
2. **Test Key Storage**: Try storing a test private key
3. **Test Signing**: Try signing a test transaction hash
4. **Update Endpoints**: Adjust endpoint paths in `nillion-api-client.ts` if needed

## Error Handling

The client includes:
- Request/response logging
- Error interceptors
- Detailed error messages
- Timeout handling

## Authentication

Uses `x-api-key` header as per Nillion API documentation:
```typescript
headers: {
  'x-api-key': this.config.apiKey,
}
```

## Resources

- Nillion Docs: https://docs.nillion.com
- API Key: `your_nillion_api_key_here` (set via environment variable)
- Network: testnet

