'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  type PlayerProfile,
  getAvatarById,
  ARCHIPELAGO_ISLANDS_CATALOG,
  ARCHIPELAGO_ISLANDS_ORDERED,
  type IslandId
} from '@ventra/shared';
import { getProgressRepository } from '../../lib/progress';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../../lib/progress/wordGardenProgress';
import { ProfileSelectorModal } from '../../components/profile/ProfileSelectorModal';
import { ParentalGateModal } from '../../components/profile/ParentalGateModal';
import { AdultAccountModal } from '../../components/profile/AdultAccountModal';
import { CloudTransition } from '../../components/learning/CloudTransition';
import { LearningPathModal } from '../../components/learning/LearningPathModal';
import { soundService } from '../../lib/audio/SoundService';
import { EventBus } from '../../lib/game/EventBus';

// PhaserGame dinamik olarak yüklenir (SSR hydration hatalarını önler)
const DynamicPhaserGame = dynamic(
  () => import('../../components/game/PhaserGame').then((mod) => mod.PhaserGame),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050914] text-white">
        <div className="w-14 h-14 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Ventra Adalar Evreni Yükleniyor...
        </h2>
        <p className="text-xs text-slate-400 mt-1">Phaser Takımada Motoru Başlatılıyor</p>
      </div>
    )
  }
);

