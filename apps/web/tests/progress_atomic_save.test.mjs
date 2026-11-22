import test from 'node:test';
import assert from 'node:assert/strict';
import {IndexedDBProgressRepository} from '../src/lib/progress/IndexedDBProgressRepository.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {planGameCompletion} from '../src/lib/progress/gameCompletionPlan.ts';

/**
 * Minimal IndexedDB stand-in with the one property that matters here:
 * transactions run one after another (as readwrite transactions on overlapping
 * stores do in browsers, also across tabs) and each transaction's requests are
 * answered in order, asynchronously. Abort rolls back the transaction's writes.
 */
class FakeDB{
 constructor(){
  this.stores={sessions:new Map(),levels:new Map(),activities:new Map(),profiles:new Map(),meta:new Map(),game_attempts:new Map(),learning_attempts:new Map()};
  this.keyPaths={sessions:'sessionId',levels:'id',activities:'id',profiles:'id',meta:'key'};
  this.queue=[];this.running=false;this.auto=0;
 }
 transaction(names,mode='readonly'){const tx=new FakeTx(this,[].concat(names),mode);this.queue.push(tx);this.pump();return tx;}
 pump(){if(this.running||!this.queue.length)return;this.running=true;const tx=this.queue.shift();setImmediate(()=>tx.run());}
 done(){this.running=false;this.pump();}
}
class FakeTx{
 constructor(db,names,mode){Object.assign(this,{db,names,mode,pending:[],aborted:false,error:null,oncomplete:null,onerror:null,onabort:null});}
 objectStore(name){
  assert.ok(this.names.includes(name),`store "${name}" must be in the transaction scope`);
  const tx=this,db=this.db;
  const request=fn=>{const r={result:undefined,error:null,onsuccess:null,onerror:null};tx.pending.push(()=>{r.result=fn();r.onsuccess?.({target:r});});return r;};
  const write=fn=>{assert.equal(tx.mode,'readwrite','writes need a readwrite transaction');return request(fn);};
  return{
   get:key=>request(()=>db.stores[name].get(key)),
   put:value=>write(()=>{db.stores[name].set(value[db.keyPaths[name]],structuredClone(value));}),
   add:value=>write(()=>{db.stores[name].set(++db.auto,structuredClone(value));})
  };
 }
 abort(){this.aborted=true;this.pending=[];}
 run(){this.snapshot=Object.fromEntries(Object.entries(this.db.stores).map(([k,v])=>[k,new Map(v)]));this.step();}
 step(){
  if(this.aborted){this.db.stores=this.snapshot;this.onabort?.();this.db.done();return;}
  const next=this.pending.shift();
  if(!next){this.oncomplete?.();this.db.done();return;}
  next();setImmediate(()=>this.step());
 }
}

function repoWith(db){
 const repo=new IndexedDBProgressRepository();
 repo.getDB=async()=>db;
 repo.getTotalStars=async()=>[...db.stores.levels.values()].reduce((sum,level)=>sum+level.bestStars,0);
 return repo;
}
const completion=(sessionId,stars=3,extra={})=>({
 sessionId,profileId:'child-a',gameId:'island_word_garden_colors',levelId:2,outcomeId:'en.colors',skillId:'en.colors',
 success:stars>0,starsEarned:stars,score:stars*30,completedAt:'2026-11-22T10:00:00.000Z',
 metrics:{durationSeconds:40,attemptsCount:1,accuracyRate:stars/3,wrongAttempts:0,hintsUsed:0},...extra
});
const seed=db=>db.stores.profiles.set('child-a',{id:'child-a',nickname:'Ada',avatarId:'avatar_explorer',createdAt:'2026-11-01T00:00:00.000Z',updatedAt:'2026-11-01T00:00:00.000Z'});

test('A double tap (or two tabs) saving the same checkpoint is written exactly once',async()=>{
 const db=new FakeDB();seed(db);
 const repo=repoWith(db);
 const results=await Promise.all([repo.recordGameCompleted(completion('same-run'),'child-a'),repo.recordGameCompleted(completion('same-run'),'child-a')]);
 assert.deepEqual(results.map(r=>r.isDuplicate).sort(),[false,true]);
 assert.equal(db.stores.activities.size,1,'one activity row');
 assert.equal(db.stores.game_attempts.size,1,'one skill attempt');
 assert.equal(db.stores.sessions.size,1,'one sync event');
 const level=db.stores.levels.get('child-a:island_word_garden_colors:2');
 assert.equal(level.attemptsCount,1);
 assert.equal(results.reduce((sum,r)=>sum+r.starsAddedToBalance,0),3,'stars/coins are granted once');
});

