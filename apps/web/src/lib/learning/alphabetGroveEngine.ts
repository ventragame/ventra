/** P1 Harf Korusu. English LETTER names differ from sounds IN WORDS.
 * Device TTS must not be treated as a phonetic recording of isolated sounds.
 * The three placements are product content tiers, not a formal CEFR certificate.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
export const ALPHABET_GROVE_GAME_ID='island_word_garden_alphabet' as const;
export type AlphabetLetter={
 id:string;upper:string;lower:string;anchor:string;tr:string;icon:string;
 ipa:string;focus:'start'|'end';noteTr?:string;
};
const make=(id:string,anchor:string,tr:string,icon:string,ipa:string,
 focus:'start'|'end'='start',noteTr?:string):AlphabetLetter=>({
 id,upper:id.toUpperCase(),lower:id,anchor,tr,icon,ipa,focus,noteTr
});
export const ALPHABET_LETTERS:readonly AlphabetLetter[]=[
 make('s','sun','güneş','☀️','/s/'),
 make('a','apple','elma','🍎','/æ/','start','Harf adı /eɪ/; apple içindeki kısa a sesi /æ/.'),
 make('t','top','topaç','🪀','/t/'),
 make('p','pen','kalem','🖊️','/p/'),
 make('i','insect','böcek','🐞','/ɪ/','start','Harf adı /aɪ/; insect kelimesindeki kısa i /ɪ/.'),
 make('n','nest','yuva','🪺','/n/'),
 make('m','moon','ay','🌙','/m/'),
 make('d','dog','köpek','🐶','/d/'),
 make('g','goat','keçi','🐐','/ɡ/','start','Goat kelimesindeki sert g sesini çalışıyoruz.'),
 make('o','octopus','ahtapot','🐙','/ɑ/','start','Bu örnekteki Amerikan İngilizcesi kısa o sesidir.'),
 make('c','cat','kedi','🐱','/k/','start','C burada /k/ sesini verir; her kelimede böyle değildir.'),
 make('k','kite','uçurtma','🪁','/k/'),
 make('e','egg','yumurta','🥚','/ɛ/'),
 make('u','umbrella','şemsiye','☂️','/ʌ/','start','Bu örnekteki kısa u sesi, harfin adından farklıdır.'),
 make('r','rabbit','tavşan','🐰','/ɹ/'),
 make('h','hat','şapka','🎩','/h/'),
 make('b','ball','top','⚽','/b/'),
 make('f','fish','balık','🐟','/f/'),
 make('l','lion','aslan','🦁','/l/'),
 make('j','jam','reçel','🍓','/dʒ/'),
 make('v','van','minibüs','🚐','/v/'),
 make('w','water','su','💧','/w/'),
 make('y','yellow','sarı','💛','/j/','start','Bu kelimede Y, /j/ sesini verir.'),
 make('z','zebra','zebra','🦓','/z/'),
 make('q','queen','kraliçe','👑','/kw/','start','Q burada U ile birlikte QU olarak /kw/ verir.'),
 make('x','fox','tilki','🦊','/ks/','end','X sesini FOX kelimesinin SONUNDA dinle.')
];
const SEQUENCE='s a t p i n m d g o c k e u r h b f l j v w y z q x'.split(' ');
/** Letters whose anchor words start with the same sound (/k/: cat, kite, queen). */
const SAME_ONSET_SOUND:readonly (readonly string[])[]=[['c','k','q']];
export type AlphabetLesson={id:number;title:string;subtitle:string;icon:string;letters:readonly string[];group:'letters'|'review'|'reading'};
const unit=(id:number,title:string,subtitle:string,icon:string,letters:string[],group:'letters'|'review'|'reading'='letters'):AlphabetLesson=>({id,title,subtitle,icon,letters,group});
export const ALPHABET_LESSONS:readonly AlphabetLesson[]=[
 unit(1,'Ses Tohumları','S · A · T','🌱',['s','a','t']),
 unit(2,'İlk Çiçekler','P · I · N','🌼',['p','i','n']),
 unit(3,'Neşeli Patika','M · D · G','🍄',['m','d','g']),
 unit(4,'Küçük Evler','O · C · K','🏡',['o','c','k']),
 unit(5,'Orman Işıkları','E · U · R','✨',['e','u','r']),
 unit(6,'Dostlar Yolu','H · B · F','🦋',['h','b','f']),
 unit(7,'Mavi Dere','L · J · V','💦',['l','j','v']),
 unit(8,'Rüzgâr Tepesi','W · Y · Z','🌈',['w','y','z']),
 unit(9,'Harf Anahtarı','Q · X','🗝️',['q','x']),
 unit(10,'Harf Şenliği','Kelimelerde harf avı','🎪',SEQUENCE,'review'),
 unit(11,'Kelime Ormanı','Kısa sesleri birleştir','📖',SEQUENCE,'reading'),
 unit(12,'Okuma Feneri','İlk kelimelerini oku','🏮',SEQUENCE,'reading')
];
export const ALPHABET_TOTAL_LESSONS=ALPHABET_LESSONS.length;
export const ALPHABET_CORE_LETTERS=SEQUENCE;
const byLetter=new Map(ALPHABET_LETTERS.map(x=>[x.id,x]));
const getLetter=(id:string):AlphabetLetter=>{
 const result=byLetter.get(id);
 if(!result)throw new RangeError('Unknown letter');
 return result;
};
export type AlphabetWord={word:string;icon:string;tr:string};
/** Regular three-letter words; no silent letters or untaught digraphs. */
const words:readonly [string,string,string][]=[
 ['sat','🪑','oturdu'],['pin','📌','iğne'],['pan','🍳','tava'],
 ['tap','🚰','musluk / hafifçe vurmak'],['sit','🪑','oturmak'],['nap','😴','kısa uyku'],
 ['tip','💡','ipucu'],['tin','🥫','teneke'],['map','🗺️','harita'],
 ['mat','🧘','minder'],['dog','🐶','köpek'],['dig','⛏️','kazmak'],
 ['cat','🐱','kedi'],['cap','🧢','şapka'],['can','🥫','konserve kutusu'],
 ['kid','🧒','çocuk'],['kit','🧰','araç seti'],['pot','🍲','tencere'],
 ['top','🔝','en üst'],['bed','🛏️','yatak'],['red','🔴','kırmızı'],
 ['hen','🐔','tavuk'],['run','🏃','koşmak'],['fun','🎉','eğlence'],
 ['fan','🪭','yelpaze'],['bug','🐞','böcek'],['hat','🎩','şapka'],
 ['hot','🔥','sıcak'],['van','🚐','minibüs'],['vet','🩺','veteriner'],
 ['win','🏆','kazanmak'],['wet','💦','ıslak'],['jet','✈️','jet'],
 ['leg','🦵','bacak'],['log','🪵','kütük'],['lip','👄','dudak'],
 ['zip','🤐','fermuar çekmek'],['fox','🦊','tilki'],['box','📦','kutu'],
 ['six','6️⃣','altı']
];
export const ALPHABET_WORDS:readonly AlphabetWord[]=words.map(([word,icon,tr])=>({word,icon,tr}));
/**
 * Picture-to-word distractors deliberately share the target's FIRST letter
 * (or FINAL X): guessing by initial alone must not solve the vocabulary task.
 * The correct English anchor is always introduced earlier in the same lesson.
 */
