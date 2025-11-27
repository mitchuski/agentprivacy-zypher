/**
 * Semantic Proverb Matcher
 * 
 * Uses AI to perform semantic matching between submitted proverbs
 * and canonical versions from the spellbook.
 * 
 * This is NOT exact string matching - we're testing comprehension,
 * not memorization. The matcher evaluates whether the submitted
 * proverb captures the essence and meaning of the canonical version.
 */

interface MatchResult {
  actId: string;
  canonical: string;
  confidence: number;
}

interface ComparisonResult {
  confidence: number;
  reasoning: string;
}

export class ProverbMatcher {
  private embeddingCache: Map<string, number[]> = new Map();

  /**
   * Compare submitted proverb against canonical version
   * Returns confidence score between 0 and 1
   */
  async compare(submitted: string, canonical: string): Promise<number> {
    // Normalize both texts
    const normalizedSubmitted = this.normalize(submitted);
    const normalizedCanonical = this.normalize(canonical);

    // Quick exact match check
    if (normalizedSubmitted === normalizedCanonical) {
      return 1.0;
    }

    // Multi-factor comparison
    const scores = await Promise.all([
      this.semanticSimilarity(submitted, canonical),
      this.keyConceptOverlap(submitted, canonical),
      this.structuralSimilarity(submitted, canonical),
      this.sentimentAlignment(submitted, canonical)
    ]);

    // Weighted combination
    // Semantic similarity is most important (understanding)
    // Key concepts ensure the core message is present
    // Structure and sentiment are secondary
    const weights = [0.5, 0.3, 0.1, 0.1];
    const weightedScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0);

