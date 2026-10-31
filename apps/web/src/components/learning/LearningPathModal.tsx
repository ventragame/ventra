'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  GameLevelNode,
  LearningStepType,
  WORD_GARDEN_LEVELS
} from '@ventra/shared';
import { GameLevelMap } from './GameLevelMap';
import { WordGardenDistrictMap } from './WordGardenDistrictMap';
import { ColorGroveAdventure } from './activities/ColorGroveAdventure';
import { getColorGroveProgress, saveColorGroveMission, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';
import { getProgressRepository } from '@/lib/progress';
import { ExploreActivity } from './activities/ExploreActivity';
import { MatchActivity } from './activities/MatchActivity';
import { ListenActivity } from './activities/ListenActivity';
import { ApplyActivity } from './activities/ApplyActivity';
import { MiniQuestActivity } from './activities/MiniQuestActivity';
import { RewardModal } from './RewardModal';
import { soundService } from '@/lib/audio/SoundService';
import { EventBus } from '@/lib/game/EventBus';

interface LearningPathModalProps {
  regionId: string;
  onClose: () => void;
  onRegionCompleted: () => void;
  profileId: string;
  englishLevel?: 'Pre-A1' | 'A1' | 'A2';
  initialCompletedLevels?: number;
  initialStarsByLevel?: Record<number, number>;
  onProgressUpdate: (completed: number, total: number, levelOrder: number, starsEarned: number) => Promise<void>;
}

/**
 * Başlangıç seviyelerini profile/IndexedDB durumuna göre yapılandırır
 */
function initializeLevels(initialCompleted: number, starsByLevel: Record<number, number>): GameLevelNode[] {
  return WORD_GARDEN_LEVELS.map((lvl, index) => {
    if (index < initialCompleted) {
      return { ...lvl, status: 'completed' as const, starsEarned: starsByLevel[index + 1] || 0 };
    } else if (index === initialCompleted) {
      return { ...lvl, status: 'available' as const, starsEarned: 0 };
    } else {
      return { ...lvl, status: 'locked' as const, starsEarned: 0 };
    }
  });
}

export const LearningPathModal: React.FC<LearningPathModalProps> = ({
  regionId,
  profileId,
  englishLevel = 'Pre-A1',
  onClose,
  onRegionCompleted,
  initialCompletedLevels = 0,
  initialStarsByLevel = {},
  onProgressUpdate
}) => {
  const [levels, setLevels] = useState<GameLevelNode[]>(() =>
    initializeLevels(initialCompletedLevels, initialStarsByLevel)
  );
  const [showDistrictOverview, setShowDistrictOverview] = useState(true);
  const [showColorGrove, setShowColorGrove] = useState(false);
  const [colorProgress, setColorProgress] = useState<ColorGroveProgress>({ completedLevels: 0, totalLevels: 3, starsByLevel: {} });
  const [colorProgressError, setColorProgressError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [activeStep, setActiveStep] = useState<LearningStepType | null>(null);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundService.getMuted());

  // Rehydrate when the active profile finishes loading or is changed.
  useEffect(() => {
    setLevels(initializeLevels(initialCompletedLevels, initialStarsByLevel));
  }, [initialCompletedLevels, initialStarsByLevel]);

  useEffect(() => {
    let active = true;
    setColorProgressError(false);
    getColorGroveProgress(getProgressRepository(), profileId)
      .then((result) => { if (active) setColorProgress(result); })
      .catch((error) => { console.error(error); if (active) setColorProgressError(true); });
    return () => { active = false; };
  }, [profileId]);

  // Global Mute durumunu dinle ve senkronize et
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

  // Klavye Kontrolleri (Escape tuşu ile önce etkinliği, sonra haritayı kapat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showReward) {
          handleReturnToMap();
        } else if (activeStep) {
          soundService.playSfx('tap');
          setActiveStep(null);
        } else if (showColorGrove) {
          setShowColorGrove(false);
        } else if (!showDistrictOverview) {
          setShowDistrictOverview(true);
        } else {
          soundService.playSfx('whoosh');
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStep, showReward, showDistrictOverview, showColorGrove, onClose]);

  const handleNodeClick = (node: GameLevelNode) => {
    if (node.status === 'locked') {
      soundService.playSfx('gentle_retry', 0.5);
      return;
    }
    soundService.playSfx('tap');
    setSaveError(null);
    setActiveStep(node.type);
  };

  const handleActivityComplete = async (stepType: LearningStepType, stars: number) => {
    if (savingRef.current) return;
    const current = levels.find((level) => level.type === stepType);
    if (!current || current.status === 'locked') return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    const updatedLevels = levels.map((level) => {
      if (level.type !== stepType) return level;
      return {
        ...level,
        status: 'completed' as const,
        starsEarned: Math.max(level.starsEarned || 0, stars)
      };
    });

    const currentIndex = updatedLevels.findIndex((level) => level.type === stepType);
    if (currentIndex + 1 < updatedLevels.length && updatedLevels[currentIndex + 1].status === 'locked') {
      updatedLevels[currentIndex + 1] = {
        ...updatedLevels[currentIndex + 1],
        status: 'available' as const
      };
    }
    const completed = updatedLevels.filter((level) => level.status === 'completed').length;

    try {
      // Persist before confirming progression. A failed write must never look completed.
      await onProgressUpdate(completed, updatedLevels.length, current.order, stars);
      setLevels(updatedLevels);
      setActiveStep(null);
      soundService.playSfx('correct');
      EventBus.emit('UPDATE_ISLAND_PROGRESS', {
        islandId: 'word_garden',
        completed,
        total: updatedLevels.length
      });
      if (completed === updatedLevels.length) setShowReward(true);
    } catch (error) {
      console.error('Kelime Bahçesi seviye kaydı başarısız:', error);
      setSaveError('İlerleme kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleReturnToMap = () => {
    setShowReward(false);
    onRegionCompleted();
    onClose();
  };

  const handleToggleMute = () => {
    const nextMuted = soundService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundService.playSfx('tap');
    }
  };

  const totalStars = levels.reduce((acc, l) => acc + (l.starsEarned || 0), 0);

  // 1. Ödül Modalı
  if (showReward) {
    return <RewardModal onReturnToMap={handleReturnToMap} />;
  }

  // 2. Bir Seviye/Aktivite Açıkken: Aktivite Ekranı + Üst Çubuk
  if (activeStep) {
    const currentLevel = levels.find((l) => l.type === activeStep);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-activity-title"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="fixed inset-0 z-40 bg-slate-950/92 backdrop-blur-md flex flex-col justify-between animate-fadeIn select-none"
      >
        {/* Üst Çubuk */}
        <header className="px-4 py-3 md:px-6 md:py-4 border-b border-emerald-900/40 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundService.playSfx('tap');
                setActiveStep(null);
              }}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shadow-md"
              title="Seviye Haritasına Dön"
              aria-label="Seviye Haritasına Dön"
            >
              ←
            </button>
            <div>
              <h1
                id="active-activity-title"
                className="text-base md:text-lg font-bold text-white flex items-center gap-2"
              >
                <span>🌸 Kelime Bahçesi</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                  {currentLevel?.title || 'Aktivite'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">Hayvanlar • Animals</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Mute Senkron Düğmesi */}
            <button
              onClick={handleToggleMute}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-sm md:text-base text-slate-300 cursor-pointer shadow-md transition-colors"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Yıldız Göstergesi */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
              <span className="text-amber-400">⭐</span>
              <span className="text-xs font-bold text-white">
                {totalStars} / 15
              </span>
            </div>
          </div>
        </header>

        {isSaving && (
          <div role="status" className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 border border-sky-500 px-4 py-2 text-sky-200 text-sm">
            İlerleme kaydediliyor...
          </div>
        )}
        {saveError && (
          <div role="alert" className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] rounded-xl bg-rose-950 border border-rose-400 px-4 py-2 text-white text-sm">
            {saveError}
          </div>
        )}
        {/* Ana Aktivite Gövdesi */}
        <main className="flex-1 overflow-y-auto relative flex flex-col justify-center">
          {activeStep === 'explore' && (
            <ExploreActivity
              onComplete={(stars) => handleActivityComplete('explore', stars)}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'match' && (
            <MatchActivity
              onComplete={(stars) => handleActivityComplete('match', stars)}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'listen' && (
            <ListenActivity
              onComplete={(stars) => handleActivityComplete('listen', stars)}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'apply' && (
            <ApplyActivity
              onComplete={(stars) => handleActivityComplete('apply', stars)}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'mini_quest' && (
            <MiniQuestActivity
              onComplete={(stars) => handleActivityComplete('mini_quest', stars)}
              onClose={() => setActiveStep(null)}
            />
          )}
        </main>
      </div>
    );
  }

  if (showColorGrove) {
    return <ColorGroveAdventure profileId={profileId} englishLevel={englishLevel} progress={colorProgress} onBack={() => setShowColorGrove(false)}
      onSave={async (mission, mistakes, correct, duration, answers) => {
        const updated = await saveColorGroveMission(getProgressRepository(), profileId, mission, mistakes, correct, duration, answers);
        setColorProgress(updated);
      }} />;
  }

  // Kelime Bahçesi artık kendi keşif bölgelerine sahip bir oyun alanı.
  // Yalnızca tamamlanmış pedagojik içerik oynanabilir.
  if (showDistrictOverview) {
    return (
      <WordGardenDistrictMap
        completedLevels={levels.filter((level) => level.status === 'completed').length}
        totalLevels={levels.length}
        onEnterAnimals={() => setShowDistrictOverview(false)}
        colorsUnlocked={levels.every((level) => level.status === 'completed')}
        colorCompleted={colorProgress.completedLevels}
        colorsAvailable={!colorProgressError}
        onEnterColors={() => setShowColorGrove(true)}
        onBack={onClose}
      />
    );
  }

  // Bölge seçildikten sonra mevcut beş aşamalı öğrenme rotası korunur.
  return (
    <GameLevelMap
      levels={levels}
      onSelectNode={handleNodeClick}
      onBack={() => setShowDistrictOverview(true)}
      isMuted={isMuted}
      onToggleMute={handleToggleMute}
    />
  );
};
