# Oracle Swordsman

**TEE worker for Proverb Revelation Protocol**

The Oracle Swordsman is the backend service that processes proverb submissions, verifies them with AI, and inscribes them on the Zcash blockchain using hardware-enforced privacy via Nillion TEE.

## Architecture

```
Oracle Swordsman (Nillion TEE)
├─ Monitors Zcash SHIELDED pool for incoming transactions (z→z)
├─ Decrypts memos to extract proverbs
├─ Fetches spellbook from IPFS/Pinata
├─ Verifies proverbs with NEAR Cloud AI
├─ Signs transactions with Nillion SecretSigner
└─ Broadcasts PUBLIC inscriptions to transparent address (spellbook)
   (61.8% to t-address with OP_RETURN inscription, 38.2% to z-address)
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 12+
- zecwallet-cli (for Zcash light client)
- API keys: Nillion, NEAR Cloud AI, Pinata

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys and configuration
```

### Database Setup

```bash
# Create database and user (if not exists)
sudo -u postgres createuser -P proverb_user
sudo -u postgres createdb -O proverb_user proverb_protocol

# Apply schema
psql -U proverb_user -d proverb_protocol -h localhost < ../scripts/schema.sql
```

### Zcash Wallet Setup

```bash
# Install zecwallet-cli (requires Rust)
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli

# Start light client (testnet)
# Note: Some versions don't support --data-dir flag
zecwallet-cli --server https://zec.rocks:443

# Create wallet and addresses
# In zecwallet-cli prompt:
new                    # Create new wallet
new z                  # Get shielded address (for receiving user submissions)
address                # Get transparent address (for public inscriptions to spellbook)
```

**Windows Note**: If your `zecwallet-cli` version doesn't support `--data-dir`, the code automatically uses the default wallet location. The `zcash-client.ts` has been updated to handle this.

## Development

```bash
# Run in development mode (with auto-reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run production build
npm start
```

## Testing

```bash
# Test foundation (config, database, zcash)
npm test
```

## Project Structure

```
oracle-swordsman/
├── src/
│   ├── config.ts           # Configuration management
│   ├── logger.ts           # Winston logger
│   ├── database.ts         # PostgreSQL operations
│   ├── zcash-client.ts     # Zcash light client wrapper
│   ├── ipfs-client.ts     # IPFS/Pinata integration (Phase 2)
│   ├── near-verifier.ts  # AI verification (Phase 2)
│   ├── nillion-signer.ts  # TEE signing (Phase 2)
│   ├── index.ts            # Main Oracle loop (Phase 2)
│   └── test-foundation.ts  # Foundation tests
├── tests/                  # Unit tests
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

See `.env.example` for all required variables.

**Critical Variables:**
- `NILLION_API_KEY` - TEE access (optional for now)
- `NEAR_API_KEY` - Mage agent API key (frontend/website, required)
- `NEAR_SWORDSMAN_API_KEY` - Swordsman agent API key (oracle verification, **MUST be separate from mage key**, required)
- `NEAR_MODEL` - AI model (default: `openai/gpt-oss-120b`)
- `SPELLBOOK_URL` - Direct IPFS URL to spellbook (default: `https://red-acute-chinchilla-216.mypinata.cloud/ipfs/QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`)
- `SPELLBOOK_CID` - IPFS content ID (default: `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`)
- `PINATA_JWT` - IPFS access (optional, only needed for uploading)
- `PINATA_GATEWAY` - IPFS gateway URL (default: `https://red-acute-chinchilla-216.mypinata.cloud`)
- `DATABASE_URL` - PostgreSQL connection (required)
- `ZCASH_DATA_DIR` - Wallet directory (Windows path supported)
- `ZCASH_SHIELDED_RECEIVE_ADDRESS` - Shielded address (receives user submissions, required)
- `ZCASH_PUBLIC_INSCRIPTION_ADDRESS` - Transparent address (posts to spellbook, required)

## Status

**Phase 1 (Foundation)**: ✅ Complete
- Configuration module
- Database module
- Zcash client wrapper (Windows-compatible)
- Logger
- Foundation tests

**Phase 2 (Backend)**: ✅ ~85% Complete
- ✅ IPFS integration (spellbook v4.0.0-canonical)
- ✅ NEAR Cloud AI integration (configured)
- ✅ Memo parser (multi-format support)
- ✅ Transaction monitor (event-based)
- ✅ Transaction builder (61.8/38.2 golden ratio split)
- ✅ Comprehensive utilities
- ⏳ Nillion TEE integration (optional, pending API key)
- ⏳ Main Oracle loop (ready for testing)

**Current Spellbook**: IPFS CID `QmRvH6HcMibbejacSjZduBG8cxQgqDW19s5EgmWmdEDmay`

## Documentation

- [Main README](../../README.md)
- [Architecture Guide](../../02-ARCHITECTURE.md)
- [Build Guide](../../03-BUILD_GUIDE.md)
- [API Reference](../../04-API_REFERENCE.md)

## License

MIT

