# Nillion Integration Options for Oracle Swordsman

## Current Architecture

The Oracle Swordsman is designed as an **automated backend service** that:
- Runs 24/7 continuously
- Monitors Zcash transactions automatically
- Verifies proverbs with AI
- Signs and broadcasts transactions without human intervention
- Processes submissions in real-time

## Option 1: Browser-Based Solution ❌ **Not Recommended**

### How it would work:
- User opens a browser interface
- Oracle queues transactions that need signing
- User manually approves and signs each transaction in browser
- Browser uses Nillion SDK to sign via SecretSigner

### Problems:
1. **Breaks Automation**: Requires human presence for every inscription
2. **Not 24/7**: Can't process submissions when user is away
3. **Poor UX**: Users expect automatic processing
4. **Scalability**: Can't handle high volume
5. **Architecture Mismatch**: Oracle should be autonomous

### When it might work:
- Only for initial setup/key management
- For manual approval workflows (not recommended for production)

---

## Option 2: Direct REST API Integration ✅ **Recommended**

### How it would work:
- Oracle Swordsman makes HTTP requests to Nillion's REST API
- Uses API key for authentication
- Calls endpoints for:
  - Key storage (SecretSigner.storeKey)
  - Transaction signing (SecretSigner.sign)
  - Attestation retrieval

### Advantages:
- ✅ Works in Node.js backend
- ✅ Maintains automation
- ✅ 24/7 operation
- ✅ No browser dependency
- ✅ Fits current architecture

### Implementation:
```typescript
// oracle-swordsman/src/nillion-signer.ts
import axios from 'axios';

export class NillionSigner {
  private apiKey: string;
  private apiUrl: string;
  
  constructor() {
    this.apiKey = config.nillion.apiKey;
    this.apiUrl = config.nillion.network === 'mainnet' 
      ? 'https://api.nillion.com/v1'
      : 'https://api-testnet.nillion.com/v1';
  }
  
  async signTransaction(txHash: Buffer): Promise<Buffer> {
    const response = await axios.post(
      `${this.apiUrl}/secret-signer/sign`,
      {
        keyStoreId: this.keyStoreId,
        message: txHash.toString('hex'),
        algorithm: 'ECDSA'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return Buffer.from(response.data.signature, 'hex');
  }
}
```

### Next Steps:
1. Check Nillion API documentation for REST endpoints
2. Find correct API base URLs for testnet/mainnet
3. Implement HTTP client for Nillion API
4. Test with actual API calls

---

## Option 3: Hybrid Approach (Setup + Automation)

### How it would work:
- **Browser**: Initial key setup and management
  - User sets up SecretSigner key store via browser
  - Key store ID saved to backend config
- **Backend**: Automated signing via REST API
  - Oracle uses key store ID to sign transactions
  - No browser needed for daily operations

### Advantages:
- ✅ Best of both worlds
- ✅ Secure initial setup
- ✅ Automated daily operations
- ✅ User controls key creation

### Flow:
```
1. User → Browser → Nillion SDK → Create key store
2. Browser → Save keyStoreId to backend
3. Backend → REST API → Sign transactions (automated)
```

---

## Option 4: Check for Server-Side SDK

### Possibilities:
- Nillion might have a Node.js SDK we haven't found
- Could be in beta or private repo
- Might require special access

### Action:
- Contact Nillion support/Discord
- Ask about server-side integration
- Request Node.js SDK or API documentation

---

## Recommendation

**Use Option 2 (REST API)** because:
1. Maintains automated oracle architecture
2. Works with current Node.js backend
3. No browser dependency
4. 24/7 operation
5. Scalable

**Fallback to Option 3 (Hybrid)** if:
- REST API doesn't support all operations
- Need browser for key setup only

**Avoid Option 1 (Browser-only)** because:
- Breaks the oracle automation model
- Poor user experience
- Not scalable

---

## Next Steps

1. **Research Nillion REST API**
   - Find API documentation
   - Identify endpoints for:
     - SecretSigner operations
     - Key storage
     - Transaction signing
     - Attestation

2. **Implement HTTP Client**
   - Create `nillion-api-client.ts`
   - Handle authentication with API key
   - Implement signing operations

3. **Update nillion-signer.ts**
   - Replace placeholders with REST API calls
   - Add error handling and retries
   - Test with real API

4. **Test Integration**
   - Verify API key works
   - Test key storage
   - Test transaction signing
   - Verify attestation

---

## Resources

- Nillion Docs: https://docs.nillion.com
- Nillion Discord: https://discord.gg/nillion
- API Key: Set via `NILLION_API_KEY` environment variable

