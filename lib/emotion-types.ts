/**
 * Emotion types and utilities for agent emotional analysis
 */

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'surprised'
  | 'grateful'
  | 'neutral'
  | 'excited'
  | 'confused';

export interface EmotionData {
  type: 'emotion';
  emotion: EmotionType;
  source: 'user' | 'agent';
  timestamp: number;
  confidence?: number;
}

export const EMOTION_CONFIG = {
  happy: {
    emoji: '😊',
    color: '#10b981', // green
    label: 'Happy',
  },
  sad: {
    emoji: '😢',
    color: '#3b82f6', // blue
    label: 'Sad',
  },
  angry: {
    emoji: '😠',
    color: '#ef4444', // red
    label: 'Angry',
  },
  anxious: {
    emoji: '😰',
    color: '#f59e0b', // amber
    label: 'Anxious',
  },
  surprised: {
    emoji: '😲',
    color: '#a855f7', // purple
    label: 'Surprised',
  },
  grateful: {
    emoji: '🙏',
    color: '#ec4899', // pink
    label: 'Grateful',
  },
  excited: {
    emoji: '🤩',
    color: '#f97316', // orange
    label: 'Excited',
  },
  confused: {
    emoji: '😕',
    color: '#64748b', // slate
    label: 'Confused',
  },
  neutral: {
    emoji: '😐',
    color: '#6b7280', // gray
    label: 'Neutral',
  },
} as const;
