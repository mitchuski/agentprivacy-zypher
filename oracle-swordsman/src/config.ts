import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Nillion (optional - placeholder if not set)
  nillion: {
    apiKey: process.env.NILLION_API_KEY || 'placeholder-nillion-api-key',
    network: process.env.NILLION_NETWORK || 'testnet',
    apiUrl: process.env.NILLION_API_URL || 'https://api.nilcc.nillion.network',
    apiVersion: 'v1',
    timeout: parseInt(process.env.NILLION_TIMEOUT || '30000'),
  },

  // NEAR Cloud AI
  near: {
    mageApiKey: process.env.NEAR_API_KEY!,
    swordsmanApiKey: process.env.NEAR_SWORDSMAN_API_KEY || process.env.NEAR_API_KEY!,
    model: process.env.NEAR_MODEL || 'openai/gpt-oss-120b',
    apiUrl: process.env.NEAR_API_URL || 'https://cloud-api.near.ai/v1',
    chatEndpoint: 'https://cloud-api.near.ai/v1/chat/completions',
    attestationEndpoint: 'https://cloud-api.near.ai/v1/attestation/report',
  },

  // IPFS
  ipfs: {
    jwt: process.env.PINATA_JWT!,
    gateway: process.env.PINATA_GATEWAY || 'https://red-acute-chinchilla-216.mypinata.cloud',
    spellbookCid: process.env.SPELLBOOK_CID || 'bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq',
    spellbookUrl: process.env.SPELLBOOK_URL || 'https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq',
  },

  // Zebra (full node - blockchain data only, NO wallet functionality)
  zebra: {
    network: process.env.ZCASH_NETWORK || 'mainnet',
    rpcPort: parseInt(process.env.ZEBRA_RPC_PORT || '8233'),
    rpcHost: process.env.ZEBRA_RPC_HOST || '127.0.0.1',
    rpcUrl: process.env.ZEBRA_RPC_URL || 'http://127.0.0.1:8233',
    cookieFilePath: process.env.ZEBRA_COOKIE_PATH || (process.env.APPDATA ? `${process.env.APPDATA}/../Local/zebra/.cookie` : '~/.zebra/.cookie'),
  },

  // Zallet (wallet - signing, keys, balances, sending)
  zallet: {
    rpcPort: parseInt(process.env.ZALLET_RPC_PORT || '28232'),
    rpcHost: process.env.ZALLET_RPC_HOST || '127.0.0.1',
    rpcUrl: process.env.ZALLET_RPC_URL || 'http://127.0.0.1:28232',
    rpcUser: process.env.ZALLET_RPC_USER || '',
    rpcPassword: process.env.ZALLET_RPC_PASS || '',
    timeout: parseInt(process.env.ZALLET_TIMEOUT || '60000'),
  },

  // Legacy zcash config (for backward compatibility)
  zcash: {
    network: process.env.ZCASH_NETWORK || 'mainnet',
    rpcPort: parseInt(process.env.ZCASH_RPC_PORT || (process.env.ZCASH_NETWORK === 'testnet' ? '18232' : '8232')),
    rpcHost: process.env.ZCASH_RPC_HOST || '127.0.0.1',
    rpcUrl: process.env.ZCASH_RPC_URL,
    cookieFilePath: process.env.ZCASH_COOKIE_FILE_PATH,
  },

  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Oracle settings
  oracle: {
    checkInterval: parseInt(process.env.ORACLE_CHECK_INTERVAL || '30') * 1000,
    retryAttempts: parseInt(process.env.ORACLE_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.ORACLE_RETRY_DELAY || '60') * 1000,
  },

  // Economic model
  economics: {
    proverb_cost: parseFloat(process.env.PROVERB_COST || '0.01'),
    public_split: parseFloat(process.env.PUBLIC_SPLIT || '0.618'),
    private_split: parseFloat(process.env.PRIVATE_SPLIT || '0.382'),
    network_fee: parseFloat(process.env.NETWORK_FEE || '0.0001'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/proverb-protocol.log',
  },
};

// Validate required env vars
const required = [
  'NEAR_API_KEY',
  'NEAR_SWORDSMAN_API_KEY',
  'DATABASE_URL',
];

const recommended = [
  'PINATA_JWT',
  'SPELLBOOK_CID',
];

const optional = [
  'NILLION_API_KEY',
];

const missing: string[] = [];
for (const key of required) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(key => console.error('  - ' + key));
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

const missingRecommended: string[] = [];
for (const key of recommended) {
  if (!process.env[key]) {
    missingRecommended.push(key);
  }
}

if (missingRecommended.length > 0) {
  console.warn('\nRecommended env vars not set (using defaults):');
  missingRecommended.forEach(key => console.warn('  - ' + key));
}

const missingOptional: string[] = [];
for (const key of optional) {
  if (!process.env[key]) {
    missingOptional.push(key);
  }
}

if (missingOptional.length > 0) {
  console.warn('\nOptional env vars not set:');
  missingOptional.forEach(key => console.warn('  - ' + key));
}
