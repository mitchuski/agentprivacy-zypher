/**
 * Signing Service - The Swordsman's Hand
 * 
 * Holds the SIGNING KEY - can spend but cannot see transaction details.
 * Acts only upon verified signals from the Oracle.
 * 
 * Responsibilities:
 * 1. Receive verification signals from Oracle (TEE-attested)
 * 2. Execute golden split (61.8% / 38.2%)
 * 3. Create OP_RETURN inscription for sanctuary signal
 * 4. Submit split transactions to Zebra node
 */

import express from 'express';
import { createZebraClient, ZebraRpcClient } from '../../zebra/src/rpc-client';
import { InscriptionBuilder } from './inscription-builder';
import { GoldenSplit } from './golden-split';

interface SignerConfig {
  // Spending key for the donation z-address
  spendingKey: string;
  
  // The shielded address holding donations
  donationZAddress: string;
  
  // Transparent address for sanctuary signals (61.8%)
  sanctuaryTAddress: string;
  
  // Protocol fee z-address (38.2% stays shielded)
  protocolFeeZAddress: string;
  
  // HTTP port for receiving Oracle signals
  port: number;
  
  // Minimum amount to process (avoid dust)
  minAmount: number;
}

interface VerificationSignal {
  txid: string;
  amount: number;
  actId: string;
  verified: boolean;
  confidence: number;
  timestamp: number;
  proverbHash: string;
}

interface ProcessedSplit {
  originalTxid: string;
  sanctuaryTxid: string;
  feeTxid: string;
  sanctuaryAmount: number;
  feeAmount: number;
  inscription: string;
  timestamp: number;
}

export class SigningService {
  private zebra: ZebraRpcClient;
  private config: SignerConfig;
  private inscriptionBuilder: InscriptionBuilder;
  private goldenSplit: GoldenSplit;
  private processedSignals: Map<string, ProcessedSplit> = new Map();
  private app: express.Application;

  constructor(config: SignerConfig) {
    this.config = config;
    this.zebra = createZebraClient();
    this.inscriptionBuilder = new InscriptionBuilder();
    this.goldenSplit = new GoldenSplit();
    this.app = express();
    this.setupRoutes();
  }

  /**
   * Initialize the signer - import spending key
   */
  async initialize(): Promise<void> {
    console.log('[Signer] Initializing Swordsman\'s Hand...');
    
    // Import spending key (full control)
    try {
      const result = await this.zebra.importKey(
        this.config.spendingKey,
        'whenkeyisnew'
      );
      console.log(`[Signer] Spending key imported for: ${result.address}`);
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('[Signer] Spending key already imported');
    }

    // Verify we can access the donation address
    const balance = await this.zebra.getBalance(this.config.donationZAddress);
    console.log(`[Signer] Donation address balance: ${balance} ZEC`);
  }

