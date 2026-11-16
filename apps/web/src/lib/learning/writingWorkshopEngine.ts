/** Yazı Atölyesi — original English writing curriculum.
 * Spelling, word ordering, and actual typed production are distinct evidence.
 * NEVER store children's typed text, handwriting, names or transcripts.
 * CEFR names denote internal difficulty tiers, not official certification.
 */
import {WORKSHOP_BONUS_CHAPTERS} from './writingWorkshopExpansion.ts';
import {WORKSHOP_EXTENDED_CHAPTERS} from './writingWorkshopExtended.ts';
export type WorkshopLevel='Pre-A1'|'A1'|'A2';
export type WorkshopMode='spell'|'assemble'|'write';
export type WorkshopTask={
 id:string;mode:WorkshopMode;promptTr:string;target:string;icon:string;
 accepted:readonly string[];
};
export type WorkshopChapter={
 id:number;title:string;subtitle:string;icon:string;color:string;
 quests:Readonly<Record<WorkshopLevel,readonly WorkshopTask[]>>;
};
export const WRITING_WORKSHOP_GAME_ID='island_sentence_workshop_writing' as const;
const q=(mode:WorkshopMode,promptTr:string,target:string,icon:string,accepted:readonly string[]=[]):
 Omit<WorkshopTask,'id'>=>({mode,promptTr,target,icon,accepted});
