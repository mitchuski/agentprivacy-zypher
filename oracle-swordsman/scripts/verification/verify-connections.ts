/**
 * Comprehensive Connection Verification
 * Verifies Zebra node, mainnet chain, and all connections
 */

import dotenv from 'dotenv';
dotenv.config();

import { config } from '../../src/config';
import { zcashClient } from '../../src/zcash-client';
import logger from '../../src/logger';

interface VerificationResult {
  component: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️  WARN';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

async function verifyZebraNode(): Promise<void> {
  console.log('\n🦓 Zebra Node Verification\n================================');
  
  try {
    console.log('Testing connection to Zebra node...');
    console.log(`  Host: ${config.zcash.rpcHost}`);
    console.log(`  Port: ${config.zcash.rpcPort}`);
    console.log(`  Network: ${config.zcash.network}\n`);

    // Test 1: Initialize connection
    console.log('[1] Testing connection...');
    await zcashClient.initialize();
    results.push({
      component: 'Zebra Connection',
      status: '✅ PASS',
      message: 'Successfully connected to Zebra node',
      details: {
        host: config.zcash.rpcHost,
        port: config.zcash.rpcPort,
        network: config.zcash.network,
      },
    });
    console.log('  ✅ Connected successfully!\n');

    // Test 2: Get block height
    console.log('[2] Testing getBlockHeight...');
    const height = await zcashClient.getBlockHeight();
    results.push({
      component: 'Block Height',
      status: '✅ PASS',
      message: `Current block height: ${height}`,
      details: { blockHeight: height },
    });
    console.log(`  ✅ Block height: ${height}\n`);

    // Test 3: Get network info
    console.log('[3] Testing network info...');
    try {
      const networkInfo = await (zcashClient as any).execCommandJSON('getnetworkinfo');
      results.push({
        component: 'Network Info',
        status: '✅ PASS',
        message: 'Network info retrieved',
        details: {
          version: networkInfo.version,
          subversion: networkInfo.subversion,
          protocolversion: networkInfo.protocolversion,
        },
      });
      console.log(`  ✅ Network version: ${networkInfo.version}`);
      console.log(`  ✅ Protocol version: ${networkInfo.protocolversion}\n`);
    } catch (error: any) {
      results.push({
        component: 'Network Info',
        status: '⚠️  WARN',
        message: `Could not get network info: ${error.message}`,
      });
      console.log(`  ⚠️  Network info not available (this is okay)\n`);
    }

    // Test 4: Get balance (may fail with Zebra - expected)
    console.log('[4] Testing balance retrieval...');
    try {
      const balance = await zcashClient.getBalance();
      results.push({
        component: 'Balance Retrieval',
        status: '✅ PASS',
        message: 'Balance retrieved successfully',
        details: {
          transparent: balance.transparent,
          shielded: balance.shielded,
          total: balance.total,
        },
      });
      console.log(`  ✅ Transparent: ${balance.transparent} ZEC`);
      console.log(`  ✅ Shielded: ${balance.shielded} ZEC`);
      console.log(`  ✅ Total: ${balance.total} ZEC\n`);
    } catch (error: any) {
      results.push({
        component: 'Balance Retrieval',
        status: '⚠️  WARN',
        message: `Balance retrieval failed: ${error.message}`,
        details: { note: 'This is expected with Zebra (full node, not wallet)' },
      });
      console.log(`  ⚠️  Balance retrieval failed (expected with Zebra)\n`);
    }

    // Test 5: Verify mainnet
    console.log('[5] Verifying mainnet chain...');
    if (config.zcash.network === 'mainnet') {
      // Check if block height is reasonable for mainnet (should be > 2M)
      if (height > 2000000) {
        results.push({
          component: 'Mainnet Chain',
          status: '✅ PASS',
          message: 'Connected to Zcash mainnet',
          details: { blockHeight: height, network: 'mainnet' },
        });
        console.log(`  ✅ Connected to Zcash mainnet (block ${height})\n`);
      } else {
        results.push({
          component: 'Mainnet Chain',
          status: '⚠️  WARN',
          message: `Block height seems low for mainnet: ${height}`,
          details: { blockHeight: height, note: 'May still be syncing' },
        });
        console.log(`  ⚠️  Block height seems low (may still be syncing)\n`);
      }
    } else {
      results.push({
        component: 'Network Type',
        status: '⚠️  WARN',
        message: `Connected to ${config.zcash.network} (not mainnet)`,
        details: { network: config.zcash.network },
      });
      console.log(`  ⚠️  Connected to ${config.zcash.network} (not mainnet)\n`);
    }

  } catch (error: any) {
    results.push({
      component: 'Zebra Connection',
      status: '❌ FAIL',
      message: `Failed to connect: ${error.message}`,
      details: { error: error.message },
    });
    console.error(`  ❌ Connection failed: ${error.message}\n`);
    
    if (error.message.includes('Cookie file not found')) {
      console.log('  💡 Tip: Make sure Zebra is running and has created the cookie file.');
      console.log('     Cookie file should be at: %LOCALAPPDATA%\\zebra\\.cookie\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('  💡 Tip: Make sure Zebra is running and RPC is enabled.');
      console.log('     Check that port 8233 (mainnet) is accessible.\n');
    }
  }
}

async function verifyAddressFile(): Promise<void> {
  console.log('\n📝 Address File Verification\n================================');
  
  const fs = require('fs');
  const path = require('path');
  
  const addressesPath = path.join(process.cwd(), 'zcash-addresses-controlled.json');
  const altPath = path.join(process.cwd(), 'oracle-swordsman', 'zcash-addresses-controlled.json');
  
  let filePath: string | null = null;
  if (fs.existsSync(addressesPath)) {
    filePath = addressesPath;
  } else if (fs.existsSync(altPath)) {
    filePath = altPath;
  }
  
  if (filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const addressCount = data.addresses?.length || 0;
      const zAddresses = data.addresses?.filter((a: any) => a.type === 'shielded') || [];
      const tAddresses = data.addresses?.filter((a: any) => a.type === 'transparent') || [];
      
      results.push({
        component: 'Address File',
        status: '✅ PASS',
        message: `Found ${addressCount} addresses in file`,
        details: {
          filePath,
          totalAddresses: addressCount,
          zAddresses: zAddresses.length,
          tAddresses: tAddresses.length,
          network: data.network,
        },
      });
      
      console.log(`  ✅ Address file found: ${filePath}`);
      console.log(`  ✅ Total addresses: ${addressCount}`);
      console.log(`  ✅ Z-addresses: ${zAddresses.length}`);
      console.log(`  ✅ T-addresses: ${tAddresses.length}`);
      console.log(`  ✅ Network: ${data.network}\n`);
      
      if (addressCount === 0) {
        results.push({
          component: 'Address Count',
          status: '⚠️  WARN',
          message: 'No addresses found in file - need to generate addresses',
        });
        console.log('  ⚠️  No addresses found - need to generate addresses\n');
      }
    } catch (error: any) {
      results.push({
        component: 'Address File',
        status: '❌ FAIL',
        message: `Failed to read address file: ${error.message}`,
      });
      console.error(`  ❌ Failed to read address file: ${error.message}\n`);
    }
  } else {
    results.push({
      component: 'Address File',
      status: '❌ FAIL',
      message: 'Address file not found',
      details: {
        checkedPaths: [addressesPath, altPath],
        note: 'Run address generation script to create addresses',
      },
    });
    console.log('  ❌ Address file not found');
    console.log(`     Checked: ${addressesPath}`);
    console.log(`     Checked: ${altPath}\n`);
  }
}

async function printSummary(): Promise<void> {
  console.log('\n\n📊 Verification Summary\n================================\n');
  
  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status === '❌ FAIL').length;
  const warnings = results.filter(r => r.status === '⚠️  WARN').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}\n`);
  
  console.log('Detailed Results:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.component}`);
    console.log(`   ${result.status} - ${result.message}`);
    if (result.details) {
      const detailsStr = JSON.stringify(result.details, null, 2).replace(/\n/g, '\n   ');
      console.log(`   Details: ${detailsStr}`);
    }
    console.log('');
  });
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 All verifications passed! Ready to generate addresses.');
  } else if (failed === 0) {
    console.log('⚠️  Some warnings detected, but connections are working.');
  } else {
    console.log('❌ Some verifications failed. Please check the details above.');
  }
}

async function main() {
  console.log('🔍 Oracle Swordsman Connection Verification');
  console.log('==========================================\n');
  
  await verifyZebraNode();
  await verifyAddressFile();
  await printSummary();
}

main().catch((error) => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
});

