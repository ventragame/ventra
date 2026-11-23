import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 GATE_LOG_DAYS,GATE_LOG_KEY,GATE_LOG_MAX,TRIES_MERGE_MS,formatSpan,formatWhen,gateHistory,gateSummary,readGateLog,recordGateEvent,
 triesSinceLastPass,triesText,withGateEvent
} from '../src/lib/profile/parentGateLog.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),m};};
const MIN=60_000,DAY=24*60*MIN;
// Local times (the history speaks in the family's own clock).
const at=(d,h,mi=0)=>new Date(2026,10,d,h,mi).getTime();

test('Wrong answers close together are one entry; an entry splits them; locks are counted',()=>{
 let log=[];const t=at(20,18,40);
 log=withGateEvent(log,{e:'wrong'},t);
 log=withGateEvent(log,{e:'wrong'},t+MIN);
 log=withGateEvent(log,{e:'wrong',lock:true},t+2*MIN);
 assert.deepEqual(log,[{e:'tries',t,to:t+2*MIN,wrong:3,pin:0,locks:1}]);
 log=withGateEvent(log,{e:'wrong'},t+2*MIN+TRIES_MERGE_MS);
 assert.equal(log.length,1,'within 15 minutes of the last wrong answer: same entry');
 log=withGateEvent(log,{e:'wrong',pin:true},t+2*MIN+2*TRIES_MERGE_MS+1);
 assert.equal(log.length,2,'later: a new entry');
 assert.deepEqual(log[1],{e:'tries',t:t+2*MIN+2*TRIES_MERGE_MS+1,to:t+2*MIN+2*TRIES_MERGE_MS+1,wrong:1,pin:1,locks:0});
 log=withGateEvent(log,{e:'pass',via:'question'},t+60*MIN);
 log=withGateEvent(log,{e:'wrong'},t+61*MIN);
 assert.equal(log.length,4,'tries after an entry never join tries before it');
});

test('The history keeps 30 days and at most 40 entries; a burst of guesses cannot push entries out',()=>{
 const now=at(22,12);
 let log=[{e:'pass',t:now-(GATE_LOG_DAYS+1)*DAY,via:'pin'},{e:'pass',t:now-2*DAY,via:'question'}];
 log=withGateEvent(log,{e:'pin-set'},now);
 assert.deepEqual(log.map(e=>e.e),['pass','pin-set'],'older than 30 days is dropped');
 for(let i=0;i<100;i++)log=withGateEvent(log,{e:'wrong',lock:i%3===2},now+i*1000);
 assert.equal(log.length,3,'a hundred guesses are one entry');
 assert.equal(log[2].wrong,100);assert.equal(log[2].locks,33);
 for(let i=0;i<60;i++)log=withGateEvent(log,{e:'pass',via:'question'},now+DAY+i*MIN);
 assert.equal(log.length,GATE_LOG_MAX);
});

test('Stored on this device only as times and kinds; damaged or edited entries are dropped',()=>{
 const s=store();const now=at(22,12);
 assert.deepEqual(readGateLog(s,now),[]);
 recordGateEvent({e:'wrong'},s,now-5*MIN);
 recordGateEvent({e:'pass',via:'question'},s,now);
 const raw=s.m.get(GATE_LOG_KEY);
 for(const item of JSON.parse(raw))for(const key of Object.keys(item))
  assert.ok(['e','t','via','to','wrong','pin','locks'].includes(key),'only times and kinds: '+key);
 assert.deepEqual(readGateLog(s,now).map(e=>e.e),['tries','pass']);
 const bad=[{e:'pass',t:now,via:'magic'},{e:'tries',t:now,to:now,wrong:-1,pin:0,locks:0},{e:'tries',t:now,to:now,wrong:0,pin:0,locks:0},
  {e:'pass',t:now+DAY,via:'pin'},{e:'pass',t:now-40*DAY,via:'pin'},{e:'hack',t:now},null,'x',{e:'pass',t:'soon',via:'pin'}];
 s.setItem(GATE_LOG_KEY,JSON.stringify([...bad,{e:'pin-removed',t:now-MIN},{e:'tries',t:now-2*MIN,to:now+DAY,wrong:2,pin:9,locks:0}]));
 const read=readGateLog(s,now);
 assert.deepEqual(read,[{e:'tries',t:now-2*MIN,to:now-2*MIN,wrong:2,pin:2,locks:0},{e:'pin-removed',t:now-MIN}],'only sane entries, sorted, clamped');
 s.setItem(GATE_LOG_KEY,'{broken');assert.deepEqual(readGateLog(s,now),[]);
 s.setItem(GATE_LOG_KEY,'{"e":"pass"}');assert.deepEqual(readGateLog(s,now),[]);
 // a browser that refuses to store keeps the history for this page
 const refusing={getItem:()=>null,setItem:()=>{throw new Error('blocked');}};
 recordGateEvent({e:'wrong'},refusing,now);
 assert.equal(readGateLog(refusing,now)[0].wrong,1);
 recordGateEvent({e:'pass',via:'pin'},s,now);
 assert.deepEqual(readGateLog(store(),now),[],'a working store does not inherit that memory');
});

