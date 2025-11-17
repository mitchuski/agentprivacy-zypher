'use client';

import { motion } from 'framer-motion';
import { SoulbaeMessage } from '@/lib/soulbae';

interface ChatMessageProps {
  message: SoulbaeMessage;
  isUser?: boolean;
}

export default function ChatMessage({ message, isUser = false }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary/20 border border-primary/30 text-text'
            : 'bg-surface/50 border border-surface/50 text-text-muted'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <span className="text-xl mt-1">🧙‍♀️</span>
          )}
          <div className="flex-1">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.timestamp && (
              <span className="text-xs text-text-muted/50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          {isUser && (
            <span className="text-xl mt-1">⚔️</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

