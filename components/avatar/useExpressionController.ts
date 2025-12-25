import { useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { EmotionType } from '@/lib/emotion-types';

// Map your emotion types to VRM expression presets
// VRM standard expressions: happy, angry, sad, relaxed, surprised
const EMOTION_TO_VRM_EXPRESSION: Record<EmotionType, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  anxious: 'sad', // VRM doesn't have anxious, use sad as closest
  surprised: 'surprised',
  grateful: 'happy', // Grateful maps to happy
  excited: 'happy', // Excited maps to happy
  confused: 'relaxed', // Confused maps to relaxed/neutral
  neutral: 'relaxed', // Neutral maps to relaxed
};

export function useExpressionController(
  vrm: VRM | null,
  emotion: EmotionType,
  volume: number
) {
  // Apply emotion expression
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    const expressionName = EMOTION_TO_VRM_EXPRESSION[emotion];

    // Reset all expressions to 0
    const allExpressions = ['happy', 'sad', 'angry', 'surprised', 'relaxed'];
    allExpressions.forEach((exp) => {
      vrm.expressionManager.setValue(exp, 0);
    });

    // Apply target expression
    vrm.expressionManager.setValue(expressionName, 1.0);
  }, [vrm, emotion]);

  // Apply mouth movement (lip-sync)
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    // Map volume to mouth opening
    // "aa" is the open mouth viseme in VRM spec
    const mouthValue = volume * 0.7; // Scale down for more natural look
    vrm.expressionManager.setValue('aa', mouthValue);
  }, [vrm, volume]);

  // Auto-blink animation
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    const blink = () => {
      // Quick blink animation
      vrm.expressionManager.setValue('blink', 1.0);
      setTimeout(() => {
        if (vrm?.expressionManager) {
          vrm.expressionManager.setValue('blink', 0);
        }
      }, 150); // Blink duration
    };

    // Random blink interval (3-5 seconds)
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        blink();
        timeoutId = scheduleNextBlink();
      }, delay);
    };

    let timeoutId = scheduleNextBlink();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [vrm]);
}
