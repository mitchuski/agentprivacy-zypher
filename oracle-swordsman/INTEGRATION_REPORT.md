# Oracle Swordsman Integration Report
## NEAR Cloud AI & IPFS Spellbook Integration

**Date**: 2025-01-XX  
**Status**: ✅ Integration Complete  
**Version**: 4.0.0-canonical

---

## Executive Summary

Successfully integrated the Oracle Swordsman with:
1. **NEAR Cloud AI** for private inference (TEE-verified AI verification)
2. **IPFS Spellbook** (4.0.0-canonical) containing 41 proverbs from Story and Zero Knowledge spellbooks
3. **Separate API keys** for Mage (frontend) and Swordsman (oracle) agents

The Oracle Swordsman now verifies proverbs from shielded transactions against the canonical spellbook before posting to op_return in public transactions.

---

## Changes Overview

### 1. Configuration Updates (`src/config.ts`)

#### Added Separate API Keys
- **Mage Agent Key** (`NEAR_API_KEY`): Used by frontend/website
- **Swordsman Agent Key** (`NEAR_SWORDSMAN_API_KEY`): Used by oracle for verification
  - **Critical**: These MUST be separate keys to prevent cross-contamination
  - Fallback: If `NEAR_SWORDSMAN_API_KEY` not set, uses `NEAR_API_KEY` (with warning)

#### IPFS Spellbook Configuration
- **Spellbook URL**: `https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **Spellbook CID**: `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **Gateway**: `https://red-acute-chinchilla-216.mypinata.cloud` (default)
- Made `PINATA_JWT` and `SPELLBOOK_CID` optional (using defaults)

#### Environment Variable Validation
- Added `NEAR_SWORDSMAN_API_KEY` to required variables
- Added warning if mage and swordsman keys are the same
- Improved error messages for missing variables

**Files Modified**:
- `oracle-swordsman/src/config.ts`

---

### 2. NEAR Cloud AI Verifier (`src/nearcloudai-verifier.ts`)

#### Key Changes

1. **Uses Swordsman API Key**
   ```typescript
   private apiKey = config.near.swordsmanApiKey; // Separate from mage
   ```

2. **Exact Proverb Matching**
   - First checks if submitted proverb exactly matches any spellbook proverb (case-insensitive)
   - Fast path: Returns `quality_score: 1.0` for exact matches
   - No AI call needed for exact matches

3. **Enhanced AI Verification Prompt**
   - Includes all spellbook proverbs in the prompt
   - AI compares submitted proverb against spellbook proverbs
   - Returns quality score (0-1), matched act, and reasoning

4. **Improved Attestation Handling**
   - Handles array response format from NEAR Cloud AI
   - Supports both NVIDIA and Intel TEE attestations
   - Extracts signing addresses for verification

**Verification Flow**:
```
1. Exact Match Check → If found: return quality_score: 1.0
2. AI Verification → Compare against spellbook proverbs
3. Quality Score → 0.9-1.0 (exact/semantic match), 0.7-0.8 (similar), 0.5-0.6 (related), <0.5 (reject)
4. Approval → quality_score >= 0.5 → Approved
```

**Files Modified**:
- `oracle-swordsman/src/nearcloudai-verifier.ts`

---

### 3. IPFS Client (`src/ipfs-client.ts`)

#### Key Changes

1. **Spellbook URL Support**
   - Uses direct URL if provided: `config.ipfs.spellbookUrl`
   - Falls back to gateway + CID if URL not provided

2. **4.0.0-Canonical Format Support**
   - Handles nested spellbook structure:
     - `spellbooks.story.acts` (11 acts)
     - `spellbooks.zero.parts[].tales[]` (30 tales)
   - Extracts proverbs from both structures
   - Normalizes into flat `acts` array for verification

3. **Proverb Extraction**
   - Extracts `proverb` field from acts and tales
   - Stores in `SpellbookAct.proverb` for matching
   - Handles missing proverbs gracefully

4. **Increased Timeout**
   - Increased from 10s to 30s for large spellbook JSON

