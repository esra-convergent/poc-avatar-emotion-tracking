# VRM Avatar Integration Pipeline

## 🎯 Goal
Integrate a 3D VRM avatar into the LiveKit room that:
1. **Talks** - Lip-syncs to AI agent's TTS audio in real-time
2. **Emotes** - Changes facial expressions based on detected emotions

## 📋 Current State Analysis

### What You Already Have ✅
- **LiveKit Room**: Fully functional voice assistant
- **Audio Pipeline**: AssemblyAI STT → OpenAI LLM → Cartesia TTS
- **Emotion System**: Real-time emotion detection with 9 emotions
- **React Frontend**: Next.js 15 + React 19 + TypeScript
- **Agent Audio Track**: Available via `useVoiceAssistant()` hook
- **Emotion State**: Available via `useEmotionData()` hook

### What You Need to Add 🔨
- VRM avatar renderer (three.js + @pixiv/three-vrm)
- Audio analyzer for lip-sync
- Expression controller for emotions
- Avatar component integrated into TileLayout

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LiveKit Room                             │
│  ┌──────────────┐                                            │
│  │ AI Agent     │                                            │
│  │ (Python)     │                                            │
│  └──────┬───────┘                                            │
│         │                                                     │
│         ├──────► Audio Track (Cartesia TTS)                  │
│         │                                                     │
│         └──────► Emotion Data (Participant Attributes)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                React Frontend                                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SessionView Component                                 │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ TileLayout                                      │  │   │
│  │  │                                                 │  │   │
│  │  │  ┌─────────────────────────────────────────┐   │  │   │
│  │  │  │ VRMAvatarAgent Component                │   │  │   │
│  │  │  │                                          │   │  │   │
│  │  │  │  ┌────────────┐    ┌─────────────────┐  │   │  │   │
│  │  │  │  │ Three.js   │    │ Audio Analyzer  │  │   │  │   │
│  │  │  │  │ Canvas     │◄───┤ (Web Audio API) │  │   │  │   │
│  │  │  │  │            │    └─────────────────┘  │   │  │   │
│  │  │  │  │ ┌────────┐ │          ▲             │   │  │   │
│  │  │  │  │ │  VRM   │ │          │             │   │  │   │
│  │  │  │  │ │ Model  │ │    Agent Audio Track   │   │  │   │
│  │  │  │  │ └────────┘ │                         │   │  │   │
│  │  │  │  │     ▲      │                         │   │  │   │
│  │  │  │  │     │      │                         │   │  │   │
│  │  │  │  └─────┼──────┘                         │   │  │   │
│  │  │  │        │                                │   │  │   │
│  │  │  │        │                                │   │  │   │
│  │  │  │  ┌─────▼──────────────────────────┐    │   │  │   │
│  │  │  │  │ Expression Controller          │    │   │  │   │
│  │  │  │  │                                 │    │   │  │   │
│  │  │  │  │ - Mouth: volume → "aa" shape   │    │   │  │   │
│  │  │  │  │ - Eyes: blink animation        │    │   │  │   │
│  │  │  │  │ - Face: emotion preset         │    │   │  │   │
│  │  │  │  └─────────────────────────────────┘    │   │  │   │
│  │  │  │             ▲                           │   │  │   │
│  │  │  │             │                           │   │  │   │
│  │  │  │       useEmotionData()                  │   │  │   │
│  │  │  │       (agentEmotion)                    │   │  │   │
│  │  │  └─────────────────────────────────────────┘   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Pipeline

### Phase 1: Setup Dependencies

**Install packages:**
```bash
npm install three @pixiv/three-vrm
npm install --save-dev @types/three
```

**Why these?**
- `three`: 3D rendering engine (WebGL wrapper)
- `@pixiv/three-vrm`: Official VRM file loader and runtime
- No accounts, no API keys, fully local

---

### Phase 2: Create Avatar Component

**File structure:**
```
components/
├── avatar/
│   ├── VRMAvatarAgent.tsx        # Main avatar component
│   ├── useVRMLoader.ts           # VRM model loading hook
│   ├── useAudioAnalyzer.ts       # Lip-sync audio analysis
│   ├── useExpressionController.ts # Emotion → VRM expressions
│   └── default-avatar.vrm        # Default VRM model
```

#### 2.1 VRM Loader Hook

**File:** `components/avatar/useVRMLoader.ts`

```typescript
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function useVRMLoader(vrmUrl: string) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        VRMUtils.rotateVRM0(vrm); // Fix coordinate system
        setVrm(vrm);
        setLoading(false);
      },
      undefined,
      (error) => {
        setError(error as Error);
        setLoading(false);
      }
    );
  }, [vrmUrl]);

  return { vrm, loading, error };
}
```

