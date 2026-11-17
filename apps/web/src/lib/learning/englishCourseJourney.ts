/**
 * Ventra Kids P2 — read-only, learner-specific course journey.
 *
 * Uses only registered P0 teaching surfaces and existing game progress.
 * "completed" means a game level was saved, NEVER verified English mastery.
 * No SQL migrations or persistent migration of old games.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {IProgressRepository} from '../progress/types.ts';
import {CURRICULUM_SURFACES,ENGLISH_CURRICULUM_OUTCOMES,
 type TeachingSurfaceId,type EnglishCurriculumOutcome} from './englishCurriculum.ts';
import {alphabetLessonLevelId} from './alphabetGroveEngine.ts';
import {accessibleNumberLevels} from '../progress/gardenOverallProgress.ts';

export const ENGLISH_COURSE_VERSION='kids-english-journey-p2-2026-11-17' as const;
export interface JourneyChapter{
 id:string;title:string;eyebrow:string;icon:string;description:string;
 surfaces:readonly TeachingSurfaceId[];
}
export const JOURNEY_CHAPTERS:readonly JourneyChapter[]=[
 {id:'start',title:'İlk İngilizcem',eyebrow:'TEMELLER',icon:'🌱',
  description:'Harfleri tanı ve ilk İngilizce kelimelerini duy.',
  surfaces:['garden.alphabet','garden.animals']},
 {id:'words',title:'Rengârenk Dünyam',eyebrow:'KELİMELER',icon:'🌈',
  description:'Renkleri, sayıları ve günlük yaşamın sözcüklerini keşfet.',
  surfaces:['garden.colors','garden.numbers','garden.food','garden.family']},
 {id:'express',title:'Cümle Kuruyorum',eyebrow:'İFADELER',icon:'✨',
  description:'Bildik kelimeleri kullan ve kısa cümleler oluştur.',
  surfaces:['garden.temple','plaza.sentences']},
 {id:'story',title:'Hikâye Zamanı',eyebrow:'ANLAMA',icon:'📖',
  description:'İngilizce hikâyeleri dinle, sırala ve ipuçlarını çöz.',
  surfaces:['forest.discovery','forest.sequence','forest.detective']},
 {id:'talk',title:'Birlikte Konuşalım',eyebrow:'İLETİŞİM',icon:'⚓',
  description:'Karakterlerin sorularına uygun cevaplar ver.',
  surfaces:['harbor.dialogue']},
 {id:'write',title:'Kendi Kelimelerim',eyebrow:'YAZMA',icon:'✏️',
  description:'Harfleri, kelimeleri ve cümleleri anlamlı sıraya koy.',
  surfaces:['workshop.writing']},
 {id:'combine',title:'Büyük Keşif',eyebrow:'TEKRAR',icon:'🌟',
  description:'Öğrendiklerini farklı maceralarda tekrar dene.',
  surfaces:['academy.atlas']}
];
export type JourneyLoadStatus='ready'|'error';
export interface JourneyGameProgress{
 surfaceId:TeachingSurfaceId;gameId:string;status:JourneyLoadStatus;
 completed:number;total:number;played:number;
 /** May suggest a friendly review; not a diagnostic result or mastery mark. */
 reviewSuggested:boolean;
 /** True only when this actual game is accessible with current saved progress. */
 accessible:boolean;
 /** Existing in-game chapter/level to continue; never forced deep link. */
 nextLevel:number|null;
}
export interface JourneySnapshot{
 placement:EnglishPlacement;gradeLevel:number|null;
 games:readonly JourneyGameProgress[];
}
export interface JourneyCard extends JourneyGameProgress{
 label:string;islandId:string;outcomes:readonly EnglishCurriculumOutcome[];
 chapterId:string;chapterTitle:string;
}
export interface JourneyRecommendation{
 surfaceId:TeachingSurfaceId;reason:string;kind:'start'|'continue'|'review';
}
export interface JourneyViewModel{
 cards:readonly JourneyCard[];chapters:readonly (JourneyChapter&{
  savedGames:number;totalGames:number;hasError:boolean;
 })[];
 primary:JourneyRecommendation|null;
 review:JourneyRecommendation|null;
 savedGames:number;totalGames:number;failedGames:number;
}
type SavedLevel={
 completedCount?:number;bestStars?:number;bestAccuracy?:number;
 attemptsCount?:number;lastCompletedAt?:string;
};
/** Every ID is a current playable surface in the P0 registry.
 * Number Valley's count MUST match the conservative grade/placement ceiling.
 */
export function journeyGameLevelIds(surfaceId:TeachingSurfaceId,grade:number|null,
 placement:EnglishPlacement):readonly number[]{
 const count:{[K in TeachingSurfaceId]:number}={
  'garden.alphabet':12,'garden.animals':5,'garden.colors':3,
  'garden.numbers':accessibleNumberLevels(grade,placement),
  'garden.food':15,'garden.family':20,'garden.temple':25,
  'plaza.sentences':6,'forest.discovery':6,'forest.sequence':6,
  'forest.detective':6,'harbor.dialogue':5,'workshop.writing':5,'academy.atlas':6
 };
 return Array.from({length:count[surfaceId]},(_,i)=>
  surfaceId==='garden.alphabet'?alphabetLessonLevelId(i+1,placement):i+1);
}
const saved=(row:SavedLevel|undefined)=>Boolean(row&&
 ((row.completedCount??0)>0||(row.bestStars??0)>0));
