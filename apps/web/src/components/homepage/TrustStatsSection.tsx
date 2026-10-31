import React from 'react';
import { Award, ShieldCheck, Globe } from 'lucide-react';

export function TrustStatsSection() {
  const trustItems = [
    {
      icon: Award,
      headline: 'CEFR A1',
      sublabel: 'Temel Dil Becerisi',
      iconColor: 'text-[#1E6BFF]',
      iconBg: 'bg-[#E0F2FE]',
    },
    {
      icon: ShieldCheck,
      headline: 'Çocuk Dostu',
      sublabel: 'Ebeveyn Denetimli',
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#FEF9C3]',
    },
    {
      icon: Globe,
      headline: 'Çoklu Cihaz',
      sublabel: 'Çevrimdışı Destekli',
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#EDE9FE]',
    },
  ];

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mt-10 md:mt-14 mb-8" id="guvenilirlik">
      <div className="max-w-6xl mx-auto py-6 sm:py-8 border-t border-slate-200/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Heading and Grounded Assurance */}
          <div className="md:col-span-5 text-center md:text-left space-y-0.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Pedagojik Yaklaşım
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal">
              Yaş gruplarına uygun gelişimsel hedefler ve çocuk dostu dijital öğrenme deneyimi.
            </p>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden md:flex md:col-span-1 justify-center">
            <div className="w-px h-10 bg-slate-200" />
          </div>

          {/* Right Column: 3 Items matching reference horizontal rhythm */}
          <div className="md:col-span-6 grid grid-cols-3 gap-3 sm:gap-5">
            {trustItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 sm:gap-2.5">
                  {/* Circular Pill Badge on Left (as in reference) */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                  </div>

                  {/* Headline and Sublabel on Right */}
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                      {item.headline}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none mt-1">
                      {item.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