type RawChapter={
 title:string;subtitle:string;icon:string;color:string;
 pre:readonly Omit<WorkshopTask,'id'>[];
 a1:readonly Omit<WorkshopTask,'id'>[];
 a2:readonly Omit<WorkshopTask,'id'>[];
};
const catalog:readonly RawChapter[]=[
 {title:'Harf Postanesi',subtitle:'İlk kelimeler ve küçük notlar',icon:'✉️',color:'#f9b768',
  pre:[
   q('spell','Küçük kedinin adını harflerle kur.','cat','🐱'),
   q('assemble','Kediye bak! İngilizce cümleyi kur.','I see a cat.','🐈'),
   q('write','Resimdeki hayvanı İngilizce yaz.','cat','🐱'),
   q('assemble','Küçük bir cümle daha yaz.','It is a cat.','🐈'),
   q('spell','Köpeğin İngilizce adını kur.','dog','🐶')],
  a1:[
   q('spell','Postanede bir mektup var. İngilizcesini oluştur.','letter','✉️'),
   q('assemble','Mektubu yazdığını anlat.','I write a letter.','📝'),
   q('write','Bir kediyi gördüğünü İngilizce yaz.','I see a cat.','🐈'),
   q('assemble','Arkadaşına haber vermek için cümle kur.','My letter is ready.','💌'),
   q('write','Kısa bir mektup yazdığını İngilizce anlat.','I write a short letter.','✉️')],
  a2:[
   q('spell','Bir ileti için İngilizce kelime oluştur.','message','💬'),
   q('assemble','Arkadaşına mesaj yazdığını anlat.','I am writing a message for my friend.','💌'),
   q('write','Arkadaşına mesaj yazıyorsun. Tam cümle yaz.','I am writing a message for my friend.','✉️'),
   q('assemble','Arkadaşın üzgün olduğu için ona yazdın.','I wrote a message because my friend was sad.','💗'),
   q('write','İki cümlelik küçük bir not oluştur.','I wrote a short message. It made my friend happy.','📮')]
 },
 {title:'Dostluk Defteri',subtitle:'Arkadaşlar hakkında yaz',icon:'🐻',color:'#b7d9ff',
  pre:[
   q('spell','Arkadaşının kedisinin İngilizce adını kur.','cat','🐱'),
   q('assemble','Arkadaşını selamla.','Hello my friend!','👋'),
   q('write','Bir arkadaşın için İngilizce selam yaz.','hello','👋'),
   q('assemble','Arkadaş olduğunu söyle.','We are friends.','🐻'),
   q('spell','Arkadaş kelimesini İngilizce oluştur.','friend','🧸')],
  a1:[
   q('spell','Dostluk defterine arkadaş sözcüğünü yaz.','friend','🤝'),
   q('assemble','Arkadaşının nazik olduğunu söyle.','My friend is kind.','🧸'),
   q('write','Arkadaşın için kısa bir mesaj yaz.','You are my friend.','💌'),
   q('assemble','Birlikte oynadığınızı anlat.','We play in the park.','🌳'),
   q('write','Arkadaşını anlatan kısa cümleyi yaz.','My friend likes music.','🎶')],
  a2:[
   q('spell','İngilizce destek kelimesini oluştur.','support','🤗'),
   q('assemble','Arkadaşının neden özel olduğunu açıkla.','My friend is special because she is kind.','💛'),
   q('write','Bir dostluk cümlesi yaz.','We help each other when we feel sad.','🤝'),
   q('assemble','Dün arkadaşına yardım ettin.','Yesterday I helped my friend with a project.','🎨'),
   q('write','İki cümleyle dostluğun değerini yaz.','My friend is always kind. We enjoy learning together.','📖')]
 },
 {title:'Renkli Kartpostallar',subtitle:'Nesne ve yer tarifleri',icon:'🎨',color:'#f4b4d3',
  pre:[
   q('spell','Gökyüzünün rengini İngilizce oluştur.','blue','💙'),
   q('assemble','Mavi bir kuş gördün. Cümleyi sırala.','I see a blue bird.','🐦'),
   q('write','Güneşin rengini İngilizce yaz.','yellow','☀️'),
   q('assemble','Kırmızı bir elma tarif et.','It is a red apple.','🍎'),
   q('spell','Kırmızı rengini harflerle kur.','red','❤️')],
  a1:[
   q('spell','Güzel bir manzarayı anlatan sözcüğü kur.','beautiful','🌈'),
   q('assemble','Parktaki yeşil ağacı anlat.','There is a green tree.','🌳'),
   q('write','Küçük mavi kuşu tarif et.','The small bird is blue.','🐦'),
   q('assemble','Güneşin gökyüzündeki yerini anlat.','The sun is above the trees.','☀️'),
   q('write','Kartpostalına bir yer cümlesi yaz.','I can see a beautiful garden.','🌸')],
  a2:[
   q('spell','Manzara için İngilizce sözcük oluştur.','landscape','🌄'),
   q('assemble','Manzarayı ve neden sevdiğini anlat.','I like this garden because it is peaceful.','🌿'),
   q('write','Gördüğün renkli kuşu tam cümleyle anlat.','A colorful bird is sitting in the tree.','🐦'),
   q('assemble','İki bilgiyi because ile birleştir.','I stayed outside because the weather was lovely.','🌤️'),
   q('write','İki cümlelik kartpostal yaz.','The garden is full of flowers. I love the bright colors.','🌺')]
 },
 {title:'Liman Mektupları',subtitle:'Yolculuk ve kısa mesajlar',icon:'⛵',color:'#90e2db',
  pre:[
   q('spell','Yelkenliyi İngilizce adlandır.','boat','⛵'),
   q('assemble','Tekneyi gördüğünü yaz.','I see a boat.','🚤'),
   q('write','Resimdeki teknenin adını İngilizce yaz.','boat','⛵'),
   q('assemble','Kaptana merhaba de.','Hello captain!','⚓'),
   q('spell','Denizin İngilizce adını kur.','sea','🌊')],
  a1:[
   q('spell','Liman kelimesini İngilizce kur.','harbor','⚓'),
   q('assemble','Bugün teknede olduğunu anlat.','I am on a boat today.','⛵'),
   q('write','Arkadaşına limandan kısa bir mesaj yaz.','I am at the harbor.','💌'),
   q('assemble','Yolculuğun keyifli olduğunu anlat.','The boat trip is fun.','🌊'),
   q('write','Bir sonraki yolculuğunu anlat.','I want to visit the island.','🏝️')],
  a2:[
   q('spell','Yolculuk kelimesini İngilizce oluştur.','journey','🧭'),
   q('assemble','Dün limana gittiğini anlat.','Yesterday we visited the busy harbor.','⚓'),
   q('write','Bir seyahatten İngilizce haber ver.','We sailed to a beautiful island yesterday.','⛵'),
   q('assemble','İki olayı sırayla anlat.','First we boarded the boat and then we sailed.','🚢'),
   q('write','Kısa bir seyahat notu oluştur.','Yesterday we sailed across the sea. Then we explored the island.','🏝️')]
 },
 {title:'Küçük Hikâye Kitabı',subtitle:'Anlamlı cümlelerden küçük hikâyeye',icon:'📚',color:'#d0b8ff',
  pre:[
   q('spell','Hikâyedeki kuşun İngilizce adını kur.','bird','🐦'),
   q('assemble','Kuşun mutlu olduğunu anlat.','The bird is happy.','🐣'),
   q('write','Küçük hikâyedeki hayvanın adını yaz.','bird','🐦'),
   q('assemble','Kedi uyudu. Cümleyi kur.','The cat is sleeping.','🐈'),
   q('spell','Gülümsemenin kısa İngilizce sözcüğünü kur.','smile','😊')],
  a1:[
   q('spell','Hikâye kelimesini İngilizce oluştur.','story','📖'),
   q('assemble','Bir zamanlar küçük kedi vardı.','There was a little cat.','🐈'),
   q('write','Hikâyenin ilk cümlesini yaz.','One day a bird found a key.','🐦'),
   q('assemble','Sonra kuş arkadaşını çağırdı.','Then the bird called a friend.','🗝️'),
   q('write','Hikâyeye mutlu bir bitiş yaz.','They were happy together.','💛')],
  a2:[
   q('spell','Macerayı anlatan İngilizce kelimeyi kur.','adventure','🌟'),
   q('assemble','Olayın başladığını geçmiş zamanda anlat.','One morning the little fox found a secret map.','🦊'),
   q('write','Hikâyenin başlangıcını tam cümleyle yaz.','A small rabbit discovered a golden key in the garden.','🐇'),
   q('assemble','Olayın nedenini ve sonucunu bağla.','The rabbit followed the map because she was curious.','🗺️'),
   q('write','İki cümlelik hikâye sonu yaz.','Finally the friends found the treasure. They celebrated together.','🏆')]
 }
];
export const WORKSHOP_CHAPTERS:readonly WorkshopChapter[]=catalog.map((item,index)=>({
 id:index+1,title:item.title,subtitle:item.subtitle,icon:item.icon,color:item.color,
 quests:{
  'Pre-A1':[...item.pre,...WORKSHOP_BONUS_CHAPTERS[index]['Pre-A1'],...WORKSHOP_EXTENDED_CHAPTERS[index]['Pre-A1']]
   .map((t,i)=>({...t,id:`w${index+1}-pre-${i+1}`})),
  A1:[...item.a1,...WORKSHOP_BONUS_CHAPTERS[index].A1,...WORKSHOP_EXTENDED_CHAPTERS[index].A1]
   .map((t,i)=>({...t,id:`w${index+1}-a1-${i+1}`})),
  A2:[...item.a2,...WORKSHOP_BONUS_CHAPTERS[index].A2,...WORKSHOP_EXTENDED_CHAPTERS[index].A2]
   .map((t,i)=>({...t,id:`w${index+1}-a2-${i+1}`}))
 }
}));
/** Grade alters interaction load; English placement alters linguistic content.
 * Even a grade-8 Pre-A1 learner gets beginner language, not automatic A2.
 */
