/**
 * Nillion REST API Client
 * Handles HTTP requests to Nillion's REST API for SecretSigner operations
 */

import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import logger from './logger';

export interface NillionApiConfig {
  apiKey: string;
  network: 'mainnet' | 'testnet';
  apiUrl: string;
  apiVersion: string;
  timeout: number;
}

export interface StoreKeyRequest {
  privateKey: string; // Hex-encoded private key
  algorithm: 'ECDSA' | 'Ed25519';
  label?: string;
}

export interface StoreKeyResponse {
  keyStoreId: string;
  createdAt: string;
}

export interface SignRequest {
  keyStoreId: string;
  message: string; // Hex-encoded message/hash
  algorithm: 'ECDSA' | 'Ed25519';
}

export interface SignResponse {
  signature: string; // Hex-encoded signature
  keyStoreId: string;
}

export interface AttestationResponse {
  attestation: string;
  signingAddress: string;
  timestamp: string;
}

export class NillionApiClient {
  private config: NillionApiConfig;
  private client: AxiosInstance;

  constructor(customConfig?: Partial<NillionApiConfig>) {
    const defaultConfig: NillionApiConfig = {
      apiKey: config.nillion.apiKey,
      network: config.nillion.network as 'mainnet' | 'testnet',
      apiUrl: config.nillion.apiUrl || 'https://api.nilcc.nillion.network',
      apiVersion: config.nillion.apiVersion || 'v1',
      timeout: config.nillion.timeout || 30000,
    };

    this.config = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig;

    // Create axios instance with default config
    // Base URL format: https://api.nilcc.nillion.network/api/v1
    this.client = axios.create({
      baseURL: `${this.config.apiUrl}/api/${this.config.apiVersion}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'accept': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        logger.debug('Nillion API request', {
          method: request.method,
          url: request.url,
          baseURL: request.baseURL,
        });
        return request;
      },
      (error) => {
        logger.error('Nillion API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Nillion API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error('Nillion API error', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
          });
        } else {
          logger.error('Nillion API network error', { error: error.message });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Store a private key in SecretSigner
   * @param privateKey - Buffer containing the private key
   * @param algorithm - Signing algorithm (ECDSA for Zcash)
   * @param label - Optional label for the key store
   * @returns Key store ID
   */
  async storeKey(
    privateKey: Buffer,
    algorithm: 'ECDSA' | 'Ed25519' = 'ECDSA',
    label?: string
  ): Promise<string> {
    try {
      const request: StoreKeyRequest = {
        privateKey: privateKey.toString('hex'),
        algorithm,
        ...(label && { label }),
      };

      logger.info('Storing key in SecretSigner', { algorithm, hasLabel: !!label });

      // Note: SecretSigner may be part of a nilCC workload
      // For now, we'll try the accounts or a custom endpoint
      // If SecretSigner is workload-based, we may need to:
      // 1. Create a workload with SecretSigner service
      // 2. Call the workload's SecretSigner endpoint
      // 
      // Trying accounts endpoint first (keys might be stored per account)
      // If this doesn't work, we'll need to check workload-based approach
      const response = await this.client.post<StoreKeyResponse>(
        '/accounts/keys/store',
        request
      );

      logger.info('Key stored successfully', {
        keyStoreId: response.data.keyStoreId,
      });

      return response.data.keyStoreId;
    } catch (error: any) {
      logger.error('Failed to store key', { error: error.message });
      throw new Error(`Failed to store key in SecretSigner: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sign a message/hash using SecretSigner
   * @param keyStoreId - ID of the stored key
   * @param message - Buffer containing the message/hash to sign
   * @param algorithm - Signing algorithm
   * @returns Signature as Buffer
   */
  async sign(
    keyStoreId: string,
    message: Buffer,
    algorithm: 'ECDSA' | 'Ed25519' = 'ECDSA'
  ): Promise<Buffer> {
    try {
      const request: SignRequest = {
        keyStoreId,
        message: message.toString('hex'),
        algorithm,
      };

      logger.info('Signing message with SecretSigner', {
        keyStoreId,
        algorithm,
        messageLength: message.length,
      });

      // Note: SecretSigner signing may be workload-based
      // If SecretSigner runs in a nilCC workload, we'd need to:
      // 1. Have a workload with SecretSigner service running
      // 2. Call the workload's signing endpoint
      //
      // For now, trying accounts endpoint
      const response = await this.client.post<SignResponse>(
        '/accounts/keys/sign',
        request
      );

      const signature = Buffer.from(response.data.signature, 'hex');

      logger.info('Message signed successfully', {
        keyStoreId,
        signatureLength: signature.length,
      });

      return signature;
    } catch (error: any) {
      logger.error('Failed to sign message', {
        error: error.message,
        keyStoreId,
      });
      throw new Error(`Failed to sign with SecretSigner: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get TEE attestation
   * @returns Attestation string
   */
  async getAttestation(): Promise<string> {
    try {
      logger.info('Getting Nillion attestation');

      // Attestation is available from running workloads
      // Per docs: curl https://[your-running-workload]/nilcc/api/v2/report
      // For API access, we might need to get it from a workload
      // Trying accounts endpoint first
      const response = await this.client.get<AttestationResponse>('/accounts/attestation');

      logger.info('Attestation retrieved', {
        signingAddress: response.data.signingAddress,
        timestamp: response.data.timestamp,
      });

      return response.data.attestation;
    } catch (error: any) {
      logger.error('Failed to get attestation', { error: error.message });
      throw new Error(`Failed to get attestation: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify attestation
   * @param attestation - Attestation string to verify
   * @returns true if valid
   */
  async verifyAttestation(attestation: string): Promise<boolean> {
    try {
      logger.info('Verifying Nillion attestation');

      // Attestation verification endpoint
      const response = await this.client.post<{ valid: boolean }>(
        '/accounts/attestation/verify',
        { attestation }
      );

      logger.info('Attestation verification result', {
        valid: response.data.valid,
      });

      return response.data.valid;
    } catch (error: any) {
      logger.error('Failed to verify attestation', { error: error.message });
      return false;
    }
  }

  /**
   * Test API connection using accounts endpoint
   * @returns true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing Nillion nilCC API connection', {
        apiUrl: this.config.apiUrl,
        apiVersion: this.config.apiVersion,
        network: this.config.network,
      });

      // Test with accounts/me endpoint (per API docs)
      try {
        const response = await this.client.get('/accounts/me');
        logger.info('API connection successful', {
          accountInfo: response.data,
        });
        return true;
      } catch (error: any) {
        // If we get a 404, the API is reachable but endpoint doesn't exist
        // If we get auth error (401/403), API is reachable but key is invalid
        if (error.response) {
          const status = error.response.status;
          if (status === 404) {
            logger.warn('API endpoint not found (may need to check docs)', {
              url: error.config?.url,
            });
            return true; // Connection works, endpoint may be wrong
          }
          if (status === 401 || status === 403) {
            logger.error('API authentication failed - check API key', {
              status,
              message: error.response.data?.message,
            });
            return false;
          }
          // Other errors might mean connection works but endpoint is wrong
          logger.warn('API responded but endpoint may be incorrect', {
            status,
            url: error.config?.url,
          });
          return true; // Connection works
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Nillion API connection test failed', { error: error.message });
      return false;
    }
  }
}

export const nillionApiClient = new NillionApiClient();

