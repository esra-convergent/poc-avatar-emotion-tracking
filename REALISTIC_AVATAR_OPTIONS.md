# Realistic Human Avatar Options

## 🎯 The Problem with VRM

You're correct - **VRM avatars are anime/cartoon style**. They're not suitable for realistic human representation.

For **professional, realistic human avatars**, here are your best options:

---

## ✅ Recommended Solutions for Realistic Avatars

### Option 1: Ready Player Me (Best for POC) ⭐

**What it is**: Free platform for creating realistic 3D avatars from photos

**Why it's perfect**:
- ✅ **Photorealistic** human avatars
- ✅ **Free** (no payment required)
- ✅ **GLB/GLTF** format (works with Three.js)
- ✅ **ARKit blendshapes** (52 facial expressions)
- ✅ **Lip-sync ready** (visemes included)
- ✅ **No accounts** needed for basic use

**How to use**:

1. **Create Avatar**:
   - Visit: https://demo.readyplayer.me/
   - Take a selfie or use a stock photo
   - Customize appearance
   - Export as `.glb` file

2. **Download**:
   - URL format: `https://models.readyplayer.me/{avatarId}.glb`
   - Download and save to `public/avatars/human-avatar.glb`

3. **Replace VRM Loader**:
   We need to update the loader to use GLB instead of VRM.

**Implementation Required**:
```typescript
// Instead of VRMLoaderPlugin, use GLTFLoader directly
// Replace in useVRMLoader.ts (or create useGLBLoader.ts)
```

---

### Option 2: MetaHuman (Unreal Engine)

**What it is**: Photorealistic digital humans from Epic Games

**Pros**:
- 🔥 **Highest quality** realistic humans
- ✅ Free

**Cons**:
- ❌ Requires Unreal Engine (complex setup)
- ❌ Large file sizes (100+ MB)
- ❌ Not ideal for web (requires conversion)

**Best for**: Desktop applications, high-end demos

---

### Option 3: Live Video Avatar (Simple Alternative)

**What it is**: Use actual video clips instead of 3D

**How it works**:
1. Record short video clips for each emotion
2. Swap videos based on detected emotion
3. Use lip-sync libraries (e.g., Wav2Lip)

