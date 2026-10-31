'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ExperienceCardsProps {
  onOpenLifeModal: () => void;
}

export function ExperienceCards({ onOpenLifeModal }: ExperienceCardsProps) {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mt-4 md:mt-5 z-10" id="deneyimler">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        {/* CARD 1: VENTRA KIDS (7–12 YAŞ) */}
        <div className="group relative rounded-[32px] p-2 bg-gradient-to-b from-[#BAE6FD]/40 via-white/50 to-[#E0F2FE]/40 border-[2px] border-[#38BDF8]/60 shadow-[0_14px_36px_rgba(56,189,248,0.18)] hover:shadow-[0_20px_45px_rgba(56,189,248,0.25)] transition-all duration-300 flex flex-col justify-end overflow-hidden aspect-[1.18/1]">
          {/* Card Full Background Visual */}
          <div className="absolute inset-0 rounded-[30px] overflow-hidden bg-[#E0F2FE]">
            <img
              src="/assets/homepage/kids-cover.png"
              onError={(e) => {
                e.currentTarget.src = '/assets/homepage/kids-cover.svg';
              }}
              alt="Ventra Kids — Macera ve Oyun Dünyası"
              className="w-full h-full object-cover object-[center_10%] transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Frosted Bottom Content Card (Anchored at bottom over image) */}
          <div className="relative z-10 mx-1.5 sm:mx-2 mb-1.5 bg-white/95 backdrop-blur-md border border-white/90 rounded-[22px] sm:rounded-[24px] px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg shadow-slate-900/10 flex items-center justify-between">
            {/* Text Area */}
            <div className="space-y-0.5 sm:space-y-1 pr-2">
              <span className="inline-block bg-[#0084FF] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm shadow-blue-500/25">
                7-12 yaş
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
                Ventra Kids
              </h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-tight">
                Adalar, oyunlar ve maceralarla
                <br />
                İngilizce öğren.
              </p>
            </div>

            {/* Circular CTA Button (Links directly to /kids) */}
            <Link
              href="/kids"
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1E6BFF] hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-600/35 transition-all group-hover:scale-105 flex-shrink-0 cursor-pointer ml-2"
              title="Ventra Kids Dünyasına Başla"
              aria-label="Ventra Kids Dünyasına Başla"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]" />
            </Link>
          </div>
        </div>

        {/* CARD 2: VENTRA LIFE (13+ YAŞ) */}
        <div className="group relative rounded-[32px] p-2 bg-gradient-to-b from-[#DDD6FE]/40 via-white/50 to-[#EDE9FE]/40 border-[2px] border-[#A855F7]/60 shadow-[0_14px_36px_rgba(168,85,247,0.18)] hover:shadow-[0_20px_45px_rgba(168,85,247,0.25)] transition-all duration-300 flex flex-col justify-end overflow-hidden aspect-[1.18/1]">
          {/* Card Full Background Visual */}
          <div className="absolute inset-0 rounded-[30px] overflow-hidden bg-[#F3E8FF]">
            <img
              src="/assets/homepage/life-cover.png"
              onError={(e) => {
                e.currentTarget.src = '/assets/homepage/life-cover.svg';
              }}
              alt="Ventra Life — Gerçek Yaşam İngilizce Deneyimi"
              className="w-full h-full object-cover object-[center_12%] transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Frosted Bottom Content Card (Anchored at bottom over image) */}
          <div className="relative z-10 mx-1.5 sm:mx-2 mb-1.5 bg-white/95 backdrop-blur-md border border-white/90 rounded-[22px] sm:rounded-[24px] px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg shadow-slate-900/10 flex items-center justify-between">
            {/* Text Area */}
            <div className="space-y-0.5 sm:space-y-1 pr-2">
              <span className="inline-block bg-[#8B5CF6] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm shadow-purple-500/25">
                13+ yaş
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
                Ventra Life
              </h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-tight">
                Gerçek yaşam odaklı, modern
                <br />
                İngilizce öğrenme deneyimi.
              </p>
            </div>

            {/* Circular CTA Button (Triggers Life Modal) */}
            <button
              onClick={onOpenLifeModal}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white flex items-center justify-center shadow-md shadow-purple-600/35 transition-all group-hover:scale-105 flex-shrink-0 cursor-pointer ml-2"
              title="Ventra Life (Çok Yakında)"
              aria-label="Ventra Life (Çok Yakında)"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
