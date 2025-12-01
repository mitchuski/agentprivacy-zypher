/**
 * Shielded Submission Scanner
 *
 * Scans for incoming shielded proverb submissions using z_listunspent
 * This works with Zallet which doesn't support listtransactions
 *
 * Flow:
 * 1. User sends shielded tx to oracle's u-address with proverb memo
 * 2. Scanner detects note via z_listunspent
 * 3. Scanner parses memo for proverb submission format
 * 4. Valid submissions are emitted for processing
 */

import { EventEmitter } from 'events';
import logger from './logger';

export interface ShieldedNote {
  txid: string;
  pool: string;  // 'sapling' or 'orchard'
  amount: number;
  address: string;
  confirmations: number;
  memo: string | null;
  blockheight?: number;
  account_uuid?: string;
}

export interface ShieldedSubmission {
  txid: string;
  amount: number;
  confirmations: number;
  memo: string;
  memoText: string;
  actNumber: number | null;
  proverb: string | null;
  emojiSpell: string | null;
  rawNote: ShieldedNote;
}

export interface ShieldedScannerConfig {
  pollInterval: number;      // ms between scans
  minConfirmations: number;  // required confirmations
  minAmount: number;         // minimum amount (0.01 ZEC)
  maxAmount: number;         // maximum amount to consider
}

/**
 * Parse memo hex to text
 */
