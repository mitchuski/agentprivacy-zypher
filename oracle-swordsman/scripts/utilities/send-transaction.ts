/**
 * Send Zcash Transaction
 * Interface to send transactions using zebrad/zallet
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Zcash RPC configuration
const ZCASH_RPC_URL = process.env.ZCASH_RPC_URL || 'http://127.0.0.1:8233';
const ZCASH_RPC_USER = process.env.ZCASH_RPC_USER || 'soulbae';
const ZCASH_RPC_PASS = process.env.ZCASH_RPC_PASS || 'soulbisfirstsword';

// Load addresses
const addressesPath = path.join(__dirname, 'zcash-addresses-controlled.json');
let addresses: any[] = [];

if (fs.existsSync(addressesPath)) {
  const data = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
  addresses = data.addresses || [];
}

/**
 * Call Zcash RPC
 */
async function zcashRpc(method: string, params: any[] = []): Promise<any> {
  try {
    const auth = Buffer.from(`${ZCASH_RPC_USER}:${ZCASH_RPC_PASS}`).toString('base64');
    
    const response = await axios.post(ZCASH_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      timeout: 30000,
    });

    if (response.data.error) {
      throw new Error(response.data.error.message || 'RPC error');
    }

    return response.data.result;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`RPC Error: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Get address balance
 */
async function getBalance(address: string): Promise<number> {
  try {
    // Try getreceivedbyaddress for transparent addresses
    if (address.startsWith('t') || address.startsWith('C')) {
      const received = await zcashRpc('getreceivedbyaddress', [address, 0]);
      return received || 0;
    }
    // For z-addresses, use z_getbalance
    else if (address.startsWith('zs1') || address.startsWith('ztestsapling1')) {
      const balance = await zcashRpc('z_getbalance', [address]);
      return balance || 0;
    }
    return 0;
  } catch (error: any) {
    console.log(`  ⚠️  Could not get balance: ${error.message}`);
    return 0;
  }
}

/**
 * List unspent outputs for an address
 */
async function listUnspent(address: string): Promise<any[]> {
  try {
    const unspent = await zcashRpc('listunspent', [0, 9999999, [address]]);
    return unspent || [];
  } catch (error: any) {
    console.log(`  ⚠️  Could not list unspent: ${error.message}`);
    return [];
  }
}

/**
 * Send transaction (transparent)
 */
async function sendTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    // Use sendtoaddress (simplest method)
    const txid = await zcashRpc('sendtoaddress', [toAddress, amount]);
    
    return {
      success: true,
      txid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send shielded transaction
 */
async function sendShieldedTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    // Use z_sendmany for shielded transactions
    const txid = await zcashRpc('z_sendmany', [
      fromAddress,
      [{ address: toAddress, amount }],
      1, // minconf
      0.0001, // fee
    ]);
    
    return {
      success: true,
      txid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Transaction interface
 */
async function transactionInterface() {
  console.log('======================================');
  console.log('Zcash Transaction Interface');
  console.log('======================================\n');

  // Check RPC connection
  console.log('[1] Checking Zcash RPC connection...');
  try {
    const info = await zcashRpc('getinfo');
    console.log('  ✅ Connected to Zcash node');
    console.log(`     Version: ${info.version || 'N/A'}`);
    console.log(`     Network: ${info.testnet ? 'testnet' : 'mainnet'}\n`);
  } catch (error: any) {
    console.log(`  ❌ Connection failed: ${error.message}`);
    console.log('  ⚠️  Make sure zebrad is running with RPC enabled\n');
    return;
  }

  if (addresses.length === 0) {
    console.log('❌ No addresses found. Run generate-addresses-proper.ts first.');
    return;
  }

  // Show addresses with balances
  console.log('[2] Your Addresses:\n');
  
  const tAddresses = addresses.filter(a => a.type === 'transparent');
  const zAddresses = addresses.filter(a => a.type === 'shielded');
  
  console.log('Transparent Addresses:');
  for (const addr of tAddresses.slice(0, 3)) {
    const balance = await getBalance(addr.address);
    const unspent = await listUnspent(addr.address);
    console.log(`  ${addr.address}`);
    console.log(`    Balance: ${balance} ZEC`);
    console.log(`    Unspent: ${unspent.length} outputs`);
    console.log(`    Private Key: ${addr.privateKey.substring(0, 16)}...`);
    console.log('');
  }
  
  console.log('Shielded Addresses:');
  for (const addr of zAddresses.slice(0, 2)) {
    const balance = await getBalance(addr.address);
    console.log(`  ${addr.address}`);
    console.log(`    Balance: ${balance} ZEC`);
    console.log(`    Spending Key: ${addr.spendingKey.substring(0, 16)}...`);
    console.log('');
  }

  // Example transaction
  console.log('[3] Transaction Interface Ready\n');
  console.log('To send a transaction, use:');
  console.log('  - sendTransaction(fromAddress, toAddress, amount)');
  console.log('  - sendShieldedTransaction(fromAddress, toAddress, amount)');
  console.log('');
  console.log('Example:');
  if (tAddresses.length >= 2) {
    console.log(`  sendTransaction(`);
    console.log(`    "${tAddresses[0].address}",`);
    console.log(`    "${tAddresses[1].address}",`);
    console.log(`    0.001`);
    console.log(`  )`);
  }
  console.log('');

  // Save interface info
  const interfaceInfo = {
    rpcUrl: ZCASH_RPC_URL,
    addresses: {
      transparent: tAddresses.length,
      shielded: zAddresses.length,
    },
    functions: [
      'getBalance(address)',
      'listUnspent(address)',
      'sendTransaction(from, to, amount)',
      'sendShieldedTransaction(from, to, amount)',
    ],
    createdAt: new Date().toISOString(),
  };

  const infoPath = path.join(__dirname, 'transaction-interface-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(interfaceInfo, null, 2));
  console.log(`💾 Interface info saved to: ${infoPath}\n`);

  console.log('✅ Transaction interface ready!');
  console.log('   You can now send transactions using the RPC methods.\n');
}

transactionInterface().catch(console.error);

