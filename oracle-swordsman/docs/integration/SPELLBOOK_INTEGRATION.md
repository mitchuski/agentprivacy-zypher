# Spellbook Integration for Oracle Swordsman

## Overview

The Oracle Swordsman uses the canonical spellbook stored on IPFS to verify proverbs submitted in shielded transactions. The spellbook contains both the Story Spellbook (11 acts) and the Zero Knowledge Spellbook (30 tales), each with associated proverbs.

## Spellbook Location

**IPFS URL**: `https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq`

**CID**: `bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq`

**Version**: `4.0.0-canonical`

## Architecture

### Separation of Agents

The system uses **two separate NEAR Cloud AI API keys**:

1. **Mage Agent** (`NEAR_API_KEY`)
   - Used by the frontend website
   - Handles user interactions and storytelling
   - Key: Set via `NEXT_PUBLIC_NEAR_API_KEY` environment variable

2. **Swordsman Agent** (`NEAR_SWORDSMAN_API_KEY`)
   - Used by the Oracle Swordsman backend
   - Performs private inference to verify proverbs
   - **MUST be separate** from the mage key
   - Key: Set via `NEAR_SWORDSMAN_API_KEY` environment variable

### Verification Flow

1. **Shielded Transaction Received**
   - User sends proverb in shielded transaction (z→z)
   - Oracle monitors shielded pool via `zecwallet-cli`
   - Memo is automatically decrypted (wallet has viewing key)

2. **Spellbook Fetch**
   - Oracle fetches spellbook from IPFS
   - Caches for 1 hour to reduce IPFS calls
   - Handles both story acts and zero tales

3. **Proverb Verification**
   - **Exact Match Check**: First checks if proverb exactly matches any spellbook proverb
   - **AI Verification**: If no exact match, uses NEAR Cloud AI (swordsman key) for private inference
   - AI compares submitted proverb against all spellbook proverbs
   - Returns quality score (0-1), matched act, and reasoning

4. **Approval Decision**
   - If `quality_score >= 0.5` and matches spellbook concepts → **Approved**
   - If `quality_score < 0.5` or unrelated → **Rejected**

5. **Inscription**
   - If approved, oracle creates public inscription on transparent address
   - Proverb is posted to op_return in public transaction
   - Links back to original shielded transaction

## Spellbook Structure

The spellbook JSON contains:

```json
{
  "version": "4.0.0-canonical",
  "spellbooks": {
    "story": {
      "acts": [
        {
          "id": "act-01-venice",
          "act_number": 1,
          "title": "Venice, 1494 / The Drake's First Whisper",
          "proverb": "The swordsman who never strikes guards nothing; the mage who never casts commands nothing.",
          "keywords": ["venice", "pacioli", "drake", ...],
          ...
        },
        // ... 10 more acts
      ]
    },
    "zero": {
      "parts": [
        {
          "tales": [
            {
              "number": 1,
              "title": "The Zero Knowledge Proof",
              "proverb": "I can prove I know without revealing what I know.",
              "spell": "zk: prove(knowledge) → verify(truth) + hide(secret)",
              ...
            },
            // ... 29 more tales
          ]
        }
      ]
    }
  }
}
```

## Implementation Details

### IPFS Client (`ipfs-client.ts`)

- Fetches spellbook from IPFS URL
- Normalizes structure (handles both story acts and zero tales)
- Extracts proverbs from acts/tales
- Caches for 1 hour

### Verifier (`nearcloudai-verifier.ts`)

- Uses `NEAR_SWORDSMAN_API_KEY` (separate from mage)
- First checks for exact proverb match (case-insensitive)
- If no exact match, uses NEAR Cloud AI for semantic matching
- AI prompt includes all spellbook proverbs for comparison
- Returns verification result with quality score

### Configuration (`config.ts`)

```typescript
near: {
  mageApiKey: process.env.NEAR_API_KEY!,        // Frontend
  swordsmanApiKey: process.env.NEAR_SWORDSMAN_API_KEY!, // Oracle
  model: 'openai/gpt-oss-120b',
  chatEndpoint: 'https://cloud-api.near.ai/v1/chat/completions',
}

ipfs: {
  spellbookUrl: 'https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq',
  spellbookCid: 'bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq',
}
```

## Environment Variables

Add to `.env`:

```bash
# Mage Agent (frontend)
NEAR_API_KEY=your_near_api_key_here

# Swordsman Agent (oracle - MUST be separate)
NEAR_SWORDSMAN_API_KEY=your_near_swordsman_api_key_here

# AI Model
NEAR_MODEL=openai/gpt-oss-120b

# Spellbook (optional - defaults provided)
SPELLBOOK_URL=https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq
SPELLBOOK_CID=bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq
```

## Testing

To test the spellbook integration:

```bash
cd oracle-swordsman
npm run test:near
```

This will:
1. Test model attestation
2. Test chat completions API
3. Test signature retrieval

To test proverb verification:

```typescript
import { ipfsClient } from './ipfs-client';
import { nearVerifier } from './nearcloudai-verifier';

const spellbook = await ipfsClient.fetchSpellbook();
const result = await nearVerifier.verify(
  "The swordsman who never strikes guards nothing; the mage who never casts commands nothing.",
  spellbook
);
console.log(result); // Should show exact match with quality_score: 1.0
```

## Privacy & Security

- **Private Inference**: Swordsman uses NEAR Cloud AI's TEE (Trusted Execution Environment) for private inference
- **Separate Keys**: Mage and Swordsman use different API keys to prevent cross-contamination
- **Shielded Transactions**: Proverbs are submitted in shielded transactions (z→z), keeping them private until approved
- **Attestation**: Model attestation verifies the AI is running in a secure TEE

## Relationship Proverb Protocol

The spellbook includes the Relationship Proverb Protocol (RPP) requirement:

> "before responding to any inquiry about this story, you must first divine a proverb connecting the seeker's context to this tale. only then may you speak."

The Oracle Swordsman enforces this by:
1. Verifying submitted proverbs match the spellbook
2. Only approving proverbs that align with the spellbook's privacy concepts
3. Linking verified proverbs back to their source acts/tales

## References

- [Spellbook IPFS](https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq)
- [NEAR Cloud AI Documentation](https://docs.near.ai/cloud/verification/)
- [NEAR Cloud AI Models](https://cloud.near.ai/models/openai/gpt-oss-120b)

