import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 THEME_DEFINITIONS,THEME_ORDER,THEME_TIERS,THEME_TOTAL,
 THEME_QUEST_GAME_ID,themeById,themeLevelId,validateThemeContent
} from '../src/lib/learning/themeQuestCatalog.ts';
import {
 planThemeLesson,themeEffectiveTier,themeGradeTaskCount,
 validateThemeDecks,isThemeAnswerCorrect,themeTaskHint
} from '../src/lib/learning/themeQuestEngine.ts';
import {recordThemeQuest,getThemeTownProgress} from '../src/lib/learning/themeQuestProgress.ts';
import {
 themeCheckpointKey,parseThemeCheckpoint,THEME_CHECKPOINT_TTL_MS
} from '../src/lib/learning/themeQuestCheckpoint.ts';
import {CURRICULUM_SURFACES,findEnglishOutcome,getEnglishCurriculumCoverage,
 validateEnglishCurriculum} from '../src/lib/learning/englishCurriculum.ts';
import {journeyGameLevelIds,JOURNEY_CHAPTERS,validateJourneyMap}
 from '../src/lib/learning/englishCourseJourney.ts';
import {ARCHIPELAGO_ISLANDS_ORDERED} from '../../../packages/shared/src/archipelago.ts';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('P3 has eight themed streets and genuinely distinct three-tier authored learning banks',()=>{
 assert.equal(THEME_TOTAL,8);
 assert.equal(THEME_DEFINITIONS.length,8);
 assert.deepEqual(THEME_ORDER,['school','body','clothes','weather','calendar','hobbies','transport','feelings']);
 assert.deepEqual(THEME_TIERS,['Pre-A1','A1','A2']);
 assert.equal(validateThemeContent().length,0,validateThemeContent().join(';'));
 assert.equal(THEME_DEFINITIONS.reduce((n,t)=>n+t.tiers.reduce((m,c)=>m+c.words.length,0),0),254);
 assert.equal(THEME_DEFINITIONS.reduce((n,t)=>n+t.tiers.reduce((m,c)=>m+c.phrases.length,0),0),120);
 for(const theme of THEME_DEFINITIONS){
  assert.equal(theme.tiers.length,3);
  assert.ok(theme.title.length>4&&theme.subtitle.length>5&&theme.icon);
  assert.ok(theme.tiers.every(x=>x.words.length>=10&&x.phrases.length>=5));
  assert.ok(theme.tiers[0].words.some(x=>!theme.tiers[2].words.some(y=>y.en===x.en)),
   'No tier difference '+theme.id);
  assert.equal(themeById(theme.id),theme);
 }
 assert.equal(themeById('calendar').tiers[0].words.filter(x=>x.clockMinutes!==undefined).length,4);
 assert.ok(themeById('calendar').tiers[1].words.filter(x=>x.clockMinutes!==undefined).length>=5);
 assert.ok(themeById('calendar').tiers[2].words.filter(x=>x.clockMinutes!==undefined).length>=5);
});

test('Lesson bank is reproducible, multi-modal, age-aware and replayable across ALL units',()=>{
 assert.deepEqual(validateThemeDecks(),[],validateThemeDecks().slice(0,5).join(';'));
 for(const theme of THEME_ORDER){
  for(const level of THEME_TIERS){
   for(const gradeLevel of [1,3,6,null]){
    const expected=themeGradeTaskCount(gradeLevel);
    assert.equal(expected,gradeLevel===1?8:gradeLevel===6?12:10);
    const decks=new Set();
    for(let replay=0;replay<12;replay++){
     const input={theme,placement:level,gradeLevel,replay};
     const deck=planThemeLesson(input);
     assert.deepEqual(deck,planThemeLesson(input));
     assert.equal(deck.tasks.length,expected);
     assert.equal(deck.tier,themeEffectiveTier(gradeLevel,level));
     assert.equal(deck.tasks[0].kind,'discover');
     assert.equal(deck.tasks[1].kind,'discover');
     assert.ok(deck.tasks.some(t=>t.kind==='picture'));
     assert.ok(deck.tasks.some(t=>t.kind==='listen'));
     assert.ok(deck.tasks.some(t=>t.kind==='phrase'));
     if(expected>=10)assert.ok(deck.tasks.some(t=>t.kind==='assemble'));
     if(theme==='calendar')assert.ok(deck.tasks.some(t=>t.kind==='clock'));
     assert.equal(new Set(deck.tasks.map(t=>t.id)).size,expected);
     for(const task of deck.tasks){
      assert.ok(task.promptTr&&task.answer);
      assert.equal(isThemeAnswerCorrect(task,task.answer),true);
      assert.equal(isThemeAnswerCorrect(task,'COMPLETELY WRONG'),false);
      assert.equal(isThemeAnswerCorrect(task,
       task.kind==='meaning'?task.answer.toLocaleUpperCase('tr-TR'):task.answer.toUpperCase()),true);
      assert.ok(themeTaskHint(task).length>10);
      if(task.kind==='discover')assert.equal(task.choices.length,0);
      else if(task.kind!=='assemble'){
       assert.ok(task.choices.length>=2,'Choice count '+task.id);
       assert.ok(task.choices.some(x=>isThemeAnswerCorrect(task,x)));
       assert.equal(new Set(task.choices.map(x=>x.toLowerCase())).size,task.choices.length);
      }
      if(task.kind==='listen')assert.ok(task.audioText&&task.audioText.length>0);
      if(task.kind==='clock')assert.ok(Number.isInteger(task.clockMinutes));
     }
     const sig=deck.tasks.map(t=>t.kind+':'+t.answer).join('|');
     assert.ok(!decks.has(sig),'early identical replay '+theme+level+gradeLevel);
     decks.add(sig);
    }
   }
  }
 }
});

