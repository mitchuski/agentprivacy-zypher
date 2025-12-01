/**
 * Test Transaction Query
 * Test querying your transaction at block 3150152
 * 
 * Run with: npx ts-node scripts/test-transaction-query.ts
 */

import { ZcashClient } from '../src/zcash-client';
import { TransactionQuery } from '../src/transaction-query';
import { config } from '../src/config';

const YOUR_TXID = '24c1867dfd911e8b2e2213d91f14a9928ef35a3046ae03be47cb2972c525ee84';
const YOUR_BLOCK = 3150152;
const YOUR_ADDRESS = 'zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t';

async function main() {
  console.log('=== Testing Transaction Query ===\n');
  console.log(`TXID: ${YOUR_TXID}`);
  console.log(`Block: ${YOUR_BLOCK}`);
  console.log(`Address: ${YOUR_ADDRESS}\n`);

  try {
    const zcashClient = new ZcashClient();
    
    console.log('[1] Initializing Zcash client...');
    await zcashClient.initialize();
    console.log('✅ Client initialized\n');

    console.log('[2] Querying transaction directly...');
    try {
      const tx = await (zcashClient as any).execCommandJSON('getrawtransaction', YOUR_TXID, 1);
      
      if (tx) {
        console.log('✅ Transaction found!');
        console.log(`   Block: ${tx.height}`);
        console.log(`   Confirmations: ${tx.confirmations || 'N/A'}`);
        console.log(`   Version: ${tx.version}`);
        console.log(`   Shielded outputs: ${tx.vShieldedOutput?.length || 0}`);
        console.log(`   Transparent outputs: ${tx.vout?.length || 0}`);
        
        if (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) {
          console.log('\n   ⚠️  Shielded transaction detected');
          console.log('   Need viewing key decryption to extract memo');
          console.log(`   Outputs: ${tx.vShieldedOutput.length}`);
        }
        
        if (tx.vout && tx.vout.length > 0) {
          console.log('\n   Transparent outputs:');
          for (let i = 0; i < tx.vout.length; i++) {
            const out = tx.vout[i];
            console.log(`     Output ${i}: ${out.value || 0} ZEC`);
            if (out.scriptPubKey) {
              console.log(`       Addresses: ${out.scriptPubKey.addresses?.join(', ') || 'N/A'}`);
              if (out.scriptPubKey.asm?.startsWith('OP_RETURN')) {
                console.log(`       OP_RETURN detected!`);
              }
            }
          }
        }
      } else {
        console.log('❌ Transaction not found');
      }
    } catch (error: any) {
      console.error('❌ Error querying transaction:', error.message);
    }

    console.log('\n[3] Testing TransactionQuery class...');
    const query = new TransactionQuery(zcashClient, [YOUR_ADDRESS]);
    const result = await query.queryTransaction(YOUR_TXID);
    
    if (result) {
      console.log('✅ TransactionQuery found transaction!');
      console.log(`   Address: ${result.address}`);
      console.log(`   Amount: ${result.amount} ZEC`);
      console.log(`   Memo: ${result.memo?.substring(0, 100) || 'N/A'}...`);
      if (result.submissionData) {
        console.log(`   Tracking Code: ${result.submissionData.trackingCode}`);
        console.log(`   Tale ID: ${result.submissionData.taleId}`);
      }
    } else {
      console.log('⚠️  TransactionQuery returned null');
      console.log('   (Likely because it\'s a shielded transaction)');
    }

    console.log('\n✅ Test complete!\n');
    console.log('💡 For shielded transactions, we still need viewing key decryption.\n');

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

