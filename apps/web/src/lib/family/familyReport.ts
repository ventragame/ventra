/**
 * Aile Paneli: one English report for a child, built only from records the
 * games already keep on this device (answers, completed levels, game log).
 * Read-only: it never writes rewards, profiles or remote data, and it never
 * includes legacy maths records (Kesir Atölyesi) — Ventra is English only.
 */
import type {ActivityLogEntry,PlayerProfile} from '@ventra/shared';
import type {IProgressRepository} from '../progress/types.ts';
import type {LearningDomain,LearningSnapshot,LearningSkill} from '../learning/adaptiveLearningEngine.ts';
import {loadLearningReport} from '../learning/learningReport.ts';
import {passportEvidence} from '../rewards/economyRepository.ts';
import {ANIMAL_MEADOW_WORDS} from '../learning/animalMissionEngine.ts';
import {COLOR_GROVE_WORDS} from '../progress/colorGroveProgress.ts';
import {MARKET_WORDS} from '../learning/foodMarketEngine.ts';
import {VILLAGE_WORDS} from '../learning/familyVillageEngine.ts';
import {TEMPLE_WORDS} from '../learning/templeEngine.ts';
import {englishNumber} from '../learning/numberValleyEngine.ts';
import {accessibleNumberLevels} from '../progress/gardenOverallProgress.ts';

export type FamilyWorld={id:string;label:string;icon:string;completed:number;total:number;
 domain?:LearningDomain;discovered?:number;due?:number};
export type FamilyWord={domain:LearningDomain;id:string;en:string;tr:string;icon:string};
export type FamilySkill={id:'recognition'|'listening'|'use';label:string;hint:string;
 attempts:number;independent:number;strong:number};
export type FamilyActivity={title:string;timestamp:string;stars?:number;icon:string};
export type FamilyNextStep={kind:'start'|'review'|'continue'|'explore'|'celebrate';title:string;detail:string};
export type FamilyReport={
 stars:number;completedMissions:number;totalMissions:number;
 wordsDiscovered:number;wordsPracticed:number;wordsStrong:number;
 independentAnswers:number;assistedAnswers:number;
 garden:FamilyWorld[];islands:FamilyWorld[];due:FamilyWord[];skills:FamilySkill[];
 recent:FamilyActivity[];lastPlayedAt:string|null;activeDays:boolean[];next:FamilyNextStep;
};

/** Garden worlds in the order a child meets them, with the learning domain each one feeds. */
const GARDEN:readonly {id:string;domain:LearningDomain}[]=[
 {id:'island_word_garden_steps',domain:'animals'},{id:'island_word_garden_colors',domain:'colors'},
 {id:'island_word_garden_numbers',domain:'numbers'},{id:'island_word_garden_food',domain:'food'},
 {id:'island_word_garden_family',domain:'family'},{id:'island_word_garden_temple',domain:'temple'}
];
export const DOMAIN_ICON:Record<LearningDomain,string>={animals:'🐾',colors:'🎨',numbers:'🔢',food:'🍎',family:'🏡',temple:'✨'};

/** The English word and its Turkish meaning, for a parent who may not speak English. */
export function describeWord(domain:LearningDomain,id:string):FamilyWord{
 const icon=DOMAIN_ICON[domain];
 if(domain==='numbers'){
  const n=Number(id);
  return Number.isInteger(n)&&n>=0&&n<=1000?{domain,id,en:englishNumber(n),tr:String(n),icon}:{domain,id,en:id,tr:id,icon};
 }
 if(domain==='temple'){
  const w=TEMPLE_WORDS.find(x=>x.id===id);
  return {domain,id,en:w?.en??id,tr:w?.tr??id,icon};
 }
 const tr=domain==='animals'?ANIMAL_MEADOW_WORDS.find(x=>x.id===id)?.tr:
  domain==='colors'?COLOR_GROVE_WORDS.find(x=>x.id===id)?.tr:
  domain==='food'?MARKET_WORDS.find(x=>x.id===id)?.tr:VILLAGE_WORDS.find(x=>x.id===id)?.tr;
 return {domain,id,en:id,tr:tr??id,icon};
}

