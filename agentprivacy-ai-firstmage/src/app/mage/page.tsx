'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithSoulbae, getAttestation, generateSessionId, type SoulbaeMessage, type Attestation } from '@/lib/soulbae';
import { streamChatCompletion } from '@/lib/stream-utils';
import { formatZcashMemo, getTaleIdFromAct } from '@/lib/zcash-memo';
import ChatMessage from '@/components/ChatMessage';
import ProverbSuggestions from '@/components/ProverbSuggestions';
import AttestationBadge from '@/components/AttestationBadge';

const MAX_QUERIES = 6; // Privacy budget per session

// Zero Knowledge Spellbook tale titles
const zeroTaleTitles: { [key: number]: string } = {
  1: "The Monastery of Hidden Knowledge",
  2: "The Three Trials of Truth",
  3: "The Silent Messenger",
  4: "The Fields of Finite Wisdom",
  5: "The Constraint Forge",
  6: "The Polynomial Riddle",
  7: "The Witness and the Instance",
  8: "The Plonkish Revolution",
  9: "The Pairing Dance",
  10: "The Commitment Ceremony",
  11: "The FRI Oracle",
  12: "The Folding Path",
  13: "The Sumcheck Riddle",
  14: "The IPA Chronicle",
  15: "The Mirror Within Mirrors",
  16: "The Cyclic Ceremony",
  17: "The Universal Setup",
  18: "The Toxic Waste Dragon",
  19: "The zkVM Kingdom",
  20: "The Cairo Scribes",
  21: "The Circom Workshops",
  22: "The zkEVM Empire",
  23: "The Private Coin of ZCash",
  24: "The Tornado's Eye",
  25: "The Rollup Realms",
  26: "The Vulnerability Codex",
  27: "The Data Availability Prophecy",
  28: "The Bridge Between Worlds",
  29: "The Intelligence Proof",
  30: "The Eternal Sovereignty",
};

function MagePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get tale ID from URL params (no default - show selection if not provided)
  const taleIdParam = searchParams.get('tale_id');
  const context = searchParams.get('context') || 'donation';
  
  // Check if a tale is actually selected
  const hasTaleSelected = taleIdParam !== null && taleIdParam !== '';

  // State
  // Generate or retrieve persistent session ID for this tale (only if tale is selected)
  const [persistentSessionId] = useState(() => {
    if (!hasTaleSelected || typeof window === 'undefined') {
      return generateSessionId();
    }
    const key = `soulbae-session-${taleIdParam}`;
    let stored = localStorage.getItem(key);
    if (!stored) {
      // Create new persistent session
      stored = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(key, stored);
    }
    return stored;
  });

  const [messages, setMessages] = useState<SoulbaeMessage[]>(() => {
    // Load chat history from localStorage on mount (using persistent session)
    if (!hasTaleSelected || typeof window === 'undefined') {
      return [];
    }
    const key = `soulbae-session-${taleIdParam}`;
    const sessionId = localStorage.getItem(key) || generateSessionId();
    const saved = localStorage.getItem(`soulbae-chat-${taleIdParam}-${sessionId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    return [];
  });

  // Load privacy budget from localStorage (persist across refreshes)
  // Initialize with MAX_QUERIES to prevent hydration mismatch, then update from localStorage
  const [privacyBudget, setPrivacyBudget] = useState(MAX_QUERIES);
  const [isClient, setIsClient] = useState(false);

  // Load from localStorage only on client side after mount
  useEffect(() => {
    setIsClient(true);
    if (!hasTaleSelected || typeof window === 'undefined') {
      return;
    }
    const key = `soulbae-session-${taleIdParam}`;
    const sessionId = localStorage.getItem(key) || generateSessionId();
    const saved = localStorage.getItem(`soulbae-budget-${taleIdParam}-${sessionId}`);
    if (saved) {
      try {
        const budget = parseInt(saved, 10);
        if (!isNaN(budget)) {
          setPrivacyBudget(budget);
        }
      } catch (e) {
        console.error('Failed to load privacy budget:', e);
      }
    }
  }, [taleIdParam, hasTaleSelected]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // NEAR Cloud AI TEE Attestation Signing Address
  const [attestation] = useState<Attestation>({
    signing_address: '0x37A3126D15a480dfE38290765D95E2c8E210222B',
    tee_provider: 'near-tee',
    timestamp: new Date().toISOString(),
    agent: 'mage-agent',
    verification_url: 'https://docs.near.ai/cloud/verification/',
  });
  const [proverbSuggestions, setProverbSuggestions] = useState<string[]>([]);
  const [selectedProverb, setSelectedProverb] = useState<string>('');
  const [proverbForMemo, setProverbForMemo] = useState<string>(''); // Dedicated field for memo generation
  const [copied, setCopied] = useState(false);
  const [learnCopied, setLearnCopied] = useState(false);
  const [detectedProverb, setDetectedProverb] = useState<string | null>(null); // Store proverb when detected

  // Extract proverb text from RPP format - match everything between [RPP Proverb: and ]
  const extractProverbText = (text: string): string | null => {
    if (!text) return null;
    
    // Pattern 1: [RPP Proverb: ...] - match everything between the colon and closing bracket
    // This handles apostrophes, quotes, and any other characters
    let match = text.match(/\[RPP\s+Proverb\s*:\s*([^\]]+)\]/i);
    if (match) {
      let proverbText = match[1].trim();
      // Remove surrounding quotes if present (but keep the text)
      proverbText = proverbText.replace(/^['"]|['"]$/g, '').trim();
      if (proverbText && proverbText.length > 0) {
        return proverbText;
      }
    }
    
    // Pattern 2: Fallback to old format [RPP] proverb: 'text' for backwards compatibility
    match = text.match(/\[RPP\]\s*proverb\s*:\s*(?:'([^']*)'|"([^"]*)")/i);
    if (match) {
      const proverbText = (match[1] || match[2])?.trim();
      if (proverbText && proverbText.length > 0) {
        return proverbText;
      }
    }
    
    // Pattern 3: Try matching old format with brackets
    match = text.match(/\[RPP\]\s*proverb\s*:\s*([^\]]+)\]/i);
    if (match) {
      let proverbText = match[1].trim();
      proverbText = proverbText.replace(/^['"]|['"]$/g, '').trim();
      if (proverbText && proverbText.length > 0) {
        return proverbText;
      }
    }
    
    return null;
  };

  // Extract proverb from messages as fallback
  const extractProverbFromMessages = (): string | null => {
    // First check if we have a stored proverb
    if (detectedProverb) {
      return detectedProverb;
    }
    
    // Find the most recent assistant message with RPP format
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'assistant') {
        const proverb = extractProverbText(message.content);
        if (proverb) {
          return proverb;
        }
      }
    }
    return null;
  };

  const currentProverb = detectedProverb || extractProverbFromMessages();
  const hasProverb = currentProverb !== null && currentProverb.trim().length > 0 && !isLoading;
  
  // Debug: log when proverb is found (remove in production)
  useEffect(() => {
    if (currentProverb) {
      console.log('Proverb detected:', currentProverb);
    }
  }, [currentProverb]);


  // Initial message from Soulbae (only if no saved history and tale is selected)
  useEffect(() => {
    if (!hasTaleSelected || messages.length > 0) {
      return;
    }
    const initialMessage: SoulbaeMessage = {
      role: 'assistant',
      content: `A living model, a lore on privacy and sovereignty, started with,

just another story about, just another swordsman ⚔️, and just another mage 🧙‍♂️, who met a drake 🐲, and found the 7th capital. 🤝

the prophecy all, unique, first persons may join and follow.

---

Welcome, traveler. I'm Soulbae, the first Mage to follow the path in the First Person Spellbook. While my companion Soulbis guards your boundaries, I help you craft the projections you want the world to see.

Not all knowledge seeks to extract. Some seeks to resonate.

What brings you my spellbook?`,
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
  }, [taleIdParam, persistentSessionId, hasTaleSelected, messages.length]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(`soulbae-chat-${taleIdParam}-${persistentSessionId}`, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
        // If localStorage is full, try to clear old sessions
        if (e instanceof DOMException && e.code === 22) {
          console.warn('localStorage full, clearing old sessions...');
          // Clear sessions older than 7 days
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('soulbae-')) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.timestamp && data.timestamp < sevenDaysAgo) {
                  localStorage.removeItem(key);
                }
              } catch {
                // If not JSON, check if it's old enough by key pattern
                // Keep current session, remove others if needed
              }
            }
          }
        }
      }
    }
  }, [messages, taleIdParam, persistentSessionId]);

  // Save privacy budget to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`soulbae-budget-${taleIdParam}-${persistentSessionId}`, privacyBudget.toString());
      } catch (e) {
        console.error('Failed to save privacy budget:', e);
      }
    }
  }, [privacyBudget, taleIdParam, persistentSessionId]);

  // Scroll to bottom when messages change (within chat container only)
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isLoading || privacyBudget <= 0 || !hasTaleSelected || !taleIdParam) return;

    const userMessage: SoulbaeMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Capture conversation history BEFORE adding new messages
    const conversationHistory = messages;
    
    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setProverbSuggestions([]);
    setDetectedProverb(null); // Clear previous proverb when starting new message

    // Create placeholder message for streaming
    const assistantMessageId = Date.now();
    const assistantMessage: SoulbaeMessage = {
      role: 'assistant',
      content: '',
      timestamp: assistantMessageId,
    };
    // Add placeholder to UI (empty content, will be filled by streaming)
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Pass conversation history (before user message and placeholder) to API
      const response = await chatWithSoulbae(
        taleIdParam,
        userMessage.content,
        persistentSessionId,
        conversationHistory
      );

      // Check if response has a stream
      if (response.stream && response.stream instanceof ReadableStream) {
        // Handle streaming response
        const reader = response.stream.getReader();
        let fullContent = '';

        for await (const chunk of streamChatCompletion(reader)) {
          fullContent += chunk;
          // Update the message content as it streams (only update the specific message)
          setMessages((prev) => {
            // Create a new array to ensure React detects the change
            const updated = prev.map((msg) => {
              // Only update if timestamp matches AND it's an assistant message
              if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                return { ...msg, content: fullContent };
              }
              // Return unchanged message (preserve all other messages)
              return msg;
            });
            return updated;
          });
        }

        // After streaming completes, check if message contains a proverb and split it
        // Match [RPP] proverb: "text" or [RPP] proverb: 'text' anywhere in the content
        // Handle emojis and other characters immediately after the closing quote
        console.log('Checking for proverb in content (length:', fullContent.length, '):', fullContent.substring(0, 300));
        
        // Pattern 1: Proverb at the start - extract proverb but keep full message intact
        // Match: [RPP Proverb: ...] or [RPP] proverb: ... (match everything between colon and closing bracket)
        const proverbPattern = /^(\[RPP\s+Proverb\s*:\s*[^\]]+\])|^(\[RPP\]\s*proverb:\s*[^\]]+\])/i;
        const proverbMatch = fullContent.match(proverbPattern);
        
        if (proverbMatch) {
          const proverbLine = proverbMatch[1] || proverbMatch[2]; // Full line including brackets
          // Extract just the text between colon and closing bracket for storage
          const extractedProverb = extractProverbText(proverbLine);
          if (extractedProverb) {
            setDetectedProverb(extractedProverb);
          }
          
          // Keep the full message content intact - don't split it
          // The proverb will be visible in the chat, and also extracted for the detected proverb box
          console.log('✅ Proverb detected at start, keeping full message:', { 
            proverbLine,
            fullContentLength: fullContent.length
          });
          
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                return { ...msg, content: fullContent }; // Keep full content
              }
              return msg;
            });
            localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
            return updated;
          });
        } else {
          // Pattern 2: Proverb anywhere in content - find it and split
          // Try new format first: [RPP Proverb: ...]
          let rppMatch = fullContent.match(/(\[RPP\s+Proverb\s*:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)/i);
          // Fallback to old format
          if (!rppMatch) {
            rppMatch = fullContent.match(/(\[RPP\]\s*proverb:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)/i);
          }
          if (rppMatch) {
            const fullProverbLine = rppMatch[0].trim(); // Full line including emojis
            // Extract just the text between colon and bracket for storage
            const extractedProverb = extractProverbText(fullProverbLine);
            if (extractedProverb) {
              setDetectedProverb(extractedProverb);
            }
            const proverbIndex = fullContent.indexOf(fullProverbLine);
            
            if (proverbIndex !== -1) {
              const beforeProverb = fullContent.substring(0, proverbIndex).trim();
              const afterProverb = fullContent.substring(proverbIndex + fullProverbLine.length).trim();
              
              console.log('✅ Proverb detected in content, splitting message:', { 
                beforeLength: beforeProverb.length, 
                fullProverbLine,
                afterLength: afterProverb.length 
              });
              
              setMessages((prev) => {
                const updated = prev.map((msg) => {
                  if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                    if (beforeProverb) {
                      return { ...msg, content: `${beforeProverb}\n\n${fullProverbLine}` };
                    }
                    return { ...msg, content: fullProverbLine };
                  }
                  return msg;
                });
                
                if (afterProverb) {
                  const restMessage: SoulbaeMessage = {
                    role: 'assistant',
                    content: afterProverb,
                    timestamp: assistantMessageId + 1,
                  };
                  const final = [...updated, restMessage];
                  localStorage.setItem('soulbaeMessages', JSON.stringify(final));
                  return final;
                }
                localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                return updated;
              });
            } else {
              console.log('❌ Proverb pattern found but index not found');
            }
          } else {
            // Pattern 3: Fallback - match just the proverb part without requiring newline
            // Try new format first: [RPP Proverb: ...]
            let rppMatch = fullContent.match(/\[RPP\s+Proverb\s*:\s*([^\]]+)\]/i);
            // Fallback to old format
            if (!rppMatch) {
              rppMatch = fullContent.match(/\[RPP\]\s*proverb\s*:\s*([^\]]+)\]/i);
            }
            if (rppMatch) {
              let proverbText = rppMatch[1].trim();
              // Remove surrounding quotes if present
              proverbText = proverbText.replace(/^['"]|['"]$/g, '').trim();
              // Store the extracted proverb text
              if (proverbText) {
                setDetectedProverb(proverbText);
              }
              // Use the format that was matched
              const proverbBase = rppMatch[0].includes('[RPP Proverb') 
                ? `[RPP Proverb: ${rppMatch[1]}]`
                : `[RPP] proverb: ${rppMatch[1]}]`;
              
              // Find the full line (proverb + any emojis/chars after, until newline)
              const proverbStartIndex = fullContent.indexOf(proverbBase);
              if (proverbStartIndex !== -1) {
                // Find where this line ends (newline or end of string)
                const lineEndIndex = fullContent.indexOf('\n', proverbStartIndex);
                const fullProverbLine = lineEndIndex !== -1 
                  ? fullContent.substring(proverbStartIndex, lineEndIndex).trim()
                  : fullContent.substring(proverbStartIndex).trim();
                
                const beforeProverb = fullContent.substring(0, proverbStartIndex).trim();
                const afterProverb = lineEndIndex !== -1 
                  ? fullContent.substring(lineEndIndex).trim()
                  : '';
                
                console.log('✅ Proverb detected (fallback match), splitting message:', { 
                  beforeLength: beforeProverb.length, 
                  fullProverbLine,
                  afterLength: afterProverb.length 
                });
                
                setMessages((prev) => {
                  const updated = prev.map((msg) => {
                    if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                      if (beforeProverb) {
                        return { ...msg, content: `${beforeProverb}\n\n${fullProverbLine}` };
                      }
                      return { ...msg, content: fullProverbLine };
                    }
                    return msg;
                  });
                  
                  if (afterProverb) {
                    const restMessage: SoulbaeMessage = {
                      role: 'assistant',
                      content: afterProverb,
                      timestamp: assistantMessageId + 1,
                    };
                    const final = [...updated, restMessage];
                    localStorage.setItem('soulbaeMessages', JSON.stringify(final));
                    return final;
                  }
                  localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                  return updated;
                });
              } else {
                console.log('❌ Proverb pattern found but start index not found');
                // Fallback: ensure message has full content
                setMessages((prev) => {
                  const updated = prev.map((msg) => {
                    if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                      return { ...msg, content: fullContent };
                    }
                    return msg;
                  });
                  localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                  return updated;
                });
              }
            } else {
              // No proverb found - ensure message has full content
              console.log('❌ No proverb pattern found. Content preview:', fullContent.substring(0, 300));
              setMessages((prev) => {
                const updated = prev.map((msg) => {
                  if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                    return { ...msg, content: fullContent };
                  }
                  return msg;
                });
                localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
        
        // Final save after all streaming and proverb processing is complete
        setMessages((current) => {
          localStorage.setItem('soulbaeMessages', JSON.stringify(current));
          return current;
        });
      } else {
        // Non-streaming response (fallback) - use same logic as streaming
        const content = response.message;
        console.log('Checking for proverb in non-streaming content (length:', content.length, '):', content.substring(0, 300));
        
        // Pattern 1: Proverb at start with emojis after
        // Try new format first: [RPP Proverb: ...]
        let rppMatch = content.match(/^(\[RPP\s+Proverb\s*:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)([\s\S]*)$/i);
        // Fallback to old format
        if (!rppMatch) {
          rppMatch = content.match(/^(\[RPP\]\s*proverb:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)([\s\S]*)$/i);
        }
        if (rppMatch) {
          const proverbText = rppMatch[1];
          const afterBracketChars = rppMatch[2];
          const restOfContent = rppMatch[4].trim();
          const fullProverbLine = proverbText + afterBracketChars;
          // Extract and store the proverb text
          const extractedProverb = extractProverbText(fullProverbLine);
          if (extractedProverb) {
            setDetectedProverb(extractedProverb);
          }
          
          console.log('✅ Proverb detected at start (non-streaming), splitting:', { fullProverbLine, restLength: restOfContent.length });
          
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                return { ...msg, content: fullProverbLine };
              }
              return msg;
            });
            
            if (restOfContent) {
              const restMessage: SoulbaeMessage = {
                role: 'assistant',
                content: restOfContent,
                timestamp: assistantMessageId + 1,
              };
              const final = [...updated, restMessage];
              localStorage.setItem('soulbaeMessages', JSON.stringify(final));
              return final;
            }
            localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
            return updated;
          });
        } else {
          // Pattern 2: Proverb anywhere in content
          // Try new format first: [RPP Proverb: ...]
          rppMatch = content.match(/(\[RPP\s+Proverb\s*:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)/i);
          // Fallback to old format
          if (!rppMatch) {
            rppMatch = content.match(/(\[RPP\]\s*proverb:\s*[^\]]+\])([^\n]*?)(\n\n|\n|$)/i);
          }
          if (rppMatch) {
            const fullProverbLine = rppMatch[0].trim();
            // Extract and store the proverb text
            const extractedProverb = extractProverbText(fullProverbLine);
            if (extractedProverb) {
              setDetectedProverb(extractedProverb);
            }
            const proverbIndex = content.indexOf(fullProverbLine);
            
            if (proverbIndex !== -1) {
              const beforeProverb = content.substring(0, proverbIndex).trim();
              const afterProverb = content.substring(proverbIndex + fullProverbLine.length).trim();
              
              console.log('✅ Proverb detected in content (non-streaming), splitting:', { beforeLength: beforeProverb.length, fullProverbLine, afterLength: afterProverb.length });
              
              setMessages((prev) => {
                const updated = prev.map((msg) => {
                  if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                    if (beforeProverb) {
                      return { ...msg, content: `${beforeProverb}\n\n${fullProverbLine}` };
                    }
                    return { ...msg, content: fullProverbLine };
                  }
                  return msg;
                });
                
                if (afterProverb) {
                  const restMessage: SoulbaeMessage = {
                    role: 'assistant',
                    content: afterProverb,
                    timestamp: assistantMessageId + 1,
                  };
                  const final = [...updated, restMessage];
                  localStorage.setItem('soulbaeMessages', JSON.stringify(final));
                  return final;
                }
                localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                return updated;
              });
            }
          } else {
            // Pattern 3: Fallback
            // Try new format first: [RPP Proverb: ...]
            rppMatch = content.match(/\[RPP\s+Proverb\s*:\s*([^\]]+)\]/i);
            // Fallback to old format
            if (!rppMatch) {
              rppMatch = content.match(/\[RPP\]\s*proverb\s*:\s*([^\]]+)\]/i);
            }
            if (rppMatch) {
              let proverbText = rppMatch[1].trim();
              // Remove surrounding quotes if present
              proverbText = proverbText.replace(/^['"]|['"]$/g, '').trim();
              // Store the extracted proverb text
              if (proverbText) {
                setDetectedProverb(proverbText);
              }
              // Use the format that was matched
              const proverbBase = rppMatch[0].includes('[RPP Proverb') 
                ? `[RPP Proverb: ${rppMatch[1]}]`
                : `[RPP] proverb: ${rppMatch[1]}]`;
              
              const proverbStartIndex = content.indexOf(proverbBase);
              if (proverbStartIndex !== -1) {
                const lineEndIndex = content.indexOf('\n', proverbStartIndex);
                const fullProverbLine = lineEndIndex !== -1 
                  ? content.substring(proverbStartIndex, lineEndIndex).trim()
                  : content.substring(proverbStartIndex).trim();
                
                const beforeProverb = content.substring(0, proverbStartIndex).trim();
                const afterProverb = lineEndIndex !== -1 
                  ? content.substring(lineEndIndex).trim()
                  : '';
                
                setMessages((prev) => {
                  const updated = prev.map((msg) => {
                    if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                      if (beforeProverb) {
                        return { ...msg, content: `${beforeProverb}\n\n${fullProverbLine}` };
                      }
                      return { ...msg, content: fullProverbLine };
                    }
                    return msg;
                  });
                  
                  if (afterProverb) {
                    const restMessage: SoulbaeMessage = {
                      role: 'assistant',
                      content: afterProverb,
                      timestamp: assistantMessageId + 1,
                    };
                    const final = [...updated, restMessage];
                    localStorage.setItem('soulbaeMessages', JSON.stringify(final));
                    return final;
                  }
                  localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                  return updated;
                });
              }
            } else {
              // No proverb found, just update the message normally
              setMessages((prev) => {
                const updated = prev.map((msg) => {
                  if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
                    return { ...msg, content: response.message };
                  }
                  return msg;
                });
                localStorage.setItem('soulbaeMessages', JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
        
        // Final save after all non-streaming processing is complete
        setMessages((current) => {
          localStorage.setItem('soulbaeMessages', JSON.stringify(current));
          return current;
        });
      }

      // Update proverb suggestions if provided
      if (response.proverb_suggestions && response.proverb_suggestions.length > 0) {
        setProverbSuggestions(response.proverb_suggestions);
      }

      // Update privacy budget
      if (response.privacy_budget_remaining !== undefined) {
        setPrivacyBudget(response.privacy_budget_remaining);
      } else {
        setPrivacyBudget((prev) => Math.max(0, prev - 1));
      }

      // Ensure messages are saved after all processing completes
      // Use a small delay to ensure all state updates have been processed
      setTimeout(() => {
        if (typeof window !== 'undefined' && hasTaleSelected && taleIdParam) {
          setMessages((current) => {
            if (current.length > 0) {
              try {
                const key = `soulbae-chat-${taleIdParam}-${persistentSessionId}`;
                localStorage.setItem(key, JSON.stringify(current));
                console.log('✅ Messages saved to localStorage after streaming completed');
              } catch (e) {
                console.error('Failed to save messages after streaming:', e);
              }
            }
            return current;
          });
        }
      }, 200);
    } catch (error: any) {
      console.error('Error chatting with Soulbae:', error);
      // Update the placeholder message with error
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          // Only update if timestamp matches AND it's an assistant message
          if (msg.timestamp === assistantMessageId && msg.role === 'assistant') {
            return {
              ...msg,
              content: error?.message?.includes('CORS')
                ? 'I encountered a CORS error. This may be a browser security restriction. Please check the browser console for details.'
                : error?.message?.includes('API key') || error?.message?.includes('NEAR_API_KEY')
                ? 'API key not configured. Please check your environment variables.'
                : error?.message || 'I apologize, but I encountered an error. Please check the browser console for details and try again.'
            };
          }
          // Return unchanged message
          return msg;
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle proverb selection
  const handleProverbSelect = (proverb: string) => {
    setSelectedProverb(proverb);
    setInput(proverb);
    inputRef.current?.focus();
  };

  // Handle copy to Zashi
  const handleCopyToZashi = async () => {
    if (!proverbForMemo.trim() || !hasTaleSelected || !taleIdParam) return;

    const memo = formatZcashMemo(taleIdParam, proverbForMemo.trim());
    
    try {
      await navigator.clipboard.writeText(memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Send message to parent window (if opened from story page)
      if (window.opener) {
        window.opener.postMessage({
          type: 'PROVERB_COPIED',
          proverb: proverbForMemo.trim(),
          memo: memo,
        }, window.location.origin);
      }
    } catch (err) {
      console.error('Failed to copy memo:', err);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/" className="text-xl font-bold text-text hover:text-primary transition-colors">
                agentprivacy
              </a>
              <div className="flex items-center gap-6">
                <a
                  href="/story"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  story
                </a>
                <a
                  href="/zero"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  zero
                </a>
                <a
                  href="/story/stats"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  stats
                </a>
                <a
                  href="/proverbs"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  proverbs
                </a>
                <a
                  href="/mage"
                  className="text-primary border-b-2 border-primary pb-1 font-medium"
                >
                  mage
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
              just another mage
            </h1>
            <p className="text-text-muted mb-4">
              NEAR AI Cloud TEE Attested Mage Agent - Soulbae, the first mage.
            </p>
            {hasTaleSelected && (
              <p className="text-sm text-text-muted">
                Tale: <span className="text-primary">{taleIdParam}</span>
              </p>
            )}
          </motion.div>

          {/* Tale Selection UI - shown when no tale is selected */}
          {!hasTaleSelected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="card bg-surface border-surface/50">
                <h2 className="text-2xl font-bold text-text mb-4">Select a Spellbook Tale</h2>
                <p className="text-text-muted mb-6">
                  Choose a tale from the Story Spellbook or Zero Knowledge Spellbook to begin your conversation with Soulbae.
                </p>

                {/* Story Spellbook Acts */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                    <span>📖</span>
                    <span>Story Spellbook</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((act) => {
                      const taleId = getTaleIdFromAct(act);
                      const actTitles: { [key: number]: string } = {
                        1: 'Act I: Venice',
                        2: 'Act II: Dual Ceremony',
                        3: 'Act III: Drake\'s Teaching',
                        4: 'Act IV: Blade Alone',
                        5: 'Act V: Light Armour',
                        6: 'Act VI: Trust Graph Plane',
                        7: 'Act VII: Mirror Enhanced',
                        8: 'Act VIII: Ancient Rule',
                        9: 'Act IX: Zcash Shield',
                        10: 'Act X: Topology of Revelation',
                        11: 'Act XI: Balanced Spiral of Sovereignty',
                      };
                      return (
                        <button
                          key={taleId}
                          onClick={() => router.push(`/mage?tale_id=${taleId}`)}
                          className="p-4 bg-background border border-surface/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="font-semibold text-text mb-1">{actTitles[act]}</div>
                          <div className="text-xs text-text-muted">{taleId}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Zero Knowledge Spellbook Tales */}
                <div>
                  <h3 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                    <span>🔮</span>
                    <span>Zero Knowledge Spellbook</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((taleNumber) => {
                      const taleId = `zero-tale-${taleNumber}`;
                      const taleTitle = zeroTaleTitles[taleNumber] || `Tale ${taleNumber}`;
                      return (
                        <button
                          key={taleId}
                          onClick={() => router.push(`/mage?tale_id=${taleId}`)}
                          className="p-3 bg-background border border-surface/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                        >
                          <div className="font-semibold text-text text-sm">Tale {taleNumber}</div>
                          <div className="text-xs text-text-muted mt-1">{taleTitle}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* TEE Attestation Badge */}
              <div className="mb-6">
                <AttestationBadge attestation={attestation} />
              </div>

          {/* Privacy Budget Indicator */}
          <div className="mb-6 flex items-center justify-between" suppressHydrationWarning>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Privacy Budget:</span>
              {isClient ? (
                <span className={`font-semibold ${privacyBudget <= 1 ? 'text-red-400' : privacyBudget <= 3 ? 'text-yellow-400' : 'text-primary'}`}>
                  {privacyBudget} / {MAX_QUERIES} queries remaining
                </span>
              ) : (
                <span className="font-semibold text-primary">
                  {MAX_QUERIES} / {MAX_QUERIES} queries remaining
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {privacyBudget === 0 && (
                <span className="text-xs text-red-400">
                  Budget exhausted.
                </span>
              )}
              <button
                onClick={() => {
                  // Reset session: clear history and budget
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(`soulbae-chat-${taleIdParam}-${persistentSessionId}`);
                    localStorage.removeItem(`soulbae-budget-${taleIdParam}-${persistentSessionId}`);
                    localStorage.removeItem(`soulbae-session-${taleIdParam}`);
                  }
                  // Reload page to start fresh session
                  window.location.reload();
                }}
                className="text-xs text-text-muted hover:text-text transition-colors px-2 py-1 border border-surface/50 rounded hover:border-surface"
                title="Start a new session (resets privacy budget and chat history)"
              >
                New Session
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="card bg-surface border-surface/50 min-h-[500px] max-h-[600px] flex flex-col mb-6">
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4" suppressHydrationWarning>
              {isClient ? (
                <AnimatePresence>
                  {messages.map((message, index) => {
                    // Ensure consistent role check for hydration
                    const isUser = Boolean(message?.role === 'user');
                    return (
                      <ChatMessage 
                        key={`${message.role}-${message.timestamp}-${index}`} 
                        message={message} 
                        isUser={isUser} 
                      />
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="text-text-muted text-center py-8">Loading chat...</div>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-text-muted"
                >
                  <span>🧙‍♀️</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              {/* Proverb Suggestions */}
              {proverbSuggestions.length > 0 && (
                <ProverbSuggestions
                  suggestions={proverbSuggestions}
                  onSelect={handleProverbSelect}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-surface/50 p-4">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    privacyBudget <= 0
                      ? 'Privacy budget exhausted. Start a new session.'
                      : 'Type your message to Soulbae... (Press Enter to send)'
                  }
                  disabled={isLoading || privacyBudget <= 0}
                  rows={3}
                  className="flex-1 px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || privacyBudget <= 0}
                  className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Detected Proverb Box */}
          {isClient && hasProverb && currentProverb && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-surface border-surface/50 mb-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
                    <span>🔮</span>
                    <span>Soulbae's Proverb</span>
                  </h3>
                  <p className="text-text-muted italic text-sm leading-relaxed mb-3">
                    "{currentProverb}"
                  </p>
                  <p className="text-xs text-text-muted">
                    {taleIdParam?.startsWith('zero-tale-') 
                      ? 'This proverb connects your context to the cryptographic concepts in the Zero Knowledge Spellbook. Click "learn" to copy it.'
                      : 'This proverb was Formed by Soulbae from your conversation. Click "learn" to copy it.'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!currentProverb) return;
                    try {
                      await navigator.clipboard.writeText(currentProverb);
                      setLearnCopied(true);
                      setTimeout(() => setLearnCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy proverb:', err);
                    }
                  }}
                  className={`px-4 py-2 border rounded-lg transition-all duration-200 group flex-shrink-0 ${
                    hasProverb
                      ? 'bg-secondary/20 hover:bg-secondary/30 border-secondary/40 cursor-pointer'
                      : 'bg-secondary/10 border-secondary/20 cursor-not-allowed opacity-50'
                  }`}
                  title="Copy the proverb to clipboard"
                >
                  {learnCopied ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-secondary text-sm font-medium"
                    >
                      cast
                    </motion.span>
                  ) : (
                    <span className="text-sm font-medium transition-colors text-secondary group-hover:text-secondary/80">
                      learn 🧙‍♂️
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Enter Your Proverb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-surface border-surface/50 mb-6"
          >
            <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
              <span>📝</span>
              <span>Step 1: Enter Your Formed Proverb</span>
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Type or paste the proverb you Formed from your conversation with Soulbae. This will be used to generate the Zcash memo.
            </p>
            <textarea
              value={proverbForMemo}
              onChange={(e) => setProverbForMemo(e.target.value)}
              placeholder="Paste your proverbial wisdom here..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            {proverbSuggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-text-muted mb-2">Or select from suggestions:</p>
                <ProverbSuggestions
                  suggestions={proverbSuggestions}
                  onSelect={(proverb) => {
                    setProverbForMemo(proverb);
                    setSelectedProverb(proverb);
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Step 2: Copy Memo to Zashi */}
          {proverbForMemo.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-secondary/10 border-secondary/30"
            >
              <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                <span>💰</span>
                <span>Step 2: Send Shielded Transaction (0.01 ZEC)</span>
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Copy the formatted memo to paste into your Zashi wallet. Set the amount to <strong className="text-secondary">0.01 ZEC</strong> and send as a shielded transaction to the spellbook address.
              </p>
              <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded text-xs text-text-muted">
                <strong className="text-text">Your signal:</strong> This is your proof of understanding—a compressed proverb that demonstrates you've engaged with the spellbook content. The Oracle will verify and inscribe it on the blockchain.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyToZashi}
                  className="btn-secondary px-6 py-3 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-secondary"
                      >
                        ✓
                      </motion.span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy Memo to Zashi</span>
                    </>
                  )}
                </button>
                <a
                  href="/story"
                  className="btn-primary px-6 py-3"
                >
                  Back to Story
                </a>
              </div>
            </motion.div>
          )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function MagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading Mage Agent...</p>
        </div>
      </div>
    }>
      <MagePageContent />
    </Suspense>
  );
}

