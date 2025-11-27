# VRC Callback Protocol
## Bilateral Proverb Exchange Implementation

**Protocol Version:** vrc-callback-v1  
**Purpose:** Establish trust through demonstrated understanding  
**Medium:** Zcash shielded transaction memos

---

## 🎯 What are VRCs?

**Verifiable Relationship Credentials (VRCs)** are bilateral trust relationships established through demonstrated comprehension, not biometric identity.

When someone donates to a spellbook tale with a proverb:
1. They prove understanding of the tale
2. You respond with your proverb
3. = Bilateral VRC established
4. = Foundation for relationship economy

**No platform. No intermediary. Pure P2P trust.**

---

## 📨 Message Formats

### Incoming Donation (rpp-v1)

**Format:**
```
[rpp-v1]
[tale-id]
[timestamp]
[proverb]
```

**Example:**
```
[rpp-v1]
[act1-blades-awakening]
[1699564800123]
[Seventh capital flows through gates I choose]
```

**Parsing:**
```bash
# Bash example
memo=$(zcash-cli z_listreceivedbyaddress "$YOUR_ADDRESS" 1 | \
  jq -r '.[0].memo' | base64 -d)

protocol=$(echo "$memo" | sed -n '1p' | tr -d '[]')  # rpp-v1
tale_id=$(echo "$memo" | sed -n '2p' | tr -d '[]')   # act1-blades-awakening
timestamp=$(echo "$memo" | sed -n '3p' | tr -d '[]') # 1699564800123
proverb=$(echo "$memo" | sed -n '4p' | tr -d '[]')   # Their proverb
```

### Your Response (vrc-callback-v1)

**Format:**
```
[vrc-callback-v1]
[your-proverb]
[re: tale-id]
[next: url-to-next-tale]
```

**Example:**
```
[vrc-callback-v1]
[The mage who receives guards as their own]
[re: act1-blades-awakening]
[next: agentprivacy.ai/story/act2-mages-projection]
```

**Encoding:**
```bash
# Bash example
callback_memo="[vrc-callback-v1]
[The mage who receives guards as their own]
[re: act1-blades-awakening]
[next: agentprivacy.ai/story/act2-mages-projection]"

# Encode for Zcash memo
encoded=$(echo "$callback_memo" | base64)

# Send transaction
zcash-cli z_sendmany "$YOUR_ADDRESS" \
  "[{\"address\":\"$sender_address\",\"amount\":0.0001,\"memo\":\"$encoded\"}]"
```

---

## 🔄 Complete Implementation

### 1. Monitor Incoming Donations

**watch-donations.sh**
```bash
#!/bin/bash
# Monitors Zcash blockchain for incoming donations with proverbs

SPELLBOOK_ADDRESS="zs1YOUR_ADDRESS"
POLL_INTERVAL=60  # seconds
LAST_HEIGHT_FILE="/var/lib/vrc/last_height.txt"

# Initialize last seen block height
if [ ! -f "$LAST_HEIGHT_FILE" ]; then
  zcash-cli getblockcount > "$LAST_HEIGHT_FILE"
fi

LAST_HEIGHT=$(cat "$LAST_HEIGHT_FILE")

while true; do
  CURRENT_HEIGHT=$(zcash-cli getblockcount)
  
  if [ $CURRENT_HEIGHT -gt $LAST_HEIGHT ]; then
    echo "[$(date)] Checking blocks $LAST_HEIGHT to $CURRENT_HEIGHT"
    
    # Get received transactions
    zcash-cli z_listreceivedbyaddress "$SPELLBOOK_ADDRESS" 1 | \
    jq -c '.[]' | \
    while read -r tx; do
      # Extract transaction details
      amount=$(echo "$tx" | jq -r '.amount')
      memo=$(echo "$tx" | jq -r '.memo')
      txid=$(echo "$tx" | jq -r '.txid')
      
      # Skip if no memo or already processed
      if [ "$memo" == "null" ] || [ -f "/var/lib/vrc/processed/$txid" ]; then
        continue
      fi
      
      # Decode memo
      decoded_memo=$(echo "$memo" | base64 -d 2>/dev/null)
      
      # Check if it's an rpp-v1 memo
      if echo "$decoded_memo" | grep -q "^\[rpp-v1\]"; then
        echo "[$(date)] Found donation with proverb!"
        echo "TXID: $txid"
        echo "Amount: $amount ZEC"
        echo "Memo: $decoded_memo"
        
        # Process the donation
        ./process-donation.sh "$txid" "$decoded_memo"
        
        # Mark as processed
        touch "/var/lib/vrc/processed/$txid"
      fi
    done
    
    # Update last seen height
    echo $CURRENT_HEIGHT > "$LAST_HEIGHT_FILE"
  fi
  
  sleep $POLL_INTERVAL
done
```