#### 2.2 Audio Analyzer Hook

**File:** `components/avatar/useAudioAnalyzer.ts`

```typescript
import { useEffect, useState, useRef } from 'react';

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const [volume, setVolume] = useState(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!audioElement) return;

    // Create Web Audio API context
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    const analyzer = audioContext.createAnalyser();

    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    analyzerRef.current = analyzer;

    // Analysis loop
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const analyze = () => {
      analyzer.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = Math.min(average / 128, 1.0); // 0-1 range

      setVolume(normalized);
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [audioElement]);

  return volume;
}
```

#### 2.3 Expression Controller Hook

**File:** `components/avatar/useExpressionController.ts`

```typescript
import { useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { EmotionType } from '@/lib/emotion-types';

// Map your emotion types to VRM expression presets
const EMOTION_TO_VRM_EXPRESSION: Record<EmotionType, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  anxious: 'sad', // VRM may not have "anxious", use closest
  surprised: 'surprised',
  grateful: 'happy',
  excited: 'happy',
  confused: 'neutral',
  neutral: 'neutral',
};

export function useExpressionController(
  vrm: VRM | null,
  emotion: EmotionType,
  volume: number
) {
  // Apply emotion expression
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    const expressionName = EMOTION_TO_VRM_EXPRESSION[emotion];

    // Reset all expressions
    const allExpressions = ['happy', 'sad', 'angry', 'surprised', 'neutral'];
    allExpressions.forEach((exp) => {
      vrm.expressionManager.setValue(exp, 0);
    });

    // Apply target expression
    vrm.expressionManager.setValue(expressionName, 1.0);
  }, [vrm, emotion]);

  // Apply mouth movement (lip-sync)
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    // Map volume to mouth opening
    // "aa" is the open mouth viseme in VRM
    const mouthValue = volume * 0.8; // Scale down slightly for natural look
    vrm.expressionManager.setValue('aa', mouthValue);
  }, [vrm, volume]);

  // Auto-blink animation
  useEffect(() => {
    if (!vrm?.expressionManager) return;

    const blinkInterval = setInterval(() => {
      // Quick blink
      vrm.expressionManager.setValue('blink', 1.0);
      setTimeout(() => {
        vrm.expressionManager.setValue('blink', 0);
      }, 150);
    }, 3000 + Math.random() * 2000); // Random 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, [vrm]);
}
```

#### 2.4 Main Avatar Component

**File:** `components/avatar/VRMAvatarAgent.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { useVRMLoader } from './useVRMLoader';
import { useAudioAnalyzer } from './useAudioAnalyzer';
import { useExpressionController } from './useExpressionController';
import { EmotionType } from '@/lib/emotion-types';

interface VRMAvatarAgentProps {
  vrmUrl?: string;
  audioElement: HTMLAudioElement | null;
  emotion: EmotionType;
  className?: string;
}

export function VRMAvatarAgent({
  vrmUrl = '/avatars/default-avatar.vrm',
  audioElement,
  emotion,
  className = '',
}: VRMAvatarAgentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { vrm, loading, error } = useVRMLoader(vrmUrl);
  const volume = useAudioAnalyzer(audioElement);

  // Apply expressions based on emotion and volume
  useExpressionController(vrm, emotion, volume);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasRef.current || !vrm) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      30,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.3, 2.5); // Position camera to see avatar's face

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1, 1, 1);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI);
    scene.add(ambientLight);

    // Add VRM to scene
    scene.add(vrm.scene);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();

      // Update VRM (handles expressions, blinking, etc.)
      vrm.update(delta);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [vrm]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-2 text-sm">Loading avatar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-red-500">Failed to load avatar: {error.message}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

---

### Phase 3: Integration into LiveKit Layout

**Modify:** `components/app/tile-layout.tsx`

#### 3.1 Add Audio Element Ref

The LiveKit audio track needs to be accessible as an HTMLAudioElement for the audio analyzer.

```typescript
import { VRMAvatarAgent } from '@/components/avatar/VRMAvatarAgent';
import { useRef } from 'react';