export const ALPHABET_WORD_LINK_DISTRACTORS:Readonly<Record<string,readonly [string,string]>>={
 s:['sock','star'],
 a:['ant','arm'],
 t:['tree','train'],
 p:['pig','pizza'],
 i:['igloo','ink'],
 n:['nose','net'],
 m:['milk','mouse'],
 d:['duck','door'],
 g:['gift','girl'],
 o:['orange','owl'],
 c:['car','cup'],
 k:['key','king'],
 e:['elephant','ear'],
 u:['unicorn','uniform'],
 r:['rain','robot'],
 h:['house','horse'],
 b:['bed','bird'],
 f:['frog','flower'],
 l:['lemon','leaf'],
 j:['juice','jacket'],
 v:['vase','violin'],
 w:['whale','window'],
 y:['yogurt','yo-yo'],
 z:['zoo','zero'],
 q:['quilt','quiz'],
 x:['box','six']
};
export type AlphabetTaskKind='introduce'|'word-link'|'letter-name'|'sound-in-word'|'read-word'|'build-word';
export interface AlphabetTask{
 id:string;kind:AlphabetTaskKind;answer:string;letterId?:string;word?:AlphabetWord;
 choices:readonly string[];promptTr:string;audioText?:string;
}
export interface AlphabetAnswerEvidence{
 taskId:string;kind:AlphabetTaskKind;firstTryCorrect:boolean;mistakes:number;
 hintUsed:boolean;audioPlayed:boolean;independent:boolean;
}
const shuffle=<T>(input:readonly T[],seed:number):T[]=>{
 const result=[...input];let value=seed>>>0;
 for(let i=result.length-1;i>0;i--){
  value=(Math.imul(value,1664525)+1013904223)>>>0;
  const j=value%(i+1);[result[i],result[j]]=[result[j],result[i]];
 }
 return result;
};
const sample=<T>(values:readonly T[],count:number,seed:number):T[]=>{
 const shuffled=shuffle(values,seed);
 return shuffled.length?Array.from({length:count},(_,i)=>shuffled[i%shuffled.length]):[];
};
const choices=(answer:string,pool:readonly string[],seed:number,max:number):string[]=>{
 const others=shuffle([...new Set(pool.filter(x=>x!==answer))],seed).slice(0,max-1);
 return shuffle([answer,...others],seed+7);
};
export function alphabetLessonLevelId(lesson:number,placement:EnglishPlacement):number{
 if(!Number.isInteger(lesson)||lesson<1||lesson>12)throw new RangeError('Invalid alphabet lesson');
 const i=['Pre-A1','A1','A2'].indexOf(placement);
 if(i<0)throw new RangeError('Invalid placement');
 return 12*i+lesson;
}
export function introducedAlphabetLetters(lesson:number):readonly string[]{
 if(!Number.isInteger(lesson)||lesson<1||lesson>12)throw new RangeError('Invalid alphabet lesson');
 return ALPHABET_LESSONS.filter(x=>x.group==='letters'&&x.id<=lesson).flatMap(x=>x.letters);
}
export function eligibleAlphabetWords(lesson:number):readonly AlphabetWord[]{
 const known=new Set(introducedAlphabetLetters(lesson));
 return ALPHABET_WORDS.filter(item=>item.word.split('').every(c=>known.has(c)));
}
export function planAlphabetLesson(input:{
 lesson:number;placement:EnglishPlacement;gradeLevel:number|null|undefined;replay:number;
}):readonly AlphabetTask[]{
 const {lesson,placement,replay}=input;
 const row=ALPHABET_LESSONS[lesson-1];
 if(!row||row.id!==lesson)throw new RangeError('Invalid alphabet lesson');
 if(!['Pre-A1','A1','A2'].includes(placement))throw new RangeError('Invalid placement');
 if(!Number.isSafeInteger(replay)||replay<0)throw new RangeError('Invalid replay index');
 const level=['Pre-A1','A1','A2'].indexOf(placement);
 const available=introducedAlphabetLetters(lesson);
 const target=row.group==='letters'?row.letters:available;
 const seed=lesson*137+replay*947+level*53;
 const width=input.gradeLevel!=null&&input.gradeLevel<=2?2:3;
 const letterTask=(kind:AlphabetTaskKind,id:string,i:number):AlphabetTask=>{
  const letter=getLetter(id),linksWord=kind==='word-link';
  const answer=linksWord?letter.anchor:letter.upper;
  // "Which letter starts the word you heard?" must have one defensible answer:
  // cat/kite/queen all begin with /k/, so C, K and Q never compete there.
  const soundTwins=kind==='sound-in-word'?SAME_ONSET_SOUND.find(group=>group.includes(id))??[]:[];
  const variants=linksWord?[letter.anchor,...ALPHABET_WORD_LINK_DISTRACTORS[id]]:
   available.filter(x=>x===id||!soundTwins.includes(x)).map(x=>getLetter(x).upper);
  return {
   id:'ag:'+lesson+':'+placement+':'+replay+':'+kind+':'+i+':'+id,
   kind,answer,letterId:id,choices:kind==='introduce'?[]:choices(answer,variants,seed+i*11,width),
   promptTr:kind==='introduce'?letter.upper+' harfiyle tanış: İngilizce '+letter.anchor+' kelimesini keşfet.':
    linksWord?'Resimdeki '+letter.tr+' için '+letter.upper+(letter.focus==='end'?' ile biten':' ile başlayan')+' İngilizce kelimeyi seç.':
    kind==='letter-name'?'Duyduğun İngilizce harf adını seç.':
    letter.focus==='end'?'FOX kelimesinin SONUNDA hangi harf var?':
    'Dinlediğin kelimenin BAŞINDA hangi harf var?',
   audioText:kind==='letter-name'?letter.upper:
    kind==='sound-in-word'||linksWord?letter.anchor:undefined
  };
 };
 const learned=eligibleAlphabetWords(lesson);
 const wordTask=(kind:'read-word'|'build-word',word:AlphabetWord,i:number):AlphabetTask=>({
  id:'ag:'+lesson+':'+placement+':'+replay+':'+kind+':'+i+':'+word.word,
  kind,answer:word.word,word,
  choices:kind==='read-word'?choices(word.word,learned.map(x=>x.word),seed+i*13,width):
   shuffle(word.word.split(''),seed+i*17),
  promptTr:kind==='read-word'?'Resme ve sese uygun İngilizce kelimeyi seç.':
   'Duyduğun ve resimde gördüğün kelimeyi harflerden oluştur.',
  audioText:word.word
 });
 let tasks:AlphabetTask[];
 if(row.group==='letters'){
  const start=sample(target,target.length,seed);
  const selected=sample(learned,lesson===1?0:2,seed+43);
  tasks=[
   ...start.map((id,i)=>letterTask('introduce',id,i)),
   ...sample(target,3,seed+11).map((id,i)=>letterTask('word-link',id,i)),
   ...sample(target,2,seed+17).map((id,i)=>letterTask('letter-name',id,i)),
   ...sample(target,2,seed+31).map((id,i)=>letterTask('sound-in-word',id,i)),
   ...selected.slice(0,1).map((w,i)=>wordTask('read-word',w,i)),
   ...selected.slice(1).map((w,i)=>wordTask('build-word',w,i))
  ];
  if(lesson===1)tasks.push(...sample(target,2,seed+75).map((id,i)=>letterTask('sound-in-word',id,i+2)));
 }else{
  tasks=[
   ...sample(available,2,seed+44).map((id,i)=>letterTask('word-link',id,i)),
   ...sample(available,2,seed+12).map((id,i)=>letterTask('letter-name',id,i)),
   ...sample(available,3,seed+17).map((id,i)=>letterTask('sound-in-word',id,i)),
   ...sample(learned,3,seed+53).map((w,i)=>wordTask('read-word',w,i)),
   ...sample(learned,3,seed+61).map((w,i)=>wordTask('build-word',w,i))
  ];
 }
 const grade=input.gradeLevel;
 if(grade!=null&&Number.isInteger(grade)&&grade>=3){
  const extra=sample(learned,1,seed+77);
  if(learned.length>=2&&extra.length)tasks.push(wordTask('read-word',extra[0],97));
 }
 if(grade!=null&&Number.isInteger(grade)&&grade>=5){
  const extra=sample(learned,1,seed+89);
  if(learned.length>=2&&extra.length)tasks.push(wordTask('build-word',extra[0],98));
 }
 return tasks;
}
export function alphabetTaskCorrect(task:AlphabetTask,response:string):boolean{
 return task.answer.toLowerCase()===response.trim().toLowerCase()&&response.trim().length>0;
}
export function alphabetHint(task:AlphabetTask):string{
 if(task.kind==='introduce')return 'Harf adını ve örnek kelimeyi ayrı ayrı dinle; aynı ses değillerdir.';
 if(task.kind==='word-link')return 'Seçenekler aynı harfle başlar (X için aynı harfle biter). Resimdeki nesnenin İngilizce adını hatırla; istersen kelimeyi yeniden dinle.';
 if(task.kind==='letter-name')return 'Harf adını tekrar dinle; kelimedeki sesi her zaman aynı olmaz.';
 if(task.kind==='sound-in-word')return task.letterId==='x'?'FOX kelimesinin sonunu dinle.':
  task.letterId==='q'?'QUEEN kelimesinde Q ve U birlikte çalışır.':
  'Kelimeyi tekrar dinle ve ilk sese odaklan.';
 if(task.kind==='read-word')return 'Önce resme, sonra kelimenin ilk ve son harfine bak.';
 return 'Sözcüğü dinle. Harfleri soldan sağa yerleştir.';
}
export function validateAlphabetCatalog():string[]{
 const errors:string[]=[];
 const ids=ALPHABET_LETTERS.map(x=>x.id);
 if(new Set(ids).size!==26||ids.slice().sort().join('')!=='abcdefghijklmnopqrstuvwxyz')errors.push('Alphabet does not cover 26 distinct letters');
 const ordered=ALPHABET_LESSONS.filter(x=>x.group==='letters').flatMap(x=>x.letters);
 if(ordered.join(',')!==SEQUENCE.join(',')||new Set(ordered).size!==26)errors.push('Letter lesson sequence broken');
 for(const letter of ALPHABET_LETTERS){
  if(letter.focus==='start'&&!letter.anchor.startsWith(letter.id))errors.push('Wrong onset '+letter.id);
  if(letter.focus==='end'&&!letter.anchor.endsWith(letter.id))errors.push('Wrong ending '+letter.id);
  if(!letter.icon||!letter.ipa||!letter.tr)errors.push('Missing anchor '+letter.id);
  const distractors=ALPHABET_WORD_LINK_DISTRACTORS[letter.id];
  if(!distractors||new Set([letter.anchor,...distractors]).size!==3)
   errors.push('Missing or duplicate word-link distractors '+letter.id);
  else if(distractors.some(word=>letter.focus==='end'?!word.endsWith(letter.id):!word.startsWith(letter.id)))
   errors.push('Word-link answer can be guessed from first letter '+letter.id);
 }
 if(new Set(ALPHABET_WORDS.map(w=>w.word)).size!==ALPHABET_WORDS.length)errors.push('Duplicate reading word');
 if(ALPHABET_WORDS.some(w=>!/^[a-z]{3}$/.test(w.word)))errors.push('Non-three-letter word');
 for(const unit of ALPHABET_LESSONS){
  const seen=new Set<string>();
  for(const placement of ['Pre-A1','A1','A2'] as const)for(const replay of [0,1,11]){
   const deck=planAlphabetLesson({lesson:unit.id,placement,gradeLevel:3,replay});
   if(deck.length<9)errors.push('Thin deck '+unit.id);
   for(const task of deck){
    if(seen.has(task.id))errors.push('Repeated task id '+task.id);
    seen.add(task.id);
    if(task.kind==='word-link'){
     const focus=getLetter(task.letterId!);
     if(task.answer!==focus.anchor)errors.push('Word-link answer unrelated to pictured English word '+task.id);
     if(task.choices.length<2||!task.choices.includes(task.answer))errors.push('Invalid English word-link choices '+task.id);
    }
    if(task.kind==='letter-name'&&task.audioText!==getLetter(task.letterId!).upper)
     errors.push('Letter name contains a spoken prefix '+task.id);
    if(task.promptTr.includes('küçük hâlini bul')||task.audioText?.startsWith('Letter '))
     errors.push('Non-English case drill or prefixed letter audio '+task.id);
   }
  }
 }
 return errors;
}