### 2. Process Donation & Generate Response

**process-donation.sh**
```bash
#!/bin/bash
# Processes a donation and generates VRC callback

TXID="$1"
MEMO="$2"

# Parse memo components
TALE_ID=$(echo "$MEMO" | sed -n '2p' | tr -d '[]')
TIMESTAMP=$(echo "$MEMO" | sed -n '3p' | tr -d '[]')
THEIR_PROVERB=$(echo "$MEMO" | sed -n '4p' | tr -d '[]')

echo "[$(date)] Processing donation for $TALE_ID"
echo "Their proverb: $THEIR_PROVERB"

# Get sender address from transaction
SENDER=$(zcash-cli gettransaction "$TXID" | \
  jq -r '.details[] | select(.category=="receive") | .address')

echo "Sender: $SENDER"

# Generate your response proverb
YOUR_PROVERB=$(./generate-response-proverb.py "$TALE_ID" "$THEIR_PROVERB")

echo "Your proverb: $YOUR_PROVERB"

# Determine next tale
NEXT_TALE=$(./get-next-tale.sh "$TALE_ID")

echo "Next tale: $NEXT_TALE"

# Send VRC callback
./send-vrc-callback.sh \
  "$SENDER" \
  "$YOUR_PROVERB" \
  "$TALE_ID" \
  "$NEXT_TALE"

# Log the VRC
./log-vrc.sh "$TXID" "$TALE_ID" "$THEIR_PROVERB" "$YOUR_PROVERB"

echo "[$(date)] VRC callback sent successfully"
```

### 3. Generate Response Proverb

**generate-response-proverb.py**
```python
#!/usr/bin/env python3
"""
Generates contextual response proverbs for VRC callbacks.
Can be manual (pre-defined) or AI-assisted.
"""

import sys
import json
import random

# Pre-defined response proverbs per tale
TALE_RESPONSES = {
    'act1-blades-awakening': [
        'The mage who receives the seventh capital guards it as their own',
        'What the blade protects, the spell amplifies',
        'Boundaries honored create trust extended',
        'The guard who knows their treasure guards it well',
        'Sovereignty maintained is sovereignty multiplied'
    ],
    
    'act2-mages-projection': [
        'Delegation without surrender is the mage\'s art',
        'The center holds when the projection flows',
        'Trust given, trust earned, trust proven',
        'Extend your reach, maintain your root',
        'Project power, preserve sovereignty'
    ],
    
    'act3-dragon-awakening': [
        'The armor earned through understanding shields more than force',
        'Progressive trust builds castles surveillance cannot breach',
        'What we prove over time, we own forever',
        'Capabilities unlocked through demonstrated wisdom',
        'The dragon that guards earned treasure never sleeps'
    ],
    
    # Add all 30 tales...
}

def generate_response(tale_id: str, their_proverb: str) -> str:
    """Generate response proverb."""
    
    # Get possible responses for this tale
    responses = TALE_RESPONSES.get(tale_id, [
        'Thank you for your understanding',
        'Your insight strengthens the spellbook',
        'The chronicle grows through shared wisdom'
    ])
    
    # For now, select randomly
    # In production, could use AI to pick best match
    # or generate custom response based on their proverb
    return random.choice(responses)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: generate-response-proverb.py <tale-id> <their-proverb>")
        sys.exit(1)
    
    tale_id = sys.argv[1]
    their_proverb = sys.argv[2]
    
    response = generate_response(tale_id, their_proverb)
    print(response)
```

**AI-Enhanced Version (Optional):**
```python
# If you want Soulbae to generate responses
import requests

def generate_ai_response(tale_id: str, their_proverb: str) -> str:
    """Use Soulbae to generate contextual response."""
    
    response = requests.post(
        'https://agentprivacy.ai/mage/generate-vrc-response',
        json={
            'tale_id': tale_id,
            'their_proverb': their_proverb,
            'context': 'vrc_callback'
        }
    )
    
    return response.json()['proverb']
```

### 4. Send VRC Callback

