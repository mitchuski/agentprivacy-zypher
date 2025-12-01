/**
 * Monitor T-Address for Inscriptions
 * 
 * Monitors a transparent address for new transactions and extracts
 * Ordinals-style inscriptions from scriptSig.
 */

import { ZcashClient } from '../src/zcash-client';
import logger from '../src/logger';

const TARGET_ADDRESS = 't1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q';

/**
 * Parse Ordinals inscription envelope from scriptSig
 */
function parseInscriptionEnvelope(scriptSigHex: string): { contentType: string; content: string } | null {
  try {
    const scriptSig = Buffer.from(scriptSigHex, 'hex');
    let offset = 0;

    // Find "ord" marker
    const ordMarker = Buffer.from('ord');
    let foundOrd = false;
    
    while (offset < scriptSig.length - ordMarker.length) {
      const opcode = scriptSig[offset];
      if (opcode > 0 && opcode <= 0x4b) {
        const dataLen = opcode;
        if (offset + 1 + dataLen <= scriptSig.length) {
          const data = scriptSig.slice(offset + 1, offset + 1 + dataLen);
          if (data.equals(ordMarker)) {
            foundOrd = true;
            offset += 1 + dataLen;
            break;
          }
          offset += 1 + dataLen;
        } else {
          break;
        }
      } else if (opcode === 0x4c) {
        if (offset + 1 < scriptSig.length) {
          const dataLen = scriptSig[offset + 1];
          if (offset + 2 + dataLen <= scriptSig.length) {
            const data = scriptSig.slice(offset + 2, offset + 2 + dataLen);
            if (data.equals(ordMarker)) {
              foundOrd = true;
              offset += 2 + dataLen;
              break;
            }
            offset += 2 + dataLen;
          } else {
            break;
          }
        } else {
          break;
        }
      } else {
        offset++;
      }
    }

    if (!foundOrd) return null;

    // After "ord", expect OP_1 (0x51)
    if (offset >= scriptSig.length || scriptSig[offset] !== 0x51) return null;
    offset++;

    // Read content-type
    let contentType = '';
    if (offset < scriptSig.length) {
      const opcode = scriptSig[offset];
      if (opcode > 0 && opcode <= 0x4b) {
        const len = opcode;
        if (offset + 1 + len <= scriptSig.length) {
          contentType = scriptSig.slice(offset + 1, offset + 1 + len).toString('utf-8');
          offset += 1 + len;
        } else return null;
      } else if (opcode === 0x4c) {
        if (offset + 1 < scriptSig.length) {
          const len = scriptSig[offset + 1];
          if (offset + 2 + len <= scriptSig.length) {
            contentType = scriptSig.slice(offset + 2, offset + 2 + len).toString('utf-8');
            offset += 2 + len;
          } else return null;
        } else return null;
      } else return null;
    }

    // Expect OP_0 (0x00)
    if (offset >= scriptSig.length || scriptSig[offset] !== 0x00) return null;
    offset++;

    // Read content
    let content = '';
    if (offset < scriptSig.length) {
      const opcode = scriptSig[offset];
      if (opcode > 0 && opcode <= 0x4b) {
        const len = opcode;
        if (offset + 1 + len <= scriptSig.length) {
          content = scriptSig.slice(offset + 1, offset + 1 + len).toString('utf-8');
        } else return null;
      } else if (opcode === 0x4c) {
        if (offset + 1 < scriptSig.length) {
          const len = scriptSig[offset + 1];
          if (offset + 2 + len <= scriptSig.length) {
            content = scriptSig.slice(offset + 2, offset + 2 + len).toString('utf-8');
          } else return null;
        } else return null;
      } else if (opcode === 0x4d) {
        if (offset + 3 <= scriptSig.length) {
          const len = scriptSig.readUInt16LE(offset + 1);
          if (offset + 3 + len <= scriptSig.length) {
            content = scriptSig.slice(offset + 3, offset + 3 + len).toString('utf-8');
          } else return null;
        } else return null;
      } else return null;
    }

    return { contentType, content };
  } catch (error: any) {
    logger.warn('Error parsing inscription envelope', { error: error.message });
    return null;
  }
}

/**
 * Extract inscription from transaction
 */
