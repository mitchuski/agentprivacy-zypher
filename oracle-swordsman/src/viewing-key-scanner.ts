/**
 * Viewing Key Scanner Module
 * Scans Zcash blocks using viewing keys to detect transactions to our addresses
 *
 * This module queries zebrad directly and uses viewing keys to:
 * 1. Scan blocks for Sapling outputs
 * 2. Check if outputs are to addresses we control
 * 3. Decrypt memos from relevant transactions
 *
 * Architecture: Zebra RPC (blockchain) + Zallet RPC (wallet/decryption)
 */

import { ZcashClient } from './zcash-client';
import { parseMemo, extractSubmissionData, SubmissionData } from './memo-parser';
import logger from './logger';

export interface ViewingKeyInfo {
  address: string;
  viewingKey: string;
  actId?: string;
  label?: string;
}

export interface ScannedTransaction {
  txid: string;
  blockHeight: number;
  address: string;
  amount: number;
  memo?: string;
  confirmations: number;
  timestamp?: number;
  submissionData?: SubmissionData;
}

export class ViewingKeyScanner {
  private zcashClient: ZcashClient;
  private viewingKeys: ViewingKeyInfo[] = [];
  private lastScannedHeight: number = 0;

  constructor(zcashClient: ZcashClient) {
    this.zcashClient = zcashClient;
  }

  /**
   * Load viewing keys from address file
   */
  async loadViewingKeys(): Promise<void> {
    try {
      // Load addresses from the controlled addresses file
      const addressFile = await import('../zcash-addresses-controlled.json');
      const addresses = addressFile.addresses || [];

      this.viewingKeys = addresses
        .filter((addr: any) => addr.type === 'shielded' && addr.viewingKey)
        .map((addr: any) => ({
          address: addr.address,
          viewingKey: addr.viewingKey,
          actId: addr.act_id,
          label: addr.label,
        }));

      logger.info(`Loaded ${this.viewingKeys.length} viewing keys`);
    } catch (error: any) {
      logger.error('Failed to load viewing keys', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan blocks for transactions using viewing keys
   *
   * Uses Zallet RPC for viewing key-based transaction scanning and decryption.
   * Zebra RPC provides blockchain data, Zallet handles wallet operations.
   */
  async scanBlocks(startHeight: number, endHeight: number): Promise<ScannedTransaction[]> {
    const transactions: ScannedTransaction[] = [];

    logger.info(`Scanning blocks ${startHeight} to ${endHeight}`);

    for (let height = startHeight; height <= endHeight; height++) {
      try {
        // Get block from Zebra RPC
        const block = null; // TODO: Implement with Zebra RPC getblock

        if (block && (block as any).tx) {
          for (const tx of (block as any).tx) {
            if (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) {
              // Zallet handles viewing key decryption
              logger.debug(`Found shielded transaction in block ${height}`, { txid: tx.txid });
            }
          }
        }
      } catch (error: any) {
        logger.warn(`Error scanning block ${height}`, { error: error.message });
      }
    }

    return transactions;
  }

  /**
   * Get new transactions since last scan
   */
  async getNewTransactions(): Promise<ScannedTransaction[]> {
    const currentHeight = this.zcashClient.getCurrentHeight();

    if (this.lastScannedHeight === 0) {
      // First scan - start from a reasonable height (e.g., 1000 blocks ago)
      this.lastScannedHeight = Math.max(419200, currentHeight - 1000); // Sapling activation
    }

    if (currentHeight <= this.lastScannedHeight) {
      return []; // No new blocks
    }

    const transactions = await this.scanBlocks(this.lastScannedHeight + 1, currentHeight);
    this.lastScannedHeight = currentHeight;

    return transactions;
  }
}
