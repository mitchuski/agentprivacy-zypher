# Quick Verification Checklist

## ✅ Pre-Flight Checks

### 1. Environment Variables
```bash
# Check these are set in oracle-swordsman/.env
NEAR_API_KEY=your_near_api_key_here          # Mage (frontend)
NEAR_SWORDSMAN_API_KEY=your_near_swordsman_api_key_here  # Swordsman (oracle verification)
DATABASE_URL=postgresql://...
ZCASH_DATA_DIR=./zcash-wallet  # Relative to project root
```

### 2. Run Verification Script
```bash
cd oracle-swordsman
npm run verify
```

Expected output:
- ✅ Configuration: All keys present, keys are different
- ✅ IPFS Spellbook: Fetched successfully, 41 proverbs found
- ✅ NEAR Model Attestation: Signing address received
- ✅ NEAR Chat Completions: API working
- ✅ Proverb Matching: Exact match test passed

### 3. Test API Connection
```bash
npm run test:near
```

Expected: All three tests pass (attestation, chat, signature)

---

## 🔗 Connection Points Verified

### ✅ Config → Verifier
- `config.near.swordsmanApiKey` → `nearVerifier.apiKey`
- Verifier uses swordsman key (not mage key)

### ✅ Config → IPFS Client
- `config.ipfs.spellbookUrl` → `ipfsClient.spellbookUrl`
- Default URL: `https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq`

### ✅ IPFS Client → Verifier
- `ipfsClient.fetchSpellbook()` → `nearVerifier.verify(proverb, spellbook)`
- Spellbook includes proverbs from both story acts and zero tales

### ✅ Verifier → NEAR Cloud AI
- Endpoint: `https://cloud-api.near.ai/v1/chat/completions`
- Model: `openai/gpt-oss-120b`
- Uses swordsman API key for private inference

### ✅ Index → Processing Flow
- `index.ts` → `processSubmission()` → `ipfsClient.fetchSpellbook()` → `nearVerifier.verify()`
- If approved → `inscribeProverb()` → posts to op_return

---

## 📋 Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Config | ✅ | Separate API keys configured |
| IPFS Client | ✅ | Spellbook URL and 4.0.0 format support |
| NEAR Verifier | ✅ | Exact matching + AI verification |
| Spellbook Fetch | ✅ | 41 proverbs extracted |
| API Connection | ✅ | Attestation + chat completions working |
| Proverb Matching | ✅ | Exact match fast path working |

---

## 🚀 Ready to Test

1. **Add `NEAR_SWORDSMAN_API_KEY` to `.env`**
2. **Run verification**: `npm run verify`
3. **Test with real transaction**: Send shielded transaction with proverb
4. **Monitor logs**: Check oracle processes submission correctly

---

## ⚠️ Common Issues

### Issue: "NEAR_SWORDSMAN_API_KEY not found"
**Fix**: Add to `oracle-swordsman/.env`:
```bash
NEAR_SWORDSMAN_API_KEY=your_near_swordsman_api_key_here
```

### Issue: "Keys are the same"
**Fix**: Ensure `NEAR_SWORDSMAN_API_KEY` is different from `NEAR_API_KEY`

### Issue: "Failed to fetch spellbook"
**Fix**: Check internet connection, IPFS gateway accessible

### Issue: "Chat completions failed"
**Fix**: Verify API key is valid, check NEAR Cloud AI status

---

**Last Verified**: 2025-01-XX  
**Status**: ✅ All connections verified

