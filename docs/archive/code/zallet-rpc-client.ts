/**
 * Zallet RPC Client
 * Handles wallet operations via Zallet JSON-RPC (port 28232)
 * Zallet provides wallet methods (z_getbalance, z_sendmany, etc.)
 */

import axios from 'axios';
import { config } from './config';
import logger from './logger';

export class ZalletRpcClient {
  private rpcUrl: string;
  private rpcUser: string;
  private rpcPassword: string;
  private timeout: number;

  constructor() {
    this.rpcUrl = config.zallet.rpcUrl;
    this.rpcUser = config.zallet.rpcUser;
    this.rpcPassword = config.zallet.rpcPassword;
    this.timeout = config.zallet.timeout;
  }

  /**
   * Execute a Zallet JSON-RPC command
   */
  private async execCommand(rpcMethod: string, ...params: any[]): Promise<any> {
    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: rpcMethod,
      params: params.length === 1 && typeof params[0] === 'string' 
        ? JSON.parse(params[0]) // Handle stringified params
        : params
    };

    const auth = Buffer.from(`${this.rpcUser}:${this.rpcPassword}`).toString('base64');

    try {
      logger.debug('Executing Zallet RPC command', { method: rpcMethod, params, url: this.rpcUrl });
      
      const response = await axios.post(this.rpcUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        timeout: this.timeout,
        validateStatus: () => true // Don't throw on HTTP errors
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      return result.result;
    } catch (error: any) {
      if (error.response) {
        logger.error('Zallet RPC failed', { 
          error: error.response.data || error.message, 
          method: rpcMethod,
          status: error.response.status
        });
        throw new Error(`Failed to execute Zallet RPC command: ${error.response.data?.error?.message || error.message}`);
      } else {
        logger.error('Zallet RPC failed', { error: error.message, method: rpcMethod });
        throw new Error(`Failed to execute Zallet RPC command: ${error.message}`);
      }
    }
  }

  /**
   * Get total balance (transparent + shielded)
   */
  async getTotalBalance(): Promise<{ transparent: number; private: number; total: number }> {
    return await this.execCommand('z_gettotalbalance');
  }

  /**
   * Get balance for a specific shielded address
   */
  async getBalance(address: string): Promise<number> {
    return await this.execCommand('z_getbalance', address) || 0;
  }

  /**
   * List all shielded addresses
   */
  async listAddresses(): Promise<string[]> {
    return await this.execCommand('z_listaddresses') || [];
  }

  /**
   * Get new shielded address
   */
  async getNewAddress(type: 'sapling' | 'orchard' = 'sapling'): Promise<string> {
    return await this.execCommand('z_getnewaddress', type);
  }

  /**
   * Get new transparent address
   */
  async getNewTransparentAddress(): Promise<string> {
    return await this.execCommand('getnewaddress');
  }

  /**
   * List transparent addresses
   */
  async listTransparentAddresses(): Promise<string[]> {
    // Zallet may use different method - try listaddresses or getaddressesbyaccount
    try {
      return await this.execCommand('listaddresses') || [];
    } catch {
      try {
        return await this.execCommand('getaddressesbyaccount', '') || [];
      } catch {
        return [];
      }
    }
  }

  /**
   * Send transaction to shielded address
   */
  async sendMany(
    fromAddress: string,
    recipients: Array<{ address: string; amount: number; memo?: string }>
  ): Promise<string> {
    // z_sendmany expects recipients as array of objects
    const opid = await this.execCommand('z_sendmany', fromAddress, recipients);
    
    // Wait for operation to complete
    return await this.waitForOperation(opid);
  }

  /**
   * Send to transparent address
   */
  async sendToAddress(address: string, amount: number): Promise<string> {
    return await this.execCommand('sendtoaddress', address, amount);
  }

  /**
   * List transactions
   */
  async listTransactions(count: number = 50): Promise<any[]> {
    return await this.execCommand('listtransactions', '*', count) || [];
  }

  /**
   * Get operation status
   */
  async getOperationStatus(opid: string): Promise<any> {
    const status = await this.execCommand('z_getoperationstatus', [opid]);
    return Array.isArray(status) ? status[0] : status;
  }

  /**
   * Wait for operation to complete and return txid
   */
  private async waitForOperation(opid: string, maxAttempts: number = 30): Promise<string> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const status = await this.getOperationStatus(opid);
      
      if (status.status === 'success') {
        return status.result?.txid || opid;
      }
      
      if (status.status === 'failed' || status.status === 'cancelled') {
        throw new Error(`Operation failed: ${status.error?.message || 'Unknown error'}`);
      }
      
      attempts++;
    }
    
    throw new Error('Operation timeout - transaction may still be processing');
  }

  /**
   * List unspent outputs
   */
  async listUnspent(minConf: number = 0, maxConf: number = 9999999, addresses?: string[]): Promise<any[]> {
    return await this.execCommand('listunspent', minConf, maxConf, addresses || []) || [];
  }

  /**
   * Get wallet info
   */
  async getInfo(): Promise<any> {
    try {
      return await this.execCommand('getinfo');
    } catch {
      // If getinfo not available, return basic info
      return { version: 'zallet' };
    }
  }
}

/**
 * Create Zallet RPC client instance
 */
export function createZalletRpcClient(): ZalletRpcClient {
  return new ZalletRpcClient();
}

// Export singleton instance
export const zalletRpcClient = createZalletRpcClient();

