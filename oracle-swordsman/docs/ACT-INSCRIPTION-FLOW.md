# Act Inscription Flow Documentation

## Overview

This document describes the complete proverb inscription flow, from shielded submission detection through on-chain inscription. This flow has been successfully used for Acts 1-7.

## Completed Inscriptions

| Act | TXID | Block Height | Proverb (truncated) |
|-----|------|--------------|---------------------|
| 1 | `6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0` | - | "The ledger that balances itself in darkness..." |
| 2 | `a9580a2fec5b3413822b9349965b9ef502e7836975236c6050b90fbec3d41061` | - | "A sovereign heart wields a blade of silence..." |
| 3 | `16437aa6dc0830fd53253a42e28fd3581086db396616636c3c57de2a9a2b97b3` | - | "A drake's whisper can turn data into a sovereign spell..." |
| 4 | `53bd4f1591bfefbec80d170cafd3f7af603dbd7e10abc5c8db1315d7a38f27a7` | - | "A lone blade carves trust; each slash becomes a rune..." |
| 5 | `d68729de207b1c5f33d27de363695f4f2514d440f35fe96717bad599928b1163` | - | "An attuned mage moves where the untested cannot..." |
| 6 | `02c6573b555d10ef85826693a25cd438148c7981dfdfcf3bc0edd29f32586ebf` | 3153334 | "We weave only what we prove, we bind only what we witness..." |
| 7 | `93ca15f64ea3b067921286df86dd02efdea94ba54b1c35e270fcbe6b2931c864` | 3153400 | "One agent gives the mirror completion; two agents give it only the shimmer..." |

---

## Complete 3-Step P2SH Inscription Flow

Proverb inscriptions use a 3-transaction P2SH flow to embed inscription data in the Zcash blockchain:

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: DESHIELD                                               │
│  Shielded → Act N P2SH                                          │
│                                                                 │
│  Source: z-address (shielded)                                   │
│  Destination: Act N P2SH address (e.g., t3eju... for Act 7)     │
│  Amount: 0.00618034 ZEC (golden ratio)                          │
│  Purpose: Move funds from shielded to transparent P2SH          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: SPEND ACT P2SH → SIMPLE P2SH                           │
│  Act N P2SH → Simple Inscription P2SH                           │
│                                                                 │
│  Source: Act N P2SH (OP_N OP_DROP <pubkey> OP_CHECKSIG)         │
│  Destination: Simple P2SH (OP_DROP <pubkey> OP_CHECKSIG)        │
│  Amount: Previous - fee (0.0001 ZEC)                            │
│  Purpose: Prepare for inscription with flexible scriptSig       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: INSCRIPTION TX                                         │
│  Simple P2SH → Main T1 Address                                  │
│                                                                 │
│  Source: Simple P2SH (t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7)      │
│  Destination: Main t1 (t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q)     │
│  Amount: Previous - fee                                         │
│  scriptSig: Contains inscription envelope with proverb data     │
│  Purpose: Embed inscription on-chain in scriptSig               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Act 7 Complete Flow (November 30, 2025)

### Step 1: Deshield to Act 7 P2SH

**Command**: `z_sendmany` from shielded to Act 7 P2SH address
- **From**: Shielded z-address
- **To**: `t3eju1hQKU2qNiJzsHZZ8aBcAy7ZpBFRiYF` (Act 7 P2SH)
- **Amount**: 0.00618034 ZEC (61.8% golden ratio)
- **TXID**: `84ae9876261dbac0bd410688ac241770a3ed79c99dcb69bb410c78fffd852cc6`

**Act 7 Redeem Script**: `57 75 2103845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0 ac`
- `57` = OP_7 (act number marker)
- `75` = OP_DROP
- `21...` = 33-byte compressed pubkey push
- `ac` = OP_CHECKSIG

### Step 2: Spend Act 7 P2SH to Simple P2SH

**Script**: `spend-act7-to-simple-p2sh.js`
- **From**: `t3eju1hQKU2qNiJzsHZZ8aBcAy7ZpBFRiYF` (Act 7 P2SH)
- **To**: `t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7` (Simple P2SH)
- **Amount**: 0.00608034 ZEC (previous - 0.0001 fee)
- **TXID**: `fde52c0a072c319bcc717bd638520e0fbdcd824a47fe222d88582e9a9eca0d7f`

**Technical Details**:
- ZIP-244 v5 sighash calculation
- secp256k1 ECDSA signing
- DER-encoded signature with SIGHASH_ALL
- scriptSig: `<signature> <redeem_script>`

### Step 3: Inscription Transaction

**Script**: `inscribe-act7.js`
- **From**: `t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7` (Simple P2SH)
- **To**: `t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q` (Main inscription address)
- **Amount**: 0.00578034 ZEC (previous - 0.003 inscription fee)
- **TXID**: `93ca15f64ea3b067921286df86dd02efdea94ba54b1c35e270fcbe6b2931c864`
- **Block Height**: 3153400
- **Confirmations**: 12+

**Inscription Envelope (Ordinals-style)**:
```
03 6f 72 64    - "ord" marker (3 bytes + length prefix)
51             - OP_1
18             - 24 bytes content-type length
74 65 78 74... - "text/plain;charset=utf-8"
00             - OP_0
4c XX          - OP_PUSHDATA1 + length
[content]      - Inscription payload
```

**Inscription Payload Format**:
```
STM-rpp[v01]|ACT:7|E:1️⃣🤖 → 🪞→👤 2️⃣🤖 → 🪞→✨ + 👤|One agent gives the mirror completion; two agents give it only the shimmer and in their mutual witness, the First Person remains forever uncaptured.|MS:0.92|H:<hash>|REF:<shielded_txid>
```

