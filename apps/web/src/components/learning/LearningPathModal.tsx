'use client';

import React, { useEffect, useState } from 'react';
import { WordGardenDistrictMap } from './WordGardenDistrictMap';
import { AnimalMeadowAdventure } from './activities/AnimalMeadowAdventure';
import { ColorGroveAdventure } from './activities/ColorGroveAdventure';
import { getProgressRepository } from '@/lib/progress';
import { getWordGardenProgress, type WordGardenProgressSnapshot, type AnimalMissionTelemetry } from '@/lib/progress/wordGardenProgress';
import { getColorGroveProgress, saveColorGroveMission, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';

interface LearningPathModalProps {
  regionId: string;
  onClose: () => void;
  onRegionCompleted: () => void;
  onColorProgressSaved?: () => void;
  profileId: string;
  englishLevel?: 'Pre-A1' | 'A1' | 'A2';
  initialCompletedLevels?: number;
  initialStarsByLevel?: Record<number, number>;
  onProgressUpdate: (completed: number, total: number, levelOrder: number, starsEarned: number, telemetry?: AnimalMissionTelemetry) => Promise<void>;
}

type District = 'overview' | 'animals' | 'colors';

/**
 * One active district at a time; the old static animal activities are no longer
 * bundled into the Kids route. Both adventures retain their original persisted
 * profile and level keys, so upgrades do not reset previously earned stars.
 */
export const LearningPathModal: React.FC<LearningPathModalProps> = ({
  profileId,
  englishLevel = 'Pre-A1',
  onClose,
  onRegionCompleted,
  onColorProgressSaved,
  initialCompletedLevels = 0,
  initialStarsByLevel = {},
  onProgressUpdate
}) => {
  const [district, setDistrict] = useState<District>('overview');
  const [animals, setAnimals] = useState<WordGardenProgressSnapshot>(() => ({
    completedLevels: initialCompletedLevels, totalLevels: 5,
    progressPercent: initialCompletedLevels * 20,
    starsByLevel: initialStarsByLevel,
    totalStars: Object.values(initialStarsByLevel).reduce((sum, stars) => sum + stars, 0),
    legacyCompleted: false
  }));
  const [colors, setColors] = useState<ColorGroveProgress>({
    completedLevels: 0, totalLevels: 3, starsByLevel: {}
  });
  const [colorError, setColorError] = useState(false);
  const [animalError, setAnimalError] = useState(false);

  useEffect(() => {
    let active = true;
    setAnimalError(false);
    setColorError(false);
    const repo = getProgressRepository();
    void getWordGardenProgress(repo, profileId)
      .then(snapshot => { if (active) setAnimals(snapshot); })
      .catch(error => { console.error('Hayvan Çayırı ilerlemesi okunamadı:', error); if (active) setAnimalError(true); });
    void getColorGroveProgress(repo, profileId)
      .then(snapshot => { if (active) setColors(snapshot); })
      .catch(error => { console.error('Renk Korusu ilerlemesi okunamadı:', error); if (active) setColorError(true); });
    return () => { active = false; };
  }, [profileId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (district === 'overview') onClose();
      else setDistrict('overview');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [district, onClose]);

  if (district === 'animals') {
    return animalError ? (
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Hayvan Çayırı ilerlemesi açılamadı. Mevcut kayıtlarını silmeden yeniden dene.</p>
        <button onClick={() => setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950">Bölgelere Dön</button>
      </div>
    ) : <AnimalMeadowAdventure
      key={profileId}
      profileId={profileId}
      englishLevel={englishLevel}
      progress={animals}
      onBack={() => setDistrict('overview')}
      onAllCompleted={() => {
        onRegionCompleted();
        setDistrict('overview');
      }}
      onSave={async (mission, stars, telemetry) => {
        await onProgressUpdate(animals.completedLevels, animals.totalLevels, mission, stars, telemetry);
        const updated = await getWordGardenProgress(getProgressRepository(), profileId);
        setAnimals(updated);
        return updated;
      }}
    />;
  }

  if (district === 'colors') {
    return <ColorGroveAdventure
      key={profileId}
      profileId={profileId}
      englishLevel={englishLevel}
      progress={colors}
      onBack={() => setDistrict('overview')}
      onSave={async (mission, mistakes, correct, duration, answers, sessionId) => {
        const updated = await saveColorGroveMission(getProgressRepository(), profileId, mission, mistakes, correct, duration, answers, sessionId);
        setColors(updated);
        onColorProgressSaved?.();
      }}
    />;
  }

  return <WordGardenDistrictMap
    completedLevels={animals.completedLevels}
    totalLevels={animals.totalLevels}
    onEnterAnimals={() => setDistrict('animals')}
    colorsUnlocked={animals.completedLevels === animals.totalLevels}
    colorCompleted={colors.completedLevels}
    colorsAvailable={!colorError}
    onEnterColors={() => setDistrict('colors')}
    onBack={onClose}
  />;
};
