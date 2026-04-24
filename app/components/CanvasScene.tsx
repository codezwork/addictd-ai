'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Orb } from './Orb';
import { IntroParticles } from './IntroParticles';
import { FeatureCards } from './FeatureCards';
import { PlatformSwarm } from './PlatformSwarm';
import * as THREE from 'three';
import { Suspense } from 'react';

interface CanvasSceneProps {
  orbRef?: React.RefObject<THREE.Group | null>;
  introRef?: React.RefObject<THREE.Points | null>;
  feat1Ref?: React.RefObject<THREE.Group | null>;
  feat2Ref?: React.RefObject<THREE.Group | null>;
  swarmRef?: React.RefObject<THREE.Points | null>;
  onIntroReady?: () => void;
}

export function CanvasScene({ orbRef, introRef, feat1Ref, feat2Ref, swarmRef, onIntroReady }: CanvasSceneProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        
        {/* Core Lighting Setup for realistic glass transmission */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#A78BFA" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#8B5CF6" />
        <pointLight position={[0, 0, 0]} intensity={1.5} color="#7C3AED" distance={15} />
        
        {/* Deep space / subtle background particles */}
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          {/* Phase 1 Boot-up Intro Particles */}
          <IntroParticles ref={introRef} onReady={onIntroReady} />

          {/* The Glass Orb */}
          <Orb ref={orbRef} />
          
          {/* Phase 2 Feature Cards (Html bounded to 3D space) */}
          <FeatureCards feat1Ref={feat1Ref as any} feat2Ref={feat2Ref as any} />
          
          {/* Phase 4/5 Morphing Swarm */}
          <PlatformSwarm ref={swarmRef} />
          
          {/* Environment map to reflect off the clearcoat orb */}
          <Environment preset="dawn" background={false} />
        </Suspense>

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.8}
            mipmapBlur
            intensity={1.5}
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
