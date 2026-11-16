/**
 * Keşif Akademisi L6: deterministic, offline-first integrated English.
 * 18 authored situations x 3 placements x 5 interaction kinds = 270 task IDs,
 * not 270 independent stories and not a formal CEFR assessment.
 * NEVER persist child-entered text or microphone transcripts.
 */
export type AcademyLevel = 'Pre-A1' | 'A1' | 'A2';
export type AcademyKind = 'hear' | 'read' | 'talk' | 'build' | 'write';
export type AcademySkill = 'listening' | 'reading' | 'dialogue' | 'sentence' | 'writing';
export const ACADEMY_GAME_ID = 'island_language_academy_atlas' as const;
export const ACADEMY_REVIEW_GAME_ID = 'island_language_academy_review' as const;
export const ACADEMY_ZONE_COUNT = 6;
export const ACADEMY_STEPS = 5;

export type AcademyZone = {
  id:number;name:string;subtitle:string;icon:string;tint:string;light:string;
  intro:string;ending:string;art:string;mobileArt:string;
};
export const ACADEMY_ZONES:readonly AcademyZone[] = [
  {id:1,art:'/assets/kids-islands/language_academy.webp',mobileArt:'/assets/kids-islands/language_academy_mobile.webp',name:'Atlas Kapısı',subtitle:'İlk ışığı uyandır',icon:'🧭',tint:'#344b9b',light:'#b9caff',
   intro:'Atlasın ilk sayfası soluk. Lumi kaybolan işareti bulmak istiyor.',ending:'Atlasın ilk sayfası yeniden parladı!'},
  {id:2,art:'/assets/harbor-scenes/festival.webp',mobileArt:'/assets/harbor-scenes/festival_mobile.webp',name:'Bulut Postanesi',subtitle:'Mesajları yerine ulaştır',icon:'💌',tint:'#c66c91',light:'#ffd8df',
   intro:'Bulutlar arasındaki postanede önemli teslimatlar bekliyor.',ending:'Mektuplar sahiplerine ulaştı!'},
  {id:3,art:'/assets/harbor-scenes/lighthouse.webp',mobileArt:'/assets/harbor-scenes/lighthouse_mobile.webp',name:'Kayıp Fener',subtitle:'Denizdeki yolu aydınlat',icon:'🌟',tint:'#22789b',light:'#b3f7e9',
   intro:'Sahildeki fenerin ışığı azaldı. İngilizce ipuçlarını bulalım.',ending:'Fener yeniden denizi aydınlatıyor!'},
  {id:4,art:'/assets/harbor-scenes/dock.webp',mobileArt:'/assets/harbor-scenes/dock_mobile.webp',name:'Yolcular İstasyonu',subtitle:'Yeni dostlarla konuş',icon:'🚂',tint:'#956342',light:'#ffe0a7',
   intro:'Yolculuğa hazırlanan dostların İngilizce yardıma ihtiyacı var.',ending:'Yolcular artık yollarını biliyor!'},
  {id:5,art:'/assets/story-forest/premium/scenes/forest_treehouse.webp',mobileArt:'/assets/story-forest/premium/scenes/forest_treehouse.webp',name:'Zaman Kütüphanesi',subtitle:'Hikâyenin eksik sayfasını bul',icon:'📖',tint:'#7360a8',light:'#e1d2ff',
   intro:'Büyülü kitapların sayfaları karışmış. İpuçlarını birleştirelim.',ending:'Hikâyenin kayıp sayfası bulundu!'},
  {id:6,art:'/assets/kids-islands/language_academy.webp',mobileArt:'/assets/kids-islands/language_academy_mobile.webp',name:'Büyük Keşif',subtitle:'Yıldız Atlası tamamlanıyor',icon:'✨',tint:'#8c6db8',light:'#fff0b6',
   intro:'Atlasın son yıldızı için İngilizce becerilerini kullan.',ending:'Yıldız Atlası yeniden ışıldıyor!'}
];
export type AcademyCase = {
  id:string;zone:number;title:string;icon:string;friend:string;
  item:string;otherA:string;otherB:string;
  place:string;placeA:string;placeB:string;mission:string;result:string;
};
const CASE_LINES = [
  "1|Pusulanın Sırrı|🧭|Lumi|golden compass|silver compass|red compass|fountain|garden|tower|Altın pusula atlasın ilk sayfasını açacak.|Pusula doğru yönü gösteriyor.",
  "1|Kayıp Yıldız|⭐|Milo|blue star|yellow star|purple star|bridge|library|gate|Milo mavi yıldızı arıyor.|Yıldız gökyüzüne geri döndü.",
  "1|Işıklı Anahtar|🗝️|Ava|green key|red key|blue key|tower|fountain|bridge|Ava akademinin kapısını açmak istiyor.|Kapı ışıkla açıldı.",
  "2|Mavi Zarf|✉️|Mia|blue envelope|red envelope|yellow envelope|garden|tower|bridge|Mia bir mektup bekliyor.|Mia mektubunu aldı.",
  "2|Doğum Günü Kartı|🎉|Leo|pink card|green card|blue card|fountain|station|library|Leo arkadaşına bir kart gönderecek.|Leo'nun arkadaşı sevindi.",
  "2|Kayıp Paket|📦|Nora|small parcel|large parcel|round parcel|bridge|garden|tower|Nora'nın paketi başka rafa konmuş.|Nora paketine kavuştu.",
  "3|Fenerin Işığı|🏮|Finn|yellow lantern|red lantern|blue lantern|tower|beach|garden|Finn feneri yeniden yakmak istiyor.|Işık denize ulaştı.",
  "3|Sahilde İzler|🐚|Ruby|white shell|pink shell|brown shell|beach|bridge|tower|Ruby sahilde bir işaret arıyor.|Sahildeki gizli yol bulundu.",
  "3|Kaybolan Harita|🗺️|Ollie|old map|new map|small map|bridge|tower|beach|Ollie doğru yolu gösteren haritayı arıyor.|Ollie rotayı tamamladı.",
  "4|Küçük Bilet|🎟️|Emma|green ticket|blue ticket|red ticket|station|garden|bridge|Emma tren yolculuğuna hazırlanıyor.|Emma trene binebildi.",
  "4|Yolcu Çantası|🎒|Jack|yellow bag|blue bag|red bag|platform|station|tower|Jack'in çantası kaybolmuş.|Jack yolculuğa hazır.",
  "4|Yeni Bir Dost|🧸|Lily|brown teddy|white teddy|pink teddy|garden|platform|station|Lily küçük arkadaşını bekliyor.|Lily'nin yolculuğu başladı.",
  "5|Kitabın Anahtarı|📚|Ada|silver key|golden key|green key|library|tower|garden|Ada kayıp hikâye sayfasını açmak istiyor.|Kitap yeniden açılıyor.",
  "5|Kayıp Tüy|🪶|Noah|blue feather|red feather|yellow feather|treehouse|library|garden|Noah hikâyenin son ipucunu bulmalı.|Hikâye devam ediyor.",
  "5|Gece Yıldızı|🌙|Ella|bright moon|small moon|red moon|tower|treehouse|library|Ella gece hikâyesindeki işareti arıyor.|Gece hikâyesi tamamlandı.",
  "6|Son Kristal|💎|Lumi|purple crystal|blue crystal|green crystal|observatory|fountain|bridge|Yıldız Atlası için son kristal gerekli.|Atlasın yıldızları parlamaya başladı.",
  "6|Dostluk Sembolü|🫶|Mia|golden heart|silver heart|red heart|garden|observatory|tower|Mia dostluk sayfasını tamamlamak istiyor.|Dostluk sayfası aydınlandı.",
  "6|Yeni Ufuk|🚀|Milo|bright star|small star|blue star|observatory|library|station|Milo yeni macera için yıldız arıyor.|Akademinin yeni yolu açıldı."
];
export const ACADEMY_CASES:readonly AcademyCase[] = CASE_LINES.map((line,index)=>{
  const [z,title,icon,friend,item,otherA,otherB,place,placeA,placeB,mission,result]=line.split('|');
  return {id:'academy-'+String(index+1),zone:Number(z),title,icon,friend,item,
    otherA,otherB,place,placeA,placeB,mission,result};
});
export type AcademyTask = {
  id:string;caseId:string;zone:number;kind:AcademyKind;skill:AcademySkill;
  prompt:string;line:string;options:readonly string[];answer:string;
  icon:string;feedback:string;accepted?:readonly string[];
};
export type AcademyPlan = {
  zone:number;placement:AcademyLevel;caseId:string;caseTitle:string;
  mission:string;result:string;icon:string;tasks:readonly AcademyTask[];
};
export type AcademyAnswer = {
  taskId:string;caseId:string;placement:AcademyLevel;skill:AcademySkill;
  firstTryCorrect:boolean;hintUsed:boolean;mistakes:number;
  independentlyCompleted:boolean;speechVerified:boolean;timestamp:string;
};
export function matchesAcademyAnswer(answer:string,expected:string):boolean{
  const clean=(v:string)=>v.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[’‘]/g,"'").replace(/[.,!?;:]+/g,'').replace(/\s+/g,' ').trim();
  return clean(answer)===clean(expected);
}
export function isAcademyTaskAnswerCorrect(task:AcademyTask,answer:string):boolean{
  return [task.answer,...(task.accepted??[])].some(expected=>matchesAcademyAnswer(answer,expected));
}
export function academyWords(sentence:string):{key:number;word:string}[]{
  return sentence.trim().split(/\s+/).map((word,key)=>({key,word}));
}
function stableSeed(value:string):number{
  let state=2166136261;
  for(const ch of value)state=Math.imul(state^ch.charCodeAt(0),16777619);
  return state>>>0;
}
export function academyShuffle<T>(values:readonly T[],seed:string):T[]{
  const result=[...values];let state=stableSeed(seed);
  for(let i=result.length-1;i>0;i--){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const j=state%(i+1);[result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function makeDeck(scene:AcademyCase,level:AcademyLevel):readonly AcademyTask[]{
  const {id,zone,item,otherA,otherB,place,placeA,placeB,friend,icon}=scene;
  const pre=level==='Pre-A1',a1=level==='A1';
  const heard=pre?'Find the '+item+'.':a1?'Please bring the '+item+' to '+friend+'.':
    'Before you go to the '+place+', find the '+item+' for '+friend+'.';
  const read=pre?friend+' is at the '+place+'.':a1?friend+' is waiting near the '+place+'.':
    'The note says '+friend+' will meet you beside the '+place+' after you find the '+item+'.';
  const question=pre?'What do you see?':a1?'Did you find the '+item+'?':
    'Why did you choose the '+item+'?';
  const reply=(object:string)=>pre?'The '+object+'.':a1?'Yes, I found the '+object+'.':
    'Because you asked for the '+object+'.';
  const build=pre?'I see the '+item+'.':a1?'I can help '+friend+' find the '+item+'.':
    friend+' needs the '+item+' before we visit the '+place+'.';
  const write=pre?item:a1?'I found the '+item+'.':
    'I found the '+item+' near the '+place+'.';
  const acceptedWrite=pre?[item.replace(/^the /,'')]:
    a1?['I have found the '+item+'.']:
    ['Near the '+place+', I found the '+item+'.',
     'I found the '+item+' by the '+place+'.'];
  const stem=id+'-'+level.replace('-','').toLowerCase();
  return [
    {id:stem+'-hear',caseId:id,zone,kind:'hear',skill:'listening',
      prompt:'Önce İngilizce sesi dinle. Hangi nesne söyleniyor?',line:heard,
      options:academyShuffle([item,otherA,otherB],stem+'-hear'),answer:item,icon,
      feedback:'Doğru nesneyi buldun.'},
    {id:stem+'-read',caseId:id,zone,kind:'read',skill:'reading',
      prompt:pre?'Cümleyi oku. Arkadaşımız nerede?':'İngilizce ipucunu oku. Buluşma yeri neresi?',
      line:read,options:academyShuffle([place,placeA,placeB],stem+'-read'),
      answer:place,icon,feedback:'İpucunu doğru anladın.'},
    {id:stem+'-talk',caseId:id,zone,kind:'talk',skill:'dialogue',
      prompt:'Arkadaşına uygun İngilizce cevabı ver. İstersen sesinle dene.',
      line:friend+': '+question,
      options:academyShuffle([reply(item),reply(otherA),reply(otherB)],stem+'-talk'),
      answer:reply(item),icon,feedback:friend+' cevabını anladı.'},
    {id:stem+'-build',caseId:id,zone,kind:'build',skill:'sentence',
      prompt:'İngilizce kelimeleri doğru sıraya koy.',line:'',options:[],answer:build,icon,
      feedback:'Anlamlı bir cümle oluşturdun.'},
    {id:stem+'-write',caseId:id,zone,kind:'write',skill:'writing',
      prompt:pre?'Nesnenin İngilizce adını yaz.':a1?'Bulduğun nesneyi anlatan kısa bir cümle yaz.':'Bulduğun nesneyi ve yerini anlatan bir cümle yaz.',
      line:'',options:[],answer:write,icon,feedback:'Mesajın hazır!',accepted:acceptedWrite}
  ];
}
export function buildAcademyPlan(zone:number,level:AcademyLevel,variant:number):AcademyPlan{
  if(!Number.isInteger(zone)||zone<1||zone>6||
     !['Pre-A1','A1','A2'].includes(level)||!Number.isSafeInteger(variant)||variant<0)
    throw new RangeError('Invalid academy plan');
  const variants=ACADEMY_CASES.filter(c=>c.zone===zone);
  const scene=variants[variant%variants.length];
  return {zone,placement:level,caseId:scene.id,caseTitle:scene.title,
    mission:scene.mission,result:scene.result,icon:scene.icon,tasks:makeDeck(scene,level)};
}
export function nextAcademyVariant(completedRuns:number):number{
  return Math.max(0,Math.floor(completedRuns))%3;
}
export type AcademyReview = {
  skill:AcademySkill;attempts:number;independent:number;due:boolean;
  status:'new'|'practice'|'review'|'progressing';
};
const SKILLS:readonly AcademySkill[]=['listening','reading','dialogue','sentence','writing'];
const INTERVAL=[0,12*3600000,86400000,3*86400000,7*86400000,14*86400000] as const;
/** Transparent scheduling heuristic; not psychometrically validated mastery. */
export function academySkillReview(rows:readonly AcademyAnswer[],now:number=Date.now(),level?:AcademyLevel):AcademyReview[]{
  return SKILLS.map(skill=>{
    const ordered=rows.filter(r=>r.skill===skill&&(!level||r.placement===level)&&Number.isFinite(Date.parse(r.timestamp))&&
      Date.parse(r.timestamp)<=now).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
    if(!ordered.length)return {skill,attempts:0,independent:0,due:false,status:'new' as const};
    let streak=0,independent=0;
    for(const r of ordered){
      if(r.independentlyCompleted&&r.firstTryCorrect){streak++;independent++;}
      else streak=0;
    }
    const last=ordered[ordered.length-1];
    const due=streak===0||now-Date.parse(last.timestamp)>=INTERVAL[Math.min(streak,INTERVAL.length-1)];
    return {skill,attempts:ordered.length,independent,due,status:due?'review':streak>=2?'progressing':'practice'};
  });
}


/** First-line story copy is deliberately neutral: never leaks the correct
 * listening target (e.g. colour or location) before the child hears it. */
export function academySafeMission(zone:number):string{
  const zoneDef=ACADEMY_ZONES.find(z=>z.id===zone);
  return zoneDef?.intro??'Lumi ile İngilizce ipuçlarını keşfet.';
}
/** Two-stage scaffolding; only stage two reveals the exact model answer. */
export function academyHint(task:AcademyTask,stage:1|2):string{
 if(stage===2)return 'Örnek cevap: '+task.answer;
 switch(task.kind){
 case 'hear':return 'Önce sesi dinle. Seçeneklerdeki nesne adlarını karşılaştır. Gerekirse tekrar dinle.';
 case 'read':return 'İngilizce cümlede yer belirten kelimeyi bul. Seçenekleri tek tek oku.';
 case 'talk':return 'Arkadaşının sorusuna bak. Cevabında aynı nesneden söz et.';
 case 'build':return 'İlk kelime büyük harfle başlar. İngilizce cümlede kim, ne yapıyor, nerede sırasını düşün.';
 case 'write':return task.answer.includes(' ')?'Bir cümle oluştururken özneyle başla ve noktalama işaretini unutma.':'Nesnenin İngilizce adını hatırlamaya çalış. Sesli örneği dinleyebilirsin.';
 }
}
/** Correct answer choices are shuffled per *round* without changing the
 * authored answer or the stable identity of a task. */
export function academyRoundOptions(task:AcademyTask,round:number):readonly string[]{
 return task.options.length?academyShuffle(task.options,task.id+'-round-'+Math.max(0,Math.floor(round))):[];
}
export function academyReviewPriority(rows:readonly AcademyAnswer[],level:AcademyLevel,now:number=Date.now()){
 const due=academySkillReview(rows,now,level).filter(x=>x.due);
 return due.sort((a,b)=>a.independent-b.independent||a.attempts-b.attempts)[0]??null;
}


/** Targeted three-question practice. It never replaces full-zone completion,
 * awards no stars and does not advance the six-zone unlocking sequence.
 * Task identities are shared with their underlying authored cases so that
 * spaced repetition can be measured without fabricated new content. */
export function buildAcademyFocusPlan(
 zone:number,level:AcademyLevel,skill:AcademySkill,rotation:number
):AcademyPlan {
 if(!Number.isInteger(zone)||zone<1||zone>6||
   !['Pre-A1','A1','A2'].includes(level)||!SKILLS.includes(skill)||
   !Number.isSafeInteger(rotation)||rotation<0)
  throw new RangeError('Invalid academy practice');
 const cases=ACADEMY_CASES.filter(s=>s.zone===zone);
 const selected=academyShuffle(cases,level+'-'+skill+'-'+rotation).map(scene=>{
  const task=makeDeck(scene,level).find(t=>t.skill===skill);
  if(!task)throw new Error('Missing authored skill task');
  return task;
 });
 const zoneDef=ACADEMY_ZONES[zone-1];
 return {
  zone,placement:level,caseId:'practice-'+zone+'-'+skill,
  caseTitle:zoneDef.name+' · kısa tekrar',
  mission:'Üç küçük İngilizce göreviyle bu beceriyi güçlendir.',
  result:'Yeni bir alıştırma turu tamamladın.',
  icon:'🪄',tasks:selected
 };
}
