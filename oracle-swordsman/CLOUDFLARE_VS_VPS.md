# Cloudflare vs VPS: What You Need

## What the Oracle Backend Does

The Oracle backend is **not just an API** - it's a **continuous monitoring service**:

### 1. **Continuous Blockchain Monitoring** ⏰
- Polls Zcash blockchain **every 30 seconds**
- Monitors for new transactions to your z-addresses
- Runs **24/7** in the background
- Uses `setInterval` for continuous polling

### 2. **Persistent Connections** 🔌
- Maintains connection to Zebra RPC node
- Keeps database connection pool alive
- Tracks processed transactions in memory

### 3. **Background Processing** ⚙️
- Processes proverbs automatically when detected
- Verifies with NEAR Cloud AI
- Creates inscriptions on blockchain
- Updates database continuously

### 4. **Long-Running Process** 🏃
- Must run continuously (not just on request)
- Can't stop/start - needs to always be monitoring
- Processes transactions as they arrive

---

## Can Cloudflare Handle This?

### ❌ **Cloudflare Pages/Functions: NO**

**Why Cloudflare Won't Work for Oracle Backend:**

1. **No Continuous Execution**
   - Cloudflare Workers run on request (serverless)
   - Can't run `setInterval` continuously
   - Execution time limit: 10-30 seconds max
   - No long-running processes

2. **No Persistent State**
   - Workers are stateless
   - Can't maintain connection pools
   - Can't track processed transactions in memory
   - Each request is isolated

3. **No Scheduled Tasks**
   - Can't poll blockchain every 30 seconds
   - Cron triggers exist but limited (1 minute minimum)
   - Not designed for continuous monitoring

4. **No Persistent Connections**
   - Can't maintain Zebra RPC connection
   - Can't keep database connection alive
   - Each request creates new connections

### ✅ **Cloudflare Pages: YES (For Frontend)**

**What Cloudflare IS Perfect For:**

1. **Frontend (Next.js)**
   - ✅ Static site hosting
   - ✅ Edge CDN
   - ✅ Fast global delivery
   - ✅ Free tier is great

2. **API Routes (Limited)**
   - ✅ Simple request/response APIs
   - ✅ No continuous processing
   - ✅ Stateless operations
   - ⚠️ But Oracle needs more than this

---

## Hybrid Approach: Best of Both Worlds

### ✅ **Recommended Setup:**

```
┌─────────────────────────────────────┐
│  Cloudflare Pages                   │
│  • Frontend (Next.js)               │
│  • Static assets                    │
│  • API routes (simple queries)     │
│  ✅ FREE                            │
└─────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────┐
│  VPS/Server (DigitalOcean, etc.)    │
│  • Oracle backend (continuous)      │
│  • Transaction monitor              │
│  • Zebra RPC connection             │
│  • PostgreSQL database             │
│  💰 ~$6-12/month (small VPS)        │
└─────────────────────────────────────┘
```

### **Why This Works:**

1. **Frontend on Cloudflare** (FREE)
   - Fast, global CDN
   - No server costs
   - Perfect for static sites

2. **Oracle on Small VPS** (~$6/month)
   - Continuous monitoring
   - Persistent connections
   - Background processing
   - Can be very small (1GB RAM is enough)

---

## Cost Comparison

### Option 1: Everything on VPS
- VPS: $6-12/month (small instance)
- **Total: $6-12/month**

### Option 2: Hybrid (Recommended)
- Cloudflare Pages: **FREE** (frontend)
- Small VPS: $6-12/month (Oracle backend)
- **Total: $6-12/month** (but better performance)

### Option 3: Cloudflare Only
- ❌ **Won't work** - Oracle needs continuous execution

---

## What Size VPS Do You Need?

**For Oracle Backend (minimal):**
- **CPU**: 1 core (enough)
- **RAM**: 1GB (enough)
- **Storage**: 20GB (enough)
- **Cost**: ~$6/month (DigitalOcean, Vultr, etc.)

**What It Runs:**
- Oracle backend (Node.js)
- PostgreSQL database
- Connection to Zebra (can be remote)

**You DON'T Need:**
- ❌ Zebra node on VPS (can use remote/public node)
- ❌ Large storage (just database)
- ❌ High CPU (Oracle is lightweight)

---

## Alternative: Use Remote Services

### **Option A: Hybrid with Remote Node**
```
Frontend: Cloudflare (FREE)
Oracle: Small VPS ($6/month)
Zebra: Remote/public node (FREE)
Database: Managed PostgreSQL ($0-5/month)
```

### **Option B: Serverless Alternative (Complex)**
- Use Cloudflare Workers + Scheduled Triggers
- Use external service for continuous monitoring
- More complex, less reliable
- **Not recommended**

---

## Recommendation

### ✅ **Best Setup for You:**

1. **Frontend**: Cloudflare Pages ✅
   - Deploy your Next.js app
   - FREE, fast, global

2. **Oracle Backend**: Small VPS ($6/month)
   - DigitalOcean Droplet (1GB RAM)
   - Or Vultr, Linode, etc.
   - Just runs the Oracle service

3. **Database**: 
   - Option A: PostgreSQL on same VPS (FREE)
   - Option B: Managed DB like Supabase free tier

4. **Zebra Node**:
   - Option A: Keep running locally (for testing)
   - Option B: Use public node (for production)
   - Option C: Run on VPS (if you want)

**Total Cost: ~$6-12/month** (just for Oracle VPS)

---

## Summary

**Cloudflare is perfect for:**
- ✅ Frontend hosting (FREE)
- ✅ Static sites
- ✅ CDN/edge delivery

**Cloudflare CANNOT do:**
- ❌ Continuous blockchain monitoring
- ❌ Long-running processes
- ❌ Persistent connections
- ❌ Background transaction processing

**You need a VPS for:**
- Oracle backend (continuous monitoring)
- But it can be very small ($6/month)

**Hybrid approach:**
- Frontend: Cloudflare (FREE) ✅
- Oracle: Small VPS ($6/month) ✅
- **Best of both worlds!**

---

## Quick Answer

**Q: Can I use Cloudflare instead of a VPS?**

**A:** 
- ✅ **Frontend**: YES - Cloudflare is perfect!
- ❌ **Oracle Backend**: NO - needs continuous execution

**Solution**: 
- Host frontend on Cloudflare (FREE)
- Host Oracle on small VPS ($6/month)
- **Total: $6/month** (instead of $24/month for everything)

You're already saving money! 🎉

