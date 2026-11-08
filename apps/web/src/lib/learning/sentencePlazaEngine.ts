/**
 * Cümle Meydanı · Uyanan Meydan
 * 6 fully playable missions, curriculum-first and reproducible question decks.
 * The scene is the reward for a meaningful English sentence, not a substitute
 * for producing it. Every template is human authored and grammatically checked.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {SentenceAnswerEvidence} from '@ventra/shared';

export const SENTENCE_PLAZA_GAME_ID='island_sentence_square_plaza';
export const SENTENCE_PLAZA_MISSIONS=[
 {id:1,title:'Renklerin Uyanışı',icon:'🎨',skill:'describing',rule:'Bir şeyi tarif ederken özne + is + özellik kullanırız.',model:'The flower is yellow.',modelTr:'Çiçek sarı.',story:'Meydanın renk kristalleri sönmüş. İngilizce cümlelerle ışıklarını geri getir.'},
 {id:2,title:'Yeni Dostlar',icon:'🐾',skill:'introducing',rule:'Bir varlığı tanıtırken This is a… veya There is a… yapısını kullanırız.',model:'This is a rabbit.',modelTr:'Bu bir tavşan.',story:'Meydanın dostları kayboldu. İngilizce cümle kur, karakterleri geri çağır.'},
 {id:3,title:'Gizli Yerler',icon:'🧭',skill:'location',rule:'Yer tarif etmek için under, behind, next to ve near gibi kelimeler kullanırız.',model:'The cat is under the tree.',modelTr:'Kedi ağacın altında.',story:'Meydandaki dostlar yollarını kaybetti. Doğru yer cümlesiyle onları bul.'},
 {id:4,title:'Hareket Büyüsü',icon:'🪽',skill:'action',rule:'Can + fiil yetenek belirtir. Is + fiil-ing ise şu anda yapılan eylemi anlatır.',model:'The bird can fly.',modelTr:'Kuş uçabilir.',story:'Şehrin hareket büyüleri durdu. Doğru İngilizceyle dostları yeniden harekete geçir.'},
 {id:5,title:'İstekler Meydanı',icon:'🍎',skill:'preference',rule:'I like… sevdiğimiz bir şeyi anlatır. Because ile nedenini açıklayabiliriz.',model:'I like apples.',modelTr:'Elmaları severim.',story:'Festival için karakterlerin sevdiği yiyecekleri İngilizceyle anlat.'},
 {id:6,title:'Fener Festivali',icon:'🏮',skill:'transfer',rule:'Öğrendiğin renk, nesne, eylem ve yer ifadelerini yeni bir sahnede birlikte kullan.',model:'The blue bird can fly.',modelTr:'Mavi kuş uçabilir.',story:'Meydanı aydınlatan son büyü için farklı İngilizce yapıları birleştir.'}
] as const;
export type PlazaMission=1|2|3|4|5|6;
export type PlazaSkill=typeof SENTENCE_PLAZA_MISSIONS[number]['skill'];
export type PlazaSentenceKind='statement'|'question'|'negative'|'instruction'|'reason'|'contrast'|'preference'|'request';
export type PlazaChallengeMode='construct'|'repair'|'scene';
export type PlazaActor='lantern'|'flower'|'house'|'cat'|'dog'|'bird'|'rabbit'|'apple'|'balloon';
export type PlazaAction='glow'|'appear'|'move'|'fly'|'jump'|'run'|'sleep'|'celebrate'|'remove';
export interface PlazaSceneEffect{actor:PlazaActor;color?:string;place?:string;food?:string;action:PlazaAction;count?:number;}
export interface PlazaQuestion{
 id:string;mission:PlazaMission;skill:PlazaSkill;englishLevel:EnglishPlacement;
 kind:PlazaSentenceKind;mode:PlazaChallengeMode;
 cue:string;scene:PlazaSceneEffect;sentence:string;tokens:string[];
 brokenSentence?:string;sceneChoices?:{id:string;label:string;icon:string}[];correctSceneChoice?:string;
 decoys:string[];explanation:string;vocabulary:readonly {en:string;tr:string}[];
}
export interface PlazaDeck{mission:PlazaMission;questions:PlazaQuestion[];grade:number|null;englishLevel:EnglishPlacement;seed:number;}
type Theme={actor:PlazaActor;label:string;color?:string;place?:string;action?:PlazaAction;value?:string};
const COLORS=[{name:'red',tr:'kırmızı'},{name:'blue',tr:'mavi'},{name:'green',tr:'yeşil'},{name:'yellow',tr:'sarı'}] as const;
const ANIMALS=[{actor:'cat',en:'cat',tr:'kedi'},{actor:'dog',en:'dog',tr:'köpek'},
 {actor:'bird',en:'bird',tr:'kuş'},{actor:'rabbit',en:'rabbit',tr:'tavşan'}] as const;
const LOCATIONS=[{en:'under the tree',tr:'ağacın altında'},{en:'behind the house',tr:'evin arkasında'},
 {en:'next to the fountain',tr:'çeşmenin yanında'},{en:'near the tree',tr:'ağacın yakınında'}] as const;
const ACTIONS=[
 {actor:'bird',en:'bird',tr:'kuş',verb:'fly',ing:'flying',trAction:'uçmasını'},
 {actor:'rabbit',en:'rabbit',tr:'tavşan',verb:'jump',ing:'jumping',trAction:'zıplamasını'},
 {actor:'dog',en:'dog',tr:'köpek',verb:'run',ing:'running',trAction:'koşmasını'},
 {actor:'cat',en:'cat',tr:'kedi',verb:'sleep',ing:'sleeping',trAction:'uyumasını'}
] as const;
const FOODS=[
 {en:'apples',tr:'elmaları',why:'sweet',whyTr:'tatlı'},{en:'bananas',tr:'muzları',why:'sweet',whyTr:'tatlı'},
 {en:'carrots',tr:'havuçları',why:'healthy',whyTr:'sağlıklı'},{en:'oranges',tr:'portakalları',why:'juicy',whyTr:'sulu'},
 {en:'pears',tr:'armutları',why:'sweet',whyTr:'tatlı'},{en:'grapes',tr:'üzümleri',why:'sweet',whyTr:'tatlı'},
 {en:'strawberries',tr:'çilekleri',why:'sweet',whyTr:'tatlı'},{en:'peaches',tr:'şeftalileri',why:'juicy',whyTr:'sulu'}
] as const;
const split=(sentence:string)=>sentence.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean);
const shuffle=<T>(items:readonly T[],random:()=>number):T[]=>{
 const arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;
};
function seeded(seed:number):()=>number{
 let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function create(mission:PlazaMission,level:EnglishPlacement,index:number):PlazaQuestion{
 const skill=SENTENCE_PLAZA_MISSIONS[mission-1].skill;
 let sentence='',cue='',explanation='',scene:PlazaSceneEffect={actor:'lantern',action:'glow'},vocabulary:{en:string;tr:string}[]=[];
 const advanced=level==='A2',intermediate=level==='A1';
 if(mission===1){
  const color=COLORS[index%COLORS.length];
  const actor=(['lantern','flower','house','balloon'] as const)[Math.floor(index/4)%4];
  const label={lantern:'fener',flower:'çiçek',house:'ev',balloon:'balon'}[actor];
  sentence=advanced?`The ${actor} is ${color.name}, and the square looks bright.`:
    intermediate?`The ${actor} is ${color.name}.`:
    Math.floor(index/4)===0?`It is ${color.name}.`:`The ${actor} is ${color.name}.`;
  cue=`${label[0].toUpperCase()+label.slice(1)} ${color.tr} olsun.`;
  explanation=advanced?'And iki düşünceyi bağlar.':'Is, özneyi renkle bağlar.';
  scene={actor,color:color.name,action:'glow'};vocabulary=[{en:actor,tr:label},{en:color.name,tr:color.tr}];
 }else if(mission===2){
  const animal=ANIMALS[index%ANIMALS.length];
  const color=COLORS[Math.floor(index/4)%COLORS.length];
  sentence=advanced?`There is a ${color.name} ${animal.en} in the square, and it looks happy.`:
    intermediate?`There is a ${color.name} ${animal.en} in the square.`:`This is a ${color.name} ${animal.en}.`;
  cue=`Meydana ${color.tr} bir ${animal.tr} çağır.`;
  explanation=intermediate||advanced?'There is, bir yerde bir şey bulunduğunu belirtir.':'This is a…, karşımızdaki bir varlığı tanıtır.';
  scene={actor:animal.actor,action:'appear',color:color.name};vocabulary=[{en:animal.en,tr:animal.tr},{en:color.name,tr:color.tr}];
 }else if(mission===3){
  const animal=ANIMALS[index%ANIMALS.length],position=LOCATIONS[Math.floor(index/4)%LOCATIONS.length];
  sentence=advanced?`The little ${animal.en} is ${position.en}, and it is safe.`:
    intermediate?`The ${animal.en} is ${position.en}.`:`The ${animal.en} is ${position.en}.`;
  cue=`${animal.tr[0].toUpperCase()+animal.tr.slice(1)} ${position.tr} olsun.`;
  explanation='Is + yer ifadesi, nesnenin nerede olduğunu bildirir.';
  scene={actor:animal.actor,place:position.en,action:'move'};
  vocabulary=[{en:animal.en,tr:animal.tr},{en:position.en,tr:position.tr}];
 }else if(mission===4){
  const a=ACTIONS[index%ACTIONS.length];
  const location=LOCATIONS[Math.floor(index/4)%LOCATIONS.length];
  const suffix=['now','today','here','again'][Math.floor(index/4)%4];
  sentence=advanced?`The ${a.en} is ${a.ing} ${location.en} because it feels safe.`:
    intermediate?`The ${a.en} is ${a.ing} ${location.en}.`:`The ${a.en} can ${a.verb} ${suffix}.`;
  cue=`${a.tr[0].toUpperCase()+a.tr.slice(1)} ${location.tr} ${a.trAction} sağla.`;
  explanation=advanced?'Because, bir durumun nedenini açıklar.':intermediate?'Is + -ing şu anda gerçekleşen eylemdir.':'Can + fiil, bir şeyi yapabilmeyi belirtir.';
  scene={actor:a.actor,place:location.en,action:({fly:'fly',jump:'jump',run:'run',sleep:'sleep'} as const)[a.verb]};
  vocabulary=[{en:a.en,tr:a.tr},{en:a.verb,tr:a.trAction}];
 }else if(mission===5){
  const f=FOODS[index%FOODS.length];
  const occasion=Math.floor(index/FOODS.length)%3;
  sentence=advanced?[
   `I like ${f.en} because they are ${f.why}.`,
   `I like ${f.en} because they taste good.`,
   `I enjoy ${f.en} because they are ${f.why}.`][occasion]:
   intermediate?[
    `I like ${f.en}, but I do not like lemons.`,
    `I like ${f.en} and I like fruit.`,
    `I like ${f.en} in the morning.`][occasion]:
    [`I like ${f.en}.`,`I really like ${f.en}.`,`I like ${f.en} today.`][occasion];
  cue=`Festivalde ${f.tr} sevdiğini söyle.`;
  explanation=advanced?'Because, nedenimizi anlatır.':intermediate?'But, iki farklı düşünceyi karşılaştırır.':'I like…, sevdiğimiz şeyi anlatır.';
  scene={actor:'apple',action:'celebrate',food:f.en,color:index%2===0?'red':'yellow'};
  vocabulary=[{en:f.en,tr:f.tr},{en:advanced?'because':'like',tr:advanced?'çünkü':'sevmek'}];
 }else{
  const a=ACTIONS[index%ACTIONS.length],color=COLORS[Math.floor(index/4)%COLORS.length];
  // The final combines description and action in one meaningful transformation.
  sentence=advanced?`The ${color.name} ${a.en} is ${a.ing} because it is happy.`:
    intermediate?`The ${color.name} ${a.en} is ${a.ing} in the square.`:
    `The ${color.name} ${a.en} can ${a.verb}.`;
  cue=`${color.tr} ${a.tr} ${a.trAction} sağla.`;
  explanation=advanced?'Renk + isim + eylem + because ile neden belirtiyoruz.':intermediate?'Özellik, isim ve eylem bir cümlede birleşiyor.':'Renk + isim + can + fiil bir cümlede birleşir.';
  scene={actor:a.actor,color:color.name,action:({fly:'fly',jump:'jump',run:'run',sleep:'sleep'} as const)[a.verb]};
  vocabulary=[{en:color.name,tr:color.tr},{en:a.en,tr:a.tr},{en:a.verb,tr:a.trAction}];
 }
 const distractors= mission===1?['green','red','is','are','house','blue']:
  mission===2?['the','a','is','are','There','This','dog']:
  mission===3?['in','on','above','behind','tree','under']:
  mission===4?['can','is','running','sleeping','fly','runs']:
  mission===5?['love','like','not','are','because','but']:
  ['can','is','because','are','cat','blue'];
 return {id:'plaza:'+mission+':'+level+':'+index,mission,skill,englishLevel:level,
   kind:advanced?'reason':'statement',mode:'construct',sentence,cue,scene,explanation,vocabulary,tokens:split(sentence),
   decoys:distractors.filter(w=>!split(sentence).includes(w)).slice(0,2)};
}

/** v2 editorial sentence families. Each new family has a distinct linguistic
 * purpose and a Turkish cue that actually describes its English meaning.
 * The ID includes v2 to avoid silently changing the meaning of stored v1 evidence.
 * Grade determines cognitive scaffold, not a child's English language placement. */
