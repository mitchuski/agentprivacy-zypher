# 🚀 Start Oracle Swordsman Admin Interface

## Quick Start

### 1. Open Terminal in Project Root

### 2. Navigate to Oracle Directory
```powershell
cd oracle-swordsman
```

### 3. Start the Service
```powershell
npm run dev
```

### 4. Wait for Startup (10-15 seconds)
Look for these messages:
- `✓ Database connection established`
- `✓ API server started`
- `Oracle API server listening on port 3001`
- `Admin interface available at http://localhost:3001/admin`

### 5. Open Admin Interface
```
http://localhost:3001/admin
```

---

## ✅ Verify It's Running

### Check Health
Open in browser or run:
```powershell
curl.exe http://localhost:3001/health
```

Should return: `{"status":"ok","service":"oracle-swordsman"}`

### Check Port
```powershell
netstat -ano | findstr :3001
```

---

## 🔧 Required Configuration

Make sure `oracle-swordsman/.env` has:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEAR_SWORDSMAN_API_KEY=sk-876c0f435b14449bac47f13583f5fd68
NEAR_API_KEY=sk-bfaacdcdbbb54214998a1095da028771
```

---

## 🎯 Admin Interface Features

Once running, you can:

1. **View Statistics** - Total submissions, pending, approved, rejected
2. **Create Test Submissions** - Test proverbs without real transactions
3. **Review Submissions** - See all submissions with quality scores
4. **Manual Verification** - Trigger verification for pending submissions
5. **View Details** - See full verification reasoning and matches

---

## 🐛 Troubleshooting

### Service Won't Start

1. **Check .env file exists**:
   ```powershell
   Test-Path oracle-swordsman\.env
   ```

2. **Check database is running**:
   ```powershell
   # Test connection
   psql $env:DATABASE_URL -c "SELECT 1;"
   ```

3. **Check for errors in terminal**:
   - Database connection errors
   - Missing environment variables
   - Port already in use

### Port 3001 Already in Use

```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change port in `.env`:
```bash
PORT=3002
```

---

## 📍 All URLs

- **Admin Interface**: http://localhost:3001/admin
- **Health Check**: http://localhost:3001/health
- **Stats API**: http://localhost:3001/api/stats
- **Submissions API**: http://localhost:3001/api/admin/submissions

---

**The service should start automatically when you run `npm run dev` in the oracle-swordsman directory!**

