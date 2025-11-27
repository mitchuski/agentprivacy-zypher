import { config } from './config';
import { db } from './database';
import { zcashClient } from './zcash-client';
import { ipfsClient } from './ipfs-client';
import { nearVerifier } from './nearcloudai-verifier';
import { nillionSigner } from './nillion-signer';
import { createTransactionMonitor, NewSubmission } from './transaction-monitor';
import { createTransactionBuilder } from './transaction-builder';
import { parseMemo, extractSubmissionData, validateProverb, SubmissionData } from './memo-parser';
import logger from './logger';

let isProcessing = false;
let isRunning = true;
let transactionMonitor: ReturnType<typeof createTransactionMonitor> | null = null;
let transactionBuilder: ReturnType<typeof createTransactionBuilder> | null = null;

// Process a new submission from transaction monitor
async function processSubmission(submission: NewSubmission) {
  if (isProcessing) {
    logger.debug('Already processing, queuing submission');
    // Could implement a queue here if needed
    return;
  }

  isProcessing = true;

  try {
    const { submissionData, txid, senderAddress, amount, confirmations } = submission;
    const { trackingCode, proverbText, taleId } = submissionData;

    logger.info(`Processing submission: ${trackingCode}`, {
      txid,
      amount,
      confirmations,
      taleId,
    });

    // Validate proverb
    const validation = validateProverb(proverbText);
    if (!validation.valid) {
      logger.warn('Invalid proverb, skipping', { 
        txid, 
        trackingCode,
        error: validation.error 
      });
      return;
    }

    // Check if already processed
    const existing = await db.getSubmissionByTrackingCode(trackingCode);
    if (existing) {
      logger.debug('Submission already processed', { 
        txid, 
        trackingCode,
        submissionId: existing.id 
      });
      return;
    }
    
    // Create submission record
    const dbSubmission = await db.createSubmission({
      tracking_code: trackingCode,
      sender_address: senderAddress,
      proverb_text: proverbText,
      amount_zec: amount,
      txid: txid,
      memo_text: submission.rawMemo,
    });
    
    logger.info(`Created submission: ${dbSubmission.id}`, { 
      trackingCode,
      proverbLength: proverbText.length 
    });
    
    // Fetch spellbook from IPFS
    let spellbook;
    try {
      spellbook = await ipfsClient.fetchSpellbook();
      logger.debug('Spellbook fetched', { 
        version: spellbook.version,
        actCount: spellbook.acts.length 
      });
    } catch (error: any) {
      logger.error('Failed to fetch spellbook', { 
        error: error.message,
        submissionId: dbSubmission.id 
      });
      await db.updateSubmissionStatus(dbSubmission.id, 'failed');
      return;
    }
    
    // Verify with AI
    let verification;
    try {
      verification = await nearVerifier.verify(proverbText, spellbook);
      logger.info('Verification complete', {
        submissionId: dbSubmission.id,
        quality_score: verification.quality_score,
        matched_act: verification.matched_act,
        approved: verification.approved,
      });
    } catch (error: any) {
      logger.error('Verification failed', { 
        error: error.message,
        submissionId: dbSubmission.id 
      });
      await db.updateSubmissionStatus(dbSubmission.id, 'failed');
      return;
    }
    
    // Save verification
    await db.createVerification({
      submission_id: dbSubmission.id,
      ai_provider: 'near',
      quality_score: verification.quality_score,
      matched_act: verification.matched_act,
      reasoning: verification.reasoning,
    });
    
    if (verification.approved) {
      // Inscribe proverb using transaction builder
      await inscribeProverb(dbSubmission, submissionData);
    } else {
      await db.updateSubmissionStatus(dbSubmission.id, 'rejected');
      logger.info('Submission rejected: quality too low', {
        submissionId: dbSubmission.id,
        quality_score: verification.quality_score,
      });
    }
    
  } catch (error: any) {
    logger.error(`Error processing submission: ${submission.txid}`, {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    isProcessing = false;
  }
}

// Inscribe proverb on blockchain using transaction builder
async function inscribeProverb(
  submission: { id: number; amount_zec: number; sender_address: string },
  submissionData: SubmissionData
) {
  try {
    if (!transactionBuilder) {
      throw new Error('Transaction builder not initialized');
    }

    logger.info('Inscribing proverb', {
      submissionId: submission.id,
      trackingCode: submissionData.trackingCode,
    });

    // Use transaction builder to create inscription
    const result = await transactionBuilder.createInscription({
      trackingCode: submissionData.trackingCode,
      proverbText: submissionData.proverbText,
      taleId: submissionData.taleId,
      totalAmount: submission.amount_zec,
      senderAddress: submission.sender_address,
    });

    if (!result.success) {
      throw new Error(result.error || 'Inscription failed');
    }

    // Save inscription records
    await db.createInscription({
      submission_id: submission.id,
      public_txid: result.publicTxid!,
      private_txid: result.privateTxid!,
      public_amount: result.publicAmount!,
      private_amount: result.privateAmount!,
      network_fee: config.economics.network_fee,
    });

    await db.updateSubmissionStatus(submission.id, 'completed');

    logger.info('Inscription complete', {
      submissionId: submission.id,
      publicTxid: result.publicTxid,
      privateTxid: result.privateTxid,
      publicAmount: result.publicAmount,
      privateAmount: result.privateAmount,
    });
    
  } catch (error: any) {
    logger.error('Error inscribing proverb', {
      submissionId: submission.id,
      error: error.message,
      stack: error.stack,
    });
    await db.updateSubmissionStatus(submission.id, 'failed');
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down Oracle Swordsman...');
  isRunning = false;
  
  // Stop transaction monitor
  if (transactionMonitor) {
    transactionMonitor.stop();
    logger.info('Transaction monitor stopped');
  }
  
  // Cleanup Zcash client
  await zcashClient.cleanup();
  
  // Wait for current processing to finish
  while (isProcessing) {
    logger.info('Waiting for current processing to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await db.close();
  logger.info('Oracle Swordsman shut down complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Main function
async function main() {
  logger.info('Oracle Swordsman starting...');
  logger.info('Configuration:', {
    network: config.zcash.network,
    checkInterval: config.oracle.checkInterval,
    economics: config.economics,
  });
  
  // Test connections
  logger.info('Testing connections...');
  
  const dbOk = await db.testConnection();
  if (!dbOk) {
    logger.error('Database connection failed!');
    process.exit(1);
  }
  logger.info('✓ Database connected');
  
  // Initialize Zcash client
  try {
    await zcashClient.initialize();
    const balance = await zcashClient.getBalance();
    const height = await zcashClient.getBlockHeight();
    logger.info('✓ Zcash client connected', { balance, height });
  } catch (error: any) {
    logger.error('Zcash client initialization failed', { error: error.message });
    logger.warn('Continuing anyway - will retry on first check');
  }
  
  // Initialize transaction builder
  try {
    transactionBuilder = createTransactionBuilder(zcashClient);
    await transactionBuilder.initialize();
    logger.info('✓ Transaction builder initialized');
  } catch (error: any) {
    logger.error('Transaction builder initialization failed', { error: error.message });
    logger.warn('Continuing anyway - inscriptions will fail until addresses are configured');
  }
  
  // Test IPFS connection
  try {
    const spellbook = await ipfsClient.fetchSpellbook();
    logger.info('✓ IPFS client connected', { 
      version: spellbook.version,
      actCount: spellbook.acts.length 
    });
  } catch (error: any) {
    logger.error('IPFS connection failed', { error: error.message });
    logger.warn('Continuing anyway - will retry when needed');
  }
  
  // Initialize Nillion (non-blocking)
  nillionSigner.initialize().catch((error: any) => {
    logger.error('Nillion initialization failed', { error: error.message });
    logger.warn('Continuing anyway - signing will fail until Nillion is configured');
  });
  
  // Start API server
  try {
    const { startApiServer } = await import('./api');
    startApiServer();
    logger.info('✓ API server started');
  } catch (error: any) {
    logger.error('Failed to start API server', { error: error.message });
    logger.warn('Continuing without API server');
  }
  
  // Start transaction monitor
  try {
    transactionMonitor = createTransactionMonitor(zcashClient);
    
    // Listen for new submissions
    transactionMonitor.on('newSubmission', async (submission) => {
      await processSubmission(submission);
    });
    
    // Listen for invalid submissions
    transactionMonitor.on('invalidSubmission', (info) => {
      logger.warn('Invalid submission detected', {
        txid: info.txid,
        reason: info.reason,
      });
    });
    
    // Listen for errors
    transactionMonitor.on('error', (error) => {
      logger.error('Transaction monitor error', { error: error.message });
    });
    
    // Start monitoring
    await transactionMonitor.start();
    logger.info('✓ Transaction monitor started');
    
    // Log monitor stats periodically
    setInterval(() => {
      const stats = transactionMonitor!.getStats();
      logger.debug('Monitor stats', stats);
    }, 60000); // Every minute
    
  } catch (error: any) {
    logger.error('Failed to start transaction monitor', { error: error.message });
    logger.warn('Continuing without transaction monitoring');
  }
}

// Start the Oracle
main().catch((error) => {
  logger.error('Fatal error starting Oracle', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});

