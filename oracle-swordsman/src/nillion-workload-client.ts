/**
 * Nillion Workload Client
 * Handles nilCC workload operations for SecretSigner
 * 
 * Based on nilCC API docs: https://nillion-docs-git-feat-nilcc-nillion.vercel.app/build/compute/api-reference
 * 
 * SecretSigner runs inside a nilCC workload, so we need to:
 * 1. Create/manage workloads
 * 2. Call workload endpoints for SecretSigner operations
 */

import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import logger from './logger';

export interface WorkloadConfig {
  name: string;
  artifactsVersion: string;
  dockerCompose: string;
  envVars?: Record<string, string>;
  files?: Record<string, string>; // base64 encoded
  dockerCredentials?: Array<{
    server: string;
    username: string;
    password: string;
  }>;
  publicContainerName: string;
  publicContainerPort: number;
  memory: number; // MB
  cpus: number;
  disk: number; // GB
  gpus?: number;
}

export interface Workload {
  id: string;
  name: string;
  status: string;
  url?: string; // Workload public URL
  createdAt: string;
}

export interface WorkloadTier {
  id: string;
  cpus: number;
  memory: number; // MB
  disk: number; // GB
  gpus: number;
  cost: number; // credits
}

export class NillionWorkloadClient {
  private apiClient: AxiosInstance;
  private workloadId: string | null = null;
  private workloadUrl: string | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${config.nillion.apiUrl}/api/${config.nillion.apiVersion}`,
      timeout: config.nillion.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.nillion.apiKey,
        'accept': 'application/json',
      },
    });
  }

  /**
   * Set active workload (for tracking)
   */
  setActiveWorkload(workloadId: string, workloadUrl: string): void {
    this.workloadId = workloadId;
    this.workloadUrl = workloadUrl;
    logger.info('Active workload set', { workloadId, workloadUrl });
  }

  /**
   * Get active workload ID
   */
  getActiveWorkloadId(): string | null {
    return this.workloadId;
  }

  /**
   * Get active workload URL
   */
  getActiveWorkloadUrl(): string | null {
    return this.workloadUrl;
  }

  /**
   * List available workload tiers
   * Returns predefined resource configurations
   * Note: Endpoint path needs to be verified - may not exist in API
   */
  async listWorkloadTiers(): Promise<WorkloadTier[]> {
    try {
      logger.info('Listing available workload tiers');
      // Note: workload-tiers endpoint may not exist
      // Per OpenAPI spec, we have workloads, artifacts, accounts, etc.
      // Workload tiers might be part of workload creation or a separate endpoint
      try {
        const response = await this.apiClient.get<WorkloadTier[]>(
          '/workload-tiers/list'
        );
        logger.info('Workload tiers retrieved', { count: response.data.length });
        return response.data;
      } catch (error: any) {
        // If endpoint doesn't exist, return empty array
        logger.warn('Workload tiers endpoint not found, returning empty array');
        return [];
      }
    } catch (error: any) {
      logger.error('Failed to list workload tiers', { error: error.message });
      throw error;
    }
  }

  /**
   * List available artifacts (VM image versions)
   * Per OpenAPI spec: GET /api/v1/artifacts/list
   */
  async listArtifacts(): Promise<any[]> {
    try {
      logger.info('Listing available artifacts');
      const response = await this.apiClient.get<any[]>('/artifacts/list');
      logger.info('Artifacts retrieved', { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to list artifacts', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a nilCC workload
   * This would deploy SecretSigner service inside a TEE
   */
  async createWorkload(workloadConfig: WorkloadConfig): Promise<Workload> {
    try {
      logger.info('Creating nilCC workload', { name: workloadConfig.name });
      
      const response = await this.apiClient.post<Workload>(
        '/workloads/create',
        workloadConfig
      );

      this.workloadId = response.data.id;
      this.workloadUrl = response.data.url || null;

      logger.info('Workload created', {
        id: this.workloadId,
        url: this.workloadUrl,
        status: response.data.status,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create workload', { error: error.message });
      throw error;
    }
  }

  /**
   * List all workloads
   * Per OpenAPI spec: GET /api/v1/workloads/list
   */
  async listWorkloads(): Promise<Workload[]> {
    try {
      logger.info('Listing workloads');
      const response = await this.apiClient.get<Workload[]>('/workloads/list');
      logger.info('Workloads retrieved', { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to list workloads', { error: error.message });
      throw error;
    }
  }

  /**
   * Get workload details
   */
  async getWorkload(workloadId: string): Promise<Workload> {
    try {
      logger.info('Getting workload details', { workloadId });
      const response = await this.apiClient.get<Workload>(
        `/workloads/${workloadId}`
      );
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get workload', { error: error.message });
      throw error;
    }
  }

  /**
   * Get workload logs
   */
  async getWorkloadLogs(workloadId: string): Promise<string> {
    try {
      logger.info('Getting workload logs', { workloadId });
      const response = await this.apiClient.post<{ logs: string }>(
        '/workloads/logs',
        { workloadId }
      );
      return response.data.logs;
    } catch (error: any) {
      logger.error('Failed to get workload logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get attestation from running workload
   * Per docs: https://[your-running-workload]/nilcc/api/v2/report
   */
  async getWorkloadAttestation(workloadUrl: string): Promise<string> {
    try {
      logger.info('Getting attestation from workload', { workloadUrl });
      
      // Attestation endpoint is on the workload itself, not the API
      const attestationUrl = `${workloadUrl}/nilcc/api/v2/report`;
      
      const response = await axios.get(attestationUrl, {
        timeout: 10000,
      });

      logger.info('Attestation retrieved from workload');
      return JSON.stringify(response.data);
    } catch (error: any) {
      logger.error('Failed to get workload attestation', { error: error.message });
      throw error;
    }
  }

  /**
   * Call SecretSigner endpoint on workload
   * This would be a custom endpoint exposed by the SecretSigner service
   */
  async callWorkloadSecretSigner(
    workloadUrl: string,
    endpoint: string,
    data: any
  ): Promise<any> {
    try {
      logger.info('Calling SecretSigner on workload', {
        workloadUrl,
        endpoint,
      });

      // SecretSigner endpoints would be on the workload URL
      const url = `${workloadUrl}/secret-signer/${endpoint}`;
      
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      logger.info('SecretSigner call successful', { endpoint });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to call SecretSigner', {
        error: error.message,
        endpoint,
      });
      throw error;
    }
  }
}

export const nillionWorkloadClient = new NillionWorkloadClient();

