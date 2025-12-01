/**
 * Transaction Parser
 * Parses Zcash transactions to extract memos, amounts, and addresses
 */

import { parseMemo, extractSubmissionData, SubmissionData } from './memo-parser';
import logger from './logger';

export interface ParsedTransaction {
  txid: string;
  blockHeight: number;
  address: string;
  amount: number;
  memo?: string;
  confirmations: number;
  timestamp?: number;
  submissionData?: SubmissionData;
}

/**
 * Parse raw transaction from Zebra/Zallet RPC
 * For transparent addresses, extracts memo from OP_RETURN
 */
export class TransactionParser {
  /**
   * Parse raw transaction data
   * @param rawTx Raw transaction bytes or hex string
   * @param blockHeight Block height where transaction was included
   * @param targetAddress Address we're checking for (to filter relevant transactions)
   */
  static parseRawTransaction(
    rawTx: Buffer | string,
    blockHeight: number,
    targetAddress?: string
  ): ParsedTransaction | null {
    try {
      // Convert to buffer if string
      const txBuffer = typeof rawTx === 'string' 
        ? Buffer.from(rawTx, 'hex')
        : rawTx;

      // Extract transaction ID (first 32 bytes of double SHA256)
      const crypto = require('crypto');
      const txid = crypto.createHash('sha256')
        .update(crypto.createHash('sha256').update(txBuffer).digest())
        .digest()
        .reverse()
        .toString('hex');

      // For now, this is a simplified parser
      // Full implementation needs proper Zcash transaction format parsing
      // TODO: Implement full transaction parsing
      
      return null; // Placeholder
    } catch (error: any) {
      logger.warn('Error parsing transaction', { error: error.message });
      return null;
    }
  }

  /**
   * Extract memo from OP_RETURN output (transparent transactions)
   */
  static extractMemoFromOPReturn(vout: any[]): string | null {
    try {
      for (const output of vout) {
        if (output.scriptPubKey && output.scriptPubKey.asm) {
          const asm = output.scriptPubKey.asm;
          // OP_RETURN transactions have "OP_RETURN <data>" in asm
          if (asm.startsWith('OP_RETURN')) {
            // Extract hex data after OP_RETURN
            const parts = asm.split(' ');
            if (parts.length > 1) {
              const hexData = parts.slice(1).join('');
              // Convert hex to string (memo)
              try {
                const memo = Buffer.from(hexData, 'hex').toString('utf-8').replace(/\0/g, '');
                return memo.trim() || null;
              } catch {
                // If not valid UTF-8, return hex
                return hexData;
              }
            }
          }
        }
      }
      return null;
    } catch (error: any) {
      logger.warn('Error extracting memo from OP_RETURN', { error: error.message });
      return null;
    }
  }

  /**
   * Extract amount from transaction outputs
   */
  static extractAmount(vout: any[], targetAddress?: string): number {
    try {
      let total = 0;
      for (const output of vout) {
        // If target address specified, only count outputs to that address
        if (targetAddress && output.scriptPubKey && output.scriptPubKey.addresses) {
          if (output.scriptPubKey.addresses.includes(targetAddress)) {
            total += output.value || 0;
          }
        } else {
          // Count all outputs
          total += output.value || 0;
        }
      }
      return total;
    } catch (error: any) {
      logger.warn('Error extracting amount', { error: error.message });
      return 0;
    }
  }
}

