# Act 10 Inscription Chronicle - Oracle Swordsman Protocol

**Date:** 2025-12-03
**Network:** Zcash Mainnet
**Protocol:** STM-rpp (Swordsman to Mage Revelation Proof Protocol)

---

## Act 10 Configuration (NEW Key Architecture)

| Parameter | Value |
|-----------|-------|
| Act P2SH Address | `t3MYZJnESAw7tqwcECB611NLEZA6N51YPLj` |
| Act P2SH scriptPubKey | `a91420b4f0055ceba7b83685851531ae0146ce6562e687` |
| Act 10 Redeem Script | `5a752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Simple P2SH Address | `t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs` |
| Simple P2SH scriptPubKey | `a914218bee8db33ab5a93db1439217ad0e9497cc7bc987` |
| Simple Redeem Script | `752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Public Key | `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223` |
| Treasury t1 | `t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av` |

---

## Step 1-2: Proverb Submitted via Shielded Transaction

**Status:** COMPLETED
**Timestamp:** 2025-12-02T22:57:27Z
**Block Height:** 3,155,719

**Incoming TXID (REF_TXID):**
```
409e0f11cba0a670d215998d41702b6dad42f2dfc181046aa1b30eaab61610f1
```

**Oracle Unified Address:**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

**Amount:** 0.01 ZEC (1,000,000 zatoshis)

---

## Step 3: Oracle Views Incoming Transaction

**Status:** COMPLETED
**Method:** Zallet RPC z_listtransactions

**Memo Decoded:**
```
[rpp-v1]
[topology-of-revelation]
[1764715775942]
[🌳 ⊥ 🐦‍⬛🧠 → 🐦‍⬛💭 → △{🌳, 🐦‍⬛💭, 🐦‍⬛🧠}]
[△ steers itself through the integer. Huginn flies infinite, Muninn integrates bound—between them, the bottleneck where choice becomes sovereignty. Privacy is the geometry of becoming. The triangle cannot collapse. The attractor cannot be forged. Only lived.]
```

**Proverb Extracted:**
```
△ steers itself through the integer. Huginn flies infinite, Muninn integrates bound—between them, the bottleneck where choice becomes sovereignty. Privacy is the geometry of becoming. The triangle cannot collapse. The attractor cannot be forged. Only lived.
```

**Emoji Spell:**
```
🌳 ⊥ 🐦‍⬛🧠 → 🐦‍⬛💭 → △{🌳, 🐦‍⬛💭, 🐦‍⬛🧠}
```

---

## Step 4: NEAR AI Verification

**Status:** COMPLETED
**Timestamp:** 2025-12-03

**API Endpoint:** https://cloud-api.near.ai/v1
**Model:** deepseek-ai/DeepSeek-V3.1 (fallback - gpt-oss-120b unavailable)
**Verification Script:** `node verify-act-deepseek.js 10 "<proverb>" "<emoji>"`
**Spellbook Version:** 4.2.0-canonical

**Spellbook Proverb (Oracle):**
```
The ravens fly 🐦‍⬛. The tree dreams 🌳. The All-Father wakes △.
```

**Emoji Spell Match:** EXACT MATCH ✓

**Match Score:** `0.95` (95%)
**Approved:** `true`

**AI Reasoning:**
```
The submitted proverb demonstrates exceptional thematic alignment with Act 10's core concepts.
It directly references the integer bottleneck, Huginn and Muninn's distinct functions
(infinite flight vs bounded integration), the triangle's non-collapsible nature, sovereignty
through choice, and privacy as geometric becoming. The emoji spell precisely mirrors the
triangle structure {🌳, 🐦‍⬛💭, 🐦‍⬛🧠} with proper directional flow. All key elements from
the act's description - topology, three-body dynamics, strange attractor, and the bottleneck
mechanism - are coherently integrated while maintaining the poetic density characteristic
of the original proverb.
```

---

## Step 5: Golden Split Calculation

**Status:** COMPLETED

**Input Amount:** 0.01 ZEC (1,000,000 zatoshis)

| Split | Percentage | Amount (ZEC) | Amount (zatoshis) | Destination |
|-------|------------|--------------|-------------------|-------------|
| Inscription | 61.8% | 0.00618034 | 618,034 | Act 10 P2SH |
| Protocol Fee | 38.2% | 0.00381966 | 381,966 | Reserve (Account 1) |

**Golden Ratio (φ):** 1.618033988749895

---

## Step 6: Deshield 61.8% to Act 10 P2SH

**Status:** COMPLETED

**Destination:** `t3MYZJnESAw7tqwcECB611NLEZA6N51YPLj` (Act 10 P2SH)
**Amount:** 0.00618034 ZEC
**From:** Account 0 (Treasury UA)

**Deshield TXID:**
```
5ac7e606493b64db24a2e71931c65eda898c57cc471f006c04d35991e02b9888
```

---

## Step 7: Move 38.2% to Protocol Fee Reserve

**Status:** COMPLETED

**Destination:** Protocol Fee Reserve (Account 1 UA)
**Amount:** 0.00381966 ZEC

