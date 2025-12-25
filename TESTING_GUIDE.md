# Testing the Emotion Detection System

## ✅ Current Status

Both the frontend and backend are now running with emotion detection fully integrated!

- **React Frontend**: http://localhost:3001
- **Python Agent**: Running in background with emotion analysis
- **LiveKit Server**: `wss://emotion-test-k1t69r4e.livekit.cloud`

## 🧪 How to Test

### Option 1: Test with Buttons (No Voice Needed)

1. Open http://localhost:3001 in your browser
2. Click "Start call" to join the room
3. Look for two panels:
   - **Top-right**: Debug panel showing current emotions
   - **Bottom-left**: Test button panel
4. Click the emotion buttons (happy, sad, angry, etc.)
5. Watch the emoji appear on the agent visualization!

### Option 2: Test with Voice (Full Integration)

1. Open http://localhost:3001
2. Click "Start call"
3. **Allow microphone access**
4. Say emotional phrases:
   - "I'm so happy!" → Should show 😊
   - "I'm frustrated with this" → Should show 😠
   - "Thank you so much!" → Should show 🙏
   - "I'm feeling sad today" → Should show 😢
   - "Wow, that's amazing!" → Should show 😲

5. Watch:
   - The **debug panel** (top-right) update with emotions
   - The **emoji overlay** on the agent box
   - The **console logs** in browser DevTools (F12)

## 🔍 What to Look For

### In the Browser:
- **Agent emoji**: Small emoji in corner of agent visualization
- **Debug panel**: Shows "Agent: [emotion]" and "User: [emotion]"
- **Console logs**: "Emotion changed:" messages

### In the Python Agent Terminal:
Look for these logs:
```
INFO emotion_analyzer Detected emotion: happy in text: 'I'm so happy!'...
INFO agent Sent emotion data: happy (user)
INFO agent Sent emotion data: neutral (agent)
```

## �� Emotion List

| Emotion | Emoji | Trigger Words |
|---------|-------|---------------|
| Happy | 😊 | happy, great, awesome, love, excited |
| Sad | 😢 | sad, depressed, down, unhappy, cry |
| Angry | 😠 | angry, hate, mad, pissed, frustrated |
| Anxious | 😰 | worried, anxious, scared, afraid, nervous |
| Surprised | 😲 | wow, surprised, shocked, incredible |
| Grateful | 🙏 | thank, thanks, appreciate, grateful |
| Excited | 🤩 | excited, pumped, energized, thrilled |
| Confused | 😕 | confused, unsure, unclear, don't understand |
| Neutral | 😐 | (default when no emotion detected) |

## 🐛 Troubleshooting

### No emojis showing?

1. **Check browser console** (F12) - do you see "Emotion changed:" logs?
2. **Check Python agent terminal** - do you see "Sent emotion data:" logs?
3. **Try the test buttons** first (bottom-left panel) to verify React components work
4. **Check microphone** - make sure it's working and agent can hear you

### Python agent not running?

```bash
# In the React project folder:
cd python-agent
uv run python src/agent.py dev
```

### React app not running?

```bash
# In the React project root:
pnpm dev
```

### Emotions not detected from voice?

- The agent analyzes the **transcribed text**, not the tone of voice
- Use **clear emotional keywords** like "happy", "angry", "thank you"
- The emotion detection is keyword-based for this POC

## 🚀 Next Steps

Once you verify emotions work:

1. **Remove the debug panels** (in `session-view.tsx`)
2. **Adjust emotion placement** (make emojis bigger/smaller)
3. **Add sound effects** (optional)
4. **Try with avatar mode** (if you have LiveKit avatars configured)
5. **Improve emotion detection** (add more keywords or use ML models)

## 📁 Project Structure

```
agent-starter-react/
├── python-agent/                 # Python backend
│   └── src/
│       ├── agent.py             # Main agent (sends emotions)
│       └── emotion_analyzer.py  # Emotion detection logic
├── components/app/
│   ├── emotion-display.tsx      # Emoji component
│   ├── emotion-test-panel.tsx   # Test buttons
│   ├── session-view.tsx         # Main view (has debug panel)
│   └── tile-layout.tsx          # Shows emoji on agent
├── hooks/
│   └── useEmotionData.ts        # Emotion state management
└── lib/
    └── emotion-types.ts         # Type definitions

## 🎥 Demo Flow

1. User says: "I'm so excited about this!"
2. Python agent receives speech → transcribes to text
3. Emotion analyzer detects: "excited" 🤩
4. Agent sends data: `{type: 'emotion', emotion: 'excited', source: 'user'}`
5. React receives data → `useEmotionData` hook updates state
6. `EmotionDisplay` component shows animated 🤩 emoji
7. Debug panel shows: "User: 🤩 excited"

Enjoy testing! 🎉
