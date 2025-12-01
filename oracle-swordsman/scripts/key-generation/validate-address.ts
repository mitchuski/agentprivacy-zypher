/**
 * Validate Zcash Address
 * Checks if the generated address is valid
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const T_ADDRESS = 'CXAGFsyjoHDpKoXdhq9YbTkPfdQDjNAoXJ';
const Z_ADDRESS = 'zs1pdxcp0h2lpz9yqjts9rtvz3wncu2mev0';

/**
 * Base58 decode
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Decode(encoded: string): Buffer {
  let num = 0n;
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    num = num * 58n + BigInt(index);
  }
  
  // Convert to hex
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  
  return Buffer.from(hex, 'hex');
}

/**
 * Verify checksum
 */
function verifyChecksum(data: Buffer): boolean {
  if (data.length < 4) return false;
  
  const payload = data.slice(0, -4);
  const checksum = data.slice(-4);
  
  const hash = crypto.createHash('sha256').update(payload).digest();
  const calculatedChecksum = crypto.createHash('sha256').update(hash).digest().slice(0, 4);
  
  return checksum.equals(calculatedChecksum);
}

/**
 * Validate t-address
 */
function validateTAddress(address: string): {
  valid: boolean;
  network?: string;
  version?: number;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check length (Zcash t-addresses are typically 34 characters)
  if (address.length < 26 || address.length > 35) {
    errors.push(`Invalid length: ${address.length} (expected 26-35)`);
  }
  
  // Check base58 encoding
  let decoded: Buffer;
  try {
    decoded = base58Decode(address);
  } catch (error: any) {
    errors.push(`Invalid base58 encoding: ${error.message}`);
    return { valid: false, errors };
  }
  
  // Check minimum length (version + hash + checksum = 1 + 20 + 4 = 25 bytes)
  if (decoded.length < 25) {
    errors.push(`Decoded address too short: ${decoded.length} bytes`);
    return { valid: false, errors };
  }
  
  // Extract version byte
  const version = decoded[0];
  
  // Check version (mainnet: 0x1C, testnet: 0x1D)
  let network: string | undefined;
  if (version === 0x1C) {
    network = 'mainnet';
  } else if (version === 0x1D) {
    network = 'testnet';
  } else {
    errors.push(`Unknown version byte: 0x${version.toString(16)}`);
  }
  
  // Verify checksum
  if (!verifyChecksum(decoded)) {
    errors.push('Checksum verification failed');
  }
  
  return {
    valid: errors.length === 0,
    network,
    version,
    errors,
  };
}

/**
 * Validate z-address (Sapling)
 */
function validateZAddress(address: string): {
  valid: boolean;
  network?: string;
  type?: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check prefix
  if (address.startsWith('zs1')) {
    // Mainnet Sapling
    if (address.length !== 78) {
      errors.push(`Invalid length: ${address.length} (expected 78 for mainnet Sapling)`);
    }
    return {
      valid: errors.length === 0,
      network: 'mainnet',
      type: 'sapling',
      errors,
    };
  } else if (address.startsWith('ztestsapling1')) {
    // Testnet Sapling
    if (address.length !== 78) {
      errors.push(`Invalid length: ${address.length} (expected 78 for testnet Sapling)`);
    }
    return {
      valid: errors.length === 0,
      network: 'testnet',
      type: 'sapling',
      errors,
    };
  } else {
    errors.push(`Invalid prefix: ${address.substring(0, 10)} (expected zs1 or ztestsapling1)`);
    return {
      valid: false,
      errors,
    };
  }
}

async function main() {
  console.log('======================================');
  console.log('Validate Zcash Addresses');
  console.log('======================================\n');

  // Validate T-Address
  console.log('[1] Validating T-Address...');
  console.log(`    Address: ${T_ADDRESS}\n`);
  
  const tResult = validateTAddress(T_ADDRESS);
  
  if (tResult.valid) {
    console.log('  ✅ T-Address is valid!');
    console.log(`     Network: ${tResult.network}`);
    console.log(`     Version: 0x${tResult.version?.toString(16)}`);
  } else {
    console.log('  ⚠️  T-Address validation issues:');
    tResult.errors.forEach(error => {
      console.log(`     - ${error}`);
    });
    if (tResult.network) {
      console.log(`     Network detected: ${tResult.network}`);
    }
  }
  console.log('');

  // Validate Z-Address
  console.log('[2] Validating Z-Address...');
  console.log(`    Address: ${Z_ADDRESS}\n`);
  
  const zResult = validateZAddress(Z_ADDRESS);
  
  if (zResult.valid) {
    console.log('  ✅ Z-Address is valid!');
    console.log(`     Network: ${zResult.network}`);
    console.log(`     Type: ${zResult.type}`);
  } else {
    console.log('  ⚠️  Z-Address validation issues:');
    zResult.errors.forEach(error => {
      console.log(`     - ${error}`);
    });
    if (zResult.network) {
      console.log(`     Network detected: ${zResult.network}`);
    }
  }
  console.log('');

  // Summary
  console.log('======================================');
  console.log('Validation Summary');
  console.log('======================================\n');
  
  console.log('T-Address:');
  console.log(`  Address: ${T_ADDRESS}`);
  console.log(`  Valid: ${tResult.valid ? '✅ Yes' : '⚠️  Issues found'}`);
  if (tResult.network) {
    console.log(`  Network: ${tResult.network}`);
  }
  console.log('');
  
  console.log('Z-Address:');
  console.log(`  Address: ${Z_ADDRESS}`);
  console.log(`  Valid: ${zResult.valid ? '✅ Yes' : '⚠️  Issues found'}`);
  if (zResult.network) {
    console.log(`  Network: ${zResult.network}`);
    console.log(`  Type: ${zResult.type}`);
  }
  console.log('');

  // Save validation results
  const validationResults = {
    tAddress: {
      address: T_ADDRESS,
      ...tResult,
    },
    zAddress: {
      address: Z_ADDRESS,
      ...zResult,
    },
    validatedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, 'address-validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(validationResults, null, 2));
  console.log(`💾 Validation results saved to: ${outputPath}\n`);

  console.log('⚠️  Note:');
  console.log('   For production, verify addresses with:');
  console.log('   - zcash-cli validateaddress <address>');
  console.log('   - Zcash block explorer');
  console.log('   - Proper Zcash SDK validation\n');
}

main().catch(console.error);

