/**
 * Optional parent PIN (like a streaming service's "own passcode").
 *
 * The written question stops young children, but an older child can solve
 * it; a PIN they do not know cannot be solved. Every family can set one, with
 * or without a family account:
 * - a recovery key ("ABCD-EFGH-JKLM", shown once, confirmed by the parent)
 *   opens a locked gate at once and resets a forgotten PIN — no account needed;
 * - with a family account, a code sent to its e-mail does the same;
 * - with neither, a reset can be requested: it becomes possible after 24 hours,
 *   and entering the right PIN in the meantime cancels it (so a child who
 *   starts one cannot quietly remove the PIN).
 *
 * Stored on this device only, never in plain text: PBKDF2-SHA-256 with random
 * salts. It protects the parent area inside the app; it is not meant to resist
 * someone with developer tools (who could also clear site data).
 */

export const PIN_LENGTH=4;
export const PIN_STORAGE_KEY='ventra:parent-pin';
/** No 0/O, 1/I/L: nothing to misread when a parent copies the key by hand. */
export const RECOVERY_ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const RECOVERY_LENGTH=12;
export const RESET_DELAY_MS=24*60*60*1000;
const ITERATIONS=120_000;

export type ParentPinRecord={
 v:2;salt:string;hash:string;
 recoverySalt:string|null;recoveryHash:string|null;
 ownerId:string|null;ownerEmail:string|null;
 createdAt:string;resetRequestedAt:string|null;
};
export type PinOwner={id:string;email:string};

/** Easy-to-guess PINs a child might try first are refused. */
export function pinProblem(pin:string):string|null{
 if(!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin))return `PIN ${PIN_LENGTH} rakam olmalı.`;
 const d=[...pin].map(Number);
 if(d.every(x=>x===d[0]))return 'Aynı rakamlardan oluşan PIN kolay tahmin edilir; başka bir PIN seç.';
 const steps=d.slice(1).map((x,i)=>x-d[i]);
 if(steps.every(s=>s===1)||steps.every(s=>s===-1))return 'Sıralı rakamlar (1234 gibi) kolay tahmin edilir; başka bir PIN seç.';
 if(d[0]===d[2]&&d[1]===d[3])return 'Tekrarlanan ikili (1212 gibi) kolay tahmin edilir; başka bir PIN seç.';
 return null;
}

/** "veli@ornek.com" → "v•••@ornek.com": enough for a parent to recognise it. */
export function maskEmail(email:string):string{
 const [name,domain]=email.split('@');
 if(!name||!domain)return email;
 return `${name[0]}•••@${domain}`;
}

const toHex=(bytes:ArrayBuffer|Uint8Array)=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=(hex:string)=>new Uint8Array((hex.match(/../g)??[]).map(h=>parseInt(h,16)));
const randomBytes=(n:number)=>globalThis.crypto.getRandomValues(new Uint8Array(n));

/** WebCrypto needs a secure context (https, localhost, the app shell). */
export function pinSupported():boolean{
 return typeof globalThis.crypto!=='undefined'&&typeof globalThis.crypto.subtle?.importKey==='function';
}

async function derive(secret:string,saltHex:string):Promise<string>{
 const subtle=globalThis.crypto.subtle;
 const key=await subtle.importKey('raw',new TextEncoder().encode(secret),'PBKDF2',false,['deriveBits']);
 const bits=await subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromHex(saltHex),iterations:ITERATIONS},key,256);
 return toHex(bits);
}
export const hashPin=derive;

function sameDigest(a:string,b:string){
 if(a.length!==b.length)return false;
 let diff=0;
 for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}

/** Twelve characters from RECOVERY_ALPHABET without modulo bias. */
export function generateRecoveryKey(bytes:(n:number)=>Uint8Array=randomBytes):string{
 const limit=Math.floor(256/RECOVERY_ALPHABET.length)*RECOVERY_ALPHABET.length;
 let out='';
 while(out.length<RECOVERY_LENGTH){
  for(const b of bytes(RECOVERY_LENGTH*2)){
   if(b<limit&&out.length<RECOVERY_LENGTH)out+=RECOVERY_ALPHABET[b%RECOVERY_ALPHABET.length];
  }
 }
 return formatRecoveryKey(out);
}

const formatRecoveryKey=(raw:string)=>(raw.match(/.{1,4}/g)??[]).join('-');

/** Typed or pasted keys: any case, spaces or dashes; only key characters kept. */
export function normaliseRecoveryKey(input:string):string{
 const allowed=new Set(RECOVERY_ALPHABET);
 const raw=[...input.toUpperCase()].filter(c=>allowed.has(c)).join('').slice(0,RECOVERY_LENGTH);
 return formatRecoveryKey(raw);
}

