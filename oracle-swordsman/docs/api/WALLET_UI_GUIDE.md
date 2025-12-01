# Wallet UI Guide

## Accessing the Wallet Interface

### Step 1: Start the Oracle Swordsman Backend

```bash
cd oracle-swordsman
npm run dev
```

The server will start on port 3001 (or PORT from .env).

### Step 2: Open the Wallet UI

Open your browser and navigate to:
```
http://localhost:3001/wallet
```

## Features

### View Addresses
- See all your T-addresses and Z-addresses
- View balances for each address
- See derivation paths
- Identify address types

### Check Balances
- Real-time balance checking
- Automatic refresh
- Balance display in ZEC

### Send Transactions
- Select from address (dropdown)
- Enter recipient address
- Specify amount
- Choose transparent or shielded transaction
- Send with one click

## API Endpoints

The wallet UI uses these API endpoints:

- `GET /api/wallet/addresses` - Get all addresses
- `GET /api/wallet/balances` - Get all balances
- `GET /api/wallet/balance/:address` - Get specific address balance
- `POST /api/wallet/send` - Send transaction
- `GET /api/wallet/unspent/:address` - Get unspent outputs

## Security Notes

- ⚠️ **Private keys are NOT sent to the frontend** - Only address info
- ⚠️ **Transactions are signed server-side** - Using Zcash RPC
- ⚠️ **Keep the backend secure** - It has access to RPC credentials

## Troubleshooting

### UI not loading
- Check if backend is running: `npm run dev`
- Check port: Default is 3001
- Check browser console for errors

### Balances not showing
- Ensure zebrad is running with RPC enabled
- Check RPC connection in backend logs
- Verify addresses are in `zcash-addresses-controlled.json`

### Transactions failing
- Check zebrad is synced
- Verify sufficient balance
- Check RPC credentials
- Review backend logs for errors

## Files

- `wallet-ui/index.html` - Wallet interface
- `src/api.ts` - API endpoints (wallet routes)
- `zcash-addresses-controlled.json` - Address data

## Next Steps

1. ✅ UI created
2. ✅ API endpoints added
3. ⏳ Test with real transactions
4. ⏳ Add transaction history
5. ⏳ Add address generation

