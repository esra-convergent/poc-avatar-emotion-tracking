# Emotion Detection Test Guide

This guide shows you exactly what to say to test each emotion in the voice AI agent.

## How Emotion Detection Works

The agent analyzes **only YOUR speech** (not its own responses) using keyword matching. When you say certain words, it triggers the corresponding emotion emoji as the agent's "reaction face."

---

## Test Phrases by Emotion

### 😊 Happy
**Keywords**: happy, great, awesome, love, excited, amazing, wonderful, fantastic, excellent, good, joy, delighted, pleased

**What to say**:
- "I'm so happy today!"
- "This is awesome!"
- "I love this feature!"
- "That's fantastic, thank you!"
- "I'm feeling great!"
- "This is excellent work!"
- "What a wonderful day!"

---

### 😢 Sad
**Keywords**: sad, depressed, down, unhappy, cry, crying, miserable, disappointed, upset, terrible, awful, bad

**What to say**:
- "I'm feeling really sad"
- "This is terrible"
- "I'm so disappointed"
- "I feel awful today"
- "Things are going bad"
- "I'm feeling down"
- "This makes me unhappy"

---

### 😠 Angry
**Keywords**: fuck, angry, hate, mad, pissed, annoyed, furious, irritated, rage, frustrated, damn, shit

**What to say**:
- "I'm so angry right now"
- "This is so frustrating!"
- "I hate when this happens"
- "I'm really mad about this"
- "This is so annoying!"
- "I'm pissed off"
- "This makes me furious"

---

### 😰 Anxious
**Keywords**: worried, anxious, scared, afraid, nervous, concerned, stress, stressed, panic, fear, overwhelming

**What to say**:
- "I'm feeling anxious about this"
- "I'm really worried"
- "This is so stressful"
- "I'm scared this won't work"
- "I'm nervous about the presentation"
- "This feels overwhelming"
- "I have so much stress"

---

### 😲 Surprised
**Keywords**: wow, surprised, shocked, incredible, unbelievable, omg, no way, can't believe

**What to say**:
- "Wow, that's amazing!"
- "I'm so surprised!"
- "That's incredible!"
- "No way, really?"
- "I can't believe it!"
- "OMG that's crazy!"
- "I'm shocked!"

---

### 🙏 Grateful
**Keywords**: thank, thanks, appreciate, grateful, gratitude, appreciated, thankful

**What to say**:
- "Thank you so much!"
- "I really appreciate this"
- "I'm so grateful for your help"
- "Thanks a lot!"
- "I'm very thankful"
- "I appreciate your time"

---

### 🤩 Excited
**Keywords**: excited (also matches "happy" keywords like: awesome, amazing, love)

**What to say**:
- "I'm so excited about this!"
- "I can't wait, this is amazing!"
- "I'm super excited for tomorrow!"

**Note**: "excited" is in the "happy" keyword list, so it will trigger happy 😊. To get excited 🤩, you need to add it to the emotion analyzer.

---

### 😕 Confused
**Keywords**: confused, don't understand, unclear, puzzled, lost

**What to say**:
- "I'm confused about this"
- "I don't understand"
- "This is unclear"
- "I'm lost here"

**Note**: Currently not in the Python emotion analyzer. Returns neutral by default.

---

### 😐 Neutral
**Default**: Returns when no emotion keywords are detected

**What to say**:
- "What time is it?"
- "Tell me about the weather"
- "How does this work?"
- Any sentence without emotion keywords

---

## Testing Tips

### 🎯 Best Practices

1. **Speak clearly** - The STT (AssemblyAI) needs to hear you clearly
2. **Use keyword** - Make sure your sentence includes at least one keyword from the list
3. **One emotion at a time** - Don't mix emotions in the same sentence
4. **Wait for response** - Let the agent respond before testing the next emotion

### 🔍 Debugging

**Check the Terminal Logs** to see what's happening:
```
🎭 USER said: I'm so happy today
🎭 Agent's REACTION emotion: happy
📤 Sent emotion via attributes: happy (agent) - I'm so happy today
```

**Check the Browser Console** to see if frontend receives it:
```
🔔 ATTRIBUTES CHANGED: {emotion: '{"type":"emotion",...}'} from agent-...
✅ EMOTION from ATTRIBUTES: {"type":"emotion","emotion":"happy","source":"agent",...}
🎭 Processing emotion: {type: 'emotion', emotion: 'happy', source: 'agent', ...}
```

### 🧪 Using the Test Panel

If you want to test without voice:
1. Click the **"Start call"** button first
2. Use the **test panel** in the bottom-left corner
3. Click any emotion button to send it directly
4. The panel works without needing the Python agent running

---

## Quick Test Sequence

Try saying these in order to test all emotions quickly:

1. "I'm so happy to test this!" → 😊 Happy
2. "Thank you for building this!" → 🙏 Grateful
3. "Wow, this is incredible!" → 😲 Surprised
4. "I'm a bit worried it might break" → 😰 Anxious
5. "I'm frustrated with this bug" → 😠 Angry
6. "This error makes me sad" → 😢 Sad
7. "What's the current time?" → 😐 Neutral

---

## Troubleshooting

### Emoji Not Updating?

1. **Check if Python agent is running**:
   ```bash
   cd python-agent
   uv run python src/agent.py dev
   ```

2. **Check terminal logs** - Should see `🎭 USER said:` messages

3. **Check browser console** - Should see `ATTRIBUTES CHANGED` messages

4. **Make sure you clicked "Start call"** - The session must be active

### Emoji Shows Wrong Emotion?

The keyword detection is **order-dependent**. It checks in this order:
1. Angry (checked first)
2. Sad
3. Anxious
4. Grateful
5. Surprised
6. Happy (checked last)

**Example**: "I'm so fucking happy!" will trigger **angry** 😠 (not happy) because "fuck" is checked before "happy"

To avoid this, use pure emotion keywords without mixing negative words.

---

## Next Steps

Want to customize the emotions or keywords? Check:
- **Keyword mappings**: `python-agent/src/emotion_analyzer.py`
- **Emotion config** (emojis, colors): `lib/emotion-types.ts`
- **Add new emotions**: Update both files + update TypeScript types
