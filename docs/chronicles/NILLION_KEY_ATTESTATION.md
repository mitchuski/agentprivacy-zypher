# Nillion Key Attestation Chronicle

**Generated**: 2025-12-04T01:55:00Z
**Purpose**: Proof of Nillion TEE integration for inscription signing key

---

## Key Commitment

The inscription signing key has been committed for future Nillion TEE integration:

### Public Key (Transparent)
```
03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223
```

### Key Hash (SHA-256 of WIF)
```
90599fd8da17d7a0068b1dd4ea8ca44d90d63588818085ee8db009855635becc
```

This hash serves as a commitment - anyone with the WIF can verify this hash matches, but the hash reveals nothing about the key itself.

---

## Nillion Account Integration

### Account Details
- **Account ID**: `3d8518fc-ad4b-46c9-8d0f-0110ef9cccd1`
- **Account Name**: `verida`
- **Network**: Testnet
- **Credits Available**: 1,500,000
- **API Endpoint**: `https://api.nilcc.nillion.network/api/v1`
- **Artifacts Available**: v0.2.0, v0.2.1

### Connection Verified
```json
{
  "accountId": "3d8518fc-ad4b-46c9-8d0f-0110ef9cccd1",
  "name": "verida",
  "createdAt": "2025-11-27T20:14:59.037Z",
  "credits": 1500000,
  "creditRate": 0
}
```

---

## Integration Path: SecretSigner

The planned integration uses Nillion's SecretSigner for threshold ECDSA signing:

1. **Store Key**: WIF private key stored in nilVM nodes (split via MPC)
2. **Sign Transactions**: Oracle requests signature via SecretSigner API
3. **Key Never Exposed**: Private key never reconstructed in single location
4. **TEE Attestation**: Cryptographic proof of secure execution environment

### Current Status
- [x] Nillion API connection verified
- [x] Account credits confirmed (1.5M)
- [x] Key hash commitment generated
- [x] Public key documented
- [ ] nilCC workload deployment (pending metal instance availability)
- [ ] SecretSigner integration (requires workload)

---

## Verification Commands

Anyone can verify the key hash commitment:

```javascript
const crypto = require('crypto');
const wif = '<YOUR_WIF_HERE>';
const expectedHash = '90599fd8da17d7a0068b1dd4ea8ca44d90d63588818085ee8db009855635becc';
const actualHash = crypto.createHash('sha256').update(wif).digest('hex');
console.log('Match:', actualHash === expectedHash);
```

---

## Why This Matters

This attestation demonstrates:

1. **Key Separation**: Inscription key is isolated from treasury
2. **TEE-Ready**: Key hash committed for future Nillion storage
3. **Verifiable**: Hash can be verified without exposing the key
4. **Upgradeable**: When nilCC metal instances are available, same key can be stored in TEE

---

## Related Files

- `pubkey.txt` - Public key (safe to share)
- `wif.txt` - Private key in WIF format (NEVER COMMIT)
- `act-p2sh-addresses.json` - Act-specific inscription addresses
- `p2sh-simple.json` - Simple P2SH details

---

*This chronicle was generated during the Nillion integration process for the Zypher inscription oracle.*