  /**
   * Setup HTTP routes for receiving Oracle signals
   */
  private setupRoutes(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'signer' });
    });

    // Verification signal endpoint
    this.app.post('/verify', async (req, res) => {
      try {
        const signal = req.body as VerificationSignal;
        
        // Verify TEE attestation header
        const attestation = req.headers['x-tee-attestation'] as string;
        if (!this.verifyAttestation(attestation)) {
          return res.status(403).json({ error: 'Invalid TEE attestation' });
        }

        // Process the verified donation
        if (signal.verified) {
          const result = await this.executeSplit(signal);
          res.json({ success: true, result });
        } else {
          res.json({ success: false, reason: 'Signal not verified' });
        }
      } catch (error: any) {
        console.error('[Signer] Error processing signal:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Query processed splits
    this.app.get('/splits/:txid', (req, res) => {
      const split = this.processedSignals.get(req.params.txid);
      if (split) {
        res.json(split);
      } else {
        res.status(404).json({ error: 'Split not found' });
      }
    });
  }

  /**
   * Start the signing service
   */
  async start(): Promise<void> {
    await this.initialize();
    
    this.app.listen(this.config.port, () => {
      console.log(`[Signer] Listening on port ${this.config.port}`);
    });
  }

  /**
   * Verify TEE attestation from Oracle
   */
  private verifyAttestation(attestation: string): boolean {
    if (!attestation) {
      console.warn('[Signer] Missing TEE attestation');
      return false;
    }

    try {
      // In production:
      // 1. Decode attestation
      // 2. Verify enclave measurement matches expected Oracle
      // 3. Verify signature from enclave key
      // 4. Check timestamp is recent
      
      const data = JSON.parse(Buffer.from(attestation, 'base64').toString());
      
      // Basic validation for demo
      if (data.enclave !== 'signal-to-sanctuary-oracle') {
        console.warn('[Signer] Unknown enclave');
        return false;
      }

      // Check attestation is recent (within 5 minutes)
      if (Date.now() - data.timestamp > 5 * 60 * 1000) {
        console.warn('[Signer] Stale attestation');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Signer] Attestation verification failed:', error);
      return false;
    }
  }

  /**
   * Execute the golden split for a verified donation
   */
  private async executeSplit(signal: VerificationSignal): Promise<ProcessedSplit> {
    // Check if already processed
    if (this.processedSignals.has(signal.txid)) {
      console.log(`[Signer] Already processed: ${signal.txid}`);
      return this.processedSignals.get(signal.txid)!;
    }

    // Check minimum amount
    if (signal.amount < this.config.minAmount) {
      throw new Error(`Amount ${signal.amount} below minimum ${this.config.minAmount}`);
    }

    console.log(`[Signer] Executing golden split for ${signal.txid} (${signal.amount} ZEC)`);

    // Calculate split amounts
    const split = this.goldenSplit.calculate(signal.amount);
    console.log(`[Signer] Split: ${split.sanctuary} ZEC (61.8%) / ${split.fee} ZEC (38.2%)`);

    // Build inscription for OP_RETURN
    const inscription = this.inscriptionBuilder.build({
      actId: signal.actId,
      proverbHash: signal.proverbHash,
      originalTxid: signal.txid,
      amount: split.sanctuary,
      timestamp: signal.timestamp
    });

    console.log(`[Signer] Inscription: ${inscription}`);

    // Execute the split transaction
    // First, send to transparent address with inscription
    const sanctuaryTxid = await this.sendToSanctuary(split.sanctuary, inscription);
    console.log(`[Signer] Sanctuary TX: ${sanctuaryTxid}`);

    // Then, send fee portion to protocol fee address (stays shielded)
    const feeTxid = await this.sendToFee(split.fee);
    console.log(`[Signer] Fee TX: ${feeTxid}`);

    const result: ProcessedSplit = {
      originalTxid: signal.txid,
      sanctuaryTxid,
      feeTxid,
      sanctuaryAmount: split.sanctuary,
      feeAmount: split.fee,
      inscription,
      timestamp: Date.now()
    };

    this.processedSignals.set(signal.txid, result);
    return result;
  }

  /**
   * Send sanctuary portion to transparent address with OP_RETURN
   */
  private async sendToSanctuary(amount: number, inscription: string): Promise<string> {
    // Method 1: Direct z_sendmany to t-address (simple, no inscription)
    // Method 2: Build raw transaction with OP_RETURN (enables inscription)

    // For now, use z_sendmany for the value transfer
    // The inscription is stored as metadata we can reference
    // Full OP_RETURN inscription requires building raw transparent transactions

    const opid = await this.zebra.sendMany(
      this.config.donationZAddress,
      [{
        address: this.config.sanctuaryTAddress,
        amount: amount,
        memo: `SANCTUARY:${inscription}` // Memo for tracking
      }]
    );

    const result = await this.zebra.waitForOperation(opid);
    return result.txid;
  }

  /**
   * Send fee portion to shielded protocol address
   */
  private async sendToFee(amount: number): Promise<string> {
    const opid = await this.zebra.sendMany(
      this.config.donationZAddress,
      [{
        address: this.config.protocolFeeZAddress,
        amount: amount,
        memo: 'Protocol fee - Golden Split 38.2%'
      }]
    );

    const result = await this.zebra.waitForOperation(opid);
    return result.txid;
  }
}

// Service entry point
export async function startSigner(): Promise<void> {
  const config: SignerConfig = {
    spendingKey: process.env.DONATION_SPENDING_KEY!,
    donationZAddress: process.env.DONATION_Z_ADDRESS!,
    sanctuaryTAddress: process.env.SANCTUARY_T_ADDRESS!,
    protocolFeeZAddress: process.env.PROTOCOL_FEE_Z_ADDRESS!,
    port: parseInt(process.env.SIGNER_PORT || '3001'),
    minAmount: parseFloat(process.env.MIN_DONATION || '0.001')
  };

  const signer = new SigningService(config);
  await signer.start();
}

// Run if executed directly
if (require.main === module) {
  startSigner().catch(console.error);
}
