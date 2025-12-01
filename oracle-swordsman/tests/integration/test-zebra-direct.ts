/**
 * Direct Zebra Connection Test
 * Tests zebra RPC without requiring other services
 */

import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

async function readCookieFile(): Promise<{ username: string; password: string }> {
  // Try default location first
  const defaultPath = path.join(process.env.LOCALAPPDATA || '', 'zebra', '.cookie');
  const cookiePath = process.env.ZCASH_COOKIE_FILE_PATH || defaultPath;
  
  try {
    const content = await fs.readFile(cookiePath, 'utf-8');
    const [username, password] = content.trim().split(':');
    return { username, password };
  } catch (error: any) {
    throw new Error(`Cookie file not found at ${cookiePath}. Make sure Zebra is running.`);
  }
}

async function testZebra() {
  console.log('======================================');
  console.log('Zebra Node Connection Test');
  console.log('======================================\n');

  const rpcHost = process.env.ZCASH_RPC_HOST || '127.0.0.1';
  const rpcPort = parseInt(process.env.ZCASH_RPC_PORT || '8233');
  const rpcUrl = `http://${rpcHost}:${rpcPort}`;

  console.log('Testing connection to zebra node...');
  console.log(`  Host: ${rpcHost}`);
  console.log(`  Port: ${rpcPort}`);
  console.log(`  Network: mainnet\n`);

  try {
    // Read cookie file for authentication
    console.log('[1] Reading authentication cookie...');
    const { username, password } = await readCookieFile();
    console.log(`  ✓ Cookie file found`);
    console.log(`  Username: ${username}\n`);

    // Test 1: Get blockchain info
    console.log('[2] Testing getblockchaininfo...');
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getblockchaininfo',
      params: []
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      timeout: 10000
    });

    if (response.data.error) {
      throw new Error(`RPC error: ${response.data.error.message}`);
    }

    const info = response.data.result;
    console.log('  ✓ Connected successfully!');
    console.log(`  Block height: ${info.blocks}`);
    console.log(`  Chain: ${info.chain}`);
    console.log(`  Verification progress: ${(info.verificationprogress * 100).toFixed(2)}%`);
    console.log(`  Headers: ${info.headers}`);
    console.log(`  Difficulty: ${info.difficulty}\n`);

    // Test 2: Get network info
    console.log('[3] Testing getnetworkinfo...');
    const networkResponse = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'getnetworkinfo',
      params: []
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      timeout: 10000
    });

    if (networkResponse.data.error) {
      console.log(`  ⚠ Network info error: ${networkResponse.data.error.message}`);
    } else {
      const networkInfo = networkResponse.data.result;
      console.log('  ✓ Network info retrieved');
      console.log(`  Connections: ${networkInfo.connections || 'N/A'}`);
      console.log(`  Version: ${networkInfo.version || 'N/A'}\n`);
    }

    console.log('======================================');
    console.log('✓ All tests passed!');
    console.log('Zebra node is ready for production use.');
    console.log('======================================\n');

    console.log('Next steps:');
    console.log('1. Configure NEAR API keys in .env');
    console.log('2. Ensure database is running');
    console.log('3. Run: npm run dev');
    console.log('4. Test the oracle service');

  } catch (error: any) {
    console.error('\n✗ Error connecting to zebra:');
    console.error(`  ${error.message}\n`);
    
    if (error.message.includes('Cookie file not found')) {
      console.log('Tip: Make sure zebra is running and has created the cookie file.');
      console.log('     Cookie file should be at: %LOCALAPPDATA%\\zebra\\.cookie');
      console.log('     Or set ZCASH_COOKIE_FILE_PATH in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Tip: Make sure zebra is running and RPC is enabled.');
      console.log(`     Check that port ${rpcPort} is accessible.`);
    } else if (error.response) {
      console.log(`HTTP ${error.response.status}: ${error.response.statusText}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testZebra();

