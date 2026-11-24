import {WORLD_GAMES} from '../rewards/economyEngine.ts';
import {normaliseInviteCode,type RosterStudent,type SchoolApiVersion} from './schoolService.ts';

/**
 * Pure helpers for the school panel: English skill areas, a class summary a
 * teacher can act on, "last mission" labels, sorting, and invite links and
 * messages. No network, no storage; everything here is unit-tested.
 */

export type SkillId='words'|'sentences'|'reading'|'speaking'|'writing';
type World=typeof WORLD_GAMES[number];
export type SkillArea={id:SkillId;label:string;icon:string;worlds:World[];total:number};

const area=(id:SkillId,label:string,icon:string,ids:readonly string[]):SkillArea=>{
 const worlds=WORLD_GAMES.filter(w=>ids.includes(w.id));
 return {id,label,icon,worlds,total:worlds.reduce((n,w)=>n+w.count,0)};
};
/** Every English world belongs to exactly one skill area (checked by a test). */
export const SKILL_AREAS:SkillArea[]=[
 area('words','Kelime','🌱',['island_word_garden_steps','island_word_garden_colors','island_word_garden_numbers',
  'island_word_garden_food','island_word_garden_family','island_word_garden_temple']),
 area('sentences','Cümle','🏰',['island_sentence_square_plaza']),
 area('reading','Okuma','📖',['island_story_forest_discover','island_story_forest_sequence','island_story_forest_detective']),
 area('speaking','Konuşma','⚓',['island_speaking_harbor_dialogue']),
 area('writing','Yazma','✏️',['island_sentence_workshop_writing'])
];
export const TOTAL_LEVELS=WORLD_GAMES.reduce((n,w)=>n+w.count,0);

export type SkillProgress={id:SkillId;label:string;icon:string;done:number;total:number};
/** One child's completed missions per skill area (never above the area's size). */
export function skillProgress(worlds:Record<string,number>|null):SkillProgress[]{
 return SKILL_AREAS.map(a=>({id:a.id,label:a.label,icon:a.icon,total:a.total,
  done:a.worlds.reduce((n,w)=>n+Math.min(w.count,Math.max(0,worlds?.[w.id]??0)),0)}));
}
export type WorldProgress={id:string;label:string;icon:string;done:number;total:number};
/** Worlds a child has started, in curriculum order. */
export function startedWorlds(worlds:Record<string,number>|null):WorldProgress[]{
 return WORLD_GAMES.flatMap(w=>{
  const done=Math.min(w.count,Math.max(0,worlds?.[w.id]??0));
  return done>0?[{id:w.id,label:w.label,icon:w.icon,done,total:w.count}]:[];
 });
}
export const percent=(done:number,total:number)=>total>0?Math.round(100*Math.min(done,total)/total):0;

export type ClassSkill=SkillProgress&{percent:number;students:number};
/** Class average per skill area: the mean of each child's share of the area,
 * and how many children have started it. */
export function classSkills(students:readonly RosterStudent[]):ClassSkill[]{
 const each=students.map(s=>skillProgress(s.worlds));
 return SKILL_AREAS.map((a,i)=>{
  const done=each.reduce((n,list)=>n+list[i].done,0);
  const share=each.length?each.reduce((n,list)=>n+list[i].done/a.total,0)/each.length:0;
  return {id:a.id,label:a.label,icon:a.icon,total:a.total,done,
   percent:Math.round(100*share),students:each.filter(list=>list[i].done>0).length};
 });
}
/** One sentence a teacher can act on, built only from the class summary. */
export function classInsight(skills:readonly ClassSkill[],studentCount:number):string|null{
 if(!studentCount)return null;
 const started=skills.filter(s=>s.students>0);
 const first=(id:SkillId)=>SKILL_AREAS.find(a=>a.id===id)!.worlds[0];
 if(!started.length){
  const w=first('words');
  return `Öğrenciler henüz İngilizce görev yapmadı. Derste ${w.icon} ${w.label} ile birlikte başlayabilirsiniz.`;
 }
 const best=[...started].sort((a,b)=>b.percent-a.percent||b.students-a.students)[0];
 const lead=`Sınıf en çok ${best.label} alanında ilerliyor.`;
 const untouched=skills.find(s=>s.students===0);
 if(untouched){
  const w=first(untouched.id);
  return `${lead} ${untouched.label} alanında henüz görev yok; derste ${w.icon} ${w.label} ile başlayabilirsiniz.`;
 }
 const weakest=[...skills].sort((a,b)=>a.percent-b.percent)[0];
 return weakest.id===best.id?lead:`${lead} En az ilerlenen alan ${weakest.label} (%${weakest.percent}).`;
}