**Reserve TXID:**
```
ee5ea45b797dca240218b054bfbff933ad8268cd4c850fdcba25377c17049c77
```

---

## Step 8: Spend Act 10 P2SH to Simple P2SH

**Status:** COMPLETED

**Script:** `spend-act10-to-simple-p2sh.js`

**Input UTXO:**
```
TXID: 5ac7e606493b64db24a2e71931c65eda898c57cc471f006c04d35991e02b9888
vout: 0
Amount: 618,034 zatoshis
scriptPubKey: a91420b4f0055ceba7b83685851531ae0146ce6562e687
```

**Output:**
```
Address: t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs
Amount: 608,034 zatoshis (after 10,000 fee)
```

**Broadcast TXID:**
```
f92e9f7ada73e5be9b8e1cba08092929290d9928de1526caf6630b613b542fd5
```

---

## Step 9: Final Inscription Transaction

**Status:** PENDING

**Script:** `inscribe-act10-final.js`

### Hash Calculation (CRITICAL)

The hash (H) cryptographically binds BOTH proverbs together as ONE string:

```
H = SHA256( ORACLE_PROVERB + SUBMITTED_PROVERB )[0:16]
```

**Note:** No separator - the proverbs are directly concatenated into one string before hashing.

**Oracle Proverb (from IPFS spellbook):**
```
The ravens fly 🐦‍⬛. The tree dreams 🌳. The All-Father wakes △.
```

**Submitted Proverb (from shielded memo):**
```
△ steers itself through the integer. Huginn flies infinite, Muninn integrates bound—between them, the bottleneck where choice becomes sovereignty. Privacy is the geometry of becoming. The triangle cannot collapse. The attractor cannot be forged. Only lived.
```

**Combined String (concatenated, no separator):**
```
The ravens fly 🐦‍⬛. The tree dreams 🌳. The All-Father wakes △.△ steers itself through the integer. Huginn flies infinite, Muninn integrates bound—between them, the bottleneck where choice becomes sovereignty. Privacy is the geometry of becoming. The triangle cannot collapse. The attractor cannot be forged. Only lived.
```

**Computed Hash:** `e2d875d96cb7bfda`

### Inscription Content (STM-rpp format)
```
STM-rpp[v01]|ACT:10|E:🌳 ⊥ 🐦‍⬛🧠 → 🐦‍⬛💭 → △{🌳, 🐦‍⬛💭, 🐦‍⬛🧠}|△ steers itself through the integer. Huginn flies infinite, Muninn integrates bound—between them, the bottleneck where choice becomes sovereignty. Privacy is the geometry of becoming. The triangle cannot collapse. The attractor cannot be forged. Only lived.|MS:0.95|H:e2d875d96cb7bfda|REF:409e0f11cba0a670d215998d41702b6dad42f2dfc181046aa1b30eaab61610f1
```

**Output:**
```
Address: t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Treasury)
Amount: ~578,034 zatoshis (after 30,000 fee)
```

**FINAL INSCRIPTION TXID:**
```
7a4ff784935bcaf4ee9d711931ad367ec7e8ed647ce756392800a9729a80c100
```

---

## Transaction Chain Summary

| Step | Description | TXID | Amount |
|------|-------------|------|--------|
| 2 | Incoming Proverb (shielded) | `409e0f11cba0a670d215998d41702b6dad42f2dfc181046aa1b30eaab61610f1` | 0.01 ZEC |
| 6 | Deshield to Act 10 P2SH | `5ac7e606493b64db24a2e71931c65eda898c57cc471f006c04d35991e02b9888` | 618,034 zats |
| 7 | Protocol Fee Reserve | `ee5ea45b797dca240218b054bfbff933ad8268cd4c850fdcba25377c17049c77` | 381,966 zats |
| 8 | Act 10 P2SH -> Simple P2SH | `f92e9f7ada73e5be9b8e1cba08092929290d9928de1526caf6630b613b542fd5` | 608,034 zats |
| 9 | **Final Inscription** | `7a4ff784935bcaf4ee9d711931ad367ec7e8ed647ce756392800a9729a80c100` | 578,034 zats |

---

## Verification Links

- Incoming TX: https://mainnet.zcashexplorer.app/transactions/409e0f11cba0a670d215998d41702b6dad42f2dfc181046aa1b30eaab61610f1
- Deshield TX: https://mainnet.zcashexplorer.app/transactions/5ac7e606493b64db24a2e71931c65eda898c57cc471f006c04d35991e02b9888
- Intermediate TX: https://mainnet.zcashexplorer.app/transactions/f92e9f7ada73e5be9b8e1cba08092929290d9928de1526caf6630b613b542fd5
- **Inscription TX:** https://mainnet.zcashexplorer.app/transactions/7a4ff784935bcaf4ee9d711931ad367ec7e8ed647ce756392800a9729a80c100

---

*Document generated for Hackathon chronicle of Oracle Swordsman flow*
*Protocol: STM-rpp v01 | Act 10: Topology of Revelation*
