import { useEffect } from 'react';
import { EmotionType } from '@/lib/emotion-types';
import type { GLBAvatar } from './useGLBLoader';

// ARKit blendshape names used by Ready Player Me
// Reference: https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets-blendshapes
const ARKIT_BLENDSHAPES = {
  // Mouth
  mouthSmileLeft: 'mouthSmileLeft',
  mouthSmileRight: 'mouthSmileRight',
  mouthFrownLeft: 'mouthFrownLeft',
  mouthFrownRight: 'mouthFrownRight',
  mouthOpen: 'mouthOpen',
  jawOpen: 'jawOpen',
  jawForward: 'jawForward',

  // Brows
  browInnerUp: 'browInnerUp',
  browDownLeft: 'browDownLeft',
  browDownRight: 'browDownRight',
  browOuterUpLeft: 'browOuterUpLeft',
  browOuterUpRight: 'browOuterUpRight',

  // Eyes
  eyeBlinkLeft: 'eyeBlinkLeft',
  eyeBlinkRight: 'eyeBlinkRight',
  eyeWideLeft: 'eyeWideLeft',
  eyeWideRight: 'eyeWideRight',
  eyeSquintLeft: 'eyeSquintLeft',
  eyeSquintRight: 'eyeSquintRight',
};

// Map emotions to ARKit blendshape combinations
const EMOTION_TO_ARKIT: Record<EmotionType, Record<string, number>> = {
  happy: {
    mouthSmileLeft: 0.7,
    mouthSmileRight: 0.7,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  sad: {
    mouthFrownLeft: 0.6,
    mouthFrownRight: 0.6,
    browDownLeft: 0.5,
    browDownRight: 0.5,
    browInnerUp: 0.3,
  },
  angry: {
    mouthFrownLeft: 0.5,
    mouthFrownRight: 0.5,
    browDownLeft: 0.8,
    browDownRight: 0.8,
    jawForward: 0.3,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
  },
  anxious: {
    mouthFrownLeft: 0.3,
    mouthFrownRight: 0.3,
    browInnerUp: 0.6,
    eyeWideLeft: 0.3,
    eyeWideRight: 0.3,
  },
  surprised: {
    mouthOpen: 0.4,
    jawOpen: 0.3,
    browInnerUp: 0.8,
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
  },
  grateful: {
    mouthSmileLeft: 0.6,
    mouthSmileRight: 0.6,
    browInnerUp: 0.2,
  },
  excited: {
    mouthSmileLeft: 0.9,
    mouthSmileRight: 0.9,
    mouthOpen: 0.3,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
    eyeWideLeft: 0.4,
    eyeWideRight: 0.4,
  },
  confused: {
    browInnerUp: 0.4,
    browDownLeft: 0.2,
    browOuterUpRight: 0.3,
    mouthFrownLeft: 0.2,
  },
  neutral: {},
};

export function useReadyPlayerMeExpressions(
  avatar: GLBAvatar | null,
  emotion: EmotionType,
  volume: number
) {
  // Apply emotion expressions
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) {
      return;
    }

    const dict = avatar.morphTargetDictionary;
    const influences = avatar.morphTargetInfluences;

    // Reset all morph targets to 0
    for (let i = 0; i < influences.length; i++) {
      influences[i] = 0;
    }

    // Apply emotion blendshapes
    const emotionShapes = EMOTION_TO_ARKIT[emotion];
    for (const [shapeName, value] of Object.entries(emotionShapes)) {
      const index = dict[shapeName];
      if (index !== undefined) {
        influences[index] = value;
      }
    }

    // Trigger update
    if (avatar.headMesh) {
      avatar.headMesh.morphTargetInfluences = influences;
    }
  }, [avatar, emotion]);

  // Apply lip-sync (mouth movement based on audio volume)
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) {
      return;
    }

    const dict = avatar.morphTargetDictionary;
    const influences = avatar.morphTargetInfluences;

    // Use jawOpen for primary lip-sync
    const jawOpenIndex = dict['jawOpen'];
    const mouthOpenIndex = dict['mouthOpen'];

    if (jawOpenIndex !== undefined) {
      // Scale volume to reasonable mouth opening (0-1 range)
      influences[jawOpenIndex] = volume * 0.6;
    }

    if (mouthOpenIndex !== undefined) {
      influences[mouthOpenIndex] = volume * 0.4;
    }

    // Trigger update
    if (avatar.headMesh) {
      avatar.headMesh.morphTargetInfluences = influences;
    }
  }, [avatar, volume]);

  // Auto-blink animation
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) {
      return;
    }

    const dict = avatar.morphTargetDictionary;
    const influences = avatar.morphTargetInfluences;

    const blinkLeftIndex = dict['eyeBlinkLeft'];
    const blinkRightIndex = dict['eyeBlinkRight'];

    if (blinkLeftIndex === undefined && blinkRightIndex === undefined) {
      return;
    }

    const blink = () => {
      if (!avatar?.morphTargetInfluences) return;

      // Blink both eyes
      if (blinkLeftIndex !== undefined) {
        influences[blinkLeftIndex] = 1.0;
      }
      if (blinkRightIndex !== undefined) {
        influences[blinkRightIndex] = 1.0;
      }

      // Trigger update
      if (avatar.headMesh) {
        avatar.headMesh.morphTargetInfluences = influences;
      }

      // Un-blink after 150ms
      setTimeout(() => {
        if (!avatar?.morphTargetInfluences) return;

        if (blinkLeftIndex !== undefined) {
          influences[blinkLeftIndex] = 0;
        }
        if (blinkRightIndex !== undefined) {
          influences[blinkRightIndex] = 0;
        }

        if (avatar.headMesh) {
          avatar.headMesh.morphTargetInfluences = influences;
        }
      }, 150);
    };

    // Schedule random blinks
    const scheduleNextBlink = (): NodeJS.Timeout => {
      const delay = 3000 + Math.random() * 2000; // 3-5 seconds
      return setTimeout(() => {
        blink();
        timeoutId = scheduleNextBlink();
      }, delay);
    };

    let timeoutId = scheduleNextBlink();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [avatar]);
}
