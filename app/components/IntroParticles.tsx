'use client';

import { useMemo, useRef, forwardRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const N = 2000;
const SPH_R = 2.0;

export interface IntroUniforms {
  uStage1: { value: number }; // 0: spawn, 1: wave
  uStage2: { value: number }; // 0: wave, 1: vortex
  uStage3: { value: number }; // 0: vortex, 1: sphere
}

interface IntroParticlesProps {
  onReady?: () => void;
}

const introVertexShader = `
  attribute vec3 aSpawn;
  attribute vec3 aWave;
  attribute vec3 aVortex;
  attribute vec3 aSphere;
  attribute float aRandom;
  
  uniform float uStage1;
  uniform float uStage2;
  uniform float uStage3;
  uniform float uTime;
  
  varying float vAlpha;
  
  void main() {
    // Basic interpolation cascades
    // Spawn -> Wave
    vec3 pos = mix(aSpawn, aWave, uStage1);
    
    // Wave -> Vortex
    // Add swirl effect based on uStage2
    float swirlAngle = uStage2 * (aRandom * 15.0 + uTime * 5.0);
    float s = sin(swirlAngle);
    float c = cos(swirlAngle);
    vec3 vortexTwisted = vec3(
      aVortex.x * c - aVortex.z * s,
      aVortex.y,
      aVortex.x * s + aVortex.z * c
    );
    pos = mix(pos, vortexTwisted, uStage2);
    
    // Vortex -> Sphere
    pos = mix(pos, aSphere, uStage3);
    
    // Small idle movement
    pos.x += sin(uTime * 2.0 + aRandom * 10.0) * 0.04 * (1.0 - uStage3);
    pos.y += cos(uTime * 1.5 + aRandom * 10.0) * 0.04 * (1.0 - uStage3);

    // Fade out completely as it hits sphere final stage to seamlessly handoff to actual orb
    vAlpha = (1.0 - uStage3) * (0.2 + aRandom * 0.8);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Point size
    gl_PointSize = (20.0 * aRandom + 8.0) * (1.0 / -mvPosition.z) * (1.0 - uStage3 * 0.5);
  }
`;

const introFragmentShader = `
  varying float vAlpha;
  void main() {
    // Generate soft circular particle
    vec2 p = gl_PointCoord - vec2(0.5);
    float dist = length(p);
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
    gl_FragColor = vec4(0.65, 0.55, 0.98, alpha);
  }
`;

export const IntroParticles = forwardRef<THREE.Points, IntroParticlesProps>((props, ref) => {
  const localRef = useRef<THREE.Points>(null);
  const pointsRef = (ref as React.RefObject<THREE.Points>) || localRef;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStage1: { value: 0 },
    uStage2: { value: 0 },
    uStage3: { value: 0 }
  }), []);

  const buffers = useMemo(() => {
    const s = new Float32Array(N * 3);
    const wav = new Float32Array(N * 3);
    const v = new Float32Array(N * 3);
    const sph = new Float32Array(N * 3);
    const r = new Float32Array(N);

    // Waveform line segments
    const wavePts = [
      [0.08, 0.5], [0.22, 0.5], [0.30, 0.25], [0.40, 0.80],
      [0.50, 0.20], [0.60, 0.78], [0.70, 0.5], [0.92, 0.5]
    ];
    let totalLength = 0;
    const lengths = [];
    for (let i = 0; i < wavePts.length - 1; i++) {
      const dx = wavePts[i + 1][0] - wavePts[i][0];
      const dy = wavePts[i + 1][1] - wavePts[i][1];
      const len = Math.hypot(dx, dy);
      lengths.push(len);
      totalLength += len;
    }

    const phi = Math.PI * (3 - Math.sqrt(5)); // Fibonacci

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      r[i] = Math.random();

      // SPAWN: Random scattered far left
      s[i3] = -15 - Math.random() * 10;
      s[i3 + 1] = (Math.random() - 0.5) * 10;
      s[i3 + 2] = (Math.random() - 0.5) * 10;

      // WAVE: Distributed cleanly along path, scaled
      const targetL = Math.random() * totalLength;
      let currL = 0;
      let seg = 0;
      for (let j = 0; j < lengths.length; j++) {
        if (currL + lengths[j] >= targetL) {
          seg = j;
          break;
        }
        currL += lengths[j];
      }
      const t = lengths[seg] > 0 ? (targetL - currL) / lengths[seg] : 0;
      let wx = wavePts[seg][0] + t * (wavePts[seg + 1][0] - wavePts[seg][0]);
      let wy = wavePts[seg][1] + t * (wavePts[seg + 1][1] - wavePts[seg][1]);
      
      // Map wave 0-1 bounds roughly to -3..3 and -1.5..1.5
      wav[i3] = (wx - 0.5) * 6;
      wav[i3 + 1] = (wy - 0.5) * -3 + (Math.random() - 0.5) * 0.15; // negate Y to match SVG standard drawing space and add jitter
      wav[i3 + 2] = (Math.random() - 0.5) * 0.15;

      // VORTEX: Form a chaotic cylinder/funnel.
      const vortexY = (Math.random() - 0.5) * 6; 
      const vortexR = SPH_R * (0.2 + Math.random() * 0.8) * (1.0 + Math.abs(vortexY / 3)); 
      const vAng = Math.random() * Math.PI * 2;
      v[i3] = Math.cos(vAng) * vortexR;
      v[i3 + 1] = vortexY;
      v[i3 + 2] = Math.sin(vAng) * vortexR;

      // SPHERE: Fibonacci sphere wrapping the actual orb
      const y = 1 - (i / (N - 1)) * 2;
      const sr = Math.sqrt(1 - y * y);
      const theta = phi * i;
      sph[i3] = Math.cos(theta) * sr * SPH_R * 1.05; // slightly larger than the Orb
      sph[i3 + 1] = y * SPH_R * 1.05;
      sph[i3 + 2] = Math.sin(theta) * sr * SPH_R * 1.05;
    }

    return { spawn: s, wave: wav, vortex: v, sphere: sph, randoms: r };
  }, []);

  useEffect(() => {
    // Because buffers generate synchronously on mount, we can instantly trigger onReady
    if (props.onReady) {
      props.onReady();
    }
  }, [props]);

  // Construct raw THREE geometry perfectly immune to generic React property diffing bugs
  const geometry = useMemo(() => {
    if (!buffers) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(buffers.spawn, 3));
    geom.setAttribute('aSpawn', new THREE.BufferAttribute(buffers.spawn, 3));
    geom.setAttribute('aWave', new THREE.BufferAttribute(buffers.wave, 3));
    geom.setAttribute('aVortex', new THREE.BufferAttribute(buffers.vortex, 3));
    geom.setAttribute('aSphere', new THREE.BufferAttribute(buffers.sphere, 3));
    geom.setAttribute('aRandom', new THREE.BufferAttribute(buffers.randoms, 1));
    return geom;
  }, [buffers]);

  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
      }
      if (!pointsRef.current.userData.uniforms) {
        pointsRef.current.userData.uniforms = uniforms;
      } else {
        mat.uniforms.uStage1.value = pointsRef.current.userData.uniforms.uStage1.value;
        mat.uniforms.uStage2.value = pointsRef.current.userData.uniforms.uStage2.value;
        mat.uniforms.uStage3.value = pointsRef.current.userData.uniforms.uStage3.value;
      }
    }
  });

  if (!geometry) return null;

  return (
    // ADD frustumCulled={false} right here 👇
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={introVertexShader}
        fragmentShader={introFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

IntroParticles.displayName = 'IntroParticles';