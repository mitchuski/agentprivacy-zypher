import { Pool, QueryResult } from 'pg';
import { config } from './config';
import logger from './logger';

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Database connection error:', err);
});

export interface Submission {
  id: number;
  tracking_code: string;
  sender_address: string;
  proverb_text: string;
  amount_zec: number;
  txid: string;
  status: string;
  memo_text?: string;
  received_at: Date;
  created_at: Date;
}

export interface Verification {
  id: number;
  submission_id: number;
  ai_provider: string;
  quality_score: number;
  matched_act: string;
  reasoning: string;
  verified_at: Date;
  status: string;
}

export interface Inscription {
  id: number;
  submission_id: number;
  public_txid: string;
  private_txid: string;
  public_amount: number;
  private_amount: number;
  network_fee: number;
  inscribed_at: Date;
  block_height?: number;
  status: string;
}

export const db = {
  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  },

  // Create submission
  async createSubmission(data: {
    tracking_code: string;
    sender_address: string;
    proverb_text: string;
    amount_zec: number;
    txid: string;
    memo_text?: string;
  }): Promise<Submission> {
    const result = await pool.query<Submission>(
      `INSERT INTO submissions 
       (tracking_code, sender_address, proverb_text, amount_zec, txid, memo_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [
        data.tracking_code,
        data.sender_address,
        data.proverb_text,
        data.amount_zec,
        data.txid,
        data.memo_text || null,
      ]
    );
    logger.info('Created submission', { id: result.rows[0].id, tracking_code: data.tracking_code });
    return result.rows[0];
  },

  // Get pending submissions
  async getPendingSubmissions(): Promise<Submission[]> {
    const result = await pool.query<Submission>(
      `SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at ASC`
    );
    return result.rows;
  },

  // Update submission status
  async updateSubmissionStatus(id: number, status: string): Promise<void> {
    await pool.query(
      `UPDATE submissions SET status = $1 WHERE id = $2`,
      [status, id]
    );
    logger.info('Updated submission status', { id, status });
  },

  // Create verification
  async createVerification(data: {
    submission_id: number;
    ai_provider: string;
    quality_score: number;
    matched_act: string;
    reasoning: string;
  }): Promise<Verification> {
    const result = await pool.query<Verification>(
      `INSERT INTO verifications 
       (submission_id, ai_provider, quality_score, matched_act, reasoning)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.submission_id,
        data.ai_provider,
        data.quality_score,
        data.matched_act,
        data.reasoning,
      ]
    );
    logger.info('Created verification', { 
      id: result.rows[0].id, 
      submission_id: data.submission_id,
      quality_score: data.quality_score 
    });
    return result.rows[0];
  },

  // Create inscription
  async createInscription(data: {
    submission_id: number;
    public_txid: string;
    private_txid: string;
    public_amount: number;
    private_amount: number;
    network_fee: number;
  }): Promise<Inscription> {
    const result = await pool.query<Inscription>(
      `INSERT INTO inscriptions 
       (submission_id, public_txid, private_txid, public_amount, private_amount, network_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.submission_id,
        data.public_txid,
        data.private_txid,
        data.public_amount,
        data.private_amount,
        data.network_fee,
      ]
    );
    logger.info('Created inscription', { 
      id: result.rows[0].id, 
      submission_id: data.submission_id,
      public_txid: data.public_txid 
    });
    return result.rows[0];
  },

  // Get submission by tracking code
  async getSubmissionByTrackingCode(code: string): Promise<Submission | null> {
    const result = await pool.query<Submission>(
      `SELECT * FROM submissions WHERE tracking_code = $1`,
      [code]
    );
    return result.rows[0] || null;
  },

  // Get verification for submission
  async getVerification(submissionId: number): Promise<Verification | null> {
    const result = await pool.query<Verification>(
      `SELECT * FROM verifications WHERE submission_id = $1`,
      [submissionId]
    );
    return result.rows[0] || null;
  },

  // Get submissions with filters
  async getSubmissions(limit: number = 50, offset: number = 0, status?: string): Promise<Submission[]> {
    let query = `SELECT * FROM submissions`;
    const params: any[] = [];
    
    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }
    
    const result = await pool.query<Submission>(query, params);
    return result.rows;
  },

  // Get stats
  async getStats(): Promise<any> {
    const result = await pool.query(`SELECT * FROM proverb_stats`);
    return result.rows[0] || {
      total_submissions: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      avg_quality_score: null,
      total_zec_received: 0,
    };
  },

  // Close pool
  async close(): Promise<void> {
    await pool.end();
    logger.info('Database connection pool closed');
  },
};

