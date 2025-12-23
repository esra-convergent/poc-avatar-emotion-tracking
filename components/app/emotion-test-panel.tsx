'use client';

import { useSessionContext } from '@livekit/components-react';
import type { EmotionType } from '@/lib/emotion-types';

const TEST_EMOTIONS: EmotionType[] = [
  'happy',
  'sad',
  'angry',
  'anxious',
  'surprised',
  'grateful',
  'excited',
  'confused',
  'neutral',
];

export function EmotionTestPanel() {
  const session = useSessionContext();
  const isConnected = !!session.room;

  const sendTestEmotion = async (emotion: EmotionType, source: 'user' | 'agent') => {
    if (!session.room) {
      alert('⚠️ Please start the call first by clicking "Start call" button!');
      return;
    }

    const emotionData = {
      type: 'emotion',
      emotion: emotion,
      source: source,
      timestamp: Date.now(),
      confidence: 1.0,
    };

    try {
      // Send via participant attributes (like the Python agent does)
      const emotionJson = JSON.stringify(emotionData);
      await session.room.localParticipant.setAttributes({ emotion: emotionJson });
      console.log('📤 Sent test emotion via attributes:', emotionData);
    } catch (error) {
      console.error('Failed to send emotion:', error);
    }
  };

  return (
    <div className="fixed bottom-40 left-4 z-[60] bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold">🧪 Test Emotion Sender</div>
        <div className="flex items-center gap-1">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-[10px] text-muted-foreground">
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      {!isConnected && (
        <div className="mb-3 text-[10px] bg-yellow-500/20 text-yellow-200 p-2 rounded border border-yellow-500/50">
          ⚠️ Click "Start call" to connect first!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Send as Agent:</div>
          <div className="flex flex-wrap gap-1">
            {TEST_EMOTIONS.map((emotion) => (
              <button
                key={`agent-${emotion}`}
                onClick={() => sendTestEmotion(emotion, 'agent')}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-[10px] transition-colors"
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Send as User:</div>
          <div className="flex flex-wrap gap-1">
            {TEST_EMOTIONS.map((emotion) => (
              <button
                key={`user-${emotion}`}
                onClick={() => sendTestEmotion(emotion, 'user')}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-[10px] transition-colors"
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[9px] text-muted-foreground">
        Click buttons to test emotion display without Python agent
      </div>
    </div>
  );
}