/** Avoid assigning 0% to inaccessible cloud/IndexedDB data. */
export async function loadJourneySnapshot(
 repo:Pick<IProgressRepository,'getAllLevelProgress'>,
 profileId:string,placement:EnglishPlacement,gradeLevel:number|null
):Promise<JourneySnapshot>{
 if(!profileId)throw new Error('Missing child profile for the course journey');
 const raw=await Promise.allSettled(CURRICULUM_SURFACES.map(surface=>
  repo.getAllLevelProgress(surface.gameId,profileId)
 ));
 const games:JourneyGameProgress[]=CURRICULUM_SURFACES.map((surface,index)=>{
  const result=raw[index];
  const ids=journeyGameLevelIds(surface.id,gradeLevel,placement);
  if(result.status==='rejected')return {
   surfaceId:surface.id,gameId:surface.gameId,status:'error',
   completed:0,total:ids.length,played:0,reviewSuggested:false,accessible:false,nextLevel:null
  };
  const rows=result.value as Record<number,SavedLevel>;
  const complete=ids.filter(id=>saved(rows[id]));
  const observed=ids.filter(id=>rows[id]&&(rows[id].completedCount??0)>0);
  const reviewSuggested=observed.some(id=>
   Number.isFinite(rows[id].bestAccuracy)&&
   (rows[id].bestAccuracy??1)<0.65&&(rows[id].attemptsCount??0)>=2);
  return {
   surfaceId:surface.id,gameId:surface.gameId,status:'ready',
   completed:complete.length,total:ids.length,played:observed.length,
   reviewSuggested,accessible:true,
   nextLevel:ids.find(id=>!saved(rows[id]))??null
  };
 });
 const animals=games.find(x=>x.surfaceId==='garden.animals');
 const colors=games.find(x=>x.surfaceId==='garden.colors');
 const available=games.map(game=>{
  const gated=game.surfaceId==='garden.colors'
   ?animals?.status==='ready'&&animals.completed===animals.total
   :game.surfaceId==='garden.numbers'
   ?colors?.status==='ready'&&colors.completed===colors.total
   :true;
  return {...game,accessible:game.status==='ready'&&Boolean(gated)};
 });
 return {placement,gradeLevel,games:available};
}
interface Milestone{surface:TeachingSurfaceId;atLeast:number;reason:string;level:'any'|'beginner'}
/** Short, child-readable milestones alternate early letter and word work.
 * Milestones guide ONLY; other islands stay manually accessible.
 */
