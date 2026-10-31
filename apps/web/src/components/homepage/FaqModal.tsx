'use client';

import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FaqModal({ isOpen, onClose }: FaqModalProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'Ventra Kids hangi yaş grubu için uygundur?',
      a: 'Ventra Kids, 7–12 yaş aralığındaki çocuklar için CEFR A1 temel dil seviyesi hedefleri gözetilerek ve oyunlaştırılmış macera ortamında öğrenmeyi destekleyecek şekilde tasarlanmıştır.'
    },
    {
      q: 'Ventra Life nedir ve ne zaman yayına girecek?',
      a: 'Ventra Life, 13 yaş ve üzeri gençler ile yetişkinlerin pratik İngilizce becerilerini geliştirmeyi amaçlayan, gerçek yaşam odaklı yeni ürünümüzdür. Şu anda geliştirme aşamasındadır ve çok yakında kullanıcılarımızla buluşacaktır.'
    },
    {
      q: 'İnternet bağlantısı olmadan kullanılabilir mi?',
      a: 'Evet! Ventra Kids yerel cihaz depolaması desteğiyle temel etkinlikleri çevrimdışı (offline) çalıştırabilir. Çevrimiçi olunduğunda profil ve gelişim verileri bulut hesabıyla eşzamanlanabilir.'
    },
    {
      q: 'Uygulama içi reklam veya veri takibi var mı?',
      a: 'Ventra çocuk deneyimi, dikkat dağıtmayan korumalı bir ortam hedefler; harici reklam gösterimleri veya üçüncü taraflara yönelik izinsiz veri paylaşımı barındırmaz.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pt-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sıkça Sorulan Sorular
            </h3>
            <p className="text-xs text-slate-500">
              Ventra hakkında merak ettiğiniz temel bilgiler
            </p>
          </div>
        </div>

        {/* Accordion Items */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {faqs.map((faq, idx) => {
            const isOpenItem = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpenItem ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpenItem ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {isOpenItem && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close Footer Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
