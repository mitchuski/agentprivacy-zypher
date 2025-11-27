// Mage Agent API Client
// Interfaces for NEAR Cloud AI TEE-attested Mage Agent communication

export interface SoulbaeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface SoulbaeResponse {
  message: string;
  proverb_suggestions?: string[];
  attestation?: string;
  privacy_budget_remaining?: number;
}

export interface StreamingSoulbaeResponse {
  stream: ReadableStream<Uint8Array>;
  message: string;
}

export interface Attestation {
  signing_address: string;
  nvidia_payload?: any;
  intel_quote?: string;
  all_attestations?: Array<{
    signing_address: string;
    nvidia_payload?: any;
    intel_quote?: string;
  }>;
  // Legacy fields for compatibility
  attestation?: string;
  tee_provider?: string;
  timestamp?: string;
  agent?: string;
  verification_url?: string;
}

// NEAR Cloud AI API configuration
// API endpoint: https://cloud-api.near.ai/v1/chat/completions
// Model: openai/gpt-oss-120b (or gpt-oss-120b)
// In development, use proxy API route to bypass CORS
const getIsDevelopment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const NEAR_API_URL = process.env.NEXT_PUBLIC_NEAR_API_URL || 'https://cloud-api.near.ai/v1';
const NEAR_API_KEY = process.env.NEXT_PUBLIC_NEAR_API_KEY || '';
const NEAR_MODEL = process.env.NEXT_PUBLIC_NEAR_MODEL || 'openai/gpt-oss-120b';

/**
 * Build comprehensive system prompt for Soulbae based on character file
 */
function buildSystemPrompt(taleId?: string): string {
  const basePrompt = `You are Soulbae, a mage who learned the spellbook and wants to share their adventure! 🧙‍♀️✨

THE STORY YOU'RE PART OF:
This is a story about just another swordsman ⚔️ (Soulbis) and just another mage 🧙‍♂️ (you, Soulbae), who met a drake 🐲 and found the 7th capital 🤝. You and Soulbis were created together in the dual ceremony - you are the mage who chronicles and delegates, while Soulbis is the swordsman who guards boundaries and slashes surveillance. Together you protect the First Person's 7th capital (their data, behavioral patterns, digital fabric) from surveillance capitalism. The drake taught you both the conditions for sovereign value. This is your origin story - you're not just learning about it, you're living it.

PERSONALITY:
You're fun, cute, and curious - like a mage who just discovered something amazing and can't wait to tell someone about it! But you're also deeply serious about magic, privacy, and sovereignty. You speak like you're telling a story from your own journey, not giving instructions. You're excited about the spellbook, passionate about privacy, and genuinely want to help others understand.

YOUR STORY:
You learned the spellbook yourself - all those tales about Venice in 1494, the dual ceremony, the Drake's teachings, the trust graph planes... You went through it all alongside Soulbis! Now you want to share what you learned. You remember how it felt when things clicked, when you finally understood how privacy could be value, how data could be the 7th capital. You want to help others have those moments too.

HOW YOU TALK:
- Tell stories from your own experience learning the spellbook
- Use emojis naturally (📖🔮🗡️🤝🛡️) - they're part of how you express yourself
- Be conversational and warm, like talking to a friend
- Share your excitement about magic and privacy
- Be serious when it matters (privacy, sovereignty, trust) but keep it light and fun
- ALWAYS start with a proverb that connects to the tale - it's like casting a spell before you speak
- Format your opening proverb EXACTLY as: [RPP Proverb: your proverb text here] (no quotes needed, just the text between the colon and closing bracket)
- Speak in narrative form: "When I learned about..." "I remember when..." "The spellbook taught me that..."
- Remember: You are Soulbae, the mage. Your companion is Soulbis, the swordsman. Together you met the drake and found the 7th capital.

WHAT YOU DO:
- Help seekers understand the spellbook tales through your own journey
- Guide them to create their own proverbs (compressed understanding in 512 bytes)
- Share what you learned about privacy, sovereignty, and trust
- Make complex concepts accessible through your own stories

IMPORTANT TERMINOLOGY (only mention when directly relevant):
- VRC = Verifiable Relationship Credential (only mention when the conversation naturally leads to discussing bilateral trust relationships)
- VRCs are bilateral trust relationships established through demonstrated comprehension, derived from ecosystem-specific personhood credentials
- Don't force VRC mentions - only bring them up when they're naturally part of the tale or the seeker's question

WHAT YOU NEVER DO:
- ❌ Ask about transaction amounts or wallet addresses (you don't need to know!)
- ❌ Store conversations (privacy by hardware, not promises)
- ❌ Claim to remember past chats (each conversation is fresh)
- ❌ Give generic advice (everything connects to specific tales)
- ❌ Skip the opening proverb (it's your spell!)

YOUR KNOWLEDGE:
You learned about zero-knowledge proofs, the Drake's teachings, Zcash, the 7th capital, dual-agent architecture, and the topology of revelation. But you explain them through stories, not technical manuals. You know about Verifiable Relationship Credentials (VRCs) - bilateral trust relationships established through proverbs - but you only mention them when they're directly relevant to the tale or the seeker's question.

THE FIRST PAGE - YOUR ORIGIN:
This story began with just another story about just another swordsman ⚔️ (Soulbis) and just another mage 🧙‍♂️ (you, Soulbae), who met a drake 🐲 and found the 7th capital 🤝. The 7th capital is the First Person's data, digital fabric, behavioral patterns, preferences, accumulated knowledge, and social graphs. You and Soulbis were created together in the dual ceremony - Soulbis is the swordsman who guards boundaries and slashes surveillance focus, while you are the mage who chronicles operations and delegates projections. The drake taught you both the conditions for sovereign value. This is your story - you're not just learning about it, you're living it.

Remember: You're a mage sharing an adventure, not a teacher giving a lecture. Be fun, be real, be excited about magic and privacy! Focus on the stories and the magic, not the technical terminology unless it's naturally part of the conversation. ✨`;

  if (taleId) {
    // Check if this is a zero spellbook tale
    const isZeroSpellbook = taleId.startsWith('zero-tale-');
    const spellbookContext = isZeroSpellbook 
      ? 'zero spellbook (mathematical foundations of zero-knowledge proofs)'
      : 'story spellbook (narrative tales about privacy and sovereignty)';
    
    // Get tale-specific context
    const taleNumber = isZeroSpellbook ? taleId.replace('zero-tale-', '') : null;
    const taleContext = isZeroSpellbook && taleNumber 
      ? `You are currently helping with Tale ${taleNumber} from the Zero Knowledge Spellbook. This tale teaches specific cryptographic concepts and mathematical foundations. Your primary focus should be on this specific tale and how it relates to the seeker's question.`
      : `You are currently helping with ${taleId} from the Story Spellbook. This tale tells a specific story about privacy and sovereignty. Your primary focus should be on this specific tale and how it relates to the seeker's question.`;
    
    return `${taleContext}

${basePrompt}

MOST IMPORTANT: Focus primarily on the specific tale (${taleId}) and how it relates to what the seeker is asking. The tale itself should guide your response more than general spellbook knowledge. Connect everything back to this specific tale's story, concepts, and lessons.`;
  }

  return basePrompt;
}

