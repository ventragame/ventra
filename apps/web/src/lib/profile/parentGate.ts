/**
 * Parental gate rules (pure, testable).
 *
 * A gate cannot stop every older child, but it must stop young players and
 * guessing, and it must never be easy by luck:
 * - the question is a two-step instruction written in Turkish words, never
 *   digits ("On yedi ile altı sayılarını çarp, sonuca iki yüz kırk üç
 *   ekle."): a child has to read every number word, keep the first result in
 *   mind and then do the second step;
 * - every question is equally hard (no round numbers, no ×1, ×2 or ×10,
 *   the answer always has three digits), so asking for another question
 *   never brings an easy one;
 * - every wrong answer brings a new question; after three wrong answers the
 *   gate locks for 1, then 3, then 10 minutes, and the lock survives closing
 *   the window or reloading the page (it is stored on this device);
 * - nobody has to wait: during a lock a parent can answer one harder
 *   "parent question" (two-digit × two-digit, then a three-digit step; two
 *   tries per lock, never more), or use a PIN's recovery key or the family
 *   e-mail (see parentPin);
 * - every try and entry is written to the gate history (parentGateLog), so a
 *   parent notices an entry they did not make;
 * - the answer is never placed in the page.
 */

const ONES=['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'];
const TENS=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];

/** 0–999 in Turkish words: 143 → "yüz kırk üç", 17 → "on yedi". */
export function turkishNumberWords(value:number):string{
 if(!Number.isInteger(value)||value<0||value>999)throw new RangeError('0–999 arası bir tam sayı gerekir');
 if(value===0)return 'sıfır';
 const hundreds=Math.floor(value/100),tens=Math.floor(value/10)%10,ones=value%10;
 return [hundreds===0?'':hundreds===1?'yüz':ONES[hundreds]+' yüz',TENS[tens],ONES[ones]].filter(Boolean).join(' ');
}

/** The four ways a question is asked; each is two steps. */
export type GateKind='multiply-add'|'multiply-subtract'|'add-multiply'|'difference-multiply';
/** A piece of the question; numbers are marked so the page can set them in
 * bold (easier for an adult to scan, still words for a child to read). */
export type PromptPart={text:string;number?:true};
export type GateChallenge={kind:GateKind;level:'standard'|'hard';prompt:string;parts:PromptPart[];answer:number};
/** Longest answer (the parent question can reach four digits). */
export const GATE_ANSWER_DIGITS=4;

const between=(random:()=>number,min:number,max:number)=>min+Math.floor(random()*(max-min+1));
/** No 20, 30, 22, 33…: nothing a child could do in their head at a glance. */
const plain=(value:number)=>value%10!==0&&!(value<100&&value%11===0);
const pick=(random:()=>number,min:number,max:number)=>{
 let value=0;
 do value=between(random,min,max);while(!plain(value));
 return value;
};

const TEMPLATES:Record<GateKind,(a:number,b:number,c:number)=>(string|number)[]>={
 'multiply-add':(a,b,c)=>[a,' ile ',b,' sayılarını çarp, sonuca ',c,' ekle.'],
 'multiply-subtract':(a,b,c)=>[a,' ile ',b,' sayılarını çarp, sonuçtan ',c,' çıkar.'],
 'add-multiply':(a,b,c)=>[a,' ile ',b,' sayılarını topla, sonucu ',c,' ile çarp.'],
 'difference-multiply':(a,b,c)=>[a,' ile ',b,' sayılarının farkını bul, sonucu ',c,' ile çarp.']
};
const ANSWERS:Record<GateKind,(a:number,b:number,c:number)=>number>={
 'multiply-add':(a,b,c)=>a*b+c,
 'multiply-subtract':(a,b,c)=>a*b-c,
 'add-multiply':(a,b,c)=>(a+b)*c,
 'difference-multiply':(a,b,c)=>(a-b)*c
};
export const GATE_KINDS=Object.keys(TEMPLATES) as GateKind[];

function build(kind:GateKind,level:GateChallenge['level'],a:number,b:number,c:number):GateChallenge{
 const parts:PromptPart[]=TEMPLATES[kind](a,b,c).map(piece=>typeof piece==='number'?{text:turkishNumberWords(piece),number:true}:{text:piece});
 parts[0]={...parts[0],text:parts[0].text.charAt(0).toLocaleUpperCase('tr-TR')+parts[0].text.slice(1)};
 return {kind,level,prompt:parts.map(part=>part.text).join(''),parts,answer:ANSWERS[kind](a,b,c)};
}

/** Two steps, every time: multiply then add or subtract a number up to three
 * digits, or add / subtract two-digit numbers then multiply. The answer is
 * always 100–999, so a guess has one chance in about nine hundred. */
export function createGateChallenge(random:()=>number=Math.random):GateChallenge{
 const kind=GATE_KINDS[Math.min(GATE_KINDS.length-1,Math.floor(random()*GATE_KINDS.length))];
 for(;;){
  let a=0,b=0,c=0;
  if(kind==='multiply-add'){a=pick(random,12,29);b=between(random,3,9);c=pick(random,101,399);}
  else if(kind==='multiply-subtract'){a=pick(random,23,49);b=between(random,4,9);if(a*b<131)continue;c=pick(random,21,Math.min(a*b-100,199));}
  else if(kind==='add-multiply'){a=pick(random,12,49);b=pick(random,12,49);c=between(random,3,9);}
  else{a=pick(random,51,99);b=pick(random,12,49);c=between(random,3,9);if(a-b<13||!plain(a-b))continue;}
  const answer=ANSWERS[kind](a,b,c);
  if(answer>=100&&answer<=999)return build(kind,'standard',a,b,c);
 }
}

