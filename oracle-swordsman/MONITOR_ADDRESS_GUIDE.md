# Address Monitor Guide

## Overview

The address monitor periodically checks a T-address for new transactions containing inscriptions. It runs every 10 minutes and can optionally auto-import new inscriptions to the database.

## Usage

### Basic Monitoring (No Auto-Import)

```bash
npx ts-node scripts/monitor-address-periodic.ts <address>
```

Example:
```bash
npx ts-node scripts/monitor-address-periodic.ts t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av
```

### With Auto-Import

Automatically imports new inscriptions to the database when found:

```bash
npx ts-node scripts/monitor-address-periodic.ts <address> --auto-import
```

Example:
```bash
npx ts-node scripts/monitor-address-periodic.ts t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av --auto-import
```

### Using PowerShell Script

On Windows, you can use the PowerShell helper:

```powershell
.\scripts\start-monitor.ps1 -Address "t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av"
```

With auto-import:
```powershell
.\scripts\start-monitor.ps1 -Address "t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av" -AutoImport
```

## How It Works

1. **Initial Check**: On startup, checks the current block height and scans from there
2. **Periodic Checks**: Every 10 minutes, checks for new blocks since the last check
3. **Transaction Detection**: For each new block, scans all transactions for outputs to the monitored address
4. **Inscription Extraction**: If a transaction is found, extracts Ordinals-style inscriptions from the scriptSig
5. **Auto-Import** (optional): If `--auto-import` is enabled, automatically:
   - Parses STS format inscriptions
   - Decodes hex-encoded proverbs
   - Creates submission records in the database
   - Creates verification records (auto-verified for on-chain inscriptions)
   - Updates submission status to 'verified'

## Output

The monitor logs:
- Timestamp of each check
- Block height range being checked
- Number of new transactions found
- Transaction IDs with inscriptions
- Inscription content (first 100 chars)
- Import status (if auto-import enabled)

Example output:
```
[2025-11-29T12:00:00.000Z] Initial check at block height 2500000...
Will check for new transactions every 10 minutes.

[2025-11-29T12:10:00.000Z] Checking blocks 2500001 to 2500010...
[2025-11-29T12:10:00.000Z] Found 1 new transaction(s)

🔔 New transaction: abc123def456...
✅ INSCRIPTION FOUND!
   Content-Type: text/plain
   Content: STS|v01|ACT:1|E:📖💰|The ledger that balances itself...
   Auto-importing to database...
   ✅ Inscription imported successfully!
```

## Running as a Service

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start monitor
pm2 start "npx ts-node scripts/monitor-address-periodic.ts t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av --auto-import" --name address-monitor

# View logs
pm2 logs address-monitor

# Stop monitor
pm2 stop address-monitor

# Restart monitor
pm2 restart address-monitor
```

### Using systemd (Linux)

Create `/etc/systemd/system/address-monitor.service`:

```ini
[Unit]
Description=Zcash Address Monitor
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/oracle-swordsman
ExecStart=/usr/bin/npx ts-node scripts/monitor-address-periodic.ts t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av --auto-import
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable address-monitor
sudo systemctl start address-monitor
sudo systemctl status address-monitor
```

## Configuration

### Check Interval

To change the check interval, edit `CHECK_INTERVAL_MS` in `monitor-address-periodic.ts`:

```typescript
const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
// Change to 5 minutes:
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
```

### Multiple Addresses

To monitor multiple addresses, run multiple instances:

```bash
# Terminal 1
npx ts-node scripts/monitor-address-periodic.ts t1Address1... --auto-import

# Terminal 2
npx ts-node scripts/monitor-address-periodic.ts t1Address2... --auto-import
```

Or use PM2 to manage multiple instances:

```bash
pm2 start "npx ts-node scripts/monitor-address-periodic.ts t1Address1... --auto-import" --name monitor-addr1
pm2 start "npx ts-node scripts/monitor-address-periodic.ts t1Address2... --auto-import" --name monitor-addr2
```

## Troubleshooting

### "Transaction found but no inscription detected"

This means a transaction was sent to the address, but it doesn't contain an Ordinals-style inscription in the scriptSig. This is normal for regular transactions.

### "Failed to import (may already exist)"

The inscription was already imported to the database. This prevents duplicates.

### Monitor stops checking

- Check that Zebra and Zallet are running
- Check RPC connection settings in `.env`
- Review logs for errors

### High CPU usage

If checking every 10 minutes is too frequent:
- Increase `CHECK_INTERVAL_MS` to 15 or 20 minutes
- Consider using a more efficient method (e.g., webhooks if available)

## Notes

- The monitor tracks processed transactions in memory, so restarting will re-check recent transactions
- For production, consider adding persistent storage for processed transaction IDs
- The monitor uses block scanning, which is reliable but may miss unconfirmed transactions
- For real-time monitoring, consider using ZMQ notifications (if available)

