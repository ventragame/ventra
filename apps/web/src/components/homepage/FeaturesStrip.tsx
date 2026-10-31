import React from 'react';
import { Gamepad2, BarChart3, Zap, Trophy } from 'lucide-react';

export function FeaturesStrip() {
  const features = [
    {
      icon: Gamepad2,
      labelLine1: 'Etkileşimli',
      labelLine2: 'Oyunlar',
      bgColor: 'bg-[#E0F2FE]',
      iconColor: 'text-[#1E6BFF]',
    },
    {
      icon: BarChart3,
      labelLine1: 'Kişisel',
      labelLine2: 'İlerleme Takibi',
      bgColor: 'bg-[#E0F7FA]',
      iconColor: 'text-[#0284C7]',
    },
    {
      icon: Zap,
      labelLine1: 'Gerçek Yaşam',
      labelLine2: 'Senaryoları',
      bgColor: 'bg-[#FFF3E0]',
      iconColor: 'text-[#F97316]',
    },
    {
      icon: Trophy,
      labelLine1: 'Ödüller ve',
      labelLine2: 'Başarılar',
      bgColor: 'bg-[#FEF9C3]',
      iconColor: 'text-[#EAB308]',
    },
  ];

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mt-7 md:mt-9" id="ozellikler">
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50/60 transition-colors"
            >
              {/* Circular Icon Pill (Matching Reference) */}
              <div
                className={`w-11 h-11 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
                <Icon className={`w-5 h-5 ${item.iconColor} stroke-[2.3]`} />
              </div>

              {/* Text Label */}
              <div className="text-left leading-tight">
                <span className="block text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                  {item.labelLine1}
                </span>
                <span className="block text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                  {item.labelLine2}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
