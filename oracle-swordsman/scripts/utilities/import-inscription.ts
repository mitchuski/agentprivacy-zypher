/**
 * Import Inscription to Database
 * 
 * Parses an inscription from a transaction and creates a submission record
 * so it appears in the frontend proverbs page.
 */

import { ZcashClient } from '../../src/zcash-client';
import { db } from '../../src/database';
import logger from '../../src/logger';
import { autoDecodeProverb } from '../../src/hex-decoder';

const TXID = '8d10b5dff7aa09e7f07cdc6431dc6fd418e190ae176c22af3ba3deeebb693e8d';
const TARGET_ADDRESS = 't1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q';

/**
 * Parse STS format inscription
 * Format: STS|v01|ACT:1|E:emoji|proverb|H:hash|REF:ref
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
    if (parts.length < 6 || parts[0] !== 'STS') {
      return null;
    }

    // Parse ACT:1
    const actMatch = parts[2].match(/^ACT:(\d+)$/);
    if (!actMatch) {
      return null;
    }

    const actNumber = parseInt(actMatch[1]);
    
    // Extract emoji inscription (E:...)
    const emojiPart = parts[3];
    const emojiInscription = emojiPart.startsWith('E:') ? emojiPart.substring(2) : emojiPart;
    
    // Proverb text
    const proverbText = parts[4];
    
    // Hash (H:...)
    const hashPart = parts[5];
    const hash = hashPart.startsWith('H:') ? hashPart.substring(2) : hashPart;
    
    // Reference (REF:...)
    const refPart = parts[6] || '';
    const ref = refPart.startsWith('REF:') ? refPart.substring(4) : refPart;

    return {
      actNumber,
      emojiInscription,
      proverbText,
      hash,
      ref
    };
  } catch (error: any) {
    logger.warn('Error parsing STS inscription', { error: error.message });
    return null;
  }
}

/**
 * Map act number to act_id format used in frontend
 */
function getActId(actNumber: number): string {
  const actMap: { [key: number]: string } = {
    1: 'act-01-venice',
    2: 'act-02-dual-ceremony',
    3: 'act-03-drakes-teaching',
    4: 'act-04-blade-alone',
    5: 'act-05-light-armor',
    6: 'act-06-trust-graph',
    7: 'act-07-mirror',
    8: 'act-08-ancient-rule',
    9: 'act-09-zcash-shield',
    10: 'act-10-topology',
    11: 'act-11-sovereignty-spiral',
    12: 'act-12-forgetting',
  };
  return actMap[actNumber] || `act-${String(actNumber).padStart(2, '0')}`;
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
 * Import inscription from transaction
 */
async function importInscription(txid: string, targetAddress: string) {
  try {
    const zcashClient = new ZcashClient();
    await zcashClient.initialize();

    console.log('\n=== Importing Inscription ===');
    console.log(`TXID: ${txid}`);
    console.log(`Address: ${targetAddress}\n`);

    // Get transaction
    const tx = await zcashClient.execCommandJSON('getrawtransaction', txid, 1) as any;

    if (!tx || !tx.vin || tx.vin.length === 0) {
      console.error('Transaction not found or has no inputs');
      return;
    }

    // Extract inscription from scriptSig
    const firstInput = tx.vin[0];
    if (!firstInput.scriptSig || !firstInput.scriptSig.hex) {
      console.error('No scriptSig found in transaction');
      return;
    }

    const inscription = parseInscriptionEnvelope(firstInput.scriptSig.hex);
    
    if (!inscription || !inscription.content) {
      console.error('No inscription found in transaction');
      return;
    }

    console.log('Inscription found:');
    console.log(`  Content-Type: ${inscription.contentType}`);
    console.log(`  Content: ${inscription.content}\n`);

    // Parse STS format
    const stsData = parseSTSInscription(inscription.content);
    
    if (!stsData) {
      console.error('Failed to parse STS format');
      return;
    }

    console.log('Parsed STS Data:');
    console.log(`  Act: ${stsData.actNumber}`);
    console.log(`  Emoji: ${stsData.emojiInscription}`);
    console.log(`  Proverb (raw): ${stsData.proverbText}`);
    
    // Auto-decode hex-encoded proverb if needed
    const decodedProverb = autoDecodeProverb(stsData.proverbText);
    if (decodedProverb !== stsData.proverbText) {
      console.log(`  Proverb (decoded): ${decodedProverb}`);
    }
    
    console.log(`  Hash: ${stsData.hash}`);
    console.log(`  Ref: ${stsData.ref}\n`);

    // Get act_id
    const actId = getActId(stsData.actNumber);
    console.log(`Mapped to act_id: ${actId}\n`);

    // Check if submission already exists
    const existing = await db.getSubmissionByTrackingCode(`INS-${txid.substring(0, 16)}`);
    if (existing) {
      console.log('⚠️  Submission already exists in database');
      console.log(`  ID: ${existing.id}`);
      console.log(`  Status: ${existing.status}`);
      return;
    }

    // Create memo text in RPP-v1 format for compatibility (use decoded proverb)
    const memoText = `rpp-v1\ntale:${actId}\n${decodedProverb}`;

    // Get amount from transaction
    let amount = 0.00558; // Default from transaction explorer
    if (tx.vout && tx.vout.length > 0) {
      for (const output of tx.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          for (const addr of output.scriptPubKey.addresses) {
            if (addr.toLowerCase() === targetAddress.toLowerCase()) {
              amount = output.value || amount;
              break;
            }
          }
        }
      }
    }

    // Create submission (use decoded proverb)
    const submission = await db.createSubmission({
      tracking_code: `INS-${txid.substring(0, 16)}`,
      sender_address: targetAddress,
      proverb_text: decodedProverb,
      amount_zec: amount,
      txid: txid,
      memo_text: memoText,
    });

    console.log('✅ Submission created:');
    console.log(`  ID: ${submission.id}`);
    console.log(`  Tracking Code: ${submission.tracking_code}`);
    console.log(`  Status: ${submission.status}\n`);

    // Create verification (auto-approve inscription-based submissions)
    const verification = await db.createVerification({
      submission_id: submission.id,
      ai_provider: 'inscription',
      quality_score: 1.0, // Perfect score for onchain inscriptions
      matched_act: actId,
      reasoning: `Onchain inscription verified. Act ${stsData.actNumber} inscription with emoji: ${stsData.emojiInscription}`,
    });

    console.log('✅ Verification created:');
    console.log(`  Quality Score: ${verification.quality_score}`);
    console.log(`  Matched Act: ${verification.matched_act}\n`);

    // Update submission status to verified
    await db.updateSubmissionStatus(submission.id, 'verified');

    console.log('✅ Submission status updated to: verified\n');
    console.log('🎉 Inscription successfully imported!');
    console.log('It should now appear in the frontend proverbs page for Act 1.\n');

  } catch (error: any) {
    console.error('Error importing inscription:', error.message);
    console.error(error.stack);
    logger.error('Error importing inscription', { error: error.message });
  }
}

// Main
async function main() {
  const txid = process.argv[2] || TXID;
  const address = process.argv[3] || TARGET_ADDRESS;

  await importInscription(txid, address);
  
  process.exit(0);
}

main().catch(console.error);

