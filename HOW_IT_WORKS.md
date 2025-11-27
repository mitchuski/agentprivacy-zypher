# How the Spellbook Works

**A technical overview of the spellbook architecture and data flow.**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Landing Page │  │  Story Page   │  │  Mage Page   │ │
│  │    (/)       │  │   (/story)    │  │   (/mage)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                              │
│                    ┌───────▼───────┐                     │
│                    │ SwordsmanPanel│                     │
│                    │  (Donation UI)│                     │
│                    └───────┬───────┘                     │
└────────────────────────────┼────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼────┐  ┌───▼────┐  ┌───▼──────┐
        │  Soulbae   │  │ Zcash  │  │  Static  │
        │    API     │  │Wallet  │  │  Files   │
        │  (TEE AI)  │  │        │  │ (Markdown)│
        └────────────┘  └────────┘  └──────────┘
```

---

## 📖 Story Flow

### 1. Reading a Tale

**User Journey:**
```
User visits /story
  ↓
Clicks on "Act I" tab
  ↓
Story page loads markdown from /public/story/markdown/01-act-i-venice.md
  ↓
ReactMarkdown renders content
  ↓
SwordsmanPanel appears on right side
```

**Code Path:**
- `src/app/story/page.tsx` - Main story page component
- `useEffect` hook loads markdown via `fetch()`
- `ReactMarkdown` component renders markdown to HTML
- `SwordsmanPanel` component renders donation interface

**Key Functions:**
```typescript
// Load markdown for current act
const loadMarkdown = async () => {
  const filename = `0${activeAct}-act-${getActFilename(activeAct)}.md`;
  const response = await fetch(`/story/markdown/${filename}`);
  const text = await response.text();
  setMarkdownContent(text);
};
```

---

## 🧙‍♂️ Mage (Soulbae) Flow

### 2. Getting Proverb Help

**User Journey:**
```
User clicks "Talk to Soulbae" in SwordsmanPanel
  ↓
Opens /mage (or /mage?tale_id=act-i-venice) in new window
  ↓
If no tale selected: Shows tale selection UI (11 story acts + 30 zero tales)
  ↓
User selects a tale (or one is pre-selected)
  ↓
Mage page loads, shows TEE attestation
  ↓
User chats with Soulbae about the tale
  ↓
Soulbae provides RPP proverb: [RPP] proverb: '...'
  ↓
Proverb is automatically highlighted in chat
  ↓
Learn button becomes enabled (next to New Session button)
  ↓
User clicks "Learn" → Proverb copied to clipboard
  ↓
OR user manually enters proverb in "Step 1" field
  ↓
Clicks "Copy to Zashi" → Memo formatted and copied
```

**Code Path:**
- `src/app/mage/page.tsx` - Mage chat interface with tale selection
- `src/components/ChatMessage.tsx` - Renders messages with RPP highlighting
- `src/lib/soulbae.ts` - API client for Soulbae
- `chatWithSoulbae()` - Sends messages to Soulbae API
- `formatZcashMemo()` - Formats proverb for Zcash
- `extractProverbFromMessages()` - Extracts RPP proverb for Learn button

**API Request:**
```typescript
POST https://agentprivacy.ai/mage/chat
{
  "tale_id": "act-i-venice",
  "message": "What does this tale mean?",
  "session_id": "session_123...",
  "conversation_history": [...]
}
```

**Response:**
```json
{
  "message": "The tale speaks of boundaries...",
  "proverb_suggestions": [
    "The swordsman who never strikes guards nothing",
    "Boundaries preserve sovereignty"
  ],
  "privacy_budget_remaining": 15
}
```

---

## ⚔️ Swordsman Panel Flow

### 3. Donation Process

**User Journey:**
```
User reads tale and gets proverb (from Soulbae or manually)
  ↓
Enters proverb in SwordsmanPanel
  ↓
Clicks "Copy to Zashi"
  ↓
Memo formatted: [rpp-v1][tale-id][timestamp][proverb]
  ↓
Copied to clipboard
  ↓
User opens Zashi wallet
  ↓
