/**
 * Generate Zcash Keys and Save Securely
 * Shows keys, saves to file, waits for user to save before deleting
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bip39 from 'bip39';
import { HDKey } from '@scure/bip32';
import * as readline from 'readline';

interface ZcashKeys {
  mnemonic: string;
  seedFingerprint: string;
  spendingKey?: string;
  viewingKey?: string;
  transparentPrivateKey?: string;
  note: string;
}

async function generateZcashKeys(): Promise<ZcashKeys> {
  console.log('======================================');
  console.log('Generate Zcash Keys');
  console.log('======================================\n');

  // Generate mnemonic
  console.log('[1] Generating mnemonic...');
  const mnemonic = bip39.generateMnemonic(256); // 24 words
  console.log(`  ✅ Mnemonic: ${mnemonic}\n`);

  // Derive seed
  console.log('[2] Deriving seed...');
  const seed = await bip39.mnemonicToSeed(mnemonic);
  console.log(`  ✅ Seed derived\n`);

  // Calculate seed fingerprint
  console.log('[3] Calculating seed fingerprint...');
  const crypto = require('crypto');
  const seedHash = crypto.createHash('sha256').update(seed).digest();
  const fingerprintBytes = seedHash.slice(0, 4);
  const seedFingerprint = `zip32seedfp${Buffer.from(fingerprintBytes).toString('hex')}`;
  console.log(`  ✅ Seed fingerprint: ${seedFingerprint}\n`);

  // Derive keys
  console.log('[4] Deriving Zcash keys...');
  const rootKey = HDKey.fromMasterSeed(seed);
  
  // Zcash derivation paths (simplified - full implementation needs Zcash libs)
  const spendingKeyNode = rootKey.derive("m/32'/133'/0'/0'");
  const viewingKeyNode = rootKey.derive("m/32'/133'/0'/1'");
  const transparentKeyNode = rootKey.derive("m/44'/133'/0'/0/0");

  const spendingKeyHex = spendingKeyNode.privateKey 
    ? Buffer.from(spendingKeyNode.privateKey).toString('hex')
    : undefined;
  const viewingKeyHex = viewingKeyNode.privateKey
    ? Buffer.from(viewingKeyNode.privateKey).toString('hex')
    : undefined;
  const transparentKeyHex = transparentKeyNode.privateKey
    ? Buffer.from(transparentKeyNode.privateKey).toString('hex')
    : undefined;

  console.log(`  ✅ Keys derived\n`);

  return {
    mnemonic,
    seedFingerprint,
    spendingKey: spendingKeyHex,
    viewingKey: viewingKeyHex,
    transparentPrivateKey: transparentKeyHex,
    note: 'These keys are derived using BIP32 paths. Full Zcash addresses require Zcash-specific libraries for proper encoding.',
  };
}

function saveKeysToFile(keys: ZcashKeys): string {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `zcash-keys-${timestamp}.json`;
  const filepath = path.join(tempDir, filename);

  const keysToSave = {
    ...keys,
    generatedAt: new Date().toISOString(),
    warning: '⚠️  KEEP THIS FILE SECURE - Contains private keys and mnemonic!',
    instructions: [
      '1. Save this file to a secure, encrypted location',
      '2. Backup the mnemonic phrase separately (write it down)',
      '3. Never share these keys with anyone',
      '4. Use these keys only for production Oracle Swordsman',
    ],
  };

  fs.writeFileSync(filepath, JSON.stringify(keysToSave, null, 2));
  return filepath;
}

function displayKeys(keys: ZcashKeys, filepath: string) {
  console.log('\n======================================');
  console.log('🔐 ZCASH KEYS GENERATED');
  console.log('======================================\n');
  
  console.log('📄 File saved to:');
  console.log(`   ${filepath}\n`);
  
  console.log('🔑 Key Details:');
  console.log(`   Seed Fingerprint: ${keys.seedFingerprint}`);
  console.log(`   Mnemonic (24 words):`);
  console.log(`   ${keys.mnemonic}\n`);
  console.log(`   Spending Key: ${keys.spendingKey?.substring(0, 32)}...`);
  console.log(`   Viewing Key: ${keys.viewingKey?.substring(0, 32)}...`);
  console.log(`   Transparent Private Key: ${keys.transparentPrivateKey?.substring(0, 32)}...\n`);
  
  console.log('⚠️  IMPORTANT:');
  console.log('   1. Copy the file to a secure location NOW');
  console.log('   2. Write down the mnemonic phrase');
  console.log('   3. These keys control your Zcash funds');
  console.log('   4. Never share these keys\n');
  
  console.log('📝 Note:');
  console.log(`   ${keys.note}\n`);
}

async function waitForUser(filepath: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    console.log('⏳ File will be deleted in 30 seconds...');
    console.log('   Press Ctrl+C to keep the file, or wait for auto-delete\n');
    
    const timer = setTimeout(() => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('   ✅ Temporary file deleted');
      }
      rl.close();
      resolve();
    }, 30000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearTimeout(timer);
      console.log('\n\n✅ File kept at:', filepath);
      console.log('   Remember to save it securely!\n');
      rl.close();
      resolve();
    });
  });
}

async function main() {
  try {
    const keys = await generateZcashKeys();
    const filepath = saveKeysToFile(keys);
    
    displayKeys(keys, filepath);
    await waitForUser(filepath);

  } catch (error: any) {
    console.error('\n❌ Failed to generate keys:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

