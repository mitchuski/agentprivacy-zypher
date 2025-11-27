#!/bin/bash

# Signal-to-Sanctuary Setup Script
# Generates keys and configures the donation flow system

set -e

echo "======================================"
echo "Signal-to-Sanctuary Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for zcash-cli
check_zcash_cli() {
    if ! command -v zcash-cli &> /dev/null; then
        echo -e "${RED}Error: zcash-cli not found${NC}"
        echo "Please install zcashd or use zebrad with RPC enabled"
        exit 1
    fi
    echo -e "${GREEN}✓ zcash-cli found${NC}"
}

# Check node is running and synced
check_node_sync() {
    echo "Checking node status..."
    
    SYNC_STATUS=$(zcash-cli getblockchaininfo 2>/dev/null | jq -r '.verificationprogress')
    
    if [[ -z "$SYNC_STATUS" ]]; then
        echo -e "${RED}Error: Cannot connect to Zcash node${NC}"
        echo "Make sure zcashd is running with RPC enabled"
        exit 1
    fi
    
    # Check if synced (>99.9%)
    if (( $(echo "$SYNC_STATUS < 0.999" | bc -l) )); then
        echo -e "${YELLOW}Warning: Node not fully synced (${SYNC_STATUS})${NC}"
        echo "Some operations may fail until sync completes"
    else
        echo -e "${GREEN}✓ Node synced${NC}"
    fi
}

# Generate new shielded address for donations
generate_donation_address() {
    echo ""
    echo "Generating donation address..."
    
    # Create new Sapling address
    DONATION_ADDRESS=$(zcash-cli z_getnewaddress sapling)
    
    echo -e "${GREEN}✓ Donation address created:${NC}"
    echo "  $DONATION_ADDRESS"
    
    # Export viewing key (for Oracle)
    VIEWING_KEY=$(zcash-cli z_exportviewingkey "$DONATION_ADDRESS")
    
    echo -e "${GREEN}✓ Viewing key exported (for Oracle):${NC}"
    echo "  ${VIEWING_KEY:0:30}..."
    
    # Export spending key (for Signer)
    SPENDING_KEY=$(zcash-cli z_exportkey "$DONATION_ADDRESS")
    
    echo -e "${GREEN}✓ Spending key exported (for Signer):${NC}"
    echo "  ${SPENDING_KEY:0:30}..."
    echo -e "${YELLOW}  ⚠️  KEEP THIS EXTREMELY SECURE${NC}"
    
    # Save to temp file (user should move to secure location)
    echo "DONATION_Z_ADDRESS=$DONATION_ADDRESS" >> .env.generated
    echo "DONATION_VIEWING_KEY=$VIEWING_KEY" >> .env.generated
    echo "DONATION_SPENDING_KEY=$SPENDING_KEY" >> .env.generated
}

# Generate transparent address for sanctuary signals
generate_sanctuary_address() {
    echo ""
    echo "Generating sanctuary (transparent) address..."
    
    SANCTUARY_ADDRESS=$(zcash-cli getnewaddress)
    
    echo -e "${GREEN}✓ Sanctuary address created:${NC}"
    echo "  $SANCTUARY_ADDRESS"
    
    echo "SANCTUARY_T_ADDRESS=$SANCTUARY_ADDRESS" >> .env.generated
}

# Generate protocol fee address (shielded)
generate_fee_address() {
    echo ""
    echo "Generating protocol fee address..."
    
    FEE_ADDRESS=$(zcash-cli z_getnewaddress sapling)
    
    echo -e "${GREEN}✓ Fee address created:${NC}"
    echo "  $FEE_ADDRESS"
    
    echo "PROTOCOL_FEE_Z_ADDRESS=$FEE_ADDRESS" >> .env.generated
}

# Generate addresses for each spellbook act
generate_act_addresses() {
    echo ""
    echo "Generating addresses for 12 spellbook acts..."
    
    for i in {1..12}; do
        ACT_ADDRESS=$(zcash-cli z_getnewaddress sapling)
        echo "ACT_${i}_Z_ADDRESS=$ACT_ADDRESS" >> .env.generated
        echo -e "  Act $i: ${ACT_ADDRESS:0:20}..."
    done
    
    echo -e "${GREEN}✓ All act addresses created${NC}"
}

