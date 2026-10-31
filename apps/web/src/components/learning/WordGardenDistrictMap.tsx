'use client';

import React from 'react';

interface WordGardenDistrictMapProps {
  completedLevels: number;
  totalLevels: number;
  onEnterAnimals: () => void;
  onBack: () => void;
}

/**
 * A growing island, not a collection of fake playable levels.
 * Only Animal Meadow has complete lessons, audio and persistence.
 */
const DISTRICTS = [
  {
    id: 'animal_meadow',
    name: 'Hayvan Çayırı',
    subtitle: 'Animals • İlk keşif',
    description: 'Dört hayvan dostunu tanı, dinle ve yaşam alanlarını canlandır.',
    icon: '🐾',
    status: 'playable',
    regionClass: 'from-emerald-800/90 via-green-700/80 to-lime-600/70',
    coordinates: 'lg:col-start-2 lg:row-start-2',
  },
  {
    id: 'color_grove',
    name: 'Renk Korusu',
    subtitle: 'Colors • Planlanan bölge',
    description: 'Renklerle dolu büyülü ağaçlar ve keşif görevleri.',
    icon: '🎨',
    status: 'planned',
    regionClass: 'from-fuchsia-900/80 via-pink-800/75 to-rose-600/60',
    coordinates: 'lg:col-start-1 lg:row-start-1',
  },
  {
    id: 'number_valley',
    name: 'Sayı Vadisi',
    subtitle: 'Numbers • Planlanan bölge',
    description: 'Sayıları oyunla keşfedeceğin vadi.',
    icon: '🔢',
    status: 'planned',
    regionClass: 'from-blue-900/80 via-cyan-800/75 to-sky-600/60',
    coordinates: 'lg:col-start-3 lg:row-start-1',
  },
  {
    id: 'food_market',
    name: 'Lezzet Pazarı',
    subtitle: 'Food • Planlanan bölge',
    description: 'Yiyeceklerin İngilizce adlarını öğrenme alanı.',
    icon: '🍎',
    status: 'planned',
    regionClass: 'from-orange-900/85 via-amber-800/75 to-yellow-600/60',
    coordinates: 'lg:col-start-1 lg:row-start-2',
  },
  {
    id: 'family_village',
    name: 'Aile Köyü',
    subtitle: 'Family • Planlanan bölge',
    description: 'Günlük yaşam ve aile kelimeleri için yeni hikâyeler.',
    icon: '🏡',
    status: 'planned',
    regionClass: 'from-violet-900/85 via-indigo-800/75 to-purple-600/60',
    coordinates: 'lg:col-start-3 lg:row-start-2',
  },
  {
    id: 'discovery_sanctuary',
    name: 'Keşif Tapınağı',
    subtitle: 'Final • Planlanan bölge',
    description: 'Öğrendiğin kelimelerin birleşeceği son keşif.',
    icon: '✨',
    status: 'planned',
    regionClass: 'from-teal-900/85 via-cyan-900/75 to-emerald-600/60',
    coordinates: 'lg:col-start-2 lg:row-start-1',
  },
] as const;

export const WordGardenDistrictMap: React.FC<WordGardenDistrictMapProps> = ({
  completedLevels,
  totalLevels,
  onEnterAnimals,
  onBack,
}) => {
  const progress = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-garden-world-title"
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-gradient-to-b from-sky-950 via-sky-900 to-emerald-950 text-white"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur-sm hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
            aria-label="Takımada haritasına dön"
          >
            ← Takımadaya Dön
          </button>
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-950/60 px-4 py-2 text-sm font-bold">
            🌱 Hayvan Çayırı · {completedLevels}/{totalLevels} aşama
          </div>
        </header>

        <div className="mx-auto max-w-2xl py-6 text-center sm:py-8">
          <div className="mb-2 text-4xl" aria-hidden="true">🌸</div>
          <h1 id="word-garden-world-title" className="text-3xl font-black tracking-tight sm:text-5xl">
            Kelime Bahçesi
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-sky-100 sm:text-base">
            Bir bahçeden daha fazlası: farklı konulara açılan altı keşif bölgesi.
            İlk macera Hayvan Çayırı'nda başlıyor.
          </p>
        </div>

        <div className="mx-auto mb-6 max-w-xl">
          <div className="flex justify-between text-xs font-semibold text-emerald-100">
            <span>İlk keşif rotası</span><span>%{progress} tamamlandı</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2" aria-label="Kelime Bahçesi keşif bölgeleri">
          {DISTRICTS.map((district) => {
            const playable = district.status === 'playable';
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/25 bg-white/15 text-4xl shadow-lg" aria-hidden="true">
                    {district.icon}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${playable ? 'border-lime-200/50 bg-lime-400/25 text-lime-100' : 'border-white/25 bg-black/25 text-white/80'}`}>
                    {playable ? '● OYNANABİLİR' : '◇ GELİŞTİRİLECEK'}
                  </span>
                </div>
                <div className="mt-5 text-left">
                  <h2 className="text-xl font-black tracking-tight">{district.name}</h2>
                  <p className="mt-1 text-xs font-bold text-white/75">{district.subtitle}</p>
                  <p className="mt-3 min-h-12 text-sm leading-relaxed text-white/85">{district.description}</p>
                </div>
                <div className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-extrabold ${playable ? 'bg-lime-300 text-emerald-950 shadow-lg shadow-emerald-950/20' : 'border border-white/20 bg-black/20 text-white/75'}`}>
                  {playable ? 'Macera Rotasına Gir →' : 'İçerik hazırlanıyor'}
                </div>
              </>
            );
            const classes = `relative flex min-h-[270px] flex-col justify-between overflow-hidden rounded-[2rem] border p-5 text-left shadow-2xl transition-transform duration-200 bg-gradient-to-br ${district.regionClass} ${district.coordinates} ${playable ? 'border-lime-200/70 hover:-translate-y-1 hover:shadow-lime-500/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300' : 'border-white/15'}`;
            return playable ? (
              <button key={district.id} onClick={onEnterAnimals} className={classes}>
                {content}
              </button>
            ) : (
              <div key={district.id} className={classes} aria-label={`${district.name}: içerik geliştirilme aşamasında`}>
                {content}
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-sky-200">
          Diğer bölgeler mevcut ilerlemeyi etkilemez. Yeni oyunlar, seslendirmeler ve öğrenme içerikleri tamamlandıkça açılacaktır.
        </p>
      </div>
    </div>
  );
};
