import axios from 'axios';
import { config } from './config';
import { Spellbook, SpellbookAct } from './ipfs-client';
import logger from './logger';

export interface VerificationResult {
  quality_score: number;
  matched_act: string;
  reasoning: string;
  approved: boolean;
}

export class NearVerifier {
  private chatEndpoint = config.near.chatEndpoint;
  private attestationEndpoint = config.near.attestationEndpoint;
  // Use swordsman API key (separate from mage agent)
  private apiKey = config.near.swordsmanApiKey;
  private model = config.near.model;
  private maxRetries = config.oracle.retryAttempts;
  private retryDelay = config.oracle.retryDelay;

  // Verify proverb with retry logic
  async verify(proverb: string, spellbook: Spellbook): Promise<VerificationResult> {
    // First, check for exact proverb match in spellbook
    const exactMatch = this.findExactProverbMatch(proverb, spellbook);
    if (exactMatch) {
      logger.info('Exact proverb match found in spellbook', {
        matchedAct: exactMatch.id,
        matchedProverb: exactMatch.proverb,
      });
      return {
        quality_score: 1.0,
        matched_act: exactMatch.id,
        reasoning: `Exact match found in spellbook: "${exactMatch.proverb}" from ${exactMatch.title}`,
        approved: true,
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        logger.info('Verifying proverb with NEAR Cloud AI (private inference)', { 
          attempt: attempt + 1,
          proverbLength: proverb.length,
          actCount: spellbook.acts.length,
          proverbCount: spellbook.acts.filter(a => a.proverb).length
        });

        // Build prompt for proverb verification
        const prompt = this.buildVerificationPrompt(proverb, spellbook);
        
        // Use NEAR Cloud AI chat completions API (OpenAI-compatible)
        const response = await axios.post(
          this.chatEndpoint,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert at verifying proverbs about privacy concepts. Analyze the proverb and match it to the most relevant act from the spellbook. Return a JSON object with quality_score (0-1), matched_act (act ID), reasoning (explanation), and approved (boolean).'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds
          }
        );

        // Extract response from OpenAI format
        const completion = response.data.choices?.[0]?.message?.content || '';
        
        // Parse JSON response from the model
        let result: VerificationResult;
        try {
          // Try to extract JSON from the response (might be wrapped in markdown)
          const jsonMatch = completion.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          // If parsing fails, use fallback
          logger.warn('Failed to parse AI response as JSON, using fallback', { completion });
          return this.fallbackVerification(proverb, spellbook);
        }

        // Validate response
        if (typeof result.quality_score !== 'number' || 
            result.quality_score < 0 || 
            result.quality_score > 1) {
          throw new Error('Invalid quality_score in response');
        }

        if (!result.matched_act || !result.reasoning) {
          throw new Error('Missing required fields in response');
        }

        logger.info('Proverb verified successfully', {
          quality_score: result.quality_score,
          matched_act: result.matched_act,
          approved: result.approved,
        });

        return result;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          logger.error('NEAR Cloud AI client error (no retry)', {
            status: error.response.status,
            message: error.message,
          });
          break;
        }

        logger.warn('NEAR Cloud AI verification attempt failed', {
          attempt: attempt + 1,
          error: error.message,
          willRetry: attempt < this.maxRetries - 1,
        });

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          const waitTime = Math.min(
            this.retryDelay * Math.pow(2, attempt),
            60000 // Max 60 seconds
          );
          logger.debug('Waiting before retry', { waitTime });
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed, use fallback
    logger.warn('All NEAR Cloud AI verification attempts failed, using fallback');
    return this.fallbackVerification(proverb, spellbook);
  }

  // Fallback verification (basic pattern matching)
  private fallbackVerification(proverb: string, spellbook: Spellbook): VerificationResult {
    logger.info('Using fallback verification');
    const lowerProverb = proverb.toLowerCase();
    
    // Check for key privacy concepts
    const concepts = [
      'privacy', 'separation', 'architecture', 'delegation',
      'boundary', 'sovereignty', 'protection', 'encryption',
      'isolation', 'confidentiality', 'anonymity', 'autonomy',
    ];
    
    const matchedConcepts = concepts.filter(concept =>
      lowerProverb.includes(concept)
    );
    
    // Calculate quality score based on matched concepts
    const conceptScore = Math.min(matchedConcepts.length / concepts.length, 0.7);
    
    // Try to match an act
    let matched_act = 'act-01-shield'; // default
    let bestMatchScore = 0;

    for (const act of spellbook.acts) {
      let matchScore = 0;
      
      // Check title match
      if (lowerProverb.includes(act.title.toLowerCase())) {
        matchScore += 0.3;
      }
      
      // Check keyword matches
      for (const keyword of act.keywords) {
        if (lowerProverb.includes(keyword.toLowerCase())) {
          matchScore += 0.2;
        }
      }
      
      // Check description match
      const descWords = act.description.toLowerCase().split(/\s+/);
      for (const word of descWords) {
        if (word.length > 4 && lowerProverb.includes(word)) {
          matchScore += 0.1;
        }
      }
      
      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        matched_act = act.id;
      }
    }

    // Combine concept score with act match score
    const quality_score = Math.min(conceptScore + (bestMatchScore * 0.3), 0.7);