async function extractInscriptionFromTx(txid: string, zcashClient: ZcashClient) {
  try {
    const tx = await zcashClient.execCommandJSON('getrawtransaction', txid, 1) as any;

    if (!tx || !tx.vin || tx.vin.length === 0) {
      return null;
    }

    const firstInput = tx.vin[0];
    if (!firstInput.scriptSig || !firstInput.scriptSig.hex) {
      return null;
    }

    const inscription = parseInscriptionEnvelope(firstInput.scriptSig.hex);
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
 * Monitor address for new transactions
 */
async function monitorAddress(address: string) {
  const zcashClient = new ZcashClient();
  await zcashClient.initialize();

  console.log(`\n=== Monitoring Address: ${address} ===\n`);

  // Get all transactions for this address
  try {
    // Use listunspent to get UTXOs, then get transactions
    const unspent = await zcashClient.execCommandJSON('listunspent', 0, 9999999, [address]) as any[];
    
    console.log(`Found ${unspent.length} UTXOs for address\n`);

    // Get transaction history using getaddressdeltas or similar
    // For now, let's query recent blocks and check transactions
    const currentHeight = zcashClient.getCurrentHeight();
    console.log(`Current block height: ${currentHeight}\n`);

    // Check the specific transaction first
    const specificTxid = '8d10b5dff7aa09e7f07cdc6431dc6fd418e190ae176c22af3ba3deeebb693e8d';
    console.log(`\n=== Checking Your Transaction ===`);
    console.log(`TXID: ${specificTxid}\n`);
    
    const result = await extractInscriptionFromTx(specificTxid, zcashClient);
    
    if (result && result.inscription) {
      console.log('✅ INSCRIPTION FOUND!');
      console.log(`Content-Type: ${result.inscription.contentType}`);
      console.log(`Content: ${result.inscription.content}\n`);
      
      if (result.inscription.content.startsWith('STS|')) {
        const parts = result.inscription.content.split('|');
        console.log('Parsed STS Format:');
        parts.forEach((part, i) => {
          console.log(`  [${i}]: ${part}`);
        });
      }
    } else {
      console.log('❌ No inscription found in scriptSig');
      console.log('Trying alternative extraction...\n');
      
      // Try to get the raw transaction and inspect it
      const tx = await zcashClient.execCommandJSON('getrawtransaction', specificTxid, 1) as any;
      if (tx && tx.vin && tx.vin[0] && tx.vin[0].scriptSig) {
        console.log('ScriptSig (hex):', tx.vin[0].scriptSig.hex);
        console.log('ScriptSig (asm):', tx.vin[0].scriptSig.asm);
      }
    }

    console.log(`\n=== Monitoring for New Transactions ===`);
    console.log('Checking every 30 seconds...\n');

    let lastCheckedHeight = currentHeight;
    const processedTxids = new Set<string>([specificTxid]);

    setInterval(async () => {
      try {
        const currentHeight = zcashClient.getCurrentHeight();
        
        // Check new blocks
        for (let height = lastCheckedHeight + 1; height <= currentHeight; height++) {
          const block = await zcashClient.execCommandJSON('getblock', height, 2) as any;
          
          if (block && block.tx) {
            for (const tx of block.tx) {
              if (processedTxids.has(tx.txid)) continue;
              
              // Check if transaction has output to our address
              let hasOutput = false;
              if (tx.vout) {
                for (const output of tx.vout) {
                  if (output.scriptPubKey && output.scriptPubKey.addresses) {
                    for (const addr of output.scriptPubKey.addresses) {
                      if (addr.toLowerCase() === address.toLowerCase()) {
                        hasOutput = true;
                        break;
                      }
                    }
                  }
                }
              }
              
              if (hasOutput) {
                processedTxids.add(tx.txid);
                console.log(`\n🔔 New transaction found: ${tx.txid}`);
                
                const result = await extractInscriptionFromTx(tx.txid, zcashClient);
                if (result && result.inscription) {
                  console.log('✅ INSCRIPTION FOUND!');
                  console.log(`Content-Type: ${result.inscription.contentType}`);
                  console.log(`Content: ${result.inscription.content}`);
                } else {
                  console.log('ℹ️  Transaction found but no inscription detected');
                }
              }
            }
          }
        }
        
        lastCheckedHeight = currentHeight;
      } catch (error: any) {
        logger.warn('Error monitoring', { error: error.message });
      }
    }, 30000);

  } catch (error: any) {
    console.error('Error monitoring address:', error.message);
    logger.error('Error monitoring address', { error: error.message });
  }
}

// Main
async function main() {
  const address = process.argv[2] || TARGET_ADDRESS;
  await monitorAddress(address);
}

main().catch(console.error);

