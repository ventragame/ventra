import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planPlazaMission,plazaWordTiles,validatePlazaEvidence,plazaQuestionsForGrade,plazaCurriculumPool,evaluatePlazaSentence,
 SENTENCE_PLAZA_MISSIONS,SENTENCE_PLAZA_GAME_ID} from '../src/lib/learning/sentencePlazaEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getSentencePlazaProgress,saveSentencePlazaMission} from '../src/lib/progress/sentencePlazaProgress.ts';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';

const evidence=(p,assisted=false)=>p.questions.map(q=>({
 questionId:q.id,skill:q.skill,placement:p.englishLevel,mistakes:0,
 hintUsed:assisted,modelHeard:false,firstTryCorrect:!assisted,
 timestamp:'2026-11-02T17:00:00.000Z'
}));

test('Uyanan Meydan is a complete six-mission learning product, separate from four future regions',()=>{
 assert.equal(SENTENCE_PLAZA_MISSIONS.length,6);
 assert.deepEqual(SENTENCE_PLAZA_MISSIONS.map(m=>m.id),[1,2,3,4,5,6]);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.story_castle.contentPublished,true);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.story_castle.totalPublishedRequiredLevels,6);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.listening_forest.contentPublished,false);
 const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 assert.match(page,/SentencePlazaAdventure/);
 assert.match(page,/activeRegion==='story_castle'/);
 assert.match(page,/plazaProgress\?\.completedLevels/);
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/FUTURE=\['Büyülü Yapı Atölyesi'/);
 assert.match(ui,/🔒/);
 assert.match(ui,/saveSentencePlazaMission/);
 assert.match(ui,/Gör → Dinle → Kur → Canlandır/);
 assert.match(ui,/aria-live="polite"/);
 assert.doesNotMatch(ui,/Sonraki Soru →/);
});
test('Grade size and English grammar are independently controlled at every level',()=>{
 assert.equal(plazaQuestionsForGrade(1),3);
 assert.equal(plazaQuestionsForGrade(3),4);
 assert.equal(plazaQuestionsForGrade(7),5);
 for(const grade of [1,2,3,4,5,6,7,8,null]){
  for(const level of ['Pre-A1','A1','A2']){
   for(let mission=1;mission<=6;mission++){
    const plan=planPlazaMission({mission,grade,englishLevel:level,seed:326});
    assert.equal(plan.questions.length,plazaQuestionsForGrade(grade));
    assert.equal(new Set(plan.questions.map(x=>x.sentence)).size,plan.questions.length,
      'Never repeat identical language challenge in one mission');
    for(const q of plan.questions){
     assert.equal(q.englishLevel,level);
     assert.ok(q.tokens.length>=3);
     assert.match(q.sentence,/[.?]$/);
     assert.ok(q.cue.length>=12);
     assert.ok(q.explanation.length>=12);
     assert.ok(q.vocabulary.length>=1);
     assert.equal(q.tokens.join(' '),q.sentence.replace(/[.,!?]/g,''));
    }
   }
  }
 }
 const younger=planPlazaMission({mission:4,grade:1,englishLevel:'Pre-A1',seed:44});
 const older=planPlazaMission({mission:4,grade:8,englishLevel:'Pre-A1',seed:44});
 assert.equal(younger.questions.length,3);
 assert.equal(older.questions.length,5);
 assert.ok(older.questions.every(q=>q.englishLevel==='Pre-A1'),'Grade cannot silently force A2');
});
test('A2 sentences contain contextual clauses while beginners get short scaffolded sentences',()=>{
 const a2=planPlazaMission({mission:4,grade:7,englishLevel:'A2',seed:11});
 const pre=planPlazaMission({mission:4,grade:7,englishLevel:'Pre-A1',seed:11});
 assert.ok(a2.questions.some(q=>q.kind==='reason'));
 assert.ok(a2.questions.some(q=>q.kind==='question'));
 assert.ok(pre.questions.every(q=>q.sentence.includes('can')));
 const place=planPlazaMission({mission:3,grade:4,englishLevel:'A1',seed:7});
 assert.ok(place.questions.every(q=>q.scene.place&&q.sentence.includes(q.scene.place)));
 const festival=planPlazaMission({mission:6,grade:4,englishLevel:'A2',seed:7});
 assert.ok(festival.questions.every(q=>q.sentence.includes(q.scene.color)));
});
test('Visible tiles reconstruct grammatical English including duplicated function words',()=>{
 for(let m=1;m<=6;m++)for(const level of ['Pre-A1','A1','A2']){
  const plan=planPlazaMission({mission:m,grade:7,englishLevel:level,seed:23});
  for(const q of plan.questions){
   const tiles=plazaWordTiles(q,53);
   assert.equal(new Set(tiles.map(x=>x.id)).size,tiles.length);
   assert.equal(tiles.filter(x=>x.target).length,q.tokens.length);
   assert.deepEqual(tiles,plazaWordTiles(q,53));
   assert.deepEqual(tiles.filter(x=>x.target).map(x=>x.word).sort(),[...q.tokens].sort());
   assert.ok(!tiles.every((v,i)=>v.id===`word-${i}`));
  }
 }
});
test('Stored English evidence distinguishes assistance, errors and independent construction',()=>{
 const p=planPlazaMission({mission:1,grade:1,englishLevel:'Pre-A1',seed:11});
 assert.ok(validatePlazaEvidence(evidence(p),p));
 assert.ok(validatePlazaEvidence(evidence(p,true),p));
 assert.equal(validatePlazaEvidence(evidence(p).slice(1),p),false);
 assert.equal(validatePlazaEvidence(evidence(p).map(row=>({...row,firstTryCorrect:false})),p),false);
 assert.equal(validatePlazaEvidence(evidence(p).map((row,i)=>i===0?{...row,questionId:'wrong'}:row),p),false);
});
test('Real profile progress persists, isolates siblings, blocks skipping and de-duplicates replay stars',async()=>{
 const repo=new MemoryProgressRepository();
 const one=await repo.createProfile({nickname:'One',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 const two=await repo.createProfile({nickname:'Two',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 let p=planPlazaMission({mission:2,grade:3,englishLevel:'A1',seed:12});
 const save=(profileId,mission,plan,answers,sessionId)=>saveSentencePlazaMission({
  repo,profileId,mission,plan,answers,sessionId,durationSeconds:49
 });
 await assert.rejects(save(one.id,2,p,evidence(p),'skip-sentence'));
 p=planPlazaMission({mission:1,grade:3,englishLevel:'A1',seed:12});
 const first=await save(one.id,1,p,evidence(p),'first-sentence');
 assert.equal(first.completedLevels,1);
 assert.equal(first.starsByLevel[1],3);
 assert.equal((await getSentencePlazaProgress(repo,two.id)).completedLevels,0);
 const duplicate=await save(one.id,1,p,evidence(p),'first-sentence');
 assert.equal(duplicate.completedLevels,1);
 assert.equal(await repo.getTotalStars(one.id,SENTENCE_PLAZA_GAME_ID),3);
 const assisted=await save(one.id,1,p,evidence(p,true),'replay-assisted');
 assert.equal(assisted.starsByLevel[1],3,'Assisted replay cannot inflate stars');
 const history=await repo.getSentenceAnswerHistory(one.id);
 assert.equal(history.length,p.questions.length*2,'duplicate session excluded');
 assert.ok(history.some(x=>x.hintUsed));
 const next=planPlazaMission({mission:2,grade:3,englishLevel:'A1',seed:22,history});
 const after=await save(one.id,2,next,evidence(next),'second-sentence');
 assert.equal(after.completedLevels,2);
 assert.equal((await getSentencePlazaProgress(repo,two.id)).completedLevels,0);
});
test('Designed production scene is animated, original, accessible, supports muted/reduced motion',()=>{
 const visual=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaScene.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/sentence/sentence-plaza.css',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 assert.match(visual,/<svg viewBox="0 0 900 478"/);
 assert.match(visual,/sp-actor-/);
 assert.match(visual,/awaken&&effect/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:610px\)/);
 assert.match(ui,/setHintUsed\(true\)/);
 assert.match(ui,/setModelHeard\(true\)/);
 assert.match(ui,/soundService.speakEnglish\(task.sentence/);
});

test('CM1 v2: six missions cover genuine different sentence types rather than synonyms of a single pattern',()=>{
 const kinds=new Set(),modes=new Set();
 for(const level of ['Pre-A1','A1','A2'])for(let mission=1;mission<=6;mission++){
  const pool=plazaCurriculumPool(mission,level);
  assert.ok(pool.length>=15,'Every level+mission has 15+ authentic sentence challenges');
  assert.equal(new Set(pool.map(q=>q.id)).size,pool.length);
  assert.equal(new Set(pool.map(q=>q.sentence)).size,pool.length);
  for(const q of pool){
   kinds.add(q.kind);modes.add(q.mode);
   assert.equal(q.englishLevel,level);
   assert.match(q.id,/^plaza:v2:/);
   assert.ok(q.tokens.length>=3);
   assert.match(q.sentence,/[.?]$/);
   if(q.mode==='scene'){
    assert.ok(q.sceneChoices.some(c=>c.id===q.correctSceneChoice),
      'Every scene-choice must actually have a correct answer');
    assert.equal(new Set(q.sceneChoices.map(c=>c.id)).size,q.sceneChoices.length);
   }
   if(q.mode==='repair'){
    const words=q.brokenSentence.replace(/[.,!?]/g,'').split(' ');
    assert.equal(words.length,q.tokens.length);
    assert.equal(words.filter((w,i)=>w!==q.tokens[i]).length,1,
      'Repair task must contain exactly one wrong token');
   }
   if(q.scene.count===2)assert.match(q.sentence,/There are two/);
   if(q.scene.action==='remove')assert.match(q.sentence,/not want/);
  }
  for(let seed=1;seed<=5;seed++){
   const deck=planPlazaMission({mission,grade:8,englishLevel:level,seed});
   assert.equal(deck.questions.length,5);
   assert.ok(new Set(deck.questions.map(q=>q.sentence)).size===5);
  }
 }
 assert.deepEqual([...modes].sort(),['construct','repair','scene']);
 for(const kind of ['statement','question','negative','instruction','reason','contrast','preference','request'])
  assert.ok(kinds.has(kind),'Missing communicative function '+kind);
});
test('Grade AND English placement independently constrain cognitive and linguistic difficulty',()=>{
 for(const grade of [1,2,3,4,5,6,7,8,null])
  for(const level of ['Pre-A1','A1','A2'])
   for(let mission=1;mission<=6;mission++){
    const deck=planPlazaMission({mission,grade,englishLevel:level,seed:9123});
    assert.equal(deck.questions.length,plazaQuestionsForGrade(grade));
    assert.ok(deck.questions.every(q=>q.englishLevel===level));
    if(grade!==null&&grade<=2)assert.ok(deck.questions.every(q=>q.tokens.length<=10),
      'Young children must not receive cognitively oversized English sentences');
    if(grade!==null&&grade>=3&&grade<=4)assert.ok(deck.questions.every(q=>q.tokens.length<=13));
   }
 const earlyAdvanced=planPlazaMission({mission:6,grade:1,englishLevel:'A2',seed:7});
 const oldBeginner=planPlazaMission({mission:6,grade:8,englishLevel:'Pre-A1',seed:7});
 assert.equal(earlyAdvanced.questions.length,3);
 assert.equal(oldBeginner.questions.length,5);
 assert.ok(oldBeginner.questions.every(q=>!q.sentence.includes('because')));
});
test('Commit-to-answer is grammatical and does not reveal the correct word after each tap',()=>{
 for(let mission=1;mission<=6;mission++){
  const plan=planPlazaMission({mission,grade:8,englishLevel:'A2',seed:55});
  for(const q of plan.questions){
   assert.equal(evaluatePlazaSentence(q,q.tokens).correct,true);
   assert.equal(evaluatePlazaSentence(q,q.tokens.slice(0,-1)).correct,false);
   const bad=[...q.tokens];bad[1]='wrong';
   const check=evaluatePlazaSentence(q,bad);
   assert.equal(check.correct,false);assert.equal(check.incorrectIndex,1);
  }
 }
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/onClick=\{submitSentence\}/);
 assert.match(ui,/setPicked\(old=>\[\.\.\.old,id\]\)/);
 assert.match(ui,/selectRepair\(i\)/);
 assert.match(ui,/selectScene\(choice\.id\)/);
 assert.match(ui,/task\.explanation/);
 assert.doesNotMatch(ui,/if\(tile\.word!==task\.tokens\[chosenCount\]\)/);
});

test('Cümle Meydanı V2 visual-first scene, 6 genuine WebP covers and compact task flow',()=>{
 const root=new URL('../public/assets/sentence-plaza/v2/',import.meta.url);
 for(const file of ['plaza-world.webp',...Array.from({length:6},(_,i)=>'mission-'+(i+1)+'.webp')]){
  const bytes=fs.readFileSync(new URL(file,root));
  assert.equal(bytes.toString('ascii',0,4),'RIFF',file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',file);
  assert.ok(bytes.length>12000&&bytes.length<500000,file);
 }
 const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
 const ui=read('../src/components/learning/sentence/SentencePlazaAdventure.tsx');
 const scene=read('../src/components/learning/sentence/SentencePlazaScene.tsx');
 const css=read('../src/components/learning/sentence/sentence-plaza-v2.css');
 assert.match(ui,/sentence-plaza-v2\.css/);
 assert.match(ui,/className="sp-overlay sp-v2"/);
 assert.match(ui,/sp-v2-card-art/);
 assert.match(ui,/Gör → Dinle → Kur → Canlandır/);
 assert.match(ui,/sp-v2-vocab/);
 assert.match(ui,/sp-v2-steps/);
 assert.match(ui,/sp-v2-scene-help/);
 assert.match(ui,/onClick=\{submitSentence\}>✨ Canlandır/);
 assert.match(ui,/onClick=\{listenTask\}>🔊 Dinle/);
 assert.match(ui,/nextTimer\.current=setTimeout/);
 assert.match(ui,/saveSentencePlazaMission/);
 assert.match(scene,/plaza-world\.webp/);
 assert.match(scene,/sp-static-scenery/);
 assert.match(scene,/showAnimal&&/);
 assert.match(scene,/awaken&&effect\?\.actor==='balloon'/);
 assert.match(css,/sp-static-scenery\{display:none\}/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});
