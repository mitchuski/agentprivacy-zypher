/**
 * Extract Inscription from Transaction
 * 
 * Queries a Zcash transaction and extracts Ordinals-style inscription data
 * from the scriptSig (Zerdinals format).
 */

import { ZcashClient } from '../../src/zcash-client';
import logger from '../../src/logger';

const TXID = '8d10b5dff7aa09e7f07cdc6431dc6fd418e190ae176c22af3ba3deeebb693e8d';
const TARGET_ADDRESS = 't1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q';

/**
 * Parse Ordinals inscription envelope from scriptSig
 * Format: <push "ord"> OP_1 <push content-type> OP_0 <push content>
 */
function parseInscriptionEnvelope(scriptSigHex: string): { contentType: string; content: string } | null {
  try {
    const scriptSig = Buffer.from(scriptSigHex, 'hex');
    
    // Find "ord" marker anywhere in the scriptSig (it comes after signature/pubkey)
    const ordMarker = Buffer.from('ord');
    let ordOffset = -1;
    
    // Search for "ord" pattern: push opcode (0x03) followed by "ord" bytes
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
    
    // Start parsing from the push opcode before "ord"
    let offset = ordOffset;
    
    // Skip the push opcode (0x03) and "ord" bytes
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
        // OP_PUSHDATA1
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
            offset += 1 + len;
          } else {
            return null;
          }
        } else if (contentOpcode === 0x4c) {
          // OP_PUSHDATA1
          if (offset + 1 < scriptSig.length) {
            const len = scriptSig[offset + 1];
            if (offset + 2 + len <= scriptSig.length) {
              content = scriptSig.slice(offset + 2, offset + 2 + len).toString('utf-8');
              offset += 2 + len;
            } else {
              return null;
            }
          } else {
            return null;
          }
        } else if (contentOpcode === 0x4d) {
          // OP_PUSHDATA2 - length is little-endian 16-bit
          if (offset + 3 <= scriptSig.length) {
            const len = scriptSig.readUInt16LE(offset + 1);
            if (offset + 3 + len <= scriptSig.length) {
              content = scriptSig.slice(offset + 3, offset + 3 + len).toString('utf-8');
              offset += 3 + len;
            } else {
              // Try to read what we can
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
 * Extract inscription from transaction scriptSig
 */
async function extractInscription(txid: string, targetAddress: string) {
  try {
    const zcashClient = new ZcashClient();
    await zcashClient.initialize();

    // Get raw transaction with full details
    const tx = await zcashClient.execCommandJSON('getrawtransaction', txid, 1) as any;

    if (!tx) {
      console.error('Transaction not found:', txid);
      return;
    }

    console.log('\n=== Transaction Details ===');
    console.log('TXID:', txid);
    console.log('Block Height:', tx.height || 'Unconfirmed');
    console.log('Confirmations:', tx.confirmations || 0);
    console.log('Time:', tx.time ? new Date(tx.time * 1000).toISOString() : 'Unknown');

    // Check if transaction has inputs
    if (!tx.vin || tx.vin.length === 0) {
      console.error('No inputs found in transaction');
      return;
    }

    // Check outputs for target address
    let foundOutput = false;
    if (tx.vout && tx.vout.length > 0) {
      for (const output of tx.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          for (const addr of output.scriptPubKey.addresses) {
            if (addr.toLowerCase() === targetAddress.toLowerCase()) {
              foundOutput = true;
              console.log('\n=== Output to Target Address ===');
              console.log('Address:', addr);
              console.log('Amount:', output.value, 'ZEC');
              break;
            }
          }
        }
      }
    }

    if (!foundOutput) {
      console.warn('\nWarning: Transaction does not have output to target address:', targetAddress);
    }

    // Extract inscription from first input's scriptSig
    console.log('\n=== Extracting Inscription ===');
    const firstInput = tx.vin[0];
    
    if (!firstInput.scriptSig || !firstInput.scriptSig.hex) {
      console.error('No scriptSig found in first input');
      return;
    }

    const scriptSigHex = firstInput.scriptSig.hex;
    console.log('ScriptSig (hex):', scriptSigHex);
    console.log('ScriptSig (asm):', firstInput.scriptSig.asm);

    // Parse inscription envelope
    const inscription = parseInscriptionEnvelope(scriptSigHex);

    if (inscription) {
      console.log('\n=== Inscription Found! ===');
      console.log('Content-Type:', inscription.contentType);
      console.log('Content:', inscription.content);
      
      // Parse STS format if applicable
      if (inscription.content.startsWith('STS|')) {
        const parts = inscription.content.split('|');
        console.log('\n=== Parsed STS Format ===');
        parts.forEach((part, i) => {
          console.log(`  [${i}]:`, part);
        });
      }
    } else {
      console.log('\n=== No Inscription Found ===');
      console.log('The scriptSig does not contain an Ordinals-style inscription envelope.');
      console.log('This might be:');
      console.log('  - A different inscription format');
      console.log('  - A regular transaction without inscription');
      console.log('\nTrying alternative extraction methods...');
      
      // Try to extract any readable text from scriptSig
      const scriptSig = Buffer.from(scriptSigHex, 'hex');
      // Look for UTF-8 strings in the scriptSig
      let textFound = false;
      for (let i = 0; i < scriptSig.length - 3; i++) {
        // Look for "STS" marker
        if (scriptSig[i] === 0x53 && scriptSig[i + 1] === 0x54 && scriptSig[i + 2] === 0x53) {
          // Try to extract string from here
          let end = i;
          while (end < scriptSig.length && scriptSig[end] >= 0x20 && scriptSig[end] <= 0x7E) {
            end++;
          }
          if (end > i + 10) {
            const text = scriptSig.slice(i, end).toString('utf-8');
            console.log('\nFound text in scriptSig:', text);
            textFound = true;
            break;
          }
        }
      }
      
      if (!textFound) {
        console.log('Could not extract readable text from scriptSig.');
      }
    }

    // Also check OP_RETURN outputs (alternative inscription method)
    console.log('\n=== Checking OP_RETURN Outputs ===');
    if (tx.vout && tx.vout.length > 0) {
      for (let i = 0; i < tx.vout.length; i++) {
        const output = tx.vout[i];
        if (output.scriptPubKey && output.scriptPubKey.asm) {
          if (output.scriptPubKey.asm.startsWith('OP_RETURN')) {
            console.log(`OP_RETURN found in output ${i}:`, output.scriptPubKey.asm);
            const parts = output.scriptPubKey.asm.split(' ');
            if (parts.length > 1) {
              const hexData = parts.slice(1).join('');
              try {
                const text = Buffer.from(hexData, 'hex').toString('utf-8');
                console.log('  Decoded text:', text);
              } catch {
                console.log('  Hex data:', hexData);
              }
            }
          }
        }
      }
    }

  } catch (error: any) {
    console.error('Error extracting inscription:', error.message);
    console.error(error.stack);
  }
}

// Main
async function main() {
  const txid = process.argv[2] || TXID;
  const address = process.argv[3] || TARGET_ADDRESS;

  console.log('Extracting inscription from transaction...');
  console.log('TXID:', txid);
  console.log('Target Address:', address);
  console.log('');

  await extractInscription(txid, address);
  
  process.exit(0);
}

main().catch(console.error);

