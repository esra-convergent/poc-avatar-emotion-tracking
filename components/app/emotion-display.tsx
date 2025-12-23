'use client';

import { motion, AnimatePresence } from 'motion/react';
import { EMOTION_CONFIG, type EmotionType } from '@/lib/emotion-types';
import { useEffect, useState } from 'react';

interface EmotionDisplayProps {
  emotion: EmotionType;
  source?: 'user' | 'agent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  playSound?: boolean;
}

export function EmotionDisplay({
  emotion,
  size = 'md',
  showLabel = false,
  playSound = false,
}: EmotionDisplayProps) {
  const [key, setKey] = useState(0);
  const config = EMOTION_CONFIG[emotion];

  // Trigger re-animation when emotion changes
  useEffect(() => {
    setKey((prev) => prev + 1);

    // Optional: Play sound effect
    if (playSound && emotion !== 'neutral') {
      // You can add sound effects here
      // const audio = new Audio(`/sounds/${emotion}.mp3`);
      // audio.play().catch(() => {});
    }
  }, [emotion, playSound]);

  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  };

  const animations = {
    happy: { scale: 1.1, rotate: 5 },
    sad: { y: 5, opacity: 0.8 },
    angry: { scale: 1.2, rotate: -5 },
    anxious: { x: 3 },
    surprised: { scale: 1.3 },
    grateful: { rotate: 10 },
    excited: { y: -8, scale: 1.15 },
    confused: { rotate: -8 },
    neutral: { scale: 1 },
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${emotion}-${key}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            ...animations[emotion],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className={`${sizeClasses[size]} select-none`}
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
        >
          {config.emoji}
        </motion.div>
      </AnimatePresence>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium capitalize"
          style={{ color: config.color }}
        >
          {config.label}
        </motion.div>
      )}
    </div>
  );
}
