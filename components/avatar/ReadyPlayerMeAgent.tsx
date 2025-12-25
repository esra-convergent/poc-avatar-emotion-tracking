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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const { avatar, loading, error } = useGLBLoader(glbUrl);
  const volume = useAudioAnalyzer(audioElement);

  // Apply expressions based on emotion and volume
  useReadyPlayerMeExpressions(avatar, emotion, volume);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasRef.current || !avatar) return;

    const canvas = canvasRef.current;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Use full device pixel ratio for better quality
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();

    // Create camera (zoomed out for better view)
    const camera = new THREE.PerspectiveCamera(
      30, // Narrower FOV for less distortion
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 2.2); // Zoomed out - shows upper body

    // Lighting setup - improved for better quality
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 2, -2);
    scene.add(backLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Add avatar to scene
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

    // Handle resize
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
          <p className="text-xs mt-2">URL: {glbUrl}</p>
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
