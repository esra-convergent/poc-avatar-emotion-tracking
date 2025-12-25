import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface GLBAvatar {
  scene: THREE.Group;
  headMesh: THREE.SkinnedMesh | null;
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
        // Find the mesh with morph targets (usually the head/face mesh)
        let headMesh: THREE.SkinnedMesh | null = null;

        gltf.scene.traverse((child) => {
          // Ready Player Me typically names the head mesh "Wolf3D_Head" or "Wolf3D_Avatar"
          if (
            child instanceof THREE.SkinnedMesh &&
            child.morphTargetDictionary &&
            child.morphTargetInfluences
          ) {
            // Prefer head mesh, but take any mesh with morph targets
            if (
              child.name.includes('Head') ||
              child.name.includes('head') ||
              !headMesh
            ) {
              headMesh = child;
            }
          }
        });

        if (headMesh) {
          console.log('Found head mesh:', headMesh.name);
          console.log('Morph targets:', Object.keys(headMesh.morphTargetDictionary || {}));
        } else {
          console.warn('No morph targets found in avatar');
        }

        const avatarData: GLBAvatar = {
          scene: gltf.scene,
          headMesh,
          morphTargetDictionary: headMesh?.morphTargetDictionary,
          morphTargetInfluences: headMesh?.morphTargetInfluences,
        };

        setAvatar(avatarData);
        setLoading(false);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading avatar: ${percent.toFixed(0)}%`);
      },
      (error) => {
        console.error('Failed to load GLB:', error);
        setError(error as Error);
        setLoading(false);
      }
    );
  }, [glbUrl]);

  return { avatar, loading, error };
}
