# U Address Display Component Specification

## Overview
This document describes where and how to implement a unified address (u address) display component with copy functionality in the frontend. The u address should be displayed in three locations: at the end of each story page, within the Proverbs page, and in the Swordsman Panel.

## Current State
**The u address display feature does not currently exist.** The codebase references "spellbook address" in text instructions but does not display or provide a copyable address anywhere.

## Target Locations

### 1. Story Page (`src/app/story/page.tsx`)
**Location:** At the end of each story act, after the markdown content and before the navigation buttons.

**Current Context:**
- File: `src/app/story/page.tsx`
- The story page displays markdown content for each act (lines 718-752)
- There are "Previous", "Copy", and "Next" buttons at the bottom (lines 758-817)
- The "learn 🧙‍♂️" button copies the markdown content (line 341-353, `copyToClipboard` function)
- The SwordsmanPanel is conditionally shown for acts 1-11 (lines 488-496)

**Implementation Location:**
- Add the u address component after the markdown content (after line 752, before line 754)
- Or integrate it into the bottom button area (around line 758-817) alongside the existing navigation buttons

**Reference Pattern:**
- Similar to the "learn 🧙‍♂️" button copy functionality (lines 341-353, 614-632)
- Uses `navigator.clipboard.writeText()` for copying
- Shows visual feedback with state management (`copied` state, `setCopied`)

### 2. Proverbs Page (`src/app/proverbs/page.tsx`)
**Location:** In the info box section that describes the Learning and Protecting spells.

**Current Context:**
- File: `src/app/proverbs/page.tsx`
- Info box section at lines 338-367
- Contains two cards: "Protecting the Spell (1 ZEC)" and "Learning the Spell (0.01 ZEC)"
- The SwordsmanPanel is conditionally rendered when a donation act is selected (lines 148-156)

**Implementation Location:**
- Add the u address component within the info box (lines 338-367)
- Could be placed:
  - As a new card below the two spell cards
  - Or integrated into the existing spell description cards
  - Or as a footer section after the spell cards (after line 367, before line 369)

**Reference Pattern:**
- Similar card styling: `bg-primary/10 border border-primary/30 rounded p-3` (line 346)
- Text styling: `text-xs text-text-muted` (line 352)

### 3. Swordsman Panel (`src/components/SwordsmanPanel.tsx`)
**Location:** In the instructions section, specifically in the "Mage Learning Flow" card.

**Current Context:**
- File: `src/components/SwordsmanPanel.tsx`
- Instructions card at lines 280-300
- Contains "Mage Learning Flow" with numbered steps (lines 283-290)
- Step 5 says "Send to spellbook address" (line 288) but doesn't show the address
- The panel has copy functionality for memos (lines 33-45, `handleCopyToZashi`) and spells (lines 48-58, `handleCopySpell`)

**Implementation Location:**
- Add the u address component in the "Mage Learning Flow" card (lines 280-300)
- Best placement: After step 5 (line 288) or as a new step 6
- Or add it as a separate section in the "Act/Spell Matching Info" area (lines 302-365)

**Reference Pattern:**
- Similar to the spell copy component (lines 330-357)
- Uses `handleCopySpell` pattern with state management (`spellCopied`, `setSpellCopied`)
- Styling: `p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono` (line 354)

## Component Design Pattern

### State Management
```typescript
const [addressCopied, setAddressCopied] = useState(false);
```

### Copy Handler
```typescript
const handleCopyAddress = async () => {
  const address = process.env.NEXT_PUBLIC_SPELLBOOK_ADDRESS || 'u1...'; // Get from env var
  try {
    await navigator.clipboard.writeText(address);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 3000);
  } catch (err) {
    console.error('Failed to copy address:', err);
  }
};
```

### Visual Design
- **Display:** Monospace font, similar to Tale ID display in SwordsmanPanel (line 363)
- **Copy Button:** Similar to spell copy button (lines 336-352)
- **Feedback:** Show checkmark (✓) when copied, similar to memo copy (lines 254-264)
- **Styling:** Use existing card/button patterns from the codebase

### Environment Variable
- The address should be stored in an environment variable: `NEXT_PUBLIC_SPELLBOOK_ADDRESS`
- This allows different addresses for different environments (dev, staging, production)
- Access via: `process.env.NEXT_PUBLIC_SPELLBOOK_ADDRESS`

## Implementation Checklist

### Story Page
- [ ] Add u address component after markdown content
- [ ] Implement copy handler with state management
- [ ] Add visual feedback (copied state)
- [ ] Style consistently with existing buttons
- [ ] Ensure it appears for all acts (0-13)

### Proverbs Page
- [ ] Add u address component in info box section
- [ ] Implement copy handler
- [ ] Style as card matching existing spell cards
- [ ] Position appropriately (below spell cards or integrated)

### Swordsman Panel
- [ ] Add u address component in instructions section
- [ ] Implement copy handler (similar to `handleCopySpell`)
- [ ] Update "Mage Learning Flow" to include address display
- [ ] Style consistently with existing copy components

### Shared Requirements
- [ ] Create reusable address display component (optional, or duplicate in each location)
- [ ] Add environment variable `NEXT_PUBLIC_SPELLBOOK_ADDRESS` to `.env.local`
- [ ] Handle case where address is not set (show placeholder or error)
- [ ] Ensure responsive design (mobile-friendly)
- [ ] Test copy functionality across browsers

## Code References

### Similar Copy Patterns
1. **Memo Copy** (`SwordsmanPanel.tsx` lines 33-45): Copies formatted Zcash memo
2. **Spell Copy** (`SwordsmanPanel.tsx` lines 48-58): Copies compression spell
3. **Markdown Copy** (`story/page.tsx` lines 341-353): Copies story content

### Styling References
1. **Card Styling**: `card bg-primary/10 border-primary/30` (Proverbs page line 346)
2. **Monospace Display**: `font-mono text-text break-all` (SwordsmanPanel line 363)
3. **Copy Button**: `text-xs text-primary hover:text-primary/80` (SwordsmanPanel line 338)
4. **Copy Feedback**: Motion animation with checkmark (SwordsmanPanel lines 341-344)

## Notes
- The u address format is typically: `u1...` (unified address starting with "u1")
- Ensure the address is clearly labeled as the "Spellbook Address" or "Donation Address"
- Consider adding a tooltip or help text explaining what the address is for
- The component should be accessible (keyboard navigation, screen reader support)

