# Ready Player Me Avatar - Quick Start Guide

## ✅ Implementation Complete!

Your **Ready Player Me realistic human avatar** is now fully integrated and ready to test!

---

## 🎯 What's Been Built

### Core Features
- ✅ **Photorealistic 3D Avatar** (your avatar: `694bd631220569853f2ea05b`)
- ✅ **Real-time Lip-Sync** (audio-reactive jaw/mouth movements)
- ✅ **9 Emotion Expressions** (ARKit blendshapes)
- ✅ **Auto-Blinking** (natural eye blinks every 3-5 seconds)
- ✅ **LiveKit Integration** (works with existing emotion system)

### New Files Created

```
components/avatar/
├── ReadyPlayerMeAgent.tsx              # Main Ready Player Me component
├── useGLBLoader.ts                     # GLB avatar loader
├── useReadyPlayerMeExpressions.ts      # ARKit blendshapes controller
├── VRMAvatarAgent.tsx                  # VRM avatar (anime, backup)
├── useVRMLoader.ts                     # VRM loader (backup)
├── useAudioAnalyzer.ts                 # Lip-sync audio analysis
└── AgentAudioRenderer.tsx              # Audio element extractor
```

### Modified Files
- ✅ [`app-config.ts`](app-config.ts) - Avatar configuration
- ✅ [`tile-layout.tsx`](components/app/tile-layout.tsx) - Avatar rendering

---

## 🚀 How to Test

### Step 1: Start the Application

```bash
# Terminal 1: Frontend
pnpm run dev

# Terminal 2: Python Agent
cd python-agent
python src/agent.py dev
```

### Step 2: Open Browser

Navigate to: **http://localhost:3000**

### Step 3: Start Session

1. Click **"Start call"**
2. Grant microphone permissions
3. Wait ~5-10 seconds for avatar to load
4. **Your realistic human avatar should appear!**

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] **Avatar Loads**: Realistic 3D human appears (not anime)
- [ ] **Face Visible**: Camera is positioned to show head/shoulders
- [ ] **Smooth Rendering**: No lag, ~60 FPS
- [ ] **No Errors**: Check browser console (F12) for errors

### Lip-Sync Tests

When the agent speaks:
- [ ] **Jaw Opens**: Lower jaw moves down
- [ ] **Mouth Opens**: Lips part slightly
- [ ] **Synced to Audio**: Movement matches speech volume
- [ ] **Natural Motion**: Not too exaggerated

### Emotion Tests

Say these trigger phrases and watch the avatar's face:

| Your Phrase | Detected Emotion | Expected Avatar Expression |
|-------------|------------------|----------------------------|
| "I'm frustrated" | angry | Frown + furrowed brows |
| "That's amazing!" | happy | Smile + relaxed face |
| "I'm grateful" | grateful | Gentle smile |
| "Wow!" | surprised | Wide eyes + raised brows + open mouth |
| "I'm confused" | confused | Asymmetric brows + slight frown |
| "I'm sad" | sad | Deep frown + raised inner brows |

### Auto-Animation Tests

- [ ] **Blinking**: Avatar blinks every 3-5 seconds automatically
- [ ] **Both Eyes**: Left and right eyes blink together
- [ ] **Expression Changes**: Smooth transitions between emotions

---

## 🎛️ Configuration

### Current Settings

[`app-config.ts`](app-config.ts):
```typescript
avatar: {
  enabled: true,
  type: 'readyplayerme',
  glbUrl: 'https://models.readyplayer.me/694bd631220569853f2ea05b.glb',
}
```

### Switch Avatar Type

**To use VRM (anime) instead:**
```typescript
avatar: {
  enabled: true,
  type: 'vrm', // Change this
  vrmUrl: '/avatars/default-avatar.vrm',
}
```

**To disable avatar (use bar visualizer):**
```typescript
avatar: {
  enabled: false, // Change this
  type: 'readyplayerme',
}
```

### Use Different Ready Player Me Avatar

1. Create new avatar: https://demo.readyplayer.me/
2. Copy the `.glb` URL
3. Update config:
```typescript
avatar: {
  enabled: true,
  type: 'readyplayerme',
  glbUrl: 'https://models.readyplayer.me/YOUR_NEW_ID.glb',
}
```

---

## 🔧 Troubleshooting

### Avatar Not Loading

**Symptoms**: Infinite loading spinner

**Fixes**:
1. Check URL is accessible:
   ```
   https://models.readyplayer.me/694bd631220569853f2ea05b.glb
   ```
2. Open browser console (F12), look for CORS errors
3. Verify internet connection (avatar loads from external URL)
4. Try a different Ready Player Me avatar

