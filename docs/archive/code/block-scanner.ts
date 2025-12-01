/**
 * Block Scanner Module
 * Scans blocks using lightwalletd gRPC to detect transactions to our addresses
 */

import { LightwalletdClient } from './lightwalletd-client';
import { parseMemo, extractSubmissionData, SubmissionData } from './memo-parser';
import logger from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AddressInfo {
  address: string;
  type: 'transparent' | 'shielded';
  viewingKey?: string;
  actId?: string;
  label?: string;
}

export interface DetectedTransaction {
  txid: string;
  blockHeight: number;
  address: string;
  amount: number;
  memo?: string;
  confirmations: number;
  timestamp?: number;
  submissionData?: SubmissionData;
}

export class BlockScanner {
  private lightwalletdClient: LightwalletdClient;
  private addresses: AddressInfo[] = [];
  private lastScannedHeight: number = 0;
  private currentBlockHeight: number = 0;

  constructor(lightwalletdClient: LightwalletdClient) {
    this.lightwalletdClient = lightwalletdClient;
  }

  /**
   * Load addresses from address file
   */
  async loadAddresses(): Promise<void> {
    try {
      // Try multiple possible locations
      const possiblePaths = [
        path.join(__dirname, '../zcash-addresses-controlled.json'),
        path.join(__dirname, '../../zcash-addresses-controlled.json'),
        path.join(process.cwd(), 'zcash-addresses-controlled.json'),
        path.join(process.cwd(), 'oracle-swordsman/zcash-addresses-controlled.json'),
      ];

      let addressData: any = null;
      for (const filePath of possiblePaths) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          addressData = JSON.parse(content);
          logger.info('Loaded addresses from', { path: filePath });
          break;
        } catch {
          // Try next path
        }
      }

      if (!addressData || !addressData.addresses) {
        throw new Error('Address file not found in any expected location');
      }

      this.addresses = addressData.addresses.map((addr: any) => ({
        address: addr.address,
        type: addr.type,
        viewingKey: addr.viewingKey,
        actId: addr.act_id,
        label: addr.label,
      }));

