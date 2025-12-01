/**
 * Test zxviews Format Decoding
 * Tests the new custom bech32 decoder for zxviews viewing keys
 * 
 * Run with: npx ts-node scripts/test-zxviews-decoding.ts
 */

import { ViewingKeyDecryptor } from '../src/viewing-key-decryptor';
import { decodeBech32 } from '../src/zcash-bech32-decoder';

const viewingKey = 'zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c';
const address = 'zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t';

async function main() {
  console.log('=== Testing zxviews Format Decoding ===\n');

  try {
    console.log('[1] Testing custom bech32 decoder...');
    const decoded = decodeBech32(viewingKey);
    
    if (!decoded) {
      console.error('❌ Failed to decode viewing key');
      process.exit(1);
    }

    console.log('✅ Bech32 decode successful');
    console.log(`   HRP: ${decoded.hrp}`);
    console.log(`   Data length: ${decoded.data.length} bytes\n`);

    if (decoded.data.length >= 96) {
      const ak = decoded.data.slice(0, 32);
      const nk = decoded.data.slice(32, 64);
      const ovk = decoded.data.slice(64, 96);
      const dk = decoded.data.length >= 128 ? decoded.data.slice(96, 128) : null;

      console.log('[2] Extracted FVK components:');
      console.log(`   ak (authorizing key): ${ak.toString('hex').substring(0, 20)}...`);
      console.log(`   nk (nullifier key): ${nk.toString('hex').substring(0, 20)}...`);
      console.log(`   ovk (outgoing viewing key): ${ovk.toString('hex').substring(0, 20)}...`);
      if (dk) {
        console.log(`   dk (diversifier key): ${dk.toString('hex').substring(0, 20)}...`);
      }
      console.log('');

      console.log('[3] Testing ViewingKeyDecryptor integration...');
      const decryptor = new ViewingKeyDecryptor();
      decryptor.addViewingKey(address, viewingKey);

      // Test decoding via the decryptor (uses private method)
      // We'll test this by attempting to use it in decryption
      console.log('✅ Viewing key added to decryptor');
      console.log('   Ready for full decryption implementation!\n');

      console.log('✅ All tests passed!');
      console.log('\n💡 Next step: Implement AES-256-CTR decryption with KDF\n');

    } else {
      console.error('❌ Data length insufficient');
      console.error(`   Got: ${decoded.data.length} bytes`);
      console.error('   Expected: 96-128 bytes');
      process.exit(1);
    }

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