**Debug**:
```javascript
// Open browser console, paste:
fetch('https://models.readyplayer.me/694bd631220569853f2ea05b.glb')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e))
```

### No Lip Movement

**Symptoms**: Avatar renders but mouth doesn't move

**Fixes**:
1. Verify agent is speaking (you should hear audio)
2. Check browser console for audio analyzer errors
3. Refresh the page
4. Check if audio is muted

**Debug**:
Open browser console, check for logs:
- `"Found head mesh: Wolf3D_Head"` ✅ Good
- `"Morph targets: [...]"` ✅ Should list blendshapes
- `"No morph targets found"` ❌ Avatar may not support expressions

### No Emotion Changes

**Symptoms**: Face stays neutral regardless of emotion

**Fixes**:
1. Test with Emotion Test Panel (if enabled)
2. Verify emotion detection is working (check emoji overlay)
3. Check browser console for expression controller errors
4. Try saying clear trigger phrases: "I'm angry", "I'm happy"

**Debug**:
```javascript
// In browser console, you should see:
// "Setting emotion: happy VRM expression: ..."
```

### Avatar Looks Wrong (Wrong Angle, Too Far, etc.)

**Symptoms**: Can't see face properly

**Fix**: Adjust camera position in [`ReadyPlayerMeAgent.tsx:73`](components/avatar/ReadyPlayerMeAgent.tsx#L73):

```typescript
// Current (head/shoulders view):
camera.position.set(0, 1.5, 1.2);

// Closer (face only):
camera.position.set(0, 1.6, 0.9);

// Further (full body):
camera.position.set(0, 1.0, 2.5);

// Angled view:
camera.position.set(0.3, 1.5, 1.2);
```

### Performance Issues (Lag, Low FPS)

**Symptoms**: Avatar stutters

**Fixes**:
1. Reduce pixel ratio in [`ReadyPlayerMeAgent.tsx:52`](components/avatar/ReadyPlayerMeAgent.tsx#L52):
   ```typescript
   renderer.setPixelRatio(1); // Instead of Math.min(2)
   ```
2. Disable anti-aliasing:
   ```typescript
   const renderer = new THREE.WebGLRenderer({
     canvas,
     alpha: true,
     antialias: false, // Change to false
   });
   ```
3. Use a simpler Ready Player Me avatar (fewer accessories)

### Avatar Has No Expressions

**Symptoms**: Blendshapes not working

**Issue**: Some Ready Player Me avatars may not have full ARKit blendshapes

**Fix**: Create a new avatar with default settings:
1. Visit: https://demo.readyplayer.me/
2. Use "From Photo" → Upload selfie
3. Keep default options (don't disable facial features)
4. Export as GLB

---

## 📊 ARKit Blendshapes Reference

Ready Player Me supports these facial expressions:

### Mouth (Lip-Sync)
- `jawOpen` - Main jaw opening (used for speech)
- `mouthOpen` - Mouth opening
- `mouthSmileLeft/Right` - Smile
- `mouthFrownLeft/Right` - Frown

### Brows (Emotions)
- `browInnerUp` - Worried/surprised look
- `browDownLeft/Right` - Angry/focused
- `browOuterUpLeft/Right` - Surprised

### Eyes
- `eyeBlinkLeft/Right` - Blinking
- `eyeWideLeft/Right` - Surprised eyes
- `eyeSquintLeft/Right` - Happy eyes

**Total**: 52 blendshapes (we use ~15 key ones)

---

## 🎨 Customization

### Adjust Emotion Intensity

Edit [`useReadyPlayerMeExpressions.ts:33-72`](components/avatar/useReadyPlayerMeExpressions.ts#L33-L72):

```typescript
const EMOTION_TO_ARKIT: Record<EmotionType, Record<string, number>> = {
  happy: {
    mouthSmileLeft: 0.9,  // Increase for bigger smile (0-1)
    mouthSmileRight: 0.9,
    eyeSquintLeft: 0.5,   // Increase for more squinting
    eyeSquintRight: 0.5,
  },
  // ... etc
}
```

### Adjust Lip-Sync Sensitivity

Edit [`useReadyPlayerMeExpressions.ts:115-120`](components/avatar/useReadyPlayerMeExpressions.ts#L115-L120):

```typescript
// More exaggerated mouth movement:
influences[jawOpenIndex] = volume * 1.0; // Increase from 0.6

// Less exaggerated:
influences[jawOpenIndex] = volume * 0.3; // Decrease from 0.6
```

### Change Camera Angle

Edit [`ReadyPlayerMeAgent.tsx:73`](components/avatar/ReadyPlayerMeAgent.tsx#L73):

```typescript
// Format: (x, y, z)
// x: left(-) / right(+)
// y: down(-) / up(+)
// z: close(-) / far(+)

camera.position.set(0, 1.5, 1.2);   // Current (front view)
camera.position.set(0.5, 1.5, 1.0); // Slight angle
camera.position.set(0, 1.8, 0.8);   // Higher, closer
```

### Improve Lighting

Edit [`ReadyPlayerMeAgent.tsx:78-85`](components/avatar/ReadyPlayerMeAgent.tsx#L78-L85):

```typescript
// Brighter lighting:
const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // Increase from 2

// Add rim light:
const rimLight = new THREE.DirectionalLight(0xffffff, 1);
rimLight.position.set(0, 0, -2);
scene.add(rimLight);
```

---

## 🔄 Data Flow

### Lip-Sync Flow
```
Agent speaks (Cartesia TTS)
    ↓
LiveKit Audio Track
    ↓
AgentAudioRenderer (<audio> element)
    ↓
useAudioAnalyzer (Web Audio API)
    ↓
volume (0-1 range)
    ↓
useReadyPlayerMeExpressions
    ↓
avatar.morphTargetInfluences['jawOpen'] = volume * 0.6
    ↓
Avatar's jaw opens/closes in real-time
```

### Emotion Flow
```
User: "I'm angry"
    ↓
Python emotion_analyzer.py → "angry"
    ↓
LiveKit participant.set_attributes({"emotion": "angry"})
    ↓
useEmotionData() hook → agentEmotion = 'angry'
    ↓
useReadyPlayerMeExpressions
    ↓
Sets: mouthFrown=0.5, browDown=0.8, jawForward=0.3
    ↓
Avatar face changes to angry expression
```

**Latency**:
- Lip-sync: < 50ms (instant)
- Emotions: ~2-4 seconds (same as emoji system)

---

## 🆚 Comparison: VRM vs Ready Player Me

| Feature | VRM (Anime) | Ready Player Me (Realistic) |
|---------|-------------|----------------------------|
| **Realism** | Cartoon/Anime | Photorealistic Human |
| **File Format** | .vrm | .glb |
| **Facial Expressions** | ~5 basic | 52 ARKit blendshapes |
| **Lip-Sync** | Simple (1 viseme) | Advanced (jaw + mouth) |
| **File Size** | 2-10 MB | 5-15 MB |
| **Setup** | Download file | Use URL directly |
| **Customization** | VRoid Studio | Web interface |
| **Best For** | Anime/Game style | Professional/Business |

**Your Current Config**: ✅ Ready Player Me (realistic)

---

## 📚 Resources

### Ready Player Me
- **Demo Creator**: https://demo.readyplayer.me/
- **Documentation**: https://docs.readyplayer.me/
- **Avatar Gallery**: https://readyplayer.me/gallery

### ARKit Blendshapes
- **Reference**: https://arkit-face-blendshapes.com/
- **Apple Docs**: https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation

### Three.js
- **Documentation**: https://threejs.org/docs/
- **Examples**: https://threejs.org/examples/

---

## ✅ What's Working

After following this guide, you should have:

- ✅ Realistic 3D human avatar (not anime)
- ✅ Lip-synced speech (mouth moves with agent's voice)
- ✅ Emotion-driven facial expressions
- ✅ Natural blinking animation
- ✅ Professional appearance
- ✅ Zero cost (free)

---

## 🎬 Next Steps

### Immediate
1. **Test the system**: Run `pnpm run dev` and start a call
2. **Speak trigger phrases**: Test all 9 emotions
3. **Verify lip-sync**: Check mouth movement during agent speech

### Future Enhancements
- [ ] Add avatar selection UI (multiple avatars to choose from)
- [ ] Implement head tracking (look at camera/user)
- [ ] Add idle animations (breathing, slight movements)
- [ ] Support custom avatar upload
- [ ] Add background scenes (office, outdoor, etc.)
- [ ] Implement hand gestures

---

## 🐛 Getting Help

If you encounter issues:

1. **Check Browser Console** (F12) for error messages
2. **Review Troubleshooting Section** above
3. **Test with bar visualizer** (set `avatar.enabled: false`) to isolate issue
4. **Try VRM avatar** (set `type: 'vrm'`) to test if issue is RPM-specific

---

## 🎉 Success Criteria

**You'll know it's working when:**
- You see a realistic 3D human (not anime) when you start a call
- The avatar's mouth opens and closes when the agent speaks
- The avatar's facial expression changes based on detected emotions
- The avatar blinks naturally every few seconds
- No errors in browser console

---

**Ready to test? Run `pnpm run dev` and start a call!**
