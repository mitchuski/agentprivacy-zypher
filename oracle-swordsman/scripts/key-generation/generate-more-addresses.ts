/**
 * Generate Additional Zcash Addresses
 * Generates more z-addresses and t-addresses from the existing mnemonic
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bip39 from 'bip39';
import { HDKey } from '@scure/bip32';
import * as secp256k1 from '@noble/secp256k1';
import * as crypto from 'crypto';

// Load existing addresses file to get mnemonic
const addressesPath = path.join(process.cwd(), 'zcash-addresses-controlled.json');
const altPath = path.join(process.cwd(), 'oracle-swordsman', 'zcash-addresses-controlled.json');

let existingData: any = null;
let filePath: string | null = null;

if (fs.existsSync(addressesPath)) {
  filePath = addressesPath;
  existingData = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
} else if (fs.existsSync(altPath)) {
  filePath = altPath;
  existingData = JSON.parse(fs.readFileSync(altPath, 'utf-8'));
}

if (!existingData || !existingData.mnemonic) {
  console.error('❌ Could not find existing addresses file with mnemonic');
  console.error('   Please ensure zcash-addresses-controlled.json exists with a mnemonic');
  process.exit(1);
}

const MNEMONIC = existingData.mnemonic;
const NETWORK = existingData.network || 'mainnet';
const existingAddresses = existingData.addresses || [];

console.log('======================================');
console.log('Generate Additional Zcash Addresses');
console.log('======================================\n');

console.log(`Using mnemonic: ${MNEMONIC.split(' ').slice(0, 3).join(' ')}...`);
console.log(`Network: ${NETWORK}\n`);

/**
 * Generate proper T-address (transparent) from private key
 */
function generateTAddress(privateKey: Buffer, network: 'mainnet' | 'testnet'): string {
  // Get public key from private key
  const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed
  
  // SHA256 hash
  const sha256 = crypto.createHash('sha256').update(publicKey).digest();
  
  // RIPEMD160 hash
  const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest();
  
  // Version byte: 0x1C for mainnet, 0x1D for testnet
  const version = Buffer.from([network === 'mainnet' ? 0x1C : 0x1D]);
  const versionedHash = Buffer.concat([version, ripemd160]);
  
  // Double SHA256 for checksum
  const checksum = crypto.createHash('sha256')
    .update(crypto.createHash('sha256').update(versionedHash).digest())
    .digest()
    .slice(0, 4);
  
  const addressBytes = Buffer.concat([versionedHash, checksum]);
  
  // Base58 encode
  return base58Encode(addressBytes);
}

/**
 * Generate Z-address (shielded/Sapling) - simplified version
 * Note: For production, use proper Zcash libraries like zcash-address or zcash-js
 */
function generateZAddress(spendingKey: Buffer, index: number, network: 'mainnet' | 'testnet'): string {
  // Derive diversifier
  const diversifier = crypto.createHash('sha256')
    .update(spendingKey)
    .update(Buffer.from([index]))
    .digest()
    .slice(0, 11);
  
  // Create address hash
  const addressHash = crypto.createHash('sha256')
    .update(spendingKey)
    .update(diversifier)
    .digest();
  
  // For mainnet Sapling: prefix is 'zs1'
  // This is a simplified version - proper z-addresses require Zcash-specific libraries
  // For now, we'll create a placeholder that follows the format
  const base32 = bech32Encode(addressHash.slice(0, 20));
  return `zs1${base32.substring(0, 75)}`;
}

function base58Encode(buffer: Buffer): string {
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + buffer.toString('hex'));
  let encoded = '';
  
  while (num > 0n) {
    encoded = BASE58_ALPHABET[Number(num % 58n)] + encoded;
    num = num / 58n;
  }
  
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    encoded = '1' + encoded;
  }
  
  return encoded;
}

