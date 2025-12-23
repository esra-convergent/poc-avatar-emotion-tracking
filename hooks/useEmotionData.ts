'use client';

import { useEffect, useState } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant, type LocalParticipant, type Participant } from 'livekit-client';
import { type EmotionData, type EmotionType } from '@/lib/emotion-types';

export interface EmotionState {
  userEmotion: EmotionType;
  agentEmotion: EmotionType;
  lastUpdate: number | null;
  history: EmotionData[];
}

interface UseEmotionDataOptions {
  maxHistory?: number;
  onEmotionChange?: (emotion: EmotionData) => void;
}

export function useEmotionData(options: UseEmotionDataOptions = {}) {
  const { maxHistory = 50, onEmotionChange } = options;
  const session = useSessionContext();

  const [emotionState, setEmotionState] = useState<EmotionState>({
    userEmotion: 'neutral',
    agentEmotion: 'neutral',
    lastUpdate: null,
    history: [],
  });

  useEffect(() => {
    if (!session.room) return;

    console.log('✅ Emotion data listener attached');

    // Handler for data channel messages (from test panel)
    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
    ) => {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        console.log('📦 DATA RECEIVED:', text);
        const data = JSON.parse(text);

        // Check if this is emotion data
        if (data.type === 'emotion' && data.emotion && data.source) {
          console.log('✅ EMOTION from DATA:', data.emotion, 'from', data.source);
          processEmotionData(data);
        }
      } catch (error) {
        console.error('Error parsing emotion data from data channel:', error);
      }
    };

    // Handler for participant attributes (from Python agent)
    const handleAttributesChanged = (
      changedAttributes: Record<string, string>,
      participant: RemoteParticipant | LocalParticipant,
    ) => {
      try {
        console.log('🔔 ATTRIBUTES CHANGED:', changedAttributes, 'from', participant.identity);

        // Check if emotion attribute exists
        if (changedAttributes.emotion) {
          const emotionValue = changedAttributes.emotion;
          console.log('✅ EMOTION from ATTRIBUTES:', emotionValue);

          // Parse the emotion data
          const data = JSON.parse(emotionValue);
          processEmotionData(data);
        }
      } catch (error) {
        console.error('Error parsing emotion data from attributes:', error);
      }
    };

    // Shared processing function for emotion data
    const processEmotionData = (data: any) => {
      if (!data.emotion || !data.source) {
        console.warn('Invalid emotion data:', data);
        return;
      }

      // Normalize timestamp: Python agent may send seconds or milliseconds.
      let ts = data.timestamp ?? Date.now();
      // If timestamp looks like seconds (e.g. ~1.7e9), convert to ms
      if (typeof ts === 'number' && ts < 1e12) {
        ts = Math.floor(ts * 1000);
      }

      const emotionData: EmotionData = {
        type: 'emotion',
        emotion: data.emotion as EmotionType,
        source: data.source,
        timestamp: ts,
        confidence: data.confidence,
      };

      console.log('🎭 Processing emotion:', emotionData);

      // Update emotion state
      setEmotionState((prev) => {
        const newHistory = [...prev.history, emotionData].slice(-maxHistory);

        return {
          userEmotion:
            emotionData.source === 'user'
              ? emotionData.emotion
              : prev.userEmotion,
          agentEmotion:
            emotionData.source === 'agent'
              ? emotionData.emotion
              : prev.agentEmotion,
          lastUpdate: emotionData.timestamp,
          history: newHistory,
        };
      });

      // Call callback if provided
      onEmotionChange?.(emotionData);
    };

    // Listen for data messages from the room (test panel)
    session.room.on(RoomEvent.DataReceived, handleDataReceived);

    // Listen for participant attributes changes (Python agent)
    session.room.on(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);

    return () => {
      session.room.off(RoomEvent.DataReceived, handleDataReceived);
      session.room.off(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);
    };
  }, [session, maxHistory, onEmotionChange]);

  return emotionState;
}
