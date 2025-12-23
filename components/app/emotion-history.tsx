'use client';

import { motion } from 'motion/react';
import { EMOTION_CONFIG, type EmotionData } from '@/lib/emotion-types';
import { cn } from '@/lib/utils';

interface EmotionHistoryProps {
  history: EmotionData[];
  maxItems?: number;
  className?: string;
}

export function EmotionHistory({ history, maxItems = 10, className }: EmotionHistoryProps) {
  const recentHistory = history.slice(-maxItems);

  if (recentHistory.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Emotion Timeline
      </h3>
      <div className="space-y-1">
        {recentHistory.map((item, index) => {
          const config = EMOTION_CONFIG[item.emotion];
          const isUser = item.source === 'user';

          return (
            <motion.div
              key={`${item.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted/50 flex items-center gap-3 rounded-md p-2"
            >
              {/* Emoji */}
              <div className="text-2xl">{config.emoji}</div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isUser ? 'You' : 'Agent'}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Confidence (if available) */}
              {item.confidence && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(item.confidence * 100)}%
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact horizontal emotion timeline - shows just emojis
 */
export function EmotionTimelineCompact({
  history,
  maxItems = 20,
  className,
}: EmotionHistoryProps) {
  const recentHistory = history.slice(-maxItems);

  if (recentHistory.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {recentHistory.map((item, index) => {
        const config = EMOTION_CONFIG[item.emotion];
        const isUser = item.source === 'user';

        return (
          <motion.div
            key={`${item.timestamp}-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="relative"
            title={`${config.label} - ${isUser ? 'You' : 'Agent'} - ${new Date(item.timestamp).toLocaleTimeString()}`}
          >
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-sm transition-transform hover:scale-125',
                isUser ? 'bg-blue-500/10' : 'bg-purple-500/10'
              )}
            >
              {config.emoji}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
