import { config } from './config';
import logger from './logger';
import { nillionApiClient } from './nillion-api-client';
import { SecretSignerClient } from './secretsigner-client';
import { NillionWorkloadClient } from './nillion-workload-client';

export class NillionSigner {
  private apiKey: string;
  private network: string;
  private keyStoreId: string | null = null;
  private initialized: boolean = false;
  private secretSignerClient: SecretSignerClient | null = null;
  private workloadClient: NillionWorkloadClient;

  constructor() {
    this.apiKey = config.nillion.apiKey;
    this.network = config.nillion.network;
    this.workloadClient = new NillionWorkloadClient();
  }

  /**
   * Initialize SecretSigner client with workload URL
   */
  initializeSecretSigner(workloadUrl: string): void {
    this.secretSignerClient = new SecretSignerClient(this.workloadClient);
    this.secretSignerClient.setWorkloadUrl(workloadUrl);
    logger.info('SecretSigner client initialized', { workloadUrl });
  }

  // Initialize Nillion client
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Nillion client', { network: this.network });
      
      // Test API connection
      const connected = await nillionApiClient.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Nillion API');
      }

      this.initialized = true;
      logger.info('Nillion client initialized');
    } catch (error: any) {
      logger.error('Failed to initialize Nillion client', { error: error.message });
      throw new Error(`Failed to initialize Nillion: ${error.message}`);
    }
  }

  // Initialize and store Zcash spending key
  async initializeKey(privateKey: Buffer): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info('Storing Zcash key in SecretSigner');
      
      // Use SecretSigner client if available (workload is running)
      if (this.secretSignerClient) {
        const response = await this.secretSignerClient.storeKey({
          privateKey: privateKey.toString('hex'),
          algorithm: 'ECDSA',
          label: 'zcash-spending-key',
        });
        this.keyStoreId = response.keyStoreId;
      } else {
        // Fallback to placeholder (workload not ready)
        logger.warn('SecretSigner client not initialized, using placeholder');
        this.keyStoreId = await nillionApiClient.storeKey(
          Buffer.from(privateKey.toString('hex'), 'hex'),
          'ECDSA',
          'zcash-spending-key'
        );
      }
      
      logger.info('Zcash key stored in SecretSigner', { keyStoreId: this.keyStoreId });
      return this.keyStoreId;
    } catch (error: any) {
      logger.error('Failed to store key', { error: error.message });
      throw new Error(`Failed to store key: ${error.message}`);
    }
  }

  // Sign transaction hash
  async signTransaction(txHash: Buffer): Promise<Buffer> {
    if (!this.keyStoreId) {
      throw new Error('Key not initialized. Call initializeKey() first.');
    }

    try {
      logger.info('Signing transaction with SecretSigner', { 
        keyStoreId: this.keyStoreId,
        hashLength: txHash.length 
      });

      // Use SecretSigner client if available (workload is running)
      if (this.secretSignerClient) {
        const response = await this.secretSignerClient.sign({
          keyStoreId: this.keyStoreId,
          message: txHash.toString('hex'),
          algorithm: 'ECDSA',
        });
        const signature = Buffer.from(response.signature, 'hex');
        logger.info('Transaction signed successfully', { 
          signatureLength: signature.length 
        });
        return signature;
      } else {
        // Fallback to placeholder (workload not ready)
        logger.warn('SecretSigner client not initialized, using placeholder');
        const signature = await nillionApiClient.sign(
          this.keyStoreId,
          txHash,
          'ECDSA'
        );
        logger.info('Transaction signed successfully', { 
          signatureLength: signature.length 
        });
        return signature;
      }
    } catch (error: any) {
      logger.error('Failed to sign transaction', { error: error.message });
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  // Get attestation
  async getAttestation(): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info('Getting Nillion attestation');
      
      const attestation = await nillionApiClient.getAttestation();
      
      logger.info('Attestation retrieved successfully');
      
      return attestation;
    } catch (error: any) {
      logger.error('Failed to get attestation', { error: error.message });
      throw new Error(`Failed to get attestation: ${error.message}`);
    }
  }

  // Verify attestation
  async verifyAttestation(attestation: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info('Verifying Nillion attestation');
      
      const valid = await nillionApiClient.verifyAttestation(attestation);
      
      logger.info('Attestation verification completed', { valid });
      
      return valid;
    } catch (error: any) {
      logger.error('Attestation verification failed', { error: error.message });
      return false;
    }
  }

  // Check if key is initialized
  isInitialized(): boolean {
    return this.keyStoreId !== null;
  }

  // Get key store ID (for debugging)
  getKeyStoreId(): string | null {
    return this.keyStoreId;
  }
}

export const nillionSigner = new NillionSigner();

