import type { IProgressRepository } from '../progress/types.ts';
import type { EconomyState, Evidence, DailyGoal, CosmeticId, CosmeticGroup } from './economyEngine.ts';
import {
  initialEconomy,reconcileRewards,economyBalance,dailyStatus,claimDaily,
  buyCosmetic,equipCosmetic,buyAvatar,migrateLegacyAvatar,localDay,WORLD_GAMES
} from './economyEngine.ts';

export type PassportSnapshot={
  economy:EconomyState;balance:number;totalStars:number;completed:number;
  worldStats:{id:string;label:string;icon:string;completed:number;total:number}[];
  daily:ReturnType<typeof dailyStatus>;day:string;plays:number;
  learned:{animals:number;colors:number;numbers:number;food:number;family:number;temple:number};
};
export interface EconomyStorage {
  mutate(profileId:string,fn:(state:EconomyState)=>EconomyState):Promise<EconomyState>;
  remove(profileId:string):Promise<void>;
}
export class MemoryEconomyStorage implements EconomyStorage{
  private records=new Map<string,EconomyState>();
  async mutate(id:string,fn:(state:EconomyState)=>EconomyState){
    const current=this.records.get(id)??initialEconomy(id);
    const next=fn(current);
    if(next.profileId!==id||economyBalance(next)<0)throw new Error('Invalid profile/balance');
    this.records.set(id,next);return next;
  }
  async remove(id:string){this.records.delete(id);}
}
/**
 * Uses the same IndexedDB meta store as profiles; one readwrite transaction for
 * every balance/inventory write prevents duplicate spends in concurrent tabs.
 * Cloud reconciliation / paid balance must be provided by a trusted server later.
 */
