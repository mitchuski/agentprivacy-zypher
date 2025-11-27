/**
 * Zcash Utilities Module
 * Helper functions for Zcash operations in the Proverb Revelation Protocol
 */

import * as crypto from 'crypto';

/**
 * Address Utilities
 */
export const AddressUtils = {
  /**
   * Check if address is transparent
   */
  isTransparent(address: string): boolean {
    return address.startsWith('t');
  },

  /**
   * Check if address is shielded
   */
  isShielded(address: string): boolean {
    return address.startsWith('z');
  },

  /**
   * Get address type
   */
  getType(address: string): 'transparent' | 'shielded' | 'unknown' {
    if (this.isTransparent(address)) return 'transparent';
    if (this.isShielded(address)) return 'shielded';
    return 'unknown';
  },

  /**
   * Validate address format
   */
  validate(address: string): { valid: boolean; type?: string; network?: string } {
    // Transparent testnet (tm*)
    if (/^tm[a-zA-Z0-9]{33}$/.test(address)) {
      return { valid: true, type: 'transparent', network: 'testnet' };
    }

    // Transparent mainnet (t1*)
    if (/^t1[a-zA-Z0-9]{33}$/.test(address)) {
      return { valid: true, type: 'transparent', network: 'mainnet' };
    }

    // Shielded Sapling (zs*)
    if (/^zs[a-z0-9]{76}$/.test(address)) {
      return { valid: true, type: 'shielded', network: 'both' };
    }

    return { valid: false };
  },

  /**
   * Mask address for logging (show first/last 6 chars)
   */
  mask(address: string): string {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  },

  /**
   * Compare addresses (case-insensitive)
   */
  equals(addr1: string, addr2: string): boolean {
    return addr1.toLowerCase() === addr2.toLowerCase();
  }
};

/**
 * Amount Utilities
 */
export const AmountUtils = {
  /**
   * Format ZEC amount with proper precision
   */
  format(amount: number, decimals: number = 8): string {
    return amount.toFixed(decimals);
  },

  /**
   * Format ZEC amount with ZEC suffix
   */
  formatWithUnit(amount: number, decimals: number = 8): string {
    return `${this.format(amount, decimals)} ZEC`;
  },

  /**
   * Parse ZEC amount from string
   */
  parse(amountStr: string): number {
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  },

  /**
   * Convert ZEC to zatoshis
   */
  toZatoshis(zec: number): bigint {
    return BigInt(Math.round(zec * 100000000));
  },

  /**
   * Convert zatoshis to ZEC
   */
  fromZatoshis(zatoshis: bigint): number {
    return Number(zatoshis) / 100000000;
  },

  /**
   * Round to 8 decimal places (ZEC precision)
   */
  round(amount: number): number {
    return Math.round(amount * 100000000) / 100000000;
  },

  /**
   * Check if amounts are equal (within tolerance)
   */
  equals(amount1: number, amount2: number, tolerance: number = 0.00000001): boolean {
    return Math.abs(amount1 - amount2) <= tolerance;
  },

  /**
   * Calculate percentage of total
   */
  percentage(amount: number, total: number): number {
    return total > 0 ? (amount / total) * 100 : 0;
  },

  /**
   * Validate amount range
   */
  validate(amount: number, min: number = 0, max: number = 21000000): boolean {
    return amount >= min && amount <= max && !isNaN(amount) && isFinite(amount);
  }
};

/**
 * Memo Utilities
 */
