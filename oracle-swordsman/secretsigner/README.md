# SecretSigner Service

Zcash transaction signing service designed to run in Nillion nilCC TEE workloads.

## Features

- **Secure Key Storage**: Private keys stored in TEE environment
- **Transaction Signing**: Sign Zcash transaction hashes
- **REST API**: Simple HTTP API for signing operations
- **Health Checks**: Built-in health monitoring

## API Endpoints

### Health Check
```
GET /health
```

### Store Key
```
POST /api/secretsigner/store
{
  "privateKey": "hex-encoded-key",
  "algorithm": "ECDSA",
  "label": "optional-label"
}
```

### Sign Message
```
POST /api/secretsigner/sign
{
  "keyStoreId": "key-id",
  "message": "hex-encoded-message",
  "algorithm": "ECDSA"
}
```

### List Keys
```
GET /api/secretsigner/keys
```

### Get Key Info
```
GET /api/secretsigner/keys/:keyStoreId
```

## Environment Variables

- `PRIVATE_KEY`: Zcash spending key (hex-encoded)
- `NETWORK`: Zcash network (mainnet/testnet)
- `PORT`: Server port (default: 8080)
- `LOG_LEVEL`: Logging level (info/debug/error)

## Building

```bash
docker build -t secret-signer:latest .
```

## Running

```bash
docker run -p 8080:8080 \
  -e PRIVATE_KEY=your-key-hex \
  -e NETWORK=mainnet \
  secret-signer:latest
```

## Testing

```bash
# Health check
curl http://localhost:8080/health

# Sign message
curl -X POST http://localhost:8080/api/secretsigner/sign \
  -H "Content-Type: application/json" \
  -d '{
    "keyStoreId": "zcash-spending-key",
    "message": "hex-message",
    "algorithm": "ECDSA"
  }'
```

## Security Notes

- Keys are stored in memory only (TEE isolation)
- Never expose private keys via API
- Use HTTPS in production
- Validate all inputs

