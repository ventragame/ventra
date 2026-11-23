/**
 * Gate history (pure, testable).
 *
 * A written question cannot stop every older child. The history is the
 * second line: every entry and every failed try is kept with its time, so a
 * parent can spot an entry they did not make (and the gate tells children
 * that tries are recorded).
 * - Only on this device: times and kinds of events, never what was typed,
 *   never an answer, a PIN or a key.
 * - 30 days, at most 40 entries; wrong answers close together are one entry
 *   ("3 yanlış cevap · 1 kez kilitlendi"), so a burst of guesses cannot push
 *   older entries out.
 * - When a parent opens the gate, tries made since the last entry and before
 *   this opening are shown once ("Bilgin olsun").
 */

export type GateVia='question'|'hard'|'pin'|'email'|'recovery'|'reset';
export type GateNote='reset-start'|'reset-cancel'|'pin-set'|'pin-removed'|'key-renewed';
export type GateEvent=
 |{e:'pass';t:number;via:GateVia}
 |{e:'tries';t:number;to:number;wrong:number;pin:number;locks:number}
 |{e:GateNote;t:number};

export const GATE_LOG_KEY='ventra:parent-gate-log';
export const GATE_LOG_MAX=40;
export const GATE_LOG_DAYS=30;
/** Wrong answers this close to the previous one join the same entry. */
export const TRIES_MERGE_MS=15*60_000;

const DAY_MS=24*60*60*1000;
const VIAS:GateVia[]=['question','hard','pin','email','recovery','reset'];
const NOTES:GateNote[]=['reset-start','reset-cancel','pin-set','pin-removed','key-renewed'];

type LogStorage=Pick<Storage,'getItem'|'setItem'>;
// Storage can be blocked (private mode): the history then lives for this page.
// Holds entries only while the browser refuses to store them.
let memoryLog:GateEvent[]=[];
const browserStorage=():LogStorage|null=>{
 try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
};

const count=(value:unknown,max:number)=>typeof value==='number'&&Number.isInteger(value)&&value>=0?Math.min(value,max):null;

function cleanEvent(raw:unknown,now:number):GateEvent|null{
 if(!raw||typeof raw!=='object')return null;
 const v=raw as Record<string,unknown>;
 const t=v.t;
 if(typeof t!=='number'||!Number.isFinite(t)||t>now+60_000||t<now-GATE_LOG_DAYS*DAY_MS)return null;
 if(v.e==='pass')return VIAS.includes(v.via as GateVia)?{e:'pass',t,via:v.via as GateVia}:null;
 if(v.e==='tries'){
  const wrong=count(v.wrong,9999),pin=count(v.pin,9999),locks=count(v.locks,9999);
  const to=typeof v.to==='number'&&Number.isFinite(v.to)&&v.to>=t&&v.to<=now+60_000?v.to:t;
  if(!wrong||pin===null||locks===null)return null;
  return {e:'tries',t,to,wrong,pin:Math.min(pin,wrong),locks};
 }
 return NOTES.includes(v.e as GateNote)?{e:v.e as GateNote,t}:null;
}

/** Oldest first; damaged or edited entries are dropped, never trusted. */
export function readGateLog(storage:LogStorage|null=browserStorage(),now=Date.now()):GateEvent[]{
 let stored:GateEvent[]=[];
 try{
  const raw=storage?.getItem(GATE_LOG_KEY);
  const parsed=raw?JSON.parse(raw):null;
  if(Array.isArray(parsed))stored=parsed.map(item=>cleanEvent(item,now)).filter((item):item is GateEvent=>item!==null);
 }catch{/* unreadable: start a fresh history */}
 stored.sort((a,b)=>a.t-b.t);
 // A write the browser refused is still in memory for this page.
 const memory=memoryLog.filter(item=>cleanEvent(item,now));
 const last=(list:GateEvent[])=>list.length?Math.max(...list.map(item=>item.e==='tries'?item.to:item.t)):0;
 return trim(last(memory)>last(stored)?memory:stored,now);
}

function trim(log:GateEvent[],now:number):GateEvent[]{
 return log.filter(item=>item.t>=now-GATE_LOG_DAYS*DAY_MS).slice(-GATE_LOG_MAX);
}

/** Adds an entry (pure). A wrong answer within 15 minutes of the last one
 * joins that entry. */
export function withGateEvent(log:GateEvent[],event:{e:'pass';via:GateVia}|{e:'wrong';pin?:boolean;lock?:boolean}|{e:GateNote},now:number):GateEvent[]{
 if(event.e==='wrong'){
  const last=log[log.length-1];
  const pin=event.pin?1:0,locks=event.lock?1:0;
  if(last?.e==='tries'&&now>=last.to&&now-last.to<=TRIES_MERGE_MS)
   return trim([...log.slice(0,-1),{...last,to:now,wrong:last.wrong+1,pin:last.pin+pin,locks:last.locks+locks}],now);
  return trim([...log,{e:'tries',t:now,to:now,wrong:1,pin,locks}],now);
 }
 return trim([...log,event.e==='pass'?{e:'pass',t:now,via:event.via}:{e:event.e,t:now}],now);
}