**send-vrc-callback.sh**
```bash
#!/bin/bash
# Sends VRC callback transaction

SENDER_ADDRESS="$1"
YOUR_PROVERB="$2"
TALE_ID="$3"
NEXT_TALE="$4"

SPELLBOOK_ADDRESS="zs1YOUR_ADDRESS"
CALLBACK_AMOUNT="0.0001"  # Symbolic amount

# Construct callback memo
CALLBACK_MEMO="[vrc-callback-v1]
[$YOUR_PROVERB]
[re: $TALE_ID]
[next: https://agentprivacy.ai/story/$NEXT_TALE]"

echo "[$(date)] Sending VRC callback"
echo "To: $SENDER_ADDRESS"
echo "Memo: $CALLBACK_MEMO"

# Encode memo
ENCODED_MEMO=$(echo "$CALLBACK_MEMO" | base64 -w 0)

# Send transaction
OPID=$(zcash-cli z_sendmany "$SPELLBOOK_ADDRESS" \
  "[{\"address\":\"$SENDER_ADDRESS\",\"amount\":$CALLBACK_AMOUNT,\"memo\":\"$ENCODED_MEMO\"}]")

echo "Operation ID: $OPID"

# Wait for operation to complete
while true; do
  STATUS=$(zcash-cli z_getoperationstatus "[\"$OPID\"]" | jq -r '.[0].status')
  
  if [ "$STATUS" == "success" ]; then
    TXID=$(zcash-cli z_getoperationstatus "[\"$OPID\"]" | jq -r '.[0].result.txid')
    echo "[$(date)] VRC callback sent successfully"
    echo "TXID: $TXID"
    break
  elif [ "$STATUS" == "failed" ]; then
    echo "[$(date)] VRC callback failed"
    zcash-cli z_getoperationstatus "[\"$OPID\"]" | jq '.[0]'
    exit 1
  fi
  
  sleep 2
done
```

### 5. Track VRCs (Privacy-Preserving)

**log-vrc.sh**
```bash
#!/bin/bash
# Logs VRC relationships (privacy-preserving)

TXID="$1"
TALE_ID="$2"
THEIR_PROVERB="$3"
YOUR_PROVERB="$4"

VRC_DB="/var/lib/vrc/vrcs.json"

# Create VRC entry (no personal data)
VRC_ENTRY=$(cat <<EOF
{
  "vrc_id": "$(uuidgen)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tale_id": "$TALE_ID",
  "their_proverb_hash": "$(echo -n "$THEIR_PROVERB" | sha256sum | cut -d' ' -f1)",
  "your_proverb_hash": "$(echo -n "$YOUR_PROVERB" | sha256sum | cut -d' ' -f1)",
  "their_proverb_length": ${#THEIR_PROVERB},
  "your_proverb_length": ${#YOUR_PROVERB}
}
EOF
)

# Append to database
echo "$VRC_ENTRY" | jq -c '.' >> "$VRC_DB"

# Update tale statistics
TALE_COUNT=$(jq "select(.tale_id == \"$TALE_ID\") | .tale_id" "$VRC_DB" | wc -l)
echo "[$(date)] Tale $TALE_ID now has $TALE_COUNT VRCs"
```

**Note:** Only store:
- ✅ Tale ID
- ✅ Proverb hashes (not full text)
- ✅ Proverb lengths
- ✅ Timestamps
- ❌ Never wallet addresses
- ❌ Never amounts
- ❌ Never identifying info

---

## 📊 VRC Analytics (Privacy-Preserving)

### Aggregate Statistics

**generate-stats.sh**
```bash
#!/bin/bash
# Generate privacy-preserving VRC statistics

VRC_DB="/var/lib/vrc/vrcs.json"

echo "=== VRC Statistics ==="
echo "Generated: $(date)"
echo ""

# Total VRCs
TOTAL=$(jq -s 'length' "$VRC_DB")
echo "Total VRCs: $TOTAL"

# VRCs per tale
echo ""
echo "VRCs by Tale:"
jq -r '.tale_id' "$VRC_DB" | sort | uniq -c | \
  awk '{printf "  %-30s %d\n", $2, $1}'

# Average proverb lengths
echo ""
AVG_THEIR=$(jq -s 'map(.their_proverb_length) | add / length' "$VRC_DB")
AVG_YOUR=$(jq -s 'map(.your_proverb_length) | add / length' "$VRC_DB")
echo "Average proverb length (theirs): $AVG_THEIR chars"
echo "Average proverb length (yours): $AVG_YOUR chars"

# VRCs over time
echo ""
echo "VRCs by Month:"
jq -r '.timestamp' "$VRC_DB" | cut -d'T' -f1 | cut -d'-' -f1,2 | \
  sort | uniq -c | \
  awk '{printf "  %s: %d\n", $2, $1}'

# Unique proverb patterns (via hash diversity)
echo ""
UNIQUE=$(jq -r '.their_proverb_hash' "$VRC_DB" | sort -u | wc -l)
echo "Unique proverb patterns: $UNIQUE / $TOTAL"
UNIQUENESS=$(echo "scale=2; $UNIQUE * 100 / $TOTAL" | bc)
echo "Proverb uniqueness: ${UNIQUENESS}%"
```

