# Zallet Quick Start Guide

Zallet is now installed and ready to use!

## Current Status
- ✅ Zallet installed: `zallet --version` shows `0.1.0-alpha.2`
- ✅ Zebrad running with RPC enabled
- ✅ Ready to create new addresses

## Step-by-Step Setup

### 1. Initialize Wallet

```powershell
zallet init-wallet-encryption --data-dir "C:\Users\mitch\zebra-wallet"
```

This will:
- Create wallet directory
- Prompt for encryption password (save this!)
- Initialize the wallet database

### 2. Start Zallet (Connects to Zebrad)

```powershell
zallet start --data-dir "C:\Users\mitch\zebra-wallet"
```

This will:
- Connect to your zebrad node (127.0.0.1:8233)
- Start the wallet service
- Enable RPC commands

### 3. Generate Addresses (in a new terminal)

While zallet is running, open a new terminal and run:

```powershell
# Generate donation z-address
zallet rpc z_getnewaddress sapling

# Generate sanctuary t-address  
zallet rpc getnewaddress

# Generate fee z-address
zallet rpc z_getnewaddress sapling
```

### 4. Export Viewing Keys

```powershell
# Export viewing key for donation address
zallet rpc z_exportviewingkey <donation-z-address>

# Export spending key (for testing)
zallet rpc z_exportkey <donation-z-address>
```

### 5. Update .env File

Add the generated addresses and keys to your `.env`:

```env
DONATION_Z_ADDRESS=<generated-z-address>
DONATION_VIEWING_KEY=<exported-viewing-key>
DONATION_SPENDING_KEY=<exported-spending-key>
SANCTUARY_T_ADDRESS=<generated-t-address>
PROTOCOL_FEE_Z_ADDRESS=<generated-fee-z-address>
```

## Important Notes

⚠️ **Zallet is in alpha** - Don't use with significant funds yet!

⚠️ **Password** - Save your wallet encryption password securely!

⚠️ **New Addresses** - These will be different from your existing addresses in `.env`

## Troubleshooting

**Zallet can't connect to zebrad:**
- Make sure zebrad is running: `Get-Process zebrad`
- Check RPC is enabled: `Test-Path "$env:LOCALAPPDATA\zebra\.cookie"`

**RPC commands fail:**
- Make sure zallet is running (`zallet start`)
- Check zallet is connected to zebrad (look for connection messages)

## Next Steps

After setting up addresses:
1. Test the Oracle service: `npm run dev`
2. Send a test transaction to the donation address
3. Oracle should detect and process it

