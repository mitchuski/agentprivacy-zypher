/**
 * Manual Inscription Scanner
 *
 * Scans the main t1 address for inscription transactions and adds them to the database.
 * Uses Zebra's getaddresstxids RPC which is confirmed to work.
 *
 * Usage: node scan-inscriptions.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const ZEBRA_RPC = 'http://127.0.0.1:8233';
const MAIN_T1_ADDRESS = 't1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av';  // New treasury (2025-12-02)
const LEGACY_T1_ADDRESS = 't1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q'; // Legacy (rotated)
const DATABASE_URL = process.env.DATABASE_URL;

// Act titles from spellbook
const ACT_TITLES = {
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

// PRIMARY Act P2SH addresses for NEW inscriptions
const ACT_P2SH_ADDRESSES = {
  1: 't3gLXGanUTif8WLpX7EZXtR3kX5f1ZoWuUT',
  2: 't3UpuXZq8CrX2EubNYVDKo4nWRXbyZ5wVUV',
  3: 't3PPLb9EbeqSyzQwQgKwF9ugQNeFBxHtfeX',
  4: 't3hiQfbJ5K45qmm4H1Q6N6CZD3AoppyS63g',
  5: 't3fepr2dZh1xPEtZLf575kBBGNQa1U4AhuC',
  6: 't3UrTbeMjjUUbccNKCSEn9qfBRB3jJVF7A6',
  7: 't3cnddicBRoJDHPqU2NbHdArz7Cd9xEZ9Hs',
  8: 't3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD',
  9: 't3cY6cRjiba4k3vu2vnKEGBBZWwA21zn6tg',
  10: 't3MYZJnESAw7tqwcECB611NLEZA6N51YPLj',
  11: 't3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R',
  12: 't3aQzhfwgvocsrHt9fskS7htBc5brkWFVBm',
};

// LEGACY Act P2SH addresses (rotated key - still scan for historical)
const LEGACY_ACT_P2SH_ADDRESSES = {
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

async function getZebraCookie() {
  const cookiePath = path.join(process.env.LOCALAPPDATA || '', 'zebra', '.cookie');
  try {
    return fs.readFileSync(cookiePath, 'utf8').trim();
  } catch {
    throw new Error('Could not find Zebra cookie file at ' + cookiePath);
  }
}

async function zebraRpc(method, params = []) {
  const cookie = await getZebraCookie();
  const [user, pass] = cookie.split(':');
  const response = await axios.post(ZEBRA_RPC, {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  }, {
    auth: { username: user, password: pass },
    timeout: 30000
  });
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.result;
}

/**
 * Parse STM-rpp inscription content
 */
function parseInscriptionContent(content) {
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

    if (content.startsWith('STM-rpp[')) {
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
          proverb = part;
        }
      }
    } else if (content.startsWith('STS|')) {
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
    console.error('Failed to parse inscription content:', error.message);
    return null;
  }
}

/**
 * Extract inscription content from scriptSig
 */
