# Act 8 Inscription Chronicle - Oracle Swordsman Protocol

**Date:** 2025-12-02
**Network:** Zcash Mainnet
**Protocol:** STM-rpp (Swordsman to Mage Revelation Proof Protocol)

---

## Act 8 Configuration

| Parameter | Value |
|-----------|-------|
| Act P2SH Address | `t3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD` |
| Act 8 Redeem Script | `58752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Simple P2SH Address | `t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs` |
| Public Key | `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223` |
| Treasury t1 | `t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av` |

---

## Spellbook Reference

**Act 8: The Ancient Rule / Two-of-Three Locks**

| Field | Value |
|-------|-------|
| ID | `act-8-ancient-rule` |
| Category | security |
| Oracle Proverb | "Two keys guard the gate; the third opens only from within." |
| Emoji Spell | `🗡️🔒 + 🤝🔐₁₅ → 🛡️🛡️ → 💽🏛️` |
| Theme | Two-of-three locks, dignity as security, separation of powers |

---

## Step 1-2: Proverb Submitted via Shielded Transaction

**Status:** COMPLETED
**Block Height:** 3,155,754
**Block Time:** 1764719447

**Incoming TXID (REF_TXID):**
```
1a717efe3fc295d042852361792faf69554c1ac55ac6df6e152df50b744b71bc
```

**Oracle Unified Address:**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

**Amount:** 0.01 ZEC (1,000,000 zatoshis)

---

## Step 3: Oracle Views Incoming Transaction

**Status:** COMPLETED
**Method:** Zallet RPC z_listtransactions with account UUID

**Proverb Extracted:**
```
Where all three locks align, the keeper becomes the thief. Where two remain two, the gap becomes the guard. Dignity is security. Security is dignity. One truth. Two hands. Forever apart. Forever whole. This is the ancient rule rediscovered.
```

**Emoji Spell:**
```
🗡️🔒 + 🤝🔐₁₅ → 🛡️🛡️ → 💽🏛️
```

---

## Step 4: NEAR AI Verification

**Status:** COMPLETED

**API Endpoint:** https://cloud-api.near.ai/v1
**Model:** openai/gpt-oss-120b
**Spellbook Version:** 4.2.0-canonical

**Spellbook Proverb (Oracle):**
```
Two keys guard the gate; the third opens only from within.
```

**Emoji Spell Match:** EXACT MATCH ✓

**Match Score:** `0.86` (86%)
**Approved:** `true`

**AI Reasoning:**
```
The submitted proverb directly addresses the two-of-three key concept from Act 8.
It emphasizes: 1) When all three locks align (single point of control), security
is compromised ("keeper becomes thief"). 2) When two keys remain separate, the
gap provides protection ("gap becomes the guard"). 3) The identity of dignity
and security. 4) The paradox of separation creating wholeness. This aligns with
the act's theme of two-of-three locks and the ancient rule of distributed trust.
```

---

## Step 5: Golden Split Calculation

**Status:** COMPLETED

**Input Amount:** 0.01 ZEC (1,000,000 zatoshis)

| Split | Percentage | Amount (ZEC) | Amount (zatoshis) | Destination |
|-------|------------|--------------|-------------------|-------------|
| Inscription | 61.8% | 0.00618034 | 618,034 | Act 8 P2SH |
| Protocol Fee | 38.2% | 0.00381966 | 381,966 | Reserve (Account 1) |

**Golden Ratio (φ):** 1.618033988749895

---

## Step 6: Deshield 61.8% to Act 8 P2SH

**Status:** COMPLETED

**Destination:** `t3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD` (Act 8 P2SH)
**Amount:** 0.00618034 ZEC
**From:** Account 0 (Treasury UA)

---

## Step 7: Move 38.2% to Protocol Fee Reserve

**Status:** COMPLETED

**Destination:** Protocol Fee Reserve (Account 1 UA)
**Amount:** 0.00381966 ZEC

---

## Step 8: Spend Act 8 P2SH to Simple P2SH

**Status:** COMPLETED

**Input UTXO:**
```
From: t3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD
Amount: 618,034 zatoshis
```

**Output:**
```
Address: t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs
Amount: 608,034 zatoshis (after 10,000 fee)
```

---

## Step 9: Final Inscription Transaction

**Status:** COMPLETED

### Hash Calculation (CRITICAL)

The hash (H) cryptographically binds BOTH proverbs together as ONE string:

```
H = SHA256( ORACLE_PROVERB + SUBMITTED_PROVERB )[0:16]
```

**Note:** No separator - the proverbs are directly concatenated into one string before hashing.

**Oracle Proverb (from IPFS spellbook):**
```
Two keys guard the gate; the third opens only from within.
```

**Submitted Proverb (from shielded memo):**
```
Where all three locks align, the keeper becomes the thief. Where two remain two, the gap becomes the guard. Dignity is security. Security is dignity. One truth. Two hands. Forever apart. Forever whole. This is the ancient rule rediscovered.
```

**Computed Hash:** `9cd22fdad1cc0c0347f74403c66c7089fa45313d26ae748aafdb8fe28d71a18a`

### Inscription Content (STM-rpp format)
```
STM-rpp[v01]|ACT:8|E:🗡️🔒 + 🤝🔐₁₅ → 🛡️🛡️ → 💽🏛️|Where all three locks align, the keeper becomes the thief. Where two remain two, the gap becomes the guard. Dignity is security. Security is dignity. One truth. Two hands. Forever apart. Forever whole. This is the ancient rule rediscovered.|MS:0.86|H:9cd22fdad1cc0c0347f74403c66c7089fa45313d26ae748aafdb8fe28d71a18a|REF:1a717efe3fc295d042852361792faf69554c1ac55ac6df6e152df50b744b71bc
```

**Output:**
```
Address: t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Treasury)
Amount: 578,034 zatoshis (after 30,000 fee)
```

**FINAL INSCRIPTION TXID:**
```
38649fafa2c12007f50b19a0517255c6abe8889b414e1e16b422fd5394aa739d
```

---

## Transaction Chain Summary

| Step | Description | TXID | Amount |
|------|-------------|------|--------|
| 2 | Incoming Proverb (shielded) | `1a717efe3fc295d042852361792faf69554c1ac55ac6df6e152df50b744b71bc` | 0.01 ZEC |
| 9 | **Final Inscription** | `38649fafa2c12007f50b19a0517255c6abe8889b414e1e16b422fd5394aa739d` | 578,034 zats |

---

## Verification Links

- Incoming TX: https://mainnet.zcashexplorer.app/transactions/1a717efe3fc295d042852361792faf69554c1ac55ac6df6e152df50b744b71bc
- **Inscription TX:** https://mainnet.zcashexplorer.app/transactions/38649fafa2c12007f50b19a0517255c6abe8889b414e1e16b422fd5394aa739d

---

*Document generated for Hackathon chronicle of Oracle Swordsman flow*
*Protocol: STM-rpp v01 | Act 8: The Ancient Rule*
*Completed: 2025-12-02*
