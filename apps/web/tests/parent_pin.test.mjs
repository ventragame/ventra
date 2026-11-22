import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 PIN_STORAGE_KEY,clearPinRecord,createPinRecord,maskEmail,pinMatches,pinProblem,pinSupported,readPinRecord,writePinRecord
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

test('The PIN is stored as a salted PBKDF2 digest, never as digits, and checks correctly',async()=>{
 assert.ok(pinSupported(),'WebCrypto is available here (and in https / the app shell)');
 const a=await createPinRecord('7392',owner,new Date('2026-11-22T10:00:00Z'));
 const b=await createPinRecord('7392',owner);
 assert.notEqual(a.salt,b.salt,'a fresh salt every time');
 assert.notEqual(a.hash,b.hash);
 assert.doesNotMatch(JSON.stringify(a),/7392/,'the digits are not stored');
 assert.match(a.hash,/^[0-9a-f]{64}$/);
 assert.equal(await pinMatches('7392',a),true);
 for(const wrong of ['7393','2937','','739'])assert.equal(await pinMatches(wrong,a),false,wrong);
 assert.deepEqual([a.ownerId,a.ownerEmail],[owner.id,owner.email],'tied to the family that can reset it');
 await assert.rejects(createPinRecord('1234',owner),/Sıralı/);
 await assert.rejects(createPinRecord('7392',{id:'',email:''}),/aile hesabına bağlanmalı/);
});

test('A stored PIN is read back only when it is intact',async()=>{
 const s=store();
 assert.equal(readPinRecord(s),null);
 const record=await createPinRecord('4018',owner);
 writePinRecord(record,s);
 assert.deepEqual(readPinRecord(s),record);
 for(const broken of ['{bad',JSON.stringify({...record,hash:'zz'}),JSON.stringify({...record,ownerEmail:'x'}),JSON.stringify({...record,v:2})]){
  s.setItem(PIN_STORAGE_KEY,broken);
  assert.equal(readPinRecord(s),null,broken.slice(0,30));
 }
 writePinRecord(record,s);clearPinRecord(s);
 assert.equal(s.m.has(PIN_STORAGE_KEY),false);
 assert.equal(maskEmail('veli@ornek.com'),'v•••@ornek.com');
 assert.equal(maskEmail('not-an-email'),'not-an-email');
});

test('Gate: with a PIN only the PIN opens it; the family e-mail unlocks a lock and resets a forgotten PIN',()=>{
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/setMode\(record \? 'pin' : 'question'\);/,'a PIN replaces the question');
 assert.match(gate,/if \(await pinMatches\(value, pinRecord\)\) \{ pass\(\); return; \}/);
 assert.match(gate,/const owner: PinOwner \| null = pinRecord \? \{ id: pinRecord\.ownerId, email: pinRecord\.ownerEmail \} : account;/);
 assert.match(gate,/if \(res\.user\?\.id !== owner\.id\) throw new Error\(/,'the code must come from the same family account');
 assert.match(gate,/if \(purpose === 'reset-pin'\) clearPinRecord\(\);\n\s*pass\(\);/);
 assert.match(gate,/\{owner \? \(\n\s*<button type="button" onClick=\{\(\) => openEmail\('unlock'\)\}/,'a locked gate offers the e-mail code');
 assert.match(gate,/Beklememek için: “Yedekleme ve hesap” bölümünden aile hesabına giriş yaparsan/,'without an account the parent learns how to avoid waiting');
 assert.match(gate,/PIN'imi unuttum/);
 assert.match(gate,/<PinField id="ventra-parent-gate-answer"/);
 assert.doesNotMatch(gate,/description\.replace\(/,'callers give context only; the gate adds the instruction');
 const pinField=src('components/profile/PinField.tsx');
 assert.match(pinField,/type="password"\n\s*inputMode="numeric"/);
 assert.match(src('components/profile/parent-gate.css'),/\.pin-field:focus-within \.pin-box--current\{border-color:#bef264/);
});

test('Backup window: a PIN is set twice, tied to the family account, and goes away with the account',()=>{
 const ui=src('components/profile/AdultAccountModal.tsx');
 assert.match(ui,/const pinOwner = account \? \{ id: account\.userId, email: account\.email \}/);
 assert.match(ui,/if \(value !== pinFirst\) \{\n\s*setPinMessage\('PIN\\'ler eşleşmedi\. Baştan belirleyelim\.'\);/);
 assert.match(ui,/const record = await createPinRecord\(value, pinOwner\);\n\s*writePinRecord\(record\);/);
 assert.match(ui,/const pinWasTied = readPinRecord\(\)\?\.ownerId === accountId;\n\s*if \(pinWasTied\) \{ clearPinRecord\(\);/,'no PIN left that nobody can reset');
 assert.match(ui,/<div role="group" aria-label="PIN kaldırılsın mı\?"/);
});
