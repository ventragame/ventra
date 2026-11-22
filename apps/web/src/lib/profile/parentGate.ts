/**
 * Parental gate rules (pure, testable).
 *
 * A gate cannot stop every older child, but it must stop young players and
 * guessing:
 * - the question is written in Turkish words, never digits, so a child who
 *   cannot read number words cannot even start ("on yedi çarpı altı");
 * - the sum is beyond the times table: two-digit × one-digit, or a
 *   three-digit minus two-digit subtraction that needs borrowing;
 * - every wrong answer brings a new question; after three wrong answers the
 *   gate locks for 1, then 3, then 10 minutes, and the lock survives closing
 *   the window or reloading the page (it is stored on this device);
 * - nobody has to wait: during a lock a parent can answer one harder
 *   "parent question" (two tries per lock, never more), or use a PIN's
 *   recovery key or the family e-mail (see parentPin);
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

export type GateChallenge={kind:'multiply'|'subtract'|'hard';prompt:string;answer:number};

const between=(random:()=>number,min:number,max:number)=>min+Math.floor(random()*(max-min+1));
const sentence=(text:string)=>text.charAt(0).toLocaleUpperCase('tr-TR')+text.slice(1);

export function createGateChallenge(random:()=>number=Math.random):GateChallenge{
 if(random()<0.5){
  const a=between(random,12,19),b=between(random,3,9);
  return {kind:'multiply',prompt:sentence(`${turkishNumberWords(a)} çarpı ${turkishNumberWords(b)} kaç eder?`),answer:a*b};
 }
 // a - b where the ones digit of b is larger: the child has to borrow.
 let a=0,b=0;
 do{a=between(random,121,199);b=between(random,23,89);}while(b%10<=a%10||a-b<20);
 return {kind:'subtract',prompt:sentence(`${turkishNumberWords(a)} eksi ${turkishNumberWords(b)} kaç eder?`),answer:a-b};
}

/** The way past a lock without waiting: two-digit × two-digit (13–39 ×
 * 12–19), still in words. Adults manage it in their head or with a
 * calculator; a child who just failed three easier sums is guessing among
 * ~600 possible answers with two tries. */
export function createHardChallenge(random:()=>number=Math.random):GateChallenge{
 const a=between(random,13,39),b=between(random,12,19);
 return {kind:'hard',prompt:sentence(`${turkishNumberWords(a)} çarpı ${turkishNumberWords(b)} kaç eder?`),answer:a*b};
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
