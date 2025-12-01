/**
 * Test lightwalletd gRPC Connection
 * Quick test script to verify the gRPC client works
 */

import { LightwalletdClient } from './lightwalletd-client';
import { config } from './config';
import logger from './logger';

async function testConnection() {
  console.log('=== Testing lightwalletd gRPC Connection ===\n');

  const client = new LightwalletdClient({
    server: config.lightwalletd.server,
    insecure: config.lightwalletd.insecure,
  });

  try {
    console.log('[1] Connecting to lightwalletd...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('[2] Getting lightwalletd info...');
    const info = await client.getInfo();
    console.log('✅ Info received:');
    console.log(`   Version: ${info.version}`);
    console.log(`   Chain: ${info.chainName}`);
    console.log(`   Block Height: ${info.blockHeight}`);
    console.log(`   Sapling Activation: ${info.saplingActivationHeight}\n`);

    console.log('[3] Getting latest block...');
    const latestBlock = await client.getLatestBlock();
    console.log(`✅ Latest block: ${latestBlock}\n`);

    console.log('[4] Testing block range (last 5 blocks)...');
    const blocks = await client.getBlockRange(
      Math.max(info.saplingActivationHeight, latestBlock - 5),
      latestBlock
    );
    console.log(`✅ Retrieved ${blocks.length} blocks`);
    if (blocks.length > 0) {
      console.log(`   First block: ${blocks[0].height}`);
      console.log(`   Last block: ${blocks[blocks.length - 1].height}`);
      console.log(`   Total transactions: ${blocks.reduce((sum, b) => sum + b.vtx.length, 0)}`);
    }
    console.log('\n✅ All tests passed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testConnection().catch(console.error);