const SKILL_GROUP:Record<LearningSkill,FamilySkill['id']>={
 recognition:'recognition',listening:'listening',
 command:'use',habitat:'use',application:'use',quantity:'use',dialogue:'use',context:'use',sentence:'use',sequence:'use'
};
/** Legacy maths prototype records are not part of an English report. */
export function isEnglishActivity(entry:Pick<ActivityLogEntry,'title'>):boolean{
 return !/^Kesir\b/i.test(entry.title)&&!/kesir/i.test(entry.title);
}
function localDay(date:Date):string{
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function buildFamilyReport(input:{
 snapshot:LearningSnapshot;
 worlds:readonly {id:string;label:string;icon:string;completed:number;total:number}[];
 evidenceStars:readonly number[];
 activity:readonly ActivityLogEntry[];
 gradeLevel:number|null;englishLevel:'Pre-A1'|'A1'|'A2';
 now:Date;
}):FamilyReport{
 const {snapshot,worlds,activity,now}=input;
 const byId=new Map(worlds.map(w=>[w.id,w]));
 const garden:FamilyWorld[]=GARDEN.flatMap(({id,domain})=>{
  const w=byId.get(id);if(!w)return [];
  // Numbers: only the paths this child can open count towards the total.
  const total=domain==='numbers'?accessibleNumberLevels(input.gradeLevel,input.englishLevel):w.total;
  const stats=snapshot.domainStats[domain];
  return [{...w,total,completed:Math.min(w.completed,total),domain,discovered:stats.discovered,due:stats.due}];
 });
 const islands=worlds.filter(w=>!GARDEN.some(g=>g.id===w.id)).map(w=>({...w}));
 const due=snapshot.vocabulary.filter(v=>v.due).map(v=>describeWord(v.domain,v.wordId));
 const skills:FamilySkill[]=[
  {id:'recognition',label:'Tanıma',hint:'Resmi ya da kelimeyi doğru eşleştirme',attempts:0,independent:0,strong:0},
  {id:'listening',label:'Dinleme',hint:'Duyduğu İngilizceyi anlama',attempts:0,independent:0,strong:0},
  {id:'use',label:'Kullanma',hint:'Yönerge, diyalog ve cümle içinde kullanma',attempts:0,independent:0,strong:0}
 ];
 for(const word of snapshot.vocabulary)for(const skill of word.skills){
  const group=skills.find(s=>s.id===SKILL_GROUP[skill.skill]);if(!group)continue;
  group.attempts+=skill.attempts;group.independent+=skill.independentCorrect;
  if(skill.status==='progressing')group.strong++;
 }
 const games=activity.filter(e=>e.type==='game'&&isEnglishActivity(e))
  .sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 const iconFor=(title:string)=>worlds.find(w=>title.startsWith(w.label))?.icon??'🎮';
 const recent=games.slice(0,8).map(e=>({title:e.title,timestamp:e.timestamp,stars:e.starsEarned,icon:iconFor(e.title)}));
 // Seven local days ending today: which of them had a finished English game.
 const played=new Set(games.map(e=>localDay(new Date(e.timestamp))));
 const activeDays=Array.from({length:7},(_,i)=>{
  const day=new Date(now);day.setDate(now.getDate()-(6-i));
  return played.has(localDay(day));
 });
 const completedMissions=worlds.reduce((n,w)=>n+(garden.find(g=>g.id===w.id)?.completed??w.completed),0);
 const totalMissions=worlds.reduce((n,w)=>n+(garden.find(g=>g.id===w.id)?.total??w.total),0);
 const nextGarden=garden.find(g=>g.completed<g.total);
 const nextIsland=islands.find(w=>w.completed<w.total);
 const next:FamilyNextStep=games.length===0&&snapshot.totalDiscovered===0&&completedMissions===0?
  {kind:'start',title:'İlk macera: Hayvan Çayırı',detail:'Birlikte açın: ilk görevde hayvanlara dokunup İngilizce adlarını dinliyor.'}:
  due.length>=3?{kind:'review',title:`Tekrar zamanı: ${due.length} kelime`,
   detail:'Bu kelimeler bir süredir çalışılmadı; oyunlar onları yeniden soracak. Aşağıdaki tekrar listesindeki kelimeleri evde birlikte de söyleyebilirsiniz.'}:
  nextGarden?{kind:'continue',title:`Sıradaki görev: ${nextGarden.label}`,
   detail:`${nextGarden.completed}/${nextGarden.total} görev tamamlandı. Kelime Bahçesi'nde kaldığı yerden devam ediyor.`}:
  nextIsland?{kind:'explore',title:`Yeni ada: ${nextIsland.label}`,
   detail:'Kelime Bahçesi tamam! Sıradaki adada cümle, hikâye ve konuşma görevleri var.'}:
  {kind:'celebrate',title:'Bütün görevler tamamlandı',detail:'Tekrar oynadıkça kelimeler daha kalıcı olur.'};
 const stars=input.evidenceStars.reduce((n,s)=>n+s,0);
 return {stars,completedMissions,totalMissions,
  wordsDiscovered:snapshot.totalDiscovered,wordsPracticed:snapshot.practicedWords,wordsStrong:snapshot.progressingWords,
  independentAnswers:snapshot.independentAnswers,assistedAnswers:snapshot.assistedAnswers,
  garden,islands,due,skills,recent,lastPlayedAt:games[0]?.timestamp??null,activeDays,next};
}

/** Loads every input for one child; read-only. */
export async function loadFamilyReport(repo:IProgressRepository,profile:PlayerProfile,now=new Date()):Promise<FamilyReport>{
 const [snapshot,world,activity]=await Promise.all([
  loadLearningReport(repo,profile.id,now.toISOString()),
  passportEvidence(repo,profile.id),
  repo.getActivityLog(200,profile.id)
 ]);
 return buildFamilyReport({snapshot,worlds:world.worlds,evidenceStars:world.evidence.map(e=>e.stars),activity,
  gradeLevel:profile.gradeLevel??null,englishLevel:profile.englishLevel??'Pre-A1',now});
}