function parseMemoHex(memoHex: string): string | null {
  if (!memoHex) return null;

  try {
    const buf = Buffer.from(memoHex, 'hex');

    // Remove trailing zeros
    let end = buf.length;
    while (end > 0 && buf[end - 1] === 0) end--;

    // Check if it's empty or starts with 0xf6 (empty memo marker)
    if (end === 0 || buf[0] === 0xf6) return null;

    return buf.slice(0, end).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Parse proverb submission from memo text
 * Expected formats:
 * - "ACT:7|PROVERB:The wise mage..."
 * - "ACT7|The wise mage..."
 * - Just the proverb text for simple submissions
 */
function parseSubmissionMemo(memoText: string): {
  actNumber: number | null;
  proverb: string | null;
  emojiSpell: string | null;
} {
  // Try structured format: ACT:N|PROVERB:...
  const structuredMatch = memoText.match(/ACT:(\d+)\|(?:PROVERB:)?(.+)/i);
  if (structuredMatch) {
    const actNumber = parseInt(structuredMatch[1], 10);
    const rest = structuredMatch[2];

    // Check for emoji spell prefix (E:...)
    const emojiMatch = rest.match(/^E:([^\|]+)\|(.+)/);
    if (emojiMatch) {
      return {
        actNumber,
        emojiSpell: emojiMatch[1].trim(),
        proverb: emojiMatch[2].trim()
      };
    }

    return {
      actNumber,
      proverb: rest.trim(),
      emojiSpell: null
    };
  }

  // Try compact format: ACTN|...
  const compactMatch = memoText.match(/ACT(\d+)\|(.+)/i);
  if (compactMatch) {
    return {
      actNumber: parseInt(compactMatch[1], 10),
      proverb: compactMatch[2].trim(),
      emojiSpell: null
    };
  }

  // Plain proverb text (no act specified)
  if (memoText.length > 10 && memoText.length < 512) {
    return {
      actNumber: null,
      proverb: memoText.trim(),
      emojiSpell: null
    };
  }

  return {
    actNumber: null,
    proverb: null,
    emojiSpell: null
  };
}

/**
 * Shielded Submission Scanner
 */
export class ShieldedScanner extends EventEmitter {
  private zcashClient: any;  // ZcashClient
  private config: ShieldedScannerConfig;
  private isRunning: boolean = false;
  private pollInterval?: NodeJS.Timeout;
  private processedTxids: Set<string> = new Set();
  private submissions: ShieldedSubmission[] = [];

  constructor(zcashClient: any, config?: Partial<ShieldedScannerConfig>) {
    super();
    this.zcashClient = zcashClient;
    this.config = {
      pollInterval: config?.pollInterval || 30000,  // 30 seconds
      minConfirmations: config?.minConfirmations || 1,
      minAmount: config?.minAmount || 0.005,   // Accept >= 0.005 ZEC
      maxAmount: config?.maxAmount || 0.1      // Accept <= 0.1 ZEC
    };
  }

  /**
   * Start scanning
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Shielded scanner already running');
      return;
    }

    logger.info('Starting shielded submission scanner', {
      pollInterval: this.config.pollInterval,
      minConfirmations: this.config.minConfirmations,
      minAmount: this.config.minAmount
    });

    this.isRunning = true;

    // Initial scan
    await this.scan();

    // Start polling
    this.pollInterval = setInterval(async () => {
      try {
        await this.scan();
      } catch (error: any) {
        logger.error('Shielded scan error', { error: error.message });
        this.emit('error', error);
      }
    }, this.config.pollInterval);

    this.emit('started');
    logger.info('Shielded scanner started');
  }

  /**
   * Stop scanning
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.isRunning = false;
    this.emit('stopped');
    logger.info('Shielded scanner stopped');
  }

  /**
   * Perform a scan using z_listunspent
   */
  async scan(): Promise<ShieldedSubmission[]> {
    const newSubmissions: ShieldedSubmission[] = [];

    try {
      // Get all unspent shielded notes (minconf, maxconf)
      const notes = await this.zcashClient.execZalletCommand(
        'z_listunspent',
        0,        // minconf - include unconfirmed
        9999999   // maxconf
      ) as any[];

      if (!notes || !Array.isArray(notes)) {
        logger.debug('No notes returned from z_listunspent');
        return [];
      }

      logger.debug('Scanning shielded notes', { count: notes.length });

      for (const note of notes) {
        // Skip already processed
        if (this.processedTxids.has(note.txid)) {
          continue;
        }

        // Check confirmations
        if (note.confirmations < this.config.minConfirmations) {
          continue;
        }

        // Check amount range
        const amount = parseFloat(note.amount) || note.value || 0;
        if (amount < this.config.minAmount || amount > this.config.maxAmount) {
          continue;
        }

        // Parse memo
        const memoText = parseMemoHex(note.memo);
        if (!memoText) {
          // Mark as processed even without memo
          this.processedTxids.add(note.txid);
          continue;
        }

        // Parse submission data
        const parsed = parseSubmissionMemo(memoText);

        // Create submission record
        const submission: ShieldedSubmission = {
          txid: note.txid,
          amount,
          confirmations: note.confirmations,
          memo: note.memo,
          memoText,
          actNumber: parsed.actNumber,
          proverb: parsed.proverb,
          emojiSpell: parsed.emojiSpell,
          rawNote: {
            txid: note.txid,
            pool: note.pool || 'sapling',
            amount,
            address: note.address,
            confirmations: note.confirmations,
            memo: note.memo,
            blockheight: note.blockheight,
            account_uuid: note.account_uuid
          }
        };

        // Mark as processed
        this.processedTxids.add(note.txid);

        // Store and emit
        this.submissions.push(submission);
        newSubmissions.push(submission);

        logger.info('Shielded submission found', {
          txid: note.txid,
          amount,
          actNumber: parsed.actNumber,
          proverb: parsed.proverb?.substring(0, 50) + '...',
          confirmations: note.confirmations
        });

        this.emit('submission', submission);
      }

      if (newSubmissions.length > 0) {
        this.emit('submissions', newSubmissions);
      }

    } catch (error: any) {
      logger.error('Shielded scan failed', { error: error.message });
      throw error;
    }

    return newSubmissions;
  }

  /**
   * Get all detected submissions
   */
  getSubmissions(): ShieldedSubmission[] {
    return [...this.submissions];
  }

  /**
   * Get submissions for a specific act
   */
  getSubmissionsForAct(actNumber: number): ShieldedSubmission[] {
    return this.submissions.filter(s => s.actNumber === actNumber);
  }

  /**
   * Get pending submissions (ones without act number that need manual assignment)
   */
  getPendingSubmissions(): ShieldedSubmission[] {
    return this.submissions.filter(s => s.actNumber === null && s.proverb);
  }

  /**
   * Clear processed txids (for reprocessing)
   */
  clearProcessed(): void {
    this.processedTxids.clear();
    this.submissions = [];
  }

  /**
   * Check if running
   */
  isScanning(): boolean {
    return this.isRunning;
  }

  /**
   * Force an immediate scan
   */
  async forceScan(): Promise<ShieldedSubmission[]> {
    return this.scan();
  }

  /**
   * Get stats
   */
  getStats(): {
    isRunning: boolean;
    totalProcessed: number;
    totalSubmissions: number;
    pendingCount: number;
  } {
    return {
      isRunning: this.isRunning,
      totalProcessed: this.processedTxids.size,
      totalSubmissions: this.submissions.length,
      pendingCount: this.getPendingSubmissions().length
    };
  }
}

/**
 * Create shielded scanner from config
 */
export function createShieldedScanner(
  zcashClient: any,
  customConfig?: Partial<ShieldedScannerConfig>
): ShieldedScanner {
  const config: Partial<ShieldedScannerConfig> = {
    pollInterval: parseInt(process.env.SHIELDED_SCAN_INTERVAL || '30') * 1000,
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1'),
    minAmount: parseFloat(process.env.PROVERB_COST || '0.01') * 0.9,  // Allow 10% tolerance
    maxAmount: 0.1,
    ...customConfig
  };

  return new ShieldedScanner(zcashClient, config);
}
