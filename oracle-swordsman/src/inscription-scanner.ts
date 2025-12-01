/**
 * Inscription Background Scanner
 *
 * Monitors the main t1 output address for incoming transactions,
 * then scans their inputs for inscription content.
 *
 * Runs on a 10 minute interval.
 */

import axios from 'axios';
import { config } from './config';
import logger from './logger';
import {
  inscriptionIndexer,
  scanTransactionForInscription,
  MAIN_T1_ADDRESS,
} from './inscription-indexer';

const SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

let lastScannedTxids: Set<string> = new Set();
let isRunning = false;
let scannerInterval: NodeJS.Timeout | null = null;

/**
 * Zebra RPC call helper
 */
async function zebraRpc(method: string, params: any[] = []): Promise<any> {
  const fs = require('fs');

  let cookie = '';
  try {
    const cookiePath = config.zebra.cookieFilePath;
    cookie = fs.readFileSync(cookiePath, 'utf8').trim();
  } catch {
    // Use fallback or empty
  }

  const [user, pass] = cookie.split(':');

  const response = await axios.post(
    config.zebra.rpcUrl,
    {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    },
    {
      auth: user && pass ? { username: user, password: pass } : undefined,
      timeout: 30000,
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result;
}

/**
 * Zallet RPC call helper
 */
async function zalletRpc(method: string, params: any[] = []): Promise<any> {
  const auth = config.zallet.rpcUser && config.zallet.rpcPassword
    ? { username: config.zallet.rpcUser, password: config.zallet.rpcPassword }
    : undefined;

  const response = await axios.post(
    config.zallet.rpcUrl,
    {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    },
    {
      auth,
      timeout: config.zallet.timeout,
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result;
}

/**
 * Get recent transactions to the main t1 address
 * Uses getaddresstxids from Zebra (primary), or scans recent blocks as fallback
 */
async function getRecentTransactionsToMainAddress(): Promise<string[]> {
  // Primary method: use getaddresstxids from Zebra (requires addressindex)
  try {
    logger.info('Fetching transactions via getaddresstxids', { address: MAIN_T1_ADDRESS });
    const result = await zebraRpc('getaddresstxids', [{ addresses: [MAIN_T1_ADDRESS] }]);
    if (Array.isArray(result) && result.length > 0) {
      logger.info(`Found ${result.length} transactions via getaddresstxids`);
      // Return last 100 txids (most recent)
      return result.slice(-100);
    }
    logger.info('getaddresstxids returned empty array');
  } catch (error: any) {
    logger.warn('getaddresstxids failed, falling back to block scanning', { error: error.message });
  }

  // Fallback: scan recent blocks (last ~20 blocks for better coverage)
  const txids: string[] = [];
  try {
    const info = await zebraRpc('getblockchaininfo');
    const currentHeight = info.blocks;

    logger.info('Scanning recent blocks for inscriptions', { currentHeight, scanRange: 20 });

    // Scan last 20 blocks (~25 min worth) to ensure we don't miss any
    for (let height = currentHeight; height > currentHeight - 20 && height > 0; height--) {
      try {
        const blockHash = await zebraRpc('getblockhash', [height]);
        const block = await zebraRpc('getblock', [blockHash, 2]); // verbosity 2 for full tx data

        if (block.tx) {
          for (const tx of block.tx) {
            // Check if any output goes to our main address
            if (tx.vout) {
              for (const vout of tx.vout) {
                const addresses = vout.scriptPubKey?.addresses || [];
                if (addresses.includes(MAIN_T1_ADDRESS)) {
                  logger.info('Found tx to main address in block', { height, txid: tx.txid });
                  txids.push(tx.txid);
                  break;
                }
              }
            }
          }
        }
      } catch (blockError: any) {
        logger.warn(`Error scanning block ${height}`, { error: blockError.message });
      }
    }

    logger.info(`Found ${txids.length} transactions via block scanning`);
  } catch (error: any) {
    logger.warn('Block scanning failed', { error: error.message });
  }

  return txids;
}

/**
 * Scan a single transaction for inscription content
 */
async function processTransaction(txid: string): Promise<boolean> {
  try {
    // Skip if already scanned
    if (lastScannedTxids.has(txid)) {
      return false;
    }

    const inscription = await scanTransactionForInscription(txid);

    if (inscription) {
      // Save to database
      await inscriptionIndexer.saveInscription(inscription);
      logger.info('New inscription found and saved', {
        txid,
        act: inscription.actNumber,
        proverb: inscription.proverb.substring(0, 50) + '...',
      });
      lastScannedTxids.add(txid);
      return true;
    }

    // Mark as scanned even if no inscription found
    lastScannedTxids.add(txid);
    return false;
  } catch (error) {
    logger.warn('Error processing transaction', { txid, error });
    return false;
  }
}

/**
 * Run a single scan cycle
 */
async function runScanCycle(): Promise<{ scanned: number; found: number }> {
  logger.info('Starting inscription scan cycle...');

  const txids = await getRecentTransactionsToMainAddress();
  let scanned = 0;
  let found = 0;

  for (const txid of txids) {
    if (!lastScannedTxids.has(txid)) {
      scanned++;
      const wasInscription = await processTransaction(txid);
      if (wasInscription) {
        found++;
      }
    }
  }

  // Keep lastScannedTxids from growing too large (keep last 1000)
  if (lastScannedTxids.size > 1000) {
    const txidsArray = Array.from(lastScannedTxids);
    lastScannedTxids = new Set(txidsArray.slice(-500));
  }

  logger.info('Scan cycle complete', { scanned, found, totalTracked: lastScannedTxids.size });
  return { scanned, found };
}

/**
 * Start the background scanner
 */
export async function startScanner(): Promise<void> {
  if (isRunning) {
    logger.warn('Scanner is already running');
    return;
  }

  logger.info('Starting inscription background scanner', {
    interval: `${SCAN_INTERVAL_MS / 1000 / 60} minutes`,
    monitorAddress: MAIN_T1_ADDRESS,
  });

  // Initialize the database table
  try {
    await inscriptionIndexer.initializeTable();
  } catch (error) {
    logger.error('Failed to initialize inscriptions table', { error });
  }

  isRunning = true;

  // Run initial scan
  try {
    await runScanCycle();
  } catch (error) {
    logger.error('Initial scan cycle failed', { error });
  }

  // Set up interval
  scannerInterval = setInterval(async () => {
    try {
      await runScanCycle();
    } catch (error) {
      logger.error('Scan cycle failed', { error });
    }
  }, SCAN_INTERVAL_MS);

  logger.info('Inscription scanner started');
}

/**
 * Stop the background scanner
 */
export function stopScanner(): void {
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
  }
  isRunning = false;
  logger.info('Inscription scanner stopped');
}

/**
 * Check if scanner is running
 */
export function isScannerRunning(): boolean {
  return isRunning;
}

/**
 * Manually trigger a scan cycle
 */
export async function triggerScan(): Promise<{ scanned: number; found: number }> {
  return runScanCycle();
}

/**
 * Get scanner status
 */
export function getScannerStatus(): {
  running: boolean;
  trackedTxids: number;
  intervalMinutes: number;
  monitorAddress: string;
} {
  return {
    running: isRunning,
    trackedTxids: lastScannedTxids.size,
    intervalMinutes: SCAN_INTERVAL_MS / 1000 / 60,
    monitorAddress: MAIN_T1_ADDRESS,
  };
}
