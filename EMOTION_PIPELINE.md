# Emotion Detection Pipeline - Complete Flow

This document shows the **complete end-to-end flow** of how emotions are detected, analyzed, sent, and displayed in the voice AI application.

---

## 🎯 Overview

The emotion system analyzes **ONLY user speech** (not agent responses) and displays the agent's "reaction face" as an emoji. The emoji represents how the agent is reacting to the user's emotional state.

---

## 📊 Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER SPEAKS                                  │
│                   "I'm so happy today!"                              │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Speech-to-Text (STT)                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Service: AssemblyAI Universal Streaming                           │
│ • Location: Python Agent (agent.py:98)                              │
│ • Input: Audio stream from user's microphone                        │
│ • Output: Text transcript "I'm so happy today!"                     │
│ • Timing: ~500ms after user stops speaking                          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: LLM Processing                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Service: OpenAI GPT-4.1-mini                                      │
│ • Location: Python Agent (agent.py:101)                             │
│ • Input: User transcript                                            │
│ • Process: LLM generates response                                   │
│ • Output: Agent response text                                       │
│ • Timing: 1-3 seconds (depending on response complexity)            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Conversation Item Added Event                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Event: "conversation_item_added"                                  │
│ • Location: Python Agent (agent.py:120)                             │
│ • Triggered: When user message is added to conversation history     │
│ • Data: event.item contains message with content and role           │
│                                                                      │
│ • Handler: on_conversation_item()                                   │
│   ├─ Check if message has content                                   │
│   ├─ Get message.role ("user" or "assistant")                       │
│   ├─ SKIP if role == "assistant" (don't analyze agent's own text)  │
│   ├─ Handle content as list or string                               │
│   └─ Extract transcript text                                        │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Emotion Analysis (Keyword Matching)                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Service: EmotionAnalyzer (keyword-based)                          │
│ • Location: python-agent/src/emotion_analyzer.py                    │
│ • Input: "I'm so happy today!"                                      │
│                                                                      │
│ • Process Flow:                                                     │
│   1. Convert text to lowercase: "i'm so happy today!"               │
│   2. Check keywords in ORDER (first match wins):                    │
│      ┌──────────────────────────────────────────────────────────┐  │
│      │ Order  Emotion    Keywords Checked                       │  │
│      ├──────────────────────────────────────────────────────────┤  │
│      │  1st   angry      fuck, angry, hate, mad, pissed...      │  │
│      │  2nd   sad        sad, depressed, down, unhappy...       │  │
│      │  3rd   anxious    worried, anxious, scared, afraid...    │  │
│      │  4th   grateful   thank, thanks, appreciate, grateful... │  │
│      │  5th   surprised  wow, surprised, shocked, omg...        │  │
│      │  6th   happy      happy, great, awesome, love...  ✓      │  │
│      └──────────────────────────────────────────────────────────┘  │
│   3. Found "happy" keyword in text                                  │
│                                                                      │
│ • Output: "happy"                                                   │
│ • Timing: <10ms (instant keyword lookup)                            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Send Emotion Data                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Function: send_emotion_data()                                     │
│ • Location: Python Agent (agent.py:67-82)                           │
│                                                                      │
│ • Data Structure Created:                                           │
│   {                                                                  │
│     "type": "emotion",                                              │
│     "emotion": "happy",                                             │
│     "source": "agent",  // Agent's reaction to user                 │
│     "text": "I'm so happy today!",                                  │
│     "timestamp": 1735041234567,  // milliseconds                    │
│     "confidence": 1.0                                               │
│   }                                                                  │
│                                                                      │
│ • Transport Method: LiveKit Participant Attributes                  │
│   - Method: room.local_participant.set_attributes()                 │
│   - Key: "emotion"                                                  │
│   - Value: JSON string of emotion data                              │
│                                                                      │
│ • Timing: <50ms (async task, non-blocking)                          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    NETWORK TRANSMISSION                              │
│                  (LiveKit WebRTC signaling)                          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: Frontend Receives Emotion                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Hook: useEmotionData()                                            │
│ • Location: hooks/useEmotionData.ts                                 │
│                                                                      │
│ • Event Listener Setup (line 129):                                  │
│   session.room.on(                                                  │
│     RoomEvent.ParticipantAttributesChanged,                         │
│     handleAttributesChanged                                         │
│   )                                                                  │
│                                                                      │
│ • Handler Flow (lines 58-77):                                       │
│   1. Event fires with changedAttributes object                      │
│   2. Check if changedAttributes.emotion exists                      │
│   3. Parse JSON: JSON.parse(changedAttributes.emotion)              │
│   4. Call processEmotionData(data)                                  │
│                                                                      │
│ • Timing: <100ms (event propagation + parsing)                      │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: Process & Update State                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Function: processEmotionData()                                    │
│ • Location: hooks/useEmotionData.ts (lines 80-123)                  │
│                                                                      │
│ • Processing Steps:                                                 │
│   1. Validate data has emotion and source                           │
│   2. Normalize timestamp (handle seconds vs milliseconds)           │
│   3. Create EmotionData object                                      │
│   4. Update React state via setEmotionState()                       │
│                                                                      │
│ • State Update Logic (lines 104-119):                               │
│   - If source === "agent": Update agentEmotion = "happy"           │
│   - If source === "user": Update userEmotion                        │
│   - Add to history array (keep last 50 items)                       │
│   - Update lastUpdate timestamp                                     │
│                                                                      │
│ • Result: Component re-renders with new emotion                     │
│ • Timing: <50ms (React state update)                                │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 8: Emoji Display Updates                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Component: EmotionDisplay                                         │
│ • Location: components/app/emotion-display.tsx                      │
│                                                                      │
│ • Render Flow:                                                      │
│   1. Receives prop: emotion="happy"                                 │
│   2. Look up config: EMOTION_CONFIG["happy"]                        │
│      {                                                               │
│        emoji: "😊",                                                  │
│        color: "#10b981", // green                                   │
│        label: "Happy"                                               │
│      }                                                               │
│   3. Trigger re-animation (useEffect on emotion change)             │
│   4. Render with Framer Motion animations                           │
│                                                                      │
│ • Animation (lines 54-78):                                          │
│   - Initial: scale=0, opacity=0                                     │
│   - Animate: scale=1.1, rotate=5, opacity=1                         │
│   - Transition: Spring animation (stiffness=300, damping=25)        │
│                                                                      │
│ • Visual Result: 😊 appears with bounce/rotate animation            │
│ • Timing: ~300ms animation duration                                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USER SEES EMOJI: 😊                               │
└─────────────────────────────────────────────────────────────────────┘