/** Reads, adds and stores one entry; returns the new history. */
export function recordGateEvent(event:Parameters<typeof withGateEvent>[1],storage:LogStorage|null=browserStorage(),now=Date.now()):GateEvent[]{
 const next=withGateEvent(readGateLog(storage,now),event,now);
 try{
  if(!storage)throw new Error('no storage');
  storage.setItem(GATE_LOG_KEY,JSON.stringify(next));
  memoryLog=[];
 }catch{memoryLog=next;}
 return next;
}

export type GateTries={wrong:number;pin:number;locks:number;from:number;to:number};

/** Wrong tries after the last entry and before `before` (this opening), or
 * null if there were none. */
export function triesSinceLastPass(log:GateEvent[],before:number):GateTries|null{
 let found:GateTries|null=null;
 for(const item of log){
  if(item.t>=before)break;
  if(item.e==='pass')found=null;
  else if(item.e==='tries')found=found
   ?{wrong:found.wrong+item.wrong,pin:found.pin+item.pin,locks:found.locks+item.locks,from:found.from,to:Math.min(item.to,before)}
   :{wrong:item.wrong,pin:item.pin,locks:item.locks,from:item.t,to:Math.min(item.to,before)};
 }
 return found;
}

export type GateSummary={passes:number;wrong:number;locks:number};
export function gateSummary(log:GateEvent[],now:number,days=7):GateSummary{
 const since=now-days*DAY_MS;
 const summary={passes:0,wrong:0,locks:0};
 for(const item of log){
  if(item.t<since)continue;
  if(item.e==='pass')summary.passes++;
  else if(item.e==='tries'){summary.wrong+=item.wrong;summary.locks+=item.locks;}
 }
 return summary;
}

const DAY_NAMES=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const MONTHS=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const clock=(t:number)=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
const dayStart=(t:number)=>{const d=new Date(t);return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();};

/** "Az önce", "Bugün 14:02", "Dün 18:40", "Salı 16:10", "12 Kas 09:15". */
export function formatWhen(t:number,now:number):string{
 if(t<=now&&now-t<60_000)return 'Az önce';
 const days=Math.round((dayStart(now)-dayStart(t))/DAY_MS);
 if(days===0)return 'Bugün '+clock(t);
 if(days===1)return 'Dün '+clock(t);
 const d=new Date(t);
 if(days>1&&days<7)return DAY_NAMES[d.getDay()]+' '+clock(t);
 return `${d.getDate()} ${MONTHS[d.getMonth()]} ${clock(t)}`;
}

/** A span of tries: "Dün 18:40–18:52", or two times on different days. */
export function formatSpan(from:number,to:number,now:number):string{
 const start=formatWhen(from,now);
 if(to-from<60_000||start==='Az önce')return start;
 if(dayStart(from)===dayStart(to))return start+'–'+clock(to);
 return start+' – '+formatWhen(to,now);
}

/** "3 yanlış cevap", "2 yanlış PIN", "4 yanlış deneme" (both kinds). */
export function triesText(wrong:number,pin:number,locks:number):string{
 const noun=pin===0?'cevap':pin===wrong?'PIN':'deneme';
 return `${wrong} yanlış ${noun}`+(locks?` · ${locks === 1 ? 'kapı kilitlendi' : `kapı ${locks} kez kilitlendi`}`:'');
}

export type GateHistoryItem={key:string;icon:string;text:string;when:string;tone:'ok'|'warn'|'info'};
const PASS_TEXT:Record<GateVia,[string,string]>={
 question:['✅','Soruyla açıldı'],
 hard:['🧮','Kilitliyken ebeveyn sorusuyla açıldı'],
 pin:['🔐','PIN ile açıldı'],
 email:['✉️','E-posta koduyla açıldı'],
 recovery:['🔑','Kurtarma anahtarıyla açıldı'],
 reset:['⏱️','24 saatlik sıfırlamayla açıldı']
};
const NOTE_TEXT:Record<GateNote,[string,string,GateHistoryItem['tone']]>={
 'reset-start':['⏱️','PIN sıfırlama istendi (24 saat)','warn'],
 'reset-cancel':['↩️','PIN sıfırlama isteği iptal edildi','info'],
 'pin-set':['🔐','PIN belirlendi','info'],
 'pin-removed':['🔓','PIN kaldırıldı','warn'],
 'key-renewed':['🔑','Yeni kurtarma anahtarı alındı','info']
};

/** Newest first, ready to show. */
export function gateHistory(log:GateEvent[],now:number,limit=8):GateHistoryItem[]{
 return log.slice(-limit).reverse().map((item,index)=>{
  const key=`${item.t}-${item.e}-${index}`;
  if(item.e==='pass'){const [icon,text]=PASS_TEXT[item.via];return {key,icon,text,when:formatWhen(item.t,now),tone:'ok'};}
  if(item.e==='tries')return {key,icon:'⚠️',text:triesText(item.wrong,item.pin,item.locks),when:formatSpan(item.t,item.to,now),tone:'warn'};
  const [icon,text,tone]=NOTE_TEXT[item.e];
  return {key,icon,text,when:formatWhen(item.t,now),tone};
 });
}
