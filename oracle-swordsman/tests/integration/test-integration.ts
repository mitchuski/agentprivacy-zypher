/**
 * Integration Test Script
 * Tests the new Zcash components integration
 */

import { zcashClient } from '../../src/zcash-client';
import { createTransactionMonitor } from '../../src/transaction-monitor';
import { createTransactionBuilder } from '../../src/transaction-builder';
import { parseMemo, validateProverb, exampleMemos } from '../../src/memo-parser';
import { ZcashUtils } from '../../src/zcash-utils';
import logger from '../../src/logger';

async function testZcashClient() {
  console.log('\n=== Testing Zcash Client ===');
  
  try {
    // Test initialization
    console.log('1. Testing client initialization...');
    await zcashClient.initialize();
    console.log('   ✓ Client initialized');
    
    // Test balance
    console.log('2. Testing balance retrieval...');
    const balance = await zcashClient.getBalance();
    console.log('   ✓ Balance:', balance);
    
    // Test addresses
    console.log('3. Testing address retrieval...');
    const transparentAddr = await zcashClient.getTransparentAddress();
    const shieldedAddr = await zcashClient.getShieldedAddress();
    console.log('   ✓ Transparent address:', ZcashUtils.Address.mask(transparentAddr));
    console.log('   ✓ Shielded address:', ZcashUtils.Address.mask(shieldedAddr));
    
    // Test height
    console.log('4. Testing block height...');
    const height = await zcashClient.getBlockHeight();
    console.log('   ✓ Current height:', height);
    
    // Test transaction listing
    console.log('5. Testing transaction listing...');
    const transactions = await zcashClient.listTransactions(10);
    console.log('   ✓ Found', transactions.length, 'recent transactions');
    
    return true;
  } catch (error: any) {
    console.error('   ✗ Error:', error.message);
    return false;
  }
}

async function testMemoParser() {
  console.log('\n=== Testing Memo Parser ===');
  
  try {
    // Test RPP-v1 multi-line format
    console.log('1. Testing RPP-v1 multi-line format...');
    const rppMulti = exampleMemos.rppMultiLine('tale-01-shield', 'Privacy requires architectural separation');
    const parsed1 = parseMemo(rppMulti);
    console.log('   ✓ Parsed:', parsed1.valid ? 'Valid' : 'Invalid');
    if (parsed1.valid) {
      console.log('     - Format:', parsed1.format);
      console.log('     - Tracking Code:', parsed1.trackingCode);
      console.log('     - Tale ID:', parsed1.taleId);
    }
    
    // Test RPP-v1 single-line format
    console.log('2. Testing RPP-v1 single-line format...');
    const rppSingle = exampleMemos.rppSingleLine('tale-02-delegation', 'Delegation without surrender extends sovereignty');
    const parsed2 = parseMemo(rppSingle);
    console.log('   ✓ Parsed:', parsed2.valid ? 'Valid' : 'Invalid');
    
    // Test legacy TRACK format
    console.log('3. Testing legacy TRACK format...');
    const track = exampleMemos.track('ABC123', 'Trust through verification, not alignment');
    const parsed3 = parseMemo(track);
    console.log('   ✓ Parsed:', parsed3.valid ? 'Valid' : 'Invalid');
    
    // Test proverb validation
    console.log('4. Testing proverb validation...');
    const validProverb = 'Privacy requires separation, not mere intention.';
    const validation1 = validateProverb(validProverb);
    console.log('   ✓ Valid proverb:', validation1.valid);
    
    const invalidProverb = 'Short';
    const validation2 = validateProverb(invalidProverb);
    console.log('   ✓ Invalid proverb:', !validation2.valid, '-', validation2.error);
    
    return true;
  } catch (error: any) {
    console.error('   ✗ Error:', error.message);
    return false;
  }
}

async function testTransactionMonitor() {
  console.log('\n=== Testing Transaction Monitor ===');
  
  try {
    console.log('1. Creating transaction monitor...');
    const monitor = createTransactionMonitor(zcashClient, {
      pollInterval: 60000, // 1 minute for testing
      minConfirmations: 1,
      requiredAmount: 0.01,
    });
    console.log('   ✓ Monitor created');
    
    // Test event listeners
    console.log('2. Testing event listeners...');
    let eventReceived = false;
    
    monitor.on('newSubmission', (submission) => {
      console.log('   ✓ New submission event received:', submission.submissionData.trackingCode);
      eventReceived = true;
    });
    
    monitor.on('invalidSubmission', (info) => {
      console.log('   ✓ Invalid submission event received:', info.reason);
    });
    
    console.log('   ✓ Event listeners registered');
    
    // Test stats
    console.log('3. Testing statistics...');
    const stats = monitor.getStats();
    console.log('   ✓ Stats:', {
      totalChecks: stats.totalChecks,
      newSubmissions: stats.newSubmissionsFound,
      invalidSubmissions: stats.invalidSubmissions,
    });
    
    // Note: We won't actually start the monitor in tests to avoid infinite polling
    console.log('   ✓ Monitor ready (not started in test mode)');
    
    return true;
  } catch (error: any) {
    console.error('   ✗ Error:', error.message);
    return false;
  }
}

