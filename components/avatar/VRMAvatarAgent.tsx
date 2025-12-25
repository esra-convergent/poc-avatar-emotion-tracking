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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const { vrm, loading, error } = useVRMLoader(vrmUrl);
  const volume = useAudioAnalyzer(audioElement);

  // Apply expressions based on emotion and volume
  useExpressionController(vrm, emotion, volume);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasRef.current || !vrm) return;

    const canvas = canvasRef.current;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      30,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.3, 2.5); // Position to see avatar's face
    cameraRef.current = camera;

    // Lighting setup
    const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI);
    scene.add(ambientLight);

    // Add VRM to scene
    scene.add(vrm.scene);

    // Animation loop
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      const delta = clock.getDelta();

      // Update VRM (handles expressions, physics, etc.)
      vrm.update(delta);

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
  }, [vrm]);

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
          <p className="text-xs mt-2">Expected VRM file at: {vrmUrl}</p>
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
