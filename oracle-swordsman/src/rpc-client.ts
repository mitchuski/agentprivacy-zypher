/**
 * Zebra RPC Client
 * 
 * Connects to a Zebra/zcashd node for blockchain operations.
 * Used by both the oracle (read-only) and signer (full access).
 */

import fetch from 'node-fetch';

interface RpcConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

interface RpcResponse<T = any> {
  result: T;
  error: { code: number; message: string } | null;
  id: string;
}

interface ShieldedNote {
  txid: string;
  amount: number;
  memo: string;
  memoHex: string;
  confirmations: number;
  blockheight: number;
  blocktime: number;
  outindex: number;
  change: boolean;
}

interface TransactionResult {
  txid: string;
  status: 'success' | 'pending' | 'failed';
}

export class ZebraRpcClient {
  private config: RpcConfig;
  private requestId: number = 0;

  constructor(config: RpcConfig) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 8232,
      username: config.username,
      password: config.password
    };
  }

  /**
   * Make a JSON-RPC call to the Zebra node
   */
  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const url = `http://${this.config.host}:${this.config.port}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const body = JSON.stringify({
      jsonrpc: '1.0',
      id: `zebra-${++this.requestId}`,
      method,
      params
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    const data = await response.json() as RpcResponse<T>;

    if (data.error) {
      throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
    }

    return data.result;
  }

  // ============================================
  // VIEWING KEY OPERATIONS (Oracle/Mage)
  // ============================================

  /**
   * Import a viewing key to monitor a shielded address
   * The viewing key allows reading transactions but NOT spending
   */
  async importViewingKey(viewingKey: string, rescan: 'yes' | 'no' | 'whenkeyisnew' = 'whenkeyisnew', startHeight?: number): Promise<{ address_type: string; address: string }> {
    const params: any[] = [viewingKey, rescan];
    if (startHeight !== undefined) {
      params.push(startHeight);
    }
    return this.call('z_importviewingkey', params);
  }

  /**
   * List all transactions received by a shielded address
   * Requires viewing key to be imported
   */
  async listReceivedByAddress(address: string, minConfirmations: number = 1): Promise<ShieldedNote[]> {
    const result = await this.call<any[]>('z_listreceivedbyaddress', [address, minConfirmations]);
    
    return result.map(note => ({
      txid: note.txid,
      amount: note.amount,
      memo: this.hexToMemo(note.memo),
      memoHex: note.memo,
      confirmations: note.confirmations || 0,
      blockheight: note.blockheight || 0,
      blocktime: note.blocktime || 0,
      outindex: note.outindex,
      change: note.change || false
    }));
  }

  /**
   * Get balance for a shielded address (viewing key required)
   */
  async getBalance(address: string, minConfirmations: number = 1): Promise<number> {
    return this.call('z_getbalance', [address, minConfirmations]);
  }

  /**
   * View detailed transaction information
   */
  async viewTransaction(txid: string): Promise<any> {
    return this.call('z_viewtransaction', [txid]);
  }

  // ============================================
  // SIGNING KEY OPERATIONS (Signer/Swordsman)
  // ============================================

  /**
   * Import a spending key (full control)
   */
  async importKey(spendingKey: string, rescan: 'yes' | 'no' | 'whenkeyisnew' = 'whenkeyisnew', startHeight?: number): Promise<{ type: string; address: string }> {
    const params: any[] = [spendingKey, rescan];
    if (startHeight !== undefined) {
      params.push(startHeight);
    }
    return this.call('z_importkey', params);
  }

  /**
   * Send from shielded address with memo field
   * Used for the golden split operation
   */
  async sendMany(fromAddress: string, recipients: Array<{ address: string; amount: number; memo?: string }>): Promise<string> {
    const formattedRecipients = recipients.map(r => {
      const recipient: any = {
        address: r.address,
        amount: r.amount
      };
      if (r.memo) {
        recipient.memo = this.memoToHex(r.memo);
      }
      return recipient;
    });

    // Returns operation ID, need to poll for result
    const opid = await this.call<string>('z_sendmany', [fromAddress, formattedRecipients]);
    return opid;
  }

  /**
   * Get operation status/result
   */
  async getOperationResult(opids: string[]): Promise<any[]> {
    return this.call('z_getoperationresult', [opids]);
  }

  /**
   * Wait for operation to complete
   */
  async waitForOperation(opid: string, timeoutMs: number = 300000): Promise<TransactionResult> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const results = await this.getOperationResult([opid]);
      
      if (results.length > 0) {
        const result = results[0];
        if (result.status === 'success') {
          return { txid: result.result.txid, status: 'success' };
        } else if (result.status === 'failed') {
          throw new Error(`Operation failed: ${result.error?.message || 'Unknown error'}`);
        }
      }

      // Poll every 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Operation timed out');
  }

  // ============================================
  // TRANSPARENT ADDRESS OPERATIONS
  // ============================================

  /**
   * Get a new transparent address for receiving the 61.8% split
   */
  async getNewTransparentAddress(): Promise<string> {
    return this.call('getnewaddress');
  }

  /**
   * Create raw transaction with OP_RETURN data
   * Used for inscriptions on the transparent portion
   */
  async createRawTransaction(inputs: Array<{ txid: string; vout: number }>, outputs: Record<string, number | string>): Promise<string> {
    return this.call('createrawtransaction', [inputs, outputs]);
  }

  /**
   * Sign a raw transaction
   */
  async signRawTransaction(hexString: string): Promise<{ hex: string; complete: boolean }> {
    return this.call('signrawtransaction', [hexString]);
  }

  /**
   * Send a raw transaction
   */
  async sendRawTransaction(hexString: string): Promise<string> {
    return this.call('sendrawtransaction', [hexString]);
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Get blockchain info
   */
  async getBlockchainInfo(): Promise<any> {
    return this.call('getblockchaininfo');
  }

  /**
   * Get current block height
   */
  async getBlockCount(): Promise<number> {
    return this.call('getblockcount');
  }

  /**
   * Validate a Zcash address
   */
  async validateAddress(address: string): Promise<{ isvalid: boolean; address?: string; type?: string }> {
    // Use z_validateaddress for shielded, validateaddress for transparent
    if (address.startsWith('zs') || address.startsWith('zc') || address.startsWith('u')) {
      return this.call('z_validateaddress', [address]);
    }
    return this.call('validateaddress', [address]);
  }

  /**
   * Export viewing key for an address (requires spending key)
   */
  async exportViewingKey(address: string): Promise<string> {
    return this.call('z_exportviewingkey', [address]);
  }

  // ============================================
  // MEMO UTILITIES
  // ============================================

  /**
   * Convert hex memo to UTF-8 string
   */
  private hexToMemo(hex: string): string {
    if (!hex || hex === 'f600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000') {
      return '';
    }
    
    try {
      // Remove trailing zeros and convert
      const trimmed = hex.replace(/0+$/, '');
      if (trimmed.length === 0) return '';
      
      const bytes = Buffer.from(trimmed, 'hex');
      return bytes.toString('utf8').replace(/\0/g, '');
    } catch {
      return '';
    }
  }

  /**
   * Convert UTF-8 string to hex memo (512 bytes max, zero-padded)
   */
  private memoToHex(memo: string): string {
    const bytes = Buffer.from(memo, 'utf8');
    if (bytes.length > 512) {
      throw new Error('Memo exceeds 512 byte limit');
    }
    
    // Pad to 512 bytes
    const padded = Buffer.alloc(512, 0);
    bytes.copy(padded);
    
    return padded.toString('hex');
  }
}

// Export singleton factory
export function createZebraClient(config?: Partial<RpcConfig>): ZebraRpcClient {
  return new ZebraRpcClient({
    host: process.env.ZEBRA_HOST || config?.host || 'localhost',
    port: parseInt(process.env.ZEBRA_PORT || '') || config?.port || 8232,
    username: process.env.ZEBRA_USER || config?.username,
    password: process.env.ZEBRA_PASS || config?.password
  });
}
