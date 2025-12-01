/**
 * Simple Zebra Connection Test
 * Tests just the zebra RPC connection without requiring other services
 */

import { ZcashClient } from '../../src/zcash-client';

async function testZebra() {
  console.log('======================================');
  console.log('Zebra Node Connection Test');
  console.log('======================================\n');

  try {
    const client = new ZcashClient({
      network: 'mainnet',
      rpcPort: 8233,
      rpcHost: '127.0.0.1',
    });

    console.log('Testing connection to zebra node...');
    console.log('  Host: 127.0.0.1');
    console.log('  Port: 8233');
    console.log('  Network: mainnet\n');

    // Test 1: Initialize (tests connection)
    console.log('[1] Testing connection...');
    await client.initialize();
    console.log('  ✓ Connected successfully!\n');

    // Test 2: Get block height
    console.log('[2] Testing getBlockHeight...');
    const height = await client.getBlockHeight();
    console.log(`  ✓ Block height: ${height}\n`);

    // Test 3: Get balance
    console.log('[3] Testing getBalance...');
    const balance = await client.getBalance();
    console.log('  ✓ Balance retrieved');
    console.log(`  Transparent: ${balance.transparent} ZEC`);
    console.log(`  Shielded: ${balance.shielded} ZEC`);
    console.log(`  Total: ${balance.total} ZEC\n`);

    console.log('======================================');
    console.log('✓ All tests passed!');
    console.log('Zebra node is ready for production use.');
    console.log('======================================');

  } catch (error: any) {
    console.error('\n✗ Error connecting to zebra:');
    console.error(`  ${error.message}\n`);
    
    if (error.message.includes('Cookie file not found')) {
      console.log('Tip: Make sure zebra is running and has created the cookie file.');
      console.log('     Cookie file should be at: %LOCALAPPDATA%\\zebra\\.cookie');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('Tip: Make sure zebra is running and RPC is enabled.');
      console.log('     Check that port 8233 is accessible.');
    }
    
    process.exit(1);
  }
}

testZebra();

