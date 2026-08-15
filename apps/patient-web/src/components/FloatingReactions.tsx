import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FloatingReaction } from '../hooks/useWebRTC';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 50, scale: 0.5, x: Math.sin(r.createdAt) * 80 }}
            animate={{ opacity: 1, y: -450, scale: [0.8, 1.4, 1.1], x: [0, (Math.random() - 0.5) * 120, 0] }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: '7rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}>
              {r.emoji}
            </span>
            <span style={{
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.9)',
              padding: '0.125rem 0.625rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 500
            }}>
              {r.senderName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
