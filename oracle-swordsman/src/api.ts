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
const adminPath = path.join(process.cwd(), 'oracle-swordsman', 'admin');
app.use('/admin', express.static(adminPath));

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
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const idResult = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (idResult.rows.length > 0) {
      submission = idResult.rows[0];
    } else {
      submission = await db.getSubmissionByTrackingCode(req.params.id);
    }
    await pool.end();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const verification = await db.getVerification(submission.id);
    
    // Try to get inscription if exists
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const inscriptionResult = await pool.query(
      'SELECT * FROM inscriptions WHERE submission_id = $1',
      [submission.id]
    );
    await pool.end();

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

// Start API server
export function startApiServer() {
  app.listen(PORT, () => {
    logger.info(`Oracle API server listening on port ${PORT}`);
    logger.info(`Admin interface available at http://localhost:${PORT}/admin`);
  });
}

