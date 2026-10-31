'use client';

import React, { useState } from 'react';
import { A1_ANIMALS_VOCABULARY, VocabularyItem } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

interface MiniQuestActivityProps {
  onComplete: (stars: number) => void;
  onClose: () => void;
}

interface HabitatSlot {
  id: string; // 'cat' | 'dog' | 'bird' | 'rabbit'
  nameTr: string;
  nameEn: string;
  icon: string;
  placed: boolean;
}

export const MiniQuestActivity: React.FC<MiniQuestActivityProps> = ({ onComplete }) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  const [habitats, setHabitats] = useState<HabitatSlot[]>([
    { id: 'en_vocab_cat', nameTr: 'Minder', nameEn: 'Cushion for Cat', icon: '🛋️', placed: false },
    { id: 'en_vocab_dog', nameTr: 'Kulübe', nameEn: 'Kennel for Dog', icon: '🏠', placed: false },
    { id: 'en_vocab_bird', nameTr: 'Ağaç Dalı', nameEn: 'Tree for Bird', icon: '🌳', placed: false },
    { id: 'en_vocab_rabbit', nameTr: 'Çimenlik', nameEn: 'Grass for Rabbit', icon: '🌿', placed: false }
  ]);

  const [placedCount, setPlacedCount] = useState(0);

  const handleAnimalSelect = (item: VocabularyItem) => {
    soundService.playSfx('tap');
    soundService.playSpeech(item.audioUrl);
    setSelectedAnimalId(item.id);
  };

  const handleHabitatClick = (slot: HabitatSlot) => {
    soundService.playSfx('tap');

    if (!selectedAnimalId) {
      soundService.playSpeech('/audio/en/directives/listen_carefully.wav');
      return;
    }

    if (selectedAnimalId === slot.id && !slot.placed) {
      // Doğru yuva!
      soundService.playSfx('correct');
      const nextHabitats = habitats.map((h) => (h.id === slot.id ? { ...h, placed: true } : h));
      setHabitats(nextHabitats);
      setSelectedAnimalId(null);
      const nextCount = placedCount + 1;
      setPlacedCount(nextCount);

      if (nextCount >= 4) {
        soundService.playSfx('fanfare');
        setTimeout(() => {
          onComplete(3);
        }, 1200);
      }
    } else {
      // Yanlış yuva
      soundService.playSfx('gentle_retry');
    }
  };

  const unplacedAnimals = A1_ANIMALS_VOCABULARY.filter(
    (a) => !habitats.find((h) => h.id === a.id && h.placed)
  );

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 md:p-6 justify-between select-none">
      {/* Üst Başlık & Görev Bilgisi */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold">
          <span>🌟 BÜYÜK FİNAL</span>
          <span>•</span>
          <span>BAHÇEYİ CANLANDIR</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Dostlarımızı yuvalarına yerleştir ve bahçeyi uyandır!
        </h2>
        <p className="text-xs md:text-sm text-slate-300">
          Öğrendiğin hayvanları doğru yaşam alanlarına koyarak Kelime Bahçesi'ni canlandır.
        </p>
      </div>

      {/* 4 Yuva (Bahçe Yaşam Alanları) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 my-auto py-4">
        {habitats.map((slot) => {
          const animal = A1_ANIMALS_VOCABULARY.find((a) => a.id === slot.id);
          const isSelectedTarget = selectedAnimalId === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => handleHabitatClick(slot)}
              className={`flex flex-col items-center justify-between p-4 rounded-3xl border transition-all duration-300 h-44 md:h-52 ${
                slot.placed
                  ? 'bg-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/20 scale-102'
                  : isSelectedTarget
                  ? 'bg-sky-500/20 border-dashed border-2 border-sky-400 animate-pulse'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500'
              }`}
            >
              <div className="text-3xl">{slot.icon}</div>

              {slot.placed && animal ? (
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center animate-bounce">
                  <img src={animal.imageUrl} alt={animal.word} loading="eager" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-xs text-slate-500">
                  Boş Yuva
                </div>
              )}

              <div className="text-center">
                <div className="text-xs font-bold text-white tracking-wide">
                  <span lang="en">{slot.placed && animal ? animal.word.toLocaleUpperCase('en-US') : slot.nameTr}</span>
                </div>
                <div className="text-[10px] text-slate-400">{slot.nameEn}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alt Seçenek Çubuğu (Henüz Yerleştirilmemiş Hayvanlar) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3">
        <div className="text-xs font-medium text-slate-400">
          {unplacedAnimals.length > 0
            ? 'Bir hayvana dokun, ardından bahçedeki doğru yuvasına dokun:'
            : '🎉 Tüm hayvanlar yuvasında! Bahçe uyanıyor...'}
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {unplacedAnimals.map((item) => {
            const isSelected = selectedAnimalId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleAnimalSelect(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-200 transform ${
                  isSelected
                    ? 'bg-sky-500 border-white text-white scale-110 shadow-lg shadow-sky-500/40'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-200 hover:scale-105'
                }`}
              >
                <div className="w-9 h-9">
                  <img src={item.imageUrl} alt={item.word} loading="eager" className="w-full h-full object-contain" />
                </div>
                <span lang="en" className="font-extrabold text-sm">{item.word.toLocaleUpperCase('en-US')}</span>
                <span className="text-xs opacity-75">🔊</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

