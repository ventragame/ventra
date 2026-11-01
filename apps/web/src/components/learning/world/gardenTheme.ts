import type {WorldObject} from './worldLayout.ts';
export type GardenDistrictId='animals'|'colors'|'numbers'|'food'|'family'|'sanctuary';
export type GardenDistrictStatus='ready'|'continue'|'complete'|'locked'|'loading'|'error';
export type GardenDistrictProgress={id:GardenDistrictId;completed:number;total:number;stars:number;available:boolean;unlocked:boolean;error?:boolean};
export const GARDEN_THEMES:Record<GardenDistrictId,{
 name:string;subtitle:string;eyebrow:string;icon:string;accent:string;light:string;art:string;words:string
}>={
 animals:{name:'Hayvan Çayırı',subtitle:'Animals & Nature',eyebrow:'THE WILD MEADOW',icon:'🐾',accent:'#70d3a1',light:'#d2f9ce',art:'meadow',words:'40 hayvan · İngilizce keşif'},
 colors:{name:'Renk Korusu',subtitle:'Colours & Magic',eyebrow:'THE COLOUR GROVE',icon:'🎨',accent:'#ff93c5',light:'#ffe2f5',art:'grove',words:'İngilizce renkler ve karışımlar'},
 numbers:{name:'Sayı Vadisi',subtitle:'English Numbers',eyebrow:'THE CRYSTAL VALLEY',icon:'🔢',accent:'#94d8ff',light:'#e0f5ff',art:'valley',words:'İngilizce sayılar · 1–1000'},
 food:{name:'Lezzet Pazarı',subtitle:'Food & Drinks',eyebrow:'THE FOOD MARKET',icon:'🍓',accent:'#ffc481',light:'#ffeed4',art:'market',words:'45 kelime · 3 pazar sokağı'},
 family:{name:'Aile Köyü',subtitle:'Family & Home',eyebrow:'THE FAMILY VILLAGE',icon:'🏡',accent:'#d3b0ff',light:'#efe2ff',art:'village',words:'60 kavram · 4 mahalle'},
 sanctuary:{name:'Keşif Tapınağı',subtitle:'The English Finale',eyebrow:'THE LOST TEMPLE',icon:'✨',accent:'#ffda8c',light:'#fff1cb',art:'temple',words:'5 salon · İngilizce büyük final'}
};
export const GARDEN_ORDER:readonly GardenDistrictId[]=['animals','colors','numbers','food','family','sanctuary'];
export function districtStatus(p:GardenDistrictProgress):GardenDistrictStatus{
 if(p.error)return 'error';
 if(!p.available)return 'loading';
 if(!p.unlocked)return 'locked';
 if(p.total>0&&p.completed>=p.total)return 'complete';
 return p.completed>0?'continue':'ready';
}
export function districtStatusLabel(s:GardenDistrictStatus):string{
 return {ready:'KEŞFE BAŞLA',continue:'DEVAM ET',complete:'TAMAMLANDI',locked:'KİLİTLİ',loading:'YÜKLENİYOR',error:'YÜKLEME HATASI'}[s];
}
export function districtPercent(completed:number,total:number):number{
 if(!Number.isFinite(completed)||!Number.isFinite(total)||total<=0)return 0;
 return Math.round(Math.max(0,Math.min(1,completed/total))*100);
}
export function mapProgress(p:readonly GardenDistrictProgress[]){
 const done=p.reduce((n,x)=>n+Math.max(0,Math.min(x.total,x.completed)),0);
 const total=p.reduce((n,x)=>n+Math.max(0,x.total),0);
 const stars=p.reduce((n,x)=>n+Math.max(0,x.stars),0);
 return {done,total,stars,percent:districtPercent(done,total),finished:p.filter(x=>districtStatus(x)==='complete').length};
}
export function decorateWorldObjects(objects:readonly WorldObject[],progress:readonly GardenDistrictProgress[]):WorldObject[]{
 return objects.map(obj=>{
  const p=progress.find(x=>x.id===obj.id);
  if(!p)return obj;
  return {...obj,completed:p.completed,total:p.total,stars:p.stars};
 });
}
