'use client';

import React, { useState, useEffect } from 'react';
import { soundService } from '@/lib/audio/SoundService';

interface ApplyActivityProps {
  onComplete: (stars: number) => void;
  onClose: () => void;
}

export const ApplyActivity: React.FC<ApplyActivityProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'feed_cat' | 'bird_tree'>('feed_cat');
  const [isCatFed, setIsCatFed] = useState(false);
  const [isBirdPlaced, setIsBirdPlaced] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    // Aşama başlangıcında yönergeyi seslendir
    const timer = setTimeout(() => {
      if (stage === 'feed_cat') {
        soundService.playSpeech('/audio/en/directives/feed_the_cat.wav');
      } else {
        soundService.playSpeech('/audio/en/directives/put_bird_tree.wav');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [stage]);

  const handleFeedCat = () => {
    if (isCatFed) return;
    setIsCatFed(true);
    soundService.playSfx('correct');
    setSelectedItem(null);

    setTimeout(() => {
      soundService.playSpeech('/audio/en/directives/well_done.wav');
      setTimeout(() => {
        setStage('bird_tree');
      }, 1500);
    }, 600);
  };

  const handleBirdToTree = () => {
    if (isBirdPlaced) return;
    setIsBirdPlaced(true);
    soundService.playSfx('correct');
    setSelectedItem(null);

    setTimeout(() => {
      soundService.playSpeech('/audio/en/directives/great_job.wav');
      setTimeout(() => {
        onComplete(3);
      }, 1200);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 md:p-6 justify-between select-none">
      {/* Üst Bilgi ve Yönerge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
          <span>🎯 ADIM 4 / 5</span>
          <span>•</span>
          <span>UYGULA VE HAREKETE GEÇ</span>
        </div>

        {stage === 'feed_cat' ? (
          <div className="bg-slate-800/90 border border-sky-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-lg md:text-xl font-extrabold text-white">
                "Feed the cat with milk!"
              </div>
              <div className="text-xs text-slate-300">İpucu: Sütü kediye vererek karnını doyur.</div>
            </div>
            <button
              onClick={() => soundService.playSpeech('/audio/en/directives/feed_the_cat.wav')}
              className="w-12 h-12 flex-shrink-0 bg-sky-600 hover:bg-sky-500 rounded-full flex items-center justify-center text-xl text-white shadow-md cursor-pointer"
            >
              🔊
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-lg md:text-xl font-extrabold text-white">
                "Help the bird fly to the tree!"
              </div>
              <div className="text-xs text-slate-300">İpucu: Kuşu ağaçtaki yuvasına yerleştir.</div>
            </div>
            <button
              onClick={() => soundService.playSpeech('/audio/en/directives/put_bird_tree.wav')}
              className="w-12 h-12 flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center text-xl text-white shadow-md cursor-pointer"
            >
              🔊
            </button>
          </div>
        )}
      </div>

      {/* İnteraktif Görev Sahnesi */}
      <div className="my-auto py-6">
        {stage === 'feed_cat' ? (
          <div className="flex items-center justify-around gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative min-h-[260px]">
            {/* Süt Şişesi */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  soundService.playSfx('tap');
                  setSelectedItem('milk');
                }}
                disabled={isCatFed}
                className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center p-3 border transition-all duration-300 ${
                  isCatFed
                    ? 'opacity-40 scale-90'
                    : selectedItem === 'milk'
                    ? 'border-sky-400 bg-sky-500/20 scale-105 shadow-lg shadow-sky-500/30'
                    : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'
                }`}
              >
                <img src="/assets/animals/milk.svg" alt="milk" loading="eager" className="w-full h-full object-contain" />
              </button>
              <span className="text-xs font-bold text-sky-300 uppercase">MILK</span>
            </div>

            {/* Ok İşareti */}
            <div className="text-3xl text-slate-600 animate-pulse">➔</div>

            {/* Kedi Hedef Alanı */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  if (selectedItem === 'milk' || !isCatFed) {
                    handleFeedCat();
                  }
                }}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center p-3 border transition-all duration-300 ${
                  isCatFed
                    ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                    : selectedItem === 'milk'
                    ? 'border-dashed border-2 border-emerald-400 bg-emerald-900/30 animate-pulse cursor-pointer'
                    : 'border-slate-700 bg-slate-800/70'
                }`}
              >
                <img src="/assets/animals/cat.svg" alt="cat" loading="eager" className="w-full h-full object-contain" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-300 uppercase">CAT</span>
                {isCatFed && <span className="text-base text-rose-400 animate-bounce">❤️</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative min-h-[260px]">
            {/* Kuş */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  soundService.playSfx('tap');
                  setSelectedItem('bird');
                }}
                disabled={isBirdPlaced}
                className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center p-3 border transition-all duration-300 ${
                  isBirdPlaced
                    ? 'opacity-40 scale-90'
                    : selectedItem === 'bird'
                    ? 'border-sky-400 bg-sky-500/20 scale-105 shadow-lg shadow-sky-500/30'
                    : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'
                }`}
              >
                <img src="/assets/animals/bird.svg" alt="bird" loading="eager" className="w-full h-full object-contain" />
              </button>
              <span className="text-xs font-bold text-sky-300 uppercase">BIRD</span>
            </div>

            <div className="text-3xl text-slate-600 animate-pulse">➔</div>

            {/* Ağaç Hedefi */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  if (selectedItem === 'bird' || !isBirdPlaced) {
                    handleBirdToTree();
                  }
                }}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl flex flex-col items-center justify-center p-3 border transition-all duration-300 ${
                  isBirdPlaced
                    ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                    : selectedItem === 'bird'
                    ? 'border-dashed border-2 border-emerald-400 bg-emerald-900/30 animate-pulse cursor-pointer'
                    : 'border-slate-700 bg-slate-800/70'
                }`}
              >
                <span className="text-5xl">🌳</span>
                <span className="text-xs text-emerald-400 mt-1 font-semibold">
                  {isBirdPlaced ? '✓ Kuş Yuvasında!' : 'Buraya Yerleştir'}
                </span>
              </button>
              <span className="text-xs font-bold text-emerald-300 uppercase">TREE</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400">
        Eylemi gerçekleştirmek için nesneye dokunup hedefe dokunabilirsin.
      </div>
    </div>
  );
};

