/**
 * Transaction Monitor Module
 * Monitors Zcash blockchain for new proverb submissions
 * Part of the Proverb Revelation Protocol Oracle Swordsman
 */

import { EventEmitter } from 'events';
import { ZcashClient, Transaction } from './zcash-client';
import { parseMemo, extractSubmissionData, SubmissionData, looksLikeSubmission } from './memo-parser';

export interface MonitorConfig {
  pollInterval: number;        // milliseconds between checks
  minConfirmations: number;    // minimum confirmations required
  requiredAmount: number;      // exact amount required (e.g., 0.01 ZEC)
  amountTolerance: number;     // tolerance for amount (e.g., 0.0001 ZEC)
  maxTransactionsPerPoll: number;
}

export interface NewSubmission {
  txid: string;
  senderAddress: string;
  amount: number;
  confirmations: number;
  blockHeight?: number;
  timestamp?: number;
  submissionData: SubmissionData;
  rawMemo: string;
}

export interface MonitorStats {
  totalChecks: number;
  newSubmissionsFound: number;
  invalidSubmissions: number;
  lastCheckTime: Date;
  currentHeight: number;
  isRunning: boolean;
}

/**
 * Transaction Monitor
 * Emits events when new valid submissions are detected
 */
export class TransactionMonitor extends EventEmitter {
  private zcashClient: ZcashClient;
  private config: MonitorConfig;
  private isRunning: boolean = false;
  private pollInterval?: NodeJS.Timeout;
  private lastProcessedHeight: number = 0;
  private processedTxids: Set<string> = new Set();
  private stats: MonitorStats;