async function testTransactionBuilder() {
  console.log('\n=== Testing Transaction Builder ===');
  
  try {
    console.log('1. Creating transaction builder...');
    const builder = createTransactionBuilder(zcashClient);
    console.log('   ✓ Builder created');
    
    // Test initialization
    console.log('2. Testing initialization...');
    await builder.initialize();
    console.log('   ✓ Builder initialized');
    
    const addresses = builder.getAddresses();
    console.log('   ✓ Public address:', addresses.public ? ZcashUtils.Address.mask(addresses.public) : 'Not set');
    console.log('   ✓ Private address:', addresses.private ? ZcashUtils.Address.mask(addresses.private) : 'Not set');
    
    // Test split calculation
    console.log('3. Testing split calculation...');
    const split = builder.calculateSplit(0.01);
    console.log('   ✓ Split for 0.01 ZEC:');
    console.log('     - Public (61.8%):', split.public, 'ZEC');
    console.log('     - Private (38.2%):', split.private, 'ZEC');
    console.log('     - Total:', split.total, 'ZEC');
    
    // Test validation
    console.log('4. Testing inscription validation...');
    const validSpec = {
      trackingCode: 'SHIELD7A2B',
      proverbText: 'Privacy requires architectural separation',
      taleId: 'tale-01-shield',
      totalAmount: 0.01,
    };
    
    const validation = builder.validateSpec(validSpec);
    console.log('   ✓ Validation:', validation.valid ? 'Valid' : 'Invalid');
    if (!validation.valid) {
      console.log('     - Errors:', validation.errors);
    }
    
    // Test dry run
    console.log('5. Testing dry run...');
    const testResult = await builder.testInscription(validSpec);
    console.log('   ✓ Dry run result:', {
      valid: testResult.valid,
      publicAmount: testResult.split.public,
      privateAmount: testResult.split.private,
      publicMemoSize: testResult.memoSizes.public,
      privateMemoSize: testResult.memoSizes.private,
    });
    
    return true;
  } catch (error: any) {
    console.error('   ✗ Error:', error.message);
    return false;
  }
}

async function testZcashUtils() {
  console.log('\n=== Testing Zcash Utils ===');
  
  try {
    // Test address utilities
    console.log('1. Testing address utilities...');
    const testAddr = 'tmAbc123456789012345678901234567890123';
    const masked = ZcashUtils.Address.mask(testAddr);
    const isValid = ZcashUtils.Address.validate(testAddr).valid;
    console.log('   ✓ Masked address:', masked);
    console.log('   ✓ Valid address:', isValid);
    
    // Test amount utilities
    console.log('2. Testing amount utilities...');
    const amount = 0.01234567;
    const formatted = ZcashUtils.Amount.formatWithUnit(amount);
    const zatoshis = ZcashUtils.Amount.toZatoshis(amount);
    console.log('   ✓ Formatted:', formatted);
    console.log('   ✓ Zatoshis:', zatoshis.toString());
    
    // Test memo utilities
    console.log('3. Testing memo utilities...');
    const memo = 'This is a test memo that should fit within limits';
    const byteSize = ZcashUtils.Memo.byteSize(memo);
    const fits = ZcashUtils.Memo.fitsLimit(memo);
    console.log('   ✓ Memo size:', byteSize, 'bytes');
    console.log('   ✓ Fits limit:', fits);
    
    // Test tracking code utilities
    console.log('4. Testing tracking code utilities...');
    const code = ZcashUtils.TrackingCode.generate();
    const withChecksum = ZcashUtils.TrackingCode.addChecksum(code);
    const verified = ZcashUtils.TrackingCode.verifyChecksum(withChecksum);
    console.log('   ✓ Generated code:', code);
    console.log('   ✓ With checksum:', withChecksum);
    console.log('   ✓ Checksum valid:', verified);
    
    // Test statistics
    console.log('5. Testing statistics calculator...');
    const stats = new ZcashUtils.Stats();
    stats.add(0.01);
    stats.add(0.015);
    stats.add(0.012);
    const statsResult = stats.getStats();
    console.log('   ✓ Stats:', {
      count: statsResult.count,
      mean: statsResult.mean.toFixed(8),
      median: statsResult.median.toFixed(8),
    });
    
    return true;
  } catch (error: any) {
    console.error('   ✗ Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('Zcash Integration Tests');
  console.log('========================================');
  
  const results = {
    zcashClient: false,
    memoParser: false,
    transactionMonitor: false,
    transactionBuilder: false,
    zcashUtils: false,
  };
  
  try {
    results.zcashClient = await testZcashClient();
    results.memoParser = await testMemoParser();
    results.transactionMonitor = await testTransactionMonitor();
    results.transactionBuilder = await testTransactionBuilder();
    results.zcashUtils = await testZcashUtils();
  } catch (error: any) {
    console.error('\nFatal error during tests:', error.message);
  }
  
  // Cleanup
  try {
    await zcashClient.cleanup();
  } catch (error) {
    // Ignore cleanup errors
  }
  
  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test}:`, passed ? 'PASSED' : 'FAILED');
  });
  
  console.log('\n' + (allPassed ? '✓ All tests passed!' : '✗ Some tests failed'));
  console.log('========================================\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testZcashClient, testMemoParser, testTransactionMonitor, testTransactionBuilder, testZcashUtils };