// Inside TileLayout component:
const audioElementRef = useRef<HTMLAudioElement>(null);
```

#### 3.2 Update Agent Visualization Section

Replace the current agent visualization (BarVisualizer or VideoTrack) with avatar:

```typescript
{/* Agent visualization */}
{agentState === 'listening' || agentState === 'thinking' || agentState === 'speaking' ? (
  <div className={agentVideoContainerClasses}>
    {/* VRM Avatar Mode */}
    <VRMAvatarAgent
      audioElement={audioElementRef.current}
      emotion={agentEmotion}
      className="w-full h-full"
    />

    {/* Emotion Overlay */}
    <div className="absolute bottom-4 right-4">
      <EmotionDisplay emotion={agentEmotion} size="lg" />
    </div>
  </div>
) : null}

{/* Hidden RoomAudioRenderer with ref */}
<div style={{ display: 'none' }}>
  <RoomAudioRenderer ref={audioElementRef} />
</div>
```

#### 3.3 Handle Audio Element from LiveKit

The `RoomAudioRenderer` renders audio elements internally. We need to extract the agent's audio element.

**Option A: Custom Audio Renderer**

Create a custom component that exposes the audio element:

```typescript
// components/avatar/AgentAudioRenderer.tsx
'use client';

import { useEffect, useRef, forwardRef } from 'react';
import { useRemoteParticipants, useConnectionState } from '@livekit/components-react';
import { Track } from 'livekit-client';

export const AgentAudioRenderer = forwardRef<HTMLAudioElement | null>(
  (props, ref) => {
    const participants = useRemoteParticipants();
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      // Find agent participant (usually the first one)
      const agentParticipant = participants.find(
        (p) => p.identity.includes('agent') || participants.length === 1
      );

      if (!agentParticipant) return;

      // Get agent's audio track
      const audioTrack = agentParticipant.audioTrackPublications.values().next().value;

      if (audioTrack?.track && audioRef.current) {
        audioTrack.track.attach(audioRef.current);
      }

      return () => {
        if (audioTrack?.track) {
          audioTrack.track.detach();
        }
      };
    }, [participants]);

    // Expose ref
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(audioRef.current);
      } else if (ref) {
        ref.current = audioRef.current;
      }
    }, [ref]);

    return <audio ref={audioRef} autoPlay />;
  }
);

AgentAudioRenderer.displayName = 'AgentAudioRenderer';
```

Then use it in TileLayout:

```typescript
<AgentAudioRenderer ref={audioElementRef} />
```

---

### Phase 4: Configuration & Controls

#### 4.1 Add Avatar Config

**Update:** `app-config.ts`

```typescript
export const appConfig = {
  // ... existing config

  avatar: {
    enabled: true,
    vrmUrl: '/avatars/default-avatar.vrm',
    // Allow users to upload custom VRM
    allowCustomUpload: true,
  },
};
```

#### 4.2 Add Avatar Selector UI (Optional)

Create a control to toggle between modes:
- Audio visualizer (bars)
- VRM avatar
- Video track (if agent sends video)

```typescript
// In session-view or control bar
const [avatarMode, setAvatarMode] = useState<'audio' | 'vrm' | 'video'>('vrm');

// Render conditionally in TileLayout
{avatarMode === 'vrm' && <VRMAvatarAgent ... />}
{avatarMode === 'audio' && <BarVisualizer ... />}
{avatarMode === 'video' && <VideoTrack ... />}
```

---

### Phase 5: Get a VRM Avatar

#### Option 1: Create Your Own (Recommended for POC)
1. Download **VRoid Studio** (free): https://vroid.com/en/studio
2. Create a character (takes 10-30 min for basic customization)
3. Export as `.vrm` file
4. Place in `public/avatars/default-avatar.vrm`

#### Option 2: Use Free VRM Models
- **VRoid Hub**: https://hub.vroid.com/en/models
  - Filter by "Free" license
  - Download `.vrm` file
- **Booth.pm**: https://booth.pm/en/search/VRM%20free
- **GitHub repos**: Many open-source VRM avatars

#### Option 3: Placeholder for Testing
Use a simple sphere with expressions (mock VRM):

```typescript
// Temporary until you have a real VRM
const createMockVRM = () => {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffc0cb });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
};
```

---

## 🔄 Data Flow Summary

### Speech (TTS → Lip-Sync)
```
Python Agent (Cartesia TTS)
    ↓
LiveKit Audio Track
    ↓
AgentAudioRenderer (attach to <audio> element)
    ↓
useAudioAnalyzer (Web Audio API)
    ↓
volume (0-1) every frame
    ↓
useExpressionController
    ↓
vrm.expressionManager.setValue('aa', volume)
    ↓
Avatar mouth moves in real-time
```

**Latency:** < 50ms (basically instant, limited by WebGL frame rate)

### Emotion (Detection → Expression)
```
User speaks "I'm frustrated"
    ↓
