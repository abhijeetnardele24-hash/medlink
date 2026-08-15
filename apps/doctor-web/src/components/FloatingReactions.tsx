import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FloatingReaction } from '../hooks/useWebRTC';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 50, scale: 0.5, x: Math.sin(r.createdAt) * 80 }}
            animate={{ opacity: 1, y: -450, scale: [0.8, 1.4, 1.1], x: [0, (Math.random() - 0.5) * 120, 0] }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 drop-shadow-2xl"
          >
            <span className="text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] animate-bounce">
              {r.emoji}
            </span>
            <span className="text-xs bg-black/70 backdrop-blur-md text-white/90 px-2.5 py-0.5 rounded-full border border-white/10 font-medium">
              {r.senderName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