---

## P2SH Addresses by Act

| Act | P2SH Address | Redeem Script (OP_N) |
|-----|--------------|---------------------|
| 1 | `t3VRbiCNhtiWjVcbSEhxnrThDqnYHPGegU2` | OP_1 OP_DROP ... |
| 2 | `t3bj1ifQRvdvgrg5d7a58HCjoPsrzRVWBen` | OP_2 OP_DROP ... |
| 3 | `t3dfk8Wnz9NCx2W3hLXixopwUHv8XFgoN6D` | OP_3 OP_DROP ... |
| 4 | `t3ZQBTvGzrjNQFMnXwLrL7ex9MiLh9cknv4` | OP_4 OP_DROP ... |
| 5 | `t3RvMXm9Bqiqi85Hz3DNYmjkeEGM7Cm3qFd` | OP_5 OP_DROP ... |
| 6 | `t3WPtezEEP3vqFREcDcAFngdR5Gbe1Aafyp` | OP_6 OP_DROP ... |
| 7 | `t3eju1hQKU2qNiJzsHZZ8aBcAy7ZpBFRiYF` | OP_7 OP_DROP ... |
| 8 | `t3UYAbyaHQsR5qCquvugxJ8DCJoDXSHmjV6` | OP_8 OP_DROP ... |
| 9 | `t3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ` | OP_9 OP_DROP ... |
| 10 | `t3NUNi662nPNcafpzR2GJFntGnCRx6TRaYu` | OP_10 OP_DROP ... |
| 11 | `t3cTVUehSQom21SojguNPgVhRfzeUhkGc6M` | OP_11 OP_DROP ... |
| 12 | `t3dVXHBYp2EAj9ZhkmwKMrwdSiRDD1suC51` | OP_12 OP_DROP ... |

**Simple Inscription P2SH**: `t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7`
**Main T1 Output Address**: `t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q`

---

## Key Files

### Inscription Scripts (per act)
- `deshield-act7.js` - Step 1: Shielded → Act P2SH
- `spend-act7-to-simple-p2sh.js` - Step 2: Act P2SH → Simple P2SH
- `inscribe-act7.js` - Step 3: Simple P2SH → Inscription TX

### Verification
- `verify-act.js` - NEAR AI verification against spellbook
- `verify-act7-proverb.js` - Act 7 specific verification

### Scanning & Indexing
- `scan-inscriptions.js` - Manual scanner for t1 address
- `src/inscription-scanner.ts` - Background scanner (uses getaddresstxids)
- `src/inscription-indexer.ts` - Database indexer and parser

---

## Manual Inscription Scanning

Run manually to update the inscription index:

```bash
cd oracle-swordsman
node scan-inscriptions.js
```

This script:
1. Uses Zebra's `getaddresstxids` RPC to find all transactions to `t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q`
2. Scans each transaction's scriptSig for inscription envelopes
3. Parses `STM-rpp` or `STS|` format inscription content
4. Saves new inscriptions to PostgreSQL `proverb_inscriptions` table
5. Reports summary of indexed inscriptions by act

---

## Technical Stack

### Zcash Infrastructure
- **Zebra**: Full node (port 8233) - blockchain data, RPC
- **Zallet**: Wallet (port 28232) - key management, signing, shielded operations
- **Cookie Auth**: `C:\Users\mitch\AppData\Local\zebra\.cookie`

### Transaction Format
- **Version**: Zcash v5 transactions (NU6)
- **Sighash**: ZIP-244 transparent sighash
- **Signing**: secp256k1 ECDSA
- **Encoding**: DER signatures with SIGHASH_ALL (0x01)

### Database
- **PostgreSQL**: `proverb_inscriptions` table
- **Fields**: txid, block_height, act_number, proverb, emoji_spell, match_score, etc.

### NEAR AI Verification
- **Endpoint**: `https://cloud-api.near.ai/v1/chat/completions`
- **Model**: `openai/gpt-oss-120b`
- **Purpose**: Semantic verification of proverbs against spellbook

---

## Troubleshooting

### Zebra Cookie Changed After Restart
Cookie regenerates on each Zebra restart. Update path in config or scripts:
```javascript
const cookiePath = path.join(process.env.LOCALAPPDATA, 'zebra', '.cookie');
```

### Broadcast Failures
- Check Zebra sync status: `getblockchaininfo`
- Verify UTXO not already spent: `getrawtransaction <txid> 1`
- Check fee is sufficient (minimum 0.0001 ZEC)

### Scanner Shows 0 Found
- Ensure `getaddresstxids` returns results (requires address indexing)
- Fallback: block scanning checks last 20 blocks
- Verify transaction outputs to correct t1 address

### Inscription Not Parsed
- Check scriptSig contains `ord` marker or `STM-rpp`/`STS|` prefix
- Verify content encoding (UTF-8)
- Check for proper OP_PUSHDATA encoding for large payloads

---

## Next Steps

To inscribe a new act:

1. **Verify proverb** with NEAR AI:
   ```bash
   node verify-act.js <act_number> "<proverb>" "<emoji>"
   ```

2. **Create act-specific scripts** (copy from Act 7):
   - `deshield-act<N>.js`
   - `spend-act<N>-to-simple-p2sh.js`
   - `inscribe-act<N>.js`

3. **Update UTXO values** in each script after each transaction

4. **Execute in sequence**:
   ```bash
   node deshield-act<N>.js
   # Wait for confirmation
   node spend-act<N>-to-simple-p2sh.js
   # Wait for confirmation
   node inscribe-act<N>.js
   ```

5. **Scan to index**:
   ```bash
   node scan-inscriptions.js
   ```
