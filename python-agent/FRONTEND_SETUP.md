# Frontend Setup Guide - Emotion Display

This guide explains how to set up the React frontend to display emotions from your LiveKit voice agent.

## Quick Start

### 1. Clone the React Frontend

```bash
cd ~
git clone https://github.com/livekit-examples/agent-starter-react
cd agent-starter-react
npm install
```

### 2. Configure Environment

Copy the `.env.example` to `.env.local` and add your LiveKit credentials (same as the Python agent):

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
LIVEKIT_URL=your-livekit-url
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### 3. Add Emotion Display Components

Copy the following files to your React project:

#### File 1: `components/app/emotion-display.tsx`

```typescript
"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

export type EmotionType = "happy" | "sad" | "angry" | "anxious" | "surprised" | "grateful" | "neutral";

const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  anxious: "😰",
  surprised: "😲",
  grateful: "🙏",
  neutral: "😐",
};

const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: "bg-green-500/20 border-green-500",
  sad: "bg-blue-500/20 border-blue-500",
  angry: "bg-red-500/20 border-red-500",
  anxious: "bg-yellow-500/20 border-yellow-500",
  surprised: "bg-purple-500/20 border-purple-500",
  grateful: "bg-pink-500/20 border-pink-500",
  neutral: "bg-gray-500/20 border-gray-500",
};

const EMOTION_LABELS: Record<EmotionType, string> = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  anxious: "Anxious",
  surprised: "Surprised",
  grateful: "Grateful",
  neutral: "Neutral",
};

interface EmotionDisplayProps {
  emotion: EmotionType;
  source?: "user" | "agent";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EmotionDisplay({
  emotion,
  source,
  showLabel = true,
  size = "md",
}: EmotionDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [emotion]);

  const sizeClasses = {
    sm: "text-3xl p-2",
    md: "text-5xl p-4",
    lg: "text-7xl p-6",
  };

  if (!isVisible && emotion === "neutral") {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={`
        flex flex-col items-center justify-center gap-2
        rounded-2xl border-2
        ${EMOTION_COLORS[emotion]}
        ${sizeClasses[size]}
        backdrop-blur-sm
        shadow-lg
      `}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.5,
          repeat: emotion !== "neutral" ? 2 : 0,
        }}
      >
        {EMOTION_EMOJIS[emotion]}
      </motion.div>

      {showLabel && (
        <div className="text-sm font-medium text-white">
          {EMOTION_LABELS[emotion]}
          {source && (
            <span className="text-xs opacity-70 ml-1">
              ({source})
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Simple text-only emotion indicator
export function EmotionIndicator({ emotion }: { emotion: EmotionType }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{EMOTION_EMOJIS[emotion]}</span>
      <span className="text-sm font-medium">{EMOTION_LABELS[emotion]}</span>
    </div>
  );
}
```

#### File 2: `components/app/emotion-timeline.tsx` (Optional - for tracking emotion history)

```typescript
"use client";

import { EmotionType } from "./emotion-display";
import { useState, useEffect } from "react";

interface EmotionEvent {
  emotion: EmotionType;
  source: "user" | "agent";
  timestamp: number;
  text?: string;
}

interface EmotionTimelineProps {
  events: EmotionEvent[];
  maxEvents?: number;
}

const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  anxious: "😰",
  surprised: "😲",
  grateful: "🙏",
  neutral: "😐",
};

export function EmotionTimeline({ events, maxEvents = 10 }: EmotionTimelineProps) {
  const recentEvents = events.slice(-maxEvents).reverse();

  return (
    <div className="w-full max-w-md p-4 bg-black/20 rounded-lg backdrop-blur-sm">
      <h3 className="text-sm font-semibold mb-3 text-white">Emotion Timeline</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentEvents.map((event, index) => (
          <div
            key={`${event.timestamp}-${index}`}
            className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">{EMOTION_EMOJIS[event.emotion]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/80">
                  {event.source === "user" ? "You" : "Agent"}
                </span>
                <span className="text-xs text-white/50">
                  {new Date(event.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>
              {event.text && (
                <p className="text-xs text-white/70 truncate mt-1">
                  {event.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Update Session View to Listen for Emotions

In your `components/app/session-view.tsx`, add the emotion listener:

```typescript
import { useState, useEffect } from "react";
import { RoomEvent, RemoteParticipant } from "livekit-client";
import { EmotionDisplay, EmotionType } from "./emotion-display";

// Add to your SessionView component:
const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("neutral");
const [emotionSource, setEmotionSource] = useState<"user" | "agent">("user");

useEffect(() => {
  if (!session?.room) return;

  const handleDataReceived = (
    payload: Uint8Array,
    participant: RemoteParticipant
  ) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));

      if (data.type === "emotion") {
        console.log("Received emotion data:", data);
        setCurrentEmotion(data.emotion as EmotionType);
        setEmotionSource(data.source);
      }
    } catch (error) {
      console.error("Error parsing emotion data:", error);
    }
  };

  session.room.on(RoomEvent.DataReceived, handleDataReceived);

  return () => {
    session.room.off(RoomEvent.DataReceived, handleDataReceived);
  };
}, [session]);

// Then in your JSX, add the EmotionDisplay component somewhere visible:
<EmotionDisplay
  emotion={currentEmotion}
  source={emotionSource}
  size="lg"
/>
```

### 5. Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Test the Integration

1. Make sure your Python agent is running (`uv run python src/agent.py dev`)
2. Open the React frontend
3. Connect to the agent
4. Say something emotional like "I'm so happy!" or "I'm feeling sad today"
5. Watch the emotion display update in real-time!

## Customization Ideas

### Sound Effects

Add sound effects when emotions change:

```typescript
const playEmotionSound = (emotion: EmotionType) => {
  const audio = new Audio(\`/sounds/\${emotion}.mp3\`);
  audio.play().catch(console.error);
};

// In emotion listener:
setCurrentEmotion(data.emotion);
playEmotionSound(data.emotion);
```

### Vibration (Mobile)

Add haptic feedback on emotion changes:

```typescript
if (navigator.vibrate && emotion !== "neutral") {
  navigator.vibrate(200);
}
```

### Animated Background

Change the background color based on emotion:

```typescript
const EMOTION_BG_COLORS = {
  happy: "from-green-500/20 to-green-700/20",
  sad: "from-blue-500/20 to-blue-700/20",
  angry: "from-red-500/20 to-red-700/20",
  // ... etc
};

<div className={\`bg-gradient-to-br \${EMOTION_BG_COLORS[emotion]}\`}>
  {/* Your content */}
</div>
```

## Troubleshooting

### Emotions not appearing?

1. Check browser console for errors
2. Verify Python agent is running and connected
3. Check that LiveKit credentials match between agent and frontend
4. Add console.log to see if emotion data is being received

### Data channel not working?

- Ensure you're using `RoomEvent.DataReceived` (not `DataReceive`)
- Check that the agent is successfully publishing data (check agent logs)
- Verify participant is properly connected

## Next Steps

- Add emotion analytics/tracking
- Create emotion-based agent responses
- Add more sophisticated emotion detection (LLM-based)
- Implement emotion-triggered animations
- Add voice tone analysis for more accurate detection
