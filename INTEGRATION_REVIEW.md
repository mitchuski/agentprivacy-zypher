# Integration Review: ZK Spellbook Donation System
## How New Documentation Fits into Existing Codebase

**Date:** 2025-01-XX  
**Status:** Architecture Review

---

## 🎯 Current Codebase Structure

### Existing Pages
- `/` - Landing page (`src/app/page.tsx`)
- `/story` - Story page with acts (`src/app/story/page.tsx`)
- `/zero` - Zero page (`src/app/zero/page.tsx`)

### Current Story Page Features
- ✅ Act navigation (0-13, including inscriptions)
- ✅ Markdown rendering with ReactMarkdown
- ✅ Inscription emoji copying ("inscribe" button)
- ✅ Proverb copying functionality
- ✅ Story text copying ("learn 🧙‍♂️" button)
- ✅ Video/image display per act

---

## 🏗️ Proposed Integration

### 1. New `/mage` Page (Soulbae Chat Interface)

**Location:** `src/app/mage/page.tsx`

**Purpose:** NEAR Shade Agent (Soulbae) chat interface for proverb derivation

**Key Features:**
- Chat interface with Soulbae
- TEE attestation display
- Context-aware (receives `tale_id` from story page)
- Proverb suggestion generation
- Privacy budget indicator (φ × 10 = 16 queries)
- No data persistence (TEE-enforced)

**Integration Points:**
```typescript
// URL structure
/mage?tale_id=act1-blades-awakening&context=donation

// Chat API endpoint (external)
https://agentprivacy.ai/mage/chat (NEAR Shade Agent)
```

**UI Components Needed:**
- Chat message list
- Input field for user messages
- Proverb suggestions display (2-3 options)
- TEE attestation badge/indicator
- Privacy budget counter
- "Copy Proverb" button

---

### 2. Swordsman Donation Button (Story Page Enhancement)

**Location:** `src/app/story/page.tsx` (modify existing)

**Current State:**
- Has "inscribe" button (copies emoji inscription)
- Has "proverb" button (copies proverb text)
- Has "learn 🧙‍♂️" button (copies markdown)

**New Addition:**
- **"Talk to Soulbae"** button → Opens `/mage?tale_id=act{X}`
- **"Copy to Zashi"** button → Formats memo with proverb for Zcash transaction

**Memo Format (rpp-v1):**
```
[rpp-v1]
[act1-blades-awakening]
[1699564800123]
[Seventh capital flows through gates I choose]
```

**Implementation Flow:**
1. User reads tale on `/story`
2. User clicks "Talk to Soulbae" → Opens `/mage?tale_id=act1`
3. User chats with Soulbae → Gets proverb suggestions
4. User selects/crafts proverb
5. User returns to `/story` page
6. User pastes proverb into input field (or selects from suggestions)
7. User clicks "Copy to Zashi" → Memo formatted and copied
8. User pastes into Zashi wallet → Sets amount → Sends z→z transaction

---

## 📋 Detailed Integration Plan

### Phase 1: `/mage` Page Implementation

**File:** `src/app/mage/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function MagePage() {
  const searchParams = useSearchParams();
  const taleId = searchParams.get('tale_id') || 'act1-blades-awakening';
  const context = searchParams.get('context') || 'donation';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [proverbSuggestions, setProverbSuggestions] = useState<string[]>([]);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [privacyBudget, setPrivacyBudget] = useState(16); // φ × 10
  
  // Load TEE attestation on mount
  useEffect(() => {
    fetch('https://agentprivacy.ai/mage/attestation')
      .then(res => res.json())
      .then(data => setAttestation(data));
  }, []);
  
  // Chat with Soulbae
  const sendMessage = async () => {
    // Call NEAR Shade Agent endpoint
    // Format: POST https://agentprivacy.ai/mage/chat
    // Body: { tale_id, message, session_id }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Navigation */}
      <nav>...</nav>
      
      {/* TEE Attestation Badge */}
      {attestation && (
        <div className="attestation-badge">
          🛡️ TEE Attested: {attestation.attestation.substring(0, 16)}...
        </div>
      )}
      
      {/* Chat Interface */}
      <div className="chat-container">
        {/* Messages */}
        {/* Input */}
        {/* Proverb Suggestions */}
        {/* Privacy Budget Indicator */}
      </div>
    </div>
  );
}
```

**API Integration:**
- External endpoint: `https://agentprivacy.ai/mage/chat` (NEAR Shade Agent)
- This is deployed separately (not in this Next.js app)
- Next.js app is just the frontend interface

---

### Phase 2: Story Page Enhancements

**File:** `src/app/story/page.tsx` (modify existing)

**Additions:**

