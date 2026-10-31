'use client';

import React, { useState } from 'react';
import { A1_ANIMALS_VOCABULARY, VocabularyItem } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

interface MatchActivityProps {
  onComplete: (stars: number) => void;
  onClose: () => void;
}

export const MatchActivity: React.FC<MatchActivityProps> = ({ onComplete }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongWordId, setWrongWordId] = useState<string | null>(null);

  // Karışık kelime listesi
  const [shuffledWords] = useState<VocabularyItem[]>(() => {
    return [...A1_ANIMALS_VOCABULARY].sort(() => 0.5 - Math.random());
  });

  const handleImageClick = (id: string) => {
    if (matchedIds.has(id)) return;
    soundService.playSfx('tap');
    setSelectedImageId(id);
    const item = A1_ANIMALS_VOCABULARY.find((v) => v.id === id);
    if (item) soundService.playSpeech(item.audioUrl);
  };

  const handleWordClick = (item: VocabularyItem) => {
    if (matchedIds.has(item.id)) return;
    soundService.playSfx('tap');

    if (!selectedImageId) {
      soundService.playSpeech(item.audioUrl);
      return;
    }

    if (selectedImageId === item.id) {
      // Doğru eşleşme!
      soundService.playSfx('correct');
      soundService.playSpeech(item.audioUrl);
      const nextMatched = new Set(matchedIds).add(item.id);
      setMatchedIds(nextMatched);
      setSelectedImageId(null);

      if (nextMatched.size >= A1_ANIMALS_VOCABULARY.length) {
        setTimeout(() => {
          onComplete(3);
        }, 800);
      }
    } else {
      // Hatalı deneme (Cezalandırma yok, nazik tını ve titreşim)
      soundService.playSfx('gentle_retry');
      setWrongWordId(item.id);
      setTimeout(() => {
        setWrongWordId(null);
      }, 500);
    }
  };

  const isAllMatched = matchedIds.size >= A1_ANIMALS_VOCABULARY.length;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 md:p-6 justify-between select-none">
      {/* Üst Bilgi */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
          <span>🧩 ADIM 2 / 5</span>
          <span>•</span>
          <span>EŞLEŞTİR</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Resimleri doğru İngilizce kelimelerle birleştir!
        </h2>
        <p className="text-sm text-slate-300">
          Önce soldan bir hayvana dokun, ardından sağdaki İngilizce adını seç.
        </p>
      </div>

      {/* İki Sütunlu Eşleştirme Alanı */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 my-auto py-4">
        {/* Sol: Resimler */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
            Hayvanlar
          </div>
          {A1_ANIMALS_VOCABULARY.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedImageId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleImageClick(item.id)}
                disabled={isMatched}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                  isMatched
                    ? 'bg-emerald-950/40 border-emerald-500/60 opacity-60'
                    : isSelected
                    ? 'bg-sky-600/30 border-sky-400 shadow-md shadow-sky-500/30 scale-102'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={item.imageUrl} alt={item.word} loading="eager" className="w-full h-full object-contain" />
                </div>
                <div className="text-left font-medium text-slate-300 text-sm">
                  {isMatched ? (
                    <span className="text-emerald-400 font-bold">✓ Eşleşti</span>
                  ) : isSelected ? (
                    <span className="text-sky-300 font-semibold">Seçildi</span>
                  ) : (
                    <span className="text-slate-400">Dokun</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sağ: İngilizce Kelimeler */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
            İngilizce Kelimeler
          </div>
          {shuffledWords.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isWrong = wrongWordId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleWordClick(item)}
                disabled={isMatched}
                className={`h-20 md:h-22 flex items-center justify-between px-4 rounded-2xl border transition-all duration-200 ${
                  isMatched
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-60'
                    : isWrong
                    ? 'bg-rose-900/50 border-rose-500 animate-shake'
                    : 'bg-slate-800/60 border-slate-700 hover:border-sky-400 text-white'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span lang="en" className="text-lg md:text-xl font-bold tracking-wider">
                    {item.word.toLocaleUpperCase('en-US')}
                  </span>
                  <span className="text-xs text-slate-400">{item.phonetic}</span>
                </div>
                <span className="text-slate-400 text-sm">🔊</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alt Durum */}
      <div className="text-center text-xs text-slate-400">
        {isAllMatched ? (
          <span className="text-emerald-400 font-bold text-sm">🎉 Mükemmel! Tüm eşleştirmeler tamamlandı.</span>
        ) : (
          `Eşleşen: ${matchedIds.size} / ${A1_ANIMALS_VOCABULARY.length}`
        )}
      </div>
    </div>
  );
};