test('On entry the parent sees tries made since the last entry and before this opening',()=>{
 const t=at(21,18,40);
 let log=[];
 assert.equal(triesSinceLastPass(log,t),null);
 log=withGateEvent(log,{e:'wrong'},t-DAY);
 log=withGateEvent(log,{e:'pass',via:'question'},t-DAY+MIN);
 assert.equal(triesSinceLastPass(log,t),null,'tries before the last entry were already seen');
 log=withGateEvent(log,{e:'wrong'},t);
 log=withGateEvent(log,{e:'wrong'},t+MIN);
 log=withGateEvent(log,{e:'wrong',lock:true},t+2*MIN);
 log=withGateEvent(log,{e:'wrong',pin:true},t+40*MIN);
 const opened=t+3*60*MIN;
 assert.deepEqual(triesSinceLastPass(log,opened),{wrong:4,pin:1,locks:1,from:t,to:t+40*MIN});
 assert.deepEqual(triesSinceLastPass(log,t+30*MIN),{wrong:3,pin:0,locks:1,from:t,to:t+2*MIN},'tries made after opening are the parent\'s own');
 assert.equal(triesText(4,1,1),'4 yanlış deneme · kapı kilitlendi');
 assert.equal(triesText(3,0,0),'3 yanlış cevap');
 assert.equal(triesText(2,2,0),'2 yanlış PIN');
 assert.equal(triesText(9,0,3),'9 yanlış cevap · kapı 3 kez kilitlendi');
});

test('Times read like a person would say them',()=>{
 const now=at(23,14,30); // Pazartesi 23 Kasım 2026
 assert.equal(formatWhen(now-20_000,now),'Az önce');
 assert.equal(formatWhen(at(23,9,5),now),'Bugün 09:05');
 assert.equal(formatWhen(at(22,18,40),now),'Dün 18:40');
 assert.equal(formatWhen(at(20,7,0),now),'Cuma 07:00');
 assert.equal(formatWhen(at(12,9,15),now),'12 Kas 09:15');
 assert.equal(formatSpan(at(22,18,40),at(22,18,52),now),'Dün 18:40–18:52');
 assert.equal(formatSpan(at(22,18,40),at(22,18,40,)+30_000,now),'Dün 18:40');
 assert.equal(formatSpan(at(22,23,50),at(23,0,10),now),'Dün 23:50 – Bugün 00:10');
});

test('The history reads newest first, with a summary of the last 7 days',()=>{
 const now=at(23,14,30);
 let log=[];
 log=withGateEvent(log,{e:'pass',via:'pin'},at(10,9));
 log=withGateEvent(log,{e:'pin-set'},at(20,9));
 log=withGateEvent(log,{e:'wrong'},at(22,18,40));
 log=withGateEvent(log,{e:'wrong',lock:true},at(22,18,42));
 log=withGateEvent(log,{e:'pass',via:'hard'},at(22,18,43));
 log=withGateEvent(log,{e:'reset-start'},at(23,9));
 log=withGateEvent(log,{e:'pass',via:'email'},now);
 assert.deepEqual(gateSummary(log,now),{passes:2,wrong:2,locks:1},'the entry on the 10th is older than a week');
 const items=gateHistory(log,now);
 assert.deepEqual(items.map(i=>[i.icon,i.text,i.when,i.tone]),[
  ['✉️','E-posta koduyla açıldı','Az önce','ok'],
  ['⏱️','PIN sıfırlama istendi (24 saat)','Bugün 09:00','warn'],
  ['🧮','Kilitliyken ebeveyn sorusuyla açıldı','Dün 18:43','ok'],
  ['⚠️','2 yanlış cevap · kapı kilitlendi','Dün 18:40–18:42','warn'],
  ['🔐','PIN belirlendi','Cuma 09:00','info'],
  ['🔐','PIN ile açıldı','10 Kas 09:00','ok']
 ]);
 assert.equal(new Set(items.map(i=>i.key)).size,items.length);
 assert.equal(gateHistory(log,now,2).length,2);
});

