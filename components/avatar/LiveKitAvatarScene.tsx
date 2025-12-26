'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, Suspense } from 'react';
import { Environment, useTexture } from '@react-three/drei';
import { LiveKitAvatar } from './LiveKitAvatar';
import { useVoiceAssistant } from '@livekit/components-react';

// Background component - fills entire viewport
function Background() {
  const texture = useTexture('/textures/youtubeBackground.jpg');
  const viewport = useThree((state) => state.viewport);

  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

interface LiveKitAvatarSceneProps {
  emotion?: string;
  className?: string;
}

export function LiveKitAvatarScene({ emotion = 'neutral', className }: LiveKitAvatarSceneProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioConnected, setAudioConnected] = useState(false);
  const { audioTrack: agentAudioTrack } = useVoiceAssistant();

  useEffect(() => {
    console.log('LiveKitAvatarScene: Agent audio track:', agentAudioTrack);

    if (!agentAudioTrack) {
      console.log('No agent audio track available yet');
      return;
    }

    const track = agentAudioTrack.publication?.track;
    if (!track) {
      console.log('No audio track in publication');
      return;
    }

    try {
      // Get the MediaStreamTrack
      const mediaStreamTrack = track.mediaStreamTrack;
      if (!mediaStreamTrack) {
        console.log('No mediaStreamTrack available');
        return;
      }

      // Create MediaStream from track
      const mediaStream = new MediaStream([mediaStreamTrack]);

      // Create audio element if it doesn't exist
      if (!audioElementRef.current) {
        const audio = new Audio();
        audio.srcObject = mediaStream;
        audio.autoplay = true;
        audio.volume = 1.0;
        audioElementRef.current = audio;

        console.log('✅ LiveKit audio connected to avatar successfully');
        console.log('Audio element playing:', !audio.paused, 'Ready state:', audio.readyState);

        // Log when audio starts playing
        audio.addEventListener('playing', () => {
          console.log('🔊 Audio is now playing for lip-sync');
        });

        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
        });
      }

      setAudioConnected(true);

      return () => {
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.srcObject = null;
          audioElementRef.current = null;
        }
        setAudioConnected(false);
      };
    } catch (error) {
      console.error('Error setting up audio for avatar:', error);
    }
  }, [agentAudioTrack]);

  useEffect(() => {
    console.log('LiveKitAvatarScene mounted, emotion:', emotion);
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 8], fov: 42 }}
      className={className}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#ececec']} />
      <Suspense fallback={null}>
        {/* Avatar - exact same position as lipsync_tuto */}
        <group position={[0, -3, 5]} scale={2}>
          <LiveKitAvatar audioElement={audioElementRef.current} emotion={emotion} />
        </group>

        {/* Environment lighting - sunset preset */}
        <Environment preset="sunset" />

        {/* Background image - Japanese room */}
        <Background />
      </Suspense>
    </Canvas>
  );
}
