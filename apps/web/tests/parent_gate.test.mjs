import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 GATE_HARD_TRIES,GATE_LOCK_SECONDS,GATE_MAX_WRONG,GATE_STORAGE_KEY,canTryHard,createGateChallenge,createHardChallenge,emptyGuard,
 formatLock,lockDurationMs,readGuard,registerHardWrong,registerWrong,remainingLockMs,turkishNumberWords,writeGuard
} from '../src/lib/profile/parentGate.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);
 t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const WORDS={bir:1,iki:2,'üç':3,'dört':4,'beş':5,'altı':6,yedi:7,sekiz:8,dokuz:9,on:10,yirmi:20,otuz:30,'kırk':40,elli:50,
 'altmış':60,'yetmiş':70,seksen:80,doksan:90};
// Independent reader of Turkish number words, used to check every prompt.
function readWords(text){let total=0,current=0;
 for(const word of text.split(' ')){if(word==='yüz'){total+=(current||1)*100;current=0;}else current+=WORDS[word];}
 return total+current;}
function solve(prompt){
 const m=prompt.toLocaleLowerCase('tr-TR').match(/^(.+) (çarpı|eksi) (.+) kaç eder\?$/);
 assert.ok(m,prompt);
 const a=readWords(m[1]),b=readWords(m[3]);
 return {a,b,op:m[2],value:m[2]==='çarpı'?a*b:a-b};
}

test('Numbers are written the Turkish way',()=>{
 const cases=[[0,'sıfır'],[7,'yedi'],[10,'on'],[17,'on yedi'],[40,'kırk'],[100,'yüz'],[143,'yüz kırk üç'],
  [200,'iki yüz'],[306,'üç yüz altı'],[999,'dokuz yüz doksan dokuz']];
 for(const [n,w] of cases)assert.equal(turkishNumberWords(n),w);
 for(const bad of [-1,1000,1.5])assert.throws(()=>turkishNumberWords(bad),RangeError);
 for(let n=1;n<1000;n++)assert.equal(readWords(turkishNumberWords(n)),n,'round trip '+n);
});

test('Questions are words only, beyond the times table, and the answer always matches',()=>{
 const random=seeded(2026);const kinds=new Set();
 for(let i=0;i<3000;i++){
  const c=createGateChallenge(random);kinds.add(c.kind);
  assert.doesNotMatch(c.prompt,/\d|×|-/,'no digits or symbols for a non-reader to copy');
  assert.match(c.prompt,/^[A-ZÇĞİÖŞÜ]/,'reads as a sentence');
  const {a,b,op,value}=solve(c.prompt);
  assert.equal(value,c.answer,c.prompt);
  if(op==='çarpı'){
   assert.ok(a>=12&&a<=19&&b>=3&&b<=9,'two-digit × one-digit: '+c.prompt);
  }else{
   assert.ok(a>=121&&a<=199&&b>=23&&b<=89,c.prompt);
   assert.ok(b%10>a%10,'subtraction needs borrowing: '+c.prompt);
   assert.ok(c.answer>=20);
  }
  assert.ok(c.answer<1000&&String(c.answer).length<=3,'fits the three-digit answer field');
 }
 assert.deepEqual([...kinds].sort(),['multiply','subtract']);
});

test('Three wrong answers lock the gate for 1, then 3, then 10 minutes; a lock ignores guesses',()=>{
 assert.equal(GATE_MAX_WRONG,3);
 assert.deepEqual([...GATE_LOCK_SECONDS],[60,180,600]);
 let g=emptyGuard(),t=1_000_000;
 g=registerWrong(g,t);g=registerWrong(g,t);
 assert.deepEqual(g,{wrong:2,lockouts:0,lockedUntil:0,hardLeft:0});
 g=registerWrong(g,t);
 assert.equal(remainingLockMs(g,t),60_000);assert.equal(g.wrong,0);assert.equal(lockDurationMs(g),60_000);
 assert.deepEqual(registerWrong(g,t+1000),g,'guessing during a lock changes nothing');
 t+=60_000;assert.equal(remainingLockMs(g,t),0);
 for(let i=0;i<3;i++)g=registerWrong(g,t);
 assert.equal(remainingLockMs(g,t),180_000);
 t+=180_000;for(let i=0;i<3;i++)g=registerWrong(g,t);
 assert.equal(remainingLockMs(g,t),600_000);
 t+=600_000;for(let i=0;i<3;i++)g=registerWrong(g,t);
 assert.equal(remainingLockMs(g,t),600_000,'the longest lock is the ceiling');
 assert.equal(formatLock(61_000),'1:01');assert.equal(formatLock(600_000),'10:00');assert.equal(formatLock(400),'0:01');
});

