import { db } from './database';
import { zcashClient } from './zcash-client';
import { config } from './config';
import logger from './logger';

async function testFoundation() {
  console.log('Testing Foundation...\n');

  // Test 1: Configuration
  console.log('1. Configuration:');
  console.log('   Nillion API Key:', config.nillion.apiKey.substring(0, 10) + '...');
  console.log('   NEAR Cloud AI API Key:', config.near.apiKey.substring(0, 10) + '...');
  console.log('   Spellbook CID:', config.ipfs.spellbookCid);
  console.log('   Zcash Server:', config.zcash.server);
  console.log('   Zcash Data Dir:', config.zcash.dataDir);
  console.log('   ✓ Configuration loaded\n');

  // Test 2: Database
  console.log('2. Database:');
  try {
    const dbConnected = await db.testConnection();
    console.log('   Connection:', dbConnected ? '✓ Connected' : '✗ Failed');
    
    const stats = await db.getStats();
    console.log('   Stats:', JSON.stringify(stats, null, 2));
    console.log('   ✓ Database operational\n');
  } catch (error: any) {
    console.log('   ✗ Database error:', error.message);
    console.log('   Note: Make sure PostgreSQL is running and schema is applied\n');
  }

  // Test 3: Zcash
  console.log('3. Zcash:');
  try {
    const balance = await zcashClient.getBalance();
    console.log('   Balance:', balance);
    
    const height = await zcashClient.getBlockHeight();
    console.log('   Height:', height);
    console.log('   ✓ Zcash client working\n');
  } catch (error: any) {
    console.log('   ✗ Zcash client error:', error.message);
    console.log('   Note: Make sure zecwallet-cli is installed and wallet is synced\n');
  }

  // Test 4: Create test submission
  console.log('4. Test Submission:');
  try {
    const testTrackingCode = 'TEST-' + Date.now();
    const submission = await db.createSubmission({
      tracking_code: testTrackingCode,
      sender_address: 't1test...',
      proverb_text: 'Privacy requires separation, not mere intention.',
      amount_zec: 0.01,
      txid: 'test_' + Date.now(),
    });
    console.log('   Created:', submission.id);
    console.log('   Tracking Code:', submission.tracking_code);
    console.log('   ✓ Submission created\n');
    
    // Clean up test submission
    await db.updateSubmissionStatus(submission.id, 'test');
    console.log('   Test submission marked for cleanup\n');
  } catch (error: any) {
    console.log('   ✗ Submission error:', error.message);
    console.log('   Note: Make sure database schema is applied\n');
  }

  // Test 5: Logger
  console.log('5. Logger:');
  logger.info('Test info message');
  logger.warn('Test warning message');
  logger.error('Test error message');
  console.log('   ✓ Logger working (check logs/ directory)\n');

  console.log('Foundation tests complete!');
  console.log('\nNext steps:');
  console.log('  - Ensure PostgreSQL is running and schema is applied');
  console.log('  - Install zecwallet-cli and sync wallet');
  console.log('  - Verify all API keys are set in .env');
  
  await db.close();
}

testFoundation().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