```

---

## ⏱️ Total Timing Breakdown

| Step | Process | Typical Duration |
|------|---------|------------------|
| 1 | STT Transcription | ~500ms |
| 2 | LLM Processing | 1-3 seconds |
| 3 | Event Trigger | <10ms |
| 4 | Emotion Analysis | <10ms |
| 5 | Send via Attributes | <50ms |
| 6 | Network + Event Handling | ~100ms |
| 7 | React State Update | <50ms |
| 8 | Animation Render | ~300ms |
| **TOTAL** | **End-to-End Latency** | **~2-4 seconds** |

**Note**: The main delay (1-3 seconds) is from the LLM processing the user's message. The emotion analysis itself is instant (<10ms), but we have to wait for the `conversation_item_added` event which fires after LLM processing.

---

## 🔧 Technical Details

### Why Use `conversation_item_added` Event?

The event fires when a conversation item (user or agent message) is added to the conversation history. This happens:

- **For user messages**: After STT transcription AND LLM starts processing
- **For agent messages**: After LLM generates the response

We filter to ONLY process user messages (skip when `role === "assistant"`).

### Why Not Use Earlier Events?

Earlier events like `user_transcript_received` or `user_speech_committed` don't work reliably in the current LiveKit Agents SDK version (1.3.9) when using the `AgentSession` pipeline architecture.

### Data Transport: Why Participant Attributes?

**Participant Attributes** are the recommended way to send custom metadata in LiveKit:
- ✅ Automatically synchronized across all participants
- ✅ Triggers `ParticipantAttributesChanged` events
- ✅ Persists during the session
- ✅ Works with local participant (agent can send to itself)

**Data Channel** would require:
- ❌ Manual message routing
- ❌ Doesn't work for local participant loopback
- ❌ More complex event handling

---

## 📁 File Reference Map

| File | Purpose | Key Functions/Components |
|------|---------|-------------------------|
| `python-agent/src/agent.py` | Main agent logic, STT, LLM, emotion hooks | `my_agent()`, `on_conversation_item()`, `send_emotion_data()` |
| `python-agent/src/emotion_analyzer.py` | Keyword-based emotion detection | `EmotionAnalyzer.analyze()`, `EMOTION_KEYWORDS` |
| `hooks/useEmotionData.ts` | React hook to receive and process emotions | `useEmotionData()`, `handleAttributesChanged()`, `processEmotionData()` |
| `lib/emotion-types.ts` | TypeScript types and emoji config | `EmotionType`, `EmotionData`, `EMOTION_CONFIG` |
| `components/app/emotion-display.tsx` | Animated emoji display component | `EmotionDisplay` |
| `components/app/emotion-test-panel.tsx` | Debug panel for manual testing | `sendTestEmotion()` |

---

## 🎨 Emotion Configuration

Each emotion has configuration in `lib/emotion-types.ts`:

```typescript
{
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
  // ... etc
}
```

---

## 🔍 Debugging the Pipeline

### Python Agent Logs

```bash
# Start the agent with logging
cd python-agent
uv run python src/agent.py dev
```

Look for these log messages:
1. `Setting up emotion analysis hooks...` - Hooks initialized
2. `✅ Emotion hooks registered` - Ready to detect
3. `🎭 USER said: <text>` - User message received
4. `🎭 Agent's REACTION emotion: <emotion>` - Emotion detected
5. `📤 Sent emotion via attributes: <emotion> (agent)` - Sent to frontend

