#!/bin/bash
# Build SecretSigner Docker Image

set -e

echo "Building SecretSigner Docker image..."

cd secretsigner

# Build image
docker build -t secret-signer:latest .

echo "✅ SecretSigner image built successfully"
echo "   Image: secret-signer:latest"
echo ""
echo "To test locally:"
echo "  docker run -p 8080:8080 \\"
echo "    -e PRIVATE_KEY=your-key-hex \\"
echo "    -e NETWORK=mainnet \\"
echo "    secret-signer:latest"