/** The way past a lock without waiting: two-digit × two-digit, then add or
 * subtract a three-digit number, still in words. Adults manage it with a
 * calculator; a child who just failed three questions is guessing among
 * thousands of possible answers with two tries. */
export function createHardChallenge(random:()=>number=Math.random):GateChallenge{
 const kind:GateKind=random()<0.5?'multiply-add':'multiply-subtract';
 for(;;){
  const a=pick(random,13,49),b=pick(random,12,29);
  if(kind==='multiply-subtract'&&a*b<301)continue;
  const c=kind==='multiply-add'?pick(random,101,899):pick(random,101,Math.min(a*b-100,899));
  return build(kind,'hard',a,b,c);
 }
}

export type GateGuard={wrong:number;lockouts:number;lockedUntil:number;hardLeft:number};
export const GATE_MAX_WRONG=3;
/** Parent-question tries per lock. */
export const GATE_HARD_TRIES=2;
export const GATE_LOCK_SECONDS=[60,180,600] as const;
export const GATE_STORAGE_KEY='ventra:parent-gate';

export const emptyGuard=():GateGuard=>({wrong:0,lockouts:0,lockedUntil:0,hardLeft:0});

export function remainingLockMs(guard:GateGuard,now:number):number{
 return Math.max(0,guard.lockedUntil-now);
}

/** A wrong answer while unlocked; the third one starts a longer lock each time. */
export function registerWrong(guard:GateGuard,now:number):GateGuard{
 if(remainingLockMs(guard,now)>0)return guard;
 const wrong=guard.wrong+1;
 if(wrong<GATE_MAX_WRONG)return {...guard,wrong};
 const lockouts=guard.lockouts+1;
 const seconds=GATE_LOCK_SECONDS[Math.min(lockouts,GATE_LOCK_SECONDS.length)-1];
 return {wrong:0,lockouts,lockedUntil:now+seconds*1000,hardLeft:GATE_HARD_TRIES};
}

/** Can the parent question still be tried during this lock? */
export function canTryHard(guard:GateGuard,now:number):boolean{
 return remainingLockMs(guard,now)>0&&guard.hardLeft>0;
}

/** A wrong parent-question answer uses up a try; the lock itself is unchanged
 * and no new tries appear until a later lock (no path for guessing). */
export function registerHardWrong(guard:GateGuard,now:number):GateGuard{
 if(!canTryHard(guard,now))return guard;
 return {...guard,hardLeft:guard.hardLeft-1};
}

/** Length of the current (or last) lock: 1, 3, then 10 minutes. */
export function lockDurationMs(guard:GateGuard):number{
 const step=Math.min(Math.max(guard.lockouts,1),GATE_LOCK_SECONDS.length);
 return GATE_LOCK_SECONDS[step-1]*1000;
}

export function formatLock(ms:number):string{
 const total=Math.ceil(ms/1000);
 return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
}

type GuardStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
// Storage can be blocked (private mode); the lock then still holds for this page.
let memoryGuard:GateGuard=emptyGuard();
const browserStorage=():GuardStorage|null=>{
 try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
};

export function readGuard(storage:GuardStorage|null=browserStorage(),now=Date.now()):GateGuard{
 let stored=emptyGuard();
 try{
  const raw=storage?.getItem(GATE_STORAGE_KEY);
  if(raw){
   const value=JSON.parse(raw) as Partial<GateGuard>;
   const number=(x:unknown,max:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=0?Math.min(Math.floor(x),max):0;
   // A damaged or edited value can never lock the gate for longer than the longest lock.
   stored={wrong:number(value.wrong,GATE_MAX_WRONG-1),lockouts:number(value.lockouts,99),
    lockedUntil:number(value.lockedUntil,now+GATE_LOCK_SECONDS[GATE_LOCK_SECONDS.length-1]*1000),
    hardLeft:number(value.hardLeft,GATE_HARD_TRIES)};
  }
 }catch{/* unreadable: the in-memory copy below still applies */}
 // The stricter copy wins: a write the browser refused must not open the gate.
 // For the lock, the later one counts (with the fewer tries left if equal).
 const m=memoryGuard;
 const lock=stored.lockedUntil===m.lockedUntil?{lockedUntil:m.lockedUntil,hardLeft:Math.min(stored.hardLeft,m.hardLeft)}
  :stored.lockedUntil>m.lockedUntil?{lockedUntil:stored.lockedUntil,hardLeft:stored.hardLeft}:{lockedUntil:m.lockedUntil,hardLeft:m.hardLeft};
 return {wrong:Math.max(stored.wrong,m.wrong),lockouts:Math.max(stored.lockouts,m.lockouts),...lock};
}

export function writeGuard(guard:GateGuard,storage:GuardStorage|null=browserStorage()):void{
 memoryGuard=guard;
 try{
  if(!storage)return;
  if(!guard.wrong&&!guard.lockouts&&!guard.lockedUntil)storage.removeItem(GATE_STORAGE_KEY);
  else storage.setItem(GATE_STORAGE_KEY,JSON.stringify(guard));
 }catch{/* memory copy above still applies */}
}
