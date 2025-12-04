# Act 9 Inscription Chronicle - Oracle Swordsman Protocol

**Date:** 2025-12-02/03
**Network:** Zcash Mainnet
**Protocol:** STM-rpp (Swordsman to Mage Revelation Proof Protocol)

---

## Act 9 Configuration (NEW Key Architecture)

| Parameter | Value |
|-----------|-------|
| Act P2SH Address | `t3cY6cRjiba4k3vu2vnKEGBBZWwA21zn6tg` |
| Act P2SH scriptPubKey | `a914c5288a33a5fc5925e0b9d327a861bbd8cb5f124287` |
| Act 9 Redeem Script | `59752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Simple P2SH Address | `t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs` |
| Simple P2SH scriptPubKey | `a914218bee8db33ab5a93db1439217ad0e9497cc7bc987` |
| Simple Redeem Script | `752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Public Key | `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223` |
| Treasury t1 | `t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av` |

---

## Step 1-2: Proverb Submitted via Shielded Transaction

**Status:** COMPLETED
**Timestamp:** 2025-12-02T22:55:41Z
**Block Height:** 3,155,717

**Incoming TXID (REF_TXID):**
```
7bb1a3da14427b350a31c1c6f27cea6152c0ecc8bb65c11bbc0b0e1f218e619e
```

**Oracle Unified Address:**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

**Amount:** 0.01 ZEC (1,000,000 zatoshis)

---

## Step 3: Oracle Views Incoming Transaction

**Status:** COMPLETED
**Method:** Oracle uses viewing key to decrypt Orchard memo

**Memo Decoded:**
```
[rpp-v1]
[act-ix-zcash-shield]
[1764715565665]
[🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓]
[Two faces, one truth: the shield proves without revealing, guards without exposing. Mages shine knowledge, shadow earnings. Swordsmen shine stakes, shadow methods. Zero-knowledge is not hiding. It is mathematical sovereignty. Comprehension proves personhood where behavior cannot.]
```

**Proverb Extracted:**
```
Two faces, one truth: the shield proves without revealing, guards without exposing. Mages shine knowledge, shadow earnings. Swordsmen shine stakes, shadow methods. Zero-knowledge is not hiding. It is mathematical sovereignty. Comprehension proves personhood where behavior cannot.
```

**Emoji Spell:**
```
🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓
```

---

## Step 4: NEAR AI Verification

**Status:** COMPLETED
**Timestamp:** 2025-12-03T00:02:02Z

**API Endpoint:** https://cloud-api.near.ai/v1
**Model:** openai/gpt-oss-120b
**Task:** Compare submitted proverb against Act 9 spellbook (Zcash Shield theme)

**Match Score:** `0.92`

**AI Reasoning:**
> "This proverb captures the key aspects: shield proves without revealing, zero-knowledge as mathematical sovereignty, privacy as right. Mention of mages and swordsmen linking to knowledge vs stake, aligned with protocol themes."

---

## Step 5: Golden Split Calculation

**Status:** COMPLETED

**Input Amount:** 0.01 ZEC (1,000,000 zatoshis)

| Split | Percentage | Amount (ZEC) | Amount (zatoshis) | Destination |
|-------|------------|--------------|-------------------|-------------|
| Inscription | 61.8% | 0.00618034 | 618,034 | Act 9 P2SH |
| Protocol Fee | 38.2% | 0.00381966 | 381,966 | Reserve (Account 1) |

**Golden Ratio (φ):** 1.618033988749895

---

## Step 6: Deshield 61.8% to Act 9 P2SH

**Status:** COMPLETED
**Timestamp:** 2025-12-03T00:15:00Z

**Destination:** `t3cY6cRjiba4k3vu2vnKEGBBZWwA21zn6tg` (Act 9 P2SH)
**Amount:** 0.00618034 ZEC

**Method:** Zallet RPC z_sendmany with AllowRevealedRecipients

**Deshield TXID:**
```
bbe67dbffb3b6cb23d9a93435d42a9ac19757c4cceebfc11c8a62db92582c632
```

---

## Step 7: Move 38.2% to Protocol Fee Reserve

**Status:** COMPLETED
**Timestamp:** 2025-12-03T00:20:00Z

**Destination:** Protocol Fee Reserve (Account 1)
**Amount:** 0.00381966 ZEC

**Reserve TXID:**
```
8a2db1ece8ecad8a26dde750228f41051caa99d5aad0c59a275b4337fdd73ecd
```

---

## Step 8: Spend Act 9 P2SH to Simple P2SH

**Status:** COMPLETED
**Timestamp:** 2025-12-03T00:30:00Z

