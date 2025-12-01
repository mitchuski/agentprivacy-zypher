# Frontend Address Integration

## Summary

The frontend has been updated to display z-addresses and t-addresses in the correct locations with proper mapping to each act.

## Changes Made

### 1. Story Page (`/story`)
- **Z-Address Copy Field**: Added at the bottom LEFT of the page (opposite the "learn" button on the right)
- Shows the z-address for the current act with a copy button
- Only displays for acts 1-12 (Story Spellbook)
- Automatically loads the correct z-address when switching between acts

**Location**: Bottom navigation bar, left side
**Format**: Compact display with truncated address and copy button

### 2. SwordsmanPanel Component
- **Z-Address Display**: Added in the panel (above Step 3)
  - Shows the z-address where users should send donations
  - Includes copy button for easy copying
  - Labeled as "Z-Address (Send Donations To)"
  
- **T-Address Display**: Added in Step 2 (Proverb Interface)
  - Shows the t-address that tracks proverb inscriptions
  - Displays below the proverb textarea
  - Includes copy button
  - Labeled as "T-Address (Inscription Tracking)"
  - Explains that this address tracks proverb inscription and balance

**Location**: Right-side panel that opens when clicking the Swordsman button

### 3. Wallet Page (`/wallet`)
- **Enhanced Address Display**: 
  - Shows act titles and labels for each address
  - Displays spellbook type (Story/Zero)
  - Shows purpose (receive_donations / track_inscriptions)
  - Better visual organization with act information

## Technical Implementation

### New Utility File
- **`src/lib/oracle-addresses.ts`**: 
  - `getZAddressForAct(actId)`: Fetches z-address for a specific act
  - `getTAddressForAct(actId)`: Fetches t-address for a specific act
  - `getAllZAddresses()`: Gets all z-addresses mapped to acts

### API Endpoints Used
- `GET /api/wallet/addresses/z/:actId`: Get z-address by act ID
- `GET /api/wallet/addresses`: Get all addresses (for t-address lookup)

### Act ID Mapping
The frontend maps act numbers to act IDs as follows:
- Act 1 → `act-01-venice`
- Act 2 → `act-02-dual-ceremony`
- Act 3 → `act-03-drakes-teaching`
- Act 4 → `act-04-blade-alone`
- Act 5 → `act-05-light-armor`
- Act 6 → `act-06-trust-graph`
- Act 7 → `act-07-mirror`
- Act 8 → `act-08-ancient-rule`
- Act 9 → `act-09-zcash-shield`
- Act 10 → `act-10-topology`
- Act 11 → `act-11-sovereignty-spiral`
- Act 12 → `act-12-forgetting`

## How to Verify

1. **Story Page**:
   - Navigate to `/story`
   - Click on any act (1-12)
   - Check bottom LEFT for z-address copy field
   - Click copy button to verify it copies the address

2. **SwordsmanPanel**:
   - Open the Swordsman panel (⚔️ button on right)
   - Check for z-address display above Step 3
   - In Step 2, check for t-address display below proverb textarea
   - Test copy buttons for both addresses

3. **Wallet Page**:
   - Navigate to `/wallet`
   - Verify addresses show:
     - Act titles
     - Spellbook type
     - Purpose labels
     - Proper formatting

## Next Steps

1. Start the Oracle service: `npm start` (in `oracle-swordsman`)
2. Start the frontend: `npm run dev` (in `agentprivacy-ai-firstmage`)
3. Test the address displays on each page
4. Verify API connectivity (addresses should load from Oracle API)

## Notes

- The frontend expects the Oracle API to be running on `http://localhost:3001` (or set via `NEXT_PUBLIC_API_URL`)
- Addresses are loaded dynamically when acts change
- Copy functionality uses the browser's clipboard API
- All addresses are displayed without private keys (security)

