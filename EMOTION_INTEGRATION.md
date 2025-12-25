# Emotion Analysis Integration Guide

This document explains how the emotion analysis system works in this React application and how to connect it with your Python agent.

## Overview

The emotion analysis feature allows your agent to detect and display emotions in real-time during voice conversations. The system tracks both user emotions (from their speech) and agent emotions (from the agent's responses).

## Architecture

```
User speaks → Python Agent analyzes emotion → Sends via LiveKit data → React displays emoji
```

## React Components Created

### 1. Type Definitions (`lib/emotion-types.ts`)

Defines emotion types and configuration:
- `EmotionType`: TypeScript type for all supported emotions
- `EmotionData`: Interface for emotion data messages
- `EMOTION_CONFIG`: Configuration for each emotion (emoji, color, label)

**Supported emotions:**
- happy 😊
- sad 😢
- angry 😠
- anxious 😰
- surprised 😲
- grateful 🙏
- excited 🤩
- confused 😕
- neutral 😐

### 2. Emotion Display Component (`components/app/emotion-display.tsx`)

Displays animated emotion emojis with the following features:
- Smooth scale and rotation animations
- Different animations for each emotion type
- Configurable sizes (sm, md, lg)
- Optional labels
- Source indicator (user vs agent)

**Props:**
```typescript
interface EmotionDisplayProps {
  emotion: EmotionType;
  source?: 'user' | 'agent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  playSound?: boolean;
}
```

### 3. Emotion Data Hook (`hooks/useEmotionData.ts`)

Custom React hook that:
- Listens for LiveKit data messages
- Parses emotion data from the agent
- Maintains emotion state for both user and agent
- Tracks emotion history
- Triggers callbacks on emotion changes

**Returns:**
```typescript
interface EmotionState {
  userEmotion: EmotionType;
  agentEmotion: EmotionType;
  lastUpdate: number | null;
  history: EmotionData[];
}
```

### 4. Emotion History Components (`components/app/emotion-history.tsx`)

Two components for displaying emotion timeline:
- `EmotionHistory`: Detailed vertical list with timestamps
- `EmotionTimelineCompact`: Horizontal compact emoji timeline

### 5. Integration in SessionView and TileLayout

Modified files:
- `components/app/session-view.tsx`: Added `useEmotionData` hook
- `components/app/tile-layout.tsx`: Display emotions on agent visualization

## Python Agent Integration

### Step 1: Install Required Libraries (Optional)

For simple POC, you can use keyword matching (no extra libraries needed).

For advanced emotion detection:
```bash
pip install transformers torch
```

### Step 2: Add Emotion Analysis Function

Add this to your Python agent:

```python
import json
import time

def analyze_emotion(text: str) -> str:
    """
    Simple keyword-based emotion detection for POC.
    For production, replace with ML model (e.g., Hugging Face).
    """
    text_lower = text.lower()

    # Negative emotions
    if any(word in text_lower for word in ['fuck', 'angry', 'hate', 'mad', 'pissed', 'furious']):
        return 'angry'
    if any(word in text_lower for word in ['sad', 'depressed', 'down', 'unhappy', 'cry', 'crying']):
        return 'sad'
    if any(word in text_lower for word in ['worried', 'anxious', 'scared', 'afraid', 'nervous']):
        return 'anxious'

    # Positive emotions
    if any(word in text_lower for word in ['happy', 'great', 'awesome', 'excellent', 'wonderful', 'love', 'excited']):
        return 'happy'
    if any(word in text_lower for word in ['thank', 'thanks', 'appreciate', 'grateful']):
        return 'grateful'
    if any(word in text_lower for word in ['wow', 'amazing', 'incredible', 'surprised', 'omg']):
        return 'surprised'
    if any(word in text_lower for word in ['confused', 'unsure', 'unclear', 'don\'t understand']):
        return 'confused'

    return 'neutral'
```

### Step 3: Send Emotion Data to React

When your agent processes a message, send emotion data:

```python
async def send_emotion_data(room, emotion: str, source: str):
    """Send emotion data to the React frontend via LiveKit"""
    emotion_data = {
        'type': 'emotion',
        'emotion': emotion,
        'source': source,  # 'user' or 'agent'
        'timestamp': int(time.time() * 1000),  # milliseconds
        'confidence': 0.85  # optional
    }

    # Send as data message
    await room.local_participant.publish_data(
        json.dumps(emotion_data).encode('utf-8'),
        reliable=True
    )
```

### Step 4: Integrate in Your Agent's Message Handler

Example integration:

```python
async def on_user_message(text: str, room):
    """Handle user message and analyze emotion"""

    # 1. Analyze user's emotion
    user_emotion = analyze_emotion(text)
    await send_emotion_data(room, user_emotion, 'user')

    # 2. Generate agent response
    agent_response = await generate_agent_response(text)

    # 3. Analyze agent's emotion (from its own response)
    agent_emotion = analyze_emotion(agent_response)
    await send_emotion_data(room, agent_emotion, 'agent')

    # 4. Send the actual text response
    # (your existing code to send the response)

    return agent_response
```

## Testing the Integration

### 1. Start Your Python Agent
```bash
cd agent-starter-python
python your_agent.py
```

### 2. Start the React App
```bash
cd agent-starter-react
pnpm dev
```

### 3. Test Emotion Detection

Try saying phrases with different emotions:
- **Angry**: "I'm so frustrated with this!"
- **Happy**: "This is awesome!"
- **Sad**: "I'm feeling down today"
- **Grateful**: "Thank you so much!"
- **Surprised**: "Wow, that's amazing!"

You should see emojis appear on the agent visualization!

## Optional: Display Emotion History

To show the emotion timeline in your UI, add to `session-view.tsx`:

```typescript
import { EmotionHistory, EmotionTimelineCompact } from '@/components/app/emotion-history';

// Inside your component:
<EmotionHistory history={emotionState.history} maxItems={10} />

// Or use compact version:
<EmotionTimelineCompact history={emotionState.history} maxItems={20} />
```

## Advanced: Using ML Models for Emotion Detection

For production, replace the keyword matching with a proper emotion classifier:

```python
from transformers import pipeline

# Initialize emotion classifier (do this once at startup)
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=1
)

def analyze_emotion_ml(text: str) -> str:
    """ML-based emotion detection"""
    result = emotion_classifier(text)[0]
    emotion_label = result[0]['label'].lower()
    confidence = result[0]['score']

    # Map model labels to our emotion types
    emotion_map = {
        'joy': 'happy',
        'sadness': 'sad',
        'anger': 'angry',
        'fear': 'anxious',
        'surprise': 'surprised',
        'disgust': 'angry',
        'neutral': 'neutral'
    }

    return emotion_map.get(emotion_label, 'neutral')
```

## Troubleshooting

### Emotions not showing up?

1. **Check console logs**: Open browser DevTools, you should see "Emotion changed:" logs
2. **Verify Python agent is sending data**: Add `print()` statements in your Python agent
3. **Check LiveKit connection**: Ensure the agent is connected to the same room
4. **Verify data format**: Emotion data must have `type: 'emotion'` field

### Emojis not animating?

- Make sure `motion` (Framer Motion) is properly installed
- Check for console errors in browser DevTools

### Want to add custom emotions?

1. Add to `EmotionType` in `lib/emotion-types.ts`
2. Add emoji/color config to `EMOTION_CONFIG`
3. Update animation in `emotion-display.tsx`
4. Update Python agent's `analyze_emotion()` function

## Files Modified/Created

**Created:**
- `lib/emotion-types.ts` - Type definitions
- `components/app/emotion-display.tsx` - Emoji display component
- `hooks/useEmotionData.ts` - Emotion state management
- `components/app/emotion-history.tsx` - History/timeline components
- `EMOTION_INTEGRATION.md` - This documentation

**Modified:**
- `components/app/session-view.tsx` - Added emotion hook
- `components/app/tile-layout.tsx` - Added emotion overlays

## Next Steps

1. Test with your Python agent
2. Add sound effects (optional)
3. Experiment with different emotion detection methods
4. Add emotion analytics/statistics
5. Customize animations and styling

Good luck with your POC! 🚀