      logger.info(`Loaded ${this.addresses.length} addresses for scanning`);
    } catch (error: any) {
      logger.error('Failed to load addresses', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize scanner
   */
  async initialize(): Promise<void> {
    await this.lightwalletdClient.connect();
    await this.loadAddresses();
    
    // Get current block height
    this.currentBlockHeight = await this.lightwalletdClient.getLatestBlock();
    
    // Start from a reasonable height (e.g., 1000 blocks ago or Sapling activation)
    if (this.lastScannedHeight === 0) {
      const info = await this.lightwalletdClient.getInfo();
      this.lastScannedHeight = Math.max(
        info.saplingActivationHeight,
        this.currentBlockHeight - 1000
      );
    }

    logger.info('Block scanner initialized', {
      currentHeight: this.currentBlockHeight,
      lastScannedHeight: this.lastScannedHeight,
      addressesCount: this.addresses.length
    });
  }

  /**
   * Scan new blocks for transactions
   */
  async scanNewBlocks(): Promise<DetectedTransaction[]> {
    const transactions: DetectedTransaction[] = [];

    // Update current height
    this.currentBlockHeight = await this.lightwalletdClient.getLatestBlock();

    if (this.currentBlockHeight <= this.lastScannedHeight) {
      return transactions; // No new blocks
    }

    const startHeight = this.lastScannedHeight + 1;
    const endHeight = this.currentBlockHeight;

    logger.info(`Scanning blocks ${startHeight} to ${endHeight}`);

    try {
      // Get block range from lightwalletd
      const blocks = await this.lightwalletdClient.getBlockRange(startHeight, endHeight);

      // Process each block
      for (const block of blocks) {
        // Check transparent addresses
        const transparentAddresses = this.addresses.filter(a => a.type === 'transparent');
        for (const addr of transparentAddresses) {
          try {
            // Get transactions for this address in this block
            const txs = await this.lightwalletdClient.getTaddressTransactions(
              addr.address,
              block.height,
              block.height
            );

            for (const rawTx of txs) {
              // Parse raw transaction
              const detected = await this.parseRawTransaction(rawTx, block.height, addr.address);
              if (detected) {
                transactions.push(detected);
                logger.info('Detected transaction', {
                  txid: detected.txid,
                  address: addr.address,
                  amount: detected.amount,
                  hasMemo: !!detected.memo
                });
              }
            }
          } catch (error: any) {
            logger.warn(`Error scanning transparent address ${addr.address}`, {
              error: error.message,
              block: block.height
            });
          }
        }

        // Check shielded addresses using viewing keys
        const shieldedAddresses = this.addresses.filter(a => a.type === 'shielded' && a.viewingKey);
        if (shieldedAddresses.length > 0) {
          // Process compact transactions in this block
          for (const tx of block.vtx) {
            // Check each Sapling output
            for (const output of tx.outputs) {
              try {
                // Try to decrypt with our viewing keys
                const { ViewingKeyDecryptor } = await import('./viewing-key-decryptor');
                const decryptor = new ViewingKeyDecryptor();
                
                // Add all viewing keys
                for (const addr of shieldedAddresses) {
                  if (addr.viewingKey) {
                    decryptor.addViewingKey(addr.address, addr.viewingKey);
                  }
                }
                
                // Try to decrypt this output
                const decrypted = await decryptor.decryptOutput(
                  {
                    cmu: Buffer.from(output.cmu),
                    ephemeralKey: Buffer.from(output.ephemeralKey),
                    ciphertext: Buffer.from(output.ciphertext)
                  },
                  block.height
                );
                
                if (decrypted && decrypted.memo) {
                  // Found a transaction to one of our addresses!
                  // Parse memo to check if it's a submission
                  const parsed = parseMemo(decrypted.memo);
                  if (parsed.valid) {
                    const submissionData = extractSubmissionData(parsed);
                    if (submissionData) {
                      // Calculate transaction ID from block and index
                      const txid = Buffer.from(tx.hash).reverse().toString('hex');
                      
                      const currentHeight = this.currentBlockHeight;
                      const confirmations = currentHeight - block.height + 1;
                      
                      transactions.push({
                        txid,
                        blockHeight: block.height,
                        address: decrypted.address,
                        amount: decrypted.amount / 100000000, // Convert zatoshi to ZEC
                        memo: decrypted.memo,
                        confirmations,
                        timestamp: block.time ? new Date(block.time * 1000).getTime() : undefined,
                        submissionData,
                      });
                      
                      logger.info('Detected shielded transaction', {
                        txid,
                        address: decrypted.address.substring(0, 20) + '...',
                        amount: decrypted.amount,
                        blockHeight: block.height
                      });
                    }
                  }
                }
              } catch (error: any) {
                logger.debug('Error processing shielded output', {
                  error: error.message,
                  block: block.height
                });
              }
            }
          }
        }
      }

      // Update last scanned height
      this.lastScannedHeight = endHeight;

      logger.info(`Scanned ${blocks.length} blocks, found ${transactions.length} transactions`);
    } catch (error: any) {
      logger.error('Error scanning blocks', { error: error.message });
    }

    return transactions;
  }

  /**
   * Parse raw transaction from lightwalletd
   * lightwalletd returns RawTransaction which has:
   * - data: raw transaction bytes
   * - height: block height
   */
  private async parseRawTransaction(
    rawTx: any,
    blockHeight: number,
    targetAddress: string
  ): Promise<DetectedTransaction | null> {
    try {
      // RawTransaction from lightwalletd has:
      // - data: Buffer of raw transaction bytes
      // - height: block height (uint64)
      
      const txData = rawTx.data || rawTx;
      if (!txData) {
        return null;
      }

      // Convert to buffer if needed
      const txBuffer = Buffer.isBuffer(txData) 
        ? txData 
        : Buffer.from(txData, 'hex');

      // Calculate transaction ID (double SHA256, reversed)
      const crypto = require('crypto');
      const txid = crypto.createHash('sha256')
        .update(crypto.createHash('sha256').update(txBuffer).digest())
        .digest()
        .reverse()
        .toString('hex');

      // Parse raw transaction to extract vout (outputs)
      // Try to get decoded transaction from zebrad
      try {
        // Use zebrad RPC to decode the transaction
        // Note: We need to make execCommandJSON accessible or use a different approach
        const { zcashClient } = await import('./zcash-client');
        
        // Create a temporary client instance to access the method
        // Or we can query zebrad directly via HTTP
        const cookie = await require('fs/promises').readFile(
          process.env.ZCASH_COOKIE_FILE_PATH || 
          (process.platform === 'win32' 
            ? `${process.env.LOCALAPPDATA}\\zebra\\.cookie`
            : `${process.env.HOME}/.zebra/.cookie`),
          'utf-8'
        );
        const [rpcUser, rpcPass] = cookie.trim().split(':');
        const auth = Buffer.from(`${rpcUser}:${rpcPass}`).toString('base64');
        
        const axios = require('axios');
        const response = await axios.post(
          `http://${process.env.ZCASH_RPC_HOST || '127.0.0.1'}:${process.env.ZCASH_RPC_PORT || '8233'}`,
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'getrawtransaction',
            params: [txid, 1]
          },
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const decodedTx = response.data.result;
        
        if (!decodedTx) {
          return null;
        }

        // Extract memo from OP_RETURN outputs
        const { TransactionParser } = await import('./transaction-parser');
        const memo = decodedTx.vout 
          ? TransactionParser.extractMemoFromOPReturn(decodedTx.vout) 
          : null;

        // Only process transactions with memos (submissions have memos)
        if (!memo || memo.trim().length === 0) {
          return null;
        }

        // Extract amount sent to target address
        const amount = decodedTx.vout 
          ? TransactionParser.extractAmount(decodedTx.vout, targetAddress)
          : 0;

        // Parse memo to check if it's a valid submission
        const parsed = parseMemo(memo);
        if (!parsed.valid) {
          return null; // Not a valid submission format
        }

        const submissionData = extractSubmissionData(parsed);
        if (!submissionData) {
          return null;
        }

        // Get current block height for confirmations
        const currentHeight = this.currentBlockHeight;
        const confirmations = currentHeight - blockHeight + 1;

        return {
          txid,
          blockHeight,
          address: targetAddress,
          amount,
          memo,
          confirmations,
          timestamp: decodedTx.time || undefined,
          submissionData,
        };
      } catch (error: any) {
        // If we can't decode via zebrad, skip this transaction
        logger.debug('Could not decode transaction via zebrad', { 
          txid, 
          error: error.message 
        });
        return null;
      }
    } catch (error: any) {
      logger.warn('Error parsing raw transaction', { error: error.message });
      return null;
    }
  }

  /**
   * Get last scanned height
   */
  getLastScannedHeight(): number {
    return this.lastScannedHeight;
  }

  /**
   * Get current block height
   */
  getCurrentBlockHeight(): number {
    return this.currentBlockHeight;
  }
}