export const PLAZA_SENTENCE_KINDS:readonly PlazaSentenceKind[]=[
 'statement','question','negative','instruction','reason','contrast','preference','request'
];
type Lex={en:string;tr:string;icon?:string};
const V2_COLORS:readonly Lex[]=[
 {en:'red',tr:'kırmızı'},{en:'blue',tr:'mavi'},{en:'yellow',tr:'sarı'},
 {en:'green',tr:'yeşil'},{en:'purple',tr:'mor'},{en:'orange',tr:'turuncu'}
];
const article=(word:string)=>/^[aeiou]/i.test(word)?'an':'a';
const V2_ANIMALS:readonly {id:'cat'|'dog'|'bird'|'rabbit';en:string;tr:string;trAcc:string;icon:string}[]=[
 {id:'cat',en:'cat',tr:'kedi',trAcc:'kediyi',icon:'🐱'},{id:'dog',en:'dog',tr:'köpek',trAcc:'köpeği',icon:'🐶'},
 {id:'bird',en:'bird',tr:'kuş',trAcc:'kuşu',icon:'🐦'},{id:'rabbit',en:'rabbit',tr:'tavşan',trAcc:'tavşanı',icon:'🐰'}
];
const V2_PLACES:readonly (Lex & {trDestination:string})[]=[
 {en:'under the tree',tr:'ağacın altında',trDestination:'ağacın altına'},
 {en:'behind the house',tr:'evin arkasında',trDestination:'evin arkasına'},
 {en:'next to the fountain',tr:'çeşmenin yanında',trDestination:'çeşmenin yanına'},
 {en:'near the tree',tr:'ağacın yakınında',trDestination:'ağacın yakınına'}
];
const V2_FOODS:readonly (Lex & {trBare:string})[]=[
 {en:'apples',tr:'elmaları',trBare:'elma',icon:'🍎'},{en:'bananas',tr:'muzları',trBare:'muz',icon:'🍌'},
 {en:'carrots',tr:'havuçları',trBare:'havuç',icon:'🥕'},{en:'oranges',tr:'portakalları',trBare:'portakal',icon:'🍊'},
 {en:'pears',tr:'armutları',trBare:'armut',icon:'🍐'},{en:'grapes',tr:'üzümleri',trBare:'üzüm',icon:'🍇'},
 {en:'strawberries',tr:'çilekleri',trBare:'çilek',icon:'🍓'},{en:'peaches',tr:'şeftalileri',trBare:'şeftali',icon:'🍑'}
];
type NewSentence={key:string;sentence:string;cue:string;kind:PlazaSentenceKind;scene:PlazaSceneEffect;
 explanation:string;vocabulary:{en:string;tr:string}[];mode?:PlazaChallengeMode;
 choices?:{id:string;label:string;icon:string}[];choice?:string};