  constructor(zcashClient: ZcashClient, config?: Partial<MonitorConfig>) {
    super();
    this.zcashClient = zcashClient;
    this.config = {
      pollInterval: config?.pollInterval || 30000,  // 30 seconds
      minConfirmations: config?.minConfirmations || 1,
      requiredAmount: config?.requiredAmount || 0.01,
      amountTolerance: config?.amountTolerance || 0.0001,
      maxTransactionsPerPoll: config?.maxTransactionsPerPoll || 100
    };

    this.stats = {
      totalChecks: 0,
      newSubmissionsFound: 0,
      invalidSubmissions: 0,
      lastCheckTime: new Date(),
      currentHeight: 0,
      isRunning: false
    };
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    console.log('Starting transaction monitor...');
    this.isRunning = true;
    this.stats.isRunning = true;

    // Get current height
    this.lastProcessedHeight = this.zcashClient.getCurrentHeight();
    this.stats.currentHeight = this.lastProcessedHeight;

    // Initial check
    await this.checkForNewSubmissions();

    // Start polling
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForNewSubmissions();
      } catch (error) {
        console.error('Error checking for new submissions:', error);
        this.emit('error', error);
      }
    }, this.config.pollInterval);

    this.emit('started');
    console.log(`Monitor started. Checking every ${this.config.pollInterval / 1000} seconds`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Monitor is not running');
      return;
    }

    console.log('Stopping transaction monitor...');
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.isRunning = false;
    this.stats.isRunning = false;
    this.emit('stopped');
    console.log('Monitor stopped');
  }

  /**
   * Check for new submissions
   */
  private async checkForNewSubmissions(): Promise<void> {
    this.stats.totalChecks++;
    this.stats.lastCheckTime = new Date();

    try {
      // Get recent transactions
      const transactions = await this.zcashClient.getNewSubmissions(
        this.lastProcessedHeight
      );

      // Update current height
      const currentHeight = this.zcashClient.getCurrentHeight();
      if (currentHeight > this.lastProcessedHeight) {
        this.lastProcessedHeight = currentHeight;
        this.stats.currentHeight = currentHeight;
      }

      // Filter and process transactions
      const validSubmissions: NewSubmission[] = [];

      for (const tx of transactions) {
        // Skip if already processed
        if (this.processedTxids.has(tx.txid)) {
          continue;
        }

        // Mark as processed
        this.processedTxids.add(tx.txid);

        // Validate transaction
        const validation = this.validateTransaction(tx);
        if (!validation.valid) {
          console.log(`Invalid submission: ${tx.txid} - ${validation.reason}`);
          this.stats.invalidSubmissions++;
          this.emit('invalidSubmission', {
            txid: tx.txid,
            reason: validation.reason,
            transaction: tx
          });
          continue;
        }

        // Parse memo
        const parsed = parseMemo(tx.memo!);
        if (!parsed.valid) {
          console.log(`Invalid memo format: ${tx.txid} - ${parsed.error}`);
          this.stats.invalidSubmissions++;
          this.emit('invalidSubmission', {
            txid: tx.txid,
            reason: parsed.error,
            transaction: tx
          });
          continue;
        }

        // Extract submission data
        const submissionData = extractSubmissionData(parsed);
        if (!submissionData) {
          console.log(`Failed to extract submission data: ${tx.txid}`);
          this.stats.invalidSubmissions++;
          continue;
        }

        // Create new submission object
        const newSubmission: NewSubmission = {
          txid: tx.txid,
          senderAddress: tx.address,
          amount: tx.amount,
          confirmations: tx.confirmations,
          blockHeight: tx.blockheight,
          timestamp: tx.timestamp,
          submissionData,
          rawMemo: tx.memo!
        };

        validSubmissions.push(newSubmission);
        this.stats.newSubmissionsFound++;

        console.log(`New submission found: ${newSubmission.submissionData.trackingCode}`);
      }

      // Emit new submissions
      if (validSubmissions.length > 0) {
        this.emit('newSubmissions', validSubmissions);
        
        // Emit individual events
        for (const submission of validSubmissions) {
          this.emit('newSubmission', submission);
        }
      }

      // Cleanup old processed txids (keep last 1000)
      if (this.processedTxids.size > 1000) {
        const txidsArray = Array.from(this.processedTxids);
        this.processedTxids = new Set(txidsArray.slice(-1000));
      }

    } catch (error: any) {
      console.error('Error in checkForNewSubmissions:', error);
      throw error;
    }
  }

  /**
   * Validate transaction meets requirements
   */
  private validateTransaction(tx: Transaction): { valid: boolean; reason?: string } {
    // Check confirmations
    if (tx.confirmations < this.config.minConfirmations) {
      return {
        valid: false,
        reason: `Insufficient confirmations: ${tx.confirmations} < ${this.config.minConfirmations}`
      };
    }

    // Check amount
    const amountDiff = Math.abs(tx.amount - this.config.requiredAmount);
    if (amountDiff > this.config.amountTolerance) {
      return {
        valid: false,
        reason: `Incorrect amount: ${tx.amount} (expected ${this.config.requiredAmount} ± ${this.config.amountTolerance})`
      };
    }

    // Check memo exists
    if (!tx.memo || tx.memo.trim().length === 0) {
      return {
        valid: false,
        reason: 'No memo found'
      };
    }

    // Check memo looks like submission
    if (!looksLikeSubmission(tx.memo)) {
      return {
        valid: false,
        reason: 'Memo does not look like a proverb submission'
      };
    }

    return { valid: true };
  }

  /**
   * Get monitor statistics
   */
  getStats(): MonitorStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.totalChecks = 0;
    this.stats.newSubmissionsFound = 0;
    this.stats.invalidSubmissions = 0;
  }

  /**
   * Get list of processed transaction IDs
   */
  getProcessedTxids(): string[] {
    return Array.from(this.processedTxids);
  }

  /**
   * Manually check a specific transaction
   */
  async checkTransaction(txid: string): Promise<NewSubmission | null> {
    try {
      const transactions = await this.zcashClient.listTransactions(100);
      const tx = transactions.find(t => t.txid === txid);

      if (!tx) {
        return null;
      }

      const validation = this.validateTransaction(tx);
      if (!validation.valid) {
        return null;
      }

      const parsed = parseMemo(tx.memo!);
      if (!parsed.valid) {
        return null;
      }

      const submissionData = extractSubmissionData(parsed);
      if (!submissionData) {
        return null;
      }

      return {
        txid: tx.txid,
        senderAddress: tx.address,
        amount: tx.amount,
        confirmations: tx.confirmations,
        blockHeight: tx.blockheight,
        timestamp: tx.timestamp,
        submissionData,
        rawMemo: tx.memo!
      };
    } catch (error) {
      console.error(`Error checking transaction ${txid}:`, error);
      return null;
    }
  }

  /**
   * Check if running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * Get current poll interval
   */
  getPollInterval(): number {
    return this.config.pollInterval;
  }

  /**
   * Update poll interval
   */
  setPollInterval(milliseconds: number): void {
    this.config.pollInterval = milliseconds;
    
    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Get processed transaction count
   */
  getProcessedCount(): number {
    return this.processedTxids.size;
  }
}

/**
 * Create transaction monitor from environment
 */
export function createTransactionMonitor(
  zcashClient: ZcashClient,
  customConfig?: Partial<MonitorConfig>
): TransactionMonitor {
  const config: Partial<MonitorConfig> = {
    pollInterval: parseInt(process.env.ORACLE_CHECK_INTERVAL || '30') * 1000,
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1'),
    requiredAmount: parseFloat(process.env.PROVERB_COST || '0.01'),
    amountTolerance: 0.0001,
    maxTransactionsPerPoll: 100,
    ...customConfig
  };

  return new TransactionMonitor(zcashClient, config);
}

/**
 * Event types for TypeScript
 */
export interface TransactionMonitorEvents {
  started: () => void;
  stopped: () => void;
  newSubmission: (submission: NewSubmission) => void;
  newSubmissions: (submissions: NewSubmission[]) => void;
  invalidSubmission: (info: { txid: string; reason?: string; transaction: Transaction }) => void;
  error: (error: Error) => void;
}

// Event emitter interface is already handled by extending EventEmitter
// No need for separate declare interface - it conflicts with the class