export const MemoUtils = {
  /**
   * Calculate memo size in bytes
   */
  byteSize(memo: string): number {
    return Buffer.from(memo, 'utf8').length;
  },

  /**
   * Check if memo fits within Zcash limit (512 bytes)
   */
  fitsLimit(memo: string, limit: number = 512): boolean {
    return this.byteSize(memo) <= limit;
  },

  /**
   * Truncate memo to fit limit
   */
  truncate(memo: string, limit: number = 512): string {
    if (this.fitsLimit(memo, limit)) {
      return memo;
    }

    let truncated = memo;
    while (this.byteSize(truncated) > limit) {
      truncated = truncated.substring(0, truncated.length - 1);
    }

    return truncated;
  },

  /**
   * Sanitize memo (remove control characters)
   */
  sanitize(memo: string): string {
    return memo
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  },

  /**
   * Encode memo for transaction
   */
  encode(memo: string): string {
    return Buffer.from(memo, 'utf8').toString('hex');
  },

  /**
   * Decode memo from transaction
   */
  decode(hexMemo: string): string {
    return Buffer.from(hexMemo, 'hex').toString('utf8');
  },

  /**
   * Extract JSON from memo (if present)
   */
  extractJSON(memo: string): any | null {
    try {
      const jsonMatch = memo.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
};

/**
 * Transaction Utilities
 */
export const TransactionUtils = {
  /**
   * Validate transaction ID format
   */
  validateTxid(txid: string): boolean {
    return /^[a-f0-9]{64}$/.test(txid);
  },

  /**
   * Mask txid for logging
   */
  maskTxid(txid: string): string {
    if (txid.length !== 64) return txid;
    return `${txid.substring(0, 8)}...${txid.substring(56)}`;
  },

  /**
   * Get block explorer URL
   */
  getExplorerUrl(txid: string, network: 'mainnet' | 'testnet' = 'testnet'): string {
    if (network === 'mainnet') {
      return `https://explorer.zcha.in/transactions/${txid}`;
    }
    return `https://explorer.testnet.z.cash/tx/${txid}`;
  },

  /**
   * Calculate estimated confirmation time
   */
  estimateConfirmationTime(confirmations: number, targetConf: number = 1): {
    minutes: number;
    seconds: number;
  } {
    const blocksRemaining = Math.max(0, targetConf - confirmations);
    const minutesPerBlock = 2.5; // Zcash average block time
    const totalMinutes = blocksRemaining * minutesPerBlock;

    return {
      minutes: Math.floor(totalMinutes),
      seconds: Math.round((totalMinutes % 1) * 60)
    };
  },

  /**
   * Check if transaction is confirmed
   */
  isConfirmed(confirmations: number, requiredConf: number = 1): boolean {
    return confirmations >= requiredConf;
  },

  /**
   * Get confirmation status
   */
  getConfirmationStatus(confirmations: number): 'unconfirmed' | 'pending' | 'confirmed' | 'final' {
    if (confirmations === 0) return 'unconfirmed';
    if (confirmations < 3) return 'pending';
    if (confirmations < 10) return 'confirmed';
    return 'final';
  }
};

/**
 * Tracking Code Utilities
 */
export const TrackingCodeUtils = {
  /**
   * Generate random tracking code
   */
  generate(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    
    return code;
  },

  /**
   * Generate tracking code from tale ID and timestamp
   */
  fromTaleId(taleId: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    
    // Extract tale prefix
    const prefix = taleId
      .replace(/^tale-\d+-/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 6);
    
    // Generate timestamp suffix
    const suffix = (ts % 1679616).toString(36).toUpperCase().padStart(4, '0');
    
    return `${prefix}${suffix}`;
  },

  /**
   * Validate tracking code format
   */
  validate(code: string): boolean {
    return /^[A-Z0-9]{6,12}$/.test(code);
  },

  /**
   * Generate checksum for tracking code
   */
  checksum(code: string): string {
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    return hash.substring(0, 4).toUpperCase();
  },

  /**
   * Add checksum to tracking code
   */
  addChecksum(code: string): string {
    return `${code}-${this.checksum(code)}`;
  },

  /**
   * Verify tracking code with checksum
   */
  verifyChecksum(codeWithChecksum: string): boolean {
    const parts = codeWithChecksum.split('-');
    if (parts.length !== 2) return false;
    
    const code = parts[0];
    const providedChecksum = parts[1];
    const calculatedChecksum = this.checksum(code);
    
    return providedChecksum === calculatedChecksum;
  }
};

/**
 * Time Utilities
 */
export const TimeUtils = {
  /**
   * Format timestamp for display
   */
  format(timestamp: number, includeTime: boolean = true): string {
    const date = new Date(timestamp);
    
    if (includeTime) {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    }
    
    return date.toISOString().substring(0, 10);
  },

  /**
   * Get time ago string
   */
  timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  /**
   * Calculate duration between timestamps
   */
  duration(start: number, end: number): {
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
  } {
    const ms = end - start;
    return {
      milliseconds: ms,
      seconds: Math.floor(ms / 1000),
      minutes: Math.floor(ms / 60000),
      hours: Math.floor(ms / 3600000)
    };
  }
};

/**
 * Retry Utilities
 */
export const RetryUtils = {
  /**
   * Execute function with exponential backoff retry
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      attempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      attempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      factor = 2,
      onRetry
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (attempt < attempts) {
          if (onRetry) {
            onRetry(attempt, error);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * factor, maxDelay);
        }
      }
    }

    throw lastError;
  }
};

/**
 * Validation Utilities
 */
export const ValidationUtils = {
  /**
   * Validate proverb submission
   */
  validateSubmission(data: {
    proverb?: string;
    amount?: number;
    address?: string;
    memo?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate proverb
    if (!data.proverb || data.proverb.trim().length < 10) {
      errors.push('Proverb must be at least 10 characters');
    }

    if (data.proverb && data.proverb.length > 500) {
      errors.push('Proverb must be less than 500 characters');
    }

    // Validate amount
    if (data.amount !== undefined && !AmountUtils.validate(data.amount, 0.001)) {
      errors.push('Invalid amount');
    }

    // Validate address
    if (data.address && !AddressUtils.validate(data.address).valid) {
      errors.push('Invalid Zcash address');
    }

    // Validate memo
    if (data.memo && !MemoUtils.fitsLimit(data.memo)) {
      errors.push('Memo exceeds 512 byte limit');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Logger Utilities
 */
export const LoggerUtils = {
  /**
   * Format log entry
   */
  format(level: 'info' | 'warn' | 'error', message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
  },

  /**
   * Log with timestamp
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    console.log(this.format(level, message, data));
  }
};

/**
 * Statistics Calculator
 */
export class StatsCalculator {
  private data: number[] = [];

  add(value: number): void {
    this.data.push(value);
  }

  mean(): number {
    if (this.data.length === 0) return 0;
    return this.data.reduce((a, b) => a + b, 0) / this.data.length;
  }

  median(): number {
    if (this.data.length === 0) return 0;
    const sorted = [...this.data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  min(): number {
    return this.data.length > 0 ? Math.min(...this.data) : 0;
  }

  max(): number {
    return this.data.length > 0 ? Math.max(...this.data) : 0;
  }

  sum(): number {
    return this.data.reduce((a, b) => a + b, 0);
  }

  count(): number {
    return this.data.length;
  }

  reset(): void {
    this.data = [];
  }

  getStats() {
    return {
      count: this.count(),
      sum: this.sum(),
      mean: this.mean(),
      median: this.median(),
      min: this.min(),
      max: this.max()
    };
  }
}

/**
 * Export all utilities
 */
export const ZcashUtils = {
  Address: AddressUtils,
  Amount: AmountUtils,
  Memo: MemoUtils,
  Transaction: TransactionUtils,
  TrackingCode: TrackingCodeUtils,
  Time: TimeUtils,
  Retry: RetryUtils,
  Validation: ValidationUtils,
  Logger: LoggerUtils,
  Stats: StatsCalculator
};

export default ZcashUtils;