test('The gate records every try and entry, warns once on entry, and tells children tries are recorded',()=>{
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/recordGateEvent\(\{ e: 'wrong', pin: mode === 'pin', lock: next\.lockouts > guard\.lockouts \}\);/);
 assert.match(gate,/const next = registerHardWrong\(guard, Date\.now\(\)\);\n\s*writeGuard\(next\);\n\s*recordGateEvent\(\{ e: 'wrong' \}\);/);
 assert.match(gate,/recordGateEvent\(\{ e: 'pass', via \}\);\n\s*if \(removePin\) recordGateEvent\(\{ e: 'pin-removed' \}\);\n\s*if \(earlier\) \{ setNow\(Date\.now\(\)\); setMode\('notice'\); return; \}\n\s*onSuccess\(\);/);
 assert.match(gate,/setEarlier\(triesSinceLastPass\(readGateLog\(\), Date\.now\(\)\)\);/,'snapshot at opening: the parent\'s own tries are not reported back');
 assert.match(gate,/writePinRecord\(next\);\n\s*recordGateEvent\(\{ e: 'reset-start' \}\);/);
 assert.match(gate,/Her deneme ve giriş bu cihazda saatiyle kaydedilir\./);
 assert.equal(gate.match(/\{recordedNote\}/g).length,2,'under the question and the PIN');
 assert.match(gate,/Bunları sen yaptıysan bir şey yapman gerekmez\./);
 assert.match(gate,/\{danger \? confirmLabel : 'Anladım, devam et'\}/,'a destructive action is named on the button');
 assert.match(gate,/<button type="button" onClick=\{onClose\} autoFocus=\{danger\}/,'and is not the focused button');
});

test('The backup window shows the history, logs PIN changes and names older players',()=>{
 const ui=src('components/profile/AdultAccountModal.tsx');
 assert.match(ui,/\{pinStep === 'idle' && <GateHistory version=\{gateVersion\} hasPin=\{Boolean\(pinRecord\)\} \/>\}/);
 assert.match(ui,/noteGate\(fresh \? 'pin-set' : 'key-renewed'\);/);
 assert.equal(ui.match(/noteGate\('pin-removed'\)/g).length,2,'removing a PIN and deleting the account that held it');
 assert.match(ui,/noteGate\('reset-cancel'\);/);
 assert.match(ui,/const solvers = profiles\.filter\(p => \(p\.gradeLevel \?\? 0\) >= 4\);/);
 assert.match(ui,/iki adımlı soruyu çözebilir\{solvers\.length === 1 \? '' : 'ler'\}\. Yalnızca senin bildiğin bir PIN öneririz\./);
 const history=src('components/profile/GateHistory.tsx');
 assert.match(history,/aria-expanded=\{open\} aria-controls="acct-gate-history"/);
 assert.match(history,/<div id="acct-gate-history" hidden=\{!open\}/);
 assert.match(history,/if \(gateSummary\(read, Date\.now\(\)\)\.wrong > 0\) setOpen\(true\);/,'opens by itself after wrong tries');
 assert.match(history,/yazılan cevaplar kaydedilmez/);
});

test('Back to the game locks the family panel again',()=>{
 const page=src('app/progress/page.tsx');
 assert.match(page,/function forgetGate\(\)\{try\{window\.sessionStorage\.removeItem\(GATE_KEY\);\}/);
 assert.match(page,/if\(href==='\/kids'\|\|href==='\/'\)forgetGate\(\);/);
 assert.match(page,/<div onClickCapture=\{lockOnLeave\}/);
});