# Upload spellbook to IPFS via Pinata
upload_spellbook() {
    echo ""
    echo "Uploading spellbook to IPFS..."
    
    if [[ -z "$PINATA_API_KEY" ]] || [[ -z "$PINATA_SECRET" ]]; then
        echo -e "${YELLOW}Skipping IPFS upload - Pinata credentials not set${NC}"
        echo "Set PINATA_API_KEY and PINATA_SECRET to enable"
        return
    fi
    
    # Create spellbook JSON with generated addresses
    node -e "
    const fs = require('fs');
    const env = require('dotenv').parse(fs.readFileSync('.env.generated'));
    
    const spellbook = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        acts: []
    };
    
    for (let i = 1; i <= 12; i++) {
        spellbook.acts.push({
            id: String(i),
            title: 'Act ' + i,
            narrative: 'Story content for act ' + i,
            proverb: 'Canonical proverb for act ' + i,
            zAddress: env['ACT_' + i + '_Z_ADDRESS'],
            metadata: {
                theme: 'Theme for act ' + i,
                soulbae: 'Mage teaching',
                soulbis: 'Swordsman teaching'
            }
        });
    }
    
    fs.writeFileSync('spellbook.json', JSON.stringify(spellbook, null, 2));
    console.log('Created spellbook.json');
    "
    
    # Upload to Pinata
    RESPONSE=$(curl -s -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
        -H "pinata_api_key: $PINATA_API_KEY" \
        -H "pinata_secret_api_key: $PINATA_SECRET" \
        -F "file=@spellbook.json")
    
    CID=$(echo "$RESPONSE" | jq -r '.IpfsHash')
    
    if [[ "$CID" != "null" ]] && [[ -n "$CID" ]]; then
        echo -e "${GREEN}✓ Spellbook uploaded to IPFS:${NC}"
        echo "  CID: $CID"
        echo "  URL: https://gateway.pinata.cloud/ipfs/$CID"
        echo "SPELLBOOK_CID=$CID" >> .env.generated
    else
        echo -e "${RED}Failed to upload to IPFS${NC}"
        echo "$RESPONSE"
    fi
}

# Create final .env file
create_env_file() {
    echo ""
    echo "Creating .env file..."
    
    # Combine example with generated values
    if [[ -f .env.example ]]; then
        cp .env.example .env
    fi
    
    # Append generated values
    cat .env.generated >> .env
    
    # Clean up
    rm .env.generated
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Review .env and secure the SPENDING_KEY${NC}"
}

# Print summary
print_summary() {
    echo ""
    echo "======================================"
    echo "Setup Complete!"
    echo "======================================"
    echo ""
    echo "Generated files:"
    echo "  - .env (configuration)"
    echo "  - spellbook.json (proverb definitions)"
    echo ""
    echo "Next steps:"
    echo "  1. Review and edit .env with your settings"
    echo "  2. Edit spellbook.json with actual narratives/proverbs"
    echo "  3. Re-upload spellbook to IPFS if edited"
    echo "  4. Start services: docker-compose up"
    echo ""
    echo "Key separation:"
    echo "  - VIEWING_KEY → Oracle service only"
    echo "  - SPENDING_KEY → Signer service only (keep secure!)"
    echo ""
    echo "Golden Split:"
    echo "  - 61.8% → Sanctuary (transparent, inscribed)"
    echo "  - 38.2% → Protocol fee (shielded)"
    echo ""
}

# Main execution
main() {
    # Initialize generated env file
    echo "# Generated by setup-keys.sh on $(date)" > .env.generated
    
    check_zcash_cli
    check_node_sync
    generate_donation_address
    generate_sanctuary_address
    generate_fee_address
    generate_act_addresses
    upload_spellbook
    create_env_file
    print_summary
}

# Run main function
main "$@"