test('Two different sessions on the same level never lose an attempt or a best score',async()=>{
 const db=new FakeDB();seed(db);
 const repo=repoWith(db);
 await Promise.all([repo.recordGameCompleted(completion('run-1',1),'child-a'),repo.recordGameCompleted(completion('run-2',3),'child-a')]);
 const level=db.stores.levels.get('child-a:island_word_garden_colors:2');
 assert.equal(level.attemptsCount,2);
 assert.equal(level.completedCount,2);
 assert.equal(level.bestStars,3);
 assert.equal(db.stores.activities.size,2);
 assert.equal(db.stores.profiles.get('child-a').lastPlayedAt,'2026-11-22T10:00:00.000Z');
});

test('A deleted profile is refused inside the same transaction and nothing is written',async()=>{
 const db=new FakeDB();seed(db);
 db.stores.meta.set('tombstone:child-a',{key:'tombstone:child-a',value:true});
 const repo=repoWith(db);
 await assert.rejects(repo.recordGameCompleted(completion('late-save'),'child-a'),/Deleted player profile/);
 await assert.rejects(repo.recordLearningSession({sessionId:'late-learning',profileId:'child-a',topicTitle:'x',accuracyRate:1,correctCount:1,totalQuestions:1,score:1,attempts:[]},'child-a'),/Deleted player profile/);
 assert.equal(db.stores.sessions.size,0);
 assert.equal(db.stores.activities.size,0);
 assert.equal(db.stores.levels.size,0);
});

test('Learning sessions share the atomic duplicate check',async()=>{
 const db=new FakeDB();seed(db);
 const repo=repoWith(db);
 const session={sessionId:'learn-1',profileId:'child-a',topicTitle:'Konu',accuracyRate:1,correctCount:2,totalQuestions:2,score:20,
  attempts:[{questionId:'q1',skillId:'s',isCorrect:true},{questionId:'q2',skillId:'s',isCorrect:true}]};
 const results=await Promise.all([repo.recordLearningSession(session,'child-a'),repo.recordLearningSession(session,'child-a')]);
 assert.deepEqual(results.map(r=>r.isDuplicate).sort(),[false,true]);
 assert.equal(db.stores.learning_attempts.size,2,'attempts of one session only');
 assert.equal(db.stores.activities.size,1);
});

test('Browser and memory stores apply the same completion rules',async()=>{
 const memory=new MemoryProgressRepository();
 const child=await memory.createProfile({nickname:'Ada',avatarId:'avatar_explorer'});
 const db=new FakeDB();db.stores.profiles.set(child.id,{...child});
 const browser=repoWith(db);
 for(const [id,stars] of [['a',2],['b',1],['c',3],['c',3]]){
  const run={...completion(id,stars),profileId:child.id};
  const m=await memory.recordGameCompleted(run,child.id),b=await browser.recordGameCompleted(run,child.id);
  assert.deepEqual([b.isDuplicate,b.previousBestStars,b.newBestStars,b.starsAddedToBalance],[m.isDuplicate,m.previousBestStars,m.newBestStars,m.starsAddedToBalance],'run '+id);
 }
 const stored=db.stores.levels.get(`${child.id}:island_word_garden_colors:2`);
 const levels=await memory.getAllLevelProgress('island_word_garden_colors',child.id);
 const fromMemory=levels[2];
 for(const key of ['bestStars','bestScore','attemptsCount','completedCount'])assert.equal(stored[key],fromMemory[key],key);
});

test('The completion plan keeps the best result and clamps impossible star counts',()=>{
 const base={profileId:'p',sessionId:'s',completedAt:'2026-11-22T10:00:00.000Z',profile:null,activityId:'act'};
 const first=planGameCompletion({...base,payload:completion('s',7),previous:null});
 assert.equal(first.newBestStars,3);
 assert.equal(first.starsAdded,3);
 const worse=planGameCompletion({...base,payload:completion('s2',1),previous:first.level});
 assert.equal(worse.newBestStars,3,'a weaker replay never lowers the best');
 assert.equal(worse.starsAdded,0);
 assert.equal(worse.level.firstCompletedAt,first.level.firstCompletedAt);
 assert.equal(planGameCompletion({...base,payload:completion('s3',Number.NaN),previous:null}).newBestStars,0);
});