export function workshopTaskCount(gradeLevel:number|null|undefined):6|7|8{
 if(!Number.isInteger(gradeLevel)||gradeLevel!<1||gradeLevel!>8)return 7;
 return gradeLevel!<=2?6:gradeLevel!<=4?7:8;
}
/** Compatibility path for older in-progress 3/4/5-question checkpoints. */
export function getLegacyWorkshopTasks(
 chapter:number,level:WorkshopLevel,gradeLevel:number|null|undefined,playIndex=0
):readonly WorkshopTask[]{
 const found=WORKSHOP_CHAPTERS[chapter-1];
 if(!found||found.id!==chapter)throw new RangeError('Writing workshop chapter not found');
 if(level!=='Pre-A1'&&level!=='A1'&&level!=='A2')throw new RangeError('Unknown writing placement');
 if(!Number.isSafeInteger(playIndex)||playIndex<0)throw new RangeError('Invalid writing replay index');
 const count=!Number.isInteger(gradeLevel)||gradeLevel!<1||gradeLevel!>8?4:
  gradeLevel!<=2?3:gradeLevel!<=4?4:5;
 if(playIndex===0)return found.quests[level].slice(0,count);
 const pattern:readonly WorkshopMode[]=count===3?['spell','assemble','write']:
  count===4?['spell','assemble','write','assemble']:
  ['spell','assemble','write','assemble','spell'];
 const bank=found.quests[level];
 const grouped:Record<WorkshopMode,WorkshopTask[]>={
  spell:bank.filter(t=>t.mode==='spell').slice(0,5),
  assemble:bank.filter(t=>t.mode==='assemble').slice(0,5),
  write:bank.filter(t=>t.mode==='write').slice(0,5)
 };
 const a=playIndex%5,b=Math.floor(playIndex/5)%5,c=Math.floor(playIndex/25)%5;
 const offsets:Record<WorkshopMode,number>={
  spell:(2*a)%5,assemble:(2*a+b)%5,write:(2*a+c)%5
 };
 const cursor:Record<WorkshopMode,number>={spell:0,assemble:0,write:0};
 return pattern.map(mode=>grouped[mode][(offsets[mode]+cursor[mode]++)%5]);
}
/** Each chapter and placement now has 21 authored missions: seven spelling,
 * seven sentence-order and seven independent typed responses.
 * In 6/7/8-task sessions all three skills appear and the last task is typing.
 * Three independent base-7 offsets yield 343 distinct complete lesson decks.
 * Moving to the next replay shifts every skill bank by three or four items,
 * which ensures adjacent sessions NEVER reuse task IDs, even on base-7 carry.
 */
