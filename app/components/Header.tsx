'use client';

import { useState, useEffect } from 'react';

export function Header() {
  const [hidden, setHidden] = useState(false);
  
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Hide header if scrolling down and past 50px
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 transition-transform duration-500 ease-in-out ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="absolute inset-0 bg-[#06040F]/55 backdrop-blur-[22px] border-b border-purple-500/15 -z-10" />
      
      <a href="#" className="flex items-center gap-2 font-[family-name:var(--font-syne)] font-bold text-[1.05rem] text-white no-underline">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="15" r="13" fill="none" stroke="#8B5CF6" strokeWidth="1.2" opacity=".45" />
          <polyline points="3,15 7,15 9,7.5 12,22.5 15,9 18,21 21,15 27,15" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        addictd.ai
      </a>
      
      <nav className="hidden md:flex gap-8 items-center">
        <a href="#" className="text-[#8A8499] text-[0.88rem] hover:text-white transition-colors duration-200">How It Works</a>
        <a href="#" className="text-[#8A8499] text-[0.88rem] hover:text-white transition-colors duration-200">Demo</a>
        <a href="#" className="text-[#8A8499] text-[0.88rem] hover:text-white transition-colors duration-200">How Your Data Is Used</a>
      </nav>
      
      <button className="bg-white text-[#06040F] py-2 px-5 rounded-full text-[0.88rem] font-semibold hover:scale-105 hover:shadow-[0_0_28px_rgba(139,92,246,0.6)] transition-all duration-200">
        Get Early Access
      </button>
    </header>
  );
}
