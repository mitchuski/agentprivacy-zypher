# Oracle Swordsman Inscription Flow Guide (Public)

**Last Updated:** 2025-12-03
**Protocol:** STM-rpp v01 (Swordsman to Mage Revelation Proof Protocol)

---

## CRITICAL FIXES DISCOVERED (2025-12-03)

### Fix 1: Reading Shielded Memos
**Problem:** `z_listunspent` returns garbled memos like `f6000...`
**Solution:** Use `z_listtransactions` with Account UUID (not account number!)

```javascript
// Account UUID (from wallet)
const accountUUID = '<YOUR_ACCOUNT_UUID>';

// This returns DECRYPTED memos!
const response = await axios.post('http://127.0.0.1:28232', {
  jsonrpc: '2.0',
  id: Date.now(),
  method: 'z_listtransactions',
  params: [accountUUID, 100]  // UUID, not account number!
}, { auth: { username: user, password: pass } });
```

### Fix 2: Zallet z_sendmany Parameters
**Problems & Solutions:**
- `from` parameter: Use FULL UA address, NOT account number or UUID
- `fee` parameter: MUST be `null` (Zallet calculates internally)
- `privacy` parameter: `'AllowRevealedRecipients'` for deshield

```javascript
// CORRECT z_sendmany call
z_sendmany(
  'u1...full_ua_address',  // from: FULL UA, not "0" or UUID
  [{ address: destination, amount: 0.00618034 }],
  1,                       // minconf
  null,                    // fee: MUST be null!
  'AllowRevealedRecipients' // privacy policy
)
```

### Fix 3: Bilateral Hash Formula (Oracle + Submitted)
```
H = SHA256(ORACLE_PROVERB + SUBMITTED_PROVERB)[0:16]
```

The hash binds BOTH proverbs together:
- **Oracle Proverb**: The canonical proverb from the Act's spellbook (what the Oracle knows)
- **Submitted Proverb**: The proverb submitted by the First Person (what was sent in the memo)

```javascript
// Example hash computation
const oracleProverb = spellbook.acts[actNumber].proverb;  // From spellbook
const submittedProverb = decodedMemo.proverb;              // From shielded memo
const combined = oracleProverb + submittedProverb;         // Direct concatenation
const hash = crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
```

**CRITICAL:** No separator - proverbs concatenated directly, then take first 16 hex chars!
This creates a bilateral commitment: the inscription proves the Oracle verified against the canonical source AND records the specific proverb that was submitted.

---

## Overview

This document describes the complete inscription flow for the Oracle Swordsman proverb protocol using P2SH key architecture from isolated TEE key ceremony.

---

## Key Architecture

The inscription system uses a hierarchical P2SH structure:

- **Public Key:** Available in `pubkey.txt`
- **Simple P2SH:** Base address for final inscriptions
- **Act P2SH Addresses:** Act-specific addresses with `OP_<ACT> OP_DROP` prefix

**Note:** Private keys stored securely in TEE/local environment, NEVER in code.

---

## Act P2SH Address Pattern

| Act | Redeem Script Pattern |
|-----|----------------------|
| 1-9 | `OP_<N> OP_DROP <pubkey> OP_CHECKSIG` |
| 10-12 | `OP_10/11/12 OP_DROP <pubkey> OP_CHECKSIG` |

**Opcodes:** OP_1=0x51, OP_2=0x52, ... OP_10=0x5a, OP_11=0x5b, OP_12=0x5c

---

## Complete Inscription Flow (9 Steps)

### Step 1: Craft Proverb on Frontend
- Navigate to Story page
- Select the Act number
- Craft the proverb text
- Generate emoji spell

### Step 2: Send Proverb to Oracle UA (Shielded)
User sends 0.01 ZEC to Oracle Unified Address with proverb in memo.
The Oracle UA is published on the frontend.

### Step 3: Oracle Views Incoming Transaction
Oracle uses viewing key to decrypt memo and extract proverb.
Record the incoming TXID as REF_TXID.

### Step 4: NEAR AI Verification
Call NEAR AI to compare submitted proverb with spellbook.
Record MATCH_SCORE (e.g., 0.86 for 86% match).

