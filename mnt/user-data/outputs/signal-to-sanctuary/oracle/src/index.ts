/**
 * Oracle Service - The Mage's Eye
 * 
 * Runs inside NEAR TEE environment.
 * Holds ONLY the viewing key - can see but cannot spend.
 * 
 * Responsibilities:
 * 1. Monitor shielded address for incoming donations
 * 2. Extract proverb from transaction memo
 * 3. Fetch canonical proverb from IPFS
 * 4. Perform semantic matching via AI
 * 5. Signal verification result to signing service
 */

import { createZebraClient, ZebraRpcClient } from '../../zebra/src/rpc-client';
import { ProverbMatcher } from './semantic-matcher';
import { IPFSProverbStore } from './ipfs-proverb-fetcher';

interface OracleConfig {
  // Viewing key (exported from the donation z-address)
  viewingKey: string;
  
  // The shielded address to monitor
  donationZAddress: string;
  
  // IPFS gateway for fetching canonical proverbs
  ipfsGateway: string;
  
  // Pinata/IPFS CID where spellbook proverbs are stored
  spellbookCID: string;
  
  // Signing service endpoint (receives verification signals)
  signerEndpoint: string;
  
  // Polling interval in milliseconds
  pollInterval: number;
  
  // Minimum confirmations before processing
  minConfirmations: number;
}

interface PendingDonation {
  txid: string;
  amount: number;
  memo: string;
  actId: string | null;
  blockheight: number;
  status: 'pending' | 'verified' | 'rejected' | 'processed';
  verificationResult?: VerificationResult;
}

interface VerificationResult {
  matched: boolean;
  actId: string;
  confidence: number;
  canonicalProverb: string;
  submittedProverb: string;
  timestamp: number;
}

export class OracleService {
  private zebra: ZebraRpcClient;
  private matcher: ProverbMatcher;
  private ipfs: IPFSProverbStore;
  private config: OracleConfig;
  private processedTxids: Set<string> = new Set();
  private pendingDonations: Map<string, PendingDonation> = new Map();
  private isRunning: boolean = false;

  constructor(config: OracleConfig) {
    this.config = config;
    this.zebra = createZebraClient();
    this.matcher = new ProverbMatcher();
    this.ipfs = new IPFSProverbStore(config.ipfsGateway, config.spellbookCID);
  }

  /**
   * Initialize the oracle - import viewing key
   */
  async initialize(): Promise<void> {
    console.log('[Oracle] Initializing Mage\'s Eye...');
    
    // Import viewing key (read-only access)
    try {
      const result = await this.zebra.importViewingKey(
        this.config.viewingKey,
        'whenkeyisnew'
      );
      console.log(`[Oracle] Viewing key imported for address type: ${result.address_type}`);
      console.log(`[Oracle] Monitoring address: ${result.address}`);
    } catch (error: any) {
      // Key might already be imported
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('[Oracle] Viewing key already imported');
    }

    // Load proverb store from IPFS
    await this.ipfs.loadSpellbook();
    console.log(`[Oracle] Loaded ${this.ipfs.getActCount()} acts from spellbook`);
  }

  /**
   * Start monitoring for donations
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[Oracle] Starting donation monitor...');
    
    while (this.isRunning) {
      try {
        await this.checkForNewDonations();
        await this.processPendingDonations();
      } catch (error) {
        console.error('[Oracle] Error in monitor loop:', error);
      }
      
      await this.sleep(this.config.pollInterval);
    }
  }

  /**
   * Stop the oracle service
   */
  stop(): void {
    this.isRunning = false;
    console.log('[Oracle] Stopping...');
  }

  /**
   * Check for new incoming donations
   */
  private async checkForNewDonations(): Promise<void> {
    const notes = await this.zebra.listReceivedByAddress(
      this.config.donationZAddress,
      0 // Include unconfirmed
    );

    for (const note of notes) {
      // Skip if already processed
      if (this.processedTxids.has(note.txid)) continue;
      
      // Skip change outputs
      if (note.change) continue;
      
      // Parse the memo to extract act ID and proverb
      const parsed = this.parseMemo(note.memo);
      
      const donation: PendingDonation = {
        txid: note.txid,
        amount: note.amount,
        memo: note.memo,
        actId: parsed.actId,
        blockheight: note.blockheight,
        status: 'pending'
      };

      this.pendingDonations.set(note.txid, donation);
      console.log(`[Oracle] New donation detected: ${note.txid} (${note.amount} ZEC)`);
    }
  }

