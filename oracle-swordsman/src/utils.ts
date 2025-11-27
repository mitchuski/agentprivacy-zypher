/**
 * Utility functions for Oracle Swordsman
 * 
 * Note: Memo parsing and proverb validation are now handled by memo-parser.ts
 * This file contains utility functions that are not specific to memo parsing.
 */

// Re-export memo parser functions for backward compatibility
export { parseMemo, validateProverb, extractSubmissionData, createInscriptionMemo } from './memo-parser';

// Alias for backward compatibility (old code may use formatInscriptionMemo)
import { createInscriptionMemo } from './memo-parser';
export const formatInscriptionMemo = createInscriptionMemo;

// Legacy interface for backward compatibility
export interface ProverbMemo {
  tracking_code: string;
  proverb: string;
}

/**
 * Calculate transaction amounts based on economic model
 */
export function calculateTransactionAmounts(
  totalAmount: number,
  publicSplit: number,
  privateSplit: number,
  networkFee: number
): {
  publicAmount: number;
  privateAmount: number;
  totalAfterFee: number;
} {
  const totalAfterFee = totalAmount - networkFee;
  const publicAmount = totalAfterFee * publicSplit;
  const privateAmount = totalAfterFee * privateSplit;

  return {
    publicAmount: Math.round(publicAmount * 100000000) / 100000000, // Round to 8 decimals
    privateAmount: Math.round(privateAmount * 100000000) / 100000000,
    totalAfterFee: Math.round(totalAfterFee * 100000000) / 100000000,
  };
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

