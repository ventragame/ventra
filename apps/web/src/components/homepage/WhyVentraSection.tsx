'use client';

import React from 'react';
import { ArrowRight, GraduationCap, Star, Globe } from 'lucide-react';

interface WhyVentraSectionProps {
  onLearnMore?: () => void;
}

export function WhyVentraSection({ onLearnMore }: WhyVentraSectionProps) {
  const bullets = [
    {
      icon: GraduationCap,
      label: 'Yaşa uygun içerik',
      iconBg: 'bg-[#2563EB]',
    },
    {
      icon: Star,
      label: 'Oyunlaştırılmış öğrenme',
      iconBg: 'bg-[#FBBF24]',
      starFill: true,
    },
    {
      icon: Globe,
      label: 'Gerçek hayatta kullanılabilir İngilizce',
      iconBg: 'bg-[#8B5CF6]',
    },
  ];

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mt-12 md:mt-16" id="neden-ventra">
      <div className="max-w-6xl mx-auto rounded-[32px] bg-gradient-to-r from-[#F0F6FE] via-white to-[#F2F6FE] border border-blue-100/70 p-5 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Adventurous Friends Illustration */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[340px] aspect-[1.7/1] rounded-[22px] overflow-hidden shadow-sm border border-white/80 bg-white">
              <img
                src="/assets/homepage/why-ventra-cover.png"
                onError={(e) => {
                  e.currentTarget.src = '/assets/homepage/why-ventra-cover.svg';
                }}
                alt="Ventra Öğrenme Yolculuğu ve Arkadaşlar"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Center Column: Eyebrow, Heading, CTA Button */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-3">
            <p className="text-[11px] font-black tracking-[0.22em] text-[#1D63ED] uppercase">
              NEDEN VENTRA?
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 leading-snug">
              Sadece bir dil uygulaması değil,
              <br />
              <span className="text-[#1D63ED]">uzun vadeli bir yol arkadaşı.</span>
            </h2>

            <div className="pt-1">
              <a
                href="#ozellikler"
                onClick={onLearnMore}
                className="inline-flex items-center gap-2 px-5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full text-xs font-bold text-slate-900 shadow-sm hover:shadow transition-all group"
              >
                <span>Daha Fazlasını Keşfet</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: 3 Bullet Features */}
          <div className="lg:col-span-3 space-y-3 flex flex-col justify-center">
            {bullets.map((bullet, idx) => {
              const Icon = bullet.icon;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${bullet.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}
                  >
                    <Icon className={`w-4 h-4 ${bullet.starFill ? 'fill-white' : ''}`} />
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-slate-800">
                    {bullet.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
