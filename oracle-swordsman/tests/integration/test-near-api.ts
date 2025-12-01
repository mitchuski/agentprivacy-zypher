/**
 * Test script for NEAR Cloud AI API connection
 * Tests both attestation and chat completions endpoints
 */

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const NEAR_API_KEY = process.env.NEAR_API_KEY || '';
const NEAR_MODEL = process.env.NEAR_MODEL || 'openai/gpt-oss-120b';
const API_URL = 'https://cloud-api.near.ai/v1';

async function testAttestation() {
  console.log('\n🔐 Testing Model Attestation...');
  console.log(`Model: ${NEAR_MODEL}`);
  console.log(`Endpoint: ${API_URL}/attestation/report?model=${NEAR_MODEL}\n`);

  try {
    const response = await axios.get(
      `${API_URL}/attestation/report?model=${encodeURIComponent(NEAR_MODEL)}`,
      {
        headers: {
          'Authorization': `Bearer ${NEAR_API_KEY}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Attestation Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📋 Attestation Summary:');
    console.log(`  Signing Address: ${response.data.signing_address}`);
    console.log(`  Has NVIDIA Payload: ${!!response.data.nvidia_payload}`);
    console.log(`  Has Intel Quote: ${!!response.data.intel_quote}`);
    console.log(`  Total Nodes: ${response.data.all_attestations?.length || 0}`);

    return true;
  } catch (error: any) {
    console.error('❌ Attestation Test Failed:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    return false;
  }
}

async function testChatCompletions() {
  console.log('\n💬 Testing Chat Completions...');
  console.log(`Model: ${NEAR_MODEL}`);
  console.log(`Endpoint: ${API_URL}/chat/completions\n`);

  try {
    const response = await axios.post(
      `${API_URL}/chat/completions`,
      {
        model: NEAR_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, NEAR Cloud AI!" and nothing else.'
          }
        ],
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${NEAR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Chat Completions Response:');
    const message = response.data.choices?.[0]?.message?.content || 'No content';
    console.log(`  Message: ${message}`);
    console.log(`  Chat ID: ${response.data.id}`);
    console.log(`  Model: ${response.data.model}`);
    console.log(`  Usage: ${JSON.stringify(response.data.usage, null, 2)}`);

    return { success: true, chatId: response.data.id };
  } catch (error: any) {
    console.error('❌ Chat Completions Test Failed:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    return { success: false };
  }
}

async function testSignature(chatId: string) {
  console.log('\n✍️  Testing Signature Retrieval...');
  console.log(`Chat ID: ${chatId}`);
  console.log(`Endpoint: ${API_URL}/signature/${chatId}?model=${NEAR_MODEL}&signing_algo=ecdsa\n`);

  try {
    // Wait a moment for signature to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await axios.get(
      `${API_URL}/signature/${chatId}?model=${encodeURIComponent(NEAR_MODEL)}&signing_algo=ecdsa`,
      {
        headers: {
          'Authorization': `Bearer ${NEAR_API_KEY}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Signature Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📋 Signature Summary:');
    console.log(`  Text (Request:Response Hash): ${response.data.text}`);
    console.log(`  Signature: ${response.data.signature}`);
    console.log(`  Signing Address: ${response.data.signing_address}`);
    console.log(`  Signing Algorithm: ${response.data.signing_algo}`);

    return true;
  } catch (error: any) {
    console.error('❌ Signature Test Failed:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      if (error.response.status === 404) {
        console.error('  Note: Signature may not be available yet. Try again in a few seconds.');
      }
    } else {
      console.error(`  Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 NEAR Cloud AI API Connection Test');
  console.log('=====================================\n');

  if (!NEAR_API_KEY) {
    console.error('❌ NEAR_API_KEY not found in environment variables');
    console.error('   Please set NEAR_API_KEY in your .env file');
    process.exit(1);
  }

  console.log(`API Key: ${NEAR_API_KEY.substring(0, 10)}...${NEAR_API_KEY.substring(NEAR_API_KEY.length - 4)}`);
  console.log(`Model: ${NEAR_MODEL}\n`);

  // Test 1: Attestation
  const attestationSuccess = await testAttestation();

  // Test 2: Chat Completions
  const chatResult = await testChatCompletions();

  // Test 3: Signature (if chat was successful)
  let signatureSuccess = false;
  if (chatResult.success && chatResult.chatId) {
    signatureSuccess = await testSignature(chatResult.chatId);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Attestation:     ${attestationSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Chat Completions: ${chatResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Signature:      ${signatureSuccess ? '✅ PASS' : '⚠️  SKIP/FAIL'}`);

  if (attestationSuccess && chatResult.success) {
    console.log('\n✅ All critical tests passed! NEAR Cloud AI is connected properly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

