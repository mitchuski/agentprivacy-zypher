/**
 * Connection Verification Script
 * Verifies all critical connections for the Oracle Swordsman
 */

import dotenv from 'dotenv';
dotenv.config();

import { config } from './config';
import { ipfsClient } from './ipfs-client';
import { nearVerifier } from './nearcloudai-verifier';
import axios from 'axios';

interface VerificationResult {
  component: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️  WARN';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

async function verifyConfig(): Promise<void> {
  console.log('\n📋 Configuration Verification\n================================');
  
  // Check API keys
  const hasMageKey = !!config.near.mageApiKey;
  const hasSwordsmanKey = !!config.near.swordsmanApiKey;
  const keysAreDifferent = config.near.mageApiKey !== config.near.swordsmanApiKey;
  
  results.push({
    component: 'NEAR_API_KEY (Mage)',
    status: hasMageKey ? '✅ PASS' : '❌ FAIL',
    message: hasMageKey ? 'Mage API key configured' : 'Mage API key missing',
    details: hasMageKey ? { keyPrefix: config.near.mageApiKey.substring(0, 10) + '...' } : undefined,
  });
  
  results.push({
    component: 'NEAR_SWORDSMAN_API_KEY',
    status: hasSwordsmanKey ? '✅ PASS' : '❌ FAIL',
    message: hasSwordsmanKey ? 'Swordsman API key configured' : 'Swordsman API key missing',
    details: hasSwordsmanKey ? { keyPrefix: config.near.swordsmanApiKey.substring(0, 10) + '...' } : undefined,
  });
  
  results.push({
    component: 'API Key Separation',
    status: keysAreDifferent ? '✅ PASS' : '⚠️  WARN',
    message: keysAreDifferent 
      ? 'Mage and Swordsman keys are different (correct)' 
      : 'Mage and Swordsman keys are the same (should be separate)',
  });
  
  // Check spellbook config
  const hasSpellbookUrl = !!config.ipfs.spellbookUrl;
  results.push({
    component: 'Spellbook URL',
    status: hasSpellbookUrl ? '✅ PASS' : '⚠️  WARN',
    message: hasSpellbookUrl 
      ? `Spellbook URL configured: ${config.ipfs.spellbookUrl.substring(0, 60)}...`
      : 'Using default spellbook URL',
    details: { url: config.ipfs.spellbookUrl },
  });
  
  // Check model
  results.push({
    component: 'NEAR Model',
    status: '✅ PASS',
    message: `Model: ${config.near.model}`,
    details: { model: config.near.model },
  });
  
  console.log('Configuration check complete');
}

async function verifyIPFS(): Promise<void> {
  console.log('\n🌐 IPFS Spellbook Verification\n================================');
  
  try {
    const spellbook = await ipfsClient.fetchSpellbook();
    
    results.push({
      component: 'IPFS Spellbook Fetch',
      status: '✅ PASS',
      message: `Spellbook fetched successfully`,
      details: {
        version: spellbook.version,
        actCount: spellbook.acts.length,
        hasProverbs: spellbook.acts.filter(a => a.proverb).length,
        cacheStatus: ipfsClient.getCacheStatus(),
      },
    });
    
    // Check for proverbs
    const actsWithProverbs = spellbook.acts.filter(a => a.proverb);
    results.push({
      component: 'Spellbook Proverbs',
      status: actsWithProverbs.length > 0 ? '✅ PASS' : '⚠️  WARN',
      message: `Found ${actsWithProverbs.length} acts/tales with proverbs`,
      details: {
        totalActs: spellbook.acts.length,
        actsWithProverbs: actsWithProverbs.length,
        sampleProverbs: actsWithProverbs.slice(0, 3).map(a => ({
          id: a.id,
          proverb: a.proverb?.substring(0, 60) + '...',
        })),
      },
    });
    
    console.log(`✓ Spellbook version: ${spellbook.version}`);
    console.log(`✓ Total acts/tales: ${spellbook.acts.length}`);
    console.log(`✓ Acts with proverbs: ${actsWithProverbs.length}`);
    
  } catch (error: any) {
    results.push({
      component: 'IPFS Spellbook Fetch',
      status: '❌ FAIL',
      message: `Failed to fetch spellbook: ${error.message}`,
      details: { error: error.message },
    });
    console.error(`✗ Failed to fetch spellbook: ${error.message}`);
  }
}

async function verifyNEARCloudAI(): Promise<void> {
  console.log('\n🤖 NEAR Cloud AI Verification\n================================');
  
  try {
    // Test attestation
    console.log('Testing model attestation...');
    const attestation = await nearVerifier.getModelAttestation();
    
    results.push({
      component: 'NEAR Model Attestation',
      status: '✅ PASS',
      message: 'Model attestation received',
      details: {
        signingAddress: attestation.signing_address,
        hasNvidiaPayload: !!attestation.nvidia_payload,
        hasIntelQuote: !!attestation.intel_quote,
        nodeCount: attestation.all_attestations?.length || 0,
      },
    });
    
    console.log(`✓ Signing address: ${attestation.signing_address}`);
    console.log(`✓ Attestation nodes: ${attestation.all_attestations?.length || 0}`);
    
    // Test connection
    console.log('Testing chat completions...');
    const connectionOk = await nearVerifier.testConnection();
    
    results.push({
      component: 'NEAR Chat Completions',
      status: connectionOk ? '✅ PASS' : '❌ FAIL',
      message: connectionOk ? 'Chat completions API working' : 'Chat completions API failed',
    });
    
    if (connectionOk) {
      console.log('✓ Chat completions API working');
    } else {
      console.error('✗ Chat completions API failed');
    }
    
  } catch (error: any) {
    results.push({
      component: 'NEAR Cloud AI',
      status: '❌ FAIL',
      message: `NEAR Cloud AI verification failed: ${error.message}`,
      details: { error: error.message },
    });
    console.error(`✗ NEAR Cloud AI verification failed: ${error.message}`);
  }
}

async function verifyProverbMatching(): Promise<void> {
  console.log('\n📜 Proverb Matching Verification\n================================');
  
  try {
    const spellbook = await ipfsClient.fetchSpellbook();
    
    // Find a sample proverb from the spellbook
    const actWithProverb = spellbook.acts.find(a => a.proverb);
    if (!actWithProverb || !actWithProverb.proverb) {
      results.push({
        component: 'Proverb Matching',
        status: '⚠️  WARN',
        message: 'No proverbs found in spellbook to test',
      });
      return;
    }
    
    const testProverb = actWithProverb.proverb;
    console.log(`Testing exact match with: "${testProverb.substring(0, 60)}..."`);
    
    const result = await nearVerifier.verify(testProverb, spellbook);
    
    results.push({
      component: 'Proverb Exact Match',
      status: result.quality_score >= 0.9 ? '✅ PASS' : '⚠️  WARN',
      message: `Quality score: ${result.quality_score.toFixed(2)}`,
      details: {
        quality_score: result.quality_score,
        matched_act: result.matched_act,
        approved: result.approved,
        reasoning: result.reasoning.substring(0, 100) + '...',
      },
    });
    
    if (result.quality_score >= 0.9) {
      console.log(`✓ Exact match detected (quality: ${result.quality_score.toFixed(2)})`);
      console.log(`✓ Matched act: ${result.matched_act}`);
    } else {
      console.warn(`⚠️  Expected exact match but got quality: ${result.quality_score.toFixed(2)}`);
    }
    
  } catch (error: any) {
    results.push({
      component: 'Proverb Matching',
      status: '❌ FAIL',
      message: `Proverb matching test failed: ${error.message}`,
      details: { error: error.message },
    });
    console.error(`✗ Proverb matching test failed: ${error.message}`);
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
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n   ')}`);
    }
    console.log('');
  });
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 All verifications passed! Oracle Swordsman is ready.');
  } else if (failed === 0) {
    console.log('⚠️  Some warnings detected, but no critical failures.');
  } else {
    console.log('❌ Some verifications failed. Please check the details above.');
  }
}

async function main() {
  console.log('🔍 Oracle Swordsman Connection Verification');
  console.log('==========================================\n');
  
  await verifyConfig();
  await verifyIPFS();
  await verifyNEARCloudAI();
  await verifyProverbMatching();
  await printSummary();
}

main().catch((error) => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
});

