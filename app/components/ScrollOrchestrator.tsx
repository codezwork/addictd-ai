'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three';
import { CanvasScene } from './CanvasScene';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function ScrollOrchestrator() {
  const mainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<THREE.Group>(null);
  const introRef = useRef<THREE.Points>(null);
  const swarmRef = useRef<THREE.Points>(null);
  const feat1Ref = useRef<THREE.Group>(null);
  const feat2Ref = useRef<THREE.Group>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const swarmTextRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<HTMLDivElement>(null);
  const dcRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const introTLRef = useRef<gsap.core.Timeline>(null);
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    // --- PHASE 1: BOOT-UP INTRO SEQUENCE ---
    // Lock scrolling initially
    document.body.style.overflow = 'hidden';
    
    // Intro Proxy to drive the WebGL shader uniforms via JS cleanly, bypassing early-mount null refs
    const introProxy = { stage1: 0, stage2: 0, stage3: 0, orbScale: 0.01 };
    
    const introTL = gsap.timeline({
      paused: true, // Paused until IntroParticles SVGLoader finishes
      onUpdate: () => {
        if (introRef.current?.userData?.uniforms) {
          introRef.current.userData.uniforms.uStage1.value = introProxy.stage1;
          introRef.current.userData.uniforms.uStage2.value = introProxy.stage2;
          introRef.current.userData.uniforms.uStage3.value = introProxy.stage3;
        }
        if (orbRef.current) {
          orbRef.current.scale.setScalar(introProxy.orbScale);
        }
      },
      onComplete: () => {
        // Unlock scrolling once fully booted
        document.body.style.overflow = '';
      }
    });
    
    introTLRef.current = introTL;

    // Spawn -> Waveform (0.0s to 2.0s)
    introTL.to(introProxy, {
      stage1: 1.0,
      duration: 2.0,
      ease: 'power2.out'
    }, 0);

    // Waveform -> Tornado Vortex (2.0s to 3.0s)
    introTL.to(introProxy, {
      stage2: 1.0,
      duration: 1.0,
      ease: 'power2.inOut'
    }, 2.0);

    // Tornado -> Fibonacci Sphere (3.0s to 4.0s)
    introTL.to(introProxy, {
      stage3: 1.0,
      duration: 1.0,
      ease: 'power2.inOut'
    }, 3.0);

    // Crystallize: Materialize the actual Glass Orb underneath the particles safely via proxy
    introTL.to(introProxy, {
      orbScale: 1.0,
      duration: 0.8,
      ease: 'back.out(1.5)'
    }, 3.4); // Start slightly before sphere finishes forming

    // Fade in Hero UI Text
    if (heroTextRef.current) {
      introTL.to(heroTextRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power2.out'
      }, 3.8);
    }
    
    // --- PHASE 2: SCROLL TRIGGERS ---
    const mm = gsap.matchMedia();
    
        mm.add('(min-width: 768px)', () => {
      // Create the main timeline tied to the scroll depth
      // We will map duration strictly across 100 to easily use % semantics
      const scrollTL = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth scrubbing
        }
      });
      
      const scrollProxy = { 
        intensity: 0.2, crackProgress: 0, 
        orbRotationY: 0, 
        feat1X: 15, feat1Opacity: 0, 
        feat2X: -15, feat2Opacity: 0,
        orbScaleX: 1.0, orbScaleY: 1.0, orbScaleZ: 1.0, morphProgress: 0.0,
        orbX: 0.0, orbY: 0.0,
        swarmTextOpacity: 0.0, ytOp: 0.0, dcOp: 0.0, xOp: 0.0
      };

      const update3D = () => {
        // 1. Uniforms
        if (orbRef.current?.userData?.uniforms) {
          orbRef.current.userData.uniforms.uIntensity.value = scrollProxy.intensity;
          orbRef.current.userData.uniforms.uCrackProgress.value = scrollProxy.crackProgress;
          if (orbRef.current.userData.uniforms.uOrbX) {
            orbRef.current.userData.uniforms.uOrbX.value = scrollProxy.orbX;
          }
          if (orbRef.current.userData.uniforms.uOrbY) {
            orbRef.current.userData.uniforms.uOrbY.value = scrollProxy.orbY;
          }
        }
        if (swarmRef.current?.userData?.uniforms) {
          swarmRef.current.userData.uniforms.uMorphProgress.value = scrollProxy.morphProgress;
        }
        // 2. Orb Rotation & Scale
        if (orbRef.current) {
          orbRef.current.rotation.y = scrollProxy.orbRotationY;
          orbRef.current.scale.set(scrollProxy.orbScaleX, scrollProxy.orbScaleY, scrollProxy.orbScaleZ);
        }
        // 3. 3D Card Positions
        if (feat1Ref.current) feat1Ref.current.position.x = scrollProxy.feat1X;
        if (feat2Ref.current) feat2Ref.current.position.x = scrollProxy.feat2X;
        
        // 4. HTML Opacities
        const f1 = document.querySelector('.feature-1') as HTMLElement;
        if (f1) f1.style.opacity = scrollProxy.feat1Opacity.toString();
        
        const f2 = document.querySelector('.feature-2') as HTMLElement;
        if (f2) f2.style.opacity = scrollProxy.feat2Opacity.toString();
        
        // Phase 4 Typography Update
        if (swarmTextRef.current) swarmTextRef.current.style.opacity = scrollProxy.swarmTextOpacity.toString();
        if (ytRef.current) ytRef.current.style.opacity = scrollProxy.ytOp.toString();
        if (dcRef.current) dcRef.current.style.opacity = scrollProxy.dcOp.toString();
        if (xRef.current) xRef.current.style.opacity = scrollProxy.xOp.toString();
      };

      // 0% - 15%: Fade out the heroTextRef
      if (heroTextRef.current) {
        scrollTL.to(heroTextRef.current, {
          opacity: 0,
          y: -50,
          ease: 'power1.inOut',
          duration: 15
        }, 0);
      }

      // 15% - 40% Scroll (First Stop)
      scrollTL.to(scrollProxy, {
        orbRotationY: Math.PI * 2,
        intensity: 0.5,
        crackProgress: 0.5,
        feat1X: 3,
        feat1Opacity: 1,
        orbX: -2.5,
        ease: 'power2.inOut',
        duration: 25,
        onUpdate: update3D
      }, 15);

      // 40% - 70% Scroll (Second Stop)
      scrollTL.to(scrollProxy, {
        feat1X: 15,
        feat1Opacity: 0,
        orbRotationY: Math.PI * 4,
        intensity: 0.8,
        crackProgress: 0.8,
        feat2X: -3,
        feat2Opacity: 1,
        orbX: 2.5,
        ease: 'power2.inOut',
        duration: 30,
        onUpdate: update3D
      }, 40);

      // 70% - 75% Scroll (Card Exit, Reach Max Volatility before Shatter)
      scrollTL.to(scrollProxy, {
        feat2X: -15,
        feat2Opacity: 0,
        intensity: 1.0,
        crackProgress: 1.0,
        orbX: 0,
        ease: 'power2.inOut',
        duration: 5,
        onUpdate: update3D
      }, 70);

      // 75% - 90%: The Containment Breach (Orb Shatters smoothly to void)
      scrollTL.to(scrollProxy, {
        orbScaleX: 0,
        orbScaleY: 0,
        orbScaleZ: 0,
        intensity: 0,
        ease: 'power2.inOut',
        duration: 15,
        onUpdate: update3D
      }, 75);

      // 85% - 95%: Swarm YouTube Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 1.0,
        swarmTextOpacity: 1.0,
        ytOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 85);
      
      scrollTL.to(scrollProxy, { ytOp: 0, duration: 2, ease: 'power2.inOut', onUpdate: update3D }, 95);

      // 100% - 110%: Swarm Discord Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 2.0,
        dcOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 100);
      
      scrollTL.to(scrollProxy, { dcOp: 0, duration: 2, ease: 'power2.inOut', onUpdate: update3D }, 110);

      // 115% - 125%: Swarm X Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 3.0,
        xOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 115);
      
      // Before sand falls, fade entire overlay out
      scrollTL.to(scrollProxy, { xOp: 0, swarmTextOpacity: 0, duration: 4, ease: 'power2.inOut', onUpdate: update3D }, 125);

      // 130% - 140%: Swarm drops to Sand Floor
      scrollTL.to(scrollProxy, {
        morphProgress: 4.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 130);
      
    });

    mm.add('(max-width: 767px)', () => {
      // Create the main timeline tied to the scroll depth
      // We will map duration strictly across 100 to easily use % semantics
      const scrollTL = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth scrubbing
        }
      });
      
      const scrollProxy = { 
        intensity: 0.2, crackProgress: 0, 
        orbRotationY: 0, 
        feat1X: 15, feat1Opacity: 0, 
        feat2X: -15, feat2Opacity: 0,
        orbScaleX: 1.0, orbScaleY: 1.0, orbScaleZ: 1.0, morphProgress: 0.0,
        orbX: 0.0, orbY: 0.0,
        swarmTextOpacity: 0.0, ytOp: 0.0, dcOp: 0.0, xOp: 0.0
      };

      const update3D = () => {
        // 1. Uniforms
        if (orbRef.current?.userData?.uniforms) {
          orbRef.current.userData.uniforms.uIntensity.value = scrollProxy.intensity;
          orbRef.current.userData.uniforms.uCrackProgress.value = scrollProxy.crackProgress;
          if (orbRef.current.userData.uniforms.uOrbX) {
            orbRef.current.userData.uniforms.uOrbX.value = scrollProxy.orbX;
          }
          if (orbRef.current.userData.uniforms.uOrbY) {
            orbRef.current.userData.uniforms.uOrbY.value = scrollProxy.orbY;
          }
        }
        if (swarmRef.current?.userData?.uniforms) {
          swarmRef.current.userData.uniforms.uMorphProgress.value = scrollProxy.morphProgress;
        }
        // 2. Orb Rotation & Scale
        if (orbRef.current) {
          orbRef.current.rotation.y = scrollProxy.orbRotationY;
          orbRef.current.scale.set(scrollProxy.orbScaleX, scrollProxy.orbScaleY, scrollProxy.orbScaleZ);
        }
        // 3. 3D Card Positions
        if (feat1Ref.current) feat1Ref.current.position.x = scrollProxy.feat1X;
        if (feat2Ref.current) feat2Ref.current.position.x = scrollProxy.feat2X;
        
        // 4. HTML Opacities
        const f1 = document.querySelector('.feature-1') as HTMLElement;
        if (f1) f1.style.opacity = scrollProxy.feat1Opacity.toString();
        
        const f2 = document.querySelector('.feature-2') as HTMLElement;
        if (f2) f2.style.opacity = scrollProxy.feat2Opacity.toString();
        
        // Phase 4 Typography Update
        if (swarmTextRef.current) swarmTextRef.current.style.opacity = scrollProxy.swarmTextOpacity.toString();
        if (ytRef.current) ytRef.current.style.opacity = scrollProxy.ytOp.toString();
        if (dcRef.current) dcRef.current.style.opacity = scrollProxy.dcOp.toString();
        if (xRef.current) xRef.current.style.opacity = scrollProxy.xOp.toString();
      };

      // 0% - 15%: Fade out the heroTextRef
      if (heroTextRef.current) {
        scrollTL.to(heroTextRef.current, {
          opacity: 0,
          y: -50,
          ease: 'power1.inOut',
          duration: 15
        }, 0);
      }

      // 15% - 40% Scroll (First Stop)
      scrollTL.to(scrollProxy, {
        orbRotationY: Math.PI * 2,
        intensity: 0.5,
        crackProgress: 0.5,
        feat1X: 0,
        feat1Opacity: 1,
        orbY: 1.5,
        orbX: 0,
        ease: 'power2.inOut',
        duration: 25,
        onUpdate: update3D
      }, 15);

      // 40% - 70% Scroll (Second Stop)
      scrollTL.to(scrollProxy, {
        feat1X: 15,
        feat1Opacity: 0,
        orbRotationY: Math.PI * 4,
        intensity: 0.8,
        crackProgress: 0.8,
        feat2X: 0,
        feat2Opacity: 1,
        orbY: 1.5,
        orbX: 0,
        ease: 'power2.inOut',
        duration: 30,
        onUpdate: update3D
      }, 40);

      // 70% - 75% Scroll (Card Exit, Reach Max Volatility before Shatter)
      scrollTL.to(scrollProxy, {
        feat2X: -15,
        feat2Opacity: 0,
        intensity: 1.0,
        crackProgress: 1.0,
        orbY: 0,
        orbX: 0,
        ease: 'power2.inOut',
        duration: 5,
        onUpdate: update3D
      }, 70);

      // 75% - 90%: The Containment Breach (Orb Shatters smoothly to void)
      scrollTL.to(scrollProxy, {
        orbScaleX: 0,
        orbScaleY: 0,
        orbScaleZ: 0,
        intensity: 0,
        ease: 'power2.inOut',
        duration: 15,
        onUpdate: update3D
      }, 75);

      // 85% - 95%: Swarm YouTube Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 1.0,
        swarmTextOpacity: 1.0,
        ytOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 85);
      
      scrollTL.to(scrollProxy, { ytOp: 0, duration: 2, ease: 'power2.inOut', onUpdate: update3D }, 95);

      // 100% - 110%: Swarm Discord Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 2.0,
        dcOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 100);
      
      scrollTL.to(scrollProxy, { dcOp: 0, duration: 2, ease: 'power2.inOut', onUpdate: update3D }, 110);

      // 115% - 125%: Swarm X Logo
      scrollTL.to(scrollProxy, {
        morphProgress: 3.0,
        xOp: 1.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 115);
      
      // Before sand falls, fade entire overlay out
      scrollTL.to(scrollProxy, { xOp: 0, swarmTextOpacity: 0, duration: 4, ease: 'power2.inOut', onUpdate: update3D }, 125);

      // 130% - 140%: Swarm drops to Sand Floor
      scrollTL.to(scrollProxy, {
        morphProgress: 4.0,
        ease: 'power2.inOut',
        duration: 10,
        onUpdate: update3D
      }, 130);
      
    });

    return () => mm.revert();
  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="relative w-full">
      {/* 1. FREE CANVAS: Attached strictly to the viewport */}
      <CanvasScene 
        orbRef={orbRef} 
        introRef={introRef} 
        swarmRef={swarmRef}
        feat1Ref={feat1Ref}
        feat2Ref={feat2Ref}
        onIntroReady={() => {
          if (introTLRef.current) introTLRef.current.play();
        }}
      />

      {/* 2. SCROLL DOM: Sits on top of the canvas */}
      <div ref={containerRef} className="relative w-full text-white" style={{ height: '1000vh' }}>
        
        {/* Pinned Hero Overlay */}
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          
          {/* Hero Overlay (z-10) */}
          <div 
            ref={heroTextRef} 
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none opacity-0 translate-y-8"
          >
            <div className="max-w-4xl text-center px-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 font-[family-name:var(--font-syne)] uppercase" style={{ textShadow: "0 0 30px rgba(167,139,250,0.6)" }}>
                Know <em className="italic text-purple-400">when</em> and <em className="italic text-purple-400">why</em><br/>your viewer will swipe away
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">
                Upload a Short before you publish. Get a second-by-second breakdown showing exactly when viewers drop off — and what to fix.
              </p>
            </div>
            
            <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-bounce">
              <p className="text-zinc-500 font-mono tracking-widest text-xs uppercase">
                Scroll to explore
              </p>
              <div className="w-px h-8 bg-gradient-to-b from-purple-500 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Phase 4 Swarm UI Sync Overlay */}
        <div ref={swarmTextRef} className="fixed inset-0 flex flex-col items-center justify-center z-20 pointer-events-none opacity-0">
          <div className="text-[0.72rem] tracking-[0.2em] uppercase text-purple-400 mb-4 -mt-24">Pick Your Platform</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-28 font-[family-name:var(--font-syne)] uppercase text-center max-w-4xl px-4" style={{ textShadow: "0 0 30px rgba(167,139,250,0.6)" }}>
            Works on every platform<br />you <em className="italic text-purple-400">already live on</em>
          </h2>
          <div className="relative w-full flex justify-center items-center text-4xl md:text-6xl font-bold font-syne uppercase tracking-wider h-16">
            <div ref={ytRef} className="absolute text-[#FF0000] opacity-0" style={{ textShadow: '0 0 40px rgba(255,0,0,0.8)' }}>YouTube</div>
            <div ref={dcRef} className="absolute text-[#5865F2] opacity-0" style={{ textShadow: '0 0 40px rgba(88,101,242,0.8)' }}>Discord</div>
            <div ref={xRef} className="absolute text-white opacity-0" style={{ textShadow: '0 0 40px rgba(255,255,255,0.8)' }}>X (Twitter)</div>
          </div>
        </div>

      </div>

      {/* NEW NATIVE PRICING BLOCK HERE */}
        <div className="relative w-full min-h-screen flex flex-col items-center justify-start md:justify-center p-4 pt-32 pb-0 z-10 bg-gradient-to-b from-transparent via-[#06040F]/90 to-[#06040F]">
          <div className="text-[0.72rem] tracking-[0.2em] uppercase text-purple-400 mb-3">Pricing</div>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 font-[family-name:var(--font-syne)]" style={{ textShadow: "0 0 30px rgba(167,139,250,0.6)" }}>
              Pick your tier.<br /><em className="italic text-purple-400">Start analyzing today.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 scale-[0.9] sm:scale-100 max-w-6xl w-full justify-center mb-24 md:mb-32">
            
            {/* Trial Tier */}
            <div className="rounded-[22px] bg-[#0D0A1F] border border-purple-500/25 p-8 relative flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-purple-400/50 hover:shadow-[0_25px_55px_rgba(139,92,246,0.3)]">
              <div className="absolute top-6 right-6 bg-gradient-to-br from-[#3D1A78] to-[#8B5CF6] text-white text-[0.66rem] font-medium px-3 py-1 rounded-full uppercase tracking-wider">Best for testing</div>
              <div className="text-[0.62rem] tracking-[0.2em] text-[#8A8499] uppercase mb-1">PLAN</div>
              <h3 className="text-[1.55rem] font-bold font-syne text-white mb-4">Trial Tier</h3>
              <div className="bg-[#1A1428] border border-purple-500/15 rounded-xl p-4 mb-5">
                <div className="text-[1.9rem] font-bold font-syne text-white">$9.99<span className="text-base text-[#8A8499] font-normal">/mo</span></div>
                <div className="text-[0.72rem] text-[#8A8499] mt-1">Starter access</div>
              </div>
              <ul className="flex-1 flex flex-col gap-2 mb-6">
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Analyze 5 Videos</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Discord Access</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Founder Access</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Custom Model</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Personalized Optimization</li>
              </ul>
              <button className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white font-semibold text-[0.88rem] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] transition-all">Start Trial</button>
            </div>

            {/* Standard Tier */}
            <div className="rounded-[22px] bg-[#0D0A1F] border border-purple-400/50 shadow-[0_15px_45px_rgba(139,92,246,0.2)] p-8 relative flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-purple-300/70 hover:shadow-[0_25px_55px_rgba(139,92,246,0.4)] md:-translate-y-4">
              <div className="absolute top-6 right-6 bg-gradient-to-br from-[#3D1A78] to-[#8B5CF6] text-white text-[0.66rem] font-medium px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.5)]">Most Popular</div>
              <div className="text-[0.62rem] tracking-[0.2em] text-[#8A8499] uppercase mb-1">PLAN</div>
              <h3 className="text-[1.55rem] font-bold font-syne text-white mb-4">Standard</h3>
              <div className="bg-[#1A1428] border border-purple-500/15 rounded-xl p-4 mb-5 transform scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                <div className="text-[1.9rem] font-bold font-syne text-white">$19.99<span className="text-base text-[#8A8499] font-normal">/mo</span></div>
                <div className="text-[0.72rem] text-[#8A8499] mt-1">+ $19.99 one-time membership fee</div>
              </div>
              <ul className="flex-1 flex flex-col gap-2 mb-6">
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Analyze 30 Videos</li>
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Discord Access (while paying)</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Founder Access</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Custom Model</li>
                <li className="bg-[#1A1428]/50 border border-purple-500/5 rounded-lg p-3 text-[0.78rem] text-[#8A8499] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />No Personalized Optimization</li>
              </ul>
              <button className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white font-semibold text-[0.88rem] hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all">Get Standard</button>
            </div>

            {/* Creator Tier */}
            <div className="rounded-[22px] bg-[#0D0A1F] border border-purple-500/25 p-8 relative flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-purple-400/50 hover:shadow-[0_25px_55px_rgba(139,92,246,0.3)]">
              <div className="absolute top-6 right-6 bg-gradient-to-br from-[#3D1A78] to-[#8B5CF6] text-white text-[0.66rem] font-medium px-3 py-1 rounded-full uppercase tracking-wider">For serious creators</div>
              <div className="text-[0.62rem] tracking-[0.2em] text-[#8A8499] uppercase mb-1">PLAN</div>
              <h3 className="text-[1.55rem] font-bold font-syne text-white mb-4">Creator</h3>
              <div className="bg-[#1A1428] border border-purple-500/15 rounded-xl p-4 mb-5">
                <div className="text-[1.9rem] font-bold font-syne text-white">$99.99<span className="text-base text-[#8A8499] font-normal">/mo</span></div>
                <div className="text-[0.72rem] text-[#8A8499] mt-1">Membership included</div>
              </div>
              <ul className="flex-1 flex flex-col gap-2 mb-6">
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Discord Access (for life)</li>
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Analyze 75 Videos</li>
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Limited Founder Access</li>
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Custom Model Trained</li>
                <li className="bg-[#1A1428] border border-purple-500/10 rounded-lg p-3 text-[0.78rem] text-[#DDD5EE] flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#A78BFA] shrink-0" />Personalized Optimization</li>
              </ul>
              <button className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white font-semibold text-[0.88rem] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] transition-all">Go Creator</button>
            </div>

          </div>

          <div className="absolute bottom-0 w-full border-t border-purple-500/15 py-6 px-8 flex flex-col md:flex-row justify-between items-center bg-[#06040F]/80 backdrop-blur-md">
            <div className="text-zinc-500 text-xs mb-4 md:mb-0">
              addictd.ai © 2026. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-zinc-500 hover:text-purple-400 text-xs transition-colors">Terms</a>
              <a href="#" className="text-zinc-500 hover:text-purple-400 text-xs transition-colors">Privacy</a>
              <a href="#" className="text-zinc-500 hover:text-purple-400 text-xs transition-colors">Contact</a>
            </div>
          </div>
        </div>
    </div>
  );
}