**Pros**:
- ✅ **100% realistic** (it's real video)
- ✅ Simple to implement
- ✅ No 3D rendering overhead

**Cons**:
- ❌ Less interactive
- ❌ Requires video recording/sourcing
- ❌ Large file sizes

---

### Option 4: AI Avatar Services (Paid)

**Commercial options** with realistic avatars:

1. **Synthesia** - https://www.synthesia.io/
   - Realistic AI avatars
   - Text-to-speech lip-sync
   - ❌ Paid ($30+/month)

2. **D-ID** - https://www.d-id.com/
   - Photo-to-talking-avatar
   - API-based
   - ❌ Paid (pay-per-use)

3. **HeyGen** - https://www.heygen.com/
   - Photorealistic avatars
   - ❌ Paid ($30+/month)

---

## 🚀 Recommended Approach: Ready Player Me

This is the **best free solution** for realistic human avatars in your POC.

### Implementation Steps

#### Step 1: Create Avatar

1. Visit: https://demo.readyplayer.me/
2. Click "Create Avatar"
3. Upload a photo or use camera
4. Customize (optional)
5. Click "Next" → Copy the avatar URL
   - Format: `https://models.readyplayer.me/64bfa35...abc.glb`

#### Step 2: Update Code for GLB Support

We need to modify the VRM loader to support Ready Player Me's GLB format with ARKit blendshapes.

**Create new file**: `components/avatar/useGLBLoader.ts`

```typescript
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface GLBAvatar {
  scene: THREE.Group;
  morphTargetDictionary?: { [key: string]: number };
  morphTargetInfluences?: number[];
}

export function useGLBLoader(glbUrl: string) {
  const [avatar, setAvatar] = useState<GLBAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      glbUrl,
      (gltf) => {
        // Find the mesh with morph targets (face)
        let morphTargetMesh: THREE.Mesh | null = null;

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
            morphTargetMesh = child;
          }
        });

        const avatar: GLBAvatar = {
          scene: gltf.scene,
          morphTargetDictionary: morphTargetMesh?.morphTargetDictionary,
          morphTargetInfluences: morphTargetMesh?.morphTargetInfluences,
        };

        setAvatar(avatar);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Failed to load GLB:', error);
        setError(error as Error);
        setLoading(false);
      }
    );
  }, [glbUrl]);

  return { avatar, loading, error };
}
```

**ARKit Blendshapes** (for Ready Player Me):
- `mouthOpen` - Open mouth (lip-sync)
- `mouthSmile` - Smile
- `mouthFrown` - Frown
- `browInnerUp` - Surprised
- `eyeBlink` - Blink
- And 47+ more expressions

#### Step 3: Update Expression Controller

**Create**: `components/avatar/useReadyPlayerMeExpressions.ts`

```typescript
import { useEffect } from 'react';
import { EmotionType } from '@/lib/emotion-types';
import type { GLBAvatar } from './useGLBLoader';

const EMOTION_TO_ARKIT: Record<EmotionType, Record<string, number>> = {
  happy: { mouthSmile: 0.8, mouthLeft: 0.2 },
  sad: { mouthFrown: 0.7, browDown: 0.5 },
  angry: { mouthFrown: 0.6, browDown: 0.8, jawForward: 0.3 },
  anxious: { mouthFrown: 0.4, browInnerUp: 0.6 },
  surprised: { mouthOpen: 0.5, browInnerUp: 0.9, eyeWide: 0.7 },
  grateful: { mouthSmile: 0.7 },
  excited: { mouthSmile: 0.9, browInnerUp: 0.5 },
  confused: { browInnerUp: 0.3, mouthFrown: 0.2 },
  neutral: {},
};

export function useReadyPlayerMeExpressions(
  avatar: GLBAvatar | null,
  emotion: EmotionType,
  volume: number
) {
  // Apply emotion
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) return;

    const dict = avatar.morphTargetDictionary;
    const influences = avatar.morphTargetInfluences;

    // Reset all
    for (let i = 0; i < influences.length; i++) {
      influences[i] = 0;
    }

    // Apply emotion blendshapes
    const emotionShapes = EMOTION_TO_ARKIT[emotion];
    for (const [shapeName, value] of Object.entries(emotionShapes)) {
      const index = dict[shapeName];
      if (index !== undefined) {
        influences[index] = value;
      }
    }
  }, [avatar, emotion]);

  // Lip-sync
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) return;

    const mouthOpenIndex = avatar.morphTargetDictionary['mouthOpen'];
    if (mouthOpenIndex !== undefined) {
      avatar.morphTargetInfluences[mouthOpenIndex] = volume * 0.8;
    }
  }, [avatar, volume]);

  // Auto-blink
  useEffect(() => {
    if (!avatar?.morphTargetInfluences || !avatar?.morphTargetDictionary) return;

    const blinkIndex = avatar.morphTargetDictionary['eyeBlink'];
    if (blinkIndex === undefined) return;

    const blink = () => {
      if (avatar.morphTargetInfluences) {
        avatar.morphTargetInfluences[blinkIndex] = 1.0;
        setTimeout(() => {
          if (avatar.morphTargetInfluences) {
            avatar.morphTargetInfluences[blinkIndex] = 0;
          }
        }, 150);
      }
    };

    const scheduleNextBlink = (): NodeJS.Timeout => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        blink();
        timeoutId = scheduleNextBlink();
      }, delay);
    };

    let timeoutId = scheduleNextBlink();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [avatar]);
}
```

#### Step 4: Create Ready Player Me Component

**Create**: `components/avatar/ReadyPlayerMeAgent.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGLBLoader } from './useGLBLoader';
import { useAudioAnalyzer } from './useAudioAnalyzer';
import { useReadyPlayerMeExpressions } from './useReadyPlayerMeExpressions';
import { EmotionType } from '@/lib/emotion-types';

interface ReadyPlayerMeAgentProps {
  glbUrl: string;
  audioElement: HTMLAudioElement | null;
  emotion: EmotionType;
  className?: string;
}

export function ReadyPlayerMeAgent({
  glbUrl,
  audioElement,
  emotion,
  className = '',
}: ReadyPlayerMeAgentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { avatar, loading, error } = useGLBLoader(glbUrl);
  const volume = useAudioAnalyzer(audioElement);

  useReadyPlayerMeExpressions(avatar, emotion, volume);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasRef.current || !avatar) return;

    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      30,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.5, 1.5); // Closer for head/shoulders view

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI);
    scene.add(ambientLight);

    // Add avatar
    scene.add(avatar.scene);

    // Animation loop
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      const delta = clock.getDelta();

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!canvas || !camera || !renderer) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [avatar]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-sm text-white">Loading avatar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-red-500 p-4">
          <p className="font-semibold">Failed to load avatar</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
```

#### Step 5: Update Config

**Edit** [`app-config.ts`](app-config.ts):

```typescript
avatar: {
  enabled: true,
  type: 'readyplayerme', // 'vrm' or 'readyplayerme'
  vrmUrl: '/avatars/default-avatar.vrm',
  glbUrl: 'https://models.readyplayer.me/YOUR_AVATAR_ID.glb', // Your Ready Player Me URL
  allowCustomUpload: false,
}
```

#### Step 6: Update TileLayout

**Edit** [`tile-layout.tsx`](components/app/tile-layout.tsx):

```typescript
import { ReadyPlayerMeAgent } from '@/components/avatar/ReadyPlayerMeAgent';

// In component:
const avatarType = APP_CONFIG_DEFAULTS.avatar?.type ?? 'vrm';
const glbUrl = APP_CONFIG_DEFAULTS.avatar?.glbUrl ?? '';

// In render:
{avatarType === 'readyplayerme' && (
  <ReadyPlayerMeAgent
    glbUrl={glbUrl}
    audioElement={audioElementRef.current}
    emotion={emotionState.agentEmotion}
    className="w-full h-full"
  />
)}

{avatarType === 'vrm' && (
  <VRMAvatarAgent
    vrmUrl={vrmUrl}
    audioElement={audioElementRef.current}
    emotion={emotionState.agentEmotion}
    className="w-full h-full"
  />
)}
```

---

## 🎨 Free Realistic Avatar Resources

### Ready Player Me Gallery
- **Default Avatars**: https://readyplayer.me/avatar
- **Stock GLB Models**: Download from their demo

### Mixamo (Adobe)
- **URL**: https://www.mixamo.com/
- **What**: Free rigged human characters
- **Format**: FBX (convert to GLB using Blender)
- **Quality**: High-quality realistic humans

### Sketchfab
- **URL**: https://sketchfab.com/
- **Search**: "realistic human GLB free"
- **Filter**: Free downloads, GLB format
- **Examples**:
  - Business professional models
  - Casual character models

---

## 📊 Comparison

| Option | Realism | Setup | Cost | Lip-Sync | Emotions |
|--------|---------|-------|------|----------|----------|
| **Ready Player Me** | ⭐⭐⭐⭐ | Easy | Free | ✅ Yes | ✅ 52 shapes |
| **VRM (Anime)** | ⭐⭐ | Easy | Free | ✅ Yes | ✅ Basic |
| **MetaHuman** | ⭐⭐⭐⭐⭐ | Hard | Free | ✅ Yes | ✅ Advanced |
| **Video Clips** | ⭐⭐⭐⭐⭐ | Medium | Free | ⚠️ Complex | ⚠️ Pre-recorded |
| **Synthesia/D-ID** | ⭐⭐⭐⭐⭐ | Easy | $$$$ | ✅ Yes | ✅ Yes |

---

## 🚀 Quick Start (Ready Player Me)

1. **Create avatar**: https://demo.readyplayer.me/
2. **Copy URL**: `https://models.readyplayer.me/{id}.glb`
3. **Download GLB** and save to `public/avatars/human-avatar.glb`

**OR** use this sample avatar for testing:
```
https://models.readyplayer.me/64bfa351ed6b3d7be68df5f6.glb
```

---

## ✅ Summary

**For realistic human avatars in your POC:**

1. **Best Option**: Ready Player Me (GLB + ARKit blendshapes)
2. **Requires**: Creating new loader/expression components (provided above)
3. **Result**: Photorealistic human avatar with lip-sync and emotions
4. **Time**: ~2-3 hours to implement
5. **Cost**: $0

Would you like me to implement the Ready Player Me integration now?
