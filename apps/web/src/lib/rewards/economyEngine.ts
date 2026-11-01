/**
 * P5 economy v1: only earned-on-device, cosmetic-only currency.
 * Never use this client-side state as a financial or cross-device authority.
 */
export const WORLD_GAMES = [
  {id:'island_word_garden_steps',label:'Hayvan Çayırı',count:5,icon:'🐾'},
  {id:'island_word_garden_colors',label:'Renk Korusu',count:3,icon:'🎨'},
  {id:'island_word_garden_numbers',label:'Sayı Vadisi',count:15,icon:'🔢'},
  {id:'island_word_garden_food',label:'Lezzet Pazarı',count:15,icon:'🍎'},
  {id:'island_word_garden_family',label:'Aile Köyü',count:20,icon:'🏡'},
  {id:'island_word_garden_temple',label:'Keşif Tapınağı',count:25,icon:'✨'}
] as const;
/**
 * Planning only. These SKU identifiers cannot initiate a transaction.
 * Do not expose pack purchase buttons outside an authenticated parent area.
 * Store prices are deliberately not hard-coded.
 */
export const PLANNED_COIN_PACKS=[
  {id:'ventra.coins.100',coins:100,label:'Küçük Paket'},
  {id:'ventra.coins.350',coins:350,label:'Macera Paketi'},
  {id:'ventra.coins.800',coins:800,label:'Koleksiyon Paketi'}
] as const;
export const PAID_COINS_ENABLED=false as const;
export const COSMETICS=[
  {id:'hat_sprout',name:'Filiz Şapka',icon:'🌱',price:20,group:'hat'},
  {id:'hat_crown',name:'Kristal Taç',icon:'👑',price:65,group:'hat'},
  {id:'hat_wizard',name:'Yıldız Şapkası',icon:'🧙',price:55,group:'hat'},
  {id:'badge_fox',name:'Tilki Rozeti',icon:'🦊',price:25,group:'badge'},
  {id:'badge_moon',name:'Ay Rozeti',icon:'🌙',price:40,group:'badge'},
  {id:'badge_star',name:'Kutup Yıldızı',icon:'🌟',price:45,group:'badge'},
  {id:'aura_aurora',name:'Kuzey Işıkları',icon:'🌈',price:80,group:'aura'},
  {id:'aura_rain',name:'Parıltılı Yağmur',icon:'✨',price:55,group:'aura'}
] as const;
export type CosmeticId=typeof COSMETICS[number]['id'];
export type CosmeticGroup=typeof COSMETICS[number]['group'];
export type EconomyEntry={
  id:string;amount:number;kind:'level'|'daily'|'cosmetic';at:string;
};
export type EconomyState={
  version:1;
  profileId:string;
  entries:EconomyEntry[];
  owned:CosmeticId[];
  equipped:Partial<Record<CosmeticGroup,CosmeticId>>;
};
export type Evidence={gameId:string;levelId:number;stars:number};
export type DailyGoal={id:'quest_1'|'quest_2'|'quest_3';required:number;coins:number;title:string};
export const DAILY_GOALS:readonly DailyGoal[]=[
  {id:'quest_1',required:1,coins:5,title:'Bir macerayı tamamla'},
  {id:'quest_2',required:2,coins:8,title:'İki macera tamamla'},
  {id:'quest_3',required:3,coins:12,title:'Üç macera tamamla'}
];
export function localDay(date:Date):string{
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid day');
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function initialEconomy(profileId:string):EconomyState{
  if(!profileId)throw new Error('Profile required');
  return {version:1,profileId,entries:[],owned:[],equipped:{}};
}
export function economyBalance(s:EconomyState):number{
  return s.entries.reduce((sum,e)=>sum+e.amount,0);
}
function addEntry(s:EconomyState,e:EconomyEntry):EconomyState{
  if(s.entries.some(x=>x.id===e.id))return s;
  return {...s,entries:[...s.entries,e]};
}
function completedEvidence(e:Evidence):boolean{
  const found=WORLD_GAMES.find(g=>g.id===e.gameId);
  return Boolean(found&&Number.isInteger(e.levelId)&&e.levelId>=1&&e.levelId<=found.count
    &&Number.isInteger(e.stars)&&e.stars>0&&e.stars<=3);
}
/** One earned grant per distinct recorded level; replays and higher scores are not re-minted. */
export function reconcileRewards(s:EconomyState,evidence:readonly Evidence[],at:string):EconomyState{
  let out=s;
  for(const record of evidence){
    if(!completedEvidence(record))continue;
    const id=`level:${record.gameId}:${record.levelId}`;
    out=addEntry(out,{id,kind:'level',amount:10,at});
  }
  return out;
}
export function dailyStatus(s:EconomyState,day:string,plays:number){
  const count=Math.max(0,Math.min(10000,Math.trunc(plays)||0));
  return DAILY_GOALS.map(goal=>({...goal,progress:Math.min(count,goal.required),
    eligible:count>=goal.required,claimed:s.entries.some(e=>e.id===`daily:${day}:${goal.id}`)}));
}
/** Day and play-count evidence must come from recorded activities, not a caller-supplied toggle. */
export function claimDaily(s:EconomyState,day:string,goalId:DailyGoal['id'],plays:number,at:string):EconomyState{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid day');
  const goal=DAILY_GOALS.find(g=>g.id===goalId);
  if(!goal||!Number.isInteger(plays)||plays<goal.required)throw new Error('Goal not yet complete');
  return addEntry(s,{id:`daily:${day}:${goal.id}`,kind:'daily',amount:goal.coins,at});
}
export function buyCosmetic(s:EconomyState,id:CosmeticId,at:string):EconomyState{
  const item=COSMETICS.find(c=>c.id===id);
  if(!item)throw new Error('Unknown cosmetic');
  if(s.owned.includes(id))return s; // no double charge
  if(economyBalance(s)<item.price)throw new Error('Yetersiz Ventra Coin');
  return {
    ...s,owned:[...s.owned,id],
    entries:[...s.entries,{id:`cosmetic:${id}`,kind:'cosmetic',amount:-item.price,at}]
  };
}
export function equipCosmetic(s:EconomyState,id:CosmeticId|null,group:CosmeticGroup):EconomyState{
  if(id===null){const equipped={...s.equipped};delete equipped[group];return {...s,equipped};}
  const item=COSMETICS.find(c=>c.id===id);
  if(!item||item.group!==group||!s.owned.includes(id))throw new Error('Unowned cosmetic');
  return {...s,equipped:{...s.equipped,[group]:id}};
}
/** No browser-validated receipts or parent gate can mint paid coins. */
export function creditPaidCoins():never{
  throw new Error('Paid coin credits require verified server receipt, parent authorization and store billing.');
}
