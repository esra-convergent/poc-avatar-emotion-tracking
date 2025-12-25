# VRM Avatar Setup & Testing Guide

## ✅ What's Been Implemented

You now have a **complete VRM avatar system** integrated into your LiveKit room:

### 🎯 Core Features
- ✅ **3D VRM Avatar Rendering** (Three.js + @pixiv/three-vrm)
- ✅ **Real-time Lip-Sync** (Audio-reactive mouth movements)
- ✅ **Emotion Expressions** (9 emotions mapped to VRM expressions)
- ✅ **LiveKit Integration** (Seamlessly works with existing agent)
- ✅ **Configuration System** (Enable/disable via app-config.ts)

### 📁 New Files Created

```
components/avatar/
├── VRMAvatarAgent.tsx           # Main avatar component
├── useVRMLoader.ts              # VRM model loader hook
├── useAudioAnalyzer.ts          # Lip-sync audio analysis
├── useExpressionController.ts   # Emotion → expression mapping
└── AgentAudioRenderer.tsx       # Audio element extractor

public/avatars/
└── README.md                    # VRM download instructions

Modified Files:
├── components/app/tile-layout.tsx  # Avatar integration
├── app-config.ts                   # Avatar configuration
└── package.json                    # Three.js dependencies
```

---

## 🚀 Getting Started

### Step 1: Get a VRM Avatar

**Option A: Download Free VRM (Fastest)**
1. Visit: https://hub.vroid.com/en/models
2. Search for "free" models
3. Download a `.vrm` file
4. Place it in: `public/avatars/default-avatar.vrm`

**Option B: Create Your Own**
1. Download VRoid Studio: https://vroid.com/en/studio
2. Create a character (10-30 min)
3. Export as `.vrm`
4. Save to: `public/avatars/default-avatar.vrm`

**Recommended Free Models:**
- **Alicia Solid**: https://hub.vroid.com/en/models/4470669254079636467
- **Vita**: https://hub.vroid.com/en/models/3950947931160012012

### Step 2: Configure Avatar

Edit [`app-config.ts`](app-config.ts):

```typescript
avatar: {
  enabled: true,  // Set to false to use bar visualizer instead
  vrmUrl: '/avatars/default-avatar.vrm',  // Your VRM file path
  allowCustomUpload: false,  // Future feature
}
```

### Step 3: Run the Application

```bash
# Build and run frontend
pnpm run dev

# In another terminal, run Python agent
cd python-agent
python src/agent.py dev
```

### Step 4: Test the System

1. **Navigate to**: http://localhost:3000
2. **Click "Start call"**
3. **Speak to the agent**

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] **Avatar Loads**: 3D character appears (may take 5-10 seconds)
- [ ] **No Errors**: Check browser console (F12) for errors
- [ ] **Smooth Rendering**: Avatar renders at ~60 FPS

### Lip-Sync Tests

- [ ] **Agent Speaks**: Avatar's mouth moves when agent talks
- [ ] **Synced Movement**: Mouth opens/closes with audio volume
- [ ] **Natural Motion**: Movement looks realistic (not jittery)

### Emotion Tests

Use the **Emotion Test Panel** (if enabled) or speak trigger phrases:

| Phrase | Expected Emotion | Avatar Expression |
|--------|-----------------|-------------------|
| "I'm frustrated" | angry | Angry/frown face |
| "That's amazing!" | happy | Smile/happy face |
| "I'm grateful" | grateful | Happy face |
| "I'm confused" | confused | Neutral/relaxed |
| "Wow!" | surprised | Surprised face |

### Animation Tests

- [ ] **Auto-Blink**: Avatar blinks every 3-5 seconds
- [ ] **Expression Changes**: Emotions update within 2-4 seconds
- [ ] **Smooth Transitions**: No jerky movements between expressions

---

## 🔧 Troubleshooting

### Avatar Doesn't Load

**Symptoms**: Loading spinner forever, or error message

**Fixes**:
1. Check file exists: `ls public/avatars/default-avatar.vrm`
2. Check browser console for CORS errors
3. Verify VRM file is valid (open in VRoid Studio)
4. Try a different VRM file

