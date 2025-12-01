/**
 * SecretSigner Server
 * Zcash transaction signing service running in Nillion TEE
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const NETWORK = process.env.NETWORK || 'mainnet';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Load private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('ERROR: PRIVATE_KEY environment variable not set');
  process.exit(1);
}

// Key storage (in TEE, keys are isolated)
const keyStore = new Map();

// Initialize with spending key from environment
const keyStoreId = 'zcash-spending-key';
keyStore.set(keyStoreId, {
  privateKey: PRIVATE_KEY,
  algorithm: 'ECDSA',
  label: 'zcash-spending-key',
  createdAt: new Date().toISOString(),
});

console.log(`SecretSigner started on port ${PORT}`);
console.log(`Network: ${NETWORK}`);
console.log(`Key store initialized with ${keyStore.size} key(s)`);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'secret-signer',
    network: NETWORK,
    keysStored: keyStore.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Store a private key
 * POST /api/secretsigner/store
 */
app.post('/api/secretsigner/store', (req, res) => {
  try {
    const { privateKey, algorithm = 'ECDSA', label } = req.body;

    if (!privateKey) {
      return res.status(400).json({ error: 'privateKey is required' });
    }

    // Generate unique key store ID
    const keyStoreId = `key-${crypto.randomBytes(8).toString('hex')}`;

    // Store key (in TEE, this is isolated)
    keyStore.set(keyStoreId, {
      privateKey,
      algorithm,
      label: label || keyStoreId,
      createdAt: new Date().toISOString(),
    });

    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.log(`Key stored: ${keyStoreId} (${algorithm})`);
    }

    res.status(200).json({
      keyStoreId,
      algorithm,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing key:', error);
    res.status(500).json({ error: 'Failed to store key' });
  }
});

/**
 * Sign a message using a stored key
 * POST /api/secretsigner/sign
 */
app.post('/api/secretsigner/sign', (req, res) => {
  try {
    const { keyStoreId, message, algorithm = 'ECDSA' } = req.body;

    if (!keyStoreId || !message) {
      return res.status(400).json({ 
        error: 'keyStoreId and message are required' 
      });
    }

    // Get key from store
    const keyData = keyStore.get(keyStoreId);
    if (!keyData) {
      return res.status(404).json({ error: 'Key not found' });
    }

    // Convert message from hex to Buffer
    const messageBuffer = Buffer.from(message, 'hex');

    // Sign using Node.js crypto (ECDSA)
    // Note: In production, use proper Zcash signing libraries
    const sign = crypto.createSign('SHA256');
    sign.update(messageBuffer);
    sign.end();

    // For ECDSA, we need to use the private key properly
    // This is a simplified version - actual Zcash signing is more complex
    const privateKeyBuffer = Buffer.from(keyData.privateKey, 'hex');
    
    // Create signature (simplified - actual Zcash uses secp256k1)
    const signature = sign.sign({
      key: privateKeyBuffer,
      dsaEncoding: 'ieee-p1363',
    }, 'hex');

    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.log(`Message signed with key: ${keyStoreId}`);
    }

    res.status(200).json({
      signature,
      keyStoreId,
      algorithm,
    });
  } catch (error) {
    console.error('Error signing message:', error);
    res.status(500).json({ error: 'Failed to sign message' });
  }
});

/**
 * List stored keys
 * GET /api/secretsigner/keys
 */
app.get('/api/secretsigner/keys', (req, res) => {
  try {
    const keys = Array.from(keyStore.keys()).map(keyId => {
      const keyData = keyStore.get(keyId);
      return {
        keyStoreId: keyId,
        algorithm: keyData.algorithm,
        label: keyData.label,
        createdAt: keyData.createdAt,
      };
    });

    res.status(200).json({ keys });
  } catch (error) {
    console.error('Error listing keys:', error);
    res.status(500).json({ error: 'Failed to list keys' });
  }
});

/**
 * Get key info (without exposing private key)
 * GET /api/secretsigner/keys/:keyStoreId
 */
app.get('/api/secretsigner/keys/:keyStoreId', (req, res) => {
  try {
    const { keyStoreId } = req.params;
    const keyData = keyStore.get(keyStoreId);

    if (!keyData) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.status(200).json({
      keyStoreId,
      algorithm: keyData.algorithm,
      label: keyData.label,
      createdAt: keyData.createdAt,
    });
  } catch (error) {
    console.error('Error getting key info:', error);
    res.status(500).json({ error: 'Failed to get key info' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SecretSigner API listening on port ${PORT}`);
  console.log(`Environment: ${NETWORK}`);
  console.log(`Log level: ${LOG_LEVEL}`);
});