Pastes memo, sets amount, sends z→z transaction
```

**Code Path:**
- `src/components/SwordsmanPanel.tsx` - Donation panel component
- `src/lib/zcash-memo.ts` - Memo formatting utilities
- `formatZcashMemo()` - Creates rpp-v1 format

**Memo Format:**
```
[rpp-v1]
[act-i-venice]
[1699564800123]
[The swordsman who never strikes guards nothing]
```

**Validation:**
```typescript
// Check proverb fits in 512 bytes (Zcash memo limit)
const validation = validateProverb(userProverb);
// Returns: { valid: boolean, length: number, maxLength: 512 }
```

---

## 🔒 Privacy Architecture

### What's Private

1. **Donation Amounts**
   - Only visible to sender and receiver
   - Hidden in Zcash shielded pool
   - Not accessible to Soulbae

2. **Wallet Addresses**
   - z-addresses are unlinkable
   - No public transaction graph
   - Each transaction is independent

3. **User Conversations**
   - Soulbae doesn't store conversations
   - Privacy budget limits queries
   - TEE ensures isolation

4. **Transaction Timing**
   - Hidden in shielded pool
   - No correlation possible

### What's Public

1. **Story Content**
   - Markdown files in `/public/story/markdown/`
   - Served as static files
   - Anyone can read

2. **Proverbs (in memos)**
   - Encrypted in Zcash memos
   - Only recipient can decrypt
   - Not visible on blockchain

3. **TEE Attestation**
   - Cryptographic proof of privacy
   - Verifiable by anyone
   - Proves Soulbae runs in TEE

---

## 📊 Data Flow Diagrams

### Story Page Load

```
Browser Request
    ↓
Next.js Static Export (out/index.html)
    ↓
React Hydration
    ↓
useEffect Hook Triggers
    ↓
Fetch Markdown File
    ↓
/public/story/markdown/01-act-i-venice.md
    ↓
Parse & Render with ReactMarkdown
    ↓
Display to User
```

### Soulbae Chat

```
User Types Message
    ↓
handleSend() called
    ↓
chatWithSoulbae() API call
    ↓
POST to Soulbae API (NEAR Cloud AI)
    ↓
Soulbae processes (streaming response)
    ↓
Response streams in character-by-character
    ↓
ChatMessage component renders with RPP highlighting
    ↓
If [RPP] proverb: '...' detected → Highlighted box appears
    ↓
Learn button becomes enabled (after streaming completes)
    ↓
User clicks "Learn" → extractProverbFromMessages() extracts proverb
    ↓
Proverb text copied to clipboard (without RPP wrapper)
    ↓
Button shows "cast" animation
```

### Zcash Donation

```
User Clicks "Copy to Zashi"
    ↓
formatZcashMemo() formats proverb
    ↓
Copy to clipboard
    ↓
User pastes in Zashi wallet
    ↓
Zashi formats transaction
    ↓
User sets amount (private)
    ↓
Send z→z transaction
    ↓
Transaction on Zcash blockchain
    ↓
Memo encrypted in transaction
    ↓
Only recipient can decrypt
```

---

## 🧩 Component Breakdown

### Core Components

**1. Story Page (`src/app/story/page.tsx`)**
- Manages act navigation
- Loads markdown content
- Renders story with ReactMarkdown
- Integrates SwordsmanPanel

**2. Mage Page (`src/app/mage/page.tsx`)**
- Tale selection UI (when no tale selected)
- Chat interface with Soulbae
- Displays TEE attestation
- Manages privacy budget (6 queries max)
- RPP proverb extraction and Learn button
- Formats memos for Zcash

**3. ChatMessage (`src/components/ChatMessage.tsx`)**
- Renders individual messages
- Handles user vs assistant styling
- RPP proverb detection and highlighting (supports both single and double quotes)
- Markdown rendering

**4. Swordsman Panel (`src/components/SwordsmanPanel.tsx`)**
- Donation interface
- Proverb input/validation
- Copy to Zashi functionality
- Opens Mage in new window

**5. Zcash Memo Utils (`src/lib/zcash-memo.ts`)**
- `formatZcashMemo()` - Creates rpp-v1 format
- `parseZcashMemo()` - Parses memos
- `validateProverb()` - Checks length
- `getTaleIdFromAct()` - Maps acts to IDs

**6. Soulbae Client (`src/lib/soulbae.ts`)**
- `chatWithSoulbae()` - API communication
- `getAttestation()` - TEE verification
- `generateSessionId()` - Privacy budget tracking

---

## 🔄 State Management

### Story Page State

```typescript
const [activeAct, setActiveAct] = useState(0);
const [markdownContent, setMarkdownContent] = useState('');
const [isLoading, setIsLoading] = useState(true);
```

### Mage Page State

```typescript
const [messages, setMessages] = useState<SoulbaeMessage[]>([]);
const [privacyBudget, setPrivacyBudget] = useState(16);
const [proverbSuggestions, setProverbSuggestions] = useState<string[]>([]);
const [selectedProverb, setSelectedProverb] = useState('');
```

### Swordsman Panel State

```typescript
const [userProverb, setUserProverb] = useState('');
const [copied, setCopied] = useState(false);
const [mageWindow, setMageWindow] = useState<Window | null>(null);
```

---

## 📡 API Endpoints

### Soulbae API (External)

**Chat Endpoint:**
```
POST /chat
Body: {
  tale_id: string,
  message: string,
  session_id: string,
  conversation_history: SoulbaeMessage[]
}
Response: {
  message: string,
  proverb_suggestions?: string[],
  privacy_budget_remaining?: number
}
```

**Attestation Endpoint:**
```
GET /attestation
Response: {
  attestation: string,
  tee_provider: string,
  timestamp: string,
  agent: string
}
```

### Static Files (Internal)

**Markdown Files:**
```
GET /story/markdown/{filename}.md
Response: Markdown text content
```

**Assets:**
```
GET /assets/{filename}
Response: Image/video file
```

---

## 🎨 Styling System

### Tailwind CSS Configuration

**Color Scheme:**
- `primary` - Indigo (#6366f1) - Main actions
- `secondary` - Violet (#8b5cf6) - Secondary actions
- `accent` - Cyan (#06b6d4) - Highlights
- `background` - Dark slate (#0f172a) - Page background
- `surface` - Slate (#1e293b) - Card backgrounds
- `text` - Light slate (#f1f5f9) - Main text
- `text-muted` - Muted slate (#94a3b8) - Secondary text

### Component Classes

**Cards:**
```css
.card {
  @apply bg-surface border border-surface/50 rounded-lg p-6;
}
```

**Buttons:**
```css
.btn-primary {
  @apply bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg;
}

