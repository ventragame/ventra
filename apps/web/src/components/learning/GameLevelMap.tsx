'use client';

import React from 'react';
import { GameLevelNode, LearningStepType } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

interface GameLevelMapProps {
  levels: GameLevelNode[];
  onSelectNode: (node: GameLevelNode) => void;
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameLevelMap: React.FC<GameLevelMapProps> = ({
  levels,
  onSelectNode,
  onBack,
  isMuted,
  onToggleMute
}) => {
  const totalLevels = levels.length;
  const completedLevels = levels.filter((l) => l.status === 'completed').length;
  const progressPercent = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
  const totalStars = levels.reduce((acc, l) => acc + (l.starsEarned || 0), 0);
  const isAllCompleted = completedLevels === totalLevels && totalLevels > 0;

  // Sıradaki ilk aktif (henüz tamamlanmamış ve kilitli olmayan) görevi bul
  const activeLevel = levels.find((l) => l.status === 'available') || levels[levels.length - 1];

  const handleNodeClick = (node: GameLevelNode) => {
    if (node.status === 'locked') {
      soundService.playSfx('gentle_retry', 0.5);
      return;
    }
    soundService.playSfx('tap');
    onSelectNode(node);
  };

  const handleCtaClick = () => {
    if (activeLevel && activeLevel.status !== 'locked') {
      soundService.playSfx('tap');
      onSelectNode(activeLevel);
    } else if (isAllCompleted) {
      soundService.playSfx('tap');
      onSelectNode(levels[0]); // Tekrar oynama için 1. seviyeden başla
    }
  };

  // 5 Düğümün Yatay & Dikey Kavisli Harita Koordinatları (Desktop Yüzdelik Oranları)
  const nodePositions = [
    { x: 12, y: 64 }, // 1. Keşfet (Sol alt)
    { x: 30, y: 30 }, // 2. Eşleştir (Sol üst-orta)
    { x: 50, y: 66 }, // 3. Dinle (Merkez alt)
    { x: 70, y: 28 }, // 4. Uygula (Sağ üst-orta)
    { x: 88, y: 58 }  // 5. Mini Macera (Sağ alt)
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-map-title"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 bg-gradient-to-b from-[#031310] via-[#06241e] to-[#020e0c] flex flex-col justify-between select-none animate-fadeIn overflow-hidden"
    >
      {/* Arka Plan Dekoratif Ada Görseli & Atmosferik Işıklar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Işık Odakları */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[28rem] bg-sky-500/5 rounded-full blur-3xl" />

        {/* Kelime Bahçesi Silik Arka Plan İllüstrasyonu */}
        <img
          src="/assets/kids-islands/word_garden.webp"
          alt=""
          className="absolute -right-16 -top-16 w-[420px] md:w-[600px] opacity-15 filter blur-sm transform rotate-6 object-contain pointer-events-none"
        />

        {/* Masalsı Çiçek/Parçacık Efektleri */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* 1. ÜST HEADER: ADA BİLGİSİ, GERİ DÖNÜŞ, YILDIZLAR VE SES */}
      <header className="relative z-10 px-4 py-3 md:px-8 md:py-4 border-b border-emerald-900/40 bg-slate-950/70 backdrop-blur-md flex items-center justify-between shadow-lg">
        {/* Sol: Geri Dönüş ve Ada Başlığı */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-900/90 hover:bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Haritaya Dön"
            aria-label="Haritaya Dön"
          >
            <span className="text-lg font-bold">←</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 id="game-map-title" className="text-base md:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>🌸</span>
                <span>Kelime Bahçesi</span>
              </h1>
              <span className="text-[10px] md:text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                A1 İngilizce
              </span>
              <span className="hidden sm:inline text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                7–12 Yaş
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-emerald-200/70 hidden sm:block">
              Doğanın Diliyle İlk Adım • Hayvanlar (Animals) Macera Haritası
            </p>
          </div>
        </div>

        {/* Sağ: İlerleme Özeti, Mute Butonu ve Yıldız Göstergesi */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* İlerleme Rozeti */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1.5 rounded-2xl shadow-inner">
            <span className="text-xs">🏆</span>
            <span className="text-xs font-bold text-emerald-200">
              {completedLevels}/{totalLevels} Seviye
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
              %{progressPercent}
            </span>
          </div>

          {/* Mute Senkron Düğmesi */}
          <button
            onClick={onToggleMute}
            className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-base text-slate-300 cursor-pointer shadow-md transition-all active:scale-95"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Yıldız Bakiyesi */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-2xl shadow-md">
            <span className="text-amber-400 text-sm md:text-base">⭐</span>
            <span className="text-xs md:text-sm font-black text-amber-300">
              {totalStars} / 15
            </span>
          </div>
        </div>
      </header>

      {/* 2. ORTA OYUN PATİKASI (KIVRIMLI ORGANİK MACERA YOLU) */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden">
        {/* DESKTOP GÖRÜNÜMÜ: S-KAVİSLİ 5 DÜĞÜMLÜ ORGANİK OYUN HARİTASI */}
        <div className="relative w-full h-full min-h-[460px] md:min-h-[500px] flex items-center justify-center hidden md:block">
          {/* SVG Kıvrımlı Yol Bağlantısı */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="inactivePathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glowPath" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Arka Plan Kılavuz Yolu (Geniş Yumuşak Çember Yolu) */}
            <path
              d="M 120 320 C 220 180, 220 150, 300 150 C 400 150, 420 330, 500 330 C 580 330, 620 140, 700 140 C 780 140, 800 290, 880 290"
              fill="none"
              stroke="#0f172a"
              strokeWidth="24"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* İkincil Renkli İlerleme Yolu */}
            <path
              d="M 120 320 C 220 180, 220 150, 300 150 C 400 150, 420 330, 500 330 C 580 330, 620 140, 700 140 C 780 140, 800 290, 880 290"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#glowPath)"
            />

            {/* Yol Üzerinde Kesikli Işık Noktaları */}
            <path
              d="M 120 320 C 220 180, 220 150, 300 150 C 400 150, 420 330, 500 330 C 580 330, 620 140, 700 140 C 780 140, 800 290, 880 290"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeDasharray="6 22"
              strokeLinecap="round"
              className="animate-pulse opacity-70"
            />
          </svg>

          {/* 5 DÜĞÜM KARTI (DESKTOP MUTLAK YERLEŞİM) */}
          {levels.map((level, idx) => {
            const pos = nodePositions[idx] || { x: 10 + idx * 20, y: 50 };
            const isCompleted = level.status === 'completed';
            const isCurrent = level.status === 'available';
            const isLocked = level.status === 'locked';

            return (
              <div
                key={level.id}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute z-20 flex flex-col items-center"
              >
                {/* Düğüm Portalı / Butonu */}
                <button
                  onClick={() => handleNodeClick(level)}
                  disabled={isLocked}
                  className={`group relative flex flex-col items-center p-3 rounded-3xl transition-all duration-300 transform cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-900/90 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 hover:scale-105'
                      : isCurrent
                      ? 'bg-gradient-to-b from-sky-950/95 to-emerald-950/95 border-3 border-emerald-300 shadow-2xl shadow-emerald-400/50 scale-110 animate-bounce'
                      : 'bg-slate-900/60 border border-slate-700/60 opacity-65 cursor-not-allowed'
                  }`}
                  style={{ width: '168px' }}
                >
                  {/* Düğüm Rozeti (Portalı) */}
                  <div
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform duration-300 group-hover:scale-110 ${
                      isCompleted
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/40'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 text-white shadow-lg shadow-emerald-400/60'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span>{level.icon}</span>

                    {/* Tamamlandı İkonu veya Kilit */}
                    {isCompleted && (
                      <span className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-slate-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black shadow-md">
                        ✓
                      </span>
                    )}
                    {isLocked && (
                      <span className="absolute -top-1 -right-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                        🔒
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase shadow-lg animate-pulse">
                        GÖREV
                      </span>
                    )}
                  </div>

                  {/* Düğüm Başlığı & Kısa Açıklaması */}
                  <div className="mt-2.5 text-center w-full">
                    <div className="text-xs font-black text-white tracking-wide truncate">
                      {level.title}
                    </div>
                    <div className="text-[10px] text-emerald-300/90 font-semibold truncate">
                      {level.subtitle}
                    </div>
                    <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                      {level.description}
                    </div>
                  </div>

                  {/* Durum Rozeti */}
                  <div className="mt-2">
                    {isCompleted ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                        {level.starsEarned > 0 ? `⭐⭐⭐` : '✓ Tamamlandı'}
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[9px] bg-sky-500/25 text-sky-200 px-2 py-0.5 rounded-full font-bold border border-sky-400/50">
                        Başlamak İçin Dokun
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                        Kilitli
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* MOBİL VE KÜÇÜK EKRAN GÖRÜNÜMÜ: DİKEY KIVRIMLI SERPENTİNE AKIŞ */}
        <div className="w-full flex md:hidden flex-col items-center gap-4 py-4 relative">
          {/* Dikey Bağlantı Çizgisi */}
          <div className="absolute left-8 top-10 bottom-10 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-slate-800 rounded-full opacity-60 pointer-events-none" />

          {levels.map((level) => {
            const isCompleted = level.status === 'completed';
            const isCurrent = level.status === 'available';
            const isLocked = level.status === 'locked';

            return (
              <button
                key={level.id}
                onClick={() => handleNodeClick(level)}
                disabled={isLocked}
                className={`relative z-10 w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                  isCompleted
                    ? 'bg-slate-900/90 border-emerald-500/60 text-white'
                    : isCurrent
                    ? 'bg-gradient-to-r from-emerald-950/95 to-slate-900/95 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-102'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Sol İkon Baloncuğu */}
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-emerald-400 to-sky-400 text-white shadow-lg animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <span>{level.icon}</span>
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 bg-emerald-400 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                  {isLocked && (
                    <span className="absolute -top-1 -right-1 bg-slate-800 text-slate-400 rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
                      🔒
                    </span>
                  )}
                </div>

                {/* Bilgi Metinleri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white truncate">
                      {level.title}
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-amber-400 font-bold">
                        ⭐⭐⭐
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold truncate">
                    {level.subtitle}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {level.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* 3. ALT FOOTER: İLERLEME ÖZET KARTI & DEVAM ET (CTA) BUTONU */}
      <footer className="relative z-10 px-4 py-3 md:px-8 md:py-4 border-t border-emerald-900/40 bg-slate-950/85 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        {/* İlerleme Özeti ve Görsel Bar */}
        <div className="w-full sm:w-auto flex-1 max-w-lg space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <span>🌸</span>
              <span>Kelime Bahçesi İlerlemesi</span>
            </span>
            <span className="font-bold text-emerald-400">
              {completedLevels} / {totalLevels} Görev Tamamlandı (%{progressPercent})
            </span>
          </div>

          {/* Premium Yuvarlatılmış Parlak Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/30 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Aksiyon (CTA) Butonu */}
        <div className="w-full sm:w-auto flex items-center justify-end">
          <button
            onClick={handleCtaClick}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 transform active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isAllCompleted ? (
              <>
                <span>🌸</span>
                <span>Bahçe Canlandı! Tekrar Oyna</span>
                <span>→</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Devam Et: {activeLevel?.title || 'Görevi Başlat'}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

