# Oracle Swordsman Admin Interface

**Web-based admin panel for reviewing submissions, verifications, and matches**

---

## 🚀 Access the Admin Interface

Once the Oracle service is running:

```
http://localhost:3001/admin
```

The admin interface provides:
- **Real-time statistics** - Total submissions, pending, approved, rejected
- **Submission review** - View all submissions with filters
- **Test submissions** - Create test proverbs for manual testing
- **Manual verification** - Trigger verification for pending submissions
- **Detailed views** - See full submission details, verification reasoning, and matches

---

## 📊 Features

### 1. Dashboard Statistics

- Total submissions count
- Pending submissions
- Approved submissions
- Rejected submissions
- Average quality score
- Total ZEC received

### 2. Submissions Table

View all submissions with:
- ID and tracking code
- Proverb text
- Status (pending/approved/rejected/failed)
- Quality score (color-coded: green ≥0.75, yellow ≥0.5, red <0.5)
- Matched act
- Amount received
- Created timestamp
- Actions (View details, Verify)

**Filter by status**: Use the dropdown to filter by pending, approved, rejected, or failed.

### 3. Test Submission

Create test submissions without sending real transactions:

1. Enter proverb text
2. Optionally specify Act ID (e.g., `5` or `act-05-vision`)
3. Set amount (default: 0.01 ZEC)
4. Click "Create Test Submission"

The Oracle will automatically process the test submission on the next monitoring cycle.

### 4. Manual Verification

For pending submissions, you can manually trigger verification:

1. Click "Verify" button on a pending submission
2. Oracle will:
   - Fetch spellbook from IPFS
   - Run NEAR Cloud AI verification
   - Save verification results
   - Update submission status

### 5. Detailed View

Click "View" on any submission to see:
- Full submission details
- Verification results (if verified)
- Quality score
- Matched act
- AI reasoning (full explanation)
- Transaction IDs
- Timestamps

### 6. Statistics Tab

View detailed statistics:
- Overall counts and averages
- Breakdown by matched act
- Quality score distribution

---

## 🔧 API Endpoints

The admin interface uses these API endpoints:

### Get All Submissions
```
GET /api/admin/submissions?status=pending&limit=50&offset=0
```

### Get Submission Details
```
GET /api/admin/submissions/:id
```

### Create Test Submission
```
POST /api/admin/submissions/test
Body: { proverb, actId?, amount? }
```

### Manually Verify Submission
```
POST /api/admin/submissions/:id/verify
```

### Get Detailed Statistics
```
GET /api/admin/stats/detailed
```

### Process Pending Submissions
```
POST /api/admin/process-pending
```

---

## 🧪 Manual Testing Workflow

### Step 1: Start Oracle Service

```bash
cd oracle-swordsman
npm run dev
```

### Step 2: Open Admin Interface

Navigate to: `http://localhost:3001/admin`

### Step 3: Create Test Submission

1. Go to "Test Submission" tab
2. Enter a test proverb (e.g., "Privacy requires separation of concerns.")
3. Optionally set Act ID (e.g., `1`)
4. Click "Create Test Submission"

### Step 4: Monitor Processing

1. Go to "Submissions" tab
2. Watch for your test submission to appear
3. Status will change from "pending" to "approved" or "rejected"
4. Click "View" to see verification details

### Step 5: Review Verification

Click "View" on any submission to see:
- Quality score
- Matched act
- AI reasoning (why it matched or didn't match)

### Step 6: Manual Verification (Optional)

If a submission is stuck in "pending", you can manually trigger verification:
1. Click "Verify" button
2. Oracle will process it immediately
3. Results will appear in the detail view

---

## 🎯 Use Cases

### Testing Proverb Matching

1. Create test submissions with different proverbs
2. Compare quality scores
3. Review AI reasoning to understand matches

### Debugging Verification Issues

1. View failed submissions
2. Check reasoning for rejections
3. Test with known good/bad proverbs

### Monitoring System Health

1. Check statistics dashboard
2. Monitor pending submissions
3. Review approval/rejection rates

### Quality Assurance

1. Review approved submissions
2. Verify quality scores are reasonable
3. Check matched acts are correct

---

## 🔒 Security Notes

- The admin interface is **not authenticated** by default
- For production, add authentication middleware
- Consider restricting access to localhost or VPN
- API endpoints are open - add rate limiting if needed

---

## 🛠️ Troubleshooting

### Admin Interface Not Loading

1. Check Oracle service is running: `curl http://localhost:3001/health`
2. Check browser console for errors
3. Verify admin files exist: `ls oracle-swordsman/admin/`

### API Endpoints Returning 404

1. Verify API server started: Check logs for "API server started"
2. Check port is correct (default: 3001)
3. Verify routes are registered in `api.ts`

### Submissions Not Appearing

1. Check database connection
2. Verify submissions exist: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM submissions;"`
3. Check Oracle monitor is running (should see logs)

---

## 📝 Next Steps

1. **Add Authentication** - Protect admin interface with login
2. **Export Data** - Add CSV/JSON export for submissions
3. **Bulk Actions** - Approve/reject multiple submissions
4. **Search** - Add search by proverb text or tracking code
5. **Charts** - Visualize statistics with charts

---

**The admin interface makes it easy to test and review Oracle submissions without manual database queries!** 🎉