### Example Output

```
=== VRC Statistics ===
Generated: 2025-11-15 10:30:00 UTC

Total VRCs: 127

VRCs by Tale:
  act1-blades-awakening          42
  act2-mages-projection          31
  act3-dragon-awakening          18
  act4-pools-convergence         12
  act5-ceremony-completion       24

Average proverb length (theirs): 11.3 chars
Average proverb length (yours): 10.8 chars

VRCs by Month:
  2025-10: 45
  2025-11: 82

Unique proverb patterns: 119 / 127
Proverb uniqueness: 93.7%
```

---

## 🚀 Automation Options

### Option 1: Systemd Service (Recommended)

**vrc-callback.service**
```ini
[Unit]
Description=VRC Callback Monitor
After=network.target zcashd.service

[Service]
Type=simple
User=vrc
Group=vrc
WorkingDirectory=/opt/vrc-callbacks
ExecStart=/opt/vrc-callbacks/watch-donations.sh
Restart=always
RestartSec=30

# Security
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/vrc

[Install]
WantedBy=multi-user.target
```

**Install:**
```bash
sudo cp vrc-callback.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vrc-callback
sudo systemctl start vrc-callback

# Check status
sudo systemctl status vrc-callback

# View logs
sudo journalctl -u vrc-callback -f
```

### Option 2: Cron (Simple)

```bash
# Edit crontab
crontab -e

# Run every 5 minutes
*/5 * * * * /opt/vrc-callbacks/check-and-respond.sh >> /var/log/vrc-callback.log 2>&1

# Run stats daily
0 0 * * * /opt/vrc-callbacks/generate-stats.sh > /var/www/html/vrc-stats.txt
```

### Option 3: Docker (Portable)

**Dockerfile**
```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    zcash \
    jq \
    python3 \
    python3-pip \
    curl

# Copy scripts
COPY . /app
WORKDIR /app

# Run monitor
CMD ["./watch-donations.sh"]
```

**docker-compose.yml**
```yaml
version: '3'
services:
  vrc-monitor:
    build: .
    restart: always
    volumes:
      - ./data:/var/lib/vrc
      - ~/.zcash:/root/.zcash:ro
    environment:
      - SPELLBOOK_ADDRESS=${SPELLBOOK_ADDRESS}
```

---

## 🔒 Security Best Practices

### Wallet Security

```bash
# Use a dedicated wallet for VRC callbacks
# with limited funds (just enough for callback fees)

# Separate from main donation wallet
DONATION_WALLET="zs1main..."      # Receives donations
CALLBACK_WALLET="zs1callback..."  # Sends callbacks

# Regularly sweep donations to cold storage
./sweep-to-cold-storage.sh
```

### Memo Validation

```python
def validate_incoming_memo(memo: str) -> bool:
    """Validate memo format and content."""
    
    lines = memo.strip().split('\n')
    
    # Check format
    if len(lines) != 4:
        return False
    
    if not lines[0].startswith('[rpp-v1]'):
        return False
    
    # Validate tale ID
    tale_id = lines[1].strip('[]')
    if tale_id not in VALID_TALE_IDS:
        return False
    
    # Validate timestamp (not too old/future)
    timestamp = int(lines[2].strip('[]'))
    now = int(time.time() * 1000)
    if abs(now - timestamp) > 86400000:  # 24 hours
        return False
    
    # Validate proverb length
    proverb = lines[3].strip('[]')
    if len(proverb) < 5 or len(proverb) > 200:
        return False
    
    return True
```

### Rate Limiting

