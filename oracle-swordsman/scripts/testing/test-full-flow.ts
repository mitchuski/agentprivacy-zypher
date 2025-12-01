/**
 * Test Full Production Flow
 * Verifies all components are ready for end-to-end testing
 */

import { config } from '../../src/config';
import { db } from '../../src/database';
import { zcashClient } from '../../src/zcash-client';
import { ipfsClient } from '../../src/ipfs-client';
import { nearVerifier } from '../../src/nearcloudai-verifier';
import { nillionSigner } from '../../src/nillion-signer';
import logger from '../../src/logger';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentStatus {
  name: string;
  status: 'ready' | 'warning' | 'error';
  message: string;
  details?: any;
}

async function testFullFlow() {
  console.log('========================================');
  console.log('Full Production Flow Test');
  console.log('========================================\n');

  const results: ComponentStatus[] = [];

  // Test 1: Configuration
  console.log('[1] Testing Configuration...');
  try {
    const hasNearKey = !!config.near.mageApiKey && config.near.mageApiKey !== '';
    const hasSwordsmanKey = !!config.near.swordsmanApiKey && config.near.swordsmanApiKey !== '';
    const hasDatabase = !!config.database.url && config.database.url !== '';
    const hasNillion = !!config.nillion.apiKey && config.nillion.apiKey !== 'placeholder-nillion-api-key';
    
    if (hasNearKey && hasSwordsmanKey && hasDatabase) {
      results.push({
        name: 'Configuration',
        status: 'ready',
        message: 'All required environment variables set',
        details: {
          nearConfigured: hasNearKey && hasSwordsmanKey,
          databaseConfigured: hasDatabase,
          nillionConfigured: hasNillion,
        }
      });
      console.log('  ✅ Configuration ready\n');
    } else {
      results.push({
        name: 'Configuration',
        status: 'error',
        message: 'Missing required environment variables',
        details: { hasNearKey, hasSwordsmanKey, hasDatabase, hasNillion }
      });
      console.log('  ❌ Configuration incomplete\n');
    }
  } catch (error: any) {
    results.push({ name: 'Configuration', status: 'error', message: error.message });
    console.log('  ❌ Configuration error:', error.message, '\n');
  }

  // Test 2: Database
  console.log('[2] Testing Database Connection...');
  try {
    const connected = await db.testConnection();
    if (connected) {
      const stats = await db.getStats();
      results.push({
        name: 'Database',
        status: 'ready',
        message: 'Database connected and operational',
        details: stats
      });
      console.log('  ✅ Database connected\n');
    } else {
      results.push({ name: 'Database', status: 'error', message: 'Database connection failed' });
      console.log('  ❌ Database connection failed\n');
    }
  } catch (error: any) {
    results.push({ name: 'Database', status: 'error', message: error.message });
    console.log('  ❌ Database error:', error.message, '\n');
  }

  // Test 3: Zcash Client (Zebrad)
  console.log('[3] Testing Zcash Client (Zebrad)...');
  try {
    await zcashClient.initialize();
    const balance = await zcashClient.getBalance();
    const height = await zcashClient.getBlockHeight();
    
    results.push({
      name: 'Zcash Client',
      status: 'ready',
      message: 'Zebrad node connected',
      details: {
        network: config.zcash.network,
        height,
        balance: {
          transparent: balance.transparent,
          shielded: balance.shielded,
          total: balance.total
        }
      }
    });
    console.log('  ✅ Zebrad connected');
    console.log(`     Network: ${config.zcash.network}`);
    console.log(`     Height: ${height}`);
    console.log(`     Balance: ${balance.total} ZEC\n`);
  } catch (error: any) {
    results.push({
      name: 'Zcash Client',
      status: 'error',
      message: error.message,
      details: { network: config.zcash.network, rpcPort: config.zcash.rpcPort }
    });
    console.log('  ❌ Zebrad connection failed:', error.message, '\n');
  }

  // Test 4: Z-Address Verification
  console.log('[4] Testing Z-Address...');
  try {
    const addressesPath = path.join(process.cwd(), 'zcash-addresses-controlled.json');
    if (fs.existsSync(addressesPath)) {
      const data = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
      const zAddresses = data.addresses?.filter((a: any) => a.type === 'shielded') || [];
      
      if (zAddresses.length > 0) {
        const primaryZ = zAddresses[0];
        results.push({
          name: 'Z-Address',
          status: 'ready',
          message: 'Z-address found and ready',
          details: {
            address: primaryZ.address,
            hasSpendingKey: !!primaryZ.spendingKey,
            network: primaryZ.network
          }
        });
        console.log('  ✅ Z-Address found');
        console.log(`     Address: ${primaryZ.address.substring(0, 20)}...`);
        console.log(`     Network: ${primaryZ.network}\n`);
      } else {
        results.push({ name: 'Z-Address', status: 'error', message: 'No z-addresses in file' });
        console.log('  ❌ No z-addresses found\n');
      }
    } else {
      results.push({ name: 'Z-Address', status: 'error', message: 'Addresses file not found' });
      console.log('  ❌ Addresses file not found\n');
    }
  } catch (error: any) {
    results.push({ name: 'Z-Address', status: 'error', message: error.message });
    console.log('  ❌ Z-Address error:', error.message, '\n');
  }

  // Test 5: IPFS/Spellbook
  console.log('[5] Testing IPFS/Spellbook...');
  try {
    const spellbook = await ipfsClient.fetchSpellbook();
    results.push({
      name: 'IPFS/Spellbook',
      status: 'ready',
      message: 'Spellbook loaded from IPFS',
      details: {
        version: spellbook.version,
        actCount: spellbook.acts.length,
        cid: config.ipfs.spellbookCid
      }
    });
    console.log('  ✅ Spellbook loaded');
    console.log(`     Version: ${spellbook.version}`);
    console.log(`     Acts: ${spellbook.acts.length}\n`);
  } catch (error: any) {
    results.push({ name: 'IPFS/Spellbook', status: 'error', message: error.message });
    console.log('  ❌ IPFS error:', error.message, '\n');
  }

  // Test 6: NEAR Cloud AI
  console.log('[6] Testing NEAR Cloud AI...');
  try {
    // Test connection first
    const connected = await nearVerifier.testConnection();
    
    if (connected) {
      // Test with a simple verification
      const testProverb = 'Privacy is the foundation of freedom.';
      const spellbook = await ipfsClient.fetchSpellbook();
      const result = await nearVerifier.verify(testProverb, spellbook);
      
      results.push({
        name: 'NEAR Cloud AI',
        status: 'ready',
        message: 'NEAR Cloud AI responding',
        details: {
          model: config.near.model,
          qualityScore: result.quality_score,
          matched: result.approved,
          matchedAct: result.matched_act
        }
      });
      console.log('  ✅ NEAR Cloud AI responding');
      console.log(`     Model: ${config.near.model}`);
      console.log(`     Quality Score: ${result.quality_score.toFixed(2)}`);
      console.log(`     Matched Act: ${result.matched_act}\n`);
    } else {
      results.push({
        name: 'NEAR Cloud AI',
        status: 'error',
        message: 'Connection test failed',
        details: { model: config.near.model }
      });
      console.log('  ❌ NEAR Cloud AI connection failed\n');
    }
  } catch (error: any) {
    results.push({
      name: 'NEAR Cloud AI',
      status: 'error',
      message: error.message,
      details: { model: config.near.model }
    });
    console.log('  ❌ NEAR Cloud AI error:', error.message, '\n');
  }

  // Test 7: Nillion TEE
  console.log('[7] Testing Nillion TEE...');
  try {
    await nillionSigner.initialize();
    const isInitialized = nillionSigner.isInitialized();
    
    results.push({
      name: 'Nillion TEE',
      status: isInitialized ? 'ready' : 'warning',
      message: isInitialized ? 'Nillion initialized' : 'Nillion connected but key not stored',
      details: {
        network: config.nillion.network,
        keyStored: isInitialized
      }
    });
    console.log(`  ${isInitialized ? '✅' : '⚠️ '} Nillion ${isInitialized ? 'ready' : 'connected (key not stored)'}`);
    console.log(`     Network: ${config.nillion.network}\n`);
  } catch (error: any) {
    results.push({
      name: 'Nillion TEE',
      status: 'error',
      message: error.message,
      details: { network: config.nillion.network }
    });
    console.log('  ❌ Nillion error:', error.message, '\n');
  }

  // Summary
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================\n');

  const ready = results.filter(r => r.status === 'ready').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  results.forEach(result => {
    const icon = result.status === 'ready' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  console.log('\n========================================');
  console.log(`Ready: ${ready} | Warnings: ${warnings} | Errors: ${errors}`);
  console.log('========================================\n');

  if (errors === 0 && ready >= 5) {
    console.log('🎉 All critical components ready for production flow!');
    console.log('\nNext steps:');
    console.log('  1. Start Oracle service: npm run dev');
    console.log('  2. Monitor logs for incoming transactions');
    console.log('  3. Test with a real proverb submission');
    console.log('  4. Check wallet interface for results\n');
  } else if (errors > 0) {
    console.log('⚠️  Some components need attention before production flow');
    console.log('   Review errors above and fix configuration\n');
  } else {
    console.log('✅ Most components ready, but some warnings to review\n');
  }

  // Cleanup
  await db.close();
  await zcashClient.cleanup();
}

testFullFlow().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