.btn-secondary {
  @apply bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-text px-4 py-2 rounded-lg;
}
```

---

## 🔐 Security Considerations

### Client-Side Security

1. **No Secrets in Code**
   - All API URLs are public
   - No API keys in frontend
   - Environment variables for config

2. **Input Validation**
   - Proverb length validation (512 bytes)
   - XSS protection via React
   - Markdown sanitization

3. **Privacy by Design**
   - No analytics by default
   - No cookies
   - No tracking

### Server-Side Security (Soulbae)

1. **TEE Isolation**
   - Runs in AWS Nitro enclave
   - Hardware-attested
   - Cannot access external data

2. **Privacy Budget**
   - Limits queries per session
   - Prevents abuse
   - Protects user privacy

3. **No Data Storage**
   - Conversations not stored
   - No user tracking
   - Ephemeral sessions

---

## 🚀 Performance

### Static Site Benefits

- **Fast Loading** - Pre-rendered HTML
- **No Server** - Served from CDN
- **Caching** - Aggressive browser caching
- **Scalability** - Handles unlimited traffic

### Optimization

1. **Code Splitting** - Next.js automatic
2. **Image Optimization** - Next.js Image component
3. **Lazy Loading** - Components load on demand
4. **Static Generation** - All pages pre-rendered

---

## 📝 File Structure Deep Dive

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with footer
│   ├── page.tsx                  # Landing page
│   ├── story/
│   │   ├── page.tsx             # Story reader
│   │   └── stats/
│   │       └── page.tsx          # Stats page
│   ├── mage/
│   │   └── page.tsx              # Soulbae chat
│   └── proverbs/
│       └── page.tsx              # Proverbs gallery
│
├── components/                   # React components
│   ├── SwordsmanPanel.tsx        # Donation panel
│   ├── ChatMessage.tsx           # Chat UI
│   ├── ProverbSuggestions.tsx    # Proverb cards
│   └── AttestationBadge.tsx      # TEE badge
│
└── lib/                          # Utilities
    ├── soulbae.ts                # Soulbae API client
    └── zcash-memo.ts             # Zcash memo utils

public/
├── assets/                       # Images & videos
│   └── *.mp4, *.jpeg, *.png
└── story/
    └── markdown/               # Story content
        └── *.md
```

---

## 🧪 Testing the Flow

### Manual Test Checklist

1. **Story Page:**
   - [ ] All acts load correctly
   - [ ] Markdown renders properly
   - [ ] Navigation works
   - [ ] SwordsmanPanel appears

2. **Mage Page:**
   - [ ] Chat interface loads
   - [ ] Can send messages
   - [ ] Soulbae responds
   - [ ] Proverb suggestions appear
   - [ ] Copy to Zashi works

3. **Swordsman Panel:**
   - [ ] Opens Mage in new window
   - [ ] Proverb input works
   - [ ] Validation shows
   - [ ] Copy button works
   - [ ] Memo format correct

4. **Zcash Integration:**
   - [ ] Memo pastes correctly
   - [ ] Format matches rpp-v1
   - [ ] Proverb fits in 512 bytes

---

## 🔗 Integration Points

### Where to Customize

1. **Story Content** → `public/story/markdown/*.md`
2. **Styling** → `tailwind.config.ts`
3. **Components** → `src/components/*.tsx`
4. **API URLs** → `src/lib/soulbae.ts`
5. **Memo Format** → `src/lib/zcash-memo.ts`
6. **Navigation** → Each page's nav component

---

## 📚 Further Reading

- **[README.md](./README.md)** - Project overview
- **[SPELLBOOK_DEPLOYMENT_GUIDE.md](./SPELLBOOK_DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Architecture details
- **[VRC_PROTOCOL.md](./VRC_PROTOCOL.md)** - VRC callback protocol

---

**Understanding how it works is the first step to making it your own!** 🧙‍♂️📖

