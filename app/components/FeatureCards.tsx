'use client';

import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface FeatureCardsProps {
  feat1Ref: React.RefObject<THREE.Group | null>;
  feat2Ref: React.RefObject<THREE.Group | null>;
}

export function FeatureCards({ feat1Ref, feat2Ref }: FeatureCardsProps) {
  return (
    <>
      {/* 
        Feature 01: Hook Score 
        Defaults to far right (x: 15) outside frustum initially.
      */}
      <group ref={feat1Ref} position={[15, 0, 0]}>
        <Html transform distanceFactor={3.5} position={[0, 0, 0]}>
          <div className="feature-1 opacity-0 relative max-w-[360px] min-w-[310px] p-[2rem_2.1rem] rounded-[24px] bg-gradient-to-br from-[rgba(35,15,75,0.88)] via-[rgba(60,30,130,0.75)] to-[rgba(80,40,160,0.7)] backdrop-blur-[28px] shadow-[0_0_70px_rgba(167,139,250,0.35),0_0_130px_rgba(139,92,246,0.18),inset_0_0_30px_rgba(200,170,255,0.07),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden text-left border border-white/5 mx-auto">
            {/* Mist Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(220,195,255,0.16),transparent_55%)] pointer-events-none" />
            
            {/* Need to add tailwind mistSwirl in global CSS so keeping a fallback inline rotate logic if absent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(139,92,246,0.1))] pointer-events-none animate-[mistSwirl_8s_linear_infinite]" />
            
            <div className="w-[42px] h-[42px] bg-purple-500/20 border border-purple-400/30 rounded-xl flex items-center justify-center text-[1.3rem] mb-4 relative z-10">⚡</div>
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[#A78BFA] mb-2.5 relative z-10">Feature 01 — Hook Score</div>
            <div className="font-syne text-[1.5rem] font-bold leading-[1.2] mb-3 relative z-10">Score Your<br/>First 3 Seconds</div>
            
            <div className="w-[90px] h-[90px] mx-auto mb-1 relative z-10">
              <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C3AED"/>
                      <stop offset="100%" stopColor="#C084FC"/>
                    </linearGradient>
                  </defs>
                <circle className="stroke-purple-500/15" fill="none" strokeWidth="6" strokeLinecap="round" cx="45" cy="45" r="35"/>
                <circle style={{stroke:"url(#rG)", strokeDasharray:"220", strokeDashoffset:"28"}} fill="none" strokeWidth="6" strokeLinecap="round" cx="45" cy="45" r="35"/>
              </svg>
            </div>
            <div className="font-syne text-[3.2rem] font-extrabold text-[#A78BFA] text-center drop-shadow-[0_0_30px_rgba(167,139,250,0.5)] pt-2 relative z-10">87</div>
            <div className="text-center text-[0.72rem] text-[#8A8499] mb-4 relative z-10">Hook Strength / 100</div>
            
            <div className="text-[0.88rem] text-[#BBB5CE] leading-[1.6] mb-[1.1rem] font-light relative z-10">AI analyzes motion density, face presence, visual contrast, and audio energy to predict how many viewers survive your opening.</div>
            
            <div className="flex flex-wrap gap-2 relative z-10">
              {['Motion Density', 'Visual Contrast', 'Audio Energy', 'Text Timing'].map(t => (
                <span key={t} className="bg-purple-500/20 border border-purple-400/30 text-[#A78BFA] px-3 py-1 rounded-full text-[0.72rem]">{t}</span>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* 
        Feature 02: Retention Heat Map
        Defaults to far left (x: -15) 
      */}
      <group ref={feat2Ref} position={[-15, 0, 0]}>
        <Html transform distanceFactor={3.5} position={[0, 0, 0]}>
          <div className="feature-2 opacity-0 relative max-w-[360px] min-w-[310px] p-[2rem_2.1rem] rounded-[24px] bg-gradient-to-br from-[rgba(35,15,75,0.88)] via-[rgba(60,30,130,0.75)] to-[rgba(80,40,160,0.7)] backdrop-blur-[28px] shadow-[0_0_70px_rgba(167,139,250,0.35),0_0_130px_rgba(139,92,246,0.18),inset_0_0_30px_rgba(200,170,255,0.07),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden text-left border border-white/5 mx-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(220,195,255,0.16),transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(139,92,246,0.1))] pointer-events-none animate-[mistSwirl_8s_linear_infinite]" />
            
            <div className="w-[42px] h-[42px] bg-purple-500/20 border border-purple-400/30 rounded-xl flex items-center justify-center text-[1.3rem] mb-4 relative z-10">🔥</div>
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[#A78BFA] mb-2.5 relative z-10">Feature 02 — Retention Heat Map</div>
            <div className="font-syne text-[1.5rem] font-bold leading-[1.2] mb-3 relative z-10">Spot Drop-Off<br/>Before It Hurts</div>
            
            <div className="relative h-[48px] bg-black/30 rounded-lg overflow-hidden mb-4 z-10 mt-10">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500/90 via-[45%] to-red-500 to-[75%]" />
              
              <div className="absolute top-0 w-[2px] h-full bg-white/80" style={{left:'32%'}}>
                <span className="absolute -top-[24px] left-1/2 -translate-x-1/2 text-[0.68rem] font-bold whitespace-nowrap text-amber-400">9:12 ↓</span>
              </div>
              <div className="absolute top-0 w-[2px] h-full bg-white/80" style={{left:'63%'}}>
                <span className="absolute -top-[24px] left-1/2 -translate-x-1/2 text-[0.68rem] font-bold whitespace-nowrap text-red-400">15:44 ↓↓</span>
              </div>
            </div>
            
            <div className="text-[0.88rem] text-[#BBB5CE] leading-[1.6] mb-[1.1rem] font-light relative z-10 mt-2">Color-coded heatmap shows every second of your video. See noticeable drops and high-risk zones before a single view goes to waste.</div>
            
            <div className="flex flex-wrap gap-2 relative z-10">
              {['Predict Drop-off Zones', 'Color-coded Severity', 'Noticeable Drop Alerts'].map(t => (
                <span key={t} className="bg-purple-500/20 border border-purple-400/30 text-[#A78BFA] px-3 py-1 rounded-full text-[0.72rem]">{t}</span>
              ))}
            </div>
          </div>
        </Html>
      </group>
    </>
  );
}