AssemblyAI transcribes
    ↓
Python emotion_analyzer.py detects "angry"
    ↓
send_emotion_data() via participant.set_attributes()
    ↓
useEmotionData() hook receives emotion
    ↓
agentEmotion state updates
    ↓
useExpressionController receives new emotion
    ↓
vrm.expressionManager.setValue('angry', 1.0)
    ↓
Avatar face changes
```

**Latency:** ~2-4 seconds (same as current emoji system)

---

## 🧪 Testing Plan

### 1. Test VRM Loading
```bash
npm run dev
# Navigate to session
# Check browser console for "VRM loaded" or errors
# Avatar should appear in 3D (even if not moving yet)
```

### 2. Test Lip-Sync
- Start a conversation
- Agent speaks
- **Expected:** Avatar's mouth opens/closes with speech volume
- **Debug:** Check browser console for audio analyzer values

### 3. Test Emotions
Use the existing `EmotionTestPanel`:
- Send test emotion: "happy"
- **Expected:** Avatar smiles
- Send test emotion: "angry"
- **Expected:** Avatar frowns/scowls

### 4. Test Full Pipeline
Say trigger phrases from your existing EMOTION_TEST_GUIDE.md:
- "I'm so frustrated" → Angry face
- "That's amazing!" → Happy face
- "I'm grateful" → Grateful/happy face

---

## 📊 Performance Considerations

### Rendering Performance
- **Target:** 60 FPS
- **VRM model complexity:** Keep < 20K polygons for POC
- **Optimization:** Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`

### Audio Analysis
- **fftSize:** 256 (good balance for voice)
- **Update rate:** 60Hz (tied to requestAnimationFrame)
- **CPU impact:** Minimal (< 1% on modern devices)

### Memory
- **VRM model:** ~2-10 MB
- **Three.js bundle:** ~600 KB
- **Runtime:** ~50 MB for 3D scene

---

## 🚀 Production Enhancements (Future)

### 1. Advanced Lip-Sync
Replace volume-based mouth with phoneme detection:
- Use **Rhubarb Lip Sync** or **Oculus Visemes**
- Map phonemes to VRM visemes (aa, ih, ou, ee, etc.)

### 2. ML-Based Emotion Detection
Replace keyword matching with transformer models:
- **Hugging Face**: j-hartmann/emotion-english-distilroberta-base
- Run inference on transcript before sending to frontend
- Higher accuracy, more nuanced emotions

### 3. Physics & Animation
- Head tracking (look at camera)
- Idle animations (breathing, slight movement)
- Particle effects on emotion changes

### 4. Customization
- Allow users to upload their own VRM
- Avatar wardrobe (change clothes/hair)
- Voice-to-avatar style matching

---

## 🐛 Troubleshooting

### Avatar not loading
- Check browser console for CORS errors
- Ensure `.vrm` file is in `public/` folder
- Verify file URL in DevTools Network tab

### No lip movement
- Check if `audioElementRef.current` is null
- Verify agent audio track is playing
- Check audio analyzer values in console

### Expressions not changing
- Verify `useEmotionData()` returns correct emotion
- Check if VRM has expressions (some models don't have all)
- Test with VRoid Studio default model first

### Performance issues
- Reduce VRM model complexity
- Lower `renderer.setPixelRatio(1)`
- Disable anti-aliasing: `antialias: false`

---

## 📦 File Checklist

After implementation, you should have:

```
✅ package.json (three, @pixiv/three-vrm dependencies)
✅ components/avatar/VRMAvatarAgent.tsx
✅ components/avatar/useVRMLoader.ts
✅ components/avatar/useAudioAnalyzer.ts
✅ components/avatar/useExpressionController.ts
✅ components/avatar/AgentAudioRenderer.tsx
✅ components/app/tile-layout.tsx (modified)
✅ app-config.ts (avatar config added)
✅ public/avatars/default-avatar.vrm
```

---

## 🎬 Final Result

When complete, you will have:

✅ **3D avatar** rendered in LiveKit room
✅ **Real-time lip-sync** to agent's voice
✅ **Emotion-driven expressions** (9 emotions)
✅ **Free & self-hosted** (no external APIs)
✅ **Production-ready POC** for demos

**Boss sees:** Futuristic AI agent with lifelike avatar that talks and emotes.

**Reality:** Clean React + Three.js integration, fully controlled by you, zero vendor lock-in.

---

## Next Steps

1. Install dependencies
2. Create avatar component files
3. Download/create VRM model
4. Integrate into TileLayout
5. Test with existing emotion system
6. Show boss, get promoted 🚀
