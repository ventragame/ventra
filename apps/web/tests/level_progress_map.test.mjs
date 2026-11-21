import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {
 buildLevelProgressMap,declaredLevelCount,levelRecordPrefix,emptyLevelProgress
} from '../src/lib/progress/levelProgressMap.ts';
import {getAlphabetProgress} from '../src/lib/learning/alphabetProgress.ts';
import {ALPHABET_GROVE_GAME_ID,alphabetLessonLevelId} from '../src/lib/learning/alphabetGroveEngine.ts';
import {getThemeTownProgress} from '../src/lib/learning/themeQuestProgress.ts';
import {THEME_QUEST_GAME_ID,THEME_ORDER,themeLevelId} from '../src/lib/learning/themeQuestCatalog.ts';
import {themeEffectiveTier} from '../src/lib/learning/themeQuestEngine.ts';

const save=(repo,profileId,gameId,levelId,stars=3,session='s')=>repo.recordGameCompleted({
 sessionId:session+':'+gameId+':'+levelId,profileId,gameId,levelId,
 outcomeId:'en.test',skillId:'en.test',success:true,starsEarned:stars,score:90,
 metrics:{durationSeconds:30,attemptsCount:9,accuracyRate:0.9,wrongAttempts:0,hintsUsed:0},
 completedAt:'2026-11-22T10:00:00.000Z'
},profileId);

test('Existing games keep exactly the zero-filled level range they always reported',()=>{
 const expected={
  island_language_academy_atlas:6,island_word_garden_numbers:15,island_word_garden_food:15,
  island_word_garden_family:20,island_word_garden_temple:25,island_sentence_square_plaza:10,
  island_speaking_harbor_dialogue:10,island_word_garden_colors:10,kesir_atolyesi:10
 };
 for(const [gameId,count] of Object.entries(expected)){
  assert.equal(declaredLevelCount(gameId),count,gameId);
  const map=buildLevelProgressMap(gameId,levelRecordPrefix('p1',gameId),[]);
  assert.deepEqual(Object.keys(map).map(Number),Array.from({length:count},(_,i)=>i+1),gameId);
  assert.deepEqual(map[1],emptyLevelProgress(gameId,1));
 }
});

test('Level map ignores other games that share a prefix, other profiles and malformed keys',()=>{
 const rec=(gameId,levelId)=>({...emptyLevelProgress(gameId,levelId),completedCount:1,bestStars:2});
 const map=buildLevelProgressMap('island_word_garden',levelRecordPrefix('p1','island_word_garden'),[
  ['p1:island_word_garden:3',rec('island_word_garden',3)],
  ['p1:island_word_garden_colors:4',rec('island_word_garden_colors',4)],
  ['p2:island_word_garden:5',rec('island_word_garden',5)],
  ['p1:island_word_garden:x',rec('island_word_garden',9)],
  ['p1:island_word_garden:0',rec('island_word_garden',0)],
  ['p1:island_word_garden:12',rec('island_word_garden',12)]
 ]);
 assert.equal(map[3].completedCount,1);
 assert.equal(map[4].completedCount,0,'colours record must not leak into the animal game');
 assert.equal(map[5].completedCount,0,'another child must not leak in');
 assert.equal(map[12].completedCount,1,'stored levels above the padding are still returned');
 assert.equal(map[0],undefined);
});

test('Alphabet Grove lessons above level 10 read back after a real save (was always zero)',async()=>{
 const repo=new MemoryProgressRepository();
 const profile=await repo.createProfile({nickname:'Deniz',avatarId:'avatar_explorer'});
 for(const placement of ['Pre-A1','A1','A2']){
  const lesson=placement==='Pre-A1'?11:3;
  await save(repo,profile.id,ALPHABET_GROVE_GAME_ID,alphabetLessonLevelId(lesson,placement),2,placement);
  const progress=await getAlphabetProgress(repo,profile.id,placement);
  assert.equal(progress.completed,1,placement+' completion is visible');
  assert.equal(progress.stars[lesson],2);
  assert.equal(progress.replays[lesson],1,placement+' replay count drives new question decks');
 }
 const rows=await repo.getAllLevelProgress(ALPHABET_GROVE_GAME_ID,profile.id);
 assert.equal(Object.keys(rows).length,36,'all 36 alphabet level slots are reported');
});

test('Theme Town progress for every placement and tier reads back after a real save',async()=>{
 const repo=new MemoryProgressRepository();
 const profile=await repo.createProfile({nickname:'Ece',avatarId:'avatar_explorer'});
 for(const [placement,grade] of [['Pre-A1',1],['A1',4],['A2',6]]){
  const tier=themeEffectiveTier(grade,placement);
  const theme=THEME_ORDER[THEME_ORDER.length-1];
  const level=themeLevelId(theme,placement,tier);
  await save(repo,profile.id,THEME_QUEST_GAME_ID,level,3,placement);
  const progress=await getThemeTownProgress(repo,profile.id,placement,grade);
  assert.equal(progress.replays[theme],1,`${placement} level ${level} is visible`);
  assert.equal(progress.stars[theme],3);
  assert.equal(progress.completed,1);
 }
 const other=await repo.createProfile({nickname:'Can',avatarId:'avatar_explorer'});
 const isolated=await getThemeTownProgress(repo,other.id,'A2',6);
 assert.equal(isolated.completed,0,'progress stays isolated per child profile');
});

test('Both repositories delegate level maps to the shared builder (no hard-coded 10-level cap)',()=>{
 const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 for(const file of ['IndexedDBProgressRepository.ts','MemoryProgressRepository.ts']){
  const code=read('../src/lib/progress/'+file);
  assert.match(code,/buildLevelProgressMap\(gameId,/);
  assert.doesNotMatch(code,/const maxLevel = /);
 }
 assert.match(read('../src/lib/progress/IndexedDBProgressRepository.ts'),/IDBKeyRange\.bound\(prefix, prefix \+ '\\uffff'\)/);
});
