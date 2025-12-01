/**
 * Proverb Inscription Indexer
 *
 * Listens to all 12 Act P2SH addresses for inscription transactions.
 * Supports multiple inscriptions per act.
 * Decodes STM-rpp inscription envelopes from scriptSig.
 *
 * Inscription Format: STM-rpp[v01]|ACT:<n>|E:<emoji>|<proverb>|MS:<score>|H:<hash>|REF:<txid>
 */

import axios from 'axios';
import { Pool } from 'pg';
import logger from './logger';
import { config } from './config';
import { hexToText } from './hex-decoder';

// Act P2SH addresses for inscription detection (all 12 acts)
export const ACT_P2SH_ADDRESSES: Record<number, string> = {
  1: 't3VRbiCNhtiWjVcbSEhxnrThDqnYHPGegU2',
  2: 't3bj1ifQRvdvgrg5d7a58HCjoPsrzRVWBen',
  3: 't3dfk8Wnz9NCx2W3hLXixopwUHv8XFgoN6D',
  4: 't3ZQBTvGzrjNQFMnXwLrL7ex9MiLh9cknv4',
  5: 't3RvMXm9Bqiqi85Hz3DNYmjkeEGM7Cm3qFd',
  6: 't3WPtezEEP3vqFREcDcAFngdR5Gbe1Aafyp',
  7: 't3eju1hQKU2qNiJzsHZZ8aBcAy7ZpBFRiYF',
  8: 't3UYAbyaHQsR5qCquvugxJ8DCJoDXSHmjV6',
  9: 't3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ',
  10: 't3NUNi662nPNcafpzR2GJFntGnCRx6TRaYu',
  11: 't3cTVUehSQom21SojguNPgVhRfzeUhkGc6M',
  12: 't3dVXHBYp2EAj9ZhkmwKMrwdSiRDD1suC51',
};

// Reverse lookup: address -> act number
export const ADDRESS_TO_ACT: Record<string, number> = Object.fromEntries(
  Object.entries(ACT_P2SH_ADDRESSES).map(([act, addr]) => [addr, parseInt(act)])
);

// Main t1 address that receives inscription outputs
export const MAIN_T1_ADDRESS = 't1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q';

// Act titles from spellbook
export const ACT_TITLES: Record<number, string> = {
  1: "Venice, 1494 / The Drake's First Whisper",
  2: 'The Dual Ceremony / Sovereignty Divided to Be Extended',
  3: "The Drake's Teaching / A Tale of Conditions",
  4: 'The Blade Alone / First Adventures',
  5: 'Light Armor / Multi-Site Coordination',
  6: 'Trust Graph Plane / Where Agents Gather',
  7: 'The Mirror That Never Completes / The Anti-Mirror',
  8: 'The Ancient Rule / Two-of-Three Locks',
  9: 'Zcash Shield / Forging Cryptographic Privacy',
  10: 'Topology of Revelation / Triangle Geometry',
  11: 'Balanced Spiral of Sovereignty / The Golden Ratio',
  12: 'The Forgetting / Proverbiogenesis',
};

export interface ParsedInscription {
  version: string;
  actNumber: number;
  emojiSpell: string;
  proverb: string;
  matchScore: number;
  contentHash: string;
  refTxid: string;
  rawContent: string;
}

export interface IndexedInscription {
  txid: string;
  blockHeight: number;
  blockTime: number;
  actNumber: number;
  actTitle: string;
  proverb: string;
  emojiSpell: string;
  matchScore: number;
  contentHash: string;
  refTxid: string;
  rawContent: string;
  sourceAddress: string;
  confirmations: number;
}

/**
 * Parse STM-rpp inscription content
 */