1. **"Talk to Soulbae" Button**
```typescript
// Add after the "inscribe" button in the footer
<a
  href={`/mage?tale_id=${getTaleId(activeAct)}&context=donation`}
  target="_blank"
  rel="noopener noreferrer"
  className="btn-primary"
>
  Talk to Soulbae 🧙‍♂️
</a>
```

2. **Proverb Input Field** (for user to paste proverb from Soulbae)
```typescript
const [userProverb, setUserProverb] = useState('');
const [showZashiButton, setShowZashiButton] = useState(false);

// Add input field in footer
<input
  type="text"
  value={userProverb}
  onChange={(e) => {
    setUserProverb(e.target.value);
    setShowZashiButton(e.target.value.length > 0);
  }}
  placeholder="Paste your proverb from Soulbae..."
  className="proverb-input"
/>
```

3. **"Copy to Zashi" Button**
```typescript
const copyToZashi = async () => {
  const taleId = getTaleId(activeAct); // e.g., "act1-blades-awakening"
  const timestamp = Date.now();
  const proverb = userProverb || getProverb(activeAct);
  
  const memo = `[rpp-v1]
[${taleId}]
[${timestamp}]
[${proverb}]`;
  
  await navigator.clipboard.writeText(memo);
  // Show success message
};
```

**Helper Function:**
```typescript
const getTaleId = (act: number): string => {
  const taleMap: { [key: number]: string } = {
    1: 'act-i-venice',
    2: 'act-ii-dual-ceremony',
    3: 'act-iii-drakes-teaching',
    4: 'act-iv-blade-alone',
    5: 'act-v-light-armour',
    6: 'act-vi-trust-graph-plane',
    7: 'act-vii-mirror-enhanced',
    8: 'act-viii-ancient-rule',
    9: 'act-ix-zcash-shield',
    10: 'topology-of-revelation',
    11: 'act-xi-balanced-spiral-of-sovereignty',
  };
  return taleMap[act] || `act-${act}`;
};
```

---

### Phase 3: Navigation Updates

**File:** `src/app/layout.tsx` or individual page navs

**Add `/mage` link to navigation:**
```typescript
<a
  href="/mage"
  className="text-text hover:text-primary transition-colors font-medium"
>
  mage
</a>
```

---

## 🔄 User Flow Integration

### Complete Flow:

```
1. User visits /story
   └─> Sees Act 1 content
   
2. User clicks "Talk to Soulbae" 🧙‍♂️
   └─> Opens /mage?tale_id=act-i-venice&context=donation
   └─> New tab/window with Soulbae chat
   
3. User chats with Soulbae
   └─> Soulbae provides proverb suggestions
   └─> User selects/crafts proverb
   └─> User copies proverb
   
4. User returns to /story tab
   └─> Pastes proverb into input field
   └─> Clicks "Copy to Zashi" ⚔️
   └─> Memo formatted: [rpp-v1]...[proverb]
   
5. User opens Zashi wallet
   └─> Pastes memo into memo field
   └─> Sets amount (user's choice)
   └─> Sends z→z shielded transaction
   
6. Transaction confirms on Zcash
   └─> VRC callback system detects donation
   └─> Sends response proverb back
   └─> Bilateral VRC established
```

---

## 🎨 UI/UX Considerations

### Story Page Footer Enhancement

**Current Footer:**
- "inscribe" button (emoji)
- "proverb" button (text)
- Navigation buttons (prev/next)

**Enhanced Footer:**
```
┌─────────────────────────────────────────┐
│ [inscribe] [proverb] [Talk to Soulbae]  │
│                                         │
│ Proverb Input:                          │
│ [___________________________]           │
│                                         │
│ [Copy to Zashi ⚔️]                     │
└─────────────────────────────────────────┘
```

### Mage Page Layout

```
┌─────────────────────────────────────────┐
│ agentprivacy / mage                      │
│ 🛡️ TEE Attested: 0x1234...abcd         │
├─────────────────────────────────────────┤
│                                         │
│ Soulbae: [Proverb opening]              │
│          How can I help you understand  │
│          this tale?                      │
│                                         │
│ You: I build identity systems...        │
│                                         │
│ Soulbae: Here are 3 proverb options:   │
│          1. "The seventh capital..."     │
│          2. "Boundaries maintained..."  │
│          3. "Identity systems that..."  │
│                                         │
│ [Privacy Budget: 14/16 queries]        │
├─────────────────────────────────────────┤
│ [Type your message...] [Send]           │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### 1. Environment Variables

**Add to `.env.local`:**
```bash
NEXT_PUBLIC_SOULBAE_URL=https://agentprivacy.ai/mage
NEXT_PUBLIC_SPELLBOOK_ADDRESS=zs1YOUR_ADDRESS
```

### 2. API Client for Soulbae

**File:** `src/lib/soulbae.ts`

```typescript
const SOULBAE_URL = process.env.NEXT_PUBLIC_SOULBAE_URL || 'https://agentprivacy.ai/mage';