export function getWorkshopTasks(
 chapter:number,level:WorkshopLevel,gradeLevel:number|null|undefined,
 playIndex=0
):readonly WorkshopTask[]{
 const found=WORKSHOP_CHAPTERS[chapter-1];
 if(!found||found.id!==chapter)throw new RangeError('Writing workshop chapter not found');
 if(level!=='Pre-A1'&&level!=='A1'&&level!=='A2')
  throw new RangeError('Unknown writing placement');
 if(!Number.isSafeInteger(playIndex)||playIndex<0)
  throw new RangeError('Invalid writing replay index');
 const count=workshopTaskCount(gradeLevel);
 const pattern:readonly WorkshopMode[]=count===6?
  ['spell','assemble','write','spell','assemble','write']:
  count===7?
  ['spell','assemble','write','spell','assemble','spell','write']:
  ['spell','assemble','write','spell','assemble','spell','assemble','write'];
 const bank=found.quests[level];
 const grouped:Record<WorkshopMode,WorkshopTask[]>={
  spell:bank.filter(task=>task.mode==='spell'),
  assemble:bank.filter(task=>task.mode==='assemble'),
  write:bank.filter(task=>task.mode==='write')
 };
 // The transform (3a, 3a+b, 3a+c) is invertible over the three base-7 digits.
 const a=playIndex%7,b=Math.floor(playIndex/7)%7,c=Math.floor(playIndex/49)%7;
 const offsets:Record<WorkshopMode,number>={
  spell:(3*a)%7,assemble:(3*a+b)%7,write:(3*a+c)%7
 };
 const cursor:Record<WorkshopMode,number>={spell:0,assemble:0,write:0};
 return pattern.map(mode=>{
  const options=grouped[mode];
  if(options.length!==7)throw new Error('Incomplete writing curriculum for '+mode);
  return options[(offsets[mode]+cursor[mode]++)%options.length];
 });
}
export function normalizeWorkshopAnswer(text:string):string{
 return text.toLocaleLowerCase('en-US').normalize('NFKC')
  .replace(/[’‘]/g,"'").replace(/[^a-z0-9\s']/g,'')
  .replace(/\s+/g,' ').trim();
}
/** No fuzzy guessed correctness. Exact accepted phrases only.
 * Creative, non-template text is presented as practice, never auto-scored.
 */
export function isWorkshopAnswerCorrect(task:WorkshopTask,response:string):boolean{
 const actual=normalizeWorkshopAnswer(response);
 if(!actual)return false;
 return [task.target,...task.accepted].some(v=>normalizeWorkshopAnswer(v)===actual);
}
export function workshopTiles(task:WorkshopTask,seed:number):readonly {key:number;value:string}[]{
 if(task.mode==='write')return [];
 const parts=task.mode==='spell'?Array.from(task.target.replace(/[^a-z]/gi,'')):
  task.target.trim().split(/\s+/);
 const indexed=parts.map((value,key)=>({key,value}));
 let state=((seed+1)*2654435761+(task.id.length*179))>>>0;
 for(let i=indexed.length-1;i>0;i--){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const j=state%(i+1);[indexed[i],indexed[j]]=[indexed[j],indexed[i]];
 }
 if(indexed.every((p,i)=>p.key===i)&&indexed.length>1){
  indexed.push(indexed.shift()!);
 }
 return indexed;
}
export function workshopFeedback(task:WorkshopTask,response:string):string{
 if(isWorkshopAnswerCorrect(task,response))return 'Doğru yazdın!';
 if(task.mode==='spell')return 'Harflerin sırasına tekrar bak. Sesi dinleyip yeniden dene.';
 if(task.mode==='assemble')return 'Cümleyi kimin yaptığını düşün. Kelimeleri tekrar sırala.';
 return 'Cümlene tekrar bak. Eksik veya farklı yazılmış bir kelime olabilir.';
}
