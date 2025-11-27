import axios from 'axios';
import { config } from './config';
import logger from './logger';

export interface SpellbookAct {
  id: string;
  act_number?: number;
  tale_id?: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  spell?: string;
  proverb?: string; // The actual proverb text to match against
}

export interface Spellbook {
  version: string;
  created_at: string;
  description: string;
  acts: SpellbookAct[];
  spellbooks?: {
    story?: {
      name: string;
      acts: SpellbookAct[];
    };
    zero?: {
      name: string;
      acts: SpellbookAct[];
    };
  };
}

export class IPFSClient {
  private gateway = config.ipfs.gateway;
  private spellbookCid = config.ipfs.spellbookCid;
  private spellbookUrl = config.ipfs.spellbookUrl;
  private cache: Spellbook | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  // Fetch spellbook from IPFS
  async fetchSpellbook(): Promise<Spellbook> {
    // Return cached version if still valid
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < this.cacheTTL) {
      logger.debug('Returning cached spellbook');
      return this.cache;
    }

    // Use direct URL if provided, otherwise construct from gateway + CID
    const url = this.spellbookUrl || `${this.gateway}/ipfs/${this.spellbookCid}`;
    
    try {
      logger.info('Fetching spellbook from IPFS', { 
        cid: this.spellbookCid,
        url 
      });
      const response = await axios.get<any>(url, {
        timeout: 30000, // Increased timeout for large spellbook
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Validate response structure
      const data = response.data;
      
      // Handle both old format (flat acts) and new format (nested spellbooks)
      let acts: SpellbookAct[] = [];
      
      if (data.spellbooks) {
        // New format: nested spellbooks (4.0.0-canonical format)
        // Story acts
        if (data.spellbooks.story?.acts) {
          acts = acts.concat(data.spellbooks.story.acts.map((act: any) => ({
            id: act.id,
            act_number: act.act_number,
            tale_id: act.tale_id,
            title: act.title,
            description: act.description,
            category: act.category,
            keywords: act.keywords || [],
            spell: act.spell,
            proverb: act.proverb, // Extract proverb for matching
          })));
        }
        
        // Zero tales (nested in parts)
        if (data.spellbooks.zero?.parts) {
          for (const part of data.spellbooks.zero.parts) {
            if (part.tales && Array.isArray(part.tales)) {
              acts = acts.concat(part.tales.map((tale: any) => ({
                id: `zero-tale-${tale.number}`,
                act_number: tale.number,
                title: tale.title,
                description: tale.spell || '', // Use spell as description for zero tales
                category: 'zero-knowledge',
                keywords: [],
                spell: tale.spell,
                proverb: tale.proverb, // Extract proverb for matching
              })));
            }
          }
        }
      } else if (data.acts && Array.isArray(data.acts)) {
        // Old format: flat acts array
        acts = data.acts;
      } else {
        throw new Error('Invalid spellbook format: missing acts array or spellbooks structure');
      }

      // Create normalized spellbook structure
      this.cache = {
        version: data.version || '1.0.0',
        created_at: data.created_at || new Date().toISOString(),
        description: data.description || 'Privacy protection principles',
        acts: acts,
        spellbooks: data.spellbooks,
      };
      
      this.cacheTimestamp = now;
      logger.info('Spellbook fetched successfully', { 
        version: this.cache.version,
        actCount: this.cache.acts.length,
        hasProverbs: this.cache.acts.filter(a => a.proverb).length
      });
      
      return this.cache;
    } catch (error: any) {
      logger.error('Failed to fetch spellbook from IPFS', { 
        error: error.message,
        cid: this.spellbookCid,
        url 
      });
      throw new Error(`Failed to fetch spellbook: ${error.message}`);
    }
  }

  // Get specific act by ID
  async getAct(actId: string): Promise<SpellbookAct | null> {
    const spellbook = await this.fetchSpellbook();
    const act = spellbook.acts.find(act => act.id === actId);
    return act || null;
  }

  // Search acts by keyword
  async searchActs(keyword: string): Promise<SpellbookAct[]> {
    const spellbook = await this.fetchSpellbook();
    const lowerKeyword = keyword.toLowerCase();
    
    return spellbook.acts.filter(act =>
      act.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
      act.title.toLowerCase().includes(lowerKeyword) ||
      act.description.toLowerCase().includes(lowerKeyword)
    );
  }

  // Clear cache (useful for testing or forced refresh)
  clearCache(): void {
    logger.info('Clearing IPFS cache');
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  // Get cache status
  getCacheStatus(): { cached: boolean; age: number; ttl: number } {
    const now = Date.now();
    return {
      cached: this.cache !== null,
      age: this.cache ? now - this.cacheTimestamp : 0,
      ttl: this.cacheTTL,
    };
  }
}

export const ipfsClient = new IPFSClient();

