/**
 * lightwalletd gRPC Client
 * Connects to lightwalletd's gRPC interface to scan blocks and detect transactions
 * 
 * This bypasses zecwallet-cli and directly uses lightwalletd for viewing key operations
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import logger from './logger';

// Load proto files - adjust path based on workspace structure
// Workspace: C:\Users\mitch\agentprivacy_zypher
// Backend: oracle-swordsman/
// lightwalletd: ../lightwalletd/
const getProtoPath = (filename: string) => {
  const possiblePaths = [
    path.join(__dirname, '../../lightwalletd/lightwallet-protocol/walletrpc', filename),
    path.join(process.cwd(), '../lightwalletd/lightwallet-protocol/walletrpc', filename),
    path.join(process.cwd(), 'lightwalletd/lightwallet-protocol/walletrpc', filename),
  ];
  
  for (const protoPath of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(protoPath)) {
        return protoPath;
      }
    } catch {
      // Continue to next path
    }
  }
  
  // Default fallback
  return path.join(__dirname, '../../lightwalletd/lightwallet-protocol/walletrpc', filename);
};

const PROTO_PATH = getProtoPath('service.proto');
const COMPACT_PROTO_PATH = getProtoPath('compact_formats.proto');

export interface LightwalletdConfig {
  server: string; // e.g., "127.0.0.1:9067"
  insecure?: boolean; // Use insecure credentials (for local testing)
}

export interface CompactBlock {
  height: number;
  hash: Buffer;
  prevHash: Buffer;
  time: number;
  vtx: CompactTx[];
}

export interface CompactTx {
  index: number;
  hash: Buffer;
  fee: number;
  spends: CompactSaplingSpend[];
  outputs: CompactSaplingOutput[];
}

export interface CompactSaplingSpend {
  nf: Buffer; // nullifier
}

export interface CompactSaplingOutput {
  cmu: Buffer; // note commitment u-coordinate
  ephemeralKey: Buffer;
  ciphertext: Buffer; // first 52 bytes
}

export class LightwalletdClient {
  private client: any;
  private config: LightwalletdConfig;

  constructor(config: LightwalletdConfig) {
    this.config = config;
  }

  /**
   * Initialize gRPC client connection
   */
  async connect(): Promise<void> {
    try {
      // Load proto definition
      // Try to find proto file
      const fs = require('fs');
      let actualProtoPath = PROTO_PATH;
      const possiblePaths = [
        path.join(__dirname, '../../lightwalletd/lightwallet-protocol/walletrpc/service.proto'),
        path.join(process.cwd(), '../lightwalletd/lightwallet-protocol/walletrpc/service.proto'),
        path.join(process.cwd(), 'lightwalletd/lightwallet-protocol/walletrpc/service.proto'),
      ];
      
      for (const protoPath of possiblePaths) {
        if (fs.existsSync(protoPath)) {
          actualProtoPath = protoPath;
          break;
        }
      }

      const includeDirs = [
        path.dirname(actualProtoPath),
        path.join(path.dirname(actualProtoPath), '../..'),
      ];

      const packageDefinition = protoLoader.loadSync(actualProtoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: includeDirs
      });

      const proto = grpc.loadPackageDefinition(packageDefinition) as any;
      const walletrpc = proto.cash.z.wallet.sdk.rpc;

      // Create client
      const credentials = this.config.insecure 
        ? grpc.credentials.createInsecure()
        : grpc.credentials.createSsl();

      this.client = new walletrpc.CompactTxStreamer(
        this.config.server,
        credentials
      );

      logger.info('Connected to lightwalletd gRPC', { server: this.config.server });
    } catch (error: any) {
      logger.error('Failed to connect to lightwalletd', { error: error.message });
      throw error;
    }
  }

  /**
   * Get latest block height
   */
  async getLatestBlock(): Promise<number> {
    return new Promise((resolve, reject) => {
      const chainSpec = {};
      
      this.client.GetLatestBlock(chainSpec, (error: any, response: any) => {
        if (error) {
          reject(new Error(`Failed to get latest block: ${error.message}`));
          return;
        }
        // Handle both Long objects and plain numbers
        const height = typeof response.height === 'object' && response.height.toNumber 
          ? response.height.toNumber() 
          : Number(response.height);
        resolve(height);
      });
    });
  }

  /**
   * Get block range (compact blocks)
   */
  async getBlockRange(startHeight: number, endHeight: number): Promise<CompactBlock[]> {
    return new Promise((resolve, reject) => {
      const blocks: CompactBlock[] = [];
      
      const request = {
        start: { height: startHeight },
        end: { height: endHeight }
      };

      const stream = this.client.GetBlockRange(request);

      stream.on('data', (block: any) => {
        const getNumber = (val: any): number => {
          return typeof val === 'object' && val.toNumber ? val.toNumber() : Number(val);
        };
        
        blocks.push({
          height: getNumber(block.height),
          hash: Buffer.from(block.hash),
          prevHash: Buffer.from(block.prevHash),
          time: getNumber(block.time),
          vtx: (block.vtx || []).map((tx: any) => ({
            index: getNumber(tx.index),
            hash: Buffer.from(tx.hash),
            fee: getNumber(tx.fee || 0),
            spends: tx.spends || [],
            outputs: tx.outputs || []
          }))
        });
      });

      stream.on('end', () => {
        resolve(blocks);
      });

      stream.on('error', (error: any) => {
        reject(new Error(`Block range stream error: ${error.message}`));
      });
    });
  }

  /**
   * Get transactions for a transparent address
   */
  async getTaddressTransactions(address: string, startHeight: number, endHeight: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transactions: any[] = [];
      
      const request = {
        address: address,
        range: {
          start: { height: startHeight },
          end: { height: endHeight }
        }
      };

      const stream = this.client.GetTaddressTransactions(request);

      stream.on('data', (tx: any) => {
        transactions.push(tx);
      });

      stream.on('end', () => {
        resolve(transactions);
      });

      stream.on('error', (error: any) => {
        reject(new Error(`Taddress transactions stream error: ${error.message}`));
      });
    });
  }

  /**
   * Get full transaction by hash
   */
  async getTransaction(txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Convert hex txid to bytes (little-endian)
      const txidBuffer = Buffer.from(txid, 'hex').reverse();
      
      const request = {
        hash: txidBuffer
      };

      this.client.GetTransaction(request, (error: any, response: any) => {
        if (error) {
          reject(new Error(`Failed to get transaction: ${error.message}`));
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * Get lightwalletd info
   */
  async getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetLightdInfo({}, (error: any, response: any) => {
        if (error) {
          reject(new Error(`Failed to get info: ${error.message}`));
          return;
        }
        const getNumber = (val: any): number => {
          return typeof val === 'object' && val.toNumber ? val.toNumber() : Number(val);
        };
        
        resolve({
          version: response.version,
          chainName: response.chainName,
          blockHeight: getNumber(response.blockHeight),
          saplingActivationHeight: getNumber(response.saplingActivationHeight)
        });
      });
    });
  }
}

