/**
 * P3 English Theme Town — deterministic, grade-aware, reviewable micro-lessons.
 * The recorded outcome is game practice, never verified English proficiency.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import {resolveVocabularyTier} from './gradeAwareLearningPolicy.ts';
import {visualForEnglishWord} from './learningArt.ts';
import {THEME_DEFINITIONS,THEME_TIERS,themeById,
 type ThemeId,type ThemeTier,type ThemeLexeme,type ThemePhrase} from './themeQuestCatalog.ts';

export type ThemeTaskKind='discover'|'picture'|'translate'|'listen'|'meaning'|'phrase'|'assemble'|'clock';
export interface ThemeTask{
 id:string;kind:ThemeTaskKind;theme:ThemeId;answer:string;choices:readonly string[];
 promptTr:string;word?:ThemeLexeme;phrase?:ThemePhrase;audioText?:string;
 /** The on-screen illustration deliberately does not reveal the English answer. */
 clockMinutes?:number;
}
export interface ThemeAnswerEvidence{
 taskId:string;kind:ThemeTaskKind;firstTryCorrect:boolean;mistakes:number;
 hintUsed:boolean;speechStarted:boolean;independent:boolean;
}
export interface ThemeDeck{
 theme:ThemeId;placement:EnglishPlacement;tier:ThemeTier;replay:number;
 tasks:readonly ThemeTask[];
}
const quote=(value:string)=>value.trim().toLocaleLowerCase('en-US')
 .replace(/[.!?]/g,'').replace(/\s+/g,' ');
export function themeGradeTaskCount(gradeLevel:number|null|undefined):number{
 return gradeLevel!==null&&gradeLevel!==undefined&&Number.isInteger(gradeLevel)?
 gradeLevel<=2?8:gradeLevel<=4?10:12:10;
}
export function themeEffectiveTier(gradeLevel:number|null|undefined,placement:EnglishPlacement):ThemeTier{
 return resolveVocabularyTier(gradeLevel,placement);
}
const mix=<T>(values:readonly T[],seed:number):T[]=>{
 const result=[...values];let x=seed>>>0;
 for(let i=result.length-1;i>0;i--){
  x=(Math.imul(x,1664525)+1013904223)>>>0;
  const j=x%(i+1);[result[i],result[j]]=[result[j],result[i]];
 }
 return result;
};
const rotate=<T>(values:readonly T[],replay:number):T[]=>{
 if(values.length===0)return [];
 const order=Math.floor(replay/values.length)%2? [...values].reverse():[...values];
 const start=replay%order.length;
 return [...order.slice(start),...order.slice(0,start)];
};
const options=(correct:string,other:readonly string[],seed:number,count:number)=>{
 const distractors=mix([...new Set(other.filter(x=>quote(x)!==quote(correct)))],seed);
 return mix([correct,...distractors.slice(0,Math.max(1,count-1))],seed+23);
};
const toTask=(theme:ThemeId,placement:EnglishPlacement,tier:ThemeTier,replay:number,
 kind:ThemeTaskKind,index:number,answer:string,
 payload:Omit<ThemeTask,'id'|'kind'|'theme'|'answer'>):ThemeTask=>({
 id:'theme:'+theme+':'+placement+':'+tier+':'+replay+':'+kind+':'+index,
 theme,kind,answer,...payload
});
/**
 * Independent evidence for one answered Theme Town task.
 * - discover/assemble are exposure/support tasks, never independent recall;
 * - listen tasks require that the English audio actually started;
 * - every other task with audio (picture, translate, phrase, clock) is
 *   assessed WITHOUT audio: its speaker says the exact answer, so playing it
 *   makes the answer assisted.
 */
export function themeAnswerIndependent(task:Pick<ThemeTask,'kind'|'audioText'>,
 firstTry:boolean,speechStarted:boolean):boolean{
 if(!firstTry||task.kind==='discover'||task.kind==='assemble')return false;
 if(task.kind==='listen')return speechStarted;
 return !(task.audioText&&speechStarted);
}
/** No question is generated from unseen grade-specific vocabulary.
 * Pre-A1 introduces words visually; A1 expands context; A2 expands phrases.
 */