    return Math.min(1, Math.max(0, weightedScore));
  }

  /**
   * Find the best matching act for a proverb
   * Used when the act ID is not specified in the memo
   */
  async findBestMatch(submitted: string, proverbs: Array<{ actId: string; proverb: string }>): Promise<MatchResult> {
    let bestMatch: MatchResult = {
      actId: '',
      canonical: '',
      confidence: 0
    };

    for (const { actId, proverb } of proverbs) {
      const confidence = await this.compare(submitted, proverb);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          actId,
          canonical: proverb,
          confidence
        };
      }
    }

    return bestMatch;
  }

  /**
   * Semantic similarity using embeddings
   * In production, this would use a proper embedding model
   */
  private async semanticSimilarity(text1: string, text2: string): Promise<number> {
    // Get or compute embeddings
    const emb1 = await this.getEmbedding(text1);
    const emb2 = await this.getEmbedding(text2);

    // Cosine similarity
    return this.cosineSimilarity(emb1, emb2);
  }

  /**
   * Get embedding for text
   * Uses a simple hashing approach for demo
   * In production: Use sentence-transformers or similar
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;

    // Simple word-based embedding (demo only)
    // In production, call an embedding model API
    const words = this.normalize(text).split(/\s+/);
    const embedding = new Array(256).fill(0);

    for (const word of words) {
      // Hash each word to positions in the embedding
      const hash = this.simpleHash(word);
      for (let i = 0; i < 8; i++) {
        const pos = (hash + i * 31) % 256;
        embedding[pos] += 1 / words.length;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    const normalized = embedding.map(v => v / (magnitude || 1));

    this.embeddingCache.set(text, normalized);
    return normalized;
  }

  /**
   * Key concept overlap
   * Extracts important concepts and checks overlap
   */
  private async keyConceptOverlap(text1: string, text2: string): Promise<number> {
    const concepts1 = this.extractConcepts(text1);
    const concepts2 = this.extractConcepts(text2);

    if (concepts1.size === 0 || concepts2.size === 0) {
      return 0.5; // Neutral if no concepts found
    }

    // Jaccard similarity
    const intersection = new Set([...concepts1].filter(c => concepts2.has(c)));
    const union = new Set([...concepts1, ...concepts2]);

    return intersection.size / union.size;
  }

  /**
   * Extract key concepts from text
   */
  private extractConcepts(text: string): Set<string> {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'but', 'and', 'or', 'if', 'because', 'until', 'while',
      'it', 'its', 'that', 'this', 'which', 'who', 'whom', 'what'
    ]);

    const words = this.normalize(text)
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Also extract stems
    return new Set(words.map(w => this.stem(w)));
  }

  /**
   * Simple stemmer
   */
  private stem(word: string): string {
    // Very basic Porter-like stemming
    return word
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/ly$/, '')
      .replace(/ness$/, '')
      .replace(/ment$/, '')
      .replace(/tion$/, '')
      .replace(/sion$/, '')
      .replace(/ity$/, '')
      .replace(/s$/, '');
  }

  /**
   * Structural similarity
   * Compares sentence structure patterns
   */
  private async structuralSimilarity(text1: string, text2: string): Promise<number> {
    // Compare sentence length ratio
    const len1 = text1.length;
    const len2 = text2.length;
    const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);

    // Compare word count ratio
    const words1 = text1.split(/\s+/).length;
    const words2 = text2.split(/\s+/).length;
    const wordRatio = Math.min(words1, words2) / Math.max(words1, words2);

    // Check for similar structural patterns
    const pattern1 = this.getStructuralPattern(text1);
    const pattern2 = this.getStructuralPattern(text2);
    const patternMatch = pattern1 === pattern2 ? 1 : 0.5;

    return (lengthRatio + wordRatio + patternMatch) / 3;
  }

  /**
   * Get structural pattern of text
   */
  private getStructuralPattern(text: string): string {
    // Identify if it's a conditional, declarative, imperative, etc.
    const normalized = text.toLowerCase();
    
    if (normalized.includes(' if ') || normalized.startsWith('if ')) {
      return 'conditional';
    }
    if (normalized.includes(' not ') || normalized.includes('cannot') || normalized.includes("n't")) {
      return 'negative';
    }
    if (normalized.endsWith('?')) {
      return 'interrogative';
    }
    if (/^[a-z]+\s/.test(normalized) && ['let', 'do', 'be', 'have', 'make', 'take'].some(v => normalized.startsWith(v))) {
      return 'imperative';
    }
    
    return 'declarative';
  }

  /**
   * Sentiment alignment
   * Checks if both texts have similar emotional tone
   */
  private async sentimentAlignment(text1: string, text2: string): Promise<number> {
    const sent1 = this.analyzeSentiment(text1);
    const sent2 = this.analyzeSentiment(text2);

    // Compare polarity and intensity
    const polarityDiff = Math.abs(sent1.polarity - sent2.polarity);
    const intensityDiff = Math.abs(sent1.intensity - sent2.intensity);

    // Convert to similarity (lower diff = higher similarity)
    const polaritySim = 1 - polarityDiff / 2; // polarity is -1 to 1, so max diff is 2
    const intensitySim = 1 - intensityDiff;

    return (polaritySim + intensitySim) / 2;
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): { polarity: number; intensity: number } {
    const positive = ['good', 'great', 'enable', 'strength', 'wisdom', 'trust', 
                     'protect', 'harmony', 'choose', 'grows', 'true', 'power',
                     'sovereign', 'own', 'freedom', 'privacy', 'safe'];
    const negative = ['bad', 'fail', 'weak', 'folly', 'steal', 'breach', 'hide',
                     'diminish', 'restrict', 'block', 'cannot', 'not', 'nothing',
                     'rent', 'ends', 'hiding'];
    const intensifiers = ['very', 'most', 'all', 'truly', 'always', 'never',
                         'must', 'only', 'cannot', 'inevitabl'];

    const words = this.normalize(text).split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let intensifierCount = 0;

    for (const word of words) {
      if (positive.some(p => word.includes(p))) positiveCount++;
      if (negative.some(n => word.includes(n))) negativeCount++;
      if (intensifiers.some(i => word.includes(i))) intensifierCount++;
    }

    const total = positiveCount + negativeCount || 1;
    const polarity = (positiveCount - negativeCount) / total;
    const intensity = Math.min(1, intensifierCount / 3);

    return { polarity, intensity };
  }

  /**
   * Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Simple hash function for demo embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * Production enhancement: Use actual ML model
 * 
 * In production, replace the demo embedding with:
 * 
 * async getEmbedding(text: string): Promise<number[]> {
 *   const response = await fetch('https://api.openai.com/v1/embeddings', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       model: 'text-embedding-ada-002',
 *       input: text
 *     })
 *   });
 *   const data = await response.json();
 *   return data.data[0].embedding;
 * }
 * 
 * Or use sentence-transformers locally in the TEE:
 * - all-MiniLM-L6-v2 for speed
 * - all-mpnet-base-v2 for quality
 */
