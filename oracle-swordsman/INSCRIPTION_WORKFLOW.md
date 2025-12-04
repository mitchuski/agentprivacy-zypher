# Story Spellbook Inscription Workflow

## Overview

Each Act inscription follows a 3-step flow using the Zerdinals pattern:

```
Shielded Pool → Act-specific P2SH → Simple P2SH → Inscription TX
```

## Key Addresses

| Address | Type | Purpose |
|---------|------|---------|
| `LEGACY - see docs/security` | Simple P2SH | Inscription source (OP_DROP pattern) |
| `t1J6DrkJKovnYfvQoYBWCEAakScdJ8bHBCJ | Treasury t1 | Change/recirculation address |
| See `act-p2sh-addresses.txt` | Act P2SH | Act-specific funding addresses |

## Private Key

**WIF:** `ROTATED - See docs/security/KEY_ROTATION_PROCESS.md`
**Public Key:** `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223`

## Inscription Format (STM-rpp)

```
STM-rpp[v01]|ACT:<N>|E:<emoji_spell>|<submitted_proverb>|H:<sha256(submitted+official)>|REF:<act1_txid>
```

- **STM-rpp**: Swordsman to Mage revelation proof protocol
- **ACT**: Act number
- **E**: Emoji spell from the shielded memo
- **Submitted proverb**: The proverb sent in the shielded memo (publicly revealed)
- **H**: SHA256 hash of (submitted || official) - proves match without revealing official
- **REF**: Reference to Act 1 inscription TXID

## Step-by-Step Process

### Step 1: Fund Act-specific P2SH (via Zallet)

Deshield funds to the Act N P2SH address using `z_sendmany`:

```bash
# From Zallet or wallet RPC
z_sendmany "<source_UA>" '[{"address":"<act_N_p2sh>","amount":0.0055}]' 1 null "AllowRevealedRecipients"
```

Act P2SH addresses (from `act-p2sh-addresses.txt`):
- Act 1: `t3gLXGanUTif8WLpX7EZXtR3kX5f1ZoWuUT` (NEW)
- Act 2: `t3UpuXZq8CrX2EubNYVDKo4nWRXbyZ5wVUV` (NEW)
- Act 3: `t3PPLb9EbeqSyzQwQgKwF9ugQNeFBxHtfeX` (NEW)
- etc.

### Step 2: Spend to Simple P2SH

Update and run `spend-act2-to-simple-p2sh.js` (copy for each act):

**Required updates:**
```javascript
const UTXO = {
  txid: '<funding_txid_from_step1>',
  vout: 0,
  amount: <amount_in_satoshis>,
  scriptPubKey: '<act_N_scriptPubKey>',  // From act-p2sh-addresses.txt
};

const ACT_REDEEM_SCRIPT = '<act_N_redeem_script>';  // From act-p2sh-addresses.txt
```

**Redeem scripts by Act:**
- Act 1: `51752103845d673f...ac` (OP_1 OP_DROP)
- Act 2: `52752103845d673f...ac` (OP_2 OP_DROP)
- Act 3: `53752103845d673f...ac` (OP_3 OP_DROP)
- Pattern: `<0x50+N>752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac`

### Step 3: Inscribe from Simple P2SH

Update and run `inscribe-act2.js` (copy for each act):

**Required updates:**
```javascript
const UTXO = {
  txid: '<txid_from_step2>',
  vout: 0,
  amount: <amount_from_step2>,
  scriptPubKey: 'a914a034f7e36f40b507f0260a5fa6398e6c859cde5787',  // Always same
};

// Update inscription content
const SUBMITTED = '<proverb_from_shielded_memo>';
const OFFICIAL = '<official_proverb_from_spellbook>';
const emoji_spell = '<emoji_spell_from_memo>';
```

## Completed Inscriptions

| Act | Inscription TXID | Funding Flow |
|-----|------------------|--------------|
| 1 | `6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0` | Direct (test) |
| 2 | `a9580a2fec5b3413822b9349965b9ef502e7836975236c6050b90fbec3d41061` | Act2 P2SH → Simple P2SH |

## Reference TXIDs (for REF field)

Always use Act 1 inscription as reference:
```
REF:6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0
```

## Fees

- Step 2 (P2SH to P2SH): 10,000 sats (0.0001 ZEC)
- Step 3 (Inscription): 20,000 sats (0.0002 ZEC)
- Recommended funding: 550,000+ sats (0.0055 ZEC) to cover fees and leave change

## Zebra RPC

```javascript
const ZEBRA_RPC = 'http://127.0.0.1:8233';
// Cookie from C:/Users/mitch/AppData/Local/zebra/.cookie
```

## Quick Checklist for New Act

- [ ] Get submitted proverb from shielded memo
- [ ] Get emoji_spell from shielded memo
- [ ] Get official proverb from spellbook
- [ ] Fund Act N P2SH via deshield
- [ ] Wait for confirmation
- [ ] Update & run spend script (Step 2)
- [ ] Wait for confirmation (or use mempool)
- [ ] Update & run inscribe script (Step 3)
- [ ] Record TXID in this doc
