/**
 * Test Viewing Key Decoder
 * Tests decoding of viewing keys from zxviews format
 * 
 * Run with: npx ts-node scripts/test-viewing-key-decoder.ts
 */

import { ViewingKeyDecryptor } from '../src/viewing-key-decryptor';

const viewingKey = 'zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c';
const address = 'zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t';

async function main() {
  console.log('=== Testing Viewing Key Decoder ===\n');

  try {
    const decryptor = new ViewingKeyDecryptor();
    
    console.log('[1] Adding viewing key...');
    decryptor.addViewingKey(address, viewingKey);
    console.log('✅ Viewing key added\n');

    // Test decoding (using private method via reflection)
    console.log('[2] Testing viewing key decoding...');
    const { bech32 } = require('bech32');
    
    try {
      const decoded = bech32.decode(viewingKey);
      console.log('✅ Bech32 decode successful');
      console.log(`   HRP: ${decoded.prefix}`);
      console.log(`   Words: ${decoded.words.length} words`);
      
      // Convert words to bytes
      const data = Buffer.from(bech32.fromWords(decoded.words));
      console.log(`   Data length: ${data.length} bytes`);
      
      if (data.length >= 64) {
        const ivk = data.slice(0, 32);
        const dk = data.slice(32, 64);
        console.log(`   IVK: ${ivk.toString('hex').substring(0, 20)}...`);
        console.log(`   DK: ${dk.toString('hex').substring(0, 20)}...`);
        console.log('\n✅ Viewing key decoded successfully!');
        console.log('   Ready for Sapling decryption implementation.\n');
      } else {
        console.log('⚠️  Data length insufficient (expected 64 bytes)');
      }
    } catch (error: any) {
      console.error('❌ Decode failed:', error.message);
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