### Step 5: Golden Split Calculation
Split the 0.01 ZEC according to golden ratio:
- **61.8%** = 0.00618034 ZEC -> For inscription
- **38.2%** = 0.00381966 ZEC -> Protocol Fee Reserve

### Step 6: Deshield 61.8% to Act P2SH
```javascript
// Using Zallet RPC (credentials from .env)
z_sendmany(
  treasuryUA,
  [{ address: actP2SH, amount: 0.00618034 }],
  1,
  null,
  'AllowRevealedRecipients'
)
```

### Step 7: Move 38.2% to Protocol Fee Reserve
Transfer to Account 1 shielded address with `AllowLinkingAccountAddresses`.

### Step 8: Spend Act P2SH to Simple P2SH
Create transaction spending from Act P2SH to Simple P2SH:

```javascript
const UTXO = {
  txid: '<TXID_FROM_DESHIELD>',
  vout: 0,
  amount: 618034,
  scriptPubKey: '<ACT_SCRIPT_PUBKEY>',
};

const ACT_REDEEM_SCRIPT = '<ACT_REDEEM_SCRIPT>';
const SIMPLE_P2SH_SCRIPT_PUBKEY = '<SIMPLE_P2SH_SCRIPT>';
const PRIVATE_KEY_WIF = process.env.INSCRIPTION_WIF; // From .env!
```

Output: 608,034 zatoshis to Simple P2SH

### Step 9: Final Inscription Transaction
Create inscription transaction with STM-rpp envelope:

```javascript
const UTXO = {
  txid: '<TXID_FROM_STEP_8>',
  vout: 0,
  amount: 608034,
  scriptPubKey: '<SIMPLE_P2SH_SCRIPT>',
};

const INSCRIPTION_CONTENT =
  `STM-rpp[v01]|ACT:${ACT}|E:${EMOJI}|${PROVERB}|MS:${SCORE}|H:${HASH}|REF:${TXID}`;
```

Output: ~578,034 zatoshis to Treasury t-address

---

## Inscription Format (STM-rpp)

```
STM-rpp[v01]|ACT:<N>|E:<EMOJI_SPELL>|<PROVERB>|MS:<MATCH_SCORE>|H:<SHA256_HASH>|REF:<INCOMING_TXID>
```

Hash is computed from:
```javascript
const contentToHash = `STM-rpp[v01]|ACT:${ACT}|E:${EMOJI_SPELL}|${PROVERB}|MS:${MATCH_SCORE}`;
const proverbHash = crypto.createHash('sha256').update(contentToHash).digest('hex');
```

---

## Common Errors & Fixes Table

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid type: integer 0, expected a string` | Using account number `0` as `from` | Use full UA address |
| `Invalid from address: should be a taddr, zaddr, UA` | Using account UUID as `from` | Use full UA address |
| `fee field must be null` | Specifying fee amount like `10000` | Set fee to `null` |
| Garbled memo `f6000...` in z_listunspent | Wrong RPC method | Use `z_listtransactions` with UUID |
| `Insufficient balance` | Not enough shielded funds | Check balance, wait for confirms |
| Signature validation failed | Wrong UTXO scriptPubKey or key | Verify UTXO matches address JSON |

---

## Fee Structure

| Step | Fee (zatoshis) | Purpose |
|------|----------------|---------|
| Deshield | ~10,000 | z->t transaction (Zallet auto) |
| Act P2SH -> Simple P2SH | 10,000 | Intermediate hop |
| Inscription | 30,000 | ZIP-317 for larger tx |

---

## Security Notes

1. **Private keys** must NEVER be hardcoded - use environment variables
2. **RPC credentials** must be in `.env`, not in scripts
3. **Account UUIDs** are wallet-specific, do not share
4. All sensitive files are in `.gitignore`

---

## Completed Inscriptions (Hackathon)

All 12 Acts successfully inscribed on Zcash mainnet. See `docs/chronicles/` for full transaction details and verification links.

---

*Last updated: 2025-12-03*
*Protocol: STM-rpp v01 | Oracle Swordsman | Privacy Spellbook*
