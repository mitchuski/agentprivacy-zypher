/**
 * Transaction Query Module
 * Alternative approach: Query transactions directly from zebrad
 * Bypasses need for zxviews decoding by working with transaction data
 */

import { ZcashClient } from './zcash-client';
import logger from './logger';
import { parseMemo, extractSubmissionData, SubmissionData } from './memo-parser';

export interface TransactionQueryResult {
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
 * Query transaction by TXID and check if it's to our address
 * This is a workaround while we solve zxviews decoding
 */
export class TransactionQuery {
  private zcashClient: ZcashClient;
  private ourAddresses: string[];

  constructor(zcashClient: ZcashClient, addresses: string[]) {
    this.zcashClient = zcashClient;
    this.ourAddresses = addresses.map(a => a.toLowerCase());
  }

  /**
   * Query a specific transaction and check if it's to our addresses
   */
  async queryTransaction(txid: string): Promise<TransactionQueryResult | null> {
    try {
      // Get transaction from zebrad
      const tx = await this.zcashClient.execCommandJSON('getrawtransaction', txid, 1);
      
      if (!tx) {
        return null;
      }

      // Check if transaction has shielded outputs
      if (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) {
        // For shielded transactions, we need viewing key decryption
        // For now, we'll note this and return null
        // TODO: Implement viewing key decryption
        logger.debug('Shielded transaction detected - viewing key decryption needed', { txid });
        return null;
      }

      // Check transparent outputs
      if (tx.vout && tx.vout.length > 0) {
        for (const output of tx.vout) {
          // Check if output is to one of our addresses
          if (output.scriptPubKey && output.scriptPubKey.addresses) {
            for (const addr of output.scriptPubKey.addresses) {
              if (this.ourAddresses.includes(addr.toLowerCase())) {
                // Found transaction to our address!
                const amount = output.value || 0;
                
                // Extract memo from OP_RETURN
                const memo = this.extractMemoFromOutputs(tx.vout);
                
                if (memo) {
                  const parsed = parseMemo(memo);
                  if (parsed.valid) {
                    const submissionData = extractSubmissionData(parsed);
                    if (submissionData) {
                      const currentHeight = this.zcashClient.getCurrentHeight();
                      const confirmations = currentHeight - (tx.height || 0) + 1;
                      
                      return {
                        txid,
                        blockHeight: tx.height || 0,
                        address: addr,
                        amount,
                        memo,
                        confirmations,
                        timestamp: tx.time,
                        submissionData
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }

      return null;
    } catch (error: any) {
      logger.warn('Error querying transaction', { txid, error: error.message });
      return null;
    }
  }

  /**
   * Query transaction at specific block height
   */
  async queryTransactionAtBlock(blockHeight: number, txIndex?: number): Promise<TransactionQueryResult[]> {
    try {
      // Get block
      const block = await this.zcashClient.execCommandJSON('getblock', blockHeight, 2);
      
      if (!block || !block.tx) {
        return [];
      }

      const results: TransactionQueryResult[] = [];

      // Query each transaction in block
      const txsToCheck = txIndex !== undefined 
        ? [block.tx[txIndex]]
        : block.tx;

      for (const tx of txsToCheck) {
        if (tx.txid) {
          const result = await this.queryTransaction(tx.txid);
          if (result) {
            results.push(result);
          }
        }
      }

      return results;
    } catch (error: any) {
      logger.warn('Error querying transactions at block', { blockHeight, error: error.message });
      return [];
    }
  }

  /**
   * Extract memo from OP_RETURN outputs
   */
  private extractMemoFromOutputs(vout: any[]): string | null {
    for (const output of vout) {
      if (output.scriptPubKey && output.scriptPubKey.asm) {
        const asm = output.scriptPubKey.asm;
        if (asm.startsWith('OP_RETURN')) {
          const parts = asm.split(' ');
          if (parts.length > 1) {
            const hexData = parts.slice(1).join('');
            try {
              const memo = Buffer.from(hexData, 'hex').toString('utf-8').replace(/\0/g, '');
              return memo.trim() || null;
            } catch {
              return hexData;
            }
          }
        }
      }
    }
    return null;
  }
}

