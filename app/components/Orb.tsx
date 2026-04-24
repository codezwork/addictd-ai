'use client';

import { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Procedural noise and storm shader for the inner core
const stormVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const stormFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  varying vec2 vUv;
  varying vec3 vPosition;

  // Simple 3D noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Generate swirling noise based on position and time
    float n1 = snoise(vPosition * 1.5 + uTime * 0.2);
    float n2 = snoise(vPosition * 3.0 - uTime * 0.4);
    
    float noise = (n1 + n2 * 0.5) * 0.5 + 0.5; // map to 0.0 - 1.0
    
    // Create an emissive pulsing effect
    float pulse = sin(uTime * 1.5) * 0.5 + 0.5;
    
    // Mix colors based on noise and intensity
    vec3 finalColor = mix(uColor1, uColor2, noise);
    finalColor *= (0.2 + noise * 0.8 * uIntensity);
    
    // Boost brightness at core
    float coreGlow = 1.0 - min(length(vPosition) / 1.8, 1.0);
    finalColor += uColor2 * coreGlow * uIntensity * pulse;
    
    gl_FragColor = vec4(finalColor, min(noise * uIntensity + coreGlow, 1.0));
    gl_FragColor *= uOpacity; // Fade out the inner storm explicitly
  }
`;

export interface OrbUniforms {
  uIntensity: { value: number };
  uCrackProgress: { value: number };
  uOpacity: { value: number };
  uOrbX: { value: number };
}

export const Orb = forwardRef<THREE.Group, any>((props, ref) => {
  const [normalMap, roughnessMap] = useTexture([
    'https://pub-69194194969748808ac2ed52335b350f.r2.dev/cracks_normal.jpg',
    'https://pub-69194194969748808ac2ed52335b350f.r2.dev/smudges_roughness.jpg'
  ]);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // ADD THESE 4 LINES RIGHT HERE, after useTexture:
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
normalMap.repeat.set(0.02, 0.02);
roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
roughnessMap.repeat.set(2, 2);
  
  // Custom uniforms for the inner storm and cracks
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.2 }, // Starts calm
    uCrackProgress: { value: 0 },
    uOpacity: { value: 1.0 },
    uOrbX: { value: 0.0 },
    uColor1: { value: new THREE.Color("#4C1D95") }, // Deep purple
    uColor2: { value: new THREE.Color("#C4B5FD") }, // Light purple/pink
  }), []);

  // Expose uniforms to the parent GSAP orchestrator via a custom property on the group
  const outerGroupRef = useRef<THREE.Group>(null);
  const groupRef = (ref as React.RefObject<THREE.Group>) || outerGroupRef;

  useFrame((state) => {
    if (innerMeshRef.current) {
      // Rotate inner storm opposite to outer shell for parallax
      innerMeshRef.current.rotation.y = -state.clock.elapsedTime * 0.1;
      innerMeshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
      
      // Update shader time uniform
      const material = innerMeshRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
    
    if (groupRef.current) {
      // Assign custom uniforms object to outer group userData so GSAP can target it easily!
      if (!groupRef.current.userData.uniforms) {
        groupRef.current.userData.uniforms = uniforms;
      }
      
      // Keep uniforms synced between GSAP-driven userData and the shader material
      if (innerMeshRef.current) {
        const material = innerMeshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uIntensity.value = groupRef.current.userData.uniforms.uIntensity.value;
      }
      
      if (glassMatRef.current) {
        glassMatRef.current.opacity = groupRef.current.userData.uniforms.uOpacity.value;
        glassMatRef.current.clearcoat = groupRef.current.userData.uniforms.uOpacity.value;
      }
      
      // SHAKE PHYSICS
      const intensity = groupRef.current.userData.uniforms.uIntensity.value;
      const orbX = groupRef.current.userData.uniforms.uOrbX.value;
      
      // Scale amplitude by intensity (very chill at 0.2, violent closer to 1.0)
      const shakeHz = 25.0; // high frequency
      const shakeAmp = Math.max(0, (intensity - 0.2)) * 0.15; 
      
      groupRef.current.position.x = orbX + (Math.sin(state.clock.elapsedTime * shakeHz) * shakeAmp);
      groupRef.current.position.y = Math.cos(state.clock.elapsedTime * shakeHz * 1.1) * shakeAmp;
      groupRef.current.position.z = Math.sin(state.clock.elapsedTime * shakeHz * 0.9) * shakeAmp;

      // Idle float rotation
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={0}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
        {/* Outer Glass Shell */}
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshPhysicalMaterial
            ref={glassMatRef}
            color="#3D1A78"
            emissive="#0D0328"
            emissiveIntensity={0.2}
            roughness={0.05}
            metalness={0.1}
            transmission={1.0}
            thickness={1.5}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            transparent={true}
            opacity={1}
            normalMap={normalMap}
            roughnessMap={roughnessMap}
            envMapIntensity={2.5}
          />
          
          {/* Inner Storm Core */}
          <mesh ref={innerMeshRef} scale={0.95}>
            <icosahedronGeometry args={[2, 16]} />
            <shaderMaterial
              vertexShader={stormVertexShader}
              fragmentShader={stormFragmentShader}
              uniforms={uniforms}
              transparent={true}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </mesh>

        {/* Mist & Crack Emitters (Driven by same uniform state invisibly) */}
        <Sparkles 
          count={150} 
          scale={6} 
          size={4}
          speed={0.4}
          opacity={0.3} 
          color="#A78BFA" 
        />
      </Float>
    </group>
  );
});

Orb.displayName = 'Orb';
