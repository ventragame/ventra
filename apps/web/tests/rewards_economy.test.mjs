import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {MemoryEconomyStorage,getPassport,claimQuest,purchaseCosmetic,setEquipped,getAvatarShop,purchaseAvatarWithCoins} from '../src/lib/rewards/economyRepository.ts';
import {COSMETICS,PLANNED_COIN_PACKS,PAID_COINS_ENABLED,economyBalance,initialEconomy,claimDaily,creditPaidCoins,localDay,buyAvatar,avatarIsOwned,migrateLegacyAvatar} from '../src/lib/rewards/economyEngine.ts';
const now=new Date('2026-11-01T12:00:00.000Z');
test('P5 first-completion coins never mint on replay, earned and stars stay separate',async()=>{
 const repo=new MemoryProgressRepository(),storage=new MemoryEconomyStorage();
 const p=await repo.createProfile({nickname:'Explorer',avatarId:'avatar_explorer'});
 const before=await getPassport(repo,p.id,storage,now);
 assert.equal(before.balance,0);
 async function game(id){return repo.recordGameCompleted({sessionId:id,profileId:p.id,
    gameId:'island_word_garden_steps',levelId:1,outcomeId:'en.a1.vocab.animals',score:90,
    success:true,starsEarned:3,metrics:{durationSeconds:12,attemptsCount:1,accuracyRate:1},
    completedAt:now.toISOString()},p.id);}
 await game('session-a');
 const first=await getPassport(repo,p.id,storage,now);
 assert.equal(first.balance,10);assert.equal(first.totalStars,3);
 await game('session-b');
 const replay=await getPassport(repo,p.id,storage,now);
 assert.equal(replay.balance,10);
 assert.equal(replay.economy.entries.length,1);
});
test('P5 daily rewards derive from actual dated game records and cap per day',async()=>{
 const repo=new MemoryProgressRepository(),storage=new MemoryEconomyStorage();
 const p=await repo.createProfile({nickname:'Daily',avatarId:'avatar_explorer'});
 await assert.rejects(claimQuest(repo,p.id,'quest_1',storage,now),/Goal/);
 for(let n=1;n<=3;n++)await repo.recordGameCompleted({
  sessionId:'daily-'+n,profileId:p.id,gameId:'island_word_garden_steps',levelId:1,
  outcomeId:'en.a1.vocab.animals',success:true,starsEarned:1,score:80,
  metrics:{durationSeconds:10,attemptsCount:1,accuracyRate:1},completedAt:now.toISOString()},p.id);
 for(const q of ['quest_1','quest_2','quest_3'])await claimQuest(repo,p.id,q,storage,now);
 await claimQuest(repo,p.id,'quest_1',storage,now);
 const state=await getPassport(repo,p.id,storage,now);
 assert.equal(state.balance,35); // one unique level =10, daily 5+8+12
 assert.deepEqual(state.daily.map(q=>q.claimed),[true,true,true]);
 const tomorrow=new Date('2026-11-02T12:00:00.000Z');
 await assert.rejects(claimQuest(repo,p.id,'quest_1',storage,tomorrow),/Goal/);
});
test('P5 cosmetic buying is atomic per profile and cannot spend twice, equip unowned, or go negative',async()=>{
 const storage=new MemoryEconomyStorage(),p='child-x';
 await storage.mutate(p,s=>({...s,entries:[{id:'grant',amount:60,kind:'daily',at:now.toISOString()}]}));
 const item=COSMETICS.find(x=>x.id==='hat_sprout');
 assert.ok(item);
 await purchaseCosmetic(p,item.id,storage,now);
 await purchaseCosmetic(p,item.id,storage,now);
 let state=await storage.mutate(p,s=>s);
 assert.equal(economyBalance(state),40);
 assert.equal(state.owned.length,1);
 await assert.rejects(purchaseCosmetic(p,'hat_crown',storage,now),/Yetersiz/);
 await assert.rejects(setEquipped(p,'badge_fox','badge',storage),/Unowned/);
 state=await setEquipped(p,item.id,'hat',storage);
 assert.equal(state.equipped.hat,item.id);
 await setEquipped(p,null,'hat',storage);
 assert.equal((await storage.mutate(p,s=>s)).equipped.hat,undefined);
 assert.equal((await storage.mutate('child-y',s=>s)).entries.length,0);
 await storage.remove(p);
 assert.equal((await storage.mutate(p,s=>s)).entries.length,0);
});
test('P5 never allows local paid-coin mint or unvalidated goal claims',()=>{
 assert.throws(()=>creditPaidCoins(),/verified server receipt/);
 assert.throws(()=>claimDaily(initialEconomy('kid'),'2026-11-01','quest_3',0,now.toISOString()),/Goal/);
 assert.match(localDay(now),/^\d{4}-\d{2}-\d{2}$/);
});

