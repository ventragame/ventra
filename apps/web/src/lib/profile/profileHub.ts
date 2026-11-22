import type {PlayerProfile} from '@ventra/shared';

/** Copy and small rules shared by the player hub (child side) and the adult
 * backup window (parent side). Pure functions: no storage, no network. */

export type EnglishLevel='Pre-A1'|'A1'|'A2';

export const ENGLISH_LEVEL_CHOICES:ReadonlyArray<{id:EnglishLevel;title:string;hint:string;icon:string}>=[
 {id:'Pre-A1',title:'Yeni başlıyorum',hint:'İlk kelimeler, bol resim ve ses',icon:'🌱'},
 {id:'A1',title:'Biraz biliyorum',hint:'Günlük kelimeler ve kısa cümleler',icon:'🌿'},
 {id:'A2',title:'Temel biliyorum',hint:'Daha uzun cümleler ve hikâyeler',icon:'🌳'}
];

export const GRADE_CHOICES=[1,2,3,4,5,6,7,8] as const;

export function englishLevelTitle(level?:string|null):string{
 return ENGLISH_LEVEL_CHOICES.find(choice=>choice.id===level)?.title??'Yeni başlıyorum';
}

/** "3. sınıf · Biraz biliyorum" — grade only when the family chose one. */
export function playerDetail(profile:Pick<PlayerProfile,'gradeLevel'|'englishLevel'>):string{
 const level=englishLevelTitle(profile.englishLevel);
 return profile.gradeLevel?`${profile.gradeLevel}. sınıf · ${level}`:level;
}

const startOfDay=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();

/** lastPlayedAt is written when a mission is finished, not when a child is picked. */
export function lastPlayedLabel(iso:string|null|undefined,now=new Date()):string{
 const then=iso?new Date(iso):null;
 if(!then||Number.isNaN(then.getTime()))return 'Henüz görev bitirmedi';
 const days=Math.round((startOfDay(now)-startOfDay(then))/86400000);
 if(days<=0)return 'Son görev: bugün';
 if(days===1)return 'Son görev: dün';
 if(days<7)return `Son görev: ${days} gün önce`;
 return 'Son görev: '+then.toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
}

export function lastSyncLabel(iso:string|null|undefined,now=new Date()):string{
 const then=iso?new Date(iso):null;
 if(!then||Number.isNaN(then.getTime()))return 'Bu cihazda henüz eşitlenmedi';
 const time=then.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
 const days=Math.round((startOfDay(now)-startOfDay(then))/86400000);
 if(days<=0)return `Son eşitleme: bugün ${time}`;
 if(days===1)return `Son eşitleme: dün ${time}`;
 return `Son eşitleme: ${then.toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} ${time}`;
}

export function nicknameProblem(raw:string):string|null{
 const trimmed=raw.trim();
 return trimmed.length<2||trimmed.length>15?'Takma ad 2–15 karakter arasında olmalı.':null;
}

/** linked: backed up to the signed-in family; local: this device only;
 * foreign: backed up to a different adult account (never touched here). */
export type CloudState='linked'|'local'|'foreign';
export function cloudState(profile:Pick<PlayerProfile,'userId'>,accountUserId:string|null):CloudState{
 if(!profile.userId)return 'local';
 if(!accountUserId)return 'linked';
 return profile.userId===accountUserId?'linked':'foreign';
}

/** Digits only; Supabase e-mail codes are 6 (or up to 10) digits. */
export function cleanOtpCode(value:string):string{
 return value.replace(/\D/g,'').slice(0,10);
}

export function isEmailLike(value:string):boolean{
 return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Parents see what happened and what to do, never a server stack or a
 * setup note. Our own Turkish messages keep their first sentence; English
 * auth/network errors are translated; anything else gets the fallback. */
const ACCOUNT_MESSAGES={
 rate:['Çok sık kod istendi. Bir dakika bekleyip yeniden dene.','Çok sık kod istendi. Bir dakika bekleyip yeniden deneyin.'],
 code:['Kod geçersiz ya da süresi dolmuş. Yeni bir kod isteyebilirsin.','Kod geçersiz ya da süresi dolmuş. Yeni bir kod isteyebilirsiniz.'],
 email:['E-posta adresini kontrol et.','E-posta adresinizi kontrol edin.'],
 network:['İnternet bağlantısı kurulamadı. Bağlantını kontrol edip yeniden dene.','İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.']
} as const;

/** `formal` addresses the reader as "siz" (school panel for teachers and
 * parents); the default "sen" matches the family backup window. */
export function friendlyAccountError(raw:unknown,fallback:string,options:{formal?:boolean}={}):string{
 const text=raw instanceof Error?raw.message:typeof raw==='string'?raw:'';
 if(!text.trim())return fallback;
 const lower=text.toLowerCase();
 const say=(key:keyof typeof ACCOUNT_MESSAGES)=>ACCOUNT_MESSAGES[key][options.formal?1:0];
 if(/rate limit|too many|only request this after|security purposes/.test(lower))return say('rate');
 if(/expired|otp|token/.test(lower))return say('code');
 if(/invalid.*email|email.*invalid|validate email/.test(lower))return say('email');
 if(/failed to fetch|network|fetch failed|load failed|timeout/.test(lower))return say('network');
 const own=text.split(/:\s/)[0].trim();
 if(/[çğıöşüÇĞİÖŞÜ]/.test(own)&&!/sql|migration|rpc|supabase|ortam değişken/i.test(own))
  return /[.!?]$/.test(own)?own:own+'.';
 return fallback;
}