**Debug**:
```javascript
// Check in browser console:
fetch('/avatars/default-avatar.vrm')
  .then(r => console.log('VRM fetch:', r.status))
```

### No Lip Movement

**Symptoms**: Avatar renders but mouth doesn't move

**Fixes**:
1. Check browser console for audio analyzer errors
2. Ensure agent is actually speaking (TTS working)
3. Check if audio is playing (not muted)
4. Try refreshing the page

**Debug**:
Open browser console, check for `AgentAudioRenderer` logs:
```typescript
// In AgentAudioRenderer.tsx, temporarily add:
console.log('Audio element:', audioRef.current);
console.log('Agent participant:', agentParticipant);
```

### Emotions Don't Change

**Symptoms**: Avatar face stays neutral

**Fixes**:
1. Verify emotion system is working (check emoji overlay)
2. Test with Emotion Test Panel
3. Check if VRM has expression support

**Debug**:
```typescript
// In useExpressionController.ts, add:
console.log('Setting emotion:', emotion, 'VRM expression:', EMOTION_TO_VRM_EXPRESSION[emotion]);
```

### Poor Performance (Lag)

**Symptoms**: Avatar stutters, low FPS

**Fixes**:
1. Use a simpler VRM model (< 20K polygons)
2. Reduce pixel ratio in [`VRMAvatarAgent.tsx:61`](components/avatar/VRMAvatarAgent.tsx#L61):
   ```typescript
   renderer.setPixelRatio(1); // Instead of Math.min(window.devicePixelRatio, 2)
   ```
3. Disable anti-aliasing:
   ```typescript
   const renderer = new THREE.WebGLRenderer({
     canvas,
     alpha: true,
     antialias: false, // Disable this
   });
   ```

### VRM Has No Expressions

**Symptoms**: Mouth doesn't move, no emotion changes

**Issue**: Some VRM models lack expression/viseme data

**Fix**: Use a VRoid Studio-generated VRM (they always have expressions)

---

## 🎛️ Configuration Options

### Toggle Avatar On/Off

To switch back to bar visualizer:

[`app-config.ts`](app-config.ts):
```typescript
avatar: {
  enabled: false,  // Use bar visualizer instead
  vrmUrl: '/avatars/default-avatar.vrm',
}
```

### Use Custom VRM URL

```typescript
avatar: {
  enabled: true,
  vrmUrl: '/avatars/my-custom-avatar.vrm',  // Your custom file
}
```

### Adjust Emotion Mapping

Edit [`useExpressionController.ts:8-18`](components/avatar/useExpressionController.ts#L8-L18):

```typescript
const EMOTION_TO_VRM_EXPRESSION: Record<EmotionType, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  anxious: 'sad',      // Change this
  surprised: 'surprised',
  grateful: 'happy',
  excited: 'happy',
  confused: 'relaxed',
  neutral: 'relaxed',
};
```

### Adjust Lip-Sync Sensitivity

Edit [`useExpressionController.ts:46`](components/avatar/useExpressionController.ts#L46):

```typescript
const mouthValue = volume * 0.7; // Increase to 1.0 for more exaggerated movement
```

### Change Camera Angle

Edit [`VRMAvatarAgent.tsx:72`](components/avatar/VRMAvatarAgent.tsx#L72):

```typescript
camera.position.set(0, 1.3, 2.5); // (x, y, z)
// Examples:
// (0, 1.5, 3.0) - Further away, higher angle
// (0, 1.2, 2.0) - Closer, more intimate
// (0.5, 1.3, 2.5) - Slightly to the side
```

---

## 📊 How It Works

### Data Flow

```
User speaks → AssemblyAI STT → OpenAI LLM → Cartesia TTS
                                                  ↓
                                           Audio Track
                                                  ↓
                                    AgentAudioRenderer (extracts <audio>)
                                                  ↓
                                    useAudioAnalyzer (Web Audio API)
                                                  ↓
                                            volume (0-1)
                                                  ↓
                                    useExpressionController
                                                  ↓
                                    vrm.expressionManager.setValue('aa', volume)
                                                  ↓
                                          Avatar mouth moves
```

### Emotion Flow

```
User: "I'm frustrated"
       ↓
Python emotion_analyzer.py → detects "angry"
       ↓
room.local_participant.set_attributes({"emotion": {...}})
       ↓
useEmotionData() hook → agentEmotion = 'angry'
       ↓
useExpressionController → vrm.expressionManager.setValue('angry', 1.0)
       ↓
Avatar face changes to angry
```

---

## 🎨 Advanced Customization

### Add Head Tracking

Edit [`VRMAvatarAgent.tsx`](components/avatar/VRMAvatarAgent.tsx), in animation loop:

```typescript
// Make avatar look at camera
if (vrm.lookAt) {
  vrm.lookAt.target = camera.position;
}
```

### Add Idle Animations

```typescript
// Slight breathing movement
const breathPhase = Math.sin(clock.elapsedTime * 2) * 0.01;
vrm.scene.position.y = breathPhase;
```

### Multiple Avatars

Create different VRM files and switch based on user preference:

```typescript
const avatarOptions = {
  alice: '/avatars/alice.vrm',
  bob: '/avatars/bob.vrm',
  custom: '/avatars/user-uploaded.vrm',
};

<VRMAvatarAgent vrmUrl={avatarOptions[selectedAvatar]} ... />
```

---

## 🚨 Common Errors

### `Cannot read properties of undefined (reading 'expressionManager')`

**Cause**: VRM not loaded yet
**Fix**: Already handled by conditional checks, but ensure VRM file is valid

### `Failed to execute 'createMediaElementSource' on 'AudioContext'`

**Cause**: Audio element already connected to another audio context
**Fix**: Already handled with try-catch, should not affect functionality

### `THREE.WebGLRenderer: Context Lost`

**Cause**: GPU driver crash or memory issue
**Fix**: Refresh page, reduce VRM complexity

### CORS Error Loading VRM

**Cause**: VRM file served from external domain without CORS headers
**Fix**: Place VRM in `public/avatars/` folder (served from same origin)

---

## 🎯 Next Steps

### Immediate Actions

1. **Download a VRM**: Get a free VRM from VRoid Hub
2. **Place in folder**: Save as `public/avatars/default-avatar.vrm`
3. **Test the system**: Run `pnpm run dev` and start a call

### Future Enhancements

**Phase 1 (Easy)**:
- [ ] Add avatar selection UI (dropdown or buttons)
- [ ] Add loading progress indicator
- [ ] Add error recovery (fallback to bar visualizer)

**Phase 2 (Medium)**:
- [ ] Implement phoneme-based lip-sync (instead of volume)
- [ ] Add ML-based emotion detection (replace keyword matching)
- [ ] Add avatar customization (hair, clothes, accessories)

**Phase 3 (Advanced)**:
- [ ] User avatar upload system
- [ ] Real-time avatar switching during call
- [ ] Multiple avatar scenes (office, park, etc.)
- [ ] Avatar gestures and hand movements

---

## 📚 Resources

### VRM Resources
- **VRM Specification**: https://vrm.dev/en/
- **VRoid Hub**: https://hub.vroid.com/en/
- **VRoid Studio**: https://vroid.com/en/studio
- **Three-VRM Docs**: https://github.com/pixiv/three-vrm

### Learning Resources
- **Three.js Fundamentals**: https://threejs.org/manual/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **VRM Tutorial**: https://www.youtube.com/watch?v=YIiZ6p5QKUA

---

## ✨ Summary

**You now have:**
- ✅ Full VRM avatar integration
- ✅ Real-time lip-sync
- ✅ Emotion-driven expressions
- ✅ Configuration system
- ✅ Production-ready POC

**All you need:**
- 📥 Download a VRM file
- 📂 Place in `public/avatars/`
- 🚀 Run the app

**Result:**
- 🎭 Lifelike AI agent with talking, emoting 3D avatar
- 🆓 Completely free, no external APIs
- 🔓 Zero vendor lock-in

---

Need help? Check the troubleshooting section or review the implementation in:
- [`AVATAR_INTEGRATION_PIPELINE.md`](AVATAR_INTEGRATION_PIPELINE.md) - Full technical pipeline
- [`EMOTION_TEST_GUIDE.md`](EMOTION_TEST_GUIDE.md) - Emotion testing phrases
