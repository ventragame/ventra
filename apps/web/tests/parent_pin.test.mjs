import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 PIN_STORAGE_KEY,RECOVERY_ALPHABET,RESET_DELAY_MS,cancelPinReset,clearPinRecord,createPinRecord,formatWait,generateRecoveryKey,
 maskEmail,normaliseRecoveryKey,pinMatches,pinProblem,pinSupported,readPinRecord,recoveryMatches,requestPinReset,resetWaitMs,
 withNewRecoveryKey,writePinRecord
} from '../src/lib/profile/parentPin.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const owner={id:'11111111-2222-4333-8444-555555555555',email:'veli@ornek.com'};
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};

test('Easy PINs a child would try first are refused, with a reason',()=>{
 assert.match(pinProblem('12a4'),/4 rakam/);
 assert.match(pinProblem('123'),/4 rakam/);
 for(const pin of ['0000','1111','9999'])assert.match(pinProblem(pin),/Aynı rakam/,pin);
 for(const pin of ['0123','1234','6789','9876','3210'])assert.match(pinProblem(pin),/Sıralı/,pin);
 for(const pin of ['1212','4747','0909'])assert.match(pinProblem(pin),/Tekrarlanan ikili/,pin);
 for(const pin of ['2580','1357','2468','7392','4018'])assert.equal(pinProblem(pin),null,pin);
});