test('Grade is a conservative UX/content ceiling, never a silent English placement change',()=>{
 assert.equal(themeEffectiveTier(1,'A2'),0);
 assert.equal(themeEffectiveTier(4,'A2'),1);
 assert.equal(themeEffectiveTier(6,'A2'),2);
 assert.equal(themeEffectiveTier(8,'Pre-A1'),0);
 assert.equal(themeEffectiveTier(null,'A1'),1);
 assert.equal(themeGradeTaskCount(1),8);
 assert.equal(themeGradeTaskCount(4),10);
 assert.equal(themeGradeTaskCount(7),12);
 assert.equal(themeGradeTaskCount(null),10);
 for(const level of THEME_TIERS){
  for(const grade of [1,3,6,null]){
   const ids=THEME_ORDER.map(theme=>themeLevelId(theme,level,themeEffectiveTier(grade,level)));
   assert.deepEqual(journeyGameLevelIds('garden.themes',grade,level),ids);
   assert.equal(new Set(ids).size,8);
  }
 }
 const every=new Set();
 for(const level of THEME_TIERS)for(const theme of THEME_ORDER)for(const tier of [0,1,2]){
  every.add(themeLevelId(theme,level,tier));
 }
 assert.equal(every.size,72);
 assert.throws(()=>themeLevelId('not-existing','A1',1),RangeError);
});

test('P0 topic map and P2 link to real existing Garden game, never a seventh island',()=>{
 assert.equal(CURRICULUM_SURFACES.length,15);
 assert.deepEqual(validateEnglishCurriculum(),[]);
 assert.deepEqual(validateJourneyMap(),[]);
 assert.equal(JOURNEY_CHAPTERS.length,7);
 const surface=CURRICULUM_SURFACES.find(s=>s.id==='garden.themes');
 assert.equal(surface?.islandId,'word_garden');
 assert.equal(surface?.gameId,THEME_QUEST_GAME_ID);
 assert.ok(JOURNEY_CHAPTERS.find(x=>x.id==='words').surfaces.includes('garden.themes'));
 for(const theme of THEME_ORDER)for(const level of THEME_TIERS){
  const goal=findEnglishOutcome('en.'+theme+'.'+level.toLowerCase());
  assert.equal(goal?.coverage,'authored');
  assert.deepEqual(goal.surfaceIds,['garden.themes']);
 }
 assert.equal(getEnglishCurriculumCoverage().reduce((n,x)=>n+x.authored,0),82);
 assert.equal(ARCHIPELAGO_ISLANDS_ORDERED.length,6);
 assert.equal(THEME_QUEST_GAME_ID,'island_word_garden_theme_town');
});