test('The lock is stored on this device, survives reopening, and cannot be stretched or bypassed',()=>{
 const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
 const s=store();writeGuard(emptyGuard(),s);
 const locked={wrong:0,lockouts:1,lockedUntil:5_000_000,hardLeft:1};
 writeGuard(locked,s);
 assert.deepEqual(readGuard(s,4_990_000),locked,'reopening the gate keeps the lock');
 writeGuard(emptyGuard(),s);
 assert.equal(s.m.has(GATE_STORAGE_KEY),false,'a correct answer clears it');
 s.setItem(GATE_STORAGE_KEY,JSON.stringify({wrong:99,lockouts:2,lockedUntil:9e15}));
 const clamped=readGuard(s,1_000_000);
 assert.equal(clamped.wrong,GATE_MAX_WRONG-1);
 assert.equal(clamped.lockedUntil,1_000_000+600_000,'an edited value never locks longer than ten minutes');
 s.setItem(GATE_STORAGE_KEY,'{broken');
 assert.deepEqual(readGuard(s,1_000_000),emptyGuard(),'unreadable data does not crash the gate');
 // A browser that refuses to store still keeps the lock for this page.
 const refusing={getItem:()=>null,setItem:()=>{throw new Error('blocked');},removeItem:()=>{}};
 writeGuard(locked,refusing);
 assert.equal(readGuard(refusing,4_990_000).lockedUntil,5_000_000);
 writeGuard(emptyGuard(),s);
});

test('The gate shows the question in words, never the answer, and locks visibly',()=>{
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/\{challenge\.prompt\}/);
 assert.doesNotMatch(gate,/\{numA\}|\{numB\}|× \{|\{challenge\.answer\}/,'no digits question, no answer in the page');
 assert.equal(gate.match(/challenge\.answer/g).length,1,'the answer is only compared');
 assert.match(gate,/if \(Number\(userAnswer\) === challenge\.answer\) \{\n\s*if \(resetAfterQuestion\) clearPinRecord\(\);\n\s*writeGuard\(emptyGuard\(\)\);\n\s*onSuccess\(\);/);
 assert.match(gate,/const next = registerWrong\(guard, current\);\n\s*writeGuard\(next\);/);
 assert.match(gate,/setGuard\(readGuard\(\)\);/,'every opening reads the stored lock');
 assert.match(gate,/requestAnimationFrame\(\(\) => closeRef\.current\?\.focus\(\)\);/,'focus is not lost when the field disappears');
 assert.match(gate,/Kapı \{lockDuration \/ 60000\} dakika kilitlendi\. Bu, tahminle açılmasını önler\./);
 assert.match(gate,/Cevabı rakamla yaz\./);
 assert.match(src('components/profile/parent-gate.css'),/@media\(prefers-reduced-motion:reduce\)\{\.pg-question--wrong\{animation:none\}/);
 for(const file of ['app/progress/page.tsx','components/learning/harbor/HarborSpeechAdventure.tsx','components/profile/ProfileSelectorModal.tsx'])
  assert.doesNotMatch(src(file),/işlemi çöz/,file+' asks for the question, not a sum in digits');
});

test('Nobody waits: during a lock a harder parent question opens the gate, two tries per lock, never more',()=>{
 const random=seeded(77);
 for(let i=0;i<2000;i++){
  const c=createHardChallenge(random);
  assert.equal(c.kind,'hard');
  assert.doesNotMatch(c.prompt,/\d/);
  const {a,b,op,value}=solve(c.prompt);
  assert.equal(op,'çarpı');assert.equal(value,c.answer,c.prompt);
  assert.ok(a>=13&&a<=39&&b>=12&&b<=19,'two-digit × teen: '+c.prompt);
  assert.ok(c.answer<1000,'fits the three-digit field');
 }
 assert.equal(GATE_HARD_TRIES,2);
 let g=emptyGuard(),t=5_000_000;
 assert.equal(canTryHard(g,t),false,'not without a lock');
 for(let i=0;i<GATE_MAX_WRONG;i++)g=registerWrong(g,t);
 assert.equal(g.hardLeft,2);assert.ok(canTryHard(g,t));
 g=registerHardWrong(g,t);assert.equal(g.hardLeft,1);
 assert.equal(remainingLockMs(g,t),60_000,'a wrong parent answer does not stretch the lock');
 g=registerHardWrong(g,t);assert.equal(canTryHard(g,t),false,'tries used up');
 assert.deepEqual(registerHardWrong(g,t),g,'no third try during this lock');
 assert.equal(canTryHard(g,t+60_000),false,'and none once the lock is over');
 for(let i=0;i<GATE_MAX_WRONG;i++)g=registerWrong(g,t+60_000);
 assert.equal(g.hardLeft,2,'a later lock brings two new tries');
 // a reload keeps the used tries
 const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 writeGuard(emptyGuard(),st);
 const used=registerHardWrong(g,t+60_000);writeGuard(used,st);
 assert.equal(readGuard(st,t+61_000).hardLeft,1);
 writeGuard(emptyGuard(),st);
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/const hardOpen = !pinRecord && canTryHard\(guard, now\);/,'with a PIN the sum is never a way in');
 assert.match(gate,/if \(Number\(userAnswer\) === hardChallenge\.answer\) \{ pass\(\); return; \}/);
 assert.match(gate,/const canSkipWait = Boolean\(owner\) \|\| hasRecovery \|\| hardOpen;/);
});
