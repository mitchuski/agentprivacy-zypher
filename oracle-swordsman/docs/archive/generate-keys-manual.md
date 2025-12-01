# Manual Key Generation Guide

Since zebrad doesn't support wallet RPC methods, you need to generate keys using a wallet tool.

## Option 1: Use zcash-cli (if you have zcashd installed)

If you have `zcash-cli` available, you can generate keys:

```powershell
# Generate donation z-address
zcash-cli z_getnewaddress sapling

# Export viewing key
zcash-cli z_exportviewingkey <donation-address>

# Export spending key (for testing)
zcash-cli z_exportkey <donation-address>

# Generate sanctuary t-address
zcash-cli getnewaddress

# Generate fee z-address
zcash-cli z_getnewaddress sapling
```

## Option 2: Use zecwallet-cli (Light Wallet)

Install zecwallet-cli:
```powershell
cargo install --locked --git https://github.com/zingolabs/zecwallet-light-cli
```

Then:
```powershell
# Start wallet
zecwallet-cli --server https://zec.rocks:443

# In wallet CLI:
new z          # Generate shielded address
address        # Get transparent address
```

## Option 3: Generate Test Keys Manually

For testing, you can manually create addresses. Add to `.env`:

```env
# Test Keys (replace with actual values from your wallet)
DONATION_Z_ADDRESS=zs1...
DONATION_VIEWING_KEY=zxviews1...
DONATION_SPENDING_KEY=zxsecrets1...
SANCTUARY_T_ADDRESS=t1...
PROTOCOL_FEE_Z_ADDRESS=zs1...
```

## Option 4: Use Existing Addresses

If you already have addresses from your `.env`:
- Use `ZCASH_PRIVATE_SHIELDED_ADDRESS` as donation address
- Use `ZCASH_PUBLIC_INSCRIPTION_ADDRESS` as sanctuary address
- Generate a new fee address using your wallet