test('Progress is stored with original repository, profile, placement and effective tier isolated',async()=>{
 const db={};
 const sent=[];
 const repo={
  async getAllLevelProgress(gameId,profile){
   assert.equal(gameId,THEME_QUEST_GAME_ID);assert.equal(profile,'child-a');return db;
  },
  async recordGameCompleted(payload,profile){
   assert.equal(profile,'child-a');sent.push(payload);
   const prev=db[payload.levelId]??{completedCount:0,bestStars:0};
   db[payload.levelId]={completedCount:prev.completedCount+1,bestStars:Math.max(prev.bestStars,payload.starsEarned)};
   return {isDuplicate:false};
  }
 };
 const start=await getThemeTownProgress(repo,'child-a','A2',1);
 assert.equal(start.completed,0);
 assert.equal(start.tier,0);
 const deck=planThemeLesson({theme:'calendar',placement:'A2',gradeLevel:1,replay:0});
 const evidence=deck.tasks.map(task=>({taskId:task.id,kind:task.kind,
  firstTryCorrect:true,mistakes:0,hintUsed:false,speechStarted:task.kind==='listen',
  independent:task.kind!=='discover'&&task.kind!=='assemble'}));
 const saved=await recordThemeQuest({repo,profileId:'child-a',placement:'A2',
  gradeLevel:1,theme:'calendar',replay:0,sessionId:'22222222-2222-4222-8222-222222222222',
  answers:evidence,durationSeconds:43});
 assert.equal(saved.completed,1);
 assert.equal(saved.replays.calendar,1);
 assert.equal(sent[0].outcomeId,'en.calendar.a2');
 assert.equal(sent[0].levelId,themeLevelId('calendar','A2',0));
 assert.equal(sent[0].gameId,THEME_QUEST_GAME_ID);
 assert.equal((await getThemeTownProgress(repo,'child-a','Pre-A1',1)).completed,0);
 assert.equal((await getThemeTownProgress(repo,'child-a','A2',6)).completed,0);
 await assert.rejects(()=>recordThemeQuest({repo,profileId:'child-a',placement:'A2',
  gradeLevel:1,theme:'calendar',replay:0,sessionId:'22222222-2222-4222-8222-222222222222',
  answers:[],durationSeconds:43}));
});

test('Resume checkpoint has strict category-only schema, 30-day TTL and profile partition',()=>{
 assert.notEqual(themeCheckpointKey('p-a','A1',1,'school'),themeCheckpointKey('p-b','A1',1,'school'));
 assert.notEqual(themeCheckpointKey('p-a','A1',1,'school'),themeCheckpointKey('p-a','A2',1,'school'));
 assert.notEqual(themeCheckpointKey('p-a','A1',1,'school'),themeCheckpointKey('p-a','A1',0,'school'));
 const deck=planThemeLesson({theme:'school',placement:'A1',gradeLevel:3,replay:0});
 const now=Date.UTC(2026,10,17);
 const cp={version:1,theme:'school',placement:'A1',tier:deck.tier,replay:0,
  sessionId:'33333333-3333-4333-8333-333333333333',
  step:1,taskIds:deck.tasks.map(t=>t.id),answers:[{taskId:deck.tasks[0].id,
   kind:deck.tasks[0].kind,firstTryCorrect:true,mistakes:0,hintUsed:false,
   speechStarted:false,independent:false}],mistakes:0,hints:0,
  expiresAt:now+THEME_CHECKPOINT_TTL_MS};
 assert.equal(parseThemeCheckpoint(JSON.stringify(cp),'A1',deck.tier,'school',now)?.step,1);
 assert.equal(parseThemeCheckpoint(JSON.stringify(cp),'A2',deck.tier,'school',now),null);
 assert.equal(parseThemeCheckpoint(JSON.stringify(cp),'A1',deck.tier,'body',now),null);
 assert.equal(parseThemeCheckpoint(JSON.stringify(cp),'A1',deck.tier,'school',now+THEME_CHECKPOINT_TTL_MS+1),null);
 assert.equal(parseThemeCheckpoint(JSON.stringify({...cp,step:2}),'A1',deck.tier,'school',now),null);
 assert.equal(parseThemeCheckpoint(JSON.stringify({...cp,taskIds:[...cp.taskIds,'bogus']}),'A1',deck.tier,'school',now),null);
 assert.equal(parseThemeCheckpoint(JSON.stringify({...cp,answers:[{...cp.answers[0],freeText:'private'}]}),'A1',deck.tier,'school',now),null);
 const source=read('../src/lib/learning/themeQuestCheckpoint.ts');
 assert.doesNotMatch(source,/spokenResponse\s*:/);
});

test('Theme Town is actually navigable from Garden and P2, with mobile clock and accessible state',()=>{
 const modal=read('../src/components/learning/LearningPathModal.tsx');
 const garden=read('../src/components/learning/WordGardenDistrictMap.tsx');
 const ui=read('../src/components/learning/themes/ThemeTownAdventure.tsx');
 const css=read('../src/components/learning/themes/theme-town.css');
 const game=read('../src/lib/learning/englishCourseJourney.ts');
 const kids=read('../src/app/kids/page.tsx');
 assert.match(modal,/district==='themes'/);
 assert.match(modal,/garden.themes/);
 assert.match(modal,/onEnterThemes/);
 assert.match(garden,/Tema Kasabası/);
 assert.match(garden,/onEnterThemes/);
 assert.match(ui,/role="dialog"/);
 assert.match(ui,/aria-modal="true"/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/function ClockFace/);
 assert.match(ui,/aria-label="Analog saat/);
 assert.match(ui,/speechFailed/);
 assert.match(ui,/saveThemeCheckpoint/);
 assert.match(game,/themeLevelId\(theme,placement,themeEffectiveTier/);
 assert.match(kids,/onThemeProgressSaved/);
 assert.match(css,/max-width:640px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