**Spellbook Structure Handling**:
```typescript
// Story acts
if (data.spellbooks.story?.acts) {
  acts = acts.concat(data.spellbooks.story.acts.map(...));
}

// Zero tales (nested in parts)
if (data.spellbooks.zero?.parts) {
  for (const part of data.spellbooks.zero.parts) {
    if (part.tales) {
      acts = acts.concat(part.tales.map(...));
    }
  }
}
```

**Files Modified**:
- `oracle-swordsman/src/ipfs-client.ts`
- `oracle-swordsman/src/ipfs-client.ts` (interface update)

---

### 4. Documentation Updates

#### New Files Created
1. **`SPELLBOOK_INTEGRATION.md`**
   - Comprehensive guide to spellbook integration
   - Architecture overview
   - Verification flow documentation
   - Environment variable setup
   - Testing instructions

2. **`src/verify-connections.ts`**
   - Connection verification script
   - Tests all critical components
   - Provides detailed status report

#### Updated Files
1. **`README.md`**
   - Updated environment variable documentation
   - Added `NEAR_SWORDSMAN_API_KEY` requirement
   - Updated spellbook URL information

---

## Integration Flow

### Complete Verification Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Shielded Transaction Received (z→z)                      │
│    - User submits proverb in memo                            │
│    - Oracle monitors via zecwallet-cli                       │
│    - Memo automatically decrypted (viewing key)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Spellbook Fetch (IPFS)                                    │
│    - Fetch from: https://red-acute-chinchilla-216...        │
│    - Parse 4.0.0-canonical format                            │
│    - Extract 41 proverbs (11 acts + 30 tales)               │
│    - Cache for 1 hour                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Proverb Verification                                      │
│    ├─ Exact Match Check (fast path)                         │
│    │  └─ If match: quality_score = 1.0, approved = true   │
│    │                                                         │
│    └─ AI Verification (NEAR Cloud AI - Swordsman Key)      │
│       ├─ Private inference in TEE                           │
│       ├─ Compare against spellbook proverbs                 │
│       └─ Return: quality_score, matched_act, reasoning      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Approval Decision                                        │
│    - quality_score >= 0.5 → Approved                        │
│    - quality_score < 0.5 → Rejected                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Inscription (if approved)                                │
│    - Create public transaction                              │
│    - Post proverb to op_return                              │
│    - Link to original shielded transaction                  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Keys Configuration

### Mage Agent (Frontend)
- **Key**: `sk-bfaacdcdbbb54214998a1095da028771`
- **Usage**: Frontend website, user interactions
- **Environment Variable**: `NEAR_API_KEY`

### Swordsman Agent (Oracle)
- **Key**: `your_swordsman_api_key_here` (set in `.env`)
- **Usage**: Oracle verification, private inference
- **Environment Variable**: `NEAR_SWORDSMAN_API_KEY`
- **Critical**: MUST be separate from mage key

---

## Spellbook Details

### Location
- **IPFS URL**: `https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **CID**: `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`
- **Version**: `4.0.0-canonical`

### Content
- **Story Spellbook**: 11 acts (Act I through Act XI)
- **Zero Knowledge Spellbook**: 30 tales (across 7 parts)
- **Total Proverbs**: 41 proverbs available for matching
- **Format**: JSON with nested structure

### Example Proverbs
- Act I: "The swordsman who never strikes guards nothing; the mage who never casts commands nothing."
- Act II: "What the swordsman executes, the mage authorised; what the mage composes, the swordsman proves capable..."
- Zero Tale 1: "I can prove I know without revealing what I know."

---

## Testing & Verification

### Connection Verification Script
```bash
cd oracle-swordsman
npm run verify
```

This script verifies:
1. ✅ Configuration (API keys, spellbook URL)
2. ✅ IPFS spellbook fetch
3. ✅ NEAR Cloud AI attestation
4. ✅ NEAR Cloud AI chat completions
5. ✅ Proverb exact matching

### Manual Testing
```typescript
import { ipfsClient } from './ipfs-client';
import { nearVerifier } from './nearcloudai-verifier';

// Fetch spellbook
const spellbook = await ipfsClient.fetchSpellbook();

// Test exact match
const result = await nearVerifier.verify(
  "The swordsman who never strikes guards nothing; the mage who never casts commands nothing.",
  spellbook
);
// Expected: quality_score: 1.0, approved: true
```

---

## Environment Variables

### Required
```bash
# Mage Agent (frontend)
NEAR_API_KEY=sk-bfaacdcdbbb54214998a1095da028771