function extractInscriptionFromScriptSig(scriptSigHex) {
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
      let pos = ordIndex + 4;
      if (pos < buffer.length && buffer[pos] === 0x51) pos++;
      if (pos < buffer.length) {
        const ctLen = buffer[pos];
        pos += 1 + ctLen;
      }
      if (pos < buffer.length && buffer[pos] === 0x00) pos++;
      if (pos < buffer.length) {
        let contentLen = buffer[pos];
        pos++;
        if (contentLen === 0x4c && pos < buffer.length) {
          contentLen = buffer[pos];
          pos++;
        } else if (contentLen === 0x4d && pos + 1 < buffer.length) {
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
          let endIdx = i;
          while (endIdx < buffer.length && buffer[endIdx] !== 0x00) {
            if (buffer[endIdx] === 0x75 || buffer[endIdx] === 0xac) break;
            endIdx++;
          }
          const content = buffer.slice(i, endIdx).toString('utf-8');
          if (content.includes('|') && (content.includes('ACT:') || content.includes('ACT'))) {
            const cleaned = content.replace(/[\x00-\x1f]/g, '').trim();
            return cleaned;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to extract inscription from scriptSig:', error.message);
    return null;
  }
}

/**
 * Scan a transaction for inscription content
 */
async function scanTransactionForInscription(txid) {
  try {
    const tx = await zebraRpc('getrawtransaction', [txid, 1]);

    if (!tx || !tx.vin || tx.vin.length === 0) {
      return null;
    }

    for (const vin of tx.vin) {
      if (!vin.scriptSig || !vin.scriptSig.hex) continue;

      const content = extractInscriptionFromScriptSig(vin.scriptSig.hex);
      if (!content) continue;

      const parsed = parseInscriptionContent(content);
      if (!parsed) continue;

      const info = await zebraRpc('getblockchaininfo');
      const currentHeight = info.blocks;
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
    console.error('Error scanning transaction', txid, ':', error.message);
    return null;
  }
}

async function main() {
  console.log('=== Manual Inscription Scanner ===\n');
  console.log('Target address:', MAIN_T1_ADDRESS);
  console.log('');

  // Connect to database
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }

  // Ensure table exists
  await pool.query(`
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

  // Get all transactions to both main and legacy addresses
  console.log('\nFetching transactions via getaddresstxids...');
  const mainTxids = await zebraRpc('getaddresstxids', [{ addresses: [MAIN_T1_ADDRESS] }]);
  console.log(`Found ${mainTxids.length} transactions to new treasury`);

  const legacyTxids = await zebraRpc('getaddresstxids', [{ addresses: [LEGACY_T1_ADDRESS] }]);
  console.log(`Found ${legacyTxids.length} transactions to legacy treasury`);

  // Combine and dedupe
  const txids = [...new Set([...mainTxids, ...legacyTxids])];
  console.log(`Total unique transactions: ${txids.length}\n`);

  // Check which are already in the database
  const existingResult = await pool.query('SELECT txid FROM proverb_inscriptions');
  const existingTxids = new Set(existingResult.rows.map(r => r.txid));
  console.log(`Already indexed: ${existingTxids.size} inscriptions\n`);

  let scanned = 0;
  let found = 0;
  let errors = 0;

  for (const txid of txids) {
    if (existingTxids.has(txid)) {
      continue; // Skip already indexed
    }

    scanned++;
    console.log(`Scanning ${txid}...`);

    try {
      const inscription = await scanTransactionForInscription(txid);

      if (inscription) {
        // Save to database
        await pool.query(
          `INSERT INTO proverb_inscriptions
            (txid, block_height, block_time, act_number, act_title, proverb,
             emoji_spell, match_score, content_hash, ref_txid, raw_content,
             source_address, confirmations)
          VALUES ($1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (txid) DO UPDATE SET
            confirmations = $13,
            block_height = COALESCE(proverb_inscriptions.block_height, $2)`,
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

        found++;
        console.log(`  -> Found ACT ${inscription.actNumber}: ${inscription.proverb.substring(0, 50)}...`);
      } else {
        console.log(`  -> No inscription found`);
      }
    } catch (error) {
      errors++;
      console.error(`  -> Error: ${error.message}`);
    }
  }

  console.log('\n=== Scan Complete ===');
  console.log(`Scanned: ${scanned} new transactions`);
  console.log(`Found: ${found} inscriptions`);
  console.log(`Errors: ${errors}`);

  // Show current state
  const countResult = await pool.query(`
    SELECT act_number, COUNT(*) as count
    FROM proverb_inscriptions
    GROUP BY act_number
    ORDER BY act_number
  `);

  console.log('\n=== Current Inscription Index ===');
  for (const row of countResult.rows) {
    const title = ACT_TITLES[row.act_number] || `Act ${row.act_number}`;
    console.log(`ACT ${row.act_number} - ${title}: ${row.count} inscription(s)`);
  }

  const totalResult = await pool.query('SELECT COUNT(*) as total FROM proverb_inscriptions');
  console.log(`\nTotal inscriptions: ${totalResult.rows[0].total}`);

  await pool.end();
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
