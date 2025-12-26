'use client';

import { useAnimations, useFBX, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Viseme mapping for lip-sync
const VISEME_MAPPING = {
  A: 'viseme_PP',
  B: 'viseme_kk',
  C: 'viseme_I',
  D: 'viseme_AA',
  E: 'viseme_O',
  F: 'viseme_U',
  G: 'viseme_FF',
  H: 'viseme_TH',
  X: 'viseme_PP',
};

interface LiveKitAvatarProps {
  audioElement?: HTMLAudioElement | null;
  emotion?: string;
}

export function LiveKitAvatar({
  audioElement,
  emotion = 'neutral',
}: LiveKitAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const [animation, setAnimation] = useState('Idle');

  // Audio analysis
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Load 3D model and animations
  const { nodes, materials } = useGLTF('/models/646d9dcdc8a5f5bddbfac913.glb') as any;
  const { animations: idleAnimation } = useFBX('/animations/Idle.fbx');
  const { animations: greetingAnimation } = useFBX('/animations/Standing Greeting.fbx');
  const { animations: angryAnimation } = useFBX('/animations/Angry Gesture.fbx');

  // Name animations
  idleAnimation[0].name = 'Idle';
  greetingAnimation[0].name = 'Greeting';
  angryAnimation[0].name = 'Angry';

  const { actions } = useAnimations(
    [idleAnimation[0], greetingAnimation[0], angryAnimation[0]],
    group
  );

  // Setup audio analysis when audio element changes
  useEffect(() => {
    if (!audioElement) {
      console.log('No audio element for lip-sync');
      return;
    }

    try {
      // Create audio context only once
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      // Resume audio context if suspended
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      // Create analyser with higher fftSize for better frequency resolution
      if (!analyser.current) {
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 1024; // Increased for better speech analysis
        analyser.current.smoothingTimeConstant = 0.3; // Smooth transitions
        const bufferLength = analyser.current.frequencyBinCount;
        dataArray.current = new Uint8Array(bufferLength);
      }

      // Only create source if it doesn't exist
      if (!audioSourceRef.current) {
        audioSourceRef.current = audioContext.current.createMediaElementSource(audioElement);
        audioSourceRef.current.connect(analyser.current);
        analyser.current.connect(audioContext.current.destination);
        console.log('✅ Audio analysis setup complete for lip-sync');
      }
    } catch (error) {
      // If already connected, just resume the context
      if (error instanceof Error && error.message.includes('already connected')) {
        console.log('Audio element already connected, reusing connection');
        if (audioContext.current && audioContext.current.state === 'suspended') {
          audioContext.current.resume();
        }
      } else {
        console.error('Error setting up audio analysis:', error);
      }
    }

    return () => {
      // Don't close the context on unmount, just suspend it
      // This prevents the "already connected" error
    };
  }, [audioElement]);

  // Analyze audio and determine viseme based on frequency content
  const analyzeAudio = () => {
    if (!analyser.current || !dataArray.current) return 'A';

    // @ts-ignore - Uint8Array type compatibility
    analyser.current.getByteFrequencyData(dataArray.current);

    // Calculate overall volume
    const average = Array.from(dataArray.current).reduce((a, b) => a + b, 0) / dataArray.current.length;

    // If silent, return closed mouth
    if (average < 5) return 'A';

    // Analyze frequency ranges for better viseme detection
    // Low frequencies (100-300 Hz) - vowels like "O", "U"
    const lowFreq = dataArray.current.slice(2, 6).reduce((a, b) => a + b, 0) / 4;

    // Mid frequencies (300-2000 Hz) - vowels like "A", "E", "I"
    const midFreq = dataArray.current.slice(6, 40).reduce((a, b) => a + b, 0) / 34;

    // High frequencies (2000+ Hz) - consonants like "S", "F", "TH"
    const highFreq = dataArray.current.slice(40, 100).reduce((a, b) => a + b, 0) / 60;

    // Determine viseme based on frequency distribution
    if (highFreq > midFreq && highFreq > lowFreq) {
      // High frequency sounds - "F", "S", "TH"
      if (average > 60) return 'H'; // TH sound
      return 'G'; // FF sound
    } else if (lowFreq > midFreq) {
      // Low frequency sounds - "O", "U"
      if (average > 50) return 'E'; // O sound (open)
      return 'F'; // U sound (rounded)
    } else {
      // Mid frequency sounds - "A", "E", "I", consonants
      if (average > 70) return 'D'; // AA sound (wide open)
      if (average > 50) return 'C'; // I sound
      if (average > 30) return 'B'; // kk/consonants
      return 'X'; // Default closed
    }
  };

  // Animation loop for lip-sync
  useFrame(() => {
    if (!nodes.Wolf3D_Head || !nodes.Wolf3D_Teeth) return;

    const head = nodes.Wolf3D_Head;
    const teeth = nodes.Wolf3D_Teeth;

    // Determine current viseme from audio
    const viseme = analyzeAudio();

    // Debug: Log viseme occasionally
    if (Math.random() < 0.01) {
      console.log('Current viseme:', viseme, 'Audio element:', !!audioElement);
    }

    // Smoothly transition all visemes to 0
    Object.values(VISEME_MAPPING).forEach((morphTarget) => {
      const headIndex = head.morphTargetDictionary?.[morphTarget];
      const teethIndex = teeth.morphTargetDictionary?.[morphTarget];

      if (headIndex !== undefined && head.morphTargetInfluences) {
        head.morphTargetInfluences[headIndex] = THREE.MathUtils.lerp(
          head.morphTargetInfluences[headIndex],
          0,
          0.3
        );
      }

      if (teethIndex !== undefined && teeth.morphTargetInfluences) {
        teeth.morphTargetInfluences[teethIndex] = THREE.MathUtils.lerp(
          teeth.morphTargetInfluences[teethIndex],
          0,
          0.3
        );
      }
    });

    // Apply current viseme
    const currentMorphTarget = VISEME_MAPPING[viseme as keyof typeof VISEME_MAPPING];
    if (currentMorphTarget) {
      const headIndex = head.morphTargetDictionary?.[currentMorphTarget];
      const teethIndex = teeth.morphTargetDictionary?.[currentMorphTarget];

      if (headIndex !== undefined && head.morphTargetInfluences) {
        head.morphTargetInfluences[headIndex] = THREE.MathUtils.lerp(
          head.morphTargetInfluences[headIndex],
          1,
          0.5
        );
      }

      if (teethIndex !== undefined && teeth.morphTargetInfluences) {
        teeth.morphTargetInfluences[teethIndex] = THREE.MathUtils.lerp(
          teeth.morphTargetInfluences[teethIndex],
          1,
          0.5
        );
      }
    }

    // Head follows camera
    if (group.current) {
      const head = group.current.getObjectByName('Head');
      if (head) {
        head.lookAt(0, 0, 8); // Look at camera position
      }
    }
  });

  // Change animation based on emotion
  useEffect(() => {
    const emotionToAnimation: Record<string, string> = {
      happy: 'Greeting',
      excited: 'Greeting',
      angry: 'Angry',
      frustrated: 'Angry',
      neutral: 'Idle',
      calm: 'Idle',
      sad: 'Idle',
      anxious: 'Idle',
      curious: 'Idle',
    };

    const newAnimation = emotionToAnimation[emotion] || 'Idle';
    if (newAnimation !== animation) {
      setAnimation(newAnimation);
    }
  }, [emotion, animation]);

  // Play animation with smooth transitions
  useEffect(() => {
    if (actions[animation]) {
      actions[animation]?.reset().fadeIn(0.5).play();
      return () => {
        actions[animation]?.fadeOut(0.5);
      };
    }
  }, [animation, actions]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

// Preload model
useGLTF.preload('/models/646d9dcdc8a5f5bddbfac913.glb');
useFBX.preload('/animations/Idle.fbx');
useFBX.preload('/animations/Standing Greeting.fbx');
useFBX.preload('/animations/Angry Gesture.fbx');