export default function VentraKidsWorldPage() {
  // Profil ve Ebeveyn Durumları
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isAdultAccountModalOpen, setIsAdultAccountModalOpen] = useState<boolean>(false);

  // Oyun ve Bölge Durumu
  const [wordGardenStatus, setWordGardenStatus] = useState<'dormant' | 'blooming'>('dormant');
  const [wordGardenCompletedLevels, setWordGardenCompletedLevels] = useState<number>(0);
  const [wordGardenStarsByLevel, setWordGardenStarsByLevel] = useState<Record<number, number>>({});
  const [totalStars, setTotalStars] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundService.getMuted());

  // Aktif Seçili / Odaklanılan Ada (Navigasyon ve Detay Kartı İçin)
  const [focusedIsland, setFocusedIsland] = useState<IslandId>('word_garden');

  // Öğrenme Yolu ve Bulut Geçişi
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);
  const [pendingRegion, setPendingRegion] = useState<string | null>(null);

  // Ortak Oyun Durumu & Etkileşim Kilidi: Herhangi bir modal veya aktivite açıkken arka plan kilitlenir
  const isWorldLocked = Boolean(
    activeRegion ||
    isProfileModalOpen ||
    isParentGateOpen ||
    isAdultAccountModalOpen ||
    isTransitionActive
  );

  useEffect(() => {
    EventBus.emit('SET_WORLD_INPUT_LOCKED', isWorldLocked);
  }, [isWorldLocked]);

  useEffect(() => {
    setIsMuted(soundService.getMuted());
    const handleMuteChange = (muted: boolean) => {
      setIsMuted(muted);
    };
    EventBus.on('MUTE_STATE_CHANGED', handleMuteChange);
    return () => {
      EventBus.off('MUTE_STATE_CHANGED', handleMuteChange);
    };
  }, []);

  // Toast Bildirimi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast Bildirim Fonksiyonu
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // 1. Profil ve İlerleme Yükleme
  const loadProfileAndProgress = useCallback(async (profile: PlayerProfile) => {
    try {
      const progress = await getWordGardenProgress(getProgressRepository(), profile.id);
      setWordGardenCompletedLevels(progress.completedLevels);
      setWordGardenStarsByLevel(progress.starsByLevel);
      setTotalStars(progress.totalStars);
      setWordGardenStatus(progress.completedLevels === progress.totalLevels ? 'blooming' : 'dormant');
    } catch (error) {
      console.error('Kelime Bahçesi ilerlemesi yüklenemedi:', error);
      showToast('İlerleme yüklenemedi. Lütfen tekrar deneyin.');
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const repo = getProgressRepository();
        let prof = await repo.getActiveProfile();
        if (!prof) {
          prof = await repo.createProfile({ nickname: 'Kaşif Can', avatarId: 'avatar_explorer' });
        }
        if (!isMounted) return;
        setActiveProfile(prof);
        await loadProfileAndProgress(prof);
      } catch (err) {
        console.warn('Profil başlatma hatası:', err);
      }
    }
    init();

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('open') === 'word_garden') {
        setActiveRegion('word_garden');
      }
      const islandParam = searchParams.get('island') as IslandId;
      if (islandParam && ARCHIPELAGO_ISLANDS_CATALOG[islandParam]) {
        setFocusedIsland(islandParam);
      }
    }

    // Phaser'dan gelen ada seçimi bildirimini dinle
    const handleSelectFromPhaser = (islandId: IslandId) => {
      setFocusedIsland(islandId);
    };
    EventBus.on('SELECT_ISLAND', handleSelectFromPhaser);

    return () => {
      isMounted = false;
      EventBus.off('SELECT_ISLAND', handleSelectFromPhaser);
    };
  }, [loadProfileAndProgress]);

  const handleProfileSwitched = useCallback(
    async (newProf: PlayerProfile) => {
      setActiveProfile(newProf);
      await loadProfileAndProgress(newProf);
      showToast(`Aktif Profil: ${newProf.nickname}`);
    },
    [loadProfileAndProgress, showToast]
  );

  // 2. Bölgeye Geçiş (Bulut Geçiş Efekti)
  const handleOpenLearningPath = useCallback((regionId: string) => {
    soundService.unlockAudio();
    soundService.playSfx('whoosh');
    setPendingRegion(regionId);
    setIsTransitionActive(true);
  }, []);

  const handleTransitionCovered = useCallback(() => {
    setPendingRegion((currentPending) => {
      if (currentPending) {
        setActiveRegion(currentPending);
      }
      return null;
    });
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitionActive(false);
  }, []);

  const handleCloseLearningPath = useCallback(() => {
    soundService.playSfx('whoosh');
    setActiveRegion(null);
    setIsTransitionActive(false);
    setPendingRegion(null);
  }, []);

  // 3. Bölge Tamamlandığında (Kelime Bahçesi Bitimi)
  const handleRegionCompleted = useCallback(async () => {
    if (!activeProfile) return;
    // All five steps were persisted individually when their activities finished.
    // Do not create a synthetic whole-island completion or overwrite the true count.
    await loadProfileAndProgress(activeProfile);
    showToast('🌸 Kelime Bahçesi tamamlandı!');
  }, [activeProfile, loadProfileAndProgress, showToast]);

  // Ada Kamera Odağını Değiştirme
  const handleFocusIsland = useCallback(
    (islandId: IslandId) => {
      setFocusedIsland(islandId);
      soundService.playSfx('tap', 0.5);
      EventBus.emit('FOCUS_ISLAND', islandId);

      const targetDef = ARCHIPELAGO_ISLANDS_CATALOG[islandId];
      if (!targetDef.isUnlockedDefault) {
        showToast(
          `🔒 ${targetDef.nameTr}: ${targetDef.unlockRequirementNotice || 'Henüz kilitli!'}`
        );
      }
    },
    [showToast]
  );

  // Genel Harita Görünümüne Geç
  const handleShowWorldOverview = useCallback(() => {
    soundService.playSfx('whoosh', 0.6);
    EventBus.emit('ZOOM_WORLD_OVERVIEW');
    showToast('🗺️ Takımada Genel Harita Görünümü');
  }, [showToast]);

  const currentAvatar = getAvatarById(activeProfile?.avatarId || 'avatar_explorer');
  const wordGardenProgressPercent = Math.round((wordGardenCompletedLevels / 5) * 100);
  const currentIslandDef = ARCHIPELAGO_ISLANDS_CATALOG[focusedIsland];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#050914] flex flex-col select-none font-sans"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#050914'
      }}
    >
      {/* 1. ÜST GEZİNME VE PROFİL ÇUBUĞU */}
      <header
        aria-hidden={isWorldLocked}
        className={`absolute top-0 left-0 right-0 z-30 px-3 py-2 md:px-6 md:py-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent transition-all duration-300 ${
          isWorldLocked
            ? 'pointer-events-none opacity-0 invisible -translate-y-4'
            : 'pointer-events-auto opacity-100 visible translate-y-0'
        }`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background:
            'linear-gradient(to bottom, rgba(2, 6, 23, 0.92) 0%, rgba(2, 6, 23, 0.6) 70%, transparent 100%)'
        }}
      >
        {/* Sol: Ana Sayfa Bağlantısı & Profil Seçici */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
            title="Ana Sayfaya Dön"
          >
            <span className="text-sm">🏠</span>
          </Link>
          <button
            onClick={() => {
              soundService.unlockAudio();
              soundService.playSfx('tap');
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-2 md:gap-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl px-2.5 py-1 md:px-3 md:py-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <div
              className="w-7 h-7 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-base md:text-xl shadow-inner"
              style={{ backgroundColor: currentAvatar.bgColor }}
            >
              {currentAvatar.emoji}
            </div>
            <div className="text-left">
              <div className="text-xs md:text-sm font-extrabold text-white leading-tight">
                {activeProfile?.nickname || 'Kaşif'}
              </div>
              <div className="text-[10px] text-sky-400 font-semibold leading-none">
                Profil Değiştir ▾
              </div>
            </div>
          </button>
        </div>

        {/* Orta: Dünya Başlığı & Genel Harita Butonu */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/80 border border-slate-700/80 rounded-2xl px-3.5 py-1.5 shadow-lg">
          <span className="text-base">🏝️</span>
          <span className="text-xs md:text-sm font-extrabold text-white tracking-wide">
            VENTRA ADALAR EVRENİ
          </span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
            6 Ada (V2)
          </span>
          <button
            onClick={handleShowWorldOverview}
            className="flex items-center gap-1 ml-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-200 hover:text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            title="Tüm Adaları Gör (Genel Harita)"
          >
            <span>🗺️</span>
            <span>Genel Harita</span>
          </button>
        </div>

        {/* Sağ: Yıldızlar, Ses & Ebeveyn Butonu */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobilde Genel Harita Butonu */}
          <button
            onClick={handleShowWorldOverview}
            className="sm:hidden w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-200 cursor-pointer shadow-md"
            title="Genel Harita"
          >
            🗺️
          </button>

          {/* Yıldız Bakiyesi */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/40 rounded-2xl px-2.5 py-1 md:px-3 md:py-1.5 shadow-md">
            <span className="text-amber-400 text-sm md:text-base">⭐</span>
            <span className="text-xs md:text-sm font-black text-amber-300">
              {totalStars}
            </span>
          </div>

          {/* Ses Aç/Kapat */}
          <button
            onClick={() => {
              const muted = soundService.toggleMute();
              setIsMuted(muted);
              soundService.playSfx('tap');
            }}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-sm md:text-base text-slate-300 cursor-pointer shadow-md"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Ebeveyn Alanı & Bulut */}
          <button
            onClick={() => {
              soundService.unlockAudio();
              soundService.playSfx('tap');
              setIsParentGateOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>🛡️</span>
            <span>Ebeveyn & Bulut</span>
          </button>
        </div>
      </header>

      {/* 2. ANA OYUN ALANI (PHASER ADALAR EVRENİ CANVAS) */}
      <main
        className="w-full h-full flex-1 relative overflow-hidden"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <DynamicPhaserGame
          wordGardenStatus={wordGardenStatus}
          wordGardenCompletedLevels={wordGardenCompletedLevels}
          onOpenLearningPath={handleOpenLearningPath}
          onToast={showToast}
        />
      </main>

      {/* 3. DİNAMİK SEÇİLİ ADA DETAY KARTI (MASAÜSTÜ VE MOBİL İÇİN KOMPAKT, TEK KART) */}
      <div
        aria-hidden={isWorldLocked}
        className={`absolute bottom-20 md:bottom-20 left-4 md:left-6 z-20 max-w-[340px] w-[calc(100vw-32px)] md:w-auto transition-all duration-300 ${
          isWorldLocked
            ? 'pointer-events-none opacity-0 translate-y-6 invisible'
            : 'pointer-events-none opacity-100 translate-y-0 visible'
        }`}
      >
        <div
          className={`bg-slate-950/85 backdrop-blur-md border rounded-2xl p-3.5 shadow-2xl transition-all duration-300 ${
            isWorldLocked ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{
            borderColor: currentIslandDef.accentBorder || '#38bdf8',
            boxShadow: `0 10px 25px -5px ${currentIslandDef.glowColor || 'rgba(0,0,0,0.5)'}`
          }}
        >
          {/* Kart Başlık ve Rozet */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs md:text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentIslandDef.emoji}</span>
              <span>{currentIslandDef.nameTr}</span>
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${currentIslandDef.themeColor}25`,
                color: currentIslandDef.accentBorder,
                borderColor: `${currentIslandDef.accentBorder}40`
              }}
            >
              {currentIslandDef.badgeText}
            </span>
          </div>

          {/* Amaç ve Açıklama */}
          <div className="text-[11px] font-bold text-sky-400 mb-0.5">
            {currentIslandDef.subtitleTr}
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            {currentIslandDef.descriptionTr}
          </p>

          {/* Duruma Göre Eylem ve İlerleme Alanı */}
          <div className="space-y-2">
            {currentIslandDef.contentPublished ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>İlerleme: {wordGardenCompletedLevels}/5 Seviye</span>
                    <span className={wordGardenCompletedLevels > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                      %{wordGardenProgressPercent}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${wordGardenProgressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleOpenLearningPath('word_garden')}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>
                    {wordGardenCompletedLevels === 5
                      ? '🌸 Bahçe Canlandı! Tekrar Oyna'
                      : '✨ Seviye Haritasını Aç'}
                  </span>
                  <span>→</span>
                </button>
              </>
            ) : (
              <>
                {!currentIslandDef.isUnlockedDefault ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-3 py-2 rounded-xl border border-amber-500/30">
                    <span className="text-sm">🔒</span>
                    <span>{currentIslandDef.unlockRequirementNotice || 'Önceki adaları tamamlayınca açılır'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-300 bg-sky-500/15 px-3 py-2 rounded-xl border border-sky-500/30">
                    <span className="text-sm">✨</span>
                    <span>Ada keşfedildi! Maceralar çok yakında eklenecektir.</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 px-1 pt-0.5">
                  <span>İçerik Durumu:</span>
                  <span className="text-amber-400/90 font-semibold">Pek Yakında (Hazırlanıyor)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. ALT HIZLI TAKIMADA NAVİGASYON ŞERİDİ (6 ADANIN TAMAMI) */}
      <nav
        aria-label="Takımada Gezinme Çubuğu"
        aria-hidden={isWorldLocked}
        className={`absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-1.5 md:gap-2 bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-2xl px-2.5 py-1.5 md:px-3.5 md:py-1.5 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-none transition-all duration-300 ${
          isWorldLocked
            ? 'pointer-events-none opacity-0 translate-y-6 invisible'
            : 'pointer-events-auto opacity-100 translate-y-0 visible'
        }`}
      >
        <span className="text-[11px] font-bold text-slate-400 hidden lg:inline mr-1">
          Adalar:
        </span>
        {ARCHIPELAGO_ISLANDS_ORDERED.map((island) => {
          const isSelected = focusedIsland === island.id;
          const isUnlocked = island.isUnlockedDefault;
          const isWordGarden = island.id === 'word_garden';
          const completedCount = isWordGarden ? wordGardenCompletedLevels : 0;
          const isCompleted = isWordGarden && wordGardenCompletedLevels === 5;

          return (
            <button
              key={island.id}
              onClick={() => handleFocusIsland(island.id)}
              className={`flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: island.themeColor,
                      boxShadow: `0 4px 14px ${island.glowColor}`
                    }
                  : undefined
              }
            >
              <span>{island.emoji}</span>
              <span>{island.nameTr}</span>
              {isCompleted ? (
                <span className="text-[9px] md:text-[10px] bg-emerald-400/25 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-400/40 font-bold">
                  ✓ 5/5
                </span>
              ) : isUnlocked ? (
                <span className="text-[9px] md:text-[10px] bg-sky-400/20 text-sky-300 px-1.5 py-0.2 rounded-full border border-sky-400/30 font-semibold">
                  Açık
                </span>
              ) : (
                <span className="text-[9px] md:text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
                  🔒 Kilitli
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 5. BULUT GEÇİŞ ANİMASYONU */}
      <CloudTransition
        isActive={isTransitionActive}
        onCovered={handleTransitionCovered}
        onComplete={handleTransitionComplete}
      />

      {/* 6. ÖĞRENME PATİKASI VE DERS MODALI */}
      {activeRegion && (
        <LearningPathModal
          regionId={activeRegion}
          onClose={handleCloseLearningPath}
          onRegionCompleted={handleRegionCompleted}
          initialCompletedLevels={wordGardenCompletedLevels}
          initialStarsByLevel={wordGardenStarsByLevel}
          onProgressUpdate={async (_completed, _total, levelOrder, starsEarned) => {
            if (!activeProfile) throw new Error('Aktif çocuk profili bulunamadı.');
            const result = await saveWordGardenLevelCompletion(
              getProgressRepository(), activeProfile.id, levelOrder, starsEarned
            );
            setWordGardenCompletedLevels(result.completedLevels);
            setWordGardenStarsByLevel(result.starsByLevel);
            setTotalStars(result.totalStars);
            setWordGardenStatus(result.completedLevels === result.totalLevels ? 'blooming' : 'dormant');
          }}
        />
      )}

      {/* 7. TOAST MESAJI */}
      {toastMessage && (
        <div className="absolute bottom-24 md:bottom-28 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/60 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl shadow-black/50 animate-bounce pointer-events-none text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}

      {/* 8. MODALLAR (Profil, Ebeveyn Kapısı, Yetişkin Bulut Hesabı) */}
      {isProfileModalOpen && (
        <ProfileSelectorModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileSwitched={handleProfileSwitched}
          onOpenParentGate={() => {
            setIsProfileModalOpen(false);
            setIsParentGateOpen(true);
          }}
        />
      )}

      {isParentGateOpen && (
        <ParentalGateModal
          isOpen={isParentGateOpen}
          onClose={() => setIsParentGateOpen(false)}
          onSuccess={() => {
            setIsParentGateOpen(false);
            setIsAdultAccountModalOpen(true);
          }}
        />
      )}

      {isAdultAccountModalOpen && (
        <AdultAccountModal
          isOpen={isAdultAccountModalOpen}
          onClose={() => setIsAdultAccountModalOpen(false)}
          onSyncCompleted={() => {
            if (activeProfile) loadProfileAndProgress(activeProfile);
          }}
        />
      )}
    </div>
  );
}
