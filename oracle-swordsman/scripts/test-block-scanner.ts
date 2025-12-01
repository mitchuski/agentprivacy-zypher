/**
 * Test Block Scanner
 * Tests the new block scanner to detect transactions
 * 
 * Run with: npx ts-node scripts/test-block-scanner.ts
 */

import { LightwalletdClient } from '../src/lightwalletd-client';
import { BlockScanner } from '../src/block-scanner';
import { config } from '../src/config';
import logger from '../src/logger';

async function main() {
  console.log('=== Testing Block Scanner ===\n');

  try {
    // Initialize lightwalletd client
    const lwdClient = new LightwalletdClient({
      server: config.lightwalletd.server,
      insecure: config.lightwalletd.insecure,
    });

    // Initialize block scanner
    const scanner = new BlockScanner(lwdClient);

    console.log('[1] Initializing scanner...');
    await scanner.initialize();
    console.log('✅ Scanner initialized\n');

    console.log('[2] Scanning new blocks...');
    const transactions = await scanner.scanNewBlocks();
    
    console.log(`✅ Scan complete`);
    console.log(`   Found ${transactions.length} transactions\n`);

    if (transactions.length > 0) {
      console.log('Detected transactions:');
      transactions.forEach((tx, i) => {
        console.log(`\n[${i + 1}] Transaction:`);
        console.log(`   TXID: ${tx.txid}`);
        console.log(`   Address: ${tx.address}`);
        console.log(`   Amount: ${tx.amount} ZEC`);
        console.log(`   Block: ${tx.blockHeight}`);
        console.log(`   Confirmations: ${tx.confirmations}`);
        if (tx.memo) {
          console.log(`   Memo: ${tx.memo.substring(0, 100)}...`);
        }
        if (tx.submissionData) {
          console.log(`   Tracking Code: ${tx.submissionData.trackingCode}`);
          console.log(`   Tale ID: ${tx.submissionData.taleId}`);
        }
      });
    } else {
      console.log('No transactions found in scanned blocks.');
      console.log('This could mean:');
      console.log('  - No transactions to monitored addresses');
      console.log('  - Transactions are to shielded addresses (viewing key decryption needed)');
      console.log('  - No memos in transactions');
    }

    console.log('\n✅ Test complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