export function planThemeLesson(input:{
 theme:ThemeId;placement:EnglishPlacement;gradeLevel:number|null|undefined;replay:number;
}):ThemeDeck{
 const {theme,placement,replay,gradeLevel}=input;
 if(!THEME_TIERS.includes(placement)||!Number.isSafeInteger(replay)||replay<0)
  throw new RangeError('Invalid theme placement/replay');
 const tier=themeEffectiveTier(gradeLevel,placement);
 const definition=themeById(theme);
 const bank=definition.tiers[tier];
 const salt=THEME_DEFINITIONS.findIndex(x=>x.id===theme)*557+
  THEME_TIERS.indexOf(placement)*131+tier*71;
 const sequence=rotate(mix(bank.words,salt+101),replay);
 const speaking=rotate(mix(bank.phrases,salt+307),replay);
 const depth=themeGradeTaskCount(gradeLevel);
 const width=depth===8?2:depth===10?3:4;
 let serial=0;
 const make=(kind:ThemeTaskKind,answer:string,payload:Omit<ThemeTask,'id'|'kind'|'theme'|'answer'>)=>{
  const index=serial++;
  return toTask(theme,placement,tier,replay,kind,index,answer,payload);
 };
 const intro=(w:ThemeLexeme)=>make('discover',w.en,{
  choices:[],word:w,promptTr:'Yeni kelimemiz: '+w.tr,audioText:w.en
 });
 const pictured=(w:ThemeLexeme)=>{
  // Do not test arbitrary category symbols as if they were literal word pictures.
  const exact=Boolean(visualForEnglishWord(w.en,w.tr));
  return make(exact?'picture':'translate',w.en,{
   choices:options(w.en,bank.words.map(x=>x.en),salt+serial*19+replay*37,width),
   word:w,promptTr:exact?'Resimdeki '+w.tr+' İngilizcede nasıl söylenir?':
    '“'+w.tr+'” İngilizcede nasıl söylenir?',audioText:w.en
  });
 };
 const heard=(w:ThemeLexeme)=>make('listen',w.en,{
  choices:options(w.en,bank.words.map(x=>x.en),salt+serial*23+replay*41,width),
  promptTr:'Kelimeyi dinle ve İngilizce yazılışını seç.',audioText:w.en
 });
 const meant=(w:ThemeLexeme)=>make('meaning',w.tr,{
  choices:options(w.tr,bank.words.map(x=>x.tr),salt+serial*29+replay*43,width),
  word:w,promptTr:'Bu İngilizce kelimenin Türkçe anlamı nedir?'
 });
 const expressed=(p:ThemePhrase)=>make('phrase',p.en,{
  choices:options(p.en,bank.phrases.map(x=>x.en),salt+serial*31+replay*47,width),
  phrase:p,promptTr:'Bu durumda İngilizce ne söylersin?',audioText:p.en
 });
 const assembled=(p:ThemePhrase)=>make('assemble',p.en,{
  choices:mix(p.en.split(' '),salt+serial*33+replay*53),
  phrase:p,promptTr:'İngilizce kelimeleri doğru sıraya koy.',audioText:p.en
 });
 const clocks=bank.words.filter(x=>x.clockMinutes!==undefined);
 const clock=clocks.length>1?
  clocks[(replay+Math.floor(replay/3))%clocks.length]:undefined;
 const clocked=(w:ThemeLexeme)=>make('clock',w.en,{
  choices:options(w.en,clocks.map(x=>x.en),salt+serial*37+replay*59,width),
  promptTr:'Saat kaç? Analog saate bak ve İngilizcesini seç.',
  clockMinutes:w.clockMinutes,audioText:w.en
 });
 // Required stages: discover (two), retrieve word (picture/meaning),
 // hear a real spoken English word, use a scenario, then construct/review.
 const tasks:ThemeTask[]=[
  intro(sequence[0]),intro(sequence[1]),
  // Early retrieval is based on JUST-INTRODUCED words, not unfamiliar labels.
  pictured(sequence[0]),pictured(sequence[1]),
  heard(sequence[2]),
  theme==='calendar'&&clock?clocked(clock):meant(sequence[0]),
  expressed(speaking[0]),expressed(speaking[1])
 ];
 if(depth>=10)tasks.push(pictured(sequence[3]),assembled(speaking[2]));
 if(depth>=12)tasks.push(heard(sequence[4]),expressed(speaking[3]));
 return {theme,placement,tier,replay,tasks};
}
export function isThemeAnswerCorrect(task:ThemeTask,answer:string):boolean{
 // Turkish dotted/dotless I and English I have different case-fold rules.
 const locale=task.kind==='meaning'?'tr-TR':'en-US';
 const normalize=(value:string)=>value.trim().toLocaleLowerCase(locale)
  .replace(/[.!?]/g,'').replace(/\s+/g,' ');
 return Boolean(normalize(answer)&&normalize(task.answer)===normalize(answer));
}
export function themeTaskHint(task:ThemeTask):string{
 if(task.kind==='discover')return task.word&&visualForEnglishWord(task.word.en,task.word.tr)?
  'Resme bak ve kelimeyi dinle.':
  'Türkçe anlamı oku, konu ipucunu incele ve kelimenin İngilizcesini dinle.';
 if(task.kind==='clock')return 'Kısa ibre saati, uzun ibre dakikayı gösterir. Uzun ibre 12’deyse tam saat, 3’teyse çeyrek geçer.';
 if(task.kind==='listen')return 'Kulaklık düğmesinden İngilizce kelimeyi tekrar dinle.';
 if(task.kind==='translate')return 'Türkçe anlamı düşün ve doğru İngilizce sözcüğü seç. Konu simgesi birebir nesne resmi değildir.';
 if(task.kind==='assemble')return 'Önce özneyi bul. Sonra eylemi ve kalan kelimeleri sırayla yerleştir.';
 if(task.kind==='phrase')return 'Resimdeki durumu ve Türkçe açıklamayı düşün.';
 return 'İngilizce kelimenin ilk harfi: '+task.word?.en.trim().charAt(0).toUpperCase()+'.';
}
export function validateThemeDecks():string[]{
 const errors:string[]=[];
 for(const def of THEME_DEFINITIONS){
  for(const placement of THEME_TIERS){
   for(const gradeLevel of [1,3,6,null]){
    const signatures=new Set<string>();
    for(let replay=0;replay<12;replay++){
     const deck=planThemeLesson({theme:def.id,placement,gradeLevel,replay});
     if(deck.tasks.length!==themeGradeTaskCount(gradeLevel))
      errors.push('Wrong task count '+def.id+':'+placement);
     if(new Set(deck.tasks.map(t=>t.id)).size!==deck.tasks.length)
      errors.push('Repeated ID '+def.id+':'+placement);
     for(const task of deck.tasks){
      if(task.kind!=='discover'&&!task.choices.some(x=>isThemeAnswerCorrect(task,x))&&
       task.kind!=='assemble')errors.push('Missing correct choice '+task.id);
      if(task.kind!=='discover'&&task.kind!=='assemble'&&task.choices.length<2)
       errors.push('Only one choice '+task.id);
      if(task.kind==='picture'&&(!task.word||!visualForEnglishWord(task.word.en,task.word.tr)))errors.push('Missing exact artwork '+task.id);
       if(task.kind==='translate'&&task.word&&visualForEnglishWord(task.word.en,task.word.tr))errors.push('Artwork incorrectly skipped '+task.id);
       if(task.kind==='clock'&&task.clockMinutes===undefined)
       errors.push('Missing clock '+task.id);
     }
     const signature=deck.tasks.map(t=>t.kind+':'+t.answer).join('|');
     if(signatures.has(signature))errors.push('Deck repeats too soon '+def.id+':'+placement);
     signatures.add(signature);
    }
   }
  }
 }
 return errors;
}