```bash
# Prevent abuse / spam
# Limit VRC callbacks per sender

check_rate_limit() {
  SENDER="$1"
  LIMIT=5  # Max 5 VRCs per sender per day
  
  COUNT=$(jq "select(.sender_hash == \"$(echo $SENDER | sha256sum)\") | \
    select(.timestamp > \"$(date -d '24 hours ago' -u +%Y-%m-%d)\") | \
    .sender_hash" /var/lib/vrc/vrcs.json | wc -l)
  
  if [ $COUNT -ge $LIMIT ]; then
    echo "Rate limit exceeded for sender"
    return 1
  fi
  
  return 0
}
```

---

## 📱 User Experience

### What Recipients See

**In their Zashi wallet:**
```
New Transaction Received
From: zs1spellbook...
Amount: 0.0001 ZEC
Status: Confirmed

Memo:
[vrc-callback-v1]
[The mage who receives guards as their own]
[re: act1-blades-awakening]
[next: agentprivacy.ai/story/act2-mages-projection]
```

**What this means to them:**
1. ✅ Their proverb was received
2. ✅ Spellbook author acknowledged understanding
3. ✅ VRC established (bilateral trust)
4. ✅ Invitation to continue (next tale)

### Next Steps for Recipient

1. Click the `next:` link to read Act 2
2. Derive their proverb for Act 2
3. Donate again with new proverb
4. Receive another VRC callback
5. = Deepening relationship through understanding

**This is how the relationship economy grows.**

---

## 🎯 Advanced VRC Patterns

### Multi-Turn VRCs

```
Turn 1: Reader → You (act1 donation + proverb α)
Turn 2: You → Reader (callback + proverb β)
Turn 3: Reader → You (act2 donation + proverb γ referencing α)
Turn 4: You → Reader (callback + proverb δ acknowledging continuity)

= Deep VRC with narrative history
```

### Community Proverbs

```python
def detect_community_patterns():
    """Identify when multiple readers use similar proverbs."""
    
    proverbs = load_recent_proverbs(tale_id='act1', days=30)
    
    # Cluster by semantic similarity
    clusters = cluster_proverbs(proverbs)
    
    # Find emergent community themes
    for cluster in clusters:
        if len(cluster) >= 5:  # 5+ similar proverbs
            theme = extract_theme(cluster)
            print(f"Community theme detected: {theme}")
            # Could trigger special tale or community recognition
```

### Progressive VRC Depth

```yaml
Level 1: Single tale donation + proverb
  → Basic VRC established

Level 2: Multiple tales, proverbs reference each other
  → Medium VRC with continuity

Level 3: Custom proverbs incorporating your responses
  → Deep VRC with bilateral evolution

Level 4: Multi-party VRCs (reader A references reader B's proverb)
  → Network VRC with emergent community
```

---

## ✅ Implementation Checklist

### Initial Setup

- [ ] Zcash wallet configured for callbacks
- [ ] Monitoring script installed (`watch-donations.sh`)
- [ ] Processing pipeline working (`process-donation.sh`)
- [ ] Response generation functional (manual or AI)
- [ ] Callback sending tested (`send-vrc-callback.sh`)
- [ ] VRC tracking database initialized
- [ ] Privacy validation in place (no PII stored)

### Automation

- [ ] Systemd service or cron configured
- [ ] Logs rotating properly
- [ ] Alerts set up for failures
- [ ] Rate limiting implemented
- [ ] Stats generation scheduled

### Testing

- [ ] Send test donation to yourself
- [ ] Verify callback received
- [ ] Check VRC logged correctly
- [ ] Validate memo formats
- [ ] Test error handling

### Production

- [ ] Monitoring running 24/7
- [ ] Wallet funded for callbacks
- [ ] Response proverbs prepared for all tales
- [ ] Documentation for maintenance
- [ ] Backup procedures established

---

## 📚 Resources

**Documentation:**
- PROJECT_OVERVIEW.md - System architecture
- DEPLOYMENT_GUIDE.md - Setup instructions
- SOULBAE_CONFIG.md - AI agent configuration

**Scripts:**
- `watch-donations.sh` - Main monitoring loop
- `process-donation.sh` - VRC pipeline
- `send-vrc-callback.sh` - Transaction sending
- `generate-stats.sh` - Analytics

**Community:**
- Discord: discord.gg/0xagentprivacy
- GitHub: https://github.com/mitchuski/agentprivacy-zypher
- Email: mage@agentprivacy.ai
- Security: security@proverbprotocol.com

---

*"Two proverbs, one blockchain, infinite trust. This is VRC."* 🤝