export const COURSE_MILESTONES:readonly Milestone[]=[
 {surface:'garden.alphabet',atLeast:2,reason:'Harfleri ve sesleri keşfedelim.',level:'beginner'},
 {surface:'garden.animals',atLeast:2,reason:'İlk hayvan kelimelerini dinleyelim.',level:'any'},
 {surface:'garden.alphabet',atLeast:5,reason:'Yeni harfler ve kısa kelimeler çalışalım.',level:'beginner'},
 {surface:'garden.animals',atLeast:5,reason:'Hayvan kelimelerini pekiştirelim.',level:'any'},
 {surface:'garden.colors',atLeast:3,reason:'Renkleri resimlerle eşleştirelim.',level:'any'},
 {surface:'garden.numbers',atLeast:5,reason:'İngilizce sayıları dinleyelim.',level:'any'},
 {surface:'garden.food',atLeast:3,reason:'Yiyecek adlarını öğrenelim.',level:'any'},
 {surface:'garden.family',atLeast:4,reason:'Ailemizi ve evimizi anlatalım.',level:'any'},
 {surface:'garden.alphabet',atLeast:9,reason:'Bütün İngilizce harfleri keşfedelim.',level:'beginner'},
 {surface:'garden.temple',atLeast:5,reason:'Öğrendiklerimizi farklı bir oyunda kullanalım.',level:'any'},
 {surface:'plaza.sentences',atLeast:2,reason:'Artık kısa cümleler kurabiliriz.',level:'any'},
 {surface:'forest.discovery',atLeast:2,reason:'Bir hikâyeyi dinleyip anlayalım.',level:'any'},
 {surface:'harbor.dialogue',atLeast:2,reason:'İngilizce konuşma sırası sende.',level:'any'},
 {surface:'workshop.writing',atLeast:2,reason:'Kelimelerimizi yazıyla kullanalım.',level:'any'},
 {surface:'garden.alphabet',atLeast:12,reason:'İlk okumalarını tekrar edelim.',level:'beginner'},
 {surface:'garden.food',atLeast:15,reason:'Günlük kelimelerini genişletelim.',level:'any'},
 {surface:'garden.family',atLeast:20,reason:'Aile ve ev kelimelerini pekiştirelim.',level:'any'},
 {surface:'garden.temple',atLeast:25,reason:'Kelime maceralarımızı tamamlayalım.',level:'any'},
 {surface:'plaza.sentences',atLeast:6,reason:'Daha çok cümle oluşturalım.',level:'any'},
 {surface:'forest.discovery',atLeast:6,reason:'Hikâyeleri yeniden keşfedelim.',level:'any'},
 {surface:'forest.sequence',atLeast:6,reason:'Hikâyedeki olayları sıralayalım.',level:'any'},
 {surface:'forest.detective',atLeast:6,reason:'Hikâye ipuçlarını çözelim.',level:'any'},
 {surface:'harbor.dialogue',atLeast:5,reason:'Yeni diyalogları deneyelim.',level:'any'},
 {surface:'workshop.writing',atLeast:5,reason:'Kelimelerden cümlelere geçelim.',level:'any'},
 {surface:'academy.atlas',atLeast:6,reason:'Becerilerimizi birlikte kullanalım.',level:'any'}
];
const reasonFor=(card:JourneyCard,kind:'start'|'continue'|'review',why:string):JourneyRecommendation=>({
 surfaceId:card.surfaceId,
 kind,reason:kind==='review'?'Bu oyunu daha önce denedin. Tekrar çalışmak faydalı olabilir.':
 kind==='continue'?'Daha önce başladığın '+card.label+' macerasında devam et.':
 why
});
export function buildJourneyViewModel(snapshot:JourneySnapshot):JourneyViewModel{
 const cards:JourneyCard[]=snapshot.games.map(game=>{
  const surface=CURRICULUM_SURFACES.find(x=>x.id===game.surfaceId)!;
  const chapter=JOURNEY_CHAPTERS.find(x=>x.surfaces.includes(game.surfaceId))!;
  return {...game,label:surface.label,islandId:surface.islandId,chapterId:chapter.id,
   chapterTitle:chapter.title,
   outcomes:ENGLISH_CURRICULUM_OUTCOMES.filter(outcome=>
    outcome.placement===snapshot.placement&&outcome.coverage!=='gap'&&
    outcome.surfaceIds.includes(game.surfaceId))
  };
 });
 const lookup=new Map(cards.map(card=>[card.surfaceId,card]));
 const readable=cards.filter(card=>card.status==='ready');
 const ready=readable.filter(card=>card.accessible);
 const isBeginner=snapshot.placement==='Pre-A1';
 let primary:JourneyRecommendation|null=null;
 for(const step of COURSE_MILESTONES){
  if(step.level==='beginner'&&!isBeginner)continue;
  const card=lookup.get(step.surface);
  if(!card||!card.accessible||card.completed>=Math.min(step.atLeast,card.total))continue;
  primary=reasonFor(card,card.completed>0?'continue':'start',step.reason);break;
 }
 if(!primary){
  const unfinished=ready.find(card=>card.completed<card.total);
  if(unfinished)primary=reasonFor(unfinished,unfinished.completed>0?'continue':'start',
   'Yeni bir İngilizce oyunu keşfedelim.');
 }
 const reviewCandidate=ready.find(card=>card.reviewSuggested&&card.completed>0&&card.surfaceId!==primary?.surfaceId);
 const review=reviewCandidate?reasonFor(reviewCandidate,'review',''):null;
 if(!primary){
  const completed=ready.find(card=>card.completed>0);
  if(completed)primary=reasonFor(completed,'review','');
 }
 const chapters=JOURNEY_CHAPTERS.map(chapter=>{
  const list=chapter.surfaces.map(id=>lookup.get(id)).filter((x):x is JourneyCard=>Boolean(x));
  return {...chapter,savedGames:list.filter(x=>x.status==='ready').reduce((n,x)=>n+x.completed,0),
   totalGames:list.filter(x=>x.status==='ready').reduce((n,x)=>n+x.total,0),
   hasError:list.some(x=>x.status==='error')};
 });
 return {cards,chapters,primary,review,
  savedGames:readable.reduce((n,c)=>n+c.completed,0),
  totalGames:readable.reduce((n,c)=>n+c.total,0),
  failedGames:cards.length-readable.length};
}
export function validateJourneyMap():string[]{
 const errors:string[]=[];
 const catalogIds=CURRICULUM_SURFACES.map(x=>x.id);
 const linked=JOURNEY_CHAPTERS.flatMap(x=>x.surfaces);
 if(linked.length!==catalogIds.length||new Set(linked).size!==catalogIds.length||
  linked.some(id=>!catalogIds.includes(id)))errors.push('Some playable surfaces are missing or duplicated in the course');
 if(new Set(JOURNEY_CHAPTERS.map(x=>x.id)).size!==JOURNEY_CHAPTERS.length)errors.push('Chapter IDs not unique');
 for(const step of COURSE_MILESTONES){
  if(!catalogIds.includes(step.surface)||!Number.isInteger(step.atLeast)||step.atLeast<1)
   errors.push('Invalid milestone');
 }
 return errors;
}
