/**
 * Transaction Builder Module
 * Builds inscription transactions with 44/56 public/private split
 * Part of the Proverb Revelation Protocol Oracle Swordsman
 */

import { ZcashClient, TransactionResult } from './zcash-client';
import { createInscriptionMemo, createPrivateMemo } from './memo-parser';

export interface InscriptionSpec {
  trackingCode: string;
  proverbText: string;
  taleId?: string;
  totalAmount: number;
  senderAddress?: string;
}

export interface SplitAmounts {
  public: number;
  private: number;
  fee: number;
  total: number;
  publicPercentage: number;
  privatePercentage: number;
}

export interface InscriptionResult {
  success: boolean;
  publicTxid?: string;
  privateTxid?: string;
  publicAmount?: number;
  privateAmount?: number;
  error?: string;
  timestamp: Date;
}

export interface InscriptionConfig {
  publicSplit: number;      // e.g., 0.618 for 61.8%
  privateSplit: number;     // e.g., 0.382 for 38.2%
  networkFee: number;       // e.g., 0.0001
  retryAttempts: number;
  retryDelay: number;       // milliseconds
}

/**
 * Transaction Builder
 * Handles creation of inscription transactions
 */
export class TransactionBuilder {
  private zcashClient: ZcashClient;
  private config: InscriptionConfig;
  private publicAddress?: string;
  private privateAddress?: string;

  constructor(zcashClient: ZcashClient, config?: Partial<InscriptionConfig>) {
    this.zcashClient = zcashClient;
    this.config = {
      publicSplit: config?.publicSplit || 0.44,
      privateSplit: config?.privateSplit || 0.56,
      networkFee: config?.networkFee || 0.0001,
      retryAttempts: config?.retryAttempts || 3,
      retryDelay: config?.retryDelay || 5000
    };

    // Validate splits
    const totalSplit = this.config.publicSplit + this.config.privateSplit;
    if (Math.abs(totalSplit - 1.0) > 0.001) {
      throw new Error(`Invalid split configuration: ${this.config.publicSplit} + ${this.config.privateSplit} != 1.0`);
    }
  }

  /**
   * Initialize addresses
   * 
   * publicAddress: Transparent address for spellbook inscriptions (public proof)
   * privateAddress: Shielded address for private pool transfers
   */
  async initialize(): Promise<void> {
    try {
      this.publicAddress = await this.zcashClient.getTransparentAddress();
      this.privateAddress = await this.zcashClient.getShieldedAddress();
      
      console.log(`Inscription addresses initialized:`);
      console.log(`  Public (transparent - spellbook): ${this.publicAddress}`);
      console.log(`  Private (shielded - pool): ${this.privateAddress}`);
    } catch (error: any) {
      throw new Error(`Failed to initialize addresses: ${error.message}`);
    }
  }

  /**
   * Calculate split amounts
   */
  calculateSplit(totalAmount: number): SplitAmounts {
    const publicAmount = Number((totalAmount * this.config.publicSplit).toFixed(8));
    const privateAmount = Number((totalAmount * this.config.privateSplit).toFixed(8));
    
    return {
      public: publicAmount,
      private: privateAmount,
      fee: this.config.networkFee,
      total: totalAmount,
      publicPercentage: this.config.publicSplit * 100,
      privatePercentage: this.config.privateSplit * 100
    };
  }

