'use client';

import React from 'react';

export function HeroSection() {
  return (
    <section className="relative pt-4 pb-1 md:pt-6 md:pb-2 overflow-visible" id="top">
      {/* Ambient background soft light glows matching reference */}
      <div
        className="pointer-events-none absolute -top-10 left-1/4 -translate-x-1/2 w-[480px] h-[300px] bg-sky-200/40 rounded-full blur-[90px] -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-10 right-1/4 translate-x-1/2 w-[480px] h-[300px] bg-purple-200/35 rounded-full blur-[90px] -z-10"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        {/* Floating 3D Elements — Left Side (Book & Gamepad) aligned with title */}
        <div className="hidden xl:block absolute -left-2 top-0 pointer-events-none select-none z-10">
          <div className="w-24 h-20 animate-float-slow">
            <img
              src="/assets/homepage/hero-book.svg"
              alt="Eğitici Macera Kitabı"
              className="w-full h-full object-contain drop-shadow-lg"
              width={100}
              height={85}
            />
          </div>
          <div className="w-20 h-18 mt-1 ml-5 animate-float-delayed">
            <img
              src="/assets/homepage/hero-gamepad.svg"
              alt="Oyunlaştırılmış Öğrenme"
              className="w-full h-full object-contain drop-shadow-lg"
              width={85}
              height={75}
            />
          </div>
        </div>

        {/* Floating 3D Elements — Right Side (Hello Bubble & Globe) aligned with title */}
        <div className="hidden xl:block absolute -right-2 top-0 pointer-events-none select-none z-10">
          <div className="w-24 h-20 ml-6 animate-float-slow">
            <img
              src="/assets/homepage/hero-speech.svg"
              alt="Hello Konuşma Balonu"
              className="w-full h-full object-contain drop-shadow-lg"
              width={95}
              height={75}
            />
          </div>
          <div className="w-22 h-22 -mt-1 animate-float-delayed">
            <img
              src="/assets/homepage/hero-globe.svg"
              alt="Dünya Genelinde İngilizce"
              className="w-full h-full object-contain drop-shadow-lg"
              width={95}
              height={95}
            />
          </div>
        </div>

        {/* Hero Central Text Content */}
        <div className="text-center relative z-20 max-w-2xl mx-auto">
          {/* Subtle top indicator chevron */}
          <div className="flex justify-center mb-1.5">
            <svg className="w-3 h-3 text-blue-400/80 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {/* Eyebrow */}
          <p className="text-[11px] font-black tracking-[0.25em] text-[#1D63ED] uppercase mb-1.5">
            DAHA FAZLASI MÜMKÜN
          </p>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight text-[#0A1020] leading-[1.12]">
            İngilizceyi
            <br />
            <span className="text-[#1D63ED]">kendi dünyanda</span> keşfet.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-xs sm:text-sm md:text-[15px] font-normal max-w-md mx-auto mt-2.5 leading-relaxed">
            Her yaş için, eğlenceli, etkili ve gerçek hayata uygun
            <br className="hidden sm:inline" />
            {' '}İngilizce öğrenme deneyimi.
          </p>
        </div>
      </div>
    </section>
  );
}