export async function chatWithSoulbae(
  taleId: string,
  message: string,
  sessionId: string
): Promise<SoulbaeResponse> {
  const response = await fetch(`${SOULBAE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tale_id: taleId, message, session_id: sessionId }),
  });
  return response.json();
}

export async function getAttestation(): Promise<Attestation> {
  const response = await fetch(`${SOULBAE_URL}/attestation`);
  return response.json();
}
```

### 3. Memo Formatting Utility

**File:** `src/lib/zcash-memo.ts`

```typescript
export function formatZcashMemo(
  taleId: string,
  proverb: string
): string {
  const timestamp = Date.now();
  return `[rpp-v1]
[${taleId}]
[${timestamp}]
[${proverb}]`;
}

export function validateProverb(proverb: string): boolean {
  // Check length (must fit in 512 bytes)
  const encoded = new TextEncoder().encode(proverb);
  return encoded.length <= 512;
}
```

---

## 📁 File Structure After Integration

```
src/
├── app/
│   ├── page.tsx                    # Landing (existing)
│   ├── layout.tsx                   # Root layout (existing)
│   ├── story/
│   │   └── page.tsx                 # Story page (MODIFY - add buttons)
│   ├── zero/
│   │   └── page.tsx                 # Zero page (existing)
│   └── mage/
│       └── page.tsx                 # NEW - Soulbae chat interface
├── lib/
│   ├── soulbae.ts                  # NEW - Soulbae API client
│   └── zcash-memo.ts               # NEW - Memo formatting utilities
└── components/
    ├── ChatMessage.tsx              # NEW - Chat message component
    ├── ProverbSuggestions.tsx       # NEW - Proverb suggestions display
    └── AttestationBadge.tsx        # NEW - TEE attestation badge
```

---

## ✅ Integration Checklist

### Phase 1: Mage Page
- [ ] Create `src/app/mage/page.tsx`
- [ ] Implement chat interface
- [ ] Add TEE attestation display
- [ ] Add privacy budget indicator
- [ ] Connect to NEAR Shade Agent API
- [ ] Add proverb suggestions UI
- [ ] Test chat flow end-to-end

### Phase 2: Story Page Enhancements
- [ ] Add "Talk to Soulbae" button
- [ ] Add proverb input field
- [ ] Add "Copy to Zashi" button
- [ ] Implement memo formatting
- [ ] Add tale ID mapping function
- [ ] Test copy-to-clipboard flow

### Phase 3: Navigation & Polish
- [ ] Add `/mage` to navigation
- [ ] Update styling to match existing theme
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test mobile responsiveness
- [ ] Add accessibility features

### Phase 4: Documentation
- [ ] Update README with new features
- [ ] Document API endpoints
- [ ] Add user flow diagrams
- [ ] Update deployment guide

---

## 🚨 Important Considerations

### 1. External Dependency
- **Soulbae (NEAR Shade Agent) is deployed separately**
- Next.js app is just the frontend interface
- Must handle CORS if needed
- Must handle API failures gracefully

### 2. Privacy Guarantees
- Soulbae never sees transaction amounts
- Soulbae never sees wallet addresses
- All communication happens client-side
- TEE attestation proves isolation

### 3. User Experience
- Two-tab flow (story → mage → story)
- Clear instructions for users
- Fallback if Soulbae is unavailable
- Mobile-friendly design

### 4. Zcash Integration
- No wallet connection needed (copy-paste)
- User controls amount in their wallet
- Memo format must be exact (rpp-v1)
- Works with any Zcash wallet (not just Zashi)

---

## 🎯 Next Steps

1. **Review this integration plan** with team
2. **Create `/mage` page** with basic chat interface
3. **Enhance story page** with donation buttons
4. **Test end-to-end flow** with mock Soulbae API
5. **Deploy Soulbae** (separate deployment per DEPLOYMENT_GUIDE.md)
6. **Connect frontend to real Soulbae** endpoint
7. **Test with real Zcash transactions** (testnet first)

---

## 📚 Related Documentation

- **PROJECT_OVERVIEW.md** - System architecture
- **DEPLOYMENT_GUIDE.md** - Soulbae deployment
- **SOULBAE_CONFIG.md** - Agent configuration
- **VRC_PROTOCOL.md** - Callback implementation
- **DEMO_SCRIPT.md** - Presentation guide

---

*This integration maintains the existing codebase structure while adding the dual-agent donation system. The key insight: the Next.js app is the frontend, Soulbae is deployed separately, and Zashi is the user's wallet (no browser extension needed).*

