/**
 * Test Zebrad RPC for Viewing Key Conversion
 * Check if zebrad has methods to convert zxviews to raw FVK
 * 
 * Run with: npx ts-node scripts/test-zebrad-viewing-key.ts
 */

import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

const viewingKey = 'zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c';

async function readCookieFile(): Promise<{ username: string; password: string }> {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const cookiePath = path.join(localAppData, 'zebra', '.cookie');
  
  try {
    const cookieContent = await fs.readFile(cookiePath, 'utf-8');
    const [username, password] = cookieContent.trim().split(':');
    return { username, password };
  } catch (error: any) {
    throw new Error(`Failed to read cookie file: ${error.message}`);
  }
}

async function callZebradRPC(method: string, params: any[] = []): Promise<any> {
  const { username, password } = await readCookieFile();
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  const rpcUrl = `http://127.0.0.1:8233`;
  
  try {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: method,
        params: params
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data.error) {
      throw new Error(response.data.error.message || 'RPC error');
    }
    
    return response.data.result;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`RPC failed: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

async function main() {
  console.log('=== Testing Zebrad RPC for Viewing Key Conversion ===\n');

  try {
    console.log('[1] Testing zebrad connection...');
    const blockCount = await callZebradRPC('getblockcount');
    console.log(`✅ Connected! Current block: ${blockCount}\n`);

    // Try various RPC methods that might help with viewing keys
    const methodsToTry = [
      'z_validateviewingkey',
      'z_importviewingkey',
      'z_exportviewingkey',
      'z_getviewingkey',
      'validateaddress',
      'z_validateaddress',
    ];

    console.log('[2] Testing viewing key related RPC methods...\n');

    for (const method of methodsToTry) {
      try {
        console.log(`  Trying: ${method}...`);
        const result = await callZebradRPC(method, [viewingKey]);
        console.log(`  ✅ ${method} succeeded:`);
        console.log(`     Result: ${JSON.stringify(result, null, 2).substring(0, 200)}...\n`);
      } catch (error: any) {
        if (error.message.includes('Method not found') || error.message.includes('not found')) {
          console.log(`  ⚠️  ${method} not available\n`);
        } else {
          console.log(`  ❌ ${method} failed: ${error.message}\n`);
        }
      }
    }

    // Try validateaddress with the viewing key
    console.log('[3] Testing validateaddress with viewing key...');
    try {
      const result = await callZebradRPC('validateaddress', [viewingKey]);
      console.log('✅ validateaddress result:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log(`⚠️  validateaddress failed: ${error.message}`);
    }

    console.log('\n✅ Test complete!\n');
    console.log('💡 If no methods work, we need to implement zxviews decoding manually.\n');

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