  /**
   * Create inscription transactions
   */
  async createInscription(spec: InscriptionSpec): Promise<InscriptionResult> {
    if (!this.publicAddress || !this.privateAddress) {
      throw new Error('Addresses not initialized. Call initialize() first.');
    }

    try {
      console.log(`Creating inscription for tracking code: ${spec.trackingCode}`);

      // Calculate split
      const split = this.calculateSplit(spec.totalAmount);
      console.log(`Split: ${split.public} ZEC public (${split.publicPercentage}%), ${split.private} ZEC private (${split.privatePercentage}%)`);

      // Create memos
      const publicMemo = createInscriptionMemo(
        spec.trackingCode,
        spec.proverbText,
        spec.taleId
      );
      const privateMemo = createPrivateMemo(spec.trackingCode);

      console.log(`Public memo length: ${publicMemo.length} chars`);
      console.log(`Private memo length: ${privateMemo.length} chars`);

      // Send public inscription
      console.log('Sending public inscription...');
      const publicResult = await this.sendWithRetry(
        this.publicAddress,
        split.public,
        publicMemo,
        'public'
      );

      if (!publicResult.success) {
        throw new Error(`Public inscription failed: ${publicResult.error}`);
      }

      console.log(`Public inscription sent: ${publicResult.txid}`);

      // Wait a moment between transactions
      await this.delay(2000);

      // Send private transaction
      console.log('Sending private transaction...');
      const privateResult = await this.sendWithRetry(
        this.privateAddress,
        split.private,
        privateMemo,
        'private'
      );

      if (!privateResult.success) {
        throw new Error(`Private transaction failed: ${privateResult.error}`);
      }

      console.log(`Private transaction sent: ${privateResult.txid}`);

      return {
        success: true,
        publicTxid: publicResult.txid,
        privateTxid: privateResult.txid,
        publicAmount: split.public,
        privateAmount: split.private,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Inscription creation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendWithRetry(
    address: string,
    amount: number,
    memo: string,
    type: 'public' | 'private'
  ): Promise<TransactionResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`${type} transaction attempt ${attempt}/${this.config.retryAttempts}`);
        
        const result = await this.zcashClient.send(address, amount, memo);
        
        if (result.success) {
          return result;
        }

        lastError = result.error || 'Unknown error';
        console.log(`Attempt ${attempt} failed: ${lastError}`);

        if (attempt < this.config.retryAttempts) {
          console.log(`Retrying in ${this.config.retryDelay / 1000} seconds...`);
          await this.delay(this.config.retryDelay);
        }

      } catch (error: any) {
        lastError = error.message;
        console.log(`Attempt ${attempt} exception: ${lastError}`);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    return {
      txid: '',
      success: false,
      error: `Failed after ${this.config.retryAttempts} attempts: ${lastError}`
    };
  }

  /**
   * Batch create inscriptions
   */
  async createInscriptionBatch(specs: InscriptionSpec[]): Promise<InscriptionResult[]> {
    const results: InscriptionResult[] = [];

    for (const spec of specs) {
      const result = await this.createInscription(spec);
      results.push(result);

      // Delay between inscriptions
      if (specs.indexOf(spec) < specs.length - 1) {
        await this.delay(5000);
      }
    }

    return results;
  }

  /**
   * Validate inscription specification
   */
  validateSpec(spec: InscriptionSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate tracking code
    if (!spec.trackingCode || spec.trackingCode.length < 6) {
      errors.push('Tracking code must be at least 6 characters');
    }

    // Validate proverb text
    if (!spec.proverbText || spec.proverbText.trim().length < 10) {
      errors.push('Proverb text must be at least 10 characters');
    }

    if (spec.proverbText && spec.proverbText.length > 500) {
      errors.push('Proverb text must be less than 500 characters');
    }

    // Validate amount
    if (spec.totalAmount <= 0) {
      errors.push('Total amount must be positive');
    }

    if (spec.totalAmount < 0.001) {
      errors.push('Total amount too small (minimum 0.001 ZEC)');
    }

    // Check memo size (Zcash limit is 512 bytes)
    const publicMemo = createInscriptionMemo(
      spec.trackingCode,
      spec.proverbText,
      spec.taleId
    );

    if (publicMemo.length > 512) {
      errors.push(`Public memo too long: ${publicMemo.length} bytes (maximum 512)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate inscription cost
   */
  estimateCost(proverbText: string): {
    publicAmount: number;
    privateAmount: number;
    totalAmount: number;
    fees: number;
  } {
    // Base cost from environment or default
    const baseCost = parseFloat(process.env.PROVERB_COST || '0.01');
    const split = this.calculateSplit(baseCost);

    return {
      publicAmount: split.public,
      privateAmount: split.private,
      totalAmount: baseCost,
      fees: this.config.networkFee * 2  // Two transactions
    };
  }

  /**
   * Get configuration
   */
  getConfig(): InscriptionConfig {
    return { ...this.config };
  }

  /**
   * Get addresses
   */
  getAddresses(): { public?: string; private?: string } {
    return {
      public: this.publicAddress,
      private: this.privateAddress
    };
  }

  /**
   * Verify inscription on blockchain
   */
  async verifyInscription(txid: string): Promise<{
    confirmed: boolean;
    confirmations: number;
    memo?: string;
  }> {
    try {
      const transactions = await this.zcashClient.listTransactions(100);
      const tx = transactions.find(t => t.txid === txid);

      if (!tx) {
        return {
          confirmed: false,
          confirmations: 0
        };
      }

      return {
        confirmed: tx.confirmations >= 1,
        confirmations: tx.confirmations,
        memo: tx.memo
      };
    } catch (error) {
      return {
        confirmed: false,
        confirmations: 0
      };
    }
  }

  /**
   * Test inscription creation (dry run)
   */
  async testInscription(spec: InscriptionSpec): Promise<{
    valid: boolean;
    split: SplitAmounts;
    memoSizes: { public: number; private: number };
    errors: string[];
  }> {
    const validation = this.validateSpec(spec);
    const split = this.calculateSplit(spec.totalAmount);
    
    const publicMemo = createInscriptionMemo(
      spec.trackingCode,
      spec.proverbText,
      spec.taleId
    );
    const privateMemo = createPrivateMemo(spec.trackingCode);

    return {
      valid: validation.valid,
      split,
      memoSizes: {
        public: publicMemo.length,
        private: privateMemo.length
      },
      errors: validation.errors
    };
  }

  /**
   * Utility: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create transaction builder from environment
 */
export function createTransactionBuilder(zcashClient: ZcashClient): TransactionBuilder {
  const config: Partial<InscriptionConfig> = {
    publicSplit: parseFloat(process.env.PUBLIC_SPLIT || '0.618'),
    privateSplit: parseFloat(process.env.PRIVATE_SPLIT || '0.382'),
    networkFee: parseFloat(process.env.NETWORK_FEE || '0.0001'),
    retryAttempts: parseInt(process.env.ORACLE_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.ORACLE_RETRY_DELAY || '5') * 1000
  };

  return new TransactionBuilder(zcashClient, config);
}

/**
 * Helper: Format inscription result for logging
 */
export function formatInscriptionResult(result: InscriptionResult): string {
  if (!result.success) {
    return `FAILED: ${result.error}`;
  }

  return `SUCCESS: Public=${result.publicTxid} (${result.publicAmount} ZEC), Private=${result.privateTxid} (${result.privateAmount} ZEC)`;
}

/**
 * Helper: Calculate optimal batch size
 */
export function calculateOptimalBatchSize(
  availableBalance: number,
  proverbCost: number = 0.01
): number {
  // Reserve some balance for fees
  const reserveAmount = 0.01;
  const usableBalance = availableBalance - reserveAmount;
  
  if (usableBalance <= 0) {
    return 0;
  }

  return Math.floor(usableBalance / proverbCost);
}

/**
 * Statistics tracker for inscriptions
 */
export class InscriptionStats {
  private totalAttempts: number = 0;
  private successfulInscriptions: number = 0;
  private failedInscriptions: number = 0;
  private totalPublicAmount: number = 0;
  private totalPrivateAmount: number = 0;

  recordAttempt(): void {
    this.totalAttempts++;
  }

  recordSuccess(publicAmount: number, privateAmount: number): void {
    this.successfulInscriptions++;
    this.totalPublicAmount += publicAmount;
    this.totalPrivateAmount += privateAmount;
  }

  recordFailure(): void {
    this.failedInscriptions++;
  }

  getStats() {
    return {
      totalAttempts: this.totalAttempts,
      successful: this.successfulInscriptions,
      failed: this.failedInscriptions,
      successRate: this.totalAttempts > 0 
        ? (this.successfulInscriptions / this.totalAttempts) * 100 
        : 0,
      totalPublicAmount: this.totalPublicAmount,
      totalPrivateAmount: this.totalPrivateAmount,
      totalAmount: this.totalPublicAmount + this.totalPrivateAmount
    };
  }

  reset(): void {
    this.totalAttempts = 0;
    this.successfulInscriptions = 0;
    this.failedInscriptions = 0;
    this.totalPublicAmount = 0;
    this.totalPrivateAmount = 0;
  }
}