test('Any family can set a PIN; it is a salted digest, never digits, and comes with a recovery key',async()=>{
 assert.ok(pinSupported(),'WebCrypto is available here (and in https / the app shell)');
 const a=await createPinRecord('7392',null,new Date('2026-11-22T10:00:00Z'));
 const b=await createPinRecord('7392',owner);
 assert.equal(a.record.ownerId,null,'no family account needed');
 assert.deepEqual([b.record.ownerId,b.record.ownerEmail],[owner.id,owner.email],'with an account, the e-mail can open it too');
 assert.notEqual(a.record.salt,b.record.salt,'a fresh salt every time');
 assert.doesNotMatch(JSON.stringify(a.record),/7392/,'the PIN digits are not stored');
 assert.doesNotMatch(JSON.stringify(a.record),new RegExp(a.recoveryKey.replace(/-/g,'')),'nor the recovery key');
 assert.equal(await pinMatches('7392',a.record),true);
 for(const wrong of ['7393','2937','','739'])assert.equal(await pinMatches(wrong,a.record),false,wrong);
 await assert.rejects(createPinRecord('1234',null),/Sıralı/);
 // recovery key
 assert.match(a.recoveryKey,/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
 assert.ok([...a.recoveryKey.replace(/-/g,'')].every(c=>RECOVERY_ALPHABET.includes(c)));
 assert.doesNotMatch(RECOVERY_ALPHABET,/[01OIL]/,'nothing to misread');
 assert.equal(await recoveryMatches(a.recoveryKey,a.record),true);
 assert.equal(await recoveryMatches(' '+a.recoveryKey.toLowerCase().replace(/-/g,' ')+' ',a.record),true,'any case, spaces');
 assert.equal(await recoveryMatches(b.recoveryKey,a.record),false,"another PIN's key");
 assert.equal(await recoveryMatches(a.recoveryKey.slice(0,9),a.record),false,'half a key');
 const renewed=await withNewRecoveryKey(a.record);
 assert.equal(await recoveryMatches(renewed.recoveryKey,renewed.record),true);
 assert.equal(await recoveryMatches(a.recoveryKey,renewed.record),false,'the old key stops working');
 assert.equal(await pinMatches('7392',renewed.record),true,'the PIN itself is unchanged');
});

test('Recovery keys are uniform and readable; typed keys are tidied',()=>{
 const counts=new Map();
 const KEYS=3000;
 for(let i=0;i<KEYS;i++)for(const c of generateRecoveryKey().replace(/-/g,''))counts.set(c,(counts.get(c)??0)+1);
 assert.equal(counts.size,RECOVERY_ALPHABET.length,'every character appears');
 // Chi-square goodness of fit against a uniform alphabet. The limit is the
 // Wilson-Hilferty quantile at z=5, so a fair generator fails about once in
 // three million runs. (The former max/min<1.6 check failed about once in a
 // hundred runs and turned CI red at random.)
 const expected=KEYS*12/RECOVERY_ALPHABET.length;
 const chi=[...counts.values()].reduce((sum,n)=>sum+(n-expected)**2/expected,0);
 const df=RECOVERY_ALPHABET.length-1;
 const limit=df*(1-2/(9*df)+5*Math.sqrt(2/(9*df)))**3;
 assert.ok(chi<limit,`no character favoured (chi²=${chi.toFixed(1)}, limit ${limit.toFixed(1)})`);
 // biased bytes are rejected, not folded with a modulo
 const fixed=generateRecoveryKey(n=>new Uint8Array(n).fill(250).map((v,i)=>i%2?v:3));
 assert.equal(fixed,'DDDD-DDDD-DDDD');
 assert.equal(normaliseRecoveryKey('abcd efgh-jkmn'),'ABCD-EFGH-JKMN');
 assert.equal(normaliseRecoveryKey('ab0cdO1'),'ABCD','characters that are never in a key are dropped');
 assert.equal(normaliseRecoveryKey('ABCDEFGHJKMNPQRS'),'ABCD-EFGH-JKMN','twelve at most');
 assert.equal(maskEmail('veli@ornek.com'),'v•••@ornek.com');
 assert.equal(maskEmail('not-an-email'),'not-an-email');
});

test('Without key or e-mail: a 24-hour reset that the right PIN cancels',async()=>{
 const {record}=await createPinRecord('4018',null);
 const t=Date.parse('2026-11-22T10:00:00Z');
 assert.equal(resetWaitMs(record,t),null);
 const asked=requestPinReset(record,new Date(t));
 assert.equal(resetWaitMs(asked,t),RESET_DELAY_MS);
 assert.equal(resetWaitMs(asked,t+RESET_DELAY_MS-60_000),60_000);
 assert.equal(resetWaitMs(asked,t+RESET_DELAY_MS+1),0,'ready');
 assert.equal(resetWaitMs(cancelPinReset(asked),t),null);
 assert.equal(formatWait(RESET_DELAY_MS),'24 sa');
 assert.equal(formatWait(5*3600_000+12*60_000),'5 sa 12 dk');
 assert.equal(formatWait(30_000),'1 dk');
});

test('A stored PIN is read back only when it is intact; the first-release format still works',async()=>{
 const s=store();
 assert.equal(readPinRecord(s),null);
 const {record}=await createPinRecord('4018',owner);
 writePinRecord(record,s);
 assert.deepEqual(readPinRecord(s),record);
 const v1={v:1,salt:record.salt,hash:record.hash,ownerId:owner.id,ownerEmail:owner.email,createdAt:record.createdAt};
 s.setItem(PIN_STORAGE_KEY,JSON.stringify(v1));
 const upgraded=readPinRecord(s);
 assert.equal(upgraded.v,2);assert.equal(upgraded.recoveryHash,null);assert.equal(upgraded.ownerEmail,owner.email);
 assert.equal(await pinMatches('4018',upgraded),true);
 for(const broken of ['{bad',JSON.stringify({...record,hash:'zz'}),JSON.stringify({...record,ownerEmail:'x'}),JSON.stringify({...record,v:3})]){
  s.setItem(PIN_STORAGE_KEY,broken);
  assert.equal(readPinRecord(s),null,broken.slice(0,30));
 }
 writePinRecord(record,s);clearPinRecord(s);
 assert.equal(s.m.has(PIN_STORAGE_KEY),false);
});

test('Gate: only the PIN opens it; e-mail and recovery key open a lock or reset a forgotten PIN',()=>{
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/setMode\(record \? 'pin' : 'question'\);/,'a PIN replaces the question');
 assert.match(gate,/if \(await pinMatches\(value, pinRecord\)\) \{ pass\('pin'\); return; \}/);
 assert.match(gate,/if \(res\.user\?\.id !== owner\.id\) throw new Error\(/,'the code must come from the same family account');
 assert.match(gate,/pass\('email', purpose === 'reset-pin'\);/);
 assert.match(gate,/if \(await recoveryMatches\(recoveryKey, pinRecord\)\) \{ pass\('recovery', purpose === 'reset-pin'\); return; \}/);
 assert.match(gate,/else if \(pinRecord\?\.resetRequestedAt\) \{ writePinRecord\(cancelPinReset\(pinRecord\)\); recordGateEvent\(\{ e: 'reset-cancel' \}\); \}/,'proving who you are cancels a reset request');
 assert.match(gate,/\{hasRecovery && optionButton\('recovery', '🔑', 'Kurtarma anahtarıyla aç'/);
 assert.match(gate,/24 saatlik sıfırlamayı başlat/);
 assert.match(gate,/Bu isteği sen başlatmadıysan PIN'ini gir; istek iptal olur\./);
 assert.match(gate,/PIN'imi unuttum/);
 assert.match(gate,/<PinField id="ventra-parent-gate-answer"/);
 assert.doesNotMatch(gate,/description\.replace\(/,'callers give context only; the gate adds the instruction');
 const pinField=src('components/profile/PinField.tsx');
 assert.match(pinField,/type="password"\n\s*inputMode="numeric"/);
 assert.match(src('components/profile/parent-gate.css'),/\.pin-field:focus-within \.pin-box--current\{border-color:#bef264/);
});

test('Backup window: PIN without an account, saved only after the recovery key is confirmed',()=>{
 const ui=src('components/profile/AdultAccountModal.tsx');
 assert.match(ui,/const created = await createPinRecord\(value, pinOwner\);\n\s*setPendingPin\(\{ \.\.\.created, isNew: true \}\);/,'nothing is written before the key is confirmed');
 assert.match(ui,/const keyConfirmed = Boolean\(pendingPin\) && keyCheck\.trim\(\)\.toUpperCase\(\) === keyTail;/);
 assert.match(ui,/if \(!pendingPin \|\| !keyConfirmed\) return;\n\s*writePinRecord\(pendingPin\.record\);/);
 assert.match(ui,/if \(value !== pinFirst\) \{\n\s*setPinMessage\('PIN\\'ler eşleşmedi\. Baştan belirleyelim\.'\);/);
 assert.match(ui,/const lockSection = checked \? \(/,'available without a family account');
 assert.match(ui,/\{!configured && lockSection\}/,'and in builds without the cloud');
 assert.match(ui,/const kept = \{ \.\.\.tied, ownerId: null, ownerEmail: null \};/,'deleting the account keeps the PIN and its key, drops the e-mail');
 assert.match(ui,/İsteği iptal et/);
 assert.match(ui,/<div role="group" aria-label="PIN kaldırılsın mı\?"/);
});