const recoverySecret=(key:string)=>normaliseRecoveryKey(key).replace(/-/g,'');

export async function createPinRecord(pin:string,owner:PinOwner|null,now=new Date()):Promise<{record:ParentPinRecord;recoveryKey:string}>{
 const problem=pinProblem(pin);
 if(problem)throw new Error(problem);
 const salt=toHex(randomBytes(16));
 const base:ParentPinRecord={v:2,salt,hash:await derive(pin,salt),recoverySalt:null,recoveryHash:null,
  ownerId:owner?.id||null,ownerEmail:owner?.email||null,createdAt:now.toISOString(),resetRequestedAt:null};
 return withNewRecoveryKey(base);
}

/** A fresh recovery key (the old one stops working). */
export async function withNewRecoveryKey(record:ParentPinRecord):Promise<{record:ParentPinRecord;recoveryKey:string}>{
 const recoveryKey=generateRecoveryKey();
 const recoverySalt=toHex(randomBytes(16));
 return {recoveryKey,record:{...record,recoverySalt,recoveryHash:await derive(recoverySecret(recoveryKey),recoverySalt)}};
}

/** Constant-time comparison of the two hex digests. */
export async function pinMatches(pin:string,record:ParentPinRecord):Promise<boolean>{
 if(!/^\d+$/.test(pin))return false;
 return sameDigest(await derive(pin,record.salt),record.hash);
}

export async function recoveryMatches(key:string,record:ParentPinRecord):Promise<boolean>{
 const secret=recoverySecret(key);
 if(!record.recoverySalt||!record.recoveryHash||secret.length!==RECOVERY_LENGTH)return false;
 return sameDigest(await derive(secret,record.recoverySalt),record.recoveryHash);
}

export const requestPinReset=(record:ParentPinRecord,now=new Date()):ParentPinRecord=>({...record,resetRequestedAt:now.toISOString()});
export const cancelPinReset=(record:ParentPinRecord):ParentPinRecord=>({...record,resetRequestedAt:null});

/** null: no request; 0: the reset can be done now; >0: ms still to wait. */
export function resetWaitMs(record:ParentPinRecord,now=Date.now()):number|null{
 if(!record.resetRequestedAt)return null;
 const started=Date.parse(record.resetRequestedAt);
 if(Number.isNaN(started))return null;
 return Math.max(0,started+RESET_DELAY_MS-now);
}

/** "5 sa 12 dk" / "12 dk" for the reset countdown. */
export function formatWait(ms:number):string{
 const minutes=Math.ceil(ms/60000),hours=Math.floor(minutes/60),rest=minutes%60;
 return hours?`${hours} sa${rest?` ${rest} dk`:''}`:`${Math.max(1,minutes)} dk`;
}

type PinStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const browserStorage=():PinStorage|null=>{
 try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
};

export function readPinRecord(storage:PinStorage|null=browserStorage()):ParentPinRecord|null{
 try{
  const raw=storage?.getItem(PIN_STORAGE_KEY);
  if(!raw)return null;
  const r=JSON.parse(raw) as Record<string,unknown>;
  const hex=(x:unknown,len:number)=>typeof x==='string'&&new RegExp(`^[0-9a-f]{${len}}$`).test(x);
  const optionalText=(x:unknown)=>x===null||x===undefined||typeof x==='string';
  if((r.v!==1&&r.v!==2)||!hex(r.salt,32)||!hex(r.hash,64)||typeof r.createdAt!=='string')return null;
  if(!optionalText(r.ownerId)||!optionalText(r.ownerEmail)||!optionalText(r.resetRequestedAt))return null;
  if(r.ownerEmail&&!String(r.ownerEmail).includes('@'))return null;
  const recovery=hex(r.recoverySalt,32)&&hex(r.recoveryHash,64);
  // v1 (first release): owner required, no recovery key yet.
  return {v:2,salt:r.salt as string,hash:r.hash as string,
   recoverySalt:recovery?r.recoverySalt as string:null,recoveryHash:recovery?r.recoveryHash as string:null,
   ownerId:(r.ownerId as string)||null,ownerEmail:(r.ownerEmail as string)||null,
   createdAt:r.createdAt as string,resetRequestedAt:(r.resetRequestedAt as string)||null};
 }catch{return null;}
}

export function writePinRecord(record:ParentPinRecord,storage:PinStorage|null=browserStorage()):void{
 if(!storage)throw new Error('Bu tarayıcı PIN kaydetmeye izin vermiyor.');
 storage.setItem(PIN_STORAGE_KEY,JSON.stringify(record));
}

export function clearPinRecord(storage:PinStorage|null=browserStorage()):void{
 try{storage?.removeItem(PIN_STORAGE_KEY);}catch{/* nothing stored */}
}
