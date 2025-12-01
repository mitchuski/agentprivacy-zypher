import express from 'express';
import { db, Submission, Verification } from './database';
import logger from './logger';
import cors from 'cors';
import { parseMemo, extractSubmissionData } from './memo-parser';
import { ipfsClient } from './ipfs-client';
import { nearVerifier } from './nearcloudai-verifier';
import path from 'path';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve admin interface static files
// Resolve paths relative to project root (works in both dev and production)
const projectRoot = process.cwd().endsWith('oracle-swordsman') 
  ? process.cwd() 
  : path.join(process.cwd(), 'oracle-swordsman');
const adminPath = path.join(projectRoot, 'admin');
app.use('/admin', express.static(adminPath));

// Serve wallet UI static files
const walletPath = path.join(projectRoot, 'wallet-ui');
app.use('/wallet', express.static(walletPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'oracle-swordsman' });
});

// Get submission status by tracking code
app.get('/api/status/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const submission = await db.getSubmissionByTrackingCode(code);
    
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        tracking_code: code,
      });
    }

    const verification = await db.getVerification(submission.id);

    res.json({
      status: submission.status,
      tracking_code: submission.tracking_code,
      quality_score: verification?.quality_score || null,
      matched_act: verification?.matched_act || null,
      reasoning: verification?.reasoning || null,
      txid: submission.txid,
      created_at: submission.created_at,
      verified_at: verification?.verified_at || null,
    });
  } catch (error: any) {
    logger.error('Status check error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Stats error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Get all submissions (with pagination)
app.get('/api/admin/submissions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT 
        s.*,
        v.quality_score,
        v.matched_act,
        v.reasoning,
        v.verified_at,
        v.status as verification_status
      FROM submissions s
      LEFT JOIN verifications v ON s.id = v.submission_id
    `;
    
    const params: any[] = [];
    if (status) {
      query += ` WHERE s.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(query, params);
    await pool.end();

    res.json({
      submissions: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rows.length,
      },
    });
  } catch (error: any) {
    logger.error('Admin submissions error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Get single submission with full details
app.get('/api/admin/submissions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Try by ID first, then by tracking code
    let submission: Submission | null = null;
    const pool1 = new Pool({ connectionString: process.env.DATABASE_URL });
    const idResult = await pool1.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (idResult.rows.length > 0) {
      submission = idResult.rows[0];
    } else {
      submission = await db.getSubmissionByTrackingCode(req.params.id);
    }
    await pool1.end();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const verification = await db.getVerification(submission.id);
    
    // Try to get inscription if exists
    const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
    const inscriptionResult = await pool2.query(
      'SELECT * FROM inscriptions WHERE submission_id = $1',
      [submission.id]
    );
    await pool2.end();

    res.json({
      submission,
      verification,
      inscription: inscriptionResult.rows[0] || null,
    });
  } catch (error: any) {
    logger.error('Admin submission detail error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Create test submission
app.post('/api/admin/submissions/test', async (req, res) => {
  try {
    const { proverb, actId, amount } = req.body;
    
    if (!proverb) {
      return res.status(400).json({ error: 'Proverb text required' });
    }

    const trackingCode = `TEST-${Date.now()}`;
    const txid = `test-tx-${Date.now()}`;
    const memoText = actId ? `ACT:${actId}|${proverb}` : proverb;

    const submission = await db.createSubmission({
      tracking_code: trackingCode,
      sender_address: 'zs1test...',
      proverb_text: proverb,
      amount_zec: amount || 0.01,
      txid: txid,
      memo_text: memoText,
    });

    logger.info('Test submission created', { id: submission.id, trackingCode });

    res.json({
      success: true,
      submission,
      message: 'Test submission created. Oracle will process it automatically.',
    });
  } catch (error: any) {
    logger.error('Test submission error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Manually trigger verification for a submission
app.post('/api/admin/submissions/:id/verify', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    const submission = result.rows[0] || null;
    await pool.end();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Fetch spellbook
    const spellbook = await ipfsClient.fetchSpellbook();
    
    // Verify proverb
    const verification = await nearVerifier.verify(submission.proverb_text, spellbook);
    
    // Save verification
    const dbVerification = await db.createVerification({
      submission_id: submission.id,
      ai_provider: 'near',
      quality_score: verification.quality_score,
      matched_act: verification.matched_act,
      reasoning: verification.reasoning,
    });

    // Update submission status
    const newStatus = verification.approved ? 'approved' : 'rejected';
    await db.updateSubmissionStatus(submission.id, newStatus);

    logger.info('Manual verification complete', {
      submissionId: submission.id,
      quality_score: verification.quality_score,
      approved: verification.approved,
    });

    res.json({
      success: true,
      verification: dbVerification,
      submission_status: newStatus,
    });
  } catch (error: any) {
    logger.error('Manual verification error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Process pending submissions
app.post('/api/admin/process-pending', async (req, res) => {
  try {
    const pending = await db.getPendingSubmissions();
    
    logger.info('Processing pending submissions', { count: pending.length });

    res.json({
      success: true,
      message: `Found ${pending.length} pending submissions. They will be processed by the Oracle monitor.`,
      count: pending.length,
    });
  } catch (error: any) {
    logger.error('Process pending error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Get verification statistics
app.get('/api/admin/stats/detailed', async (req, res) => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(v.quality_score) as avg_quality_score,
        SUM(amount_zec) as total_zec_received
      FROM submissions s
      LEFT JOIN verifications v ON s.id = v.submission_id
    `);

    const byAct = await pool.query(`
      SELECT 
        v.matched_act,
        COUNT(*) as count,
        AVG(v.quality_score) as avg_score
      FROM verifications v
      GROUP BY v.matched_act
      ORDER BY count DESC
    `);

    await pool.end();

    res.json({
      overall: stats.rows[0],
      by_act: byAct.rows,
    });
  } catch (error: any) {
    logger.error('Detailed stats error', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// ============================================
// WALLET API ENDPOINTS
// ============================================

import * as fs from 'fs';

// Load addresses
function loadAddresses() {
  // Try multiple paths to find the address file
  const possiblePaths = [
    path.join(process.cwd(), 'zcash-addresses-controlled.json'),
    path.join(process.cwd(), 'oracle-swordsman', 'zcash-addresses-controlled.json'),
    path.join(__dirname, '..', 'zcash-addresses-controlled.json'),
    path.join(__dirname, '..', '..', 'oracle-swordsman', 'zcash-addresses-controlled.json'),
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        logger.info(`Loaded addresses from: ${filePath}`);
        return data;
      } catch (error: any) {
        logger.error(`Error reading address file ${filePath}:`, error.message);
        continue;
      }
    }
  }
  
  logger.error('Address file not found in any of the expected locations');
  return null;
}

// Get all addresses
app.get('/api/wallet/addresses', async (req, res) => {
  try {
    const data = loadAddresses();
    if (!data) {
      return res.status(404).json({ error: 'Addresses not found' });
    }
    
    // Don't send private keys to frontend, but include act mapping for frontend
    const safeAddresses = data.addresses.map((addr: any) => ({
      type: addr.type,
      index: addr.index,
      path: addr.path,
      address: addr.address,
      network: addr.network,
      label: addr.label,
      // Act mapping for Story Spellbook
      act_id: addr.act_id || null,
      act_number: addr.act_number || null,
      act_title: addr.act_title || null,
      spellbook: addr.spellbook || null,
      purpose: addr.purpose || null,
      description: addr.description || null,
      // Only include first few chars of keys for display
      hasPrivateKey: !!addr.privateKey,
      hasSpendingKey: !!addr.spendingKey,
    }));
    
    res.json({
      mnemonic: data.mnemonic ? '***' + data.mnemonic.split(' ').slice(0, 2).join(' ') + '...' : null,
      network: data.network,
      addresses: safeAddresses,
    });
  } catch (error: any) {
    logger.error('Error loading addresses', { error: error.message });
    res.status(500).json({ error: 'Failed to load addresses' });
  }
});

// Get z-addresses by act_id (for frontend story pages)
app.get('/api/wallet/addresses/z/:actId', async (req, res) => {
  try {
    const { actId } = req.params;
    const data = loadAddresses();
    if (!data) {
      return res.status(404).json({ error: 'Addresses not found' });
    }
    
    // Find z-address for this act
    const zAddress = data.addresses.find((addr: any) => 
      addr.type === 'shielded' && 
      addr.act_id === actId &&
      addr.purpose === 'receive_donations'
    );
    
    if (!zAddress) {
      return res.status(404).json({ error: 'Z-address not found for act', actId });
    }
    
    res.json({
      act_id: zAddress.act_id,
      act_number: zAddress.act_number,
      act_title: zAddress.act_title,
      address: zAddress.address,
      label: zAddress.label,
      spellbook: zAddress.spellbook,
    });
  } catch (error: any) {
    logger.error('Error getting z-address by act', { error: error.message });
    res.status(500).json({ error: 'Failed to get z-address' });
  }
});

// Get all z-addresses mapped to acts (for frontend)
app.get('/api/wallet/addresses/z', async (req, res) => {
  try {
    const data = loadAddresses();
    if (!data) {
      return res.status(404).json({ error: 'Addresses not found' });
    }
    
    // Get all z-addresses with act mapping
    const zAddresses = data.addresses
      .filter((addr: any) => addr.type === 'shielded' && addr.purpose === 'receive_donations')
      .map((addr: any) => ({
        act_id: addr.act_id,
        act_number: addr.act_number,
        act_title: addr.act_title,
        address: addr.address,
        label: addr.label,
        spellbook: addr.spellbook,
        index: addr.index,
      }))
      .sort((a: any, b: any) => {
        // Sort by spellbook, then by act_number or address_number
        if (a.spellbook !== b.spellbook) {
          return a.spellbook === 'story' ? -1 : 1;
        }
        return (a.act_number || a.address_number || 0) - (b.act_number || b.address_number || 0);
      });
    
    res.json({ zAddresses });
  } catch (error: any) {
    logger.error('Error getting z-addresses', { error: error.message });
    res.status(500).json({ error: 'Failed to get z-addresses' });
  }
});

// Get address balance
app.get('/api/wallet/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { zcashClient } = await import('./zcash-client');
    
    let balance = 0;
    try {
      // Use the getBalance method which handles both transparent and shielded
      const balances = await zcashClient.getBalance();
      
      // For specific address, we need to check individually
      // This is a simplified approach - in production, you'd want a method to get balance for specific address
      if (address.startsWith('t') || address.startsWith('C')) {
        // Try to get balance for transparent address
        // Note: zcashClient doesn't have a direct method for this, so we'll use a workaround
        balance = balances.transparent; // This is total transparent balance
      } else if (address.startsWith('zs1') || address.startsWith('ztestsapling1')) {
        // For shielded, try to get balance for specific address
        // Use private method as workaround (will need to expose this properly later)
        try {
          balance = await (zcashClient as any).execCommandJSON('z_getbalance', address) as number;
        } catch {
          balance = balances.shielded; // Fallback to total shielded balance
        }
      }
    } catch (error: any) {
      logger.warn('Could not get balance', { address, error: error.message });
    }
    
    res.json({ address, balance: balance || 0 });
  } catch (error: any) {
    logger.error('Error getting balance', { error: error.message });
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get all balances with act mapping
app.get('/api/wallet/balances', async (req, res) => {
  try {
    const data = loadAddresses();
    if (!data) {
      return res.status(404).json({ error: 'Addresses not found' });
    }
    
    const { zcashClient } = await import('./zcash-client');
    const balances: any[] = [];
    
    // Get total balances first
    const totalBalances = await zcashClient.getBalance();
    
    for (const addr of data.addresses) {
      let balance = 0;
      try {
        if (addr.address.startsWith('t') || addr.address.startsWith('C')) {
          // For transparent addresses, try to get specific balance
          // Use private method as workaround (will need proper method later)
          try {
            const unspent = await (zcashClient as any).execCommandJSON('listunspent', 0, 9999999, [addr.address]) as any[];
            balance = unspent.reduce((sum: number, utxo: any) => sum + (utxo.amount || 0), 0);
          } catch {
            // If we can't get specific balance, return 0 (address might not have funds)
            balance = 0;
          }
        } else if (addr.address.startsWith('zs1') || addr.address.startsWith('ztestsapling1')) {
          // For shielded addresses
          try {
            balance = await (zcashClient as any).execCommandJSON('z_getbalance', addr.address) as number;
          } catch {
            balance = 0;
          }
        }
      } catch (error: any) {
        // Ignore balance errors - return 0
        balance = 0;
      }
      
      balances.push({
        address: addr.address,
        type: addr.type,
        balance: balance || 0,
        label: addr.label,
        act_id: addr.act_id || null,
        act_number: addr.act_number || null,
        act_title: addr.act_title || null,
        spellbook: addr.spellbook || null,
        purpose: addr.purpose || null,
      });
    }
    
    res.json({ balances, total: totalBalances });
  } catch (error: any) {
    logger.error('Error getting balances', { error: error.message });
    res.status(500).json({ error: 'Failed to get balances' });
  }
});

// Send transaction
app.post('/api/wallet/send', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, isShielded } = req.body;
    
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { zcashClient } = await import('./zcash-client');
    
    // Use the send method which handles both transparent and shielded
    const result = await zcashClient.send(toAddress, amount);
    
    if (!result.success) {
      throw new Error(result.error || 'Transaction failed');
    }
    
    logger.info('Transaction sent', { fromAddress, toAddress, amount, txid: result.txid });
    res.json({ success: true, txid: result.txid });
  } catch (error: any) {
    logger.error('Error sending transaction', { error: error.message });
    res.status(500).json({ error: error.message || 'Failed to send transaction' });
  }
});

// Get unspent outputs
app.get('/api/wallet/unspent/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { zcashClient } = await import('./zcash-client');
    
    // Use private method as workaround (will need proper method later)
    const unspent = await (zcashClient as any).execCommandJSON('listunspent', 0, 9999999, [address]) as any[];
    res.json({ address, unspent: unspent || [] });
  } catch (error: any) {
    logger.error('Error getting unspent', { error: error.message });
    res.status(500).json({ error: 'Failed to get unspent outputs' });
  }
});

// Get transactions with memos (proverbs)
app.get('/api/wallet/transactions', async (req, res) => {
  try {
    const { zcashClient } = await import('./zcash-client');
    const limit = parseInt(req.query.limit as string) || 50;
    
    const transactions = await zcashClient.listTransactions(limit);
    
    // Parse memos to extract proverbs
    const { parseMemo, extractSubmissionData } = await import('./memo-parser');
    const transactionsWithProverbs = transactions
      .filter(tx => tx.memo && tx.memo.trim().length > 0)
      .map(tx => {
        const parsed = parseMemo(tx.memo!);
        const submissionData = extractSubmissionData(parsed);
        
        return {
          txid: tx.txid,
          type: tx.type,
          address: tx.address,
          amount: tx.amount,
          confirmations: tx.confirmations,
          blockheight: tx.blockheight,
          timestamp: tx.timestamp,
          memo: tx.memo,
          parsed: {
            format: parsed.format,
            valid: parsed.valid,
            trackingCode: submissionData?.trackingCode,
            taleId: submissionData?.taleId,
            proverbText: submissionData?.proverbText,
          },
        };
      });
    
    res.json({ 
      transactions: transactionsWithProverbs,
      total: transactionsWithProverbs.length 
    });
  } catch (error: any) {
    logger.error('Error getting transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get verified proverbs (from database) with t-address tracking
app.get('/api/wallet/proverbs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    const actId = req.query.act_id as string | undefined;
    
    // Get submissions from database (default to verified if no status specified)
    let submissions = await db.getSubmissions(limit, offset, status || 'verified');
    
    // Filter by act_id if provided
    if (actId) {
      submissions = submissions.filter((sub: any) => {
        if (sub.memo_text) {
          const { parseMemo, extractSubmissionData } = require('./memo-parser');
          const parsed = parseMemo(sub.memo_text);
          const submissionData = extractSubmissionData(parsed);
          return submissionData?.taleId === actId;
        }
        return false;
      });
    }
    
    // Load addresses to map t-addresses to acts
    const addressData = loadAddresses();
    const tAddressMap = new Map();
    if (addressData) {
      addressData.addresses
        .filter((addr: any) => addr.type === 'transparent' && addr.purpose === 'track_inscriptions')
        .forEach((addr: any) => {
          tAddressMap.set(addr.act_id || addr.address_number, {
            address: addr.address,
            act_id: addr.act_id,
            act_number: addr.act_number,
            act_title: addr.act_title,
            label: addr.label,
          });
        });
    }
    
    // Get balances for t-addresses
    const { zcashClient } = await import('./zcash-client');
    const addressBalances = new Map();
    
    // Get verifications for each submission
    const proverbs = await Promise.all(submissions.map(async (sub) => {
      const verification = await db.getVerification(sub.id);
      // Extract tale_id from memo_text if not in database
      let taleId = null;
      let actIdFromMemo = null;
      if (sub.memo_text) {
        const { parseMemo, extractSubmissionData } = await import('./memo-parser');
        const parsed = parseMemo(sub.memo_text);
        const submissionData = extractSubmissionData(parsed);
        taleId = submissionData?.taleId || null;
        actIdFromMemo = submissionData?.taleId || null;
      }
      
      // Get t-address for this act
      const tAddressInfo = actIdFromMemo ? tAddressMap.get(actIdFromMemo) : null;
      let tAddressBalance = 0;
      if (tAddressInfo) {
        try {
          const unspent = await (zcashClient as any).execCommandJSON('listunspent', 0, 9999999, [tAddressInfo.address]) as any[];
          tAddressBalance = unspent.reduce((sum: number, utxo: any) => sum + (utxo.amount || 0), 0);
        } catch {
          tAddressBalance = 0;
        }
      }
      
      return {
        id: sub.id,
        trackingCode: sub.tracking_code,
        proverbText: sub.proverb_text,
        taleId: taleId,
        actId: actIdFromMemo,
        txid: sub.txid,
        status: sub.status,
        amount: sub.amount_zec || 0,
        memo: sub.memo_text || null,
        createdAt: sub.created_at,
        verifiedAt: verification?.verified_at || null,
        qualityScore: verification?.quality_score || null,
        matchedAct: verification?.matched_act || null,
        reasoning: verification?.reasoning || null,
        // T-address tracking
        tAddress: tAddressInfo?.address || null,
        tAddressBalance: tAddressBalance,
        tAddressLabel: tAddressInfo?.label || null,
        actTitle: tAddressInfo?.act_title || null,
      };
    }));
    
    res.json({ 
      proverbs,
      total: proverbs.length,
      limit,
      offset
    });
  } catch (error: any) {
    logger.error('Error getting proverbs', { error: error.message });
    res.status(500).json({ error: 'Failed to get proverbs' });
  }
});

// Get proverb by tracking code
app.get('/api/wallet/proverbs/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const submission = await db.getSubmissionByTrackingCode(code);
    if (!submission) {
      return res.status(404).json({ error: 'Proverb not found' });
    }
    
    const verification = await db.getVerification(submission.id);
    
    res.json({
      id: submission.id,
      trackingCode: submission.tracking_code,
      proverbText: submission.proverb_text,
      taleId: null, // tale_id is extracted from memo_text, not stored in DB
      txid: submission.txid,
      status: submission.status,
      createdAt: submission.created_at,
      verification: verification ? {
        qualityScore: verification.quality_score,
        matchedAct: verification.matched_act,
        reasoning: verification.reasoning,
        verifiedAt: verification.verified_at,
      } : null,
    });
  } catch (error: any) {
    logger.error('Error getting proverb', { error: error.message });
    res.status(500).json({ error: 'Failed to get proverb' });
  }
});

// ============================================
// PROOF OF PROVERB / INSCRIPTION API ENDPOINTS
// ============================================

import {
  inscriptionIndexer,
  getAllInscriptions,
  scanTransactionForInscription,
  ACT_P2SH_ADDRESSES,
  ACT_TITLES,
} from './inscription-indexer';

// Get all inscriptions (proof of proverb page)
app.get('/api/inscriptions', async (req, res) => {
  try {
    const actNumber = req.query.act ? parseInt(req.query.act as string) : undefined;

    // Get inscriptions from database
    const inscriptions = await inscriptionIndexer.getInscriptions(actNumber);

    // Get count by act for summary
    const countByAct = await inscriptionIndexer.getCountByAct();

    res.json({
      inscriptions,
      total: inscriptions.length,
      countByAct,
      actAddresses: ACT_P2SH_ADDRESSES,
    });
  } catch (error: any) {
    logger.error('Error getting inscriptions', { error: error.message });
    res.status(500).json({ error: 'Failed to get inscriptions', details: error.message });
  }
});

// Get inscription by TXID
app.get('/api/inscriptions/tx/:txid', async (req, res) => {
  try {
    const { txid } = req.params;

    const inscription = await scanTransactionForInscription(txid);

    if (!inscription) {
      return res.status(404).json({ error: 'No inscription found in transaction', txid });
    }

    res.json({ inscription });
  } catch (error: any) {
    logger.error('Error getting inscription by txid', { error: error.message });
    res.status(500).json({ error: 'Failed to get inscription', details: error.message });
  }
});

// Get inscriptions by act number
app.get('/api/inscriptions/act/:actNumber', async (req, res) => {
  try {
    const actNumber = parseInt(req.params.actNumber);

    if (actNumber < 1 || actNumber > 12) {
      return res.status(400).json({ error: 'Invalid act number. Must be 1-12.' });
    }

    const inscriptions = await inscriptionIndexer.getInscriptions();
    const actInscriptions = inscriptions.filter(i => i.actNumber === actNumber);

    res.json({
      actNumber,
      actTitle: ACT_TITLES[actNumber] || `Act ${actNumber}`,
      actAddress: ACT_P2SH_ADDRESSES[actNumber],
      inscriptions: actInscriptions,
      total: actInscriptions.length,
    });
  } catch (error: any) {
    logger.error('Error getting inscriptions by act', { error: error.message });
    res.status(500).json({ error: 'Failed to get inscriptions', details: error.message });
  }
});

// Index/scan all Act addresses for inscriptions
app.post('/api/inscriptions/scan', async (req, res) => {
  try {
    // Initialize table if needed
    await inscriptionIndexer.initializeTable();

    // Scan all Act P2SH addresses for inscriptions
    const count = await inscriptionIndexer.scanAllAddresses();

    res.json({
      success: true,
      message: `Scanned all addresses, found ${count} new inscriptions`,
      count,
    });
  } catch (error: any) {
    logger.error('Error scanning inscriptions', { error: error.message });
    res.status(500).json({ error: 'Failed to scan inscriptions', details: error.message });
  }
});

// Initialize the inscriptions table
app.post('/api/inscriptions/init', async (req, res) => {
  try {
    await inscriptionIndexer.initializeTable();

    res.json({
      success: true,
      message: 'Inscriptions table initialized',
    });
  } catch (error: any) {
    logger.error('Error initializing inscriptions table', { error: error.message });
    res.status(500).json({ error: 'Failed to initialize table', details: error.message });
  }
});

// Add a new inscription TXID to scan
app.post('/api/inscriptions/add', async (req, res) => {
  try {
    const { txid } = req.body;

    if (!txid) {
      return res.status(400).json({ error: 'txid is required' });
    }

    const inscription = await scanTransactionForInscription(txid);

    if (!inscription) {
      return res.status(404).json({ error: 'No valid inscription found in transaction', txid });
    }

    // Save to database
    await inscriptionIndexer.saveInscription(inscription);

    res.json({
      success: true,
      message: 'Inscription added successfully',
      inscription,
    });
  } catch (error: any) {
    logger.error('Error adding inscription', { error: error.message });
    res.status(500).json({ error: 'Failed to add inscription', details: error.message });
  }
});

// Get act addresses (for reference)
app.get('/api/inscriptions/addresses', async (req, res) => {
  try {
    const addresses = Object.entries(ACT_P2SH_ADDRESSES).map(([actNum, address]) => ({
      actNumber: parseInt(actNum),
      actTitle: ACT_TITLES[parseInt(actNum)] || `Act ${actNum}`,
      p2shAddress: address,
    }));

    res.json({ addresses });
  } catch (error: any) {
    logger.error('Error getting act addresses', { error: error.message });
    res.status(500).json({ error: 'Failed to get addresses', details: error.message });
  }
});

// ============================================
// INSCRIPTION SCANNER API ENDPOINTS
// ============================================

import {
  startScanner,
  stopScanner,
  triggerScan,
  getScannerStatus,
  isScannerRunning,
} from './inscription-scanner';

import {
  ShieldedScanner,
  ShieldedSubmission,
  createShieldedScanner,
} from './shielded-scanner';

// Global shielded scanner instance
let shieldedScanner: ShieldedScanner | null = null;

// Get scanner status
app.get('/api/scanner/status', (req, res) => {
  res.json(getScannerStatus());
});

// Start the background scanner
app.post('/api/scanner/start', async (req, res) => {
  try {
    if (isScannerRunning()) {
      return res.json({ success: true, message: 'Scanner already running', status: getScannerStatus() });
    }

    await startScanner();
    res.json({ success: true, message: 'Scanner started', status: getScannerStatus() });
  } catch (error: any) {
    logger.error('Error starting scanner', { error: error.message });
    res.status(500).json({ error: 'Failed to start scanner', details: error.message });
  }
});

// Stop the background scanner
app.post('/api/scanner/stop', (req, res) => {
  try {
    stopScanner();
    res.json({ success: true, message: 'Scanner stopped', status: getScannerStatus() });
  } catch (error: any) {
    logger.error('Error stopping scanner', { error: error.message });
    res.status(500).json({ error: 'Failed to stop scanner', details: error.message });
  }
});

// Manually trigger a scan
app.post('/api/scanner/trigger', async (req, res) => {
  try {
    const result = await triggerScan();
    res.json({ success: true, ...result, status: getScannerStatus() });
  } catch (error: any) {
    logger.error('Error triggering scan', { error: error.message });
    res.status(500).json({ error: 'Failed to trigger scan', details: error.message });
  }
});

// ============================================
// SHIELDED SUBMISSION SCANNER API ENDPOINTS
// ============================================

// Get shielded scanner status
app.get('/api/shielded/status', (req, res) => {
  if (!shieldedScanner) {
    return res.json({
      isRunning: false,
      message: 'Shielded scanner not initialized',
    });
  }
  res.json(shieldedScanner.getStats());
});

// Get all shielded submissions
app.get('/api/shielded/submissions', (req, res) => {
  if (!shieldedScanner) {
    return res.json({ submissions: [], total: 0 });
  }

  const actNumber = req.query.act ? parseInt(req.query.act as string) : undefined;

  let submissions: ShieldedSubmission[];
  if (actNumber) {
    submissions = shieldedScanner.getSubmissionsForAct(actNumber);
  } else {
    submissions = shieldedScanner.getSubmissions();
  }

  res.json({
    submissions,
    total: submissions.length,
    stats: shieldedScanner.getStats(),
  });
});

// Get pending submissions (no act number assigned)
app.get('/api/shielded/pending', (req, res) => {
  if (!shieldedScanner) {
    return res.json({ submissions: [], total: 0 });
  }

  const pending = shieldedScanner.getPendingSubmissions();
  res.json({
    submissions: pending,
    total: pending.length,
  });
});

// Manually trigger a shielded scan
app.post('/api/shielded/scan', async (req, res) => {
  try {
    if (!shieldedScanner) {
      // Try to initialize if not already
      const { zcashClient } = await import('./zcash-client');
      shieldedScanner = createShieldedScanner(zcashClient);
    }

    const newSubmissions = await shieldedScanner.forceScan();

    res.json({
      success: true,
      message: `Scan complete, found ${newSubmissions.length} new submissions`,
      newSubmissions,
      stats: shieldedScanner.getStats(),
    });
  } catch (error: any) {
    logger.error('Error triggering shielded scan', { error: error.message });
    res.status(500).json({ error: 'Failed to scan', details: error.message });
  }
});

// Start shielded scanner
app.post('/api/shielded/start', async (req, res) => {
  try {
    if (shieldedScanner?.isScanning()) {
      return res.json({ success: true, message: 'Scanner already running', stats: shieldedScanner.getStats() });
    }

    const { zcashClient } = await import('./zcash-client');

    if (!shieldedScanner) {
      shieldedScanner = createShieldedScanner(zcashClient);
    }

    await shieldedScanner.start();

    res.json({
      success: true,
      message: 'Shielded scanner started',
      stats: shieldedScanner.getStats(),
    });
  } catch (error: any) {
    logger.error('Error starting shielded scanner', { error: error.message });
    res.status(500).json({ error: 'Failed to start scanner', details: error.message });
  }
});

// Stop shielded scanner
app.post('/api/shielded/stop', (req, res) => {
  try {
    if (!shieldedScanner) {
      return res.json({ success: true, message: 'Scanner not running' });
    }

    shieldedScanner.stop();

    res.json({
      success: true,
      message: 'Shielded scanner stopped',
      stats: shieldedScanner.getStats(),
    });
  } catch (error: any) {
    logger.error('Error stopping shielded scanner', { error: error.message });
    res.status(500).json({ error: 'Failed to stop scanner', details: error.message });
  }
});

// Clear and rescan (resets processed txids)
app.post('/api/shielded/reset', async (req, res) => {
  try {
    if (!shieldedScanner) {
      const { zcashClient } = await import('./zcash-client');
      shieldedScanner = createShieldedScanner(zcashClient);
    }

    shieldedScanner.clearProcessed();
    const newSubmissions = await shieldedScanner.forceScan();

    res.json({
      success: true,
      message: `Reset and rescanned, found ${newSubmissions.length} submissions`,
      newSubmissions,
      stats: shieldedScanner.getStats(),
    });
  } catch (error: any) {
    logger.error('Error resetting shielded scanner', { error: error.message });
    res.status(500).json({ error: 'Failed to reset scanner', details: error.message });
  }
});

// Start API server
export function startApiServer(autoStartScanner: boolean = true) {
  app.listen(PORT, async () => {
    logger.info(`Oracle API server listening on port ${PORT}`);
    logger.info(`Admin interface available at http://localhost:${PORT}/admin`);
    logger.info(`Wallet UI available at http://localhost:${PORT}/wallet`);
    logger.info(`Inscriptions API at http://localhost:${PORT}/api/inscriptions`);
    logger.info(`Shielded submissions API at http://localhost:${PORT}/api/shielded`);

    // Auto-start the inscription scanner
    if (autoStartScanner) {
      try {
        await startScanner();
        logger.info('Inscription scanner auto-started');
      } catch (error) {
        logger.error('Failed to auto-start inscription scanner', { error });
      }
    }

    // Auto-start the shielded scanner
    try {
      const { zcashClient } = await import('./zcash-client');
      shieldedScanner = createShieldedScanner(zcashClient);
      await shieldedScanner.start();
      logger.info('Shielded submission scanner auto-started');
    } catch (error: any) {
      logger.error('Failed to auto-start shielded scanner', { error: error.message });
    }
  });
}

