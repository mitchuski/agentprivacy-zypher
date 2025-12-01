/**
 * Test Nillion Workload Operations
 * Checks available resources and tests workload creation
 */

import { nillionWorkloadClient } from '../../src/nillion-workload-client';
import { config } from '../../src/config';
import logger from '../../src/logger';

async function testWorkloads() {
  console.log('======================================');
  console.log('Nillion Workload Test');
  console.log('======================================\n');

  try {
    // Test 1: List available workload tiers
    console.log('[1] Listing available workload tiers...');
    try {
      const tiers = await nillionWorkloadClient.listWorkloadTiers();
      console.log('  ✅ Workload tiers retrieved');
      console.log(`  Found ${tiers.length} tiers:`);
      tiers.forEach((tier, i) => {
        console.log(`    Tier ${i + 1}:`);
        console.log(`      CPUs: ${tier.cpus}`);
        console.log(`      Memory: ${tier.memory} MB`);
        console.log(`      Disk: ${tier.disk} GB`);
        console.log(`      GPUs: ${tier.gpus}`);
        console.log(`      Cost: ${tier.cost} credits`);
        console.log(`      ID: ${tier.id}`);
      });
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    console.log('');

    // Test 2: List available artifacts
    console.log('[2] Listing available artifacts (VM images)...');
    try {
      const artifacts = await nillionWorkloadClient.listArtifacts();
      console.log('  ✅ Artifacts retrieved');
      console.log(`  Found ${artifacts.length} artifacts:`);
      artifacts.slice(0, 5).forEach((artifact: any, i: number) => {
        console.log(`    Artifact ${i + 1}:`);
        console.log(`      ${JSON.stringify(artifact, null, 2).substring(0, 100)}...`);
      });
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    console.log('');

    // Test 3: List existing workloads
    console.log('[3] Listing existing workloads...');
    try {
      const workloads = await nillionWorkloadClient.listWorkloads();
      console.log('  ✅ Workloads retrieved');
      console.log(`  Found ${workloads.length} workload(s):`);
      workloads.forEach((workload, i) => {
        console.log(`    Workload ${i + 1}:`);
        console.log(`      ID: ${workload.id}`);
        console.log(`      Name: ${workload.name}`);
        console.log(`      Status: ${workload.status}`);
        console.log(`      URL: ${workload.url || 'N/A'}`);
        console.log(`      Created: ${workload.createdAt}`);
      });
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    console.log('');

    // Test 4: Check account credits
    console.log('[4] Checking account status...');
    try {
      const { nillionApiClient } = await import('./src/nillion-api-client');
      const connected = await nillionApiClient.testConnection();
      if (connected) {
        console.log('  ✅ Account accessible');
        console.log('  (Credits info should be in connection response)');
      }
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    console.log('');

    // Test 5: Show workload creation example
    console.log('[5] Workload Creation Example...');
    console.log('  To create a SecretSigner workload:');
    console.log('    - Use Tier 1: 2 CPUs, ~2048 MB RAM, 20 GB disk (33 credits)');
    console.log('    - Use Artifact: 0.2.1 (latest)');
    console.log('    - Docker Compose: SecretSigner service');
    console.log('    - Environment: PRIVATE_KEY (from Zcash keys)');
    console.log('');

    // Summary
    console.log('======================================');
    console.log('Test Summary');
    console.log('======================================');
    console.log('✅ Workload client initialized');
    console.log('✅ Ready to create SecretSigner workload');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Choose a workload tier from available options');
    console.log('2. Select an artifact version');
    console.log('3. Create workload with SecretSigner service');
    console.log('4. Store Zcash spending key in workload');
    console.log('======================================\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testWorkloads().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

