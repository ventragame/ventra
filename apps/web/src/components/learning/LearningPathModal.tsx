'use client';

import React, { useEffect, useState } from 'react';
import { WordGardenDistrictMap } from './WordGardenDistrictMap';
import './word-garden-world-art.css';
import {soundService} from '@/lib/audio/SoundService';
import {musicSceneForDistrict} from '@/lib/audio/MusicDirector';
import {FirstPlayGuide} from './FirstPlayGuide';
import type {TutorialWorld} from '@/lib/learning/firstPlayTutorial';
import { AnimalMeadowAdventure } from './activities/AnimalMeadowAdventure';
import { ColorGroveAdventure } from './activities/ColorGroveAdventure';
import { NumberValleyAdventure } from './activities/NumberValleyAdventure';
import { FoodMarketAdventure } from './activities/FoodMarketAdventure';
import { FamilyVillageAdventure } from './activities/FamilyVillageAdventure';
import { TempleAdventure } from './activities/TempleAdventure';
import { getProgressRepository } from '@/lib/progress';
import { getWordGardenProgress, type WordGardenProgressSnapshot, type AnimalMissionTelemetry } from '@/lib/progress/wordGardenProgress';
import { getColorGroveProgress, saveColorGroveMission, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';
import {getNumberValleyProgress,saveNumberValleyMission,type NumberValleyProgress} from '@/lib/progress/numberValleyProgress';
import {accessibleNumberLevels} from '@/lib/progress/gardenOverallProgress';
import type {NumberAnswerEvidence,FoodAnswerEvidence,FamilyAnswerEvidence,TempleAnswerEvidence} from '@ventra/shared';
import {getTempleProgress,saveTempleMission,type TempleProgress} from '@/lib/progress/templeProgress';
import {getFamilyVillageProgress,saveFamilyVillageMission,type FamilyVillageProgress} from '@/lib/progress/familyVillageProgress';
import {getFoodMarketProgress,saveFoodMarketMission,type FoodMarketProgress} from '@/lib/progress/foodMarketProgress';

interface LearningPathModalProps {
  regionId: string;
  onClose: () => void;
  onRegionCompleted: () => void;
  onColorProgressSaved?: () => void;
  onNumberProgressSaved?: () => void;
  onFoodProgressSaved?: () => void;
  onFamilyProgressSaved?: () => void;
  onTempleProgressSaved?: () => void;
  profileId: string;
  playerName?:string;
  coinBalance?:number|null;
  onOpenPassport?:()=>void;
  englishLevel?: 'Pre-A1' | 'A1' | 'A2';
  gradeLevel?:number|null;
  initialCompletedLevels?: number;
  initialStarsByLevel?: Record<number, number>;
  onProgressUpdate: (completed: number, total: number, levelOrder: number, starsEarned: number, telemetry?: AnimalMissionTelemetry) => Promise<void>;
}

type District = 'overview' | 'animals' | 'colors' | 'numbers' | 'food' | 'family' | 'sanctuary';

/**
 * One active district at a time; the old static animal activities are no longer
 * bundled into the Kids route. Both adventures retain their original persisted
 * profile and level keys, so upgrades do not reset previously earned stars.
 */
export const LearningPathModal: React.FC<LearningPathModalProps> = ({
  profileId,
  playerName,
  coinBalance,
  onOpenPassport,
  englishLevel = 'Pre-A1',
  gradeLevel = null,
  onClose,
  onRegionCompleted,
  onColorProgressSaved,
  onNumberProgressSaved,
  onFoodProgressSaved,
  onFamilyProgressSaved,
  onTempleProgressSaved,
  initialCompletedLevels = 0,
  initialStarsByLevel = {},
  onProgressUpdate
}) => {
  const [district, setDistrict] = useState<District>('overview');
  useEffect(()=>{
    soundService.setMusicScene(musicSceneForDistrict(district));
    return ()=>soundService.setMusicScene('archipelago');
  },[district]);
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
  const [numbers,setNumbers] = useState<NumberValleyProgress>({completedLevels:0,totalLevels:15,starsByLevel:{},completedByBand:{ones:0,tens:0,hundreds:0}});
  const [food,setFood]=useState<FoodMarketProgress>({completedLevels:0,totalLevels:15,completedByAisle:{orchard:0,bakery:0,cafe:0},starsByLevel:{}});
  const [family,setFamily]=useState<FamilyVillageProgress>({completedLevels:0,totalLevels:20,completedByDistrict:{family:0,rooms:0,objects:0,routines:0},starsByLevel:{}});
  const [temple,setTemple]=useState<TempleProgress>({completedLevels:0,totalLevels:25,completedByChamber:{rune:0,echo:0,feast:0,home:0,crown:0},starsByLevel:{}});
  const [templeError,setTempleError]=useState(false);
  const [templeLoaded,setTempleLoaded]=useState(false);
  const [familyError,setFamilyError]=useState(false);
  const [familyLoaded,setFamilyLoaded]=useState(false);
  const [foodError,setFoodError]=useState(false);
  const [foodLoaded,setFoodLoaded]=useState(false);
  const [numberError,setNumberError]=useState(false);
  const [numberLoaded,setNumberLoaded]=useState(false);
  const [colorError, setColorError] = useState(false);
  const [animalLoaded,setAnimalLoaded]=useState(false);
  const [colorLoaded,setColorLoaded]=useState(false);
  const [animalError, setAnimalError] = useState(false);

  useEffect(() => {
    let active = true;
    setAnimalError(false);
    setColorError(false);
    setAnimalLoaded(false);
    setColorLoaded(false);
    setNumberError(false);
    setNumberLoaded(false);
    setFoodError(false);setFoodLoaded(false);
    setFamilyError(false);setFamilyLoaded(false);
    setTempleError(false);setTempleLoaded(false);
    const repo = getProgressRepository();
    void getWordGardenProgress(repo, profileId)
      .then(snapshot => { if (active) {setAnimals(snapshot);setAnimalLoaded(true);} })
      .catch(error => { console.error('Hayvan Çayırı ilerlemesi okunamadı:', error); if (active) {setAnimalError(true);setAnimalLoaded(true);} });
    void getColorGroveProgress(repo, profileId)
      .then(snapshot => { if (active) {setColors(snapshot);setColorLoaded(true);} })
      .catch(error => { console.error('Renk Korusu ilerlemesi okunamadı:', error); if (active) {setColorError(true);setColorLoaded(true);} });
    void getNumberValleyProgress(repo,profileId)
      .then(snapshot=>{if(active){setNumbers(snapshot);setNumberLoaded(true);}})
      .catch(error=>{console.error('Sayı Vadisi ilerlemesi okunamadı:',error);
        if(active){setNumberError(true);setNumberLoaded(true);}});
    void getFoodMarketProgress(repo,profileId).then(value=>{if(active){setFood(value);setFoodLoaded(true);}})
      .catch(err=>{console.error('Lezzet Pazarı ilerlemesi açılamadı:',err);
        if(active){setFoodError(true);setFoodLoaded(true);}});
    void getFamilyVillageProgress(repo,profileId).then(value=>{if(active){setFamily(value);setFamilyLoaded(true);}})
      .catch(err=>{console.error('Aile Köyü ilerlemesi açılamadı',err);
        if(active){setFamilyError(true);setFamilyLoaded(true);}});
    void getTempleProgress(repo,profileId).then(value=>{if(active){setTemple(value);setTempleLoaded(true);}})
      .catch(err=>{console.error('Keşif Tapınağı ilerlemesi okunamadı:',err);if(active){setTempleError(true);setTempleLoaded(true);}});
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

  const withFirstPlay=(world:TutorialWorld,ready:boolean,hasPlayed:boolean,game:React.ReactNode)=><>
    {game}<FirstPlayGuide key={profileId+':'+world} world={world} profileId={profileId} ready={ready} hasPlayed={hasPlayed}/>
  </>;

  if (district === 'animals') {
    return animalError ? (
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Hayvan Çayırı ilerlemesi açılamadı. Mevcut kayıtlarını silmeden yeniden dene.</p>
        <button onClick={() => setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950">Bölgelere Dön</button>
      </div>
    ) : withFirstPlay('animals',animalLoaded&&!animalError,animals.completedLevels>0,<AnimalMeadowAdventure
      key={profileId}
      profileId={profileId}
      englishLevel={englishLevel}
      gradeLevel={gradeLevel}
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
    />);
  }

  if (district === 'numbers') {
    return numberError ? (
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Sayı Vadisi ilerlemesi açılamadı. Kayıtlarını silmeden tekrar deneyebilirsin.</p>
        <button onClick={()=>setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950">Bölgelere Dön</button>
      </div>
    ) : withFirstPlay('numbers',numberLoaded&&!numberError,numbers.completedLevels>0,<NumberValleyAdventure
      key={profileId}
      profileId={profileId}
      englishLevel={englishLevel}
      gradeLevel={gradeLevel}
      progress={numbers}
      onBack={()=>setDistrict('overview')}
      onSave={async (mission:number,mistakes:number,correct:number,duration:number,answers:NumberAnswerEvidence[],sessionId:string,band)=>{
        const updated=await saveNumberValleyMission(getProgressRepository(),profileId,mission,mistakes,correct,duration,answers,sessionId,band);
        setNumbers(updated);
        onNumberProgressSaved?.();
      }}
    />);
  }

  if(district==='sanctuary'){
    return templeError?(
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Keşif Tapınağı ilerlemesi okunamadı. Kayıtların silinmedi.</p>
        <button onClick={()=>setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-slate-950">Bölgelere Dön</button>
      </div>
    ):withFirstPlay('sanctuary',templeLoaded&&!templeError,temple.completedLevels>0,<TempleAdventure
      key={profileId} profileId={profileId} gradeLevel={gradeLevel} englishLevel={englishLevel}
      progress={temple} onBack={()=>setDistrict('overview')}
      onSave={async (room,stage,mistakes,duration,answers:TempleAnswerEvidence[],sessionId)=>{
        const updated=await saveTempleMission(getProgressRepository(),profileId,room,stage,mistakes,duration,answers,sessionId);
        setTemple(updated);onTempleProgressSaved?.();
      }}
    />);
  }

  if(district==='family'){
    return familyError?(
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Aile Köyü ilerlemesi okunamadı. Oyun kayıtlarını silmeden yeniden deneyebilirsin.</p>
        <button onClick={()=>setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-slate-950">Bölgelere Dön</button>
      </div>
    ):withFirstPlay('family',familyLoaded&&!familyError,family.completedLevels>0,<FamilyVillageAdventure
      key={profileId} profileId={profileId} gradeLevel={gradeLevel} englishLevel={englishLevel}
      progress={family} onBack={()=>setDistrict('overview')}
      onSave={async (part,stage,mistakes,duration,answers:FamilyAnswerEvidence[],sessionId)=>{
        const updated=await saveFamilyVillageMission(getProgressRepository(),profileId,part,stage,mistakes,duration,answers,sessionId);
        setFamily(updated);onFamilyProgressSaved?.();
      }}
    />);
  }

  if(district==='food'){
    return foodError?(
      <div role="alert" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p>Lezzet Pazarı ilerlemesi okunamadı. Oyun kayıtlarını silmeden yeniden deneyebilirsin.</p>
        <button onClick={()=>setDistrict('overview')} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-slate-950">Bölgelere Dön</button>
      </div>
    ):withFirstPlay('food',foodLoaded&&!foodError,food.completedLevels>0,<FoodMarketAdventure
      key={profileId} profileId={profileId} gradeLevel={gradeLevel} englishLevel={englishLevel}
      progress={food} onBack={()=>setDistrict('overview')}
      onSave={async (aisle,stage,mistakes,duration,answers:FoodAnswerEvidence[],sessionId)=>{
        const updated=await saveFoodMarketMission(getProgressRepository(),profileId,aisle,stage,mistakes,duration,answers,sessionId);
        setFood(updated);onFoodProgressSaved?.();
      }}
    />);
  }

  if (district === 'colors') {
    return withFirstPlay('colors',colorLoaded&&!colorError,colors.completedLevels>0,<ColorGroveAdventure
      key={profileId}
      profileId={profileId}
      englishLevel={englishLevel}
      gradeLevel={gradeLevel}
      progress={colors}
      onBack={() => setDistrict('overview')}
      onSave={async (mission, mistakes, correct, duration, answers, sessionId) => {
        const updated = await saveColorGroveMission(getProgressRepository(), profileId, mission, mistakes, correct, duration, answers, sessionId);
        setColors(updated);
        onColorProgressSaved?.();
      }}
    />);
  }

  return <WordGardenDistrictMap
    playerName={playerName}
    coinBalance={coinBalance}
    onOpenPassport={onOpenPassport}
    starsByDistrict={{
      animals:animals.totalStars,
      colors:Object.values(colors.starsByLevel).reduce((n,x)=>n+x,0),
      numbers:Object.values(numbers.starsByLevel).reduce((n,x)=>n+x,0),
      food:Object.values(food.starsByLevel).reduce((n,x)=>n+x,0),
      family:Object.values(family.starsByLevel).reduce((n,x)=>n+x,0),
      sanctuary:Object.values(temple.starsByLevel).reduce((n,x)=>n+x,0)
    }}
    completedLevels={animals.completedLevels}
    totalLevels={animals.totalLevels}
    onEnterAnimals={() => setDistrict('animals')}
    colorsUnlocked={animals.completedLevels === animals.totalLevels}
    colorCompleted={colors.completedLevels}
    numberCompleted={numbers.completedLevels}
    numberTotal={accessibleNumberLevels(gradeLevel,englishLevel)}
    numbersUnlocked={!colorError && colors.completedLevels===colors.totalLevels}
    numbersAvailable={numberLoaded&&!numberError}
    onEnterNumbers={()=>setDistrict('numbers')}
    foodCompleted={food.completedLevels}
    foodTotal={food.totalLevels}
    foodUnlocked={true}
    foodAvailable={foodLoaded&&!foodError}
    foodError={foodError}
    onEnterFood={()=>setDistrict('food')}
    familyCompleted={family.completedLevels}
    familyTotal={family.totalLevels}
    familyUnlocked={true}
    familyAvailable={familyLoaded&&!familyError}
    familyError={familyError}
    onEnterFamily={()=>setDistrict('family')}
    templeCompleted={temple.completedLevels}
    templeTotal={temple.totalLevels}
    templeUnlocked={true}
    templeAvailable={templeLoaded&&!templeError}
    templeError={templeError}
    onEnterTemple={()=>setDistrict('sanctuary')}
    gradeLevel={gradeLevel}
    englishLevel={englishLevel}
    colorsAvailable={!colorError}
    onEnterColors={() => setDistrict('colors')}
    onBack={onClose}
  />;
};
