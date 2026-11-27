
'use client';
import React,{useCallback,useEffect,useState} from 'react';
import type {ForestPlacement} from '@/lib/learning/storyForestEngine';
import {SEQUENCE_STORIES} from '@/lib/learning/storySequenceEngine';
import {StoryForestAdventure} from './StoryForestAdventure';
import {StorySequenceAdventure} from './StorySequenceAdventure';
import {StoryDetectiveAdventure} from './StoryDetectiveAdventure';
import {StoryForestScenery,StoryForestActor,STORY_FOREST_PREMIUM_COVER} from './StoryForestArt';
import {StorySequenceFrame} from './StorySequenceFrame';
import {getProgressRepository} from '@/lib/progress';
import {getStoryForestProgress,type ForestProgress} from '@/lib/progress/storyForestProgress';
import {getSequenceProgress,type SequenceProgress} from '@/lib/progress/storySequenceProgress';
import {getDetectiveProgress,type DetectiveProgress} from '@/lib/progress/storyDetectiveProgress';
import {soundService} from '@/lib/audio/SoundService';
import './story-sequence.css';
import './story-forest-home.css';
import './premium-story-art.css';
import {IslandHome} from '../island/IslandHome';
import {gradeLevelLabel} from '@/lib/learning/gradeLabel';

type Game='home'|'discover'|'sequence'|'detective';
interface Props{
 initialGame?:Game;
 profileId:string;
 gradeLevel:number|null;
 englishLevel:ForestPlacement;
 onBack:()=>void;
 onSaved:()=>void;
}
const EMPTY:ForestProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};
const DETECTIVE_EMPTY:DetectiveProgress={completedLevels:0,totalLevels:6,starsByLevel:{},playCountByLevel:{}};
export function StoryForestHome({profileId,gradeLevel,englishLevel,onBack,onSaved,initialGame='home'}:Props){
 const [game,setGame]=useState<Game>(initialGame);
 const [discover,setDiscover]=useState<ForestProgress>(EMPTY);
 const [sequence,setSequence]=useState<SequenceProgress>(EMPTY);
 const [detective,setDetective]=useState<DetectiveProgress>(DETECTIVE_EMPTY);
 const [loadError,setLoadError]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [loadAttempt,setLoadAttempt]=useState(0);
 const refresh=useCallback(async()=>{
  const [d,s,x]=await Promise.all([
   getStoryForestProgress(getProgressRepository(),profileId),
   getSequenceProgress(getProgressRepository(),profileId),
   getDetectiveProgress(getProgressRepository(),profileId)
  ]);
  setDiscover(d);setSequence(s);setDetective(x);setLoadError('');
 },[profileId]);
 useEffect(()=>{
  let active=true;setLoadError('');
  Promise.all([
   getStoryForestProgress(getProgressRepository(),profileId),
   getSequenceProgress(getProgressRepository(),profileId),
   getDetectiveProgress(getProgressRepository(),profileId)
  ]).then(([d,s,x])=>{if(active){setDiscover(d);setSequence(s);setDetective(x);setLoaded(true);}})
  .catch(error=>{console.error('[StoryForestHome] progress',error);
   if(active)setLoadError('İlerleme okunamadı.');});
  return()=>{active=false;};
 },[profileId,loadAttempt]);
 const back=()=>{soundService.cancelSpeech();setGame('home');void refresh().catch(()=>setLoadError('İlerleme okunamadı.'));};
 const saved=()=>{void refresh().catch(()=>setLoadError('İlerleme okunamadı.'));onSaved();};
 if(game==='discover')return <StoryForestAdventure profileId={profileId} gradeLevel={gradeLevel}
   englishLevel={englishLevel} onBack={back} onSaved={saved}/>;
 if(game==='sequence')return <StorySequenceAdventure profileId={profileId} gradeLevel={gradeLevel}
   englishLevel={englishLevel} onBack={back} onSaved={saved}/>;
 if(game==='detective')return <StoryDetectiveAdventure profileId={profileId} gradeLevel={gradeLevel}
   englishLevel={englishLevel} onBack={back} onSaved={saved}/>;
 const games=[
  {id:1,game:'discover' as const,title:'Hikâyeyi Keşfet',subtitle:'Dinle, doğru resmi bul',icon:'🔊',progress:discover,
   art:<div className="sfh-card-art sfh-card-art-discover">
    <StoryForestScenery scene="meadow"/>
    <div className="sfh-character sfh-bunny"><StoryForestActor id="rabbit"/></div>
    <div className="sfh-character sfh-squirrel"><StoryForestActor id="squirrel"/></div>
   </div>},
  {id:2,game:'sequence' as const,title:'Sonra Ne Oldu?',subtitle:'Resimlerle hikâye sırala',icon:'🧩',progress:sequence,
   art:<div className="sfh-card-art"><StorySequenceFrame frame={SEQUENCE_STORIES[0].frames[4]} scene="path"/></div>},
  {id:3,game:'detective' as const,title:'Hikâye Dedektifi',subtitle:'İpuçlarını bul, gizemi çöz',icon:'🔎',progress:detective,
   art:<div className="sfh-card-art sfh-card-art-detective">
    <StoryForestScenery scene="pond"/>
    <div className="sfh-character sfh-detective-rabbit"><StoryForestActor id="rabbit"/></div>
    <div className="sfh-character sfh-detective-bird"><StoryForestActor id="bird"/></div>
   </div>}
 ];
 const played=discover.completedLevels+sequence.completedLevels+detective.completedLevels;
 return <IslandHome island="story" ariaLabel="Hikâye Ormanı oyunları"
  eyebrow="VENTRA · İNGİLİZCE HİKÂYELER" title="Hikâye Ormanı" crest="🌳" onBack={onBack}
  chips={[gradeLevelLabel(gradeLevel)+' · '+englishLevel,'★ '+(loaded?played:'…')+'/18']}
  heroArt={STORY_FOREST_PREMIUM_COVER}
  tagline="Dinle · Keşfet · Hatırla"
  guide={{src:'/assets/story-forest/premium/characters/rabbit_adventurer.webp',alt:'Maceracı tavşan'}}
  chapterNoun="Oyun" sectionTitle="Bir hikâye oyunu seç"
  progress={{done:played,total:18,noun:'hikâye'}}
  chapters={games.map(g=>({id:g.id,title:g.title,subtitle:g.subtitle,icon:g.icon,art:g.art,
   meta:g.progress.completedLevels+'/'+g.progress.totalLevels+' hikâye',
   done:g.progress.completedLevels>=g.progress.totalLevels,unlocked:true,
   resumable:g.progress.completedLevels>0&&g.progress.completedLevels<g.progress.totalLevels}))}
  onOpen={id=>{const g=games.find(x=>x.id===id);if(g)setGame(g.game);}}
  status={loadError?'error':loaded?'ready':'loading'} errorText={loadError||undefined}
  onRetry={()=>setLoadAttempt(n=>n+1)}/>;
}
