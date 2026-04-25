'use client';

import { useMemo, useRef, forwardRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const swarmVertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  
  attribute vec3 position2; // YouTube
  attribute vec3 position3; // Discord
  attribute vec3 position4; // X
  attribute vec3 position5; // Floor
  
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float prog = clamp(uMorphProgress, 0.0, 4.0);
    
    // Smooth interpolations between 5 distinct shapes
    float m1 = clamp(prog, 0.0, 1.0);
    float m2 = clamp(prog - 1.0, 0.0, 1.0);
    float m3 = clamp(prog - 2.0, 0.0, 1.0);
    float m4 = clamp(prog - 3.0, 0.0, 1.0);
    
    vec3 p1 = mix(position, position2, m1);
    vec3 p2 = mix(p1, position3, m2);
    vec3 p3 = mix(p2, position4, m3);
    vec3 finalPos = mix(p3, position5, m4);
    
    // Add noise based on time to keep swarm alive (except for rigid floor)
    float noiseY = sin(finalPos.x * 2.0 + uTime * 2.0) * 0.1 * (1.0 - m4);
    finalPos += vec3(0.0, noiseY, 0.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    vAlpha = 0.8 + sin(uTime * 3.0 + finalPos.x * 5.0) * 0.2;
    
    // Platform Color Palette
    vec3 colYoutube = vec3(1.0, 0.05, 0.1); 
    vec3 colDiscord = vec3(0.35, 0.4, 0.95);
    vec3 colX = vec3(0.95, 0.95, 0.95);
    vec3 colFloor = vec3(0.5, 0.2, 0.9);
    vec3 colChaos = vec3(0.7, 0.4, 1.0);
    
    vec3 col = colChaos;
    col = mix(col, colYoutube, m1);
    col = mix(col, colDiscord, m2);
    col = mix(col, colX, m3);
    col = mix(col, colFloor, m4);
    vColor = col;
    
    gl_PointSize = mix(8.0, 45.0, m1) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const swarmFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    
    // SHARP SHARDS: Cut bounds tightly by rendering tiny diamonds/triangles instead of soft circles
    float diamond = abs(p.x) + abs(p.y);
    if (diamond > 0.45) discard;
    
    gl_FragColor = vec4(vColor * 1.5, vAlpha);
  }
`;

export const PlatformSwarm = forwardRef<THREE.Points, any>((props, ref) => {
  const pointsRef = useRef<THREE.Points>(null);
  const internalRef = (ref as React.RefObject<THREE.Points>) || pointsRef;
  const count = 3000;
  
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loadAndParse = async () => {
      const loader = new SVGLoader();
      const loadSvg = (url: string) => new Promise<any>((resolve, reject) => loader.load(url, resolve, undefined, reject));
      
      try {
        const [ytData, discordData, xData] = await Promise.all([
          loadSvg('/youtube.svg'),
          loadSvg('/discord.svg'),
          loadSvg('/x.svg')
        ]);

        const extractPoints = (data: any) => {
          const shapes = [];
          for (const path of data.paths) {
            shapes.push(...path.toShapes(true));
          }
          
          let totalLength = 0;
          const curveLengths: number[] = [];
          const curves: THREE.Curve<THREE.Vector2>[] = [];
          
          shapes.forEach((shape: any) => {
            shape.curves.forEach((curve: any) => {
               const len = curve.getLength();
               totalLength += len;
               curveLengths.push(len);
               curves.push(curve);
            });
          });

          const pts = new Float32Array(count * 3);
          
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const targetL = Math.random() * totalLength;
            let currL = 0;
            let curveIdx = 0;
            
            for (let j = 0; j < curveLengths.length; j++) {
              if (currL + curveLengths[j] >= targetL) {
                curveIdx = j;
                break;
              }
              currL += curveLengths[j];
            }
            
            const curve = curves[curveIdx];
            const u = Math.random();
            const pt = curve ? curve.getPoint(u) : new THREE.Vector2(0, 0);

            pts[i3] = pt.x;
            pts[i3 + 1] = -pt.y; // Invert SVG origin
            pts[i3 + 2] = (Math.random() - 0.5) * 0.4;

            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, -pt.y);
            maxY = Math.max(maxY, -pt.y);
          }

          // Center & Prop Scale
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const w = maxX - minX;
          const h = maxY - minY;
          const isMobile = window.innerWidth < 768;
          const baseScale = isMobile ? 2.5 : 5.0; // Shrink significantly for mobile
          const scale = baseScale / Math.max(w, h, 0.01);

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            pts[i3] = (pts[i3] - cx) * scale;
            pts[i3 + 1] = (pts[i3 + 1] - cy) * scale;
          }
          return pts;
        };

        const p2 = extractPoints(ytData);
        const p3 = extractPoints(discordData);
        const p4 = extractPoints(xData);

        const p1 = new Float32Array(count * 3); 
        const p5 = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          // Chaos
          p1[i3] = (Math.random() - 0.5) * 30;
          p1[i3 + 1] = (Math.random() - 0.5) * 30;
          p1[i3 + 2] = (Math.random() - 0.5) * 30;

          // Sand Floor
          const r = Math.random() * 14;
          const theta = Math.random() * Math.PI * 2;
          p5[i3] = Math.cos(theta) * r;
          p5[i3 + 1] = -5;
          p5[i3 + 2] = Math.sin(theta) * r;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(p1, 3));
        geom.setAttribute('position2', new THREE.BufferAttribute(p2, 3));
        geom.setAttribute('position3', new THREE.BufferAttribute(p3, 3));
        geom.setAttribute('position4', new THREE.BufferAttribute(p4, 3));
        geom.setAttribute('position5', new THREE.BufferAttribute(p5, 3));
        
        setGeometry(geom);
      } catch (e) {
        console.error("Platform Swarm SVG Load Error:", e);
      }
    };
    
    loadAndParse();
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphProgress: { value: 0 } 
  }), []);

  useFrame((state) => {
    if (internalRef.current?.material) {
      const mat = internalRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      
      if (internalRef.current.userData.uniforms) {
        mat.uniforms.uMorphProgress.value = internalRef.current.userData.uniforms.uMorphProgress.value;
      }
    }
  });

  if (!geometry) return null;

  return (
    <points ref={internalRef} geometry={geometry} userData={{ uniforms }}>
      <shaderMaterial
        vertexShader={swarmVertexShader}
        fragmentShader={swarmFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

PlatformSwarm.displayName = 'PlatformSwarm';
