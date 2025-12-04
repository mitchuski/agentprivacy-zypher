# Inscription Key Architecture for Zcash Oracles

## Overview

This document describes the security architecture for Zcash inscription oracles using isolated signing keys. The design separates inscription operations from treasury funds, enabling TEE-based automation while protecting main wallet assets.

**Key Principle: Zero Information Leakage**

The inscription key is completely isolated from the treasury mnemonic. Compromise of one does not affect the other. This ensures:
- Treasury funds remain safe even if inscription key is exposed
- Inscription operations can be automated in a TEE without risking main assets
- Key rotation is simple and doesn't affect treasury security

## Security Model

```
+---------------------------------------------------------------------+
|                        TREASURY LAYER                                |
|                                                                      |
|   Zallet Wallet (HD Mnemonic)                                       |
|   |-- Unified Address (u1...)  <- Receives payments                 |
|   |-- Shielded Pool (zs1...)   <- Private funds                     |
|   +-- Transparent (t1J6DrkJK...) <- Change destination              |
|                                                                      |
|   Protection: 24-word mnemonic, offline backup, age-encrypted       |
+---------------------------------------------------------------------+
                              |
                              | Deshield to P2SH (one-way funding)
                              v
+---------------------------------------------------------------------+
|                     INSCRIPTION LAYER (TEE)                          |
|                                                                      |
|   Standalone WIF Key                                                |
|   |-- NOT derived from mnemonic                                     |
|   |-- Stored in Nillion TEE                                         |
|   |-- Used ONLY for P2SH inscription signing                        |
|   +-- Public key creates P2SH addresses                             |
|                                                                      |
|   P2SH Addresses (t3...)                                            |
|   |-- Ephemeral, one-time use per inscription                       |
|   |-- Funded by deshielding from treasury                           |
|   +-- Spent to create inscriptions                                  |
|                                                                      |
|   Protection: TEE isolation, minimal exposure                        |
+---------------------------------------------------------------------+
                              |
                              | Change output
                              v
+---------------------------------------------------------------------+
|                      CHANGE RETURNS TO TREASURY                      |
|                                                                      |
|   All change -> t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Zallet t1)     |
|                                                                      |
|   TEE key CANNOT spend from this address                            |
|   Only Zallet (via mnemonic) controls treasury t1                   |
+---------------------------------------------------------------------+
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

## Zero Information Leakage Design

The architecture ensures **no cryptographic relationship** between:

1. **Treasury Mnemonic** - 24 words, BIP-39/BIP-44 derived
2. **Inscription WIF** - Random 32 bytes, standalone secp256k1

This means:
- Observing inscription transactions reveals nothing about treasury keys
- Signing operations in TEE don't require mnemonic access
- Compromised inscription key cannot be used to derive treasury addresses
- Each layer can be rotated independently

## Inscription Flow

```
1. USER SUBMITS PROVERB
   +-- Sends ZEC + memo to Unified Address (treasury)

2. ORACLE DETECTS SUBMISSION
   +-- Reads shielded memo, validates proverb

3. FUNDING (Treasury -> P2SH)
   +-- z_sendmany from treasury UA to Act-specific P2SH
   +-- Uses "AllowRevealedRecipients" privacy policy

4. INSCRIPTION SIGNING (TEE)
   +-- TEE signs P2SH spend with isolated WIF
   +-- Creates inscription transaction
   +-- Change output -> Treasury t1 address

5. BROADCAST
   +-- Raw transaction sent via Zebra RPC
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

## Files Generated

| File | Purpose | Security |
|------|---------|----------|
| `wif.txt` | Private key (WIF format) | TEE only, never in git |
| `pubkey.txt` | Public key (hex) | Can be public |
| `p2sh-simple.json` | Simple P2SH address + redeem script | Can be public |
| `act-p2sh-addresses.json` | Per-act P2SH addresses | Can be public |

## Integration with Nillion TEE

See: `docs/integration/NILLION_INTEGRATION_OPTIONS.md`

The WIF key is stored as a Nillion SecretBlob:
- Encrypted at rest
- Decrypted only during signing operations
- Access controlled by TEE attestation
- Never leaves TEE boundary in plaintext

## Change Address Configuration

**CRITICAL**: All inscription scripts must set change to treasury t1:

```javascript
// In inscription transaction builder
const CHANGE_ADDRESS = 't1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av'; // Zallet treasury

// Output 1: Inscription destination (if any value transfer)
// Output 2: Change -> CHANGE_ADDRESS (always treasury)
```

## Launching Your Own Inscription Oracle

1. **Generate fresh WIF** using ceremony above
2. **Store WIF in your TEE** (Nillion, SGX, etc.)
3. **Set CHANGE_ADDRESS** to your treasury's t1
4. **Fund P2SH** from your shielded pool
5. **TEE signs inscriptions**, change returns to you

The inscription key is disposable - if compromised, generate new one.
Your treasury (mnemonic) is the permanent asset to protect.

## Current Address Reference (Zypher Oracle)

### Primary Addresses (New - 2025-12-02)

| Act | P2SH Address |
|-----|--------------|
| 1 | t3gLXGanUTif8WLpX7EZXtR3kX5f1ZoWuUT |
| 2 | t3UpuXZq8CrX2EubNYVDKo4nWRXbyZ5wVUV |
| 3 | t3PPLb9EbeqSyzQwQgKwF9ugQNeFBxHtfeX |
| 4 | t3hiQfbJ5K45qmm4H1Q6N6CZD3AoppyS63g |
| 5 | t3fepr2dZh1xPEtZLf575kBBGNQa1U4AhuC |
| 6 | t3UrTbeMjjUUbccNKCSEn9qfBRB3jJVF7A6 |
| 7 | t3cnddicBRoJDHPqU2NbHdArz7Cd9xEZ9Hs |
| 8 | t3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD |
| 9 | t3cY6cRjiba4k3vu2vnKEGBBZWwA21zn6tg |
| 10 | t3MYZJnESAw7tqwcECB611NLEZA6N51YPLj |
| 11 | t3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R |
| 12 | t3aQzhfwgvocsrHt9fskS7htBc5brkWFVBm |

### Treasury Addresses

| Type | Address |
|------|---------|
| Treasury t1 | t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av |
| Legacy t1 #2 | t1J6DrkJKovnYfvQoYBWCEAakScdJ8bHBCJ |
| Legacy t1 #1 | t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q |

---

*Architecture: Isolated inscription signing with TEE*
*Last Updated: 2025-12-02*
