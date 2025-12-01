/**
 * Zcash Client Module
 *
 * ARCHITECTURE:
 * - Zebra (port 8233): Full node - blockchain data, sync status
 * - Zallet (port 28232): Wallet - signing, keys, balances, addresses, z_sendmany
 *
 * Zebra does NOT have wallet functionality. All wallet operations go through Zallet.
 */

import * as fs from 'fs/promises';
import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import logger from './logger';

// Types
export interface ZcashAddress {
  address: string;
  type: 'transparent' | 'shielded';
  balance: number;
}

export interface Transaction {
  txid: string;
  type: string;
  address: string;
  amount: number;
  memo?: string;
  confirmations: number;
  blockheight?: number;
  timestamp?: number;
}

export interface TransactionResult {
  txid: string;
  success: boolean;
  error?: string;
}

/**
 * Base RPC client for JSON-RPC communication
 */
class RpcClient {
  private client: AxiosInstance;
  private name: string;
  private authHeader: string | null = null;

  constructor(
    name: string,
    rpcUrl: string,
    timeout: number = 30000,
    auth?: { user: string; password: string }
  ) {
    this.name = name;
    this.client = axios.create({
      baseURL: rpcUrl,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    if (auth && auth.user && auth.password) {
      this.authHeader = 'Basic ' + Buffer.from(auth.user + ':' + auth.password).toString('base64');
    }
  }

  async setAuthFromCookie(cookiePath: string): Promise<void> {
    try {
      const cookieContent = await fs.readFile(cookiePath, 'utf-8');
      const parts = cookieContent.trim().split(':');
      const username = parts[0];
      const password = parts[1];
      if (username && password) {
        this.authHeader = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
        logger.debug(this.name + ': Loaded cookie auth', { username });
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn(this.name + ': Cookie file not found', { path: cookiePath });
      } else {
        logger.error(this.name + ': Failed to read cookie', { error: error.message });
      }
    }
  }

  async call<T = any>(method: string, ...params: any[]): Promise<T> {
    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }

    try {
      logger.debug(this.name + ' RPC call', { method, params });

      const response = await this.client.post('', requestBody, { headers });

      if (response.data.error) {
        throw new Error(response.data.error.message || JSON.stringify(response.data.error));
      }

      return response.data.result as T;
    } catch (error: any) {
      if (error.response) {
        logger.error(this.name + ' RPC failed', {
          method,
          status: error.response.status,
          error: error.response.data,
        });
      } else {
        logger.error(this.name + ' RPC failed', { method, error: error.message });
      }
      throw error;
    }
  }
}

/**
 * Zcash Client - Dual RPC Architecture
 * Uses Zebra for blockchain data and Zallet for wallet operations
 */
export class ZcashClient {
  private zebra: RpcClient;
  private zallet: RpcClient;
  private lastSyncHeight: number = 0;
  private syncInterval?: NodeJS.Timeout;

  constructor() {
    this.zebra = new RpcClient('Zebra', config.zebra.rpcUrl, 30000);
    this.zallet = new RpcClient(
      'Zallet',
      config.zallet.rpcUrl,
      config.zallet.timeout,
      { user: config.zallet.rpcUser, password: config.zallet.rpcPassword }
    );
  }

  async initialize(): Promise<void> {
    try {
      await this.zebra.setAuthFromCookie(config.zebra.cookieFilePath);

      const blockchainInfo = await this.zebra.call<{
        blocks: number;
        verificationprogress: number;
      }>('getblockchaininfo');

      this.lastSyncHeight = blockchainInfo.blocks;
      const syncProgress = blockchainInfo.verificationprogress;

      if (syncProgress < 0.999) {
        logger.warn('Zebra node is still syncing', {
          progress: (syncProgress * 100).toFixed(2) + '%',
          blocks: blockchainInfo.blocks,
        });
      } else {
        logger.info('Zebra node connected and synced', { blocks: blockchainInfo.blocks });
      }

      try {
        const walletInfo = await this.zallet.call<{ walletversion?: number }>('getwalletinfo');
        logger.info('Zallet wallet connected', { version: walletInfo.walletversion || 'unknown' });
      } catch (error: any) {
        logger.warn('Zallet connection failed - wallet operations will not work', {
          error: error.message,
          hint: 'Make sure Zallet is running: zallet start',
        });
      }

      this.startBackgroundSync();
    } catch (error: any) {
      throw new Error('Failed to initialize Zcash client: ' + error.message);
    }
  }

  private startBackgroundSync(): void {
    this.syncInterval = setInterval(async () => {
      try {
        const info = await this.zebra.call<{ blocks: number }>('getblockchaininfo');
        this.lastSyncHeight = info.blocks;
      } catch {
        logger.debug('Background sync check failed');
      }
    }, 30000);
  }

  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  // BLOCKCHAIN METHODS (via Zebra)

