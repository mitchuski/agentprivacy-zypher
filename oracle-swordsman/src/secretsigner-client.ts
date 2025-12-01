/**
 * SecretSigner Client
 * Client for interacting with SecretSigner service running in Nillion workload
 */

import axios, { AxiosInstance } from 'axios';
import logger from './logger';
import { NillionWorkloadClient } from './nillion-workload-client';

export interface SecretSignerConfig {
  workloadUrl: string;
  timeout?: number;
}

export interface StoreKeyRequest {
  privateKey: string;
  algorithm: 'ECDSA' | 'Ed25519';
  label?: string;
}

export interface StoreKeyResponse {
  keyStoreId: string;
  algorithm: string;
  createdAt: string;
}

export interface SignRequest {
  keyStoreId: string;
  message: string; // Hex-encoded message
  algorithm: 'ECDSA' | 'Ed25519';
}

export interface SignResponse {
  signature: string; // Hex-encoded signature
  keyStoreId: string;
}

export class SecretSignerClient {
  private apiClient: AxiosInstance | null = null;
  private workloadClient: NillionWorkloadClient;
  private workloadUrl: string | null = null;

  constructor(workloadClient: NillionWorkloadClient) {
    this.workloadClient = workloadClient;
    this.workloadUrl = workloadClient.getActiveWorkloadUrl();
    
    // Initialize API client when workload URL is available
    if (this.workloadUrl) {
      this.apiClient = axios.create({
        baseURL: `${this.workloadUrl}/api/secretsigner`,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Update workload URL (call after workload is created)
   */
  setWorkloadUrl(url: string): void {
    this.workloadUrl = url;
    this.apiClient = axios.create({
      baseURL: `${url}/api/secretsigner`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    logger.info('SecretSigner client updated with workload URL', { url });
  }

  /**
   * Store a private key in SecretSigner
   */
  async storeKey(request: StoreKeyRequest): Promise<StoreKeyResponse> {
    if (!this.apiClient || !this.workloadUrl) {
      throw new Error('Workload URL not set. Call setWorkloadUrl() first.');
    }

    try {
      logger.info('Storing key in SecretSigner', { 
        algorithm: request.algorithm,
        label: request.label 
      });
      
      const response = await this.apiClient.post<StoreKeyResponse>('/store', request);
      
      logger.info('Key stored successfully', { 
        keyStoreId: response.data.keyStoreId 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to store key', { 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
      throw new Error(`Failed to store key: ${error.message}`);
    }
  }

  /**
   * Sign a message using a stored key
   */
  async sign(request: SignRequest): Promise<SignResponse> {
    if (!this.apiClient || !this.workloadUrl) {
      throw new Error('Workload URL not set. Call setWorkloadUrl() first.');
    }

    try {
      logger.info('Signing message with SecretSigner', { 
        keyStoreId: request.keyStoreId,
        algorithm: request.algorithm 
      });
      
      const response = await this.apiClient.post<SignResponse>('/sign', request);
      
      logger.info('Message signed successfully', { 
        keyStoreId: response.data.keyStoreId,
        signatureLength: response.data.signature.length 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to sign message', { 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Get health status of SecretSigner service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.workloadUrl) {
      return false;
    }

    try {
      const response = await axios.get(`${this.workloadUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error: any) {
      logger.warn('SecretSigner health check failed', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * List stored keys (if supported)
   */
  async listKeys(): Promise<string[]> {
    if (!this.apiClient || !this.workloadUrl) {
      throw new Error('Workload URL not set. Call setWorkloadUrl() first.');
    }

    try {
      const response = await this.apiClient.get<{ keys: string[] }>('/keys');
      return response.data.keys;
    } catch (error: any) {
      logger.error('Failed to list keys', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to list keys: ${error.message}`);
    }
  }
}

