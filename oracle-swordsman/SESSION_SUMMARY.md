# Oracle Swordsman Session Summary - November 29, 2024

## Current State

Act 1 inscription is **COMPLETE** and confirmed on mainnet. Act 2 P2SH is **FUNDED** and ready for inscription.

## Completed Work

### 1. Act 1 Inscription (DONE)
- **TXID**: `6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0`
- Successfully inscribed using the Zerdinal model (scriptSig envelope)
- Confirmed on Zcash mainnet

### 2. Act 2 P2SH Funding (DONE)
- **Funding TXID**: `7ab335fa3feae3b4b7b1de70d340205fbb9de71864ea4ffe62633086e9940b86`
- **Amount**: 550,000 satoshis (0.0055 ZEC)
- **P2SH Address**: `t3bj1ifQRvdvgrg5d7a58HCjoPsrzRVWBen`

### 3. Golden Ratio Inscription Script (DONE)
Updated `golden-ratio-inscription.js` with complete Zerdinal model implementation:

- **`publishProverbInscription()`** function (lines 590-831):
  - ZIP-244 blake2b sighash computation
  - Ordinals-style inscription envelope in scriptSig
  - ScriptSig format: `<signature> <inscription_envelope> <redeem_script>`
  - Uses P2SH scriptPubKey (not redeem script) in sighash per ZIP-244
  - NU6 consensus branch ID: `0x4dec4df0`
  - ZIP-317 fee: 20,000 zatoshis

- **CLI `publish` command** (lines 1021-1046)

## Key Technical Details

### P2SH Addresses for All 12 Acts
Generated and stored in `ACT_P2SH_ADDRESSES` object in `golden-ratio-inscription.js`:
- Act 1: `t3ZAiVsfdL85w2sAEsTYAdzSCQDvqF66mq7` (OP_1 OP_DROP)
- Act 2: `t3bj1ifQRvdvgrg5d7a58HCjoPsrzRVWBen` (OP_2 OP_DROP)
- Acts 3-12: All unique P2SH addresses generated

### Redeem Script Pattern
```
OP_N OP_DROP <33-byte compressed pubkey> OP_CHECKSIG
```
Where N = act number (1-12)

### Public Key
```
03845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0
```

### Golden Ratio Split
- φ (phi) = 1.618033988749895
- Public portion: 61.8% → P2SH for inscription
- Private portion: 38.2% → stays shielded

## Next Steps (Tomorrow)

### To Publish Act 2 Inscription:
```bash
cd C:\Users\mitch\agentprivacy_zypher\oracle-swordsman
node golden-ratio-inscription.js publish 2 7ab335fa3feae3b4b7b1de70d340205fbb9de71864ea4ffe62633086e9940b86 0 550000 6c31029aafdbf74b3c861da88f1c9d6091e8d2e15e8636a9ecd0899a13fca9f0
```

Parameters:
- `2` = Act number
- `7ab335fa...` = Funding TXID
- `0` = Vout index
- `550000` = Amount in satoshis
- `6c31029a...` = Reference TXID (Act 1 inscription for REF field)

### Verify Funding First:
```bash
node -e "require('./dist/zcash-client').zcashClient.initialize().then(() => require('./dist/zcash-client').zcashClient.execCommandJSON('getrawtransaction', '7ab335fa3feae3b4b7b1de70d340205fbb9de71864ea4ffe62633086e9940b86', 1).then(tx => console.log('Confirmations:', tx.confirmations, 'Amount:', tx.vout[0].value)).catch(console.error))"
```

## Key Files

| File | Purpose |
|------|---------|
| `golden-ratio-inscription.js` | Main unified script with Zerdinal model |
| `inscription-tx-p2sh-v2-emoji.js` | Reference implementation (working) |
| `ZERDINALS_WORKFLOW.md` | Technical documentation |
| `dist/zcash-client.js` | Zcash RPC client |

## Wallet Info

- **t1 Address**: `t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q`
- **WIF Key**: `KxkL7J9kD8AVJP5L8qhGXjEWEyQPV3y4P5yCiUvDAg8wz9kxA4Vs`
- **Zebra RPC**: `http://127.0.0.1:18232`
- **Zallet RPC**: `http://127.0.0.1:3000`

## Prerequisites for Tomorrow

1. Zebra node running and synced
2. Zallet wallet running
3. Act 2 funding transaction confirmed (check confirmations)

## STS Inscription Format

```
STS|v01|ACT:<n>|<proverb>|H:<sha256_hash>|REF:<first_txid>
```

Act 2 Proverb: "A sovereign heart wields a blade of silence and a quill of light. In their first breath together, wholeness divides to extend."
