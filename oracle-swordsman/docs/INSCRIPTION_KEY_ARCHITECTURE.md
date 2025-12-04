# Inscription Key Architecture for Zcash Oracles

## Overview

This document describes the security architecture for Zcash inscription oracles using isolated signing keys. The design separates inscription operations from treasury funds, enabling TEE-based automation while protecting main wallet assets.

## Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TREASURY LAYER                                │
│                                                                      │
│   Zallet Wallet (HD Mnemonic)                                       │
│   ├── Unified Address (u1...)  ← Receives payments                  │
│   ├── Shielded Pool (zs1...)   ← Private funds                      │
│   └── Transparent (t1J6DrkJK...) ← Change destination               │
│                                                                      │
│   Protection: 24-word mnemonic, offline backup, age-encrypted       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Deshield to P2SH (one-way funding)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INSCRIPTION LAYER (TEE)                          │
│                                                                      │
│   Standalone WIF Key                                                │
│   ├── NOT derived from mnemonic                                     │
│   ├── Stored in Nillion TEE                                         │
│   ├── Used ONLY for P2SH inscription signing                        │
│   └── Public key creates P2SH addresses                             │
│                                                                      │
│   P2SH Addresses (t3...)                                            │
│   ├── Ephemeral, one-time use per inscription                       │
│   ├── Funded by deshielding from treasury                           │
│   └── Spent to create inscriptions                                  │
│                                                                      │
│   Protection: TEE isolation, minimal exposure                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Change output
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CHANGE RETURNS TO TREASURY                      │
│                                                                      │
│   All change → t1J6DrkJKovnYfvQoYBWCEAakScdJ8bHBCJ (Zallet t1)      │
│                                                                      │
│   TEE key CANNOT spend from this address                            │
│   Only Zallet (via mnemonic) controls treasury t1                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Why Isolated Keys?

### If TEE is compromised:
- Attacker gets inscription WIF only
- Can sign P2SH spends (inscription transactions)
- CANNOT access treasury funds
- CANNOT derive mnemonic
- Change still goes to treasury (attacker can't redirect)

### If mnemonic is compromised:
- Attacker gets full treasury access
- Inscription key remains safe in TEE
- (Less critical since treasury is the main asset)

## Inscription Flow

```
1. USER SUBMITS PROVERB
   └── Sends ZEC + memo to Unified Address (treasury)

2. ORACLE DETECTS SUBMISSION
   └── Reads shielded memo, validates proverb

3. FUNDING (Treasury → P2SH)
   └── z_sendmany from treasury UA to Act-specific P2SH
   └── Uses "AllowRevealedRecipients" privacy policy

4. INSCRIPTION SIGNING (TEE)
   └── TEE signs P2SH spend with isolated WIF
   └── Creates inscription transaction
   └── Change output → Treasury t1 address

5. BROADCAST
   └── Raw transaction sent via Zebra RPC
```

## WIF Key Ceremony (for new oracle deployments)

### Step 1: Generate Keypair
```javascript
const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Generate random 32 bytes
const privateKey = crypto.randomBytes(32);
const keyPair = ec.keyFromPrivate(privateKey);
const publicKey = Buffer.from(keyPair.getPublic(true, 'array'));
```

### Step 2: Create WIF
```javascript
// Zcash mainnet WIF: version 0x80, compressed flag 0x01
const payload = Buffer.concat([
  Buffer.from([0x80]),
  privateKey,
  Buffer.from([0x01])
]);
const checksum = sha256(sha256(payload)).slice(0, 4);
const wif = base58Encode(Buffer.concat([payload, checksum]));
```

### Step 3: Derive t1 Address (for reference only - not used for change)
```javascript
const pubkeyHash = ripemd160(sha256(publicKey));
const t1Payload = Buffer.concat([
  Buffer.from([0x1c, 0xb8]), // Zcash mainnet P2PKH
  pubkeyHash
]);
const t1Address = base58Check(t1Payload);
```

### Step 4: Create P2SH Addresses
```javascript
// Redeem script: OP_DROP <pubkey> OP_CHECKSIG
const redeemScript = Buffer.concat([
  Buffer.from([0x75]),              // OP_DROP
  Buffer.from([publicKey.length]),
  publicKey,
  Buffer.from([0xac])               // OP_CHECKSIG
]);

const scriptHash = ripemd160(sha256(redeemScript));
const p2shAddress = base58Check(Buffer.concat([
  Buffer.from([0x1c, 0xbd]), // Zcash mainnet P2SH
  scriptHash
]));
```

### Step 5: Store in TEE
```javascript
// Nillion SecretBlob storage
await nillionClient.storeSecret({
  name: "inscription_wif",
  value: wif,
  permissions: ["oracle_signer"]
});
```

## Files to Generate

| File | Purpose | Security |
|------|---------|----------|
| `wif.txt` | Private key (WIF format) | TEE only, never in git |
| `pubkey.txt` | Public key (hex) | Can be public |
| `p2sh-simple.json` | Simple P2SH address + redeem script | Can be public |
| `act-p2sh-addresses.json` | Per-act P2SH addresses | Can be public |

## Integration with Nillion TEE

See: `oracle-swordsman/docs/integration/NILLION_INTEGRATION_OPTIONS.md`

The WIF key is stored as a Nillion SecretBlob:
- Encrypted at rest
- Decrypted only during signing operations
- Access controlled by TEE attestation
- Never leaves TEE boundary in plaintext

## Change Address Configuration

**CRITICAL**: All inscription scripts must set change to treasury t1:

```javascript
// In inscription transaction builder
const CHANGE_ADDRESS = ''; // Zallet treasury

// Output 1: Inscription destination (if any value transfer)
// Output 2: Change → CHANGE_ADDRESS (always treasury)
```

## Launching Your Own Inscription Oracle

1. **Generate fresh WIF** using ceremony above
2. **Store WIF in your TEE** (Nillion, SGX, etc.)
3. **Set CHANGE_ADDRESS** to your treasury's t1
4. **Fund P2SH** from your shielded pool
5. **TEE signs inscriptions**, change returns to you

The inscription key is disposable - if compromised, generate new one.
Your treasury (mnemonic) is the permanent asset to protect.




---

*Generated: 2024-12-02*
*Architecture: Isolated inscription signing with TEE*