/** Today in Turkey as YYYY-MM-DD (the server reports mission days the same way). */
export function istanbulDay(date=new Date()):string{
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function daysBetween(from:string,to:string):number{
 const a=Date.parse(from.slice(0,10)+'T00:00:00Z'),b=Date.parse(to.slice(0,10)+'T00:00:00Z');
 return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000):0;
}
export type Activity={label:string;tone:'today'|'week'|'quiet'|'none'};
/** "Bugün", "Dün", "3 gün önce", "2 hafta önce" from the last mission day. */
export function activity(lastPlayedOn:string|null,today:string):Activity{
 if(!lastPlayedOn)return {label:'Henüz görev yok',tone:'none'};
 const d=Math.max(0,daysBetween(lastPlayedOn,today));
 if(d===0)return {label:'Bugün',tone:'today'};
 if(d===1)return {label:'Dün',tone:'week'};
 if(d<7)return {label:`${d} gün önce`,tone:'week'};
 if(d<14)return {label:'1 hafta önce',tone:'quiet'};
 if(d<60)return {label:`${Math.floor(d/7)} hafta önce`,tone:'quiet'};
 return {label:'2 aydan uzun süre önce',tone:'quiet'};
}

export type RosterSort='name'|'missions'|'stars'|'recent';
export const ROSTER_SORTS:{id:RosterSort;label:string}[]=[
 {id:'name',label:'Ada göre'},{id:'missions',label:'Göreve göre'},{id:'stars',label:'Yıldıza göre'},{id:'recent',label:'Son göreve göre'}
];
const collator=new Intl.Collator('tr',{sensitivity:'base',numeric:true});
export function sortStudents(list:readonly RosterStudent[],by:RosterSort):RosterStudent[]{
 const byName=(a:RosterStudent,b:RosterStudent)=>collator.compare(a.nickname,b.nickname);
 return [...list].sort((a,b)=>{
  if(by==='missions')return b.completedLevels-a.completedLevels||byName(a,b);
  if(by==='stars')return b.stars-a.stars||byName(a,b);
  if(by==='recent'){
   const x=a.lastPlayedOn??'',y=b.lastPlayedOn??'';
   return x===y?byName(a,b):x<y?1:-1;
  }
  return byName(a,b);
 });
}
export function matchesName(nickname:string,query:string):boolean{
 const q=query.trim().toLocaleLowerCase('tr-TR');
 return !q||nickname.toLocaleLowerCase('tr-TR').includes(q);
}

const dateFormat=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',timeZone:'Europe/Istanbul'});
const shortDate=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',timeZone:'Europe/Istanbul'});
/** "28 Kasım" (or "28 Kas" when short). */
export function formatDay(value:string|null,short=false):string{
 if(!value)return '';
 const time=Date.parse(value.length===10?value+'T12:00:00+03:00':value);
 return Number.isFinite(time)?(short?shortDate:dateFormat).format(time):'';
}

/** Where invite links point. A configured public address wins; in the app
 * (or anywhere without an http(s) address) there is no link, only the code. */