test('P5 planned paid SKUs remain fully disabled and do not touch child economy',()=>{
 assert.equal(PAID_COINS_ENABLED,false);
 assert.equal(new Set(PLANNED_COIN_PACKS.map(p=>p.id)).size,PLANNED_COIN_PACKS.length);
 for(const pack of PLANNED_COIN_PACKS)assert.ok(pack.coins>0);
});

test('Avatar collection: three free starters, legacy grant, one-time atomic coin unlock',async()=>{
 const {VENTRA_AVATARS,VENTRA_STARTER_AVATARS}=await import('../../../packages/shared/src/profile.ts');
 assert.equal(VENTRA_AVATARS.length,36);
 assert.equal(VENTRA_STARTER_AVATARS.length,5);
 assert.equal(new Set(VENTRA_AVATARS.map(a=>a.id)).size,36);
 const storage=new MemoryEconomyStorage();
 const repo=new MemoryProgressRepository();
 const player=await repo.createProfile({nickname:'Ava',avatarId:'avatar_explorer'});
 await storage.mutate(player.id,s=>({...s,entries:[{id:'test-grant',kind:'daily',amount:120,at:now.toISOString()}]}));
 const first=await getAvatarShop(repo,player.id,'avatar_explorer',storage,now);
 assert.equal(first.balance,120);
 assert.ok(avatarIsOwned(first.economy,'avatar_explorer'));
 assert.equal(first.economy.avatarLegacyMigrated,true);
 const after=await purchaseAvatarWithCoins(repo,player.id,'avatar_robot','avatar_explorer',storage,now);
 assert.ok(avatarIsOwned(after,'avatar_robot'));
 assert.equal(economyBalance(after),65);
 const repeated=await purchaseAvatarWithCoins(repo,player.id,'avatar_robot','avatar_explorer',storage,now);
 assert.equal(economyBalance(repeated),65);
 assert.equal(repeated.entries.filter(e=>e.id==='avatar:avatar_robot').length,1);
 await assert.rejects(purchaseAvatarWithCoins(repo,player.id,'avatar_unicorn',
   'avatar_explorer',storage,now),/Yetersiz/);
 assert.equal(avatarIsOwned(after,'avatar_unicorn'),false);
 const old=migrateLegacyAvatar(initialEconomy('older'),'avatar_wizard');
 assert.ok(avatarIsOwned(old,'avatar_wizard'));
 assert.equal(migrateLegacyAvatar(old,'avatar_unicorn').ownedAvatars.length,1);
 assert.equal(avatarIsOwned(migrateLegacyAvatar(initialEconomy('newer'),'avatar_unicorn'),'avatar_unicorn'),false);
 assert.throws(()=>buyAvatar(initialEconomy('kid'),'fake-avatar',now.toISOString()),/Unknown/);
});

test('Story Forest levels award unique coins once across three games',async()=>{
 const {WORLD_GAMES,reconcileRewards}=await import('../src/lib/rewards/economyEngine.ts');
 const stories=WORLD_GAMES.filter(g=>g.id.startsWith('island_story_forest_'));
 assert.equal(stories.length,3);
 let state=initialEconomy('story-kid');
 const evidence=stories.flatMap(w=>Array.from({length:w.count},(_,i)=>({gameId:w.id,levelId:i+1,stars:3})));
 state=reconcileRewards(state,evidence,now.toISOString());
 assert.equal(economyBalance(state),180);
 state=reconcileRewards(state,evidence,now.toISOString());
 assert.equal(economyBalance(state),180,'Replay must not mint extra currency');
});