export function parseInscriptionContent(content: string): ParsedInscription | null {
  try {
    // Format: STM-rpp[v01]|ACT:<n>|E:<emoji>|<proverb>|MS:<score>|H:<hash>|REF:<txid>
    // Also support older STS|v01 format
    if (!content.startsWith('STM-rpp[') && !content.startsWith('STS|')) {
      return null;
    }

    const parts = content.split('|');
    if (parts.length < 4) {
      return null;
    }

    let version = 'v01';
    let actNumber = 0;
    let emojiSpell = '';
    let proverb = '';
    let matchScore = 0;
    let contentHash = '';
    let refTxid = '';

    // Parse based on format
    if (content.startsWith('STM-rpp[')) {
      // New format: STM-rpp[v01]|ACT:<n>|E:<emoji>|<proverb>|MS:<score>|H:<hash>|REF:<txid>
      const versionMatch = parts[0].match(/STM-rpp\[([^\]]+)\]/);
      version = versionMatch ? versionMatch[1] : 'v01';

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('ACT:')) {
          actNumber = parseInt(part.slice(4)) || 0;
        } else if (part.startsWith('E:')) {
          emojiSpell = part.slice(2);
        } else if (part.startsWith('MS:')) {
          matchScore = parseFloat(part.slice(3)) || 0;
        } else if (part.startsWith('H:')) {
          contentHash = part.slice(2);
        } else if (part.startsWith('REF:')) {
          refTxid = part.slice(4);
        } else if (!part.includes(':') && part.length > 10) {
          // This is likely the proverb text
          proverb = part;
        }
      }
    } else if (content.startsWith('STS|')) {
      // Old format: STS|v01|ACT:1|<proverb>
      version = parts[1] || 'v01';
      const actMatch = parts[2]?.match(/ACT:(\d+)/);
      actNumber = actMatch ? parseInt(actMatch[1]) : 0;
      proverb = parts.slice(3).join('|');
    }

    if (actNumber === 0 || !proverb) {
      return null;
    }

    return {
      version,
      actNumber,
      emojiSpell,
      proverb,
      matchScore,
      contentHash,
      refTxid,
      rawContent: content,
    };
  } catch (error) {
    logger.warn('Failed to parse inscription content', { error, content });
    return null;
  }
}

/**
 * Extract inscription content from scriptSig
 * Looks for:
 * 1. Ordinals-style envelope: <ord> OP_1 <content-type> OP_0 <content>
 * 2. Direct STM-rpp or STS| content in script
 */