function buildV2(mission:PlazaMission,level:EnglishPlacement):PlazaQuestion[]{
 const results:PlazaQuestion[]=[];
 const a1=level!=='Pre-A1',a2=level==='A2';
 const push=(d:NewSentence)=>{
  const tokens=split(d.sentence),words=new Set(tokens);
  const stock=['are','is','can','not','in','on','want','wants','but','because','has','do','does','where','the','a'];
  const decoys=stock.filter(w=>!words.has(w)).slice(0,3);
  const mode=d.mode??'construct';
  // Replace ONE meaningful word, not an arbitrary grammar token.
  // The child compares a valid English sentence against the displayed Turkish goal:
  // "Is the dog UNDER the house?" -> "Köpek evin ARKASINDA mı?"
  // Both are grammatical, but only one expresses the target meaning.
  const alternatives:Record<string,string>={
   red:'blue',blue:'green',green:'yellow',yellow:'purple',purple:'orange',orange:'red',
   cat:'dog',dog:'cat',bird:'rabbit',rabbit:'bird',cats:'dogs',dogs:'cats',
   birds:'rabbits',rabbits:'birds',
   under:'behind',behind:'under',near:'under',next:'near',
   fly:'jump',jump:'run',run:'sleep',sleep:'fly',
   flying:'jumping',jumping:'running',running:'sleeping',sleeping:'flying',
   apples:'bananas',bananas:'apples',carrots:'oranges',oranges:'carrots',
   pears:'grapes',grapes:'pears',strawberries:'peaches',peaches:'strawberries',
   lemons:'apples'
  };
  const priority:Record<PlazaMission,readonly string[]>={
   1:V2_COLORS.map(c=>c.en),
   2:[...V2_COLORS.map(c=>c.en),'cat','dog','bird','rabbit','cats','dogs','birds','rabbits'],
   3:['behind','under','near','cat','dog','bird','rabbit'],
   4:['fly','jump','run','sleep','flying','jumping','running','sleeping'],
   5:V2_FOODS.map(f=>f.en),
   6:['cat','dog','bird','rabbit',...V2_COLORS.map(c=>c.en)]
  };
  const replacementIndex=priority[mission]
    .map(w=>tokens.findIndex(t=>t===w)).find(i=>i>=1)??-1;
  const wrongAt=replacementIndex>=0?replacementIndex:Math.max(1,Math.floor(tokens.length/2));
  const wrong=alternatives[tokens[wrongAt]]??decoys.find(word=>word!==tokens[wrongAt])??'are';
  const corrupted=tokens.map((w,i)=>i===wrongAt?wrong:w).join(' ')+(d.sentence.endsWith('?')?'?':'.');
  results.push({id:'plaza:v2:'+mission+':'+level+':'+d.key,mission,
   skill:SENTENCE_PLAZA_MISSIONS[mission-1].skill,englishLevel:level,
   kind:d.kind,mode,scene:d.scene,sentence:d.sentence,
   cue:d.cue.replace(/^(\p{L})/u,ch=>ch.toLocaleUpperCase('tr-TR')),
   tokens,decoys,explanation:d.explanation,vocabulary:d.vocabulary,
   ...(mode==='repair'?{brokenSentence:corrupted}:{}),
   ...(mode==='scene'?{sceneChoices:d.choices,correctSceneChoice:d.choice}:{})});
 };
 const v=(...list:{en:string;tr:string}[])=>list;
 if(mission===1){
  const objects=[{id:'lantern' as const,tr:'fener'},{id:'flower' as const,tr:'çiçek'},
   {id:'house' as const,tr:'ev'},{id:'balloon' as const,tr:'balon'}];
  for(const o of objects)for(const c of V2_COLORS){
   const effect:PlazaSceneEffect={actor:o.id,color:c.en,action:'glow'};
   const words=v({en:o.id,tr:o.tr},c);
   const pre=['The '+o.id+' is '+c.en+'.','This is '+article(c.en)+' '+c.en+' '+o.id+'.'];
   const cues=[o.tr+' '+c.tr+' renkte.','Bu, '+c.tr+' bir '+o.tr+'.'];
   pre.forEach((sentence,i)=>push({key:'description:'+o.id+':'+c.en+':'+i,sentence,
    cue:cues[i],kind:'statement',scene:effect,
    explanation:'The ... is ... özellik bildirir; This is a ... bir nesneyi tanıtır.',
    vocabulary:words,mode:i===1?'scene':'construct',
    choices:[c,...V2_COLORS.filter(x=>x.en!==c.en).slice(0,3)].map(x=>({id:x.en,label:x.tr,icon:'🎨'})),choice:c.en}));
   if(a1){
    push({key:'question:'+o.id+':'+c.en,kind:'question',sentence:'Is the '+o.id+' '+c.en+'?',
     cue:o.tr+' '+c.tr+' renkte mi? İngilizce sor.',scene:effect,
     explanation:'Soru cümlesinde is, öznenin önüne gelir.',vocabulary:words,mode:'repair'});
    // The visual must NOT show the forbidden color: the color of a true negative is its alternative.
    const other=V2_COLORS[(V2_COLORS.indexOf(c)+1)%V2_COLORS.length];
    push({key:'negative:'+o.id+':'+c.en,kind:'negative',sentence:'The '+o.id+' is not '+c.en+'.',
     cue:o.tr+' '+c.tr+' renkte değil.',scene:{...effect,color:other.en},
     explanation:'Is not, bir özelliği reddeder.',vocabulary:words,mode:'construct'});
   }
   if(a2)push({key:'contrast:'+o.id+':'+c.en,kind:'contrast',
    sentence:'The '+o.id+' is '+c.en+', but the sky is blue.',
    cue:o.tr+' '+c.tr+' renkte, fakat gökyüzü mavi.',scene:effect,
    explanation:'But iki farklı bilgiyi karşılaştırır.',vocabulary:v(...words,{en:'but',tr:'ama'}),mode:'repair'});
  }
 } else if(mission===2){
  for(const animal of V2_ANIMALS)for(const color of V2_COLORS){
   const scene:PlazaSceneEffect={actor:animal.id,color:color.en,action:'appear'};
   const words=v({en:animal.en,tr:animal.tr},color);
   const choices=V2_ANIMALS.map(x=>({id:x.id,label:x.tr,icon:x.icon}));
   push({key:'see:'+animal.id+':'+color.en,kind:'statement',sentence:'I see '+article(color.en)+' '+color.en+' '+animal.en+'.',
    cue:color.tr+' bir '+animal.tr+' görüyorum.',scene,explanation:'I see, gördüğün varlığı tanıtır.',
    vocabulary:words,mode:'scene',choices,choice:animal.id});
   if(a1){
    push({key:'there:'+animal.id+':'+color.en,kind:'statement',
     sentence:'There is '+article(color.en)+' '+color.en+' '+animal.en+' in the square.',
     cue:'Meydanda '+color.tr+' bir '+animal.tr+' var.',scene,
     explanation:'There is, tek bir varlığın bulunduğunu söyler.',vocabulary:words,mode:'construct'});
    const plural=animal.id==='bird'?'birds':animal.en+'s';
    push({key:'plural:'+animal.id+':'+color.en,kind:'statement',
     sentence:'There are two '+color.en+' '+plural+' in the square.',
     cue:'Meydanda iki '+color.tr+' '+animal.tr+' var.',scene:{...scene,count:2},
     explanation:'There are, birden fazla varlık olduğunu söyler.',vocabulary:v(...words,{en:'two',tr:'iki'}),mode:'repair'});
   }
   if(a2)push({key:'cause:'+animal.id+':'+color.en,kind:'reason',
    sentence:'There is '+article(color.en)+' '+color.en+' '+animal.en+' because the festival has started.',
    cue:'Festival başladığı için '+color.tr+' bir '+animal.tr+' burada.',
    scene,explanation:'Because, nedeni bildirir.',vocabulary:v(...words,{en:'because',tr:'çünkü'}),mode:'construct'});
  }
 } else if(mission===3){
  for(const animal of V2_ANIMALS)for(const place of V2_PLACES){
   const scene:PlazaSceneEffect={actor:animal.id,place:place.en,action:'move'};
   const words=v({en:animal.en,tr:animal.tr},place);
   const choices=V2_PLACES.map((p,i)=>({id:p.en,label:p.tr,icon:['🌳','🏠','⛲','🌲'][i]}));
   push({key:'where:'+animal.id+':'+place.en,kind:'statement',
    sentence:'The '+animal.en+' is '+place.en+'.',
    cue:animal.tr+' '+place.tr+'.',scene,
    explanation:'Is + yer ifadesi, nerede olduğunu gösterir.',vocabulary:words,
    mode:'scene',choices,choice:place.en});
   if(a1){
    push({key:'command:'+animal.id+':'+place.en,kind:'instruction',
     sentence:'Put the '+animal.en+' '+place.en+'.',
     cue:animal.trAcc+' '+place.trDestination+' yerleştir.',scene,
     explanation:'Put ile başlayan emir cümlesi bir hareket ister.',vocabulary:words,mode:'construct'});
    push({key:'ask:'+animal.id+':'+place.en,kind:'question',
     sentence:'Is the '+animal.en+' '+place.en+'?',
     cue:animal.tr+' '+place.tr+' mı? İngilizce sor.',scene,
     explanation:'Is başa gelince yer sorusuna dönüşür.',vocabulary:words,mode:'repair'});
   }
   if(a2)push({key:'cause:'+animal.id+':'+place.en,kind:'reason',
    sentence:'The '+animal.en+' is '+place.en+' because it wants to hide.',
    cue:animal.tr+' saklanmak istediği için '+place.tr+'.',scene,
    explanation:'Because, bir yer seçiminde neden belirtir.',vocabulary:v(...words,{en:'because',tr:'çünkü'}),mode:'construct'});
  }
 } else if(mission===4){
  const actions=[{id:'bird' as const,tr:'kuş',verb:'fly',ing:'flying',trVerb:'uçmak',trAbility:'uçabilir',trProgress:'uçuyor',effect:'fly' as const},
   {id:'rabbit' as const,tr:'tavşan',verb:'jump',ing:'jumping',trVerb:'zıplamak',trAbility:'zıplayabilir',trProgress:'zıplıyor',effect:'jump' as const},
   {id:'dog' as const,tr:'köpek',verb:'run',ing:'running',trVerb:'koşmak',trAbility:'koşabilir',trProgress:'koşuyor',effect:'run' as const},
   {id:'cat' as const,tr:'kedi',verb:'sleep',ing:'sleeping',trVerb:'uyumak',trAbility:'uyuyabilir',trProgress:'uyuyor',effect:'sleep' as const}];
  for(const act of actions)for(const place of V2_PLACES){
   const scene:PlazaSceneEffect={actor:act.id,place:place.en,action:act.effect};
   const words=v({en:act.id,tr:act.tr},{en:act.verb,tr:act.trVerb},place);
   const choices=actions.map(o=>({id:o.verb,label:o.trVerb,icon:o.effect==='fly'?'🪽':'✨'}));
   push({key:'ability:'+act.id+':'+place.en,kind:'statement',
    sentence:'The '+act.id+' can '+act.verb+' '+place.en+'.',cue:act.tr+' '+place.tr+' '+act.trAbility+'.',scene,
    explanation:'Can + fiilin yalın hâli yeteneği anlatır.',vocabulary:words,
    mode:'scene',choices,choice:act.verb});
   if(a1){
    push({key:'progressive:'+act.id+':'+place.en,kind:'statement',
     sentence:'The '+act.id+' is '+act.ing+' '+place.en+'.',
     cue:act.tr+' şu anda '+place.tr+' '+act.trProgress+'.',scene,
     explanation:'Is + -ing şu anda olan eylemdir.',vocabulary:words,mode:'construct'});
    push({key:'question:'+act.id+':'+place.en,kind:'question',
     sentence:'Can the '+act.id+' '+act.verb+'?',
     cue:act.tr+' '+act.trAbility+' mi? İngilizce sor.',scene,
     explanation:'Can başa gelince bir yetenek sorusu olur.',vocabulary:words,mode:'repair'});
   }
   if(a2)push({key:'reason:'+act.id+':'+place.en,kind:'reason',
    sentence:'The '+act.id+' is '+act.ing+' '+place.en+' because it feels happy.',
    cue:act.tr+' mutlu olduğu için '+place.tr+' '+act.trProgress+'.',
    scene,explanation:'Because, eylemin nedenini açıklar.',vocabulary:v(...words,{en:'because',tr:'çünkü'}),mode:'construct'});
  }
 } else if(mission===5){
  for(const food of V2_FOODS){
   const scene:PlazaSceneEffect={actor:'apple',food:food.en,action:'celebrate'};
   const words=v(food);
   const choices=[food,...V2_FOODS.filter(f=>f.en!==food.en).slice(0,3)].map(f=>({id:f.en,label:f.tr,icon:f.icon??'🍎'}));
   push({key:'want:'+food.en,kind:'request',sentence:'I want '+food.en+'.',
    cue:food.trBare+' istiyorum.',scene,explanation:'I want bir isteği söyler.',vocabulary:words,
    mode:'scene',choices,choice:food.en});
   push({key:'like:'+food.en,kind:'preference',sentence:'I like '+food.en+'.',
    cue:food.trBare+' severim.',scene,explanation:'I like bir beğeniyi söyler.',vocabulary:words,mode:'construct'});
   if(a1){
    push({key:'negative:'+food.en,kind:'negative',sentence:'I do not want '+food.en+'.',
     cue:food.trBare+' istemiyorum.',scene:{...scene,action:'remove'},
     explanation:'Do not want, istemediğimiz şeyi belirtir.',vocabulary:words,mode:'repair'});
    push({key:'please:'+food.en,kind:'question',sentence:'Can I have some '+food.en+', please?',
     cue:'Biraz '+food.trBare+' iste. Kibarca İngilizce sor.',scene,
     explanation:'Can I have ... please? kibar bir soru cümlesidir.',vocabulary:words,mode:'scene',choices,choice:food.en});
   }
   if(a2){
    push({key:'why:'+food.en,kind:'reason',sentence:'I like '+food.en+' because they taste good.',
     cue:food.trBare+' seviyorum çünkü lezzetliler.',scene,
     explanation:'Because, sevme nedenini açıklar.',vocabulary:v(...words,{en:'because',tr:'çünkü'}),mode:'construct'});
    push({key:'contrast:'+food.en,kind:'contrast',
     sentence:'I want '+food.en+', but I do not want lemons.',
     cue:food.trBare+' istiyorum ama limon istemiyorum.',scene,
     explanation:'But karşıt iki isteği bağlar.',vocabulary:v(...words,{en:'but',tr:'ama'}),mode:'repair'});
   }
  }
 } else {
  for(const animal of V2_ANIMALS)for(const col of V2_COLORS)for(const place of V2_PLACES.slice(0,3)){
   const words=v({en:animal.en,tr:animal.tr},col,place);
   const base:PlazaSceneEffect={actor:animal.id,color:col.en,place:place.en,action:'move'};
   const choices=V2_ANIMALS.map(x=>({id:x.id,label:x.tr,icon:x.icon}));
   push({key:'location:'+animal.id+':'+col.en+':'+place.en,kind:'statement',
    sentence:'The '+col.en+' '+animal.en+' is '+place.en+'.',
    cue:col.tr+' '+animal.tr+' '+place.tr+'.',scene:base,
    explanation:'Sıfat + isim + is + yer bilgisi birleşir.',vocabulary:words,mode:'scene',
    choices,choice:animal.id});
   const action=animal.id==='bird'?'fly':animal.id==='rabbit'?'jump':animal.id==='dog'?'run':'sleep';
   const actTr=animal.id==='bird'?'uçabilir':animal.id==='rabbit'?'zıplayabilir':animal.id==='dog'?'koşabilir':'uyuyabilir';
   push({key:'ability:'+animal.id+':'+col.en+':'+place.en,kind:'statement',
    sentence:'The '+col.en+' '+animal.en+' can '+action+'.',
    cue:col.tr+' '+animal.tr+' '+actTr+'.',scene:{...base,action},
    explanation:'Renk + varlık + can + fiil bir cümle kurar.',vocabulary:words,mode:'construct'});
   if(a1){
    push({key:'put:'+animal.id+':'+col.en+':'+place.en,kind:'instruction',
     sentence:'Put the '+col.en+' '+animal.en+' '+place.en+'.',
     cue:col.tr+' '+animal.trAcc+' '+place.trDestination+' koy.',scene:base,
     explanation:'Emir cümlesi fiille başlar; yer ve özellik eklenebilir.',vocabulary:words,mode:'repair'});
   }
   if(a2)push({key:'reason:'+animal.id+':'+col.en+':'+place.en,kind:'reason',
    sentence:'The '+col.en+' '+animal.en+' is '+place.en+' because it wants to hide.',
    cue:col.tr+' '+animal.tr+' saklanmak istediği için '+place.tr+'.',scene:base,
    explanation:'Because sebep belirtir.',vocabulary:v(...words,{en:'because',tr:'çünkü'}),mode:'construct'});
  }
 }
 return [...new Map(results.map(q=>[q.sentence,q])).values()];
}
/** Report content variety before session creation and fail closed on shortages. */
export function plazaCurriculumPool(mission:PlazaMission,level:EnglishPlacement):PlazaQuestion[]{
 if(!Number.isInteger(mission)||mission<1||mission>6)throw new RangeError('Invalid mission');
 if(!['Pre-A1','A1','A2'].includes(level))throw new RangeError('Invalid English placement');
 return [...new Map(buildV2(mission,level).map(q=>[q.sentence,q])).values()];
}
export function evaluatePlazaSentence(task:PlazaQuestion,words:readonly string[]):{
 correct:boolean;incorrectIndex:number;explanation:string;
}{
 const first=task.tokens.findIndex((word,i)=>word!==words[i]);
 if(first>=0)return {correct:false,incorrectIndex:first,
  explanation:(first+1)+'. kelimenin konumunu kontrol et. '+task.explanation};
 if(words.length!==task.tokens.length)return {correct:false,incorrectIndex:words.length,
  explanation:'Cümlede eksik veya fazla kelime var.'};
 return {correct:true,incorrectIndex:-1,explanation:task.explanation};
}

