/**
 * Test @airgap/sapling-wasm Library
 * Check what functions are available for viewing key decryption
 */

async function testSaplingWasm() {
  console.log('=== Testing @airgap/sapling-wasm ===\n');

  try {
    console.log('[1] Loading module...');
    const sapling = require('@airgap/sapling-wasm');
    console.log('✅ Module loaded\n');

    console.log('[2] Checking exports...');
    console.log('Type:', typeof sapling);
    console.log('Is object:', typeof sapling === 'object');
    
    if (typeof sapling === 'object') {
      const keys = Object.keys(sapling);
      console.log(`Total exports: ${keys.length}`);
      console.log('\nFirst 30 exports:');
      keys.slice(0, 30).forEach((key, i) => {
        console.log(`  ${i + 1}. ${key}: ${typeof sapling[key]}`);
      });
      
      if (keys.length > 30) {
        console.log(`  ... and ${keys.length - 30} more`);
      }
    }

    // Check for common Sapling functions
    console.log('\n[3] Looking for decryption functions...');
    const decryptionKeywords = ['decrypt', 'viewing', 'ivk', 'note', 'output', 'trial'];
    const found = Object.keys(sapling).filter(key => 
      decryptionKeywords.some(kw => key.toLowerCase().includes(kw))
    );
    
    if (found.length > 0) {
      console.log('✅ Found potential decryption functions:');
      found.forEach(fn => console.log(`  - ${fn}`));
    } else {
      console.log('⚠️  No obvious decryption functions found');
      console.log('   May need to check documentation or source code');
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

testSaplingWasm().catch(console.error);