export class IndexedDbEconomyStorage implements EconomyStorage{
  private async database():Promise<IDBDatabase>{
    if(typeof window==='undefined'||!window.indexedDB)throw new Error('Local storage unavailable');
    return new Promise((resolve,reject)=>{
      const request=window.indexedDB.open('VentraProgressDB',2);
      request.onupgradeneeded=()=>{request.transaction?.abort();};
      request.onerror=()=>reject(request.error??new Error('Database unavailable'));
      request.onsuccess=()=>resolve(request.result);
    });
  }
  async mutate(profileId:string,fn:(state:EconomyState)=>EconomyState):Promise<EconomyState>{
    const db=await this.database();
    return new Promise<EconomyState>((resolve,reject)=>{
      const tx=db.transaction('meta','readwrite');
      const store=tx.objectStore('meta'),key=`p5:${profileId}`;
      let result:EconomyState|null=null;
      const get=store.get(key);
      get.onsuccess=()=>{
        try {
          const current=(get.result?.value as EconomyState|undefined)??initialEconomy(profileId);
          if(current.profileId!==profileId||current.version!==1)throw new Error('Invalid economy state');
          const next=fn(current);
          if(next.profileId!==profileId||economyBalance(next)<0)throw new Error('Invalid economy transaction');
          result=next;
          store.put({key,value:next});
        }catch{tx.abort();}
      };
      tx.oncomplete=()=>{db.close();if(result)resolve(result);else reject(new Error('No economy result'));};
      tx.onerror=()=>{db.close();reject(tx.error??new Error('Economy transaction failed'));};
      tx.onabort=()=>{db.close();reject(tx.error??new Error('Economy transaction rejected'));};
    });
  }
  async remove(profileId:string):Promise<void>{
    const db=await this.database();
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').delete(`p5:${profileId}`);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
    db.close();
  }
}
let browserStore:IndexedDbEconomyStorage|null=null;
export function economyStorage():EconomyStorage {
  if(typeof window!=='undefined'&&window.indexedDB)
    return browserStore??(browserStore=new IndexedDbEconomyStorage());
  return new MemoryEconomyStorage();
}
function completedRecord(level:{bestStars:number;completedCount:number}|undefined|null):boolean{
  return Boolean(level&&(level.completedCount>0||level.bestStars>0));
}
export async function passportEvidence(repo:IProgressRepository,profileId:string){
  const all=await Promise.all(WORLD_GAMES.map(async world=>{
    const levels=await repo.getAllLevelProgress(world.id,profileId);
    const complete:Evidence[]=[];
    for(let i=1;i<=world.count;i++){
      const level=levels[i];
      if(completedRecord(level))complete.push({gameId:world.id,levelId:i,stars:Math.max(1,Math.min(3,level.bestStars))});
    }
    return {world,complete};
  }));
  return {
    evidence:all.flatMap(e=>e.complete),
    worlds:all.map(e=>({id:e.world.id,label:e.world.label,icon:e.world.icon,
      completed:e.complete.length,total:e.world.count}))
  };
}
async function playEvidence(repo:IProgressRepository,profileId:string,now:Date){
  const day=localDay(now);
  const logs=await repo.getActivityLog(200,profileId);
  const validLabels=WORLD_GAMES.map(w=>w.label);
  const plays=logs.filter(e=>e.type==='game'&&e.status==='success'&&
    validLabels.some(name=>e.title.startsWith(name+' —'))&&
    localDay(new Date(e.timestamp))===day).length;
  return {day,plays};
}
export async function getPassport(repo:IProgressRepository,profileId:string,
  storage:EconomyStorage=economyStorage(),now=new Date()):Promise<PassportSnapshot>{
  const [world,activity,stars,animalAnswers,colorAnswers,numberAnswers,foodAnswers,familyAnswers,templeAnswers]=await Promise.all([
    passportEvidence(repo,profileId),playEvidence(repo,profileId,now),repo.getTotalStars(profileId),
    repo.getAnimalAnswerHistory(profileId),repo.getColorAnswerHistory(profileId),repo.getNumberAnswerHistory(profileId),repo.getFoodAnswerHistory(profileId),repo.getFamilyAnswerHistory(profileId),repo.getTempleAnswerHistory(profileId)
  ]);
  const economy=await storage.mutate(profileId,s=>reconcileRewards(s,world.evidence,now.toISOString()));
  const learned={
    animals:new Set(animalAnswers.filter(e=>e.kind==='discovery').map(e=>e.wordId)).size,
    colors:new Set(colorAnswers.filter(e=>e.kind==='discovery').map(e=>e.wordId)).size,
    numbers:new Set(numberAnswers.filter(e=>e.kind==='discovery').map(e=>e.value)).size,
    food:new Set(foodAnswers.filter(e=>e.kind==='discovery').map(e=>e.wordId)).size,
    family:new Set(familyAnswers.filter(e=>e.kind==='discovery').map(e=>e.wordId)).size,
    temple:new Set(templeAnswers.filter(e=>e.kind==='discovery').map(e=>e.wordId)).size
  };
  return {economy,balance:economyBalance(economy),totalStars:stars,completed:world.evidence.length,
    learned,worldStats:world.worlds,daily:dailyStatus(economy,activity.day,activity.plays),...activity};
}
export async function claimQuest(repo:IProgressRepository,profileId:string,goalId:DailyGoal['id'],
  storage:EconomyStorage=economyStorage(),now=new Date()):Promise<EconomyState>{
  const {day,plays}=await playEvidence(repo,profileId,now);
  return storage.mutate(profileId,s=>claimDaily(s,day,goalId,plays,now.toISOString()));
}
export async function purchaseCosmetic(profileId:string,id:CosmeticId,
  storage:EconomyStorage=economyStorage(),now=new Date()){
  return storage.mutate(profileId,s=>buyCosmetic(s,id,now.toISOString()));
}
export async function setEquipped(profileId:string,id:CosmeticId|null,group:CosmeticGroup,
  storage:EconomyStorage=economyStorage()){
  return storage.mutate(profileId,s=>equipCosmetic(s,id,group));
}

/** Existing P5 IndexedDB transaction is the single writer for avatar unlocks.
 * Coins are earned in games, not purchasable for real money. Cloud inventory
 * reconciliation is not yet authoritative; do not promise cross-device unlocks. */
export async function getAvatarShop(repo:IProgressRepository,profileId:string,currentAvatarId:string,
  storage:EconomyStorage=economyStorage(),now=new Date()){
 await getPassport(repo,profileId,storage,now);
 const state=await storage.mutate(profileId,s=>migrateLegacyAvatar(s,currentAvatarId));
 return {economy:state,balance:economyBalance(state)};
}
export async function purchaseAvatarWithCoins(repo:IProgressRepository,profileId:string,
  avatarId:string,currentAvatarId:string,
  storage:EconomyStorage=economyStorage(),now=new Date()){
 await getAvatarShop(repo,profileId,currentAvatarId,storage,now);
 return storage.mutate(profileId,s=>buyAvatar(s,avatarId,now.toISOString()));
}
