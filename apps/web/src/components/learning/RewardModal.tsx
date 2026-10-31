'use client';

import React from 'react';
import { soundService } from '@/lib/audio/SoundService';

interface RewardModalProps {
  onReturnToMap: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ onReturnToMap }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
        {/* Parıltı Efekti */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Başlık & İkon */}
        <div className="space-y-2">
          <div className="text-5xl animate-bounce">🎉</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
            BÖLÜM TAMAMLANDI!
          </h2>
          <p className="text-emerald-400 font-semibold text-sm">
            🌸 Kelime Bahçesi Artık Çiçek Açtı ve Canlandı!
          </p>
        </div>

        {/* 3 Altın Yıldız */}
        <div className="flex justify-center items-center gap-3 py-1">
          <span className="text-4xl text-amber-400 filter drop-shadow animate-pulse">⭐</span>
          <span className="text-5xl text-amber-300 filter drop-shadow scale-110">⭐</span>
          <span className="text-4xl text-amber-400 filter drop-shadow animate-pulse">⭐</span>
        </div>

        {/* İlerleme ve Ödül Kartları */}
        <div className="grid grid-cols-2 gap-3 bg-slate-850/80 border border-slate-800 rounded-2xl p-4 text-slate-200">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400">Kazanılan Skor</span>
            <span className="text-2xl font-black text-sky-400">100</span>
          </div>
          <div className="flex flex-col items-center border-l border-slate-700/60">
            <span className="text-xs text-slate-400">Gelişim Kıvılcımı</span>
            <span className="text-2xl font-black text-amber-400">+15 ✨</span>
          </div>
        </div>

        {/* Öğrenilen Beceriler */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Öğrenilen İngilizce Beceriler:
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {['🐱 Cat', '🐶 Dog', '🐦 Bird', '🐰 Rabbit'].map((item, idx) => (
              <span
                key={idx}
                className="bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-xl text-xs font-semibold text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Aksiyon Butonu */}
        <button
          onClick={() => {
            soundService.playSfx('whoosh');
            onReturnToMap();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-extrabold text-base shadow-lg shadow-teal-500/30 hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
        >
          Haritaya Dön ve Bahçeyi Gör ▶
        </button>
      </div>
    </div>
  );
};