export function inviteBaseUrl(configured:string|undefined,origin:string|null,native:boolean):string|null{
 const clean=(configured??'').trim().replace(/\/+$/,'');
 if(/^https?:\/\/[^\s/]+/i.test(clean))return clean;
 if(native||!origin||!/^https?:\/\/[^\s/]+/i.test(origin))return null;
 return origin.replace(/\/+$/,'');
}
/** The code travels after "#", which browsers never send to a server. */
export function inviteLink(base:string|null,code:string):string|null{
 return base?`${base}/school#davet=${code}`:null;
}
const FULL_CODE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function inviteFromHash(hash:string):string|null{
 const match=/(?:^|[#&])davet=([0-9a-fA-F-]{32,40})(?:&|$)/.exec(hash);
 if(!match)return null;
 const code=normaliseInviteCode(match[1]);
 return FULL_CODE.test(code)?code:null;
}
export type InviteMessage={schoolName:string;className:string;code:string;link:string|null;validUntil:string|null};
/** A ready message for the parents' group: what to do, until when, and what
 * the teacher will (and will not) see. */
export function inviteMessage({schoolName,className,code,link,validUntil}:InviteMessage):string{
 const until=validUntil?formatDay(validUntil):'';
 return [
  `Merhaba! ${schoolName} · ${className} sınıfımız Ventra'da İngilizce görevler yapacak.`,
  link?`Çocuğunuzu sınıfa bağlamak için bu bağlantıyı açın ve veli hesabınızla giriş yapın:\n${link}`:
   `Çocuğunuzu sınıfa bağlamak için Ventra'da Okul Paneli → Veliyim bölümüne bu kodu yazın:\n${code}`,
  link?`Bağlantı açılmazsa Okul Paneli → Veliyim bölümüne bu kodu yazın:\n${code}`:'',
  until?`Davet ${until} tarihine kadar geçerli.`:'',
  'Öğretmen yalnızca takma adı, sınıf düzeyini ve İngilizce görev özetini görür; gerçek ad, ses ve yazılan metinler paylaşılmaz.'
 ].filter(Boolean).join('\n\n');
}

/** What a teacher sees about an enrolled child, matching the database version. */
export function teacherSees(version:SchoolApiVersion):string[]{
 return version>=2?[
  'Takma ad ve sınıf düzeyi',
  'Tamamlanan İngilizce görevler ve yıldızlar (Kelime, Cümle, Okuma, Konuşma, Yazma)',
  'Son İngilizce görev günü ve son 7 gündeki görev sayısı',
  'Sınıfa katılma tarihi'
 ]:['Takma ad ve sınıf düzeyi','Tamamlanan İngilizce görev sayısı ve yıldızlar'];
}
export const TEACHER_NEVER_SEES=[
 'Gerçek ad ve e-posta',
 'Ses kaydı ve konuşma dökümü',
 'Yazdığı metinler ve verdiği cevaplar',
 'Oyun süresi ve doğru-yanlış oranı'
];

const INITIAL_COLORS=['#7c3aed','#0891b2','#16a34a','#ea580c','#db2777','#2563eb','#ca8a04','#0d9488'];
/** A steady colour per child for the initial badge (no avatar is shared with teachers). */
export function initialColor(id:string):string{
 let h=0;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;
 return INITIAL_COLORS[h%INITIAL_COLORS.length];
}
export function initialOf(nickname:string):string{
 return [...nickname.trim()][0]?.toLocaleUpperCase('tr-TR')??'?';
}

export const SCHOOL_COLORS=[
 {hex:'#2563eb',name:'Mavi'},{hex:'#7c3aed',name:'Mor'},{hex:'#db2777',name:'Pembe'},{hex:'#dc2626',name:'Kırmızı'},
 {hex:'#ea580c',name:'Turuncu'},{hex:'#16a34a',name:'Yeşil'},{hex:'#0d9488',name:'Deniz yeşili'},{hex:'#0891b2',name:'Turkuaz'}
] as const;
