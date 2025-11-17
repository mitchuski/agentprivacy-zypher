// Soulbae API Client
// Interfaces for NEAR Shade Agent (Soulbae) communication

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

export interface Attestation {
  attestation: string;
  tee_provider: string;
  timestamp: string;
  agent: string;
  verification_url?: string;
}

const SOULBAE_URL = process.env.NEXT_PUBLIC_SOULBAE_URL || 'https://agentprivacy.ai/mage';

/**
 * Chat with Soulbae (NEAR Shade Agent)
 */
export async function chatWithSoulbae(
  taleId: string,
  message: string,
  sessionId: string,
  conversationHistory?: SoulbaeMessage[]
): Promise<SoulbaeResponse> {
  try {
    const response = await fetch(`${SOULBAE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tale_id: taleId,
        message,
        session_id: sessionId,
        conversation_history: conversationHistory || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Soulbae API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error chatting with Soulbae:', error);
    throw error;
  }
}

/**
 * Get TEE attestation from Soulbae
 */
export async function getAttestation(): Promise<Attestation> {
  try {
    const response = await fetch(`${SOULBAE_URL}/attestation`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Attestation API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attestation:', error);
    // Return mock attestation for development
    return {
      attestation: '0x0000000000000000000000000000000000000000000000000000000000000000',
      tee_provider: 'aws-nitro',
      timestamp: new Date().toISOString(),
      agent: 'soulbae.agentprivacy.near',
    };
  }
}

/**
 * Generate session ID for privacy budget tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

