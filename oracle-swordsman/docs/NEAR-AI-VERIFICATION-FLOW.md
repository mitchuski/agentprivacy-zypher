# NEAR AI Proverb Verification Flow

## Overview

When a shielded proverb submission is detected, it must be verified against the spellbook using NEAR Cloud AI before inscription. This document describes the verification flow using the canonical `verify-act.js` script.

## Quick Start

```bash
# Verify a submitted proverb for Act 7
node verify-act.js 7 "Your proverb here" "emoji spell here"

# Example:
node verify-act.js 7 "One agent gives the mirror completion; two agents give it only the shimmer and in their mutual witness, the First Person remains forever uncaptured." "1️⃣🤖 → 🪞→👤 2️⃣🤖 → 🪞→✨ + 👤"
```

## The verify-act.js Script

Location: `oracle-swordsman/verify-act.js`

### What It Does

1. **Fetches spellbook from IPFS** - Gets the canonical spellbook with full act context
2. **Loads target act details** - Title, description, keywords, spell, official proverb
3. **Builds full context prompt** - Includes ALL acts for comparison
4. **Calls NEAR Cloud AI** - Semantic verification against full act context
5. **Returns match score** - Quality score (0-1) for inscription

### Usage

```bash
node verify-act.js <act_number> "<submitted_proverb>" "<emoji_spell>"
```

**Arguments:**
- `act_number` - The act number (1-42)
- `submitted_proverb` - The proverb text from the shielded memo
- `emoji_spell` - The emoji sequence from the shielded memo

**If no proverb is provided**, it shows the act info only:
```bash
node verify-act.js 7
# Shows Act 7's full context: title, description, keywords, spell, official proverb
```

## Configuration

### Environment / Hardcoded Values

```javascript
// In verify-act.js
const NEAR_API_KEY = process.env.NEAR_SWORDSMAN_API_KEY || 'your_near_swordsman_api_key_here';
const SPELLBOOK_IPFS = 'https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq';
```

### API Endpoint

```
https://cloud-api.near.ai/v1/chat/completions
```

**Model:** `openai/gpt-oss-120b`

## Verification Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. SHIELDED SCAN                                       │
│     ShieldedScanner detects note via z_listunspent      │
│     Parses memo: [rpp-v1], [act-id], [timestamp],       │
│                  [emoji], [proverb]                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. RUN VERIFICATION                                    │
│     node verify-act.js <act> "<proverb>" "<emoji>"      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  3. FETCH SPELLBOOK FROM IPFS                           │
│     GET https://...mypinata.cloud/ipfs/<cid>            │
│     Returns full spellbook with all 42 acts             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  4. BUILD VERIFICATION PROMPT                           │
│     - Target act's full context (desc, keywords, spell) │
│     - All acts for comparison                           │
│     - Submitted proverb + emoji                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  5. CALL NEAR CLOUD AI                                  │
│     POST https://cloud-api.near.ai/v1/chat/completions  │
│     Model: openai/gpt-oss-120b                          │
│     Temperature: 0.3 (for consistent JSON)              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  6. PARSE RESULT                                        │
│     {                                                   │
│       "quality_score": 0.92,                            │
│       "matched_act": "act-07-mirror",                   │
│       "matched_act_number": 7,                          │
│       "official_proverb": "...",                        │
│       "reasoning": "...",                               │
│       "approved": true                                  │
│     }                                                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  7. PROCEED IF APPROVED                                 │
│     If approved == true && quality_score >= 0.5:        │
│       → Run inscription flow (deshield → P2SH → inscr)  │
│     Else:                                               │
│       → Reject submission                               │
└─────────────────────────────────────────────────────────┘
```

## Prompt Structure

The script builds a prompt that includes:

```
You are a proverb verification expert for the Privacy Spellbook.

A shielded memo was received claiming Act {N} ({act_id}).
The submitted proverb is: "{proverb}"
The emoji spell is: {emoji}

