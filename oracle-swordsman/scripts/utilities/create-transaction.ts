/**
 * Create Zcash Transaction
 * Build and sign transactions to move funds
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

// Load addresses
const addressesPath = path.join(__dirname, 'zcash-addresses-controlled.json');
let addresses: any[] = [];

if (fs.existsSync(addressesPath)) {
  const data = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
  addresses = data.addresses || [];
}

interface TransactionInput {
  txid: string;
  vout: number;
  scriptPubKey: string;
  amount: number;
}

interface TransactionOutput {
  address: string;
  amount: number;
}

/**
 * Create a transparent transaction
 */
function createTransparentTransaction(
  fromAddress: string,
  fromPrivateKey: string,
  toAddress: string,
  amount: number,
  inputs: TransactionInput[]
): {
  success: boolean;
  transaction?: any;
  error?: string;
} {
  try {
    // Build transaction structure
    const transaction = {
      version: 4,
      locktime: 0,
      vin: inputs.map(input => ({
        txid: input.txid,
        vout: input.vout,
        scriptSig: '', // Will be filled with signature
        sequence: 0xffffffff,
      })),
      vout: [
        {
          value: amount,
          scriptPubKey: createScriptPubKey(toAddress),
        },
        // Change output (simplified - calculate properly)
        {
          value: 0, // Calculate change
          scriptPubKey: createScriptPubKey(fromAddress),
        },
      ],
    };

    // Sign transaction
    const txHash = crypto.createHash('sha256')
      .update(JSON.stringify(transaction))
      .digest();

    // Sign each input
    for (let i = 0; i < transaction.vin.length; i++) {
      const sign = crypto.createSign('SHA256');
      sign.update(txHash);
      sign.end();
      
      const signature = sign.sign({
        key: Buffer.from(fromPrivateKey, 'hex'),
        dsaEncoding: 'ieee-p1363',
      }, 'hex');
      
      transaction.vin[i].scriptSig = signature;
    }

    return {
      success: true,
      transaction,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create scriptPubKey (simplified)
 */
function createScriptPubKey(address: string): string {
  // Simplified - actual scriptPubKey is more complex
  return `OP_DUP OP_HASH160 ${address} OP_EQUALVERIFY OP_CHECKSIG`;
}

/**
 * Create transaction interface
 */
async function createTransactionInterface() {
  console.log('======================================');
  console.log('Create Zcash Transaction');
  console.log('======================================\n');

  if (addresses.length === 0) {
    console.log('❌ No addresses found. Run generate-addresses-proper.ts first.');
    return;
  }

  // Show available addresses
  console.log('[1] Available Addresses:\n');
  
  const tAddresses = addresses.filter(a => a.type === 'transparent');
  const zAddresses = addresses.filter(a => a.type === 'shielded');
  
  console.log('Transparent Addresses:');
  tAddresses.forEach((addr, i) => {
    console.log(`  ${i + 1}. ${addr.address}`);
    console.log(`     Private Key: ${addr.privateKey.substring(0, 16)}...`);
  });
  console.log('');
  
  console.log('Shielded Addresses:');
  zAddresses.forEach((addr, i) => {
    console.log(`  ${i + 1}. ${addr.address}`);
    console.log(`     Spending Key: ${addr.spendingKey.substring(0, 16)}...`);
  });
  console.log('');

  // Example transaction
  if (tAddresses.length >= 2) {
    console.log('[2] Example Transaction:\n');
    console.log(`From: ${tAddresses[0].address}`);
    console.log(`To: ${tAddresses[1].address}`);
    console.log(`Amount: 0.001 ZEC\n`);
    
    // Note: This is a simplified example
    // Real transactions need:
    // - UTXO selection
    // - Proper fee calculation
    // - Correct scriptPubKey
    // - Network submission
    
    console.log('⚠️  Note: This is a simplified transaction builder.');
    console.log('   For production, use:');
    console.log('   - zcash-cli sendtoaddress');
    console.log('   - Zcash SDK transaction builder');
    console.log('   - Proper UTXO management\n');
  }

  // Save transaction builder info
  const txBuilderInfo = {
    addresses: {
      transparent: tAddresses.length,
      shielded: zAddresses.length,
    },
    canCreateTransactions: true,
    note: 'Transaction building requires proper UTXO management and network submission.',
    createdAt: new Date().toISOString(),
  };

  const infoPath = path.join(__dirname, 'transaction-builder-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(txBuilderInfo, null, 2));
  console.log(`💾 Transaction builder info saved to: ${infoPath}\n`);
}

createTransactionInterface().catch(console.error);