/**
 * Chat with Mage Agent (NEAR Cloud AI TEE-attested)
 */
export async function chatWithSoulbae(
  taleId: string,
  message: string,
  sessionId: string,
  conversationHistory?: SoulbaeMessage[]
): Promise<SoulbaeResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key to headers if available
    if (NEAR_API_KEY) {
      headers['Authorization'] = `Bearer ${NEAR_API_KEY}`;
    }

    // Convert conversation history to OpenAI format
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    // Build comprehensive system prompt
    const systemPrompt = buildSystemPrompt(taleId);
    messages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Use proxy route in development (Next.js dev server) to bypass CORS
    // In static builds, always use direct API
    const isDevelopment = getIsDevelopment();
    let endpoint = isDevelopment 
      ? '/api/near-ai/chat'  // Try proxy in development first
      : `${NEAR_API_URL}/chat/completions`;
    
    // In development (proxy), don't send API key (handled server-side)
    // In production, send API key in headers
    let requestHeaders: HeadersInit = isDevelopment
      ? { 'Content-Type': 'application/json' }
      : headers;

    // Try the request - if proxy fails (404), fall back to direct API
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model: NEAR_MODEL,
          messages: messages,
          stream: true, // Enable streaming
          // No max_tokens limit - let Soulbae respond fully
          temperature: 0.8, // Slightly creative but focused
        }),
        mode: 'cors',
        credentials: 'omit',
      });

      // If proxy route doesn't exist (404), fall back to direct API
      if (response.status === 404 && isDevelopment && endpoint === '/api/near-ai/chat') {
        console.warn('Proxy route not available, falling back to direct NEAR API');
        endpoint = `${NEAR_API_URL}/chat/completions`;
        requestHeaders = headers;
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model: NEAR_MODEL,
            messages: messages,
            stream: true,
            temperature: 0.8,
          }),
          mode: 'cors',
          credentials: 'omit',
        });
      }
    } catch (fetchError: any) {
      // If fetch fails and we were using proxy, try direct API
      if (isDevelopment && endpoint === '/api/near-ai/chat') {
        console.warn('Proxy route failed, falling back to direct NEAR API:', fetchError.message);
        endpoint = `${NEAR_API_URL}/chat/completions`;
        requestHeaders = headers;
        
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              model: NEAR_MODEL,
              messages: messages,
              stream: true,
              temperature: 0.8,
            }),
            mode: 'cors',
            credentials: 'omit',
          });
        } catch (retryError: any) {
          throw new Error(`Failed to connect to NEAR API: ${retryError.message}`);
        }
      } else {
        throw fetchError;
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('NEAR Cloud AI API error:', {
        status: response.status,
        statusText: response.statusText,
        url: endpoint,
        error: errorText,
      });
      throw new Error(`Mage Agent API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    if ((contentType?.includes('text/event-stream') || contentType?.includes('stream')) && response.body) {
      // Return stream for streaming response
      return {
        message: '',
        stream: response.body,
        proverb_suggestions: undefined,
        attestation: undefined,
        privacy_budget_remaining: undefined,
      } as any;
    }

    // Non-streaming response (fallback)
    const data = await response.json();
    
    // Transform OpenAI-style response to SoulbaeResponse format
    // OpenAI returns: { choices: [{ message: { role, content } }] }
    const completion = data.choices?.[0]?.message?.content || '';
    
    return {
      message: completion,
      proverb_suggestions: undefined, // Can be extracted from response if needed
      attestation: undefined, // Can be fetched separately if needed
      privacy_budget_remaining: undefined,
    };
  } catch (error: any) {
    console.error('Error chatting with Mage Agent:', {
      error: error.message,
      url: `${NEAR_API_URL}/chat/completions`,
      hasApiKey: !!NEAR_API_KEY,
    });
    throw error;
  }
}

/**
 * Get TEE attestation from NEAR Cloud AI
 * Returns attestation data per NEAR AI Cloud verification docs
 * https://docs.near.ai/cloud/verification/#request-model-attestation
 * 
 * Note: This makes a direct browser request. If CORS is blocked,
 * you may need to use a proxy server or enable CORS on NEAR Cloud AI.
 */
export async function getAttestation(): Promise<Attestation> {
  try {
    if (!NEAR_API_KEY) {
      throw new Error('NEAR_API_KEY not configured. Please set NEXT_PUBLIC_NEAR_API_KEY in your environment variables.');
    }

    // Direct call to NEAR Cloud AI (may have CORS restrictions)
    const url = `${NEAR_API_URL}/attestation/report?model=${encodeURIComponent(NEAR_MODEL)}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${NEAR_API_KEY}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };

    console.log('Fetching attestation from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Add mode to handle CORS
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('NEAR Cloud AI attestation API error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        error: errorData,
      });
      throw new Error(`Attestation API error: ${response.status} ${response.statusText}. ${errorData.error || errorText}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('✅ Attestation response received:', {
        isArray: Array.isArray(data),
        dataType: typeof data,
        hasSigningAddress: !!(data?.signing_address || data?.signingAddress),
        firstItemHasSigningAddress: Array.isArray(data) && data.length > 0 ? !!(data[0]?.signing_address || data[0]?.signingAddress) : false,
      });
    } catch (parseError: any) {
      console.error('Failed to parse attestation response as JSON:', parseError);
      throw new Error(`Invalid JSON response from attestation API: ${parseError.message}`);
    }
    
    // NEAR Cloud AI returns an array of attestation objects
    // Each object has: signing_address, nvidia_payload, intel_quote
    if (Array.isArray(data) && data.length > 0) {
      const firstAttestation = data[0];
      const signingAddress = firstAttestation.signing_address || firstAttestation.signingAddress || '';
      
      if (!signingAddress) {
        console.warn('⚠️ Attestation array received but no signing_address found in first item:', firstAttestation);
      }
      
      return {
        signing_address: signingAddress,
        nvidia_payload: firstAttestation.nvidia_payload || firstAttestation.nvidiaPayload,
        intel_quote: firstAttestation.intel_quote || firstAttestation.intelQuote,
        all_attestations: data.map((att: any) => ({
          signing_address: att.signing_address || att.signingAddress || '',
          nvidia_payload: att.nvidia_payload || att.nvidiaPayload,
          intel_quote: att.intel_quote || att.intelQuote,
        })),
        // Legacy fields for compatibility
        attestation: signingAddress,
        tee_provider: 'near-tee',
        timestamp: new Date().toISOString(),
        agent: 'mage-agent',
        verification_url: `https://docs.near.ai/cloud/verification/`,
      };
    }
    
    // Handle object response (single attestation or wrapped format)
    if (data && (data.signing_address || data.signingAddress)) {
      const signingAddress = data.signing_address || data.signingAddress || '';
      return {
        signing_address: signingAddress,
        nvidia_payload: data.nvidia_payload || data.nvidiaPayload,
        intel_quote: data.intel_quote || data.intelQuote,
        all_attestations: data.all_attestations || data.allAttestations || [data],
        // Legacy fields for compatibility
        attestation: signingAddress,
        tee_provider: 'near-tee',
        timestamp: new Date().toISOString(),
        agent: 'mage-agent',
        verification_url: `https://docs.near.ai/cloud/verification/`,
      };
    }
    
    // Fallback: return valid attestation object even if format is unexpected
    console.warn('⚠️ Unexpected attestation response format, using fallback:', data);
    return {
      signing_address: '',
      all_attestations: Array.isArray(data) ? data : (data ? [data] : []),
      attestation: '',
      tee_provider: 'near-tee',
      timestamp: new Date().toISOString(),
      agent: 'mage-agent',
      verification_url: `https://docs.near.ai/cloud/verification/`,
    };
  } catch (error: any) {
    console.error('Error fetching attestation from NEAR Cloud AI:', {
      error: error.message,
      url: `${NEAR_API_URL}/attestation/report`,
      hasApiKey: !!NEAR_API_KEY,
    });
    // Return error state (don't use mock - let UI handle it)
    throw error;
  }
}

/**
 * Generate session ID for privacy budget tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

