# Getting Started - Backend & Wallet

Quick guide to get the Oracle backend and wallet page running for experiments.

---

## Prerequisites

1. **Zebra Node Running**
   - Should be running on `127.0.0.1:8233`
   - Check with: `Get-Process -Name zebrad`

2. **Database Setup**
   - PostgreSQL should be running
   - Database `oracle_swordsman` should exist
   - Schema should be initialized

3. **Environment Variables**
   - `.env` file in `oracle-swordsman` directory
   - See `.env.example` or template below

---

## Quick Start

### Step 1: Check Status

```powershell
cd oracle-swordsman
.\scripts\check-backend-status.ps1
```

This will verify:
- ✅ Oracle API service
- ✅ Zebra node
- ✅ Database connection

### Step 2: Build (if needed)

```powershell
cd oracle-swordsman
npm run build
```

### Step 3: Start Backend

```powershell
cd oracle-swordsman
npm start
```

Or use the helper script:
```powershell
.\scripts\start-backend.ps1
```

The service will start on:
- **API:** http://localhost:3001
- **Wallet UI:** http://localhost:3001/wallet
- **Admin UI:** http://localhost:3001/admin

---

## Environment Variables

Create `.env` file in `oracle-swordsman` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oracle_swordsman

# Zcash RPC (from Zebra)
ZCASH_RPC_URL=http://127.0.0.1:8233
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password

# NEAR Cloud AI
NEAR_CLOUD_AI_API_KEY=your_api_key
NEAR_CLOUD_AI_API_URL=https://api.near.cloud.ai

# IPFS
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
IPFS_CID=your_spellbook_cid

# API
PORT=3001
NODE_ENV=development
```

**To get Zebra RPC credentials:**
```powershell
$cookiePath = "$env:LOCALAPPDATA\zebra\.cookie"
$cookieContent = Get-Content $cookiePath -Raw
$cookieParts = $cookieContent.Trim().Split(':')
$rpcUser = $cookieParts[0]
$rpcPass = $cookieParts[1]
Write-Host "RPC User: $rpcUser"
Write-Host "RPC Pass: $rpcPass"
```

---

## Wallet Page

The wallet page is available at:
- **Backend Wallet UI:** http://localhost:3001/wallet
- **Frontend Wallet Page:** http://localhost:3000/wallet (if frontend is running)

Both should work, but the frontend version is more integrated with the rest of the app.

---

## Testing the Setup

### 1. Check API Health

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

Should return: `{"status":"ok"}`

### 2. Check Addresses Endpoint

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/wallet/addresses" | ConvertFrom-Json
```

Should return all 36 addresses (18 z-addresses, 18 t-addresses)

### 3. Check Proverbs Endpoint

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/wallet/proverbs" | ConvertFrom-Json
```

Should return list of proverbs (may be empty initially)

---

## Troubleshooting

### Oracle Service Won't Start

1. **Check if port 3001 is in use:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Check build:**
   ```powershell
   npm run build
   ```

3. **Check logs:**
   - Look for errors in the terminal output
   - Check database connection
   - Verify Zebra is running

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```powershell
   Get-Service -Name postgresql*
   ```

2. **Test connection:**
   ```powershell
   psql -U postgres -d oracle_swordsman -c "SELECT 1;"
   ```

3. **Check DATABASE_URL in .env**

### Zebra Connection Issues

1. **Verify Zebra is running:**
   ```powershell
   Get-Process -Name zebrad
   ```

2. **Check RPC port:**
   ```powershell
   netstat -ano | findstr :8233
   ```

3. **Verify credentials in .env match Zebra cookie**

---

## Next Steps

Once everything is running:

1. ✅ Verify addresses are loading in wallet page
2. ✅ Check balances are updating
3. ✅ Test proverb submission flow
4. ✅ Monitor transactions in wallet UI

Ready for experiments! 🚀

