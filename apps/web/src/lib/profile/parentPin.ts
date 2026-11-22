/**
 * Optional parent PIN (like a streaming service's "own passcode").
 *
 * The written question stops young children, but an older child can solve
 * it; a PIN they do not know cannot be solved. The PIN belongs to a family
 * account: if it is forgotten, a code sent to that account's e-mail resets it.
 *
 * Stored on this device only, never in plain text: PBKDF2-SHA-256 with a
 * random salt. It protects the parent area inside the app; it is not meant
 * to resist someone with developer tools (who could also clear site data).
 */

export const PIN_LENGTH=4;
export const PIN_STORAGE_KEY='ventra:parent-pin';
const ITERATIONS=120_000;

export type ParentPinRecord={v:1;salt:string;hash:string;ownerId:string;ownerEmail:string;createdAt:string};
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

/** WebCrypto needs a secure context (https, localhost, the app shell). */
export function pinSupported():boolean{
 return typeof globalThis.crypto!=='undefined'&&typeof globalThis.crypto.subtle?.importKey==='function';
}

export async function hashPin(pin:string,saltHex:string):Promise<string>{
 const subtle=globalThis.crypto.subtle;
 const key=await subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 const bits=await subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromHex(saltHex),iterations:ITERATIONS},key,256);
 return toHex(bits);
}

export async function createPinRecord(pin:string,owner:PinOwner,now=new Date()):Promise<ParentPinRecord>{
 const problem=pinProblem(pin);
 if(problem)throw new Error(problem);
 if(!owner.id||!owner.email)throw new Error('PIN bir aile hesabına bağlanmalı.');
 const salt=toHex(globalThis.crypto.getRandomValues(new Uint8Array(16)));
 return {v:1,salt,hash:await hashPin(pin,salt),ownerId:owner.id,ownerEmail:owner.email,createdAt:now.toISOString()};
}

/** Constant-time comparison of the two hex digests. */
export async function pinMatches(pin:string,record:ParentPinRecord):Promise<boolean>{
 if(!/^\d+$/.test(pin))return false;
 const candidate=await hashPin(pin,record.salt);
 if(candidate.length!==record.hash.length)return false;
 let diff=0;
 for(let i=0;i<candidate.length;i++)diff|=candidate.charCodeAt(i)^record.hash.charCodeAt(i);
 return diff===0;
}

type PinStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const browserStorage=():PinStorage|null=>{
 try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
};

export function readPinRecord(storage:PinStorage|null=browserStorage()):ParentPinRecord|null{
 try{
  const raw=storage?.getItem(PIN_STORAGE_KEY);
  if(!raw)return null;
  const r=JSON.parse(raw) as Partial<ParentPinRecord>;
  const hex=(x:unknown,len:number)=>typeof x==='string'&&new RegExp(`^[0-9a-f]{${len}}$`).test(x);
  if(r.v!==1||!hex(r.salt,32)||!hex(r.hash,64)||typeof r.ownerId!=='string'||!r.ownerId||
     typeof r.ownerEmail!=='string'||!r.ownerEmail.includes('@')||typeof r.createdAt!=='string')return null;
  return r as ParentPinRecord;
 }catch{return null;}
}

export function writePinRecord(record:ParentPinRecord,storage:PinStorage|null=browserStorage()):void{
 if(!storage)throw new Error('Bu tarayıcı PIN kaydetmeye izin vermiyor.');
 storage.setItem(PIN_STORAGE_KEY,JSON.stringify(record));
}

export function clearPinRecord(storage:PinStorage|null=browserStorage()):void{
 try{storage?.removeItem(PIN_STORAGE_KEY);}catch{/* nothing stored */}
}