export function extractInscriptionFromScriptSig(scriptSigHex: string): string | null {
  try {
    const buffer = Buffer.from(scriptSigHex, 'hex');

    // Method 1: Look for "ord" marker (Ordinals-style envelope)
    const ordMarker = Buffer.from('ord');
    let ordIndex = -1;

    for (let i = 0; i < buffer.length - 3; i++) {
      if (buffer[i] === 0x03 && buffer.slice(i + 1, i + 4).equals(ordMarker)) {
        ordIndex = i;
        break;
      }
    }

    if (ordIndex !== -1) {
      // Parse Ordinals envelope
      let pos = ordIndex + 4; // Skip length byte + 'ord'

      // Skip OP_1
      if (pos < buffer.length && buffer[pos] === 0x51) pos++;

      // Skip content-type push
      if (pos < buffer.length) {
        const ctLen = buffer[pos];
        pos += 1 + ctLen;
      }

      // Skip OP_0
      if (pos < buffer.length && buffer[pos] === 0x00) pos++;

      // Get content
      if (pos < buffer.length) {
        let contentLen = buffer[pos];
        pos++;

        if (contentLen === 0x4c && pos < buffer.length) {
          // OP_PUSHDATA1
          contentLen = buffer[pos];
          pos++;
        } else if (contentLen === 0x4d && pos + 1 < buffer.length) {
          // OP_PUSHDATA2
          contentLen = buffer.readUInt16LE(pos);
          pos += 2;
        }

        if (pos + contentLen <= buffer.length) {
          const content = buffer.slice(pos, pos + contentLen).toString('utf-8');
          if (content.includes('STM-rpp') || content.includes('STS|')) {
            return content;
          }
        }
      }
    }

    // Method 2: Look for STM-rpp or STS| directly in the script
    const markers = ['STM-rpp', 'STS|'];
    for (const marker of markers) {
      const markerBuf = Buffer.from(marker);
      for (let i = 0; i < buffer.length - markerBuf.length; i++) {
        if (buffer.slice(i, i + markerBuf.length).equals(markerBuf)) {
          // Found marker, extract content until we hit a null byte or end
          let endIdx = i;
          while (endIdx < buffer.length && buffer[endIdx] !== 0x00) {
            // Stop at opcodes that would indicate end of data
            if (buffer[endIdx] === 0x75 || buffer[endIdx] === 0xac) break;
            endIdx++;
          }

          const content = buffer.slice(i, endIdx).toString('utf-8');
          // Validate it looks like inscription content
          if (content.includes('|') && (content.includes('ACT:') || content.includes('ACT'))) {
            // Clean up any trailing garbage
            const cleaned = content.replace(/[\x00-\x1f]/g, '').trim();
            return cleaned;
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn('Failed to extract inscription from scriptSig', { error });
    return null;
  }
}

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
 * Get transaction details from Zebra
 */
async function getTransaction(txid: string): Promise<any> {
  return zebraRpc('getrawtransaction', [txid, 1]);
}

/**
 * Get current block height
 */
async function getBlockHeight(): Promise<number> {
  const info = await zebraRpc('getblockchaininfo');
  return info.blocks;
}

/**
 * Scan a transaction for inscription content
 */
export async function scanTransactionForInscription(txid: string): Promise<IndexedInscription | null> {
  try {
    const tx = await getTransaction(txid);

    if (!tx || !tx.vin || tx.vin.length === 0) {
      return null;
    }

    // Check each input's scriptSig for inscription
    for (const vin of tx.vin) {
      if (!vin.scriptSig || !vin.scriptSig.hex) continue;

      const content = extractInscriptionFromScriptSig(vin.scriptSig.hex);
      if (!content) continue;

      const parsed = parseInscriptionContent(content);
      if (!parsed) continue;

      // Found valid inscription
      const currentHeight = await getBlockHeight();
      const confirmations = tx.confirmations || (currentHeight - (tx.height || currentHeight));

      return {
        txid: tx.txid,
        blockHeight: tx.height || 0,
        blockTime: tx.blocktime || tx.time || Math.floor(Date.now() / 1000),
        actNumber: parsed.actNumber,
        actTitle: ACT_TITLES[parsed.actNumber] || `Act ${parsed.actNumber}`,
        proverb: parsed.proverb,
        emojiSpell: parsed.emojiSpell,
        matchScore: parsed.matchScore,
        contentHash: parsed.contentHash,
        refTxid: parsed.refTxid,
        rawContent: parsed.rawContent,
        sourceAddress: ACT_P2SH_ADDRESSES[parsed.actNumber] || '',
        confirmations,
      };
    }

    return null;
  } catch (error) {
    logger.warn('Error scanning transaction for inscription', { txid, error });
    return null;
  }
}

/**
 * Get transactions for a specific address using Zebra RPC
 * Returns TXIDs of transactions involving the address
 */
async function getAddressTransactions(address: string): Promise<string[]> {
  try {
    // Use getaddresstxids if available (requires addressindex)
    const txids = await zebraRpc('getaddresstxids', [{ addresses: [address] }]);
    return txids || [];
  } catch (error) {
    // Fallback: addressindex may not be enabled
    logger.debug('getaddresstxids not available, using fallback', { address });
    return [];
  }
}

/**
 * InscriptionIndexer class for managing inscription scanning
 */
export class InscriptionIndexer {
  private pool: Pool;
  private isScanning: boolean = false;
  private lastScannedHeight: number = 0;

  constructor() {
    this.pool = new Pool({ connectionString: config.database.url });
  }

  /**
   * Initialize database table for inscriptions if not exists
   */
  async initializeTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS proverb_inscriptions (
        id SERIAL PRIMARY KEY,
        txid VARCHAR(64) UNIQUE NOT NULL,
        block_height INTEGER,
        block_time TIMESTAMP,
        act_number INTEGER NOT NULL,
        act_title VARCHAR(255),
        proverb TEXT NOT NULL,
        emoji_spell VARCHAR(255),
        match_score DECIMAL(4,3),
        content_hash VARCHAR(64),
        ref_txid VARCHAR(64),
        raw_content TEXT,
        source_address VARCHAR(64),
        confirmations INTEGER DEFAULT 0,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on act_number for faster queries
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_proverb_inscriptions_act
      ON proverb_inscriptions(act_number)
    `);

    logger.info('Proverb inscriptions table initialized');
  }

  /**
   * Save inscription to database
   */
  async saveInscription(inscription: IndexedInscription): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO proverb_inscriptions
        (txid, block_height, block_time, act_number, act_title, proverb,
         emoji_spell, match_score, content_hash, ref_txid, raw_content,
         source_address, confirmations)
      VALUES ($1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (txid) DO UPDATE SET
        confirmations = $13,
        block_height = COALESCE(proverb_inscriptions.block_height, $2)
    `,
      [
        inscription.txid,
        inscription.blockHeight,
        inscription.blockTime,
        inscription.actNumber,
        inscription.actTitle,
        inscription.proverb,
        inscription.emojiSpell,
        inscription.matchScore,
        inscription.contentHash,
        inscription.refTxid,
        inscription.rawContent,
        inscription.sourceAddress,
        inscription.confirmations,
      ]
    );

    logger.info('Saved inscription', { txid: inscription.txid, act: inscription.actNumber });
  }

  /**
   * Get all inscriptions from database
   */
  async getInscriptions(actNumber?: number): Promise<IndexedInscription[]> {
    let query = `SELECT * FROM proverb_inscriptions`;
    const params: any[] = [];

    if (actNumber) {
      query += ` WHERE act_number = $1`;
      params.push(actNumber);
    }

    query += ` ORDER BY act_number ASC, block_height DESC`;

    const result = await this.pool.query(query, params);

    return result.rows.map((row) => ({
      txid: row.txid,
      blockHeight: row.block_height,
      blockTime: row.block_time ? Math.floor(new Date(row.block_time).getTime() / 1000) : 0,
      actNumber: row.act_number,
      actTitle: row.act_title,
      proverb: row.proverb,
      emojiSpell: row.emoji_spell,
      matchScore: parseFloat(row.match_score) || 0,
      contentHash: row.content_hash,
      refTxid: row.ref_txid,
      rawContent: row.raw_content,
      sourceAddress: row.source_address,
      confirmations: row.confirmations,
    }));
  }

  /**
   * Scan all Act P2SH addresses for inscription transactions
   */
  async scanAllAddresses(): Promise<number> {
    let count = 0;

    for (const [actNum, address] of Object.entries(ACT_P2SH_ADDRESSES)) {
      try {
        const txids = await getAddressTransactions(address);
        logger.info(`Found ${txids.length} transactions for Act ${actNum}`, { address });

        for (const txid of txids) {
          // Check if already indexed
          const existing = await this.pool.query(
            'SELECT txid FROM proverb_inscriptions WHERE txid = $1',
            [txid]
          );

          if (existing.rows.length > 0) continue;

          // Scan transaction
          const inscription = await scanTransactionForInscription(txid);
          if (inscription) {
            await this.saveInscription(inscription);
            count++;
          }
        }
      } catch (error) {
        logger.warn(`Error scanning Act ${actNum} address`, { address, error });
      }
    }

    return count;
  }

  /**
   * Add a specific TXID to index
   */
  async addInscription(txid: string): Promise<IndexedInscription | null> {
    const inscription = await scanTransactionForInscription(txid);
    if (inscription) {
      await this.saveInscription(inscription);
      return inscription;
    }
    return null;
  }

  /**
   * Get inscription count by act
   */
  async getCountByAct(): Promise<Record<number, number>> {
    const result = await this.pool.query(`
      SELECT act_number, COUNT(*) as count
      FROM proverb_inscriptions
      GROUP BY act_number
      ORDER BY act_number
    `);

    const counts: Record<number, number> = {};
    for (const row of result.rows) {
      counts[row.act_number] = parseInt(row.count);
    }
    return counts;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const inscriptionIndexer = new InscriptionIndexer();

// Helper function to get all inscriptions (for API)
export async function getAllInscriptions(): Promise<IndexedInscription[]> {
  return inscriptionIndexer.getInscriptions();
}