  /**
   * Process pending donations that have enough confirmations
   */
  private async processPendingDonations(): Promise<void> {
    const currentHeight = await this.zebra.getBlockCount();

    for (const [txid, donation] of this.pendingDonations) {
      if (donation.status !== 'pending') continue;

      // Check confirmations
      const confirmations = currentHeight - donation.blockheight + 1;
      if (confirmations < this.config.minConfirmations) {
        continue;
      }

      console.log(`[Oracle] Processing donation ${txid}...`);

      try {
        const result = await this.verifyProverb(donation);
        donation.verificationResult = result;
        donation.status = result.matched ? 'verified' : 'rejected';

        if (result.matched) {
          console.log(`[Oracle] ✓ Proverb verified for Act ${result.actId} (confidence: ${result.confidence.toFixed(2)})`);
          await this.signalVerification(donation, result);
        } else {
          console.log(`[Oracle] ✗ Proverb rejected for Act ${result.actId} (confidence: ${result.confidence.toFixed(2)})`);
        }

        this.processedTxids.add(txid);
      } catch (error) {
        console.error(`[Oracle] Error verifying ${txid}:`, error);
      }
    }
  }

  /**
   * Parse memo field to extract act ID and proverb
   * Expected format: "ACT:<id>|<proverb text>"
   */
  private parseMemo(memo: string): { actId: string | null; proverb: string } {
    const match = memo.match(/^ACT:(\d+)\|(.+)$/s);
    
    if (match) {
      return {
        actId: match[1],
        proverb: match[2].trim()
      };
    }

    // Try to infer act from proverb content
    return {
      actId: null,
      proverb: memo.trim()
    };
  }

  /**
   * Verify submitted proverb against canonical version
   */
  private async verifyProverb(donation: PendingDonation): Promise<VerificationResult> {
    const parsed = this.parseMemo(donation.memo);
    
    // If no act ID, try to match against all acts
    if (!parsed.actId) {
      const bestMatch = await this.matcher.findBestMatch(
        parsed.proverb,
        this.ipfs.getAllProverbs()
      );
      
      return {
        matched: bestMatch.confidence >= 0.75,
        actId: bestMatch.actId,
        confidence: bestMatch.confidence,
        canonicalProverb: bestMatch.canonical,
        submittedProverb: parsed.proverb,
        timestamp: Date.now()
      };
    }

    // Verify against specific act
    const canonical = await this.ipfs.getProverb(parsed.actId);
    
    if (!canonical) {
      return {
        matched: false,
        actId: parsed.actId,
        confidence: 0,
        canonicalProverb: '',
        submittedProverb: parsed.proverb,
        timestamp: Date.now()
      };
    }

    const confidence = await this.matcher.compare(parsed.proverb, canonical);

    return {
      matched: confidence >= 0.75, // 75% threshold for semantic match
      actId: parsed.actId,
      confidence,
      canonicalProverb: canonical,
      submittedProverb: parsed.proverb,
      timestamp: Date.now()
    };
  }

  /**
   * Signal verification result to signing service
   * The signing service holds the spending key and executes the split
   */
  private async signalVerification(donation: PendingDonation, result: VerificationResult): Promise<void> {
    const signal = {
      txid: donation.txid,
      amount: donation.amount,
      actId: result.actId,
      verified: result.matched,
      confidence: result.confidence,
      timestamp: result.timestamp,
      // Include hash of proverb for audit trail
      proverbHash: this.hashProverb(result.submittedProverb)
    };

    try {
      const response = await fetch(this.config.signerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, include TEE attestation
          'X-TEE-Attestation': await this.generateAttestation()
        },
        body: JSON.stringify(signal)
      });

      if (!response.ok) {
        throw new Error(`Signer responded with ${response.status}`);
      }

      console.log(`[Oracle] Verification signal sent to signer for ${donation.txid}`);
    } catch (error) {
      console.error('[Oracle] Failed to signal signer:', error);
      throw error;
    }
  }

  /**
   * Generate TEE attestation for the verification
   * In NEAR TEE, this would use the enclave's attestation mechanism
   */
  private async generateAttestation(): Promise<string> {
    // In production NEAR TEE environment:
    // - Generate quote from enclave
    // - Include measurement of running code
    // - Sign with enclave key
    
    // Placeholder for development
    return Buffer.from(JSON.stringify({
      enclave: 'signal-to-sanctuary-oracle',
      version: '1.0.0',
      timestamp: Date.now()
    })).toString('base64');
  }

  /**
   * Hash proverb for audit trail
   */
  private hashProverb(proverb: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(proverb).digest('hex');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Service entry point
export async function startOracle(): Promise<void> {
  const config: OracleConfig = {
    viewingKey: process.env.DONATION_VIEWING_KEY!,
    donationZAddress: process.env.DONATION_Z_ADDRESS!,
    ipfsGateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud',
    spellbookCID: process.env.SPELLBOOK_CID!,
    signerEndpoint: process.env.SIGNER_ENDPOINT || 'http://localhost:3001/verify',
    pollInterval: parseInt(process.env.POLL_INTERVAL || '10000'),
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1')
  };

  const oracle = new OracleService(config);
  await oracle.initialize();
  await oracle.start();
}

// Run if executed directly
if (require.main === module) {
  startOracle().catch(console.error);
}
