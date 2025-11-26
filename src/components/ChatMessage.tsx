'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SoulbaeMessage } from '@/lib/soulbae';

interface ChatMessageProps {
  message: SoulbaeMessage;
  isUser?: boolean;
}

export default function ChatMessage({ message, isUser = false }: ChatMessageProps) {
  // Ensure isUser is correctly determined from message role
  // Use a consistent check that works on both server and client
  // Default to false if message is undefined/null to prevent hydration mismatch
  const isUserMessage = Boolean(message?.role === 'user' || isUser);
  
  // Ensure className is always a string to prevent hydration mismatch
  const containerClassName = `flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`;
  
  // Pre-compute all classNames to prevent hydration mismatch
  const messageBoxClassName = `max-w-[80%] rounded-lg px-4 py-3 ${
    isUserMessage
      ? 'bg-primary/20 border border-primary/30 text-text'
      : 'bg-surface/50 border border-surface/50 text-text-muted'
  }`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={containerClassName}
      suppressHydrationWarning
    >
      <div
        className={messageBoxClassName}
        suppressHydrationWarning
      >
        <div className="flex items-start gap-2">
          {!isUserMessage && (
            <span className="text-xl mt-1">🧙‍♀️</span>
          )}
          <div className="flex-1">
            {isUserMessage ? (
              // User messages - simple display with markdown
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-text-muted">{children}</li>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              // Assistant messages - check for RPP format, then render markdown
              <div className="prose prose-invert max-w-none">
                {(() => {
                  const content = message.content;
                  // Check if content is ONLY a proverb (starts and ends with [RPP] proverb format)
                  const isProverbOnly = content.match(/^\[RPP\] proverb:\s*(?:'[^']*'|"[^"]*")\s*$/);
                  if (isProverbOnly) {
                    // Render proverb in its own distinct bubble
                    return (
                      <div className="p-4 bg-primary/20 border-2 border-primary/50 rounded-lg text-primary font-medium text-lg leading-relaxed">
                        <span className="text-2xl mr-2">🔮</span>
                        {content}
                      </div>
                    );
                  }
                  // Check if content starts with [RPP] proverb format (handles both single and double quotes)
                  const rppMatch = content.match(/^(\[RPP\] proverb: (?:'[^']*'|"[^"]*"))\s*(.*)$/s);
                  if (rppMatch) {
                    return (
                      <>
                        <div className="p-4 mb-2 bg-primary/20 border-2 border-primary/50 rounded-lg text-primary font-medium text-lg leading-relaxed">
                          <span className="text-2xl mr-2">🔮</span>
                          {rppMatch[1]}
                        </div>
                        {rppMatch[2].trim() && (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-text-muted">{children}</li>,
                            }}
                          >
                            {rppMatch[2]}
                          </ReactMarkdown>
                        )}
                      </>
                    );
                  }
                  // Fallback: check if RPP appears anywhere in the content (handles both single and double quotes)
                  const parts = content.split(/(\[RPP\] proverb: (?:'[^']*'|"[^"]*"))/);
                  if (parts.length > 1) {
                    return parts.map((part, index) => {
                      if (part.match(/^\[RPP\] proverb: (?:'|")/)) {
                        return (
                          <div key={index} className="p-4 mb-2 bg-primary/20 border-2 border-primary/50 rounded-lg text-primary font-medium text-lg leading-relaxed">
                            <span className="text-2xl mr-2">🔮</span>
                            {part}
                          </div>
                        );
                      }
                      return (
                        <ReactMarkdown
                          key={index}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-text-muted">{children}</li>,
                          }}
                        >
                          {part}
                        </ReactMarkdown>
                      );
                    });
                  }
                  // No RPP format found, render markdown
                  return (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-text-muted">{children}</li>,
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  );
                })()}
              </div>
            )}
            {message.timestamp && (
              <span className="text-xs text-text-muted/50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          {isUserMessage && (
            <span className="text-xl mt-1">⚔️</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

