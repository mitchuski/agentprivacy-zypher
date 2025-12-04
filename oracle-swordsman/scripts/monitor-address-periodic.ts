/**
 * Periodic Address Monitor
 * 
 * Monitors a T-address for new transactions every 10 minutes.
 * Automatically extracts and optionally imports inscriptions.
 * 
 * Usage:
 *   npx ts-node scripts/monitor-address-periodic.ts <address> [--auto-import]
 */

import { ZcashClient } from '../src/zcash-client';
import { db } from '../src/database';
import logger from '../src/logger';
import { autoDecodeProverb } from '../src/hex-decoder';

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const TARGET_ADDRESS = process.argv[2] || 't1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av';
const AUTO_IMPORT = process.argv.includes('--auto-import');

interface ProcessedTx {
  txid: string;
  blockHeight: number;
  processedAt: number;
}

/**
 * Parse Ordinals inscription envelope from scriptSig
 */
function parseInscriptionEnvelope(scriptSigHex: string): { contentType: string; content: string } | null {
  try {
    const scriptSig = Buffer.from(scriptSigHex, 'hex');
    
    // Find "ord" marker anywhere in the scriptSig
    const ordMarker = Buffer.from('ord');
    let ordOffset = -1;
    
    for (let i = 0; i < scriptSig.length - ordMarker.length - 1; i++) {
      if (scriptSig[i] === 0x03 && scriptSig[i + 1] === ordMarker[0] && 
          scriptSig[i + 2] === ordMarker[1] && scriptSig[i + 3] === ordMarker[2]) {
        ordOffset = i;
        break;
      }
    }
    
    if (ordOffset === -1) {
      return null;
    }
    
    let offset = ordOffset;
    offset += 1 + ordMarker.length;
    
    // After "ord", expect OP_1 (0x51)
    if (offset >= scriptSig.length || scriptSig[offset] !== 0x51) {
      return null;
    }
    offset++;
    
    // Read content-type
    let contentType = '';
    if (offset < scriptSig.length) {
      const contentTypeOpcode = scriptSig[offset];
      if (contentTypeOpcode > 0 && contentTypeOpcode <= 0x4b) {
        const len = contentTypeOpcode;
        if (offset + 1 + len <= scriptSig.length) {
          contentType = scriptSig.slice(offset + 1, offset + 1 + len).toString('utf-8');
          offset += 1 + len;
        } else {
          return null;
        }
      } else if (contentTypeOpcode === 0x4c) {
        if (offset + 1 < scriptSig.length) {
          const len = scriptSig[offset + 1];
          if (offset + 2 + len <= scriptSig.length) {
            contentType = scriptSig.slice(offset + 2, offset + 2 + len).toString('utf-8');
            offset += 2 + len;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    
    // Expect OP_0 (0x00)
    if (offset >= scriptSig.length || scriptSig[offset] !== 0x00) {
      return null;
    }
    offset++;
    
    // Read content
    let content = '';
    if (offset < scriptSig.length) {
      const contentOpcode = scriptSig[offset];
      if (contentOpcode > 0 && contentOpcode <= 0x4b) {
        const len = contentOpcode;
        if (offset + 1 + len <= scriptSig.length) {
          content = scriptSig.slice(offset + 1, offset + 1 + len).toString('utf-8');
        } else {
          return null;
        }
      } else if (contentOpcode === 0x4c) {
        if (offset + 1 < scriptSig.length) {
          const len = scriptSig[offset + 1];
          if (offset + 2 + len <= scriptSig.length) {
            content = scriptSig.slice(offset + 2, offset + 2 + len).toString('utf-8');
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else if (contentOpcode === 0x4d) {
        // OP_PUSHDATA2
        if (offset + 3 <= scriptSig.length) {
          const len = scriptSig.readUInt16LE(offset + 1);
          if (offset + 3 + len <= scriptSig.length) {
            content = scriptSig.slice(offset + 3, offset + 3 + len).toString('utf-8');
          } else {
            const availableLen = scriptSig.length - (offset + 3);
            if (availableLen > 0) {
              content = scriptSig.slice(offset + 3, offset + 3 + availableLen).toString('utf-8');
            }
            return { contentType, content };
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    
    return { contentType, content };
  } catch (error: any) {
    logger.warn('Error parsing inscription envelope', { error: error.message });
    return null;
  }
}

/**
 * Parse STS format inscription
 */
function parseSTSInscription(content: string): {
  actNumber: number;
  emojiInscription: string;
  proverbText: string;
  hash: string;
  ref: string;
} | null {
  try {
    const parts = content.split('|');
    if (parts.length < 6 || (parts[0] !== 'STS' && !parts[0].startsWith('STM-'))) {
      return null;
    }
    
    // Find ACT: part
    let actNumber = 0;
    for (const part of parts) {
      const actMatch = part.match(/^ACT:(\d+)$/);
      if (actMatch) {
        actNumber = parseInt(actMatch[1]);
        break;
      }
    }
    
    if (actNumber === 0) {
      return null;
    }
    
    // Extract emoji inscription (E:...)
    let emojiInscription = '';
    for (const part of parts) {
      if (part.startsWith('E:')) {
        emojiInscription = part.substring(2);
        break;
      }
    }
    
    // Proverb text (usually the longest part that's not a tag)
    let proverbText = '';
    for (const part of parts) {
      if (!part.startsWith('ACT:') && !part.startsWith('E:') && 
          !part.startsWith('H:') && !part.startsWith('REF:') &&
          part.length > proverbText.length) {
        proverbText = part;
      }
    }
    
    // Hash (H:...)
    let hash = '';
    for (const part of parts) {
      if (part.startsWith('H:')) {
        hash = part.substring(2);
        break;
      }
    }
    
    // Reference (REF:...)
    let ref = '';
    for (const part of parts) {
      if (part.startsWith('REF:')) {
        ref = part.substring(4);
        break;
      }
    }
    
    return {
      actNumber,
      emojiInscription,
      proverbText,
      hash,
      ref,
    };
  } catch (error: any) {
    logger.warn('Error parsing STS inscription', { error: error.message });
    return null;
  }
}

/**
 * Map act number to act_id format
 */
function getActId(actNumber: number): string {
  const actMap: { [key: number]: string } = {
    1: 'act-01-venice',
    2: 'act-02-constantinople',
    3: 'act-03-alexandria',
    4: 'act-04-baghdad',
    5: 'act-05-cordoba',
    6: 'act-06-toledo',
    7: 'act-07-palermo',
    8: 'act-08-cairo',
    9: 'act-09-damascus',
    10: 'act-10-granada',
    11: 'act-11-seville',
    12: 'act-12-valencia',
  };
  
  return actMap[actNumber] || `act-${String(actNumber).padStart(2, '0')}`;
}

/**
 * Extract inscription from transaction
 */
async function extractInscriptionFromTx(txid: string, zcashClient: ZcashClient, targetAddress: string) {
  try {
    const tx = await zcashClient.execCommandJSON('getrawtransaction', txid, 1) as any;
    
    if (!tx || !tx.vin || tx.vin.length === 0) {
      return null;
    }
    
    // Verify transaction has output to target address
    let hasOutput = false;
    if (tx.vout && tx.vout.length > 0) {
      for (const output of tx.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          for (const addr of output.scriptPubKey.addresses) {
            if (addr.toLowerCase() === targetAddress.toLowerCase()) {
              hasOutput = true;
              break;
            }
          }
        }
      }
    }
    
    if (!hasOutput) {
      return null;
    }
    
    const firstInput = tx.vin[0];
    if (!firstInput.scriptSig || !firstInput.scriptSig.hex) {
      return null;
    }
    
    const inscription = parseInscriptionEnvelope(firstInput.scriptSig.hex);
    if (!inscription) {
      return null;
    }
    
    return {
      txid,
      inscription,
      blockHeight: tx.height,
      confirmations: tx.confirmations,
      time: tx.time,
      vout: tx.vout
    };
  } catch (error: any) {
    logger.warn('Error extracting inscription', { txid, error: error.message });
    return null;
  }
}

/**
 * Import inscription to database
 */
async function importInscription(txid: string, targetAddress: string, inscription: any) {
  try {
    // Parse STS format
    const stsData = parseSTSInscription(inscription.content);
    
    if (!stsData) {
      logger.warn('Failed to parse STS format', { txid });
      return false;
    }
    
    // Auto-decode hex-encoded proverb
    const decodedProverb = autoDecodeProverb(stsData.proverbText);
    
    // Get act_id
    const actId = getActId(stsData.actNumber);
    
    // Check if submission already exists
    const existing = await db.getSubmissionByTrackingCode(`INS-${txid.substring(0, 16)}`);
    if (existing) {
      logger.info('Submission already exists', { txid, id: existing.id });
      return false;
    }
    
    // Get amount from transaction
    const tx = await (new ZcashClient()).execCommandJSON('getrawtransaction', txid, 1) as any;
    let amount = 0;
    if (tx && tx.vout && tx.vout.length > 0) {
      for (const output of tx.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          for (const addr of output.scriptPubKey.addresses) {
            if (addr.toLowerCase() === targetAddress.toLowerCase()) {
              amount = output.value || 0;
              break;
            }
          }
        }
      }
    }
    
    // Create memo text in RPP-v1 format
    const memoText = `rpp-v1\ntale:${actId}\n${decodedProverb}`;
    
    // Create submission
    const submission = await db.createSubmission({
      tracking_code: `INS-${txid.substring(0, 16)}`,
      sender_address: targetAddress,
      proverb_text: decodedProverb,
      amount_zec: amount,
      txid: txid,
      memo_text: memoText,
    });
    
    // Create verification (auto-verify onchain inscriptions)
    await db.createVerification({
      submission_id: submission.id,
      ai_provider: 'onchain',
      quality_score: 1.0,
      matched_act: actId,
      reasoning: `Onchain inscription verified. Act ${stsData.actNumber} inscription with emoji: ${stsData.emojiInscription}`,
    });
    
    // Update submission status
    await db.updateSubmissionStatus(submission.id, 'verified');
    
    logger.info('Inscription imported successfully', {
      txid,
      actId,
      proverb: decodedProverb.substring(0, 50) + '...',
    });
    
    return true;
  } catch (error: any) {
    logger.error('Error importing inscription', { txid, error: error.message });
    return false;
  }
}

/**
 * Get new transactions for address
 */
async function getNewTransactions(
  zcashClient: ZcashClient,
  address: string,
  lastCheckedHeight: number
): Promise<string[]> {
  try {
    const currentHeight = await zcashClient.getBlockHeight();
    const newTxids: string[] = [];
    
    // Check blocks from lastCheckedHeight to current
    for (let height = lastCheckedHeight + 1; height <= currentHeight; height++) {
      try {
        // Try to get block by height directly, or by hash
        let block: any;
        try {
          // Some RPC implementations support height directly
          block = await zcashClient.execCommandJSON('getblock', height, 2) as any;
        } catch {
          // If that fails, get hash first then block
          const blockHash = await zcashClient.execCommandJSON('getblockhash', height) as string;
          block = await zcashClient.execCommandJSON('getblock', blockHash, 2) as any;
        }
        
        if (block && block.tx) {
          for (const tx of block.tx) {
            // Check if transaction has output to our address
            if (tx.vout) {
              for (const output of tx.vout) {
                if (output.scriptPubKey && output.scriptPubKey.addresses) {
                  for (const addr of output.scriptPubKey.addresses) {
                    if (addr.toLowerCase() === address.toLowerCase()) {
                      newTxids.push(tx.txid);
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error: any) {
        logger.warn('Error checking block', { height, error: error.message });
      }
    }
    
    return newTxids;
  } catch (error: any) {
    logger.error('Error getting new transactions', { error: error.message });
    return [];
  }
}

/**
 * Monitor address periodically
 */
async function monitorAddress(address: string) {
  const zcashClient = new ZcashClient();
  await zcashClient.initialize();
  
  logger.info('Starting address monitor', {
    address,
    interval: `${CHECK_INTERVAL_MS / 1000 / 60} minutes`,
    autoImport: AUTO_IMPORT,
  });
  
  console.log(`\n=== Monitoring Address: ${address} ===`);
  console.log(`Check interval: ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`Auto-import: ${AUTO_IMPORT ? 'enabled' : 'disabled'}`);
  console.log(`\nPress Ctrl+C to stop\n`);
  
    // Get current block height
    let lastCheckedHeight = await zcashClient.getBlockHeight();
    const processedTxids = new Set<string>();
    
    // Initial check
    console.log(`[${new Date().toISOString()}] Initial check at block height ${lastCheckedHeight}...`);
    console.log(`Will check for new transactions every ${CHECK_INTERVAL_MS / 1000 / 60} minutes.\n`);
  
  // Periodic check function
  const checkForNewTransactions = async () => {
    try {
      const currentHeight = await zcashClient.getBlockHeight();
      
      if (currentHeight > lastCheckedHeight) {
        console.log(`[${new Date().toISOString()}] Checking blocks ${lastCheckedHeight + 1} to ${currentHeight}...`);
        
        const newTxids = await getNewTransactions(zcashClient, address, lastCheckedHeight);
        
        if (newTxids.length > 0) {
          console.log(`[${new Date().toISOString()}] Found ${newTxids.length} new transaction(s)`);
          
          for (const txid of newTxids) {
            if (processedTxids.has(txid)) {
              continue;
            }
            
            processedTxids.add(txid);
            
            console.log(`\n🔔 New transaction: ${txid}`);
            
            // Extract inscription
            const result = await extractInscriptionFromTx(txid, zcashClient, address);
            
            if (result && result.inscription) {
              console.log('✅ INSCRIPTION FOUND!');
              console.log(`   Content-Type: ${result.inscription.contentType}`);
              console.log(`   Content: ${result.inscription.content.substring(0, 100)}...`);
              
              if (AUTO_IMPORT) {
                console.log('   Auto-importing to database...');
                const imported = await importInscription(txid, address, result.inscription);
                if (imported) {
                  console.log('   ✅ Inscription imported successfully!');
                } else {
                  console.log('   ⚠️  Failed to import (may already exist)');
                }
              }
            } else {
              console.log('ℹ️  Transaction found but no inscription detected');
            }
          }
        } else {
          console.log(`[${new Date().toISOString()}] No new transactions`);
        }
        
        lastCheckedHeight = currentHeight;
      } else {
        console.log(`[${new Date().toISOString()}] No new blocks (still at height ${currentHeight})`);
      }
    } catch (error: any) {
      logger.error('Error in periodic check', { error: error.message });
      console.error(`[${new Date().toISOString()}] Error: ${error.message}`);
    }
  };
  
  // Run initial check
  await checkForNewTransactions();
  
  // Set up periodic checks
  setInterval(checkForNewTransactions, CHECK_INTERVAL_MS);
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\nStopping monitor...');
    process.exit(0);
  });
}

// Main
async function main() {
  if (!TARGET_ADDRESS || TARGET_ADDRESS.length < 10) {
    console.error('Error: Please provide a valid address');
    console.error('Usage: npx ts-node scripts/monitor-address-periodic.ts <address> [--auto-import]');
    process.exit(1);
  }
  
  await monitorAddress(TARGET_ADDRESS);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