FULL SPELLBOOK CONTEXT FROM IPFS:
Act 1 (act-01-shield):
  Title: The Ledger That Balances Itself
  Description: ...
  Keywords: ...
  Spell: ...
  Proverb: "..."

Act 2 (act-02-sovereignty):
  ...

[...all 42 acts...]

TASK:
1. Read Act {N}'s full description, keywords, spell, and official proverb
2. Verify if submitted proverb thematically aligns with Act {N}'s FULL context
3. Consider thematic alignment with the act's core concepts and keywords
4. Score semantic similarity from 0.0 to 1.0

Return ONLY valid JSON:
{
  "quality_score": 0.0-1.0,
  "matched_act": "{act_id}",
  "matched_act_number": {N},
  "official_proverb": "the Act {N} official proverb",
  "reasoning": "explanation of thematic connections",
  "approved": true/false
}
```

## Example Output

```
=== NEAR AI Verification Agent (Oracle Swordsman) ===

Verifying Act: 7
Submitted Proverb: One agent gives the mirror completion; two agents give it only the shimmer...
Emoji Spell: 1️⃣🤖 → 🪞→👤 2️⃣🤖 → 🪞→✨ + 👤

Fetching spellbook from IPFS...
Spellbook version: 4.1.0-canonical

=== Act 7 Full Context ===
ID: act-07-mirror
Title: The Mirror That Never Completes / The Anti-Mirror
Description: Surveillance capitalism hits a 95% reconstruction ceiling...
Keywords: mirror, reconstruction, 95-percent, separation, dignity...
Spell: 1️⃣🤖 → 🪞→👤
       2️⃣🤖 → 🪞→✨ + 👤
Official Proverb: One mirror observing both swordsman and mage collapses dignity...

Calling NEAR AI with full spellbook context...

=== NEAR AI Response ===

Match Score (MS): 0.92 (92%)
Matched Act: act-07-mirror
Act Number: 7
Official Proverb: One mirror observing both swordsman and mage collapses dignity into surveillance; two mirrors, each watching the other, preserve dignity through mutual witness.
Approved: true

Reasoning: The submitted proverb mirrors the core narrative of Act 7: it contrasts a single agent that completes the mirror (implying full reconstruction) with two agents that only provide a "shimmer" (partial view)...

=== FOR INSCRIPTION ===
MS:0.92
```

## Using Match Score in Inscription

The `quality_score` is included in the inscription as `MS` (Match Score):

```
STM-rpp[v01]|ACT:7|E:[emoji]|[proverb]|MS:0.92|H:[hash]|REF:[shielded_txid]
```

## Complete Proverb Submission Flow

```
1. User sends shielded tx to u-address with memo:
   [rpp-v1]
   [act-vii-mirror-enhanced]
   [timestamp]
   [emoji spell]
   [proverb text]

2. ShieldedScanner detects via z_listunspent
   → node check-latest-memo.js

3. Run verification:
   → node verify-act.js 7 "proverb" "emoji"

4. If approved (MS >= 0.5):
   → node deshield-act7.js         # Shielded → Act P2SH
   → node spend-act7-to-simple-p2sh.js  # Act P2SH → Simple P2SH
   → node inscribe-act7.js         # Simple P2SH → Inscription TX

5. Inscription onchain with MS score
```

## Troubleshooting

### 401 Invalid API Key
- Check `NEAR_API_KEY` in verify-act.js
- Key format: `sk-xxxxxxxxxxxxx`

### 410 Endpoint Retired
- Old: `https://api.near.ai/...` (RETIRED Oct 2025)
- New: `https://cloud-api.near.ai/...`

### IPFS Fetch Timeout
- Default timeout: 30 seconds
- Check Pinata gateway availability
- Fallback: use local spellbook copy

### JSON Parse Errors
- Model may return reasoning before JSON
- Script uses regex: `content.match(/\{[\s\S]*\}/)`
- Temperature 0.3 helps consistency
