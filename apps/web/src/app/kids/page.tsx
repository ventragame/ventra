'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  type PlayerProfile,
  getAvatarById,
  ARCHIPELAGO_ISLANDS_CATALOG,
  ARCHIPELAGO_ISLANDS_ORDERED,
  type IslandId
} from '@ventra/shared';
import { getProgressRepository, type CreateProfileInput } from '../../lib/progress';
import { KidsWelcomeGate } from '../../components/onboarding/KidsWelcomeGate';
import { saveWordGardenLevelCompletion } from '../../lib/progress/wordGardenProgress';
import {getGardenOverallProgress,type GardenOverallProgress} from '../../lib/progress/gardenOverallProgress';
const ProfileSelectorModal = dynamic(() => import('../../components/profile/ProfileSelectorModal').then((module) => module.ProfileSelectorModal), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
const ParentalGateModal = dynamic(() => import('../../components/profile/ParentalGateModal').then((module) => module.ParentalGateModal), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
const AdultAccountModal = dynamic(() => import('../../components/profile/AdultAccountModal').then((module) => module.AdultAccountModal), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
import { CloudTransition } from '../../components/learning/CloudTransition';
const LearningPathModal = dynamic(() => import('../../components/learning/LearningPathModal').then((module) => module.LearningPathModal), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
const SentencePlazaAdventure = dynamic(() => import('../../components/learning/sentence/SentencePlazaAdventure').then((module) => module.SentencePlazaAdventure), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
const StoryForestHome = dynamic(() => import('../../components/learning/story/StoryForestHome').then((module) => module.StoryForestHome), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
import { getSequenceProgress, type SequenceProgress } from '../../lib/progress/storySequenceProgress';
import { getDetectiveProgress, type DetectiveProgress } from '../../lib/progress/storyDetectiveProgress';
import { getStoryForestProgress, type ForestProgress } from '../../lib/progress/storyForestProgress';
import {getSentencePlazaProgress,type SentencePlazaProgress} from '../../lib/progress/sentencePlazaProgress';
const KidsPassport = dynamic(() => import('../../components/rewards/KidsPassport').then((module) => module.KidsPassport), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
import { CosmeticArtwork } from '../../components/rewards/CosmeticArtwork';
import { getPassport } from '../../lib/rewards/economyRepository';
import { COSMETICS,type CosmeticId } from '../../lib/rewards/economyEngine';
import { soundService } from '../../lib/audio/SoundService';
import { AvatarPortrait } from '../../components/profile/AvatarPortrait';
const AudioSettingsPanel = dynamic(() => import('../../components/audio/AudioSettingsPanel').then((module) => module.AudioSettingsPanel), { loading: () => <div role="status" className="text-center text-sm text-sky-100 p-6">Ventra bölümü yükleniyor…</div> });
import { EventBus } from '../../lib/game/EventBus';
import './kids-world-premium.css';

// PhaserGame dinamik olarak yüklenir (SSR hydration hatalarını önler)
const DynamicPhaserGame = dynamic(
  () => import('../../components/game/PhaserGame').then((mod) => mod.PhaserGame),
  {
    ssr: false,
    loading: () => (
      <div role="status" aria-live="polite" className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#07162d] via-[#0c3451] to-[#0b4b66] px-5 text-center text-white">
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center" aria-hidden="true">
          <div className="absolute inset-1 rounded-full bg-sky-300/25 blur-2xl" />
          <div className="relative grid h-20 w-20 place-items-center rounded-[25px] border border-emerald-200/40 bg-gradient-to-br from-sky-400/35 to-emerald-400/30 text-4xl shadow-xl shadow-sky-950/30">🏝️</div>
          <span className="absolute -right-2 -top-1 text-2xl text-amber-200 motion-safe:animate-pulse">✦</span>
        </div>
        <p className="text-xs font-black tracking-[0.2em] text-amber-200">VENTRA · BÜYÜLÜ ADALAR</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Maceran Başlıyor!</h2>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-sky-100">Sihirli adalar seni bekliyor. Birazdan keşfe çıkıyoruz!</p>
      </div>
    )
  }
);

export default function VentraKidsWorldPage() {
  // Profil ve Ebeveyn Durumları
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [bootState, setBootState] = useState<'loading' | 'new' | 'ready' | 'error'>('loading');
  const [bootRetry, setBootRetry] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isModeGateOpen, setIsModeGateOpen] = useState<boolean>(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isAdultAccountModalOpen, setIsAdultAccountModalOpen] = useState<boolean>(false);

  // Oyun ve Bölge Durumu
  const [wordGardenStatus, setWordGardenStatus] = useState<'dormant' | 'blooming'>('dormant');
  const [wordGardenCompletedLevels, setWordGardenCompletedLevels] = useState<number>(0);
  const [gardenOverall,setGardenOverall]=useState<GardenOverallProgress|null>(null);
  const [plazaProgress,setPlazaProgress]=useState<SentencePlazaProgress|null>(null);
  const [forestProgress,setForestProgress]=useState<ForestProgress|null>(null);
  const [sequenceProgress,setSequenceProgress]=useState<SequenceProgress|null>(null);
  const [detectiveProgress,setDetectiveProgress]=useState<DetectiveProgress|null>(null);
  const [wordGardenStarsByLevel, setWordGardenStarsByLevel] = useState<Record<number, number>>({});
  const [totalStars, setTotalStars] = useState<number>(0);
  const [isPassportOpen,setIsPassportOpen]=useState(false);
  const [coinBalance,setCoinBalance]=useState<number|null>(null);
  const [avatarEquipment,setAvatarEquipment]=useState<Partial<Record<'hat'|'badge'|'aura',CosmeticId>>>({});
  const [isMuted, setIsMuted] = useState<boolean>(() => soundService.getMuted());
  const [isAudioSettingsOpen,setIsAudioSettingsOpen]=useState(false);

  // Aktif Seçili / Odaklanılan Ada (Navigasyon ve Detay Kartı İçin)
  const [focusedIsland, setFocusedIsland] = useState<IslandId>('word_garden');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isIslandDetailExpanded, setIsIslandDetailExpanded] = useState(false);
  const [isWorldOverview, setIsWorldOverview] = useState(false);

  // Öğrenme Yolu ve Bulut Geçişi
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);
  const pendingRegionRef = useRef<string | null>(null);

  // Ortak Oyun Durumu & Etkileşim Kilidi: Herhangi bir modal veya aktivite açıkken arka plan kilitlenir
  const isWorldLocked = Boolean(
    activeRegion ||
    isModeGateOpen ||
    isProfileModalOpen ||
    isParentGateOpen ||
    isAdultAccountModalOpen ||
    isPassportOpen ||
    isAudioSettingsOpen ||
    isTransitionActive
  );

  useEffect(() => {
    EventBus.emit('SET_WORLD_INPUT_LOCKED', isWorldLocked);
  }, [isWorldLocked]);

  useEffect(() => {
    const onOverviewChange = (overview: boolean) => {
      setIsWorldOverview(Boolean(overview));
      if (overview) setIsIslandDetailExpanded(false);
    };
    EventBus.on('WORLD_OVERVIEW_CHANGED', onOverviewChange);
    if (new URLSearchParams(window.location.search).get('overview') === '1') {
      setIsWorldOverview(true);
    }
    return () => EventBus.off('WORLD_OVERVIEW_CHANGED', onOverviewChange);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsIslandDetailExpanded(false);
    const dock = document.querySelector<HTMLElement>('.kids-world-dock');
    const active = dock?.querySelector<HTMLElement>('[data-selected="true"]');
    if (dock && active && window.matchMedia('(max-width: 900px)').matches) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dock.scrollTo({
        left: Math.max(0, active.offsetLeft - (dock.clientWidth - active.clientWidth) / 2),
        behavior: reduced ? 'instant' : 'smooth'
      });
    }
  }, [focusedIsland]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [mobileMenuOpen]);

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

  useEffect(()=>{
    soundService.setMusicScene(activeRegion==='story_castle'?'plaza':activeRegion?'garden':'archipelago');
  },[activeRegion]);

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
      const overview=await getGardenOverallProgress(getProgressRepository(),profile.id,profile.gradeLevel??null,profile.englishLevel??'Pre-A1');
      const plaza=await getSentencePlazaProgress(getProgressRepository(),profile.id);
      const [forest,sequence,detective]=await Promise.all([
        getStoryForestProgress(getProgressRepository(),profile.id),
        getSequenceProgress(getProgressRepository(),profile.id),
        getDetectiveProgress(getProgressRepository(),profile.id)
      ]);
      setPlazaProgress(plaza);
      setForestProgress(forest);
      setSequenceProgress(sequence);
      setDetectiveProgress(detective);
      setGardenOverall(overview);
      setWordGardenCompletedLevels(overview.animals.completedLevels);
      setWordGardenStarsByLevel(overview.animals.starsByLevel);
      setTotalStars(await getProgressRepository().getTotalStars(profile.id));
      try {
        const passport=await getPassport(getProgressRepository(),profile.id);
        setCoinBalance(passport.balance);
        setAvatarEquipment(passport.economy.equipped);
      }catch(err){console.warn('P5 rewards could not be read',err);
        setCoinBalance(null);setAvatarEquipment({});
      }
      setWordGardenStatus(overview.completedWorlds===6?'blooming':'dormant');
    } catch (error) {
      console.error('Kelime Bahçesi ilerlemesi yüklenemedi:', error);
      setGardenOverall(null);
      setPlazaProgress(null);
      setForestProgress(null);
      setSequenceProgress(null);
      setDetectiveProgress(null);
      showToast('İlerleme yüklenemedi. Lütfen tekrar deneyin.');
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        // Never create a synthetic child profile before the visitor chooses a path.
        // Existing profiles (including migrated legacy players) retain their IDs and progress.
        if (!window.indexedDB) throw new Error('IndexedDB is unavailable');
        const repo = getProgressRepository();
        const prof = await repo.getActiveProfile();
        if (!isMounted) return;
        if (!prof) {
          setBootState('new');
          return;
        }
        setActiveProfile(prof);
        await loadProfileAndProgress(prof);
        if (isMounted) setBootState('ready');
      } catch (err) {
        console.error('Ventra Kids profil başlangıcı başarısız:', err);
        if (isMounted) setBootState('error');
      }
    }
    init();

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const requested=searchParams.get('open');
      if(requested==='word_garden'||requested==='story_castle'||requested==='listening_forest')setActiveRegion(requested);
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
  }, [loadProfileAndProgress, bootRetry]);

  const handleFirstProfile = useCallback(async (input: CreateProfileInput) => {
    const repo = getProgressRepository();
    const created = await repo.createProfile(input);
    setActiveProfile(created);
    await loadProfileAndProgress(created);
    setBootState('ready');
  }, [loadProfileAndProgress]);

  const handleRetryBoot = useCallback(() => {
    setBootState('loading');
    setBootRetry((value) => value + 1);
  }, []);

  const handleCloudProfilesChanged = useCallback(async () => {
    const repo = getProgressRepository();
    const current = await repo.getActiveProfile();
    if (!current) return;
    setActiveProfile(current);
    await loadProfileAndProgress(current);
    setBootState('ready');
    showToast('Çocuk profilleri güncellendi. Oyuncu seçimi menüsünden geçiş yapabilirsin.');
  }, [loadProfileAndProgress, showToast]);

  const handleProfileSwitched = useCallback(
    async (newProf: PlayerProfile) => {
      setIsPassportOpen(false);
      setActiveProfile(newProf);
      await loadProfileAndProgress(newProf);
      showToast(`Aktif Profil: ${newProf.nickname}`);
    },
    [loadProfileAndProgress, showToast]
  );

  // 2. Bölgeye Geçiş (Bulut Geçiş Efekti)
  const handleOpenLearningPath = useCallback((regionId: string) => {
    // Guard rapid double taps until the current transition fully finishes.
    if (pendingRegionRef.current) return;
    pendingRegionRef.current = regionId;
    soundService.unlockAudio();
    soundService.playSfx('island_portal',0.85);
    setIsTransitionActive(true);
  }, []);

  const handleTransitionCovered = useCallback(() => {
    // Never issue a state update from inside another state updater.
    const region = pendingRegionRef.current;
    pendingRegionRef.current = null;
    if (region) setActiveRegion(region);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitionActive(false);
  }, []);

  const handleCloseLearningPath = useCallback(() => {
    soundService.playSfx('whoosh');
    setActiveRegion(null);
    setIsTransitionActive(false);
    pendingRegionRef.current = null;
  }, []);

  // 3. Bölge Tamamlandığında (Kelime Bahçesi Bitimi)
  const handleRegionCompleted = useCallback(async () => {
    if (!activeProfile) return;
    // All five steps were persisted individually when their activities finished.
    // Do not create a synthetic whole-island completion or overwrite the true count.
    await loadProfileAndProgress(activeProfile);
    showToast('🌿 Hayvan Çayırı tamamlandı!');
  }, [activeProfile, loadProfileAndProgress, showToast]);

  // Ada Kamera Odağını Değiştirme
  const handleFocusIsland = useCallback(
    (islandId: IslandId) => {
      setIsWorldOverview(false);
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
    setMobileMenuOpen(false);
    setIsWorldOverview(true);
    setIsIslandDetailExpanded(false);
    soundService.playSfx('whoosh', 0.6);
    EventBus.emit('ZOOM_WORLD_OVERVIEW');
    showToast('🗺️ Takımada Genel Harita Görünümü');
  }, [showToast]);

  // Render the entrance before mounting Phaser. First-time users must explicitly
  // create a profile, while existing players skip onboarding entirely.
  if (bootState === 'loading' || bootState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050914] p-6 text-center text-white">
        <div className="max-w-sm space-y-4">
          <div className="text-5xl" aria-hidden="true">🏝️</div>
          <h1 className="text-2xl font-black">Ventra Kids</h1>
          {bootState === 'loading' ? (
            <p role="status" className="text-sm text-slate-300">Oyuncu bilgileri kontrol ediliyor…</p>
          ) : (
            <>
              <p role="alert" className="text-sm text-rose-200">
                Cihazdaki oyuncu kayıtlarına erişilemedi. Güvenliğin için yeni profil oluşturmuyoruz.
                Tarayıcının yerel depolama izinlerini kontrol et.
              </p>
              <button onClick={handleRetryBoot} className="rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white">
                Yeniden Dene
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (bootState === 'new') {
    return (
      <>
        <KidsWelcomeGate onCreateProfile={handleFirstProfile} onOpenParent={() => setIsParentGateOpen(true)} />
        {isParentGateOpen && (
          <ParentalGateModal isOpen onClose={() => setIsParentGateOpen(false)} onSuccess={() => {
            setIsParentGateOpen(false);
            setIsAdultAccountModalOpen(true);
          }} />
        )}
        {isAdultAccountModalOpen && (
          <AdultAccountModal isOpen onClose={() => setIsAdultAccountModalOpen(false)} onSyncCompleted={() => { void handleCloudProfilesChanged(); }} />
        )}
      </>
    );
  }

  const currentAvatar = getAvatarById(activeProfile?.avatarId || 'avatar_explorer');
  const wordGardenProgressPercent = gardenOverall?.percent ?? 0;
  const currentIslandDef = ARCHIPELAGO_ISLANDS_CATALOG[focusedIsland];
  const focusedPercent = focusedIsland==='story_castle'
    ?Math.round(100*(plazaProgress?.completedLevels??0)/6)
    :focusedIsland==='listening_forest'
    ?Math.round(100*((forestProgress?.completedLevels??0)+(sequenceProgress?.completedLevels??0)+(detectiveProgress?.completedLevels??0))/18):wordGardenProgressPercent;
  const focusedCountText=focusedIsland==='story_castle'
    ?(plazaProgress?String(plazaProgress.completedLevels)+' / 6 görev tamamlandı':'İlerleme okunamadı')
    :focusedIsland==='listening_forest'
    ?(forestProgress&&sequenceProgress&&detectiveProgress?String(forestProgress.completedLevels+sequenceProgress.completedLevels+detectiveProgress.completedLevels)+' / 18 hikâye görevi tamamlandı':'İlerleme okunamadı')
    :(gardenOverall?String(gardenOverall.completed)+' / '+String(gardenOverall.total)+' görev tamamlandı':'İlerleme okunamadı');

  return (
    <div
      className="kids-world-root relative w-screen h-screen overflow-hidden flex flex-col select-none"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#79c7ef'
      }}
    >
      <div className="kids-world-atmosphere" aria-hidden="true" />

      {/* 1. ÜST GEZİNME VE PROFİL ÇUBUĞU */}
      <header
        aria-hidden={isWorldLocked}
        inert={isWorldLocked}
        className={`kids-world-hud transition-all duration-300 ${
          isWorldLocked
            ? 'pointer-events-none opacity-0 invisible -translate-y-4'
            : 'pointer-events-auto opacity-100 visible translate-y-0'
        }`}

      >
        {/* Sol: Ana Sayfa Bağlantısı & Profil Seçici */}
        <div className="kids-hud-left">
          <Link
            href="/"
            className="kids-hud-icon" aria-label="Ana sayfaya dön"
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
            className="kids-hud-glass kids-hud-profile"
          >
            <div
              className="kids-profile-avatar"
              style={{ backgroundColor: currentAvatar.bgColor }}
            >
              <AvatarPortrait id={activeProfile?.avatarId||'avatar_explorer'} size={38} className="h-full w-full"/>
              {avatarEquipment.hat&&<span aria-hidden="true" className="absolute -right-2 -top-2 text-sm">
                {<CosmeticArtwork id={avatarEquipment.hat} size={25}/>}
              </span>}
            </div>
            <div className="text-left">
              <div className="kids-profile-name text-sm font-extrabold text-white leading-tight">
                {activeProfile?.nickname || 'Kaşif'}
              </div>
              <div className="kids-profile-label">
                Profil Değiştir ▾
              </div>
            </div>
          </button>
        </div>

        {/* Orta: Dünya Başlığı & Genel Harita Butonu */}
        <div className="kids-hud-glass kids-hud-title hidden lg:flex">
          <span className="text-2xl" aria-hidden="true">🏝️</span>
          <div className="flex flex-col gap-0.5"><strong>VENTRA ADALAR EVRENİ</strong><span className="kids-world-name">6 ADA · BÜYÜLÜ KEŞİF</span></div>
          <button
            onClick={handleShowWorldOverview}
            className="kids-hud-map-button"
            title="Tüm Adaları Gör (Genel Harita)"
          >
            <span>🗺️</span>
            <span>Genel Harita</span>
          </button>
        </div>

        {/* Sağ: Yıldızlar, Ses & Ebeveyn Butonu */}
        <div className="kids-hud-actions">
          {/* Mobilde Genel Harita Butonu */}
          <button
            onClick={handleShowWorldOverview}
            className="kids-hud-icon lg:hidden" aria-label="Genel haritayı göster"
            title="Genel Harita"
          >
            🗺️
          </button>

          {/* Yıldız Bakiyesi */}
          <div className="kids-hud-glass kids-hud-stat kids-hud-stars" aria-label={`${totalStars} yıldız`}>
            <span className="kids-stat-icon">⭐</span>
            <span className="font-black">
              {totalStars}
            </span>
          </div>
          <button onClick={()=>{soundService.playSfx('tap');setIsPassportOpen(true);}}
            className="kids-hud-glass kids-hud-stat kids-hud-coins"
            title="Maceracı Pasaportu, görevler ve kozmetik koleksiyonu">
            <span className="kids-stat-icon" aria-hidden="true">🪙</span><span>{coinBalance??'—'}</span><span className="hidden xl:inline">Pasaport</span>
          </button>

          {/* Ses stüdyosu: kullanıcı isteği olmadan müzik başlamaz. */}
          <button
            onClick={()=>{soundService.unlockAudio();setIsAudioSettingsOpen(true);}}
            className="kids-hud-icon" aria-label="Ses ve müzik ayarlarını aç"
            title="Ses ve Müzik Ayarları"
          >
            {isMuted?'🔇':'🎚️'}
          </button>

          <button
            onClick={() => { soundService.unlockAudio(); setIsModeGateOpen(true); }}
            className="kids-hud-glass kids-hud-simple"
            title="Oyun yolunu değiştir"
            aria-label="Oyun yolunu değiştir">
            <span>🧭</span><span className="hidden md:inline">Oyun Yolum</span>
          </button>

          {/* Ebeveyn Alanı & Bulut */}
          <button
            onClick={() => {
              soundService.unlockAudio();
              soundService.playSfx('tap');
              setIsParentGateOpen(true);
            }}
            className="kids-hud-glass kids-hud-simple kids-hud-adult hidden sm:flex items-center gap-1.5"
          >
            <span>🛡️</span>
            <span>Ebeveyn & Bulut</span>
          </button>
        </div>
        <div className="kids-mobile-actions">
          <span className="kids-mobile-stars" aria-label={`${totalStars} yıldız`}>⭐ {totalStars}</span>
          <button className="kids-mobile-icon" type="button"
            onClick={handleShowWorldOverview} aria-label="Altı adanın genel haritasını göster"
            title="Genel harita">🗺️</button>
          <button className="kids-mobile-icon" type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen} aria-controls="kids-mobile-tools"
            aria-label={mobileMenuOpen ? 'Araç menüsünü kapat' : 'Araç menüsünü aç'}
            title="Araçlar">{mobileMenuOpen ? '✕' : '☰'}</button>
        </div>
        {mobileMenuOpen && !isWorldLocked && (
          <div id="kids-mobile-tools" role="group" aria-label="Adalar Evreni araçları"
            className="kids-mobile-menu">
            <strong>Keşif araçları</strong>
            <button type="button" onClick={handleShowWorldOverview}>🗺️ <span>Genel harita</span></button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setIsPassportOpen(true); }}>🪙 <span>Pasaport ve ödüller</span></button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); soundService.unlockAudio(); setIsAudioSettingsOpen(true); }}>🎚️ <span>Ses ve müzik</span></button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setIsModeGateOpen(true); }}>🧭 <span>Oyun yolum</span></button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setIsParentGateOpen(true); }}>🛡️ <span>Ebeveyn ve bulut</span></button>
          </div>
        )}
      </header>
      {mobileMenuOpen && !isWorldLocked && (
        <button type="button" className="kids-mobile-menu-backdrop"
          aria-label="Araç menüsünü kapat" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="kids-world-caption" aria-hidden="true">Altı ada, sonsuz İngilizce macerası</div>

      {/* 2. ANA OYUN ALANI (PHASER ADALAR EVRENİ CANVAS) */}
      <main
        className="kids-world-canvas w-full h-full flex-1 relative overflow-hidden"
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
          wordGardenCompletedLevels={gardenOverall?.completed??0}
          wordGardenTotalLevels={gardenOverall?.total??73}
          plazaCompletedLevels={plazaProgress?.completedLevels??0}
          forestCompletedLevels={(forestProgress?.completedLevels??0)+(sequenceProgress?.completedLevels??0)+(detectiveProgress?.completedLevels??0)}
          onOpenLearningPath={handleOpenLearningPath}
          onToast={showToast}
        />
      </main>

      {/* 3. Selected island: meaningful status, child-readable text and one primary action. */}
      <aside
        aria-hidden={isWorldLocked}
        inert={isWorldLocked}
        aria-label="Seçili ada bilgisi"
        className={`kids-island-detail ${isWorldOverview ? 'kids-island-detail--overview' : ''} ${isIslandDetailExpanded ? 'kids-island-detail--expanded' : ''} ${isWorldLocked
          ? 'pointer-events-none opacity-0 invisible translate-y-6'
          : 'opacity-100 visible translate-y-0'}`}
      >
        <div className="kids-island-detail-inner" style={{borderColor:currentIslandDef.accentBorder}}>
          <button type="button" className="kids-island-expand"
            onClick={() => setIsIslandDetailExpanded((expanded) => !expanded)}
            aria-expanded={isIslandDetailExpanded} aria-label={isIslandDetailExpanded ? 'Ada ayrıntılarını daralt' : 'Ada ayrıntılarını göster'}>
            {isIslandDetailExpanded ? 'Daralt ⌄' : 'Detay ⌃'}
          </button>
          <div className="kids-island-eyebrow">
            <span>✦ SEÇİLİ MACERA ADASI</span>
            <span className="kids-island-state">{currentIslandDef.contentPublished?'● OYNANABİLİR':'◇ YAKINDA'}</span>
          </div>
          <div className="kids-island-heading">
            <span className="kids-island-emoji" aria-hidden="true">{currentIslandDef.emoji}</span>
            <div>
              <h2>{currentIslandDef.nameTr}</h2>
              <small>{currentIslandDef.subtitleTr}</small>
            </div>
          </div>
          <p className="kids-island-description">{currentIslandDef.descriptionTr}</p>
          {currentIslandDef.contentPublished ? (
            <>
              <div className="kids-island-meter-label">
                <span>{focusedCountText}</span>
                <strong>%{focusedPercent}</strong>
              </div>
              <div className="kids-island-meter" role="progressbar" aria-label="Seçili adanın öğrenme ilerlemesi"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={focusedPercent}>
                <div style={{width:String(focusedPercent)+'%'}}/>
              </div>
              <button className="kids-island-action" onClick={()=>handleOpenLearningPath(focusedIsland)}>
                <span>{focusedIsland==='listening_forest'?'📖 Hikâye Ormanı’na Gir':focusedIsland==='story_castle'?'🏰 Uyanan Meydan’a Gir':
                  gardenOverall?.completedWorlds===6?'🌸 Yeniden Keşfet':'✨ Kelime Bahçesi’ne Gir'}</span>
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <div className="kids-island-locked" role="status">
              {currentIslandDef.isUnlockedDefault?'✨ Bu adanın maceraları hazırlanıyor.':
                '🔒 Bu adanın maceraları henüz açılmadı.'}
            </div>
          )}
        </div>
      </aside>

      {/* 4. Compact island dock: preserves all six selectable camera destinations. */}
      <nav aria-label="Altı ada arasında gezin" aria-hidden={isWorldLocked} inert={isWorldLocked}
        className={`kids-world-dock ${isWorldLocked?'pointer-events-none opacity-0 invisible translate-y-6':'opacity-100 visible translate-y-0'}`}>
        {ARCHIPELAGO_ISLANDS_ORDERED.map(island=>{
          const selected=focusedIsland===island.id;
          const playable=island.contentPublished;
          const completed=playable&&(island.id==='story_castle'?plazaProgress?.completedLevels===6:gardenOverall?.completedWorlds===6);
          return <button key={island.id} type="button"
            onClick={()=>handleFocusIsland(island.id)}
            aria-pressed={selected}
            title={`${island.nameTr}: ${playable?'oynanabilir':'kilitli, yakında'}`}
            data-selected={selected}
            data-available={playable}
            className="kids-dock-island">
            <span className="kids-dock-icon" aria-hidden="true">{island.emoji}</span>
            <span className="kids-dock-copy">
              <span className="kids-dock-title">{island.nameTr}</span>
              <span className="kids-dock-status">{completed?'✓ Tamamlandı':playable?'✦ Maceraya Gir':'🔒 Yakında'}</span>
            </span>
          </button>;
        })}
      </nav>

      {/* 5. BULUT GEÇİŞ ANİMASYONU */}
      <CloudTransition
        isActive={isTransitionActive}
        onCovered={handleTransitionCovered}
        onComplete={handleTransitionComplete}
      />

      {/* 6. ÖĞRENME PATİKASI VE DERS MODALI */}
      {activeRegion==='word_garden'&&(
        <LearningPathModal
          regionId={activeRegion}
          profileId={activeProfile?.id || ''}
          playerName={activeProfile?.nickname}
          coinBalance={coinBalance}
          onOpenPassport={()=>{handleCloseLearningPath();setIsPassportOpen(true);}}
          englishLevel={activeProfile?.englishLevel || 'Pre-A1'}
          gradeLevel={activeProfile?.gradeLevel ?? null}
          onClose={handleCloseLearningPath}
          onRegionCompleted={handleRegionCompleted}
          onColorProgressSaved={() => { if (activeProfile) void loadProfileAndProgress(activeProfile); }}
          onNumberProgressSaved={() => { if (activeProfile) void loadProfileAndProgress(activeProfile); }}
          onFoodProgressSaved={() => { if (activeProfile) void loadProfileAndProgress(activeProfile); }}
          onFamilyProgressSaved={() => { if (activeProfile) void loadProfileAndProgress(activeProfile); }}
          onTempleProgressSaved={() => { if (activeProfile) void loadProfileAndProgress(activeProfile); }}
          initialCompletedLevels={wordGardenCompletedLevels}
          initialStarsByLevel={wordGardenStarsByLevel}
          onProgressUpdate={async (_completed, _total, levelOrder, starsEarned, telemetry) => {
            if (!activeProfile) throw new Error('Aktif çocuk profili bulunamadı.');
            const result = await saveWordGardenLevelCompletion(
              getProgressRepository(), activeProfile.id, levelOrder, starsEarned, telemetry
            );
            setWordGardenCompletedLevels(result.completedLevels);
            setWordGardenStarsByLevel(result.starsByLevel);
            setTotalStars(await getProgressRepository().getTotalStars(activeProfile.id));
            await loadProfileAndProgress(activeProfile);
          }}
        />
      )}

      {activeRegion==='story_castle'&&activeProfile&&
        <SentencePlazaAdventure key={activeProfile.id} profileId={activeProfile.id}
          gradeLevel={activeProfile.gradeLevel??null}
          englishLevel={activeProfile.englishLevel??'Pre-A1'}
          onBack={handleCloseLearningPath}
          onSaved={()=>void loadProfileAndProgress(activeProfile)}/>}
      {activeRegion==='listening_forest'&&activeProfile&&
        <StoryForestHome key={activeProfile.id} profileId={activeProfile.id}
          gradeLevel={activeProfile.gradeLevel??null}
          englishLevel={activeProfile.englishLevel??'Pre-A1'}
          onBack={handleCloseLearningPath}
          onSaved={()=>void loadProfileAndProgress(activeProfile)}/>}
      {isAudioSettingsOpen&&<AudioSettingsPanel onClose={()=>setIsAudioSettingsOpen(false)}/>}

      {isPassportOpen&&activeProfile&&<KidsPassport
        key={activeProfile.id}
        profileId={activeProfile.id}
        nickname={activeProfile.nickname}
        avatarEmoji={currentAvatar.emoji}
        gradeLevel={activeProfile.gradeLevel??null}
        englishLevel={activeProfile.englishLevel??'Pre-A1'}
        onClose={()=>{setIsPassportOpen(false);void loadProfileAndProgress(activeProfile);}}
        onChanged={()=>void loadProfileAndProgress(activeProfile)}
      />}

      {/* 7. TOAST MESAJI */}
      {toastMessage && (
        <div className="absolute bottom-24 md:bottom-28 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/60 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl shadow-black/50 animate-bounce pointer-events-none text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}

      {isModeGateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Oyun yolunu seç">
          <KidsWelcomeGate
            existingProfile={activeProfile}
            onContinue={() => setIsModeGateOpen(false)}
            onCreateProfile={handleFirstProfile}
            onOpenParent={() => setIsParentGateOpen(true)}
          />
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
          onSyncCompleted={() => { void handleCloudProfilesChanged(); }}
        />
      )}
    </div>
  );
}
