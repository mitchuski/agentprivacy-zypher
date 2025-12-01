# Starting Oracle Swordsman Service

## Quick Start

1. **Navigate to directory**:
   ```powershell
   cd oracle-swordsman
   ```

2. **Start the service**:
   ```powershell
   npm run dev
   ```

3. **Wait for startup** (about 10-15 seconds)

4. **Access Admin Interface**:
   ```
   http://localhost:3001/admin
   ```

## Verify It's Running

### Health Check
```powershell
curl.exe http://localhost:3001/health
```
Should return: `{"status":"ok","service":"oracle-swordsman"}`

### Check Port
```powershell
netstat -ano | findstr :3001
```
Should show port 3001 is LISTENING

## URLs

- **Admin Interface**: http://localhost:3001/admin
- **Health Check**: http://localhost:3001/health
- **Stats API**: http://localhost:3001/api/stats
- **Submissions API**: http://localhost:3001/api/admin/submissions

## Troubleshooting

### Service Won't Start

1. **Check .env file exists**:
   ```powershell
   Test-Path oracle-swordsman\.env
   ```

2. **Check required variables**:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEAR_SWORDSMAN_API_KEY` - Oracle verification key
   - `NEAR_API_KEY` - Mage agent key (optional if Swordsman key is set)

3. **Check database is running**:
   ```powershell
   # Test PostgreSQL connection
   psql $env:DATABASE_URL -c "SELECT 1;"
   ```

4. **Check port 3001 is free**:
   ```powershell
   netstat -ano | findstr :3001
   ```
   If port is in use, kill the process or change PORT in .env

### Common Errors

- **"Cannot find module"**: Run `npm install` in oracle-swordsman directory
- **"Database connection failed"**: Check DATABASE_URL and ensure PostgreSQL is running
- **"Port already in use"**: Change PORT in .env or kill existing process

## Next Steps

Once the service is running:
1. Open http://localhost:3001/admin
2. Create a test submission
3. Review submissions and verifications