  async getBlockHeight(): Promise<number> {
    const info = await this.zebra.call<{ blocks: number }>('getblockchaininfo');
    this.lastSyncHeight = info.blocks;
    return info.blocks;
  }

  getCurrentHeight(): number {
    return this.lastSyncHeight;
  }

  async sync(): Promise<void> {
    await this.getBlockHeight();
  }

  // WALLET METHODS (via Zallet)

  async getBalance(): Promise<{ transparent: number; shielded: number; total: number }> {
    try {
      const balance = await this.zallet.call<{
        transparent: string;
        private: string;
        total: string;
      }>('z_gettotalbalance', 1, true);

      return {
        transparent: parseFloat(balance.transparent) || 0,
        shielded: parseFloat(balance.private) || 0,
        total: parseFloat(balance.total) || 0,
      };
    } catch (error: any) {
      throw new Error('Failed to get balance: ' + error.message);
    }
  }

  async getAddresses(): Promise<ZcashAddress[]> {
    const addresses: ZcashAddress[] = [];

    try {
      // Zallet returns unified address format via listaddresses
      // Response format: [{source: "mnemonic_seed", unified: [{seedfp, account, addresses: [...]}]}]
      const result = await this.zallet.call<any[]>('listaddresses');

      if (Array.isArray(result)) {
        for (const source of result) {
          if (source.source === 'mnemonic_seed' && source.unified) {
            for (const account of source.unified) {
              for (const addrInfo of account.addresses || []) {
                // Unified addresses contain multiple receivers (orchard, sapling, p2pkh)
                addresses.push({
                  address: addrInfo.address,
                  type: 'shielded', // Unified addresses are primarily shielded
                  balance: 0,
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      logger.debug('Failed to get addresses from listaddresses', { error: error.message });
    }

    return addresses;
  }

  async getTransparentAddress(): Promise<string> {
    try {
      // In Zallet, use z_listunifiedreceivers to extract the p2pkh receiver
      const addresses = await this.getAddresses();
      if (addresses.length > 0) {
        const ua = addresses[0].address;
        const receivers = await this.zallet.call<any>('z_listunifiedreceivers', ua);
        if (receivers && receivers.p2pkh) {
          return receivers.p2pkh;
        }
      }
      throw new Error('No transparent address available');
    } catch (error: any) {
      throw new Error('Failed to get transparent address: ' + error.message);
    }
  }

  async getShieldedAddress(): Promise<string> {
    try {
      // In Zallet, use z_listunifiedreceivers to extract the sapling receiver
      const addresses = await this.getAddresses();
      if (addresses.length > 0) {
        const ua = addresses[0].address;
        const receivers = await this.zallet.call<any>('z_listunifiedreceivers', ua);
        if (receivers && receivers.sapling) {
          return receivers.sapling;
        }
        // Return the unified address if no sapling-only receiver
        return ua;
      }
      // Create new account and address if none exist
      const accounts = await this.zallet.call<any[]>('z_listaccounts');
      let accountUuid: string;
      if (!accounts || accounts.length === 0) {
        const newAccount = await this.zallet.call<{ account_uuid: string }>('z_getnewaccount');
        accountUuid = newAccount.account_uuid;
      } else {
        accountUuid = accounts[0].account_uuid;
      }
      const newAddr = await this.zallet.call<{ address: string }>('z_getaddressforaccount', accountUuid);
      return newAddr.address;
    } catch (error: any) {
      throw new Error('Failed to get shielded address: ' + error.message);
    }
  }

  async getAddressWithBalance(): Promise<string | null> {
    try {
      // Use z_listunspent to find an address that actually has funds
      const unspent = await this.zallet.call<any[]>('z_listunspent', 1);
      if (unspent && unspent.length > 0) {
        // Get the note with highest balance
        const sorted = unspent.sort((a, b) => b.value - a.value);
        const note = sorted[0];

        // The sapling address from z_listunspent is just one receiver
        // We need to find the unified address for this account to use with z_sendmany
        if (note.account_uuid) {
          const accounts = await this.zallet.call<any[]>('z_listaccounts');
          const account = accounts?.find(a => a.account_uuid === note.account_uuid);
          if (account && account.addresses && account.addresses.length > 0) {
            // Return the unified address (ua) for this account
            return account.addresses[0].ua;
          }
        }

        // Fallback to the raw address if we can't find the unified address
        return note.address;
      }
      return null;
    } catch (error: any) {
      logger.debug('Failed to get address with balance', { error: error.message });
      return null;
    }
  }

  async listTransactions(count: number = 50): Promise<Transaction[]> {
    try {
      const txList = await this.zallet.call<any[]>('listtransactions', '*', count);

      return (txList || []).map((tx) => ({
        txid: tx.txid,
        type: tx.amount > 0 ? 'incoming' : 'outgoing',
        address: tx.address || '',
        amount: Math.abs(tx.amount),
        confirmations: tx.confirmations || 0,
        blockheight: tx.blockheight,
        timestamp: tx.time,
        memo: tx.memo,
      }));
    } catch (error: any) {
      throw new Error('Failed to list transactions: ' + error.message);
    }
  }

  async getNewSubmissions(lastCheckedHeight?: number): Promise<Transaction[]> {
    const allTx = await this.listTransactions(100);

    return allTx.filter((tx) => {
      const isIncoming = tx.type === 'incoming';
      const hasMemo = tx.memo && tx.memo.length > 0;
      const isConfirmed = tx.confirmations >= 1;
      const isNew = !lastCheckedHeight || (tx.blockheight && tx.blockheight > lastCheckedHeight);

      return isIncoming && hasMemo && isConfirmed && isNew;
    });
  }

  async send(toAddress: string, amount: number, memo?: string): Promise<TransactionResult> {
    try {
      // Zallet uses z_sendmany for ALL transactions (shielded and transparent)
      // Get the source address - must be an address that actually has funds
      let fromAddress = await this.getAddressWithBalance();
      if (!fromAddress) {
        // Fallback to default shielded address if no balance found
        fromAddress = await this.getShieldedAddress();
      }

      // Build recipient - memo only for shielded destinations
      const isShieldedDest = toAddress.startsWith('z') || toAddress.startsWith('u');
      const recipients = [{
        address: toAddress,
        amount,
        // Only include memo for shielded recipients (t-addresses can't have memos)
        ...(isShieldedDest && memo ? { memo: Buffer.from(memo, 'utf8').toString('hex') } : {}),
      }];

      logger.info('Sending via z_sendmany', {
        from: fromAddress.substring(0, 20) + '...',
        to: toAddress.substring(0, 20) + '...',
        amount,
        hasMemo: !!memo && isShieldedDest,
      });

      // z_sendmany parameters: fromAddress, recipients, minconf, fee, privacyPolicy
      // For transparent recipients, we need 'AllowRevealedRecipients' privacy policy
      const privacyPolicy = isShieldedDest ? 'FullPrivacy' : 'AllowRevealedRecipients';
      const opid = await this.zallet.call<string>(
        'z_sendmany',
        fromAddress,
        recipients,
        1,           // minconf
        null,        // fee (null = default)
        privacyPolicy
      );

      let attempts = 0;
      while (attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await this.zallet.call<any[]>('z_getoperationstatus', [opid]);

        if (!status || status.length === 0) {
          attempts++;
          continue;
        }

        const op = status[0];
        if (op.status === 'success' && op.result) {
          logger.info('Transaction sent successfully', { txid: op.result.txid, to: toAddress });
          return { txid: op.result.txid, success: true };
        } else if (op.status === 'failed') {
          throw new Error(op.error?.message || 'Transaction failed');
        }

        attempts++;
      }

      throw new Error('Transaction timeout');
    } catch (error: any) {
      logger.error('Transaction failed', { error: error.message, to: toAddress });
      return { txid: '', success: false, error: error.message };
    }
  }

  async sendTransaction(to: string, amount: number, memo?: string): Promise<string> {
    const result = await this.send(to, amount, memo);
    if (!result.success) {
      throw new Error(result.error || 'Transaction failed');
    }
    return result.txid;
  }

  async getNewTransactions(lastHeight: number): Promise<Transaction[]> {
    return this.getNewSubmissions(lastHeight);
  }

  validateAddress(address: string): { valid: boolean; type?: 'transparent' | 'shielded' } {
    if (address.match(/^t[m1][a-zA-Z0-9]{33}$/)) {
      return { valid: true, type: 'transparent' };
    }
    if (address.match(/^zs[a-z0-9]{76}$/)) {
      return { valid: true, type: 'shielded' };
    }
    if (address.startsWith('u1')) {
      return { valid: true, type: 'shielded' };
    }
    return { valid: false };
  }

  async cleanup(): Promise<void> {
    this.stopBackgroundSync();
  }

  // Direct RPC calls for advanced queries (via Zebra)
  async execCommandJSON<T = any>(method: string, ...params: any[]): Promise<T> {
    return this.zebra.call<T>(method, ...params);
  }

  // Direct Zallet RPC calls
  async execZalletCommand<T = any>(method: string, ...params: any[]): Promise<T> {
    return this.zallet.call<T>(method, ...params);
  }
}

export const zcashClient = new ZcashClient();

export function createZcashClient(): ZcashClient {
  return new ZcashClient();
}
