'use client';

import React, { useState, useEffect } from 'react';
import { A1_ANIMALS_VOCABULARY, VocabularyItem } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

interface ListenActivityProps {
  onComplete: (stars: number) => void;
  onClose: () => void;
}

export const ListenActivity: React.FC<ListenActivityProps> = ({ onComplete }) => {
  // 3 turluk dinleme görevi
  const [round, setRound] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem>(A1_ANIMALS_VOCABULARY[0]);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const roundsCount = 3;

  // Yeni tur hazırla
  const setupRound = (r: number) => {
    const target = A1_ANIMALS_VOCABULARY[r % A1_ANIMALS_VOCABULARY.length];
    setSelectedWord(target);

    // Yanına 2 rastgele çeldirici ekle
    const distractors = A1_ANIMALS_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const roundOptions = [target, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(roundOptions);

    // Sesi otomatik çal
    setTimeout(() => {
      soundService.playSpeech(target.audioUrl);
    }, 400);
  };

  useEffect(() => {
    setupRound(0);
  }, []);

  const handleReplay = () => {
    soundService.playSfx('tap');
    soundService.playSpeech(selectedWord.audioUrl);
  };

  const handleSelectOption = (item: VocabularyItem) => {
    soundService.playSfx('tap');

    if (item.id === selectedWord.id) {
      // Doğru seçim!
      soundService.playSfx('correct');
      if (round + 1 >= roundsCount) {
        setTimeout(() => {
          onComplete(3);
        }, 700);
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setupRound(nextRound);
      }
    } else {
      // Yanlış seçim (Nazik destek)
      soundService.playSfx('gentle_retry');
      setWrongId(item.id);
      setTimeout(() => {
        setWrongId(null);
        soundService.playSpeech(selectedWord.audioUrl);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 md:p-6 justify-between select-none">
      {/* Üst Bilgi */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold">
          <span>🎧 ADIM 3 / 5</span>
          <span>•</span>
          <span>DİNLE VE TANI</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Duyduğun ses hangi hayvana ait?
        </h2>
        <div className="text-xs text-slate-400">
          Tur: {round + 1} / {roundsCount}
        </div>
      </div>

      {/* Orta Ses Çalma Alanı */}
      <div className="flex flex-col items-center justify-center my-auto py-6 space-y-4">
        <button
          onClick={handleReplay}
          className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-500 hover:from-sky-500 hover:to-indigo-400 border-4 border-sky-300/60 shadow-xl shadow-indigo-500/40 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span className="text-4xl md:text-5xl animate-pulse">🔊</span>
          <span className="text-xs font-bold text-sky-100 uppercase tracking-wider">Tekrar Dinle</span>
        </button>

        <p className="text-xs text-slate-400 text-center">
          Sesi duyamadıysan butona tekrar dokunabilirsin.
        </p>
      </div>

      {/* 3 Seçenek Kartı */}
      <div className="grid grid-cols-3 gap-3 md:gap-5 mb-4">
        {options.map((item) => {
          const isWrong = wrongId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectOption(item)}
              className={`flex flex-col items-center p-3 md:p-4 rounded-2xl border transition-all duration-200 ${
                isWrong
                  ? 'bg-rose-900/60 border-rose-500 animate-shake'
                  : 'bg-slate-800/80 border-slate-700 hover:border-sky-400 hover:scale-105 active:scale-95'
              }`}
            >
              <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                <img src={item.imageUrl} alt={item.word} loading="eager" className="w-full h-full object-contain" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

