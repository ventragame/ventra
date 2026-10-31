'use client';

import React, { useState } from 'react';
import { A1_ANIMALS_VOCABULARY, VocabularyItem } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

interface ExploreActivityProps {
  onComplete: (stars: number) => void;
  onClose: () => void;
}

export const ExploreActivity: React.FC<ExploreActivityProps> = ({ onComplete, onClose }) => {
  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<VocabularyItem | null>(null);

  const handleCardClick = (item: VocabularyItem) => {
    setActiveItem(item);
    soundService.playSfx('tap');
    soundService.playSpeech(item.audioUrl);
    setExploredIds((prev) => new Set(prev).add(item.id));
  };

  const isAllExplored = exploredIds.size >= A1_ANIMALS_VOCABULARY.length;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 justify-between select-none">
      {/* Üst Başlık & Talimat */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
          <span>🌱 ADIM 1 / 5</span>
          <span>•</span>
          <span>KEŞFET VE DİNLE</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Hayvanlara dokun ve İngilizce adlarını dinle!
        </h2>
        <p className="text-sm text-slate-300">
          Kelimelerin telaffuzunu duyarak bahçenin ilk sevimli dostlarıyla tanış.
        </p>
      </div>

      {/* 4 Hayvan Kartı Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 my-4">
        {A1_ANIMALS_VOCABULARY.map((item) => {
          const isExplored = exploredIds.has(item.id);
          const isSelected = activeItem?.id === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleCardClick(item)}
              className={`flex flex-col items-center justify-between p-4 rounded-2xl transition-all duration-300 transform active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-b from-sky-500/40 to-blue-600/40 border-2 border-sky-400 shadow-lg shadow-sky-500/30 scale-105'
                  : isExplored
                  ? 'bg-slate-800/80 border border-emerald-500/50 hover:border-emerald-400'
                  : 'bg-slate-800/50 border border-slate-700/60 hover:border-slate-500'
              }`}
            >
              {/* Resim */}
              <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center relative">
                <img
                  src={item.imageUrl}
                  alt={item.word}
                  loading="eager"
                  className={`w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 ${
                    isSelected ? 'scale-110' : 'scale-100'
                  }`}
                  onError={(e) => {
                    console.warn(`Resim yüklenemedi: ${item.imageUrl}`);
                  }}
                />
                {isExplored && (
                  <span className="absolute top-0 right-0 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                    ✓
                  </span>
                )}
              </div>

              {/* Kelime ve Türkçe Anlam */}
              <div className="text-center mt-3 space-y-0.5">
                <div className="text-lg md:text-xl font-extrabold text-white tracking-wide flex items-center justify-center gap-1.5">
                  <span lang="en">{item.word.toLocaleUpperCase('en-US')}</span>
                  <span className="text-sky-400 text-sm">🔊</span>
                </div>
                <div className="text-xs text-sky-200/80">{item.phonetic}</div>
                <div className="text-xs font-medium text-slate-400">({item.translationTr})</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alt Aksiyon Butonu */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-xs text-slate-400">
          İlerleme: {exploredIds.size} / {A1_ANIMALS_VOCABULARY.length} Hayvan Keşfedildi
        </div>

        <button
          disabled={!isAllExplored}
          onClick={() => {
            soundService.playSfx('correct');
            onComplete(3);
          }}
          className={`w-full max-w-sm py-3.5 px-6 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
            isAllExplored
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-slate-700/50 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          <span>{isAllExplored ? 'Harika! 2. Adıma Geç ▶' : 'Tüm Kartları Dinle'}</span>
        </button>
      </div>
    </div>
  );
};