    return {
      quality_score,
      matched_act,
      reasoning: 'Fallback verification (AI service unavailable). Basic pattern matching used. Matched concepts: ' + matchedConcepts.join(', '),
      approved: quality_score >= 0.5,
    };
  }

  // Find exact proverb match in spellbook
  private findExactProverbMatch(proverb: string, spellbook: Spellbook): SpellbookAct | null {
    const normalizedProverb = proverb.trim().toLowerCase();
    
    for (const act of spellbook.acts) {
      if (act.proverb) {
        const normalizedActProverb = act.proverb.trim().toLowerCase();
        // Exact match (case-insensitive)
        if (normalizedProverb === normalizedActProverb) {
          return act;
        }
      }
    }
    
    return null;
  }

  // Build verification prompt
  private buildVerificationPrompt(proverb: string, spellbook: Spellbook): string {
    // Include acts with their proverbs for matching
    const actsWithProverbs = spellbook.acts
      .filter(act => act.proverb)
      .map(act => 
        `- ${act.id}: ${act.title}\n  Proverb: "${act.proverb}"\n  Description: ${act.description}\n  Keywords: ${act.keywords.join(', ')}`
      );
    
    const actsWithoutProverbs = spellbook.acts
      .filter(act => !act.proverb)
      .map(act => 
        `- ${act.id}: ${act.title}\n  Description: ${act.description}\n  Keywords: ${act.keywords.join(', ')}`
      );

    const actsSummary = [...actsWithProverbs, ...actsWithoutProverbs].join('\n\n');

    return `You are verifying a proverb submitted in a shielded transaction. Check if this proverb matches or is semantically similar to any proverb in the spellbook.

Submitted Proverb: "${proverb}"

Spellbook Acts and Proverbs:
${actsSummary}

Instructions:
1. First check if the submitted proverb exactly matches any spellbook proverb (exact match = quality_score 1.0)
2. If not exact, check semantic similarity to spellbook proverbs (similar meaning = quality_score 0.7-0.9)
3. If related to privacy concepts but not matching spellbook proverbs (quality_score 0.5-0.6)
4. If unrelated or low quality (quality_score < 0.5)

Return a JSON object with:
- quality_score: number (0-1) indicating how well the proverb matches the spellbook
- matched_act: string (the act ID that best matches, or "none" if no match)
- reasoning: string (explanation of the match, including which spellbook proverb it matches if any)
- approved: boolean (true if quality_score >= 0.5 and matches spellbook concepts)`;
  }

  // Get model attestation from NEAR Cloud AI
  // Returns attestation data per NEAR AI Cloud verification docs
  // https://docs.near.ai/cloud/verification/#request-model-attestation
  async getModelAttestation(): Promise<{
    signing_address: string;
    nvidia_payload?: any;
    intel_quote?: string;
    all_attestations?: Array<{
      signing_address: string;
      nvidia_payload?: any;
      intel_quote?: string;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${this.attestationEndpoint}?model=${encodeURIComponent(this.model)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Response format per NEAR AI docs: array of attestation objects
      // Each object has: signing_address, nvidia_payload, intel_quote
      const data = response.data;
      
      // Handle array response (multiple GPU nodes)
      if (Array.isArray(data) && data.length > 0) {
        const firstAttestation = data[0];
        return {
          signing_address: firstAttestation.signing_address || firstAttestation.signingAddress || '',
          nvidia_payload: firstAttestation.nvidia_payload || firstAttestation.nvidiaPayload,
          intel_quote: firstAttestation.intel_quote || firstAttestation.intelQuote,
          all_attestations: data.map((att: any) => ({
            signing_address: att.signing_address || att.signingAddress || '',
            nvidia_payload: att.nvidia_payload || att.nvidiaPayload,
            intel_quote: att.intel_quote || att.intelQuote,
          })),
        };
      }
      
      // Handle object response (single attestation or wrapped format)
      if (data.signing_address || data.signingAddress) {
        return {
          signing_address: data.signing_address || data.signingAddress || '',
          nvidia_payload: data.nvidia_payload || data.nvidiaPayload,
          intel_quote: data.intel_quote || data.intelQuote,
          all_attestations: data.all_attestations || data.allAttestations || [data],
        };
      }
      
      // Fallback: return as-is
      return {
        signing_address: '',
        all_attestations: Array.isArray(data) ? data : [data],
      };
    } catch (error: any) {
      logger.error('Failed to get model attestation', { 
        error: error.message,
        status: error.response?.status 
      });
      throw error;
    }
  }

  // Test connection to NEAR Cloud AI
  async testConnection(): Promise<boolean> {
    try {
      // First test: Get model attestation
      logger.info('Testing NEAR Cloud AI connection - getting model attestation...');
      const attestation = await this.getModelAttestation();
      logger.info('Model attestation received', {
        signingAddress: attestation.signing_address,
        hasNvidiaPayload: !!attestation.nvidia_payload,
        hasIntelQuote: !!attestation.intel_quote,
        nodeCount: attestation.all_attestations?.length || 0,
      });

      // Second test: Try a simple verification with a test proverb
      logger.info('Testing NEAR Cloud AI connection - testing chat completions...');
      const testSpellbook: Spellbook = {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        description: 'Test spellbook',
        acts: [{
          id: 'test-act',
          title: 'Test Act',
          description: 'Test description',
          category: 'test',
          keywords: ['test'],
        }],
      };

      await this.verify('Privacy requires separation.', testSpellbook);
      logger.info('NEAR Cloud AI connection test successful');
      return true;
    } catch (error: any) {
      logger.error('NEAR Cloud AI connection test failed', { error: error.message });
      return false;
    }
  }
}

export const nearVerifier = new NearVerifier();

