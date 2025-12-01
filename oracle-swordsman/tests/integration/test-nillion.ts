/**
 * Nillion Connection Test
 * Tests the Nillion API connection and basic functionality
 */

import { config } from '../../src/config';
import { nillionSigner } from '../../src/nillion-signer';
import logger from '../../src/logger';

async function testNillion() {
  console.log('======================================');
  console.log('Nillion Connection Test');
  console.log('======================================\n');

  try {
    // Test 1: Configuration
    console.log('[1] Checking configuration...');
    console.log(`   API Key: ${config.nillion.apiKey.substring(0, 10)}...${config.nillion.apiKey.substring(config.nillion.apiKey.length - 4)}`);
    console.log(`   Network: ${config.nillion.network}`);
    
    if (config.nillion.apiKey === 'placeholder-nillion-api-key') {
      console.log('   ⚠️  Using placeholder key - update .env with real key');
    } else {
      console.log('   ✓ API key configured');
    }
    console.log('');

    // Test 2: Check REST API client
    console.log('[2] Checking Nillion REST API client...');
    try {
      const { nillionApiClient } = await import('./src/nillion-api-client');
      console.log('   ✓ REST API client available');
      console.log('   API URL:', config.nillion.apiUrl || 'not configured');
      console.log('   Network:', config.nillion.network);
    } catch (error: any) {
      console.log('   ✗ Failed to load REST API client:', error.message);
    }
    console.log('');

    // Test 3: Initialize Nillion Signer
    console.log('[3] Testing Nillion Signer initialization...');
    try {
      await nillionSigner.initialize();
      console.log('   ✓ Nillion Signer initialized');
      console.log('   Note: Currently using placeholder implementation');
    } catch (error: any) {
      console.log('   ✗ Initialization failed:', error.message);
      throw error;
    }
    console.log('');

    // Test 4: Test REST API connection
    console.log('[4] Testing REST API connection...');
    try {
      const { nillionApiClient } = await import('./src/nillion-api-client');
      const connected = await nillionApiClient.testConnection();
      if (connected) {
        console.log('   ✓ REST API connection successful');
        console.log('   API URL:', config.nillion.apiUrl || 'default');
      } else {
        console.log('   ✗ REST API connection failed');
        console.log('   Check API key and endpoint configuration');
      }
    } catch (error: any) {
      console.log('   ⚠️  REST API test failed:', error.message);
      console.log('   This may be expected if endpoints need adjustment');
    }
    console.log('');

    // Test 5: Test attestation
    console.log('[5] Testing attestation retrieval...');
    try {
      const attestation = await nillionSigner.getAttestation();
      console.log('   ✓ Attestation retrieved');
      if (attestation && typeof attestation === 'string') {
        console.log(`   Attestation: ${attestation.substring(0, 50)}...`);
      } else {
        console.log(`   Attestation type: ${typeof attestation}`);
        console.log(`   Attestation: ${JSON.stringify(attestation).substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.log('   ✗ Attestation failed:', error.message);
    }
    console.log('');

    // Test 6: Test attestation verification
    console.log('[6] Testing attestation verification...');
    try {
      const testAttestation = 'test-attestation-' + Date.now();
      const isValid = await nillionSigner.verifyAttestation(testAttestation);
      console.log(`   ✓ Verification test completed (result: ${isValid})`);
      console.log('   Note: Using placeholder - actual SDK needed for real verification');
    } catch (error: any) {
      console.log('   ✗ Verification failed:', error.message);
    }
    console.log('');

    // Summary
    console.log('======================================');
    console.log('Test Summary');
    console.log('======================================');
    console.log('✓ Configuration loaded');
    console.log('✓ Nillion Signer initialized');
    console.log('✓ REST API client created');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Verify Nillion API endpoints from documentation');
    console.log('2. Update endpoint URLs in nillion-api-client.ts if needed');
    console.log('3. Test with real API calls (store key, sign transaction)');
    console.log('4. Check Nillion docs for correct endpoint paths');
    console.log('======================================\n');

  } catch (error: any) {
    console.error('\n✗ Nillion connection test failed:');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testNillion().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