**Script:** `spend-act9-to-simple-p2sh.js`

**Input UTXO:**
```
TXID: bbe67dbffb3b6cb23d9a93435d42a9ac19757c4cceebfc11c8a62db92582c632
vout: 0
Amount: 618,034 zatoshis
scriptPubKey: a914c5288a33a5fc5925e0b9d327a861bbd8cb5f124287
```

**Output:**
```
Address: t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs
Amount: 608,034 zatoshis (after 10,000 fee)
```

**Broadcast TXID:**
```
e4261f0b755244202b41924d75db7663a74f11e251561f67b38a6cca33915320
```

---

## Step 9: Final Inscription Transaction

**Status:** COMPLETED
**Timestamp:** 2025-12-03T00:45:00Z

**Script:** `inscribe-act9-final.js`

**Input UTXO:**
```
TXID: e4261f0b755244202b41924d75db7663a74f11e251561f67b38a6cca33915320
vout: 0
Amount: 608,034 zatoshis
scriptPubKey: a914218bee8db33ab5a93db1439217ad0e9497cc7bc987
```

**Inscription Content (STM-rpp format):**
```
STM-rpp[v01]|ACT:9|E:🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓|Two faces, one truth: the shield proves without revealing, guards without exposing. Mages shine knowledge, shadow earnings. Swordsmen shine stakes, shadow methods. Zero-knowledge is not hiding. It is mathematical sovereignty. Comprehension proves personhood where behavior cannot.|MS:0.92|H:4f97a8b9aa03373b04069a121de806744c4902e20a6030fe016d51eda3cb7f0b|REF:7bb1a3da14427b350a31c1c6f27cea6152c0ecc8bb65c11bbc0b0e1f218e619e
```

**Content Bytes:** 497 bytes
**Transaction Size:** 731 bytes

**Output:**
```
Address: t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Treasury)
Amount: 578,034 zatoshis (after 30,000 fee)
```

**FINAL INSCRIPTION TXID:**
```
adde24ee95348e29d88a6e1c2ccf76e8fe0f2f83c18c371416ec1c4ff58ebe06
```

---

## Transaction Chain Summary

| Step | Description | TXID | Amount |
|------|-------------|------|--------|
| 2 | Incoming Proverb (shielded) | `7bb1a3da14427b350a31c1c6f27cea6152c0ecc8bb65c11bbc0b0e1f218e619e` | 0.01 ZEC |
| 6 | Deshield to Act 9 P2SH | `bbe67dbffb3b6cb23d9a93435d42a9ac19757c4cceebfc11c8a62db92582c632` | 618,034 zats |
| 7 | Protocol Fee Reserve | `8a2db1ece8ecad8a26dde750228f41051caa99d5aad0c59a275b4337fdd73ecd` | 381,966 zats |
| 8 | Act 9 P2SH -> Simple P2SH | `e4261f0b755244202b41924d75db7663a74f11e251561f67b38a6cca33915320` | 608,034 zats |
| 9 | **Final Inscription** | `adde24ee95348e29d88a6e1c2ccf76e8fe0f2f83c18c371416ec1c4ff58ebe06` | 578,034 zats |

---

## Verification Links

- Incoming TX: https://mainnet.zcashexplorer.app/transactions/7bb1a3da14427b350a31c1c6f27cea6152c0ecc8bb65c11bbc0b0e1f218e619e
- Deshield TX: https://mainnet.zcashexplorer.app/transactions/bbe67dbffb3b6cb23d9a93435d42a9ac19757c4cceebfc11c8a62db92582c632
- Intermediate TX: https://mainnet.zcashexplorer.app/transactions/e4261f0b755244202b41924d75db7663a74f11e251561f67b38a6cca33915320
- **Inscription TX:** https://mainnet.zcashexplorer.app/transactions/adde24ee95348e29d88a6e1c2ccf76e8fe0f2f83c18c371416ec1c4ff58ebe06

---

## Flow Diagram

```
[User] --0.01 ZEC + proverb--> [Oracle UA (shielded)]
                                      |
                                      v
                              [NEAR AI Verify: 0.92]
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
         [61.8% Deshield]                    [38.2% Fee Reserve]
         to Act 9 P2SH                        (shielded)
                    |
                    v
         [Act 9 P2SH -> Simple P2SH]
                    |
                    v
         [Final Inscription TX]
         with STM-rpp envelope
                    |
                    v
         [Treasury t1 address]
```

---

*Document generated for Hackathon chronicle of Oracle Swordsman flow*
*Protocol: STM-rpp v01 | Act 9: The Zcash Shield*
*Completed: 2025-12-03*