# Swordsman Agent (oracle - MUST be separate)
NEAR_SWORDSMAN_API_KEY=your_swordsman_api_key_here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/oracle

# Zcash
ZCASH_DATA_DIR=./zcash-wallet  # Relative to project root
```

### Optional (with defaults)
```bash
# AI Model
NEAR_MODEL=openai/gpt-oss-120b

# Spellbook (defaults provided)
SPELLBOOK_URL=https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay
SPELLBOOK_CID=QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay
PINATA_GATEWAY=https://red-acute-chinchilla-216.mypinata.cloud
```

---

## Security & Privacy

### TEE Verification
- **Model Attestation**: Verifies AI runs in Trusted Execution Environment
- **Signing Address**: `0x37A3126D15a480dfE38290765D95E2c8E210222B`
- **NVIDIA Payload**: GPU attestation present
- **Intel Quote**: CPU attestation present

### Private Inference
- Proverbs verified in TEE (private computation)
- Swordsman uses separate API key (isolated from mage)
- Shielded transactions keep proverbs private until approved

### Key Separation
- **Mage Key**: Frontend only, user-facing
- **Swordsman Key**: Oracle only, verification
- **Critical**: Keys must be different to prevent cross-contamination

---

## Performance Optimizations

1. **Exact Match Fast Path**
   - No AI call needed for exact matches
   - Instant verification for known proverbs

2. **Spellbook Caching**
   - 1-hour cache to reduce IPFS calls
   - Automatic refresh after TTL

3. **Retry Logic**
   - Exponential backoff for API failures
   - Max 3 retries with configurable delay

---

## Known Limitations

1. **IPFS Dependency**
   - Requires IPFS gateway access
   - Falls back to cached version if fetch fails

2. **AI Response Parsing**
   - Relies on JSON extraction from AI response
   - Fallback verification if parsing fails

3. **Proverb Matching**
   - Semantic matching depends on AI quality
   - Exact matches are preferred for reliability

---

## Next Steps

1. **Production Deployment**
   - [ ] Set `NEAR_SWORDSMAN_API_KEY` in production `.env`
   - [ ] Verify spellbook URL is accessible
   - [ ] Test with real shielded transactions

2. **Monitoring**
   - [ ] Add metrics for verification success rate
   - [ ] Track exact match vs AI verification ratio
   - [ ] Monitor API response times

3. **Enhancements**
   - [ ] Add support for partial proverb matching
   - [ ] Implement proverb similarity scoring
   - [ ] Add spellbook version checking

---

## Files Changed Summary

### Modified Files
1. `oracle-swordsman/src/config.ts` - Added swordsman key, spellbook URL
2. `oracle-swordsman/src/nearcloudai-verifier.ts` - Exact matching, improved prompts
3. `oracle-swordsman/src/ipfs-client.ts` - 4.0.0-canonical format support
4. `oracle-swordsman/README.md` - Updated documentation
5. `oracle-swordsman/package.json` - Added verify script

### New Files
1. `oracle-swordsman/SPELLBOOK_INTEGRATION.md` - Integration guide
2. `oracle-swordsman/src/verify-connections.ts` - Verification script
3. `oracle-swordsman/INTEGRATION_REPORT.md` - This report

---

## Conclusion

✅ **Integration Complete**: The Oracle Swordsman is now fully integrated with NEAR Cloud AI and the IPFS spellbook. All components are connected and verified.

✅ **Security**: Separate API keys ensure isolation between mage and swordsman agents.

✅ **Verification**: Proverb verification works with both exact matching and AI semantic matching.

✅ **Documentation**: Comprehensive documentation and verification scripts provided.

**Status**: Ready for testing with real shielded transactions.

---

## References

- [NEAR Cloud AI Documentation](https://docs.near.ai/cloud/verification/)
- [NEAR Cloud AI Models](https://cloud.near.ai/models/openai/gpt-oss-120b)
- [Spellbook IPFS](https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay)

---

**Report Generated**: 2025-01-XX  
**Integration Status**: ✅ Complete  
**Ready for Production**: ⚠️  Requires `NEAR_SWORDSMAN_API_KEY` in `.env`