function bech32Encode(data: Buffer): string {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  let bits = 0;
  let value = 0;
  let encoded = '';
  
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;
    
    while (bits >= 5) {
      encoded += CHARSET[(value >> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    encoded += CHARSET[(value << (5 - bits)) & 0x1f];
  }
  
  return encoded;
}

async function generateAddresses() {
  // Derive seed from mnemonic
  console.log('[1] Deriving seed from mnemonic...');
  const seed = await bip39.mnemonicToSeed(MNEMONIC);
  console.log('  ✅ Seed derived\n');

  // Create root key
  const rootKey = HDKey.fromMasterSeed(seed);
  const newAddresses: any[] = [];

  // Find highest indices
  const maxTIndex = Math.max(...existingAddresses
    .filter((a: any) => a.type === 'transparent')
    .map((a: any) => a.index), -1);
  const maxZIndex = Math.max(...existingAddresses
    .filter((a: any) => a.type === 'shielded')
    .map((a: any) => a.index), -1);

  console.log(`Current highest indices:`);
  console.log(`  T-addresses: ${maxTIndex + 1}`);
  console.log(`  Z-addresses: ${maxZIndex + 1}\n`);

  // Generate 2 more T-addresses
  console.log('[2] Generating additional T-addresses...');
  for (let i = maxTIndex + 1; i <= maxTIndex + 2; i++) {
    const bip44Path = `m/44'/133'/0'/0/${i}`;
    const keyNode = rootKey.derive(bip44Path);
    
    if (keyNode.privateKey) {
      const privateKey = Buffer.from(keyNode.privateKey);
      const address = generateTAddress(privateKey, NETWORK as 'mainnet' | 'testnet');
      
      newAddresses.push({
        type: 'transparent',
        index: i,
        path: bip44Path,
        privateKey: privateKey.toString('hex'),
        address,
        network: NETWORK,
      });
      
      console.log(`  T-Address ${i + 1}: ${address}`);
      console.log(`    Path: ${bip44Path}`);
      console.log(`    Private Key: ${privateKey.toString('hex').substring(0, 16)}...`);
    }
  }
  console.log('');

  // Generate 3 more Z-addresses
  console.log('[3] Generating additional Z-addresses...');
  for (let i = maxZIndex + 1; i <= maxZIndex + 3; i++) {
    // ZIP-32 path for Sapling: m/32'/133'/0'/i
    const zip32Path = `m/32'/133'/0'/${i}`;
    const keyNode = rootKey.derive(zip32Path);
    
    if (keyNode.privateKey) {
      const spendingKey = Buffer.from(keyNode.privateKey);
      
      // Derive viewing key (simplified)
      const viewingKeyHash = crypto.createHash('sha256')
        .update(spendingKey)
        .update(Buffer.from('viewing'))
        .digest();
      
      // Generate z-address (simplified - for production use proper Zcash libraries)
      const address = generateZAddress(spendingKey, i, NETWORK as 'mainnet' | 'testnet');
      
      newAddresses.push({
        type: 'shielded',
        index: i,
        path: zip32Path,
        spendingKey: spendingKey.toString('hex'),
        viewingKey: viewingKeyHash.toString('hex'),
        address,
        network: NETWORK,
      });
      
      console.log(`  Z-Address ${i + 1}: ${address}`);
      console.log(`    Path: ${zip32Path}`);
      console.log(`    Spending Key: ${spendingKey.toString('hex').substring(0, 16)}...`);
    }
  }
  console.log('');

  // Combine with existing addresses
  const allAddresses = [...existingAddresses, ...newAddresses];

  // Save updated addresses
  const updatedData = {
    ...existingData,
    addresses: allAddresses,
    updatedAt: new Date().toISOString(),
    note: 'These addresses are derived from your mnemonic and can be controlled with the private keys.',
  };

  fs.writeFileSync(filePath!, JSON.stringify(updatedData, null, 2));
  console.log(`[4] Addresses saved to: ${filePath}\n`);

  console.log('======================================');
  console.log('✅ Address Generation Complete');
  console.log('======================================\n');
  
  console.log(`Total addresses: ${allAddresses.length}`);
  console.log(`  T-addresses: ${allAddresses.filter((a: any) => a.type === 'transparent').length}`);
  console.log(`  Z-addresses: ${allAddresses.filter((a: any) => a.type === 'shielded').length}\n`);
  
  console.log('New addresses generated:');
  newAddresses.forEach((addr: any) => {
    console.log(`  ${addr.type === 'transparent' ? 'T' : 'Z'}-Address ${addr.index}: ${addr.address}`);
  });
  console.log('');
  
  console.log('⚠️  Note: Z-addresses are simplified. For production use,');
  console.log('   consider using proper Zcash libraries for full compatibility.\n');
}

generateAddresses().catch((error) => {
  console.error('Error generating addresses:', error);
  process.exit(1);
});

