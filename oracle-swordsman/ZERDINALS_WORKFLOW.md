# Zerdinals Inscription Workflow on Zcash

## Overview

This document describes the successful workflow for creating Zerdinals-style inscriptions on Zcash mainnet using P2SH v2 addresses with the `OP_DROP <pubkey> OP_CHECKSIG` redeem script pattern.

## Confirmed Working Transactions

| Step | Description | TXID |
|------|-------------|------|
| 1 | First inscription (text only) | `6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0` |
| 2 | Fund P2SH for emoji inscription | `d4e05995f17de5556891830c6c0928c8491f3feb9f83b26dc55426e9b76cf5ed` |
| 3 | Emoji inscription | `8d10b5dff7aa09e7f07cdc6431dc6fd418e190ae176c22af3ba3deeebb693e8d` |

## Technical Specifications

### Zcash v5 Transaction Format (ZIP-225)

```
Header (20 bytes):
  - version: 0x05000080 (v5 with overwintered flag)
  - versionGroupId: 0x26a7270a
  - consensusBranchId: 0x4dec4df0 (NU6 mainnet)
  - lockTime: 0x00000000
  - expiryHeight: 0x00000000

Inputs:
  - vinCount: compactsize
  - For each input:
    - prevout txid (32 bytes, reversed)
    - prevout index (4 bytes LE)
    - scriptSig length (compactsize)
    - scriptSig
    - sequence (4 bytes)

Outputs:
  - voutCount: compactsize
  - For each output:
    - value (8 bytes LE, in zatoshis)
    - scriptPubKey length (compactsize)
    - scriptPubKey

Trailing:
  - nSpendsSapling: 0x00
  - nOutputsSapling: 0x00
  - nActionsOrchard: 0x00
```

### ZIP-244 Sighash Algorithm

For P2SH transactions, both `scriptpubkeys_sig_digest` and `txin_sig_digest` use the P2SH scriptPubKey (not the redeem script). This differs from BIP-143.

Blake2b personalizations used:
- `ZTxIdHeadersHash` - header digest
- `ZTxIdPrevoutHash` - prevouts digest
- `ZTxTrAmountsHash` - amounts digest
- `ZTxTrScriptsHash` - scriptPubKeys digest
- `ZTxIdSequencHash` - sequence digest
- `ZTxIdOutputsHash` - outputs digest
- `Zcash___TxInHash` - txin digest
- `ZTxIdTranspaHash` - transparent bundle digest
- `ZTxIdSaplingHash` - sapling digest (empty)
- `ZTxIdOrchardHash` - orchard digest (empty)
- `ZcashTxHash_` + branch ID - final sighash

### P2SH v2 Redeem Script

```
OP_DROP <33-byte compressed pubkey> OP_CHECKSIG
Hex: 752103845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0ac
```

This allows inscription data to be pushed onto the stack and dropped before signature verification.

### ScriptSig Format

```
<signature> <inscription_envelope> <redeem_script>
```

Stack execution:
1. Push signature to stack
2. Push inscription envelope to stack
3. Execute redeem script:
   - OP_DROP removes inscription envelope
   - Push pubkey
   - OP_CHECKSIG verifies signature

### Inscription Envelope (Ordinals-style)

```
<3-byte "ord"> OP_1 <content-type> OP_0 <content>
```

For content > 75 bytes, use OP_PUSHDATA1 (0x4c) or OP_PUSHDATA2 (0x4d).

### STS Inscription Format

```
STS|v01|ACT:<act_number>|[E:<emoji>|]<proverb>|H:<hash>|REF:<first_txid>
```

Fields:
- `STS|v01` - Protocol identifier and version
- `ACT:<n>` - Act number from spellbook
- `E:<emoji>` - Optional emoji representation
- `<proverb>` - The submitted proverb text
- `H:<hash>` - SHA256 hash of `submitted_proverb|official_proverb`
- `REF:<txid>` - Reference to first inscription TXID

## Fee Calculation (ZIP-317)

```
fee = max(marginal_fee, 5000) * max(logical_actions, 1)

For transparent-only tx:
logical_actions = max(tin, tout)

Action weight ≈ 150 bytes per action
Minimum fee: 5000 zatoshis per 150 bytes
```

For a ~500 byte inscription tx: **20,000 zatoshis minimum fee**

## Workflow Steps

### Step 1: Create P2SH v2 Address

Run `create-inscription-address-v2.js` to generate:
- P2SH address (t3...)
- Redeem script hex
- Script hash

### Step 2: Fund the P2SH Address

Use `send-to-p2sh-v2-emoji.js` to send funds from a t1 address to the P2SH address.

Key points:
- Use ZIP-244 sighash for the t1 (P2PKH) spend
- Output to P2SH scriptPubKey: `a914<script_hash>87`

### Step 3: Create Inscription Transaction

Use `inscription-tx-p2sh-v2-emoji.js` to:
1. Build the inscription envelope with UTF-8 content
2. Create ZIP-244 sighash using P2SH scriptPubKey
3. Sign with secp256k1
4. Build scriptSig: `<sig> <envelope> <redeem_script>`
5. Construct v5 transaction

### Step 4: Broadcast

```bash
node -e "require('./dist/zcash-client').zcashClient.initialize().then(() =>
  require('./dist/zcash-client').zcashClient.execCommandJSON('sendrawtransaction', '<raw_tx_hex>')
  .then(console.log).catch(console.error))"
```

## Key Files

| File | Purpose |
|------|---------|
| `create-inscription-address-v2.js` | Generate P2SH v2 address with OP_DROP script |
| `send-to-p2sh-v2-emoji.js` | Fund P2SH address from t1 |
| `inscription-tx-p2sh-v2-emoji.js` | Create inscription transaction |
| `derive-tkey.js` | Derive transparent key from WIF |

## Lessons Learned

1. **ZIP-244 for P2SH**: Use the P2SH scriptPubKey (not redeem script) in sighash calculation
2. **ZIP-317 fees**: Calculate based on transaction size, minimum 5000 zat per 150 bytes
3. **Consensus branch ID**: Must use current network upgrade (NU6 = `0x4dec4df0`)
4. **ScriptSig ordering**: `<sig> <data> <redeem_script>` for OP_DROP pattern
5. **UTF-8 encoding**: Emoji and special characters work with proper Buffer encoding
6. **Full values**: Use complete 64-character hashes and TXIDs, not truncated

## Dependencies

```json
{
  "elliptic": "^6.5.4",
  "blake2b": "^2.1.4"
}
```

## Address Reference

| Type | Address |
|------|---------|
| t1 (P2PKH) | `t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q` |
| t3 (P2SH v2) | `t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7` |

## Public Key

```
03845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0
```
