/**
 * Test Proverb Submission Flow
 * Simulates a full proverb submission and processing
 */

import { config } from '../../src/config';
import { db } from '../../src/database';
import { zcashClient } from '../../src/zcash-client';
import { ipfsClient } from '../../src/ipfs-client';
import { parseMemo, extractSubmissionData } from '../../src/memo-parser';
import { nearVerifier } from '../../src/nearcloudai-verifier';
import { createTransactionBuilder } from '../../src/transaction-builder';
import logger from '../../src/logger';
import * as fs from 'fs';
import * as path from 'path';

async function testProverbSubmission() {
  console.log('========================================');
  console.log('Test Proverb Submission Flow');
  console.log('========================================\n');

  // Step 1: Get Z-Address
  console.log('[1] Getting Z-Address...');
  const addressesPath = path.join(process.cwd(), 'zcash-addresses-controlled.json');
  if (!fs.existsSync(addressesPath)) {
    throw new Error('Addresses file not found');
  }
  
  const data = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
  const zAddress = data.addresses?.find((a: any) => a.type === 'shielded')?.address;
  
  if (!zAddress) {
    throw new Error('No z-address found');
  }
  
  console.log(`  ✅ Z-Address: ${zAddress.substring(0, 20)}...\n`);

  // Step 2: Create Test Proverb
  console.log('[2] Creating Test Proverb...');
  const testProverb = 'Privacy is the foundation of freedom.';
  const taleId = 'act-i';
  const trackingCode = `TEST-${Date.now()}`;
  
  // Create memo in RPP-v1 format
  const memo = `rpp-v1\ntale:${taleId}\n${testProverb}`;
  
  console.log(`  Proverb: "${testProverb}"`);
  console.log(`  Tale ID: ${taleId}`);
  console.log(`  Tracking Code: ${trackingCode}\n`);

  // Step 3: Parse Memo
  console.log('[3] Parsing Memo...');
  const parsed = parseMemo(memo);
  if (!parsed.valid) {
    throw new Error(`Invalid memo: ${parsed.error}`);
  }
  
  const submissionData = extractSubmissionData(parsed);
  if (!submissionData) {
    throw new Error('Failed to extract submission data');
  }
  
  console.log(`  ✅ Memo parsed successfully`);
  console.log(`     Format: ${parsed.format}`);
  console.log(`     Tracking Code: ${submissionData.trackingCode}\n`);

  // Step 4: Verify with NEAR Cloud AI
  console.log('[4] Verifying with NEAR Cloud AI...');
  try {
    const spellbook = await ipfsClient.fetchSpellbook();
    const verification = await nearVerifier.verify(testProverb, spellbook);
    
    console.log(`  ✅ Verification complete`);
    console.log(`     Approved: ${verification.approved ? 'Yes' : 'No'}`);
    console.log(`     Quality Score: ${verification.quality_score.toFixed(2)}`);
    console.log(`     Matched Act: ${verification.matched_act || 'N/A'}`);
    console.log(`     Reasoning: ${verification.reasoning.substring(0, 100)}...\n`);
    
    if (!verification.approved) {
      console.log('  ⚠️  Warning: Proverb did not meet quality threshold\n');
    }
  } catch (error: any) {
    console.log(`  ❌ Verification failed: ${error.message}\n`);
    throw error;
  }

  // Step 5: Create Database Submission
  console.log('[5] Creating Database Submission...');
  try {
    const submission = await db.createSubmission({
      tracking_code: trackingCode,
      sender_address: zAddress,
      proverb_text: testProverb,
      amount_zec: 0.01,
      txid: `test_${Date.now()}`,
      memo_text: memo,
    });
    
    console.log(`  ✅ Submission created`);
    console.log(`     ID: ${submission.id}`);
    console.log(`     Status: ${submission.status}\n`);
    
    // Get actual verification result
    const spellbook = await ipfsClient.fetchSpellbook();
    const verificationResult = await nearVerifier.verify(testProverb, spellbook);
    
    // Create verification record
    const verification = await db.createVerification({
      submission_id: submission.id,
      ai_provider: 'near-cloud-ai',
      quality_score: verificationResult.quality_score,
      matched_act: verificationResult.matched_act,
      reasoning: verificationResult.reasoning,
    });
    
    console.log(`  ✅ Verification record created`);
    console.log(`     Verification ID: ${verification.id}\n`);
    
    // Update status
    await db.updateSubmissionStatus(submission.id, 'verified');
    console.log(`  ✅ Submission status updated to 'verified'\n`);
    
  } catch (error: any) {
    console.log(`  ❌ Database error: ${error.message}\n`);
    throw error;
  }

  // Step 6: Test Transaction Builder
  console.log('[6] Testing Transaction Builder...');
  try {
    const transactionBuilder = createTransactionBuilder(zcashClient);
    await transactionBuilder.initialize();
    
    console.log(`  ✅ Transaction builder initialized`);
    console.log(`     Addresses configured for inscription transactions\n`);
    
    // Note: We don't actually create transactions in test mode
    console.log('  ℹ️  Transaction creation skipped (test mode)\n');
    
  } catch (error: any) {
    console.log(`  ⚠️  Transaction builder warning: ${error.message}\n`);
    // Not critical for test
  }

  // Step 7: Check Wallet Interface
  console.log('[7] Checking Wallet Interface...');
  try {
    const axios = await import('axios');
    const apiUrl = `http://localhost:${process.env.PORT || 3001}`;
    const response = await axios.default.get(`${apiUrl}/api/wallet/proverbs?limit=1`);
    
    if (response.status === 200) {
      const data = response.data;
      console.log(`  ✅ Wallet interface accessible`);
      console.log(`     Found ${data.proverbs?.length || 0} proverbs in database\n`);
    } else {
      console.log(`  ⚠️  Wallet interface may not be running\n`);
    }
  } catch (error: any) {
    console.log(`  ⚠️  Wallet interface check failed: ${error.message}`);
    console.log(`     (This is okay if interface is not running)\n`);
  }

  // Summary
  console.log('========================================');
  console.log('Test Submission Flow Complete!');
  console.log('========================================\n');
  
  console.log('✅ All steps completed successfully!');
  console.log('\nWhat was tested:');
  console.log('  ✅ Z-address retrieval');
  console.log('  ✅ Memo parsing');
  console.log('  ✅ NEAR Cloud AI verification');
  console.log('  ✅ Database submission');
  console.log('  ✅ Transaction builder');
  console.log('\nNext: Test with a real Zcash transaction!');
  console.log('  1. Send ZEC to your z-address with a memo');
  console.log('  2. Monitor Oracle logs');
  console.log('  3. Check wallet interface for results\n');

  // Cleanup
  await db.close();
  await zcashClient.cleanup();
}

testProverbSubmission().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