### Browser Console Logs

Look for these console messages:
1. `✅ Emotion data listener attached` - Hook is listening
2. `🔔 ATTRIBUTES CHANGED:` - Received attribute change
3. `✅ EMOTION from ATTRIBUTES:` - Parsed emotion data
4. `🎭 Processing emotion:` - Updating state

### Common Issues

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| No emoji appears | Event handler not firing | Check Python logs for `🎭 USER said` |
| Emoji doesn't update | Frontend not receiving | Check browser console for `ATTRIBUTES CHANGED` |
| Wrong emoji shows | Keyword mismatch | Check `emotion_analyzer.py` keyword order |
| Emoji updates slowly | LLM processing delay | Normal - emotion fires after LLM processes |

---

## 🚀 Performance Optimization

Current bottleneck: **LLM Processing (1-3 seconds)**

The emotion detection itself is nearly instant (<10ms keyword matching), but we're limited by when the `conversation_item_added` event fires, which is after LLM processing begins.

Potential future optimizations:
1. Use streaming STT with interim results
2. Hook into earlier pipeline events (if SDK supports it)
3. Run emotion analysis in parallel with LLM (requires different event)

---

## 📝 Example Flow with Logs

**User says**: "I'm so happy today!"

**Python Terminal**:
```
DEBUG  livekit.agents  received user transcript {"user_transcript": "I'm so happy today!"}
INFO   agent           🎭 USER said: I'm so happy today!
INFO   emotion_analyzer Detected emotion: happy in text: 'I'm so happy today!'
INFO   agent           🎭 Agent's REACTION emotion: happy
INFO   agent           📤 Sent emotion via attributes: happy (agent) - I'm so happy today!
```

**Browser Console**:
```javascript
🔔 ATTRIBUTES CHANGED: {emotion: '{"type":"emotion","emotion":"happy",...}'} from agent-xyz
✅ EMOTION from ATTRIBUTES: {"type":"emotion","emotion":"happy","source":"agent",...}
🎭 Processing emotion: {type: 'emotion', emotion: 'happy', source: 'agent', timestamp: 1735041234567}
```

**Visual Result**: 😊 emoji appears with bounce animation

---

## 🎯 Summary

The emotion pipeline is a **reactive system** that:

1. **Listens** to user speech
2. **Transcribes** it via STT (AssemblyAI)
3. **Waits** for LLM to process (OpenAI GPT-4.1-mini)
4. **Analyzes** the transcript for emotion keywords
5. **Sends** emotion data via LiveKit participant attributes
6. **Receives** it in React via event listeners
7. **Updates** React state
8. **Renders** animated emoji

The system is designed to be **stable** (only analyzes user text) and **visual** (agent's reaction face), making it perfect for a POC demonstration.