/** Grade affects cognitive volume, not linguistic placement. */
export function plazaQuestionsForGrade(grade:number|null|undefined):number{
 return grade!=null&&grade>=1&&grade<=2?3:grade!=null&&grade>=5&&grade<=8?5:4;
}
export function planPlazaMission(input:{mission:PlazaMission;grade:number|null;englishLevel:EnglishPlacement;
 seed:number;history?:readonly SentenceAnswerEvidence[];knownWords?:readonly string[]}):PlazaDeck{
 const {mission,grade,englishLevel,seed}=input;
 if(!Number.isInteger(mission)||mission<1||mission>6)throw new RangeError('Unknown plaza mission');
 const random=seeded(seed^(mission*1009));
 const gradeLimit=grade!=null&&grade>=1&&grade<=2?10:grade!=null&&grade>=3&&grade<=4?13:22;
 const unique=plazaCurriculumPool(mission,englishLevel).filter(q=>q.tokens.length<=gradeLimit);
 const history=input.history??[];
 const weak=new Set(history.filter(e=>!e.firstTryCorrect||e.hintUsed).map(e=>e.questionId));
 const seen=new Set(history.map(e=>e.questionId));
 const familiar=new Set((input.knownWords??[]).map(word=>word.toLowerCase()));
 // Diversity is a learning constraint: multiple communicative forms, not just a changed noun.
 const buckets=new Map<PlazaSentenceKind,PlazaQuestion[]>();
 for(const item of unique){const group=buckets.get(item.kind)??[];group.push(item);buckets.set(item.kind,group);}
 const categories=shuffle([...buckets.keys()],random);
 const questions:PlazaQuestion[]=[];
 while(questions.length<plazaQuestionsForGrade(grade)){
  let found=false;
  for(const kind of categories){
   const group=buckets.get(kind)??[];
   if(!group.length)continue;
   const rank=(q:PlazaQuestion)=>{
    if(weak.has(q.id))return 0;
    const familiarCount=q.vocabulary.filter(v=>familiar.has(v.en.toLowerCase())).length;
    return (seen.has(q.id)?5:2)-Math.min(2,familiarCount)*0.7;
   };
   const picks=shuffle(group,random).sort((x,y)=>rank(x)-rank(y));
   const next=picks[0];questions.push(next);buckets.set(kind,group.filter(q=>q.id!==next.id));
   found=true;if(questions.length===plazaQuestionsForGrade(grade))break;
  }
  if(!found)break;
 }
 if(questions.length!==plazaQuestionsForGrade(grade))throw Error('Insufficient English curriculum diversity');
 const sampled=shuffle(questions,random);
 return {mission,grade,englishLevel,seed,questions:sampled};
}
/** Duplicate words are independent physical tiles. */
export function plazaWordTiles(task:PlazaQuestion,seed:number):{id:string;word:string;target:boolean}[]{
 const words=task.tokens.map((word,i)=>({id:`word-${i}`,word,target:true}));
 const extras=task.decoys.map((word,i)=>({id:`extra-${i}`,word,target:false}));
 const mixed=shuffle([...words,...extras],seeded(seed^0x65bda21));
 if(mixed.every((item,i)=>item.id===`word-${i}`))mixed.push(mixed.shift()!);
 return mixed;
}
export function plazaWordExpected(task:PlazaQuestion,position:number):string|null{
 return task.tokens[position]??null;
}
export function validatePlazaEvidence(rows:readonly SentenceAnswerEvidence[],plan:PlazaDeck):boolean{
 if(rows.length!==plan.questions.length||new Set(rows.map(x=>x.questionId)).size!==rows.length)return false;
 return rows.every((row,i)=>row.questionId===plan.questions[i].id&&row.skill===plan.questions[i].skill
  &&row.placement===plan.englishLevel&&Number.isInteger(row.mistakes)&&row.mistakes>=0
  &&typeof row.hintUsed==='boolean'&&typeof row.modelHeard==='boolean'
  &&row.firstTryCorrect===(row.mistakes===0&&!row.hintUsed&&!row.modelHeard)
  &&typeof row.timestamp==='string'&&Number.isFinite(Date.parse(row.timestamp)));
}
