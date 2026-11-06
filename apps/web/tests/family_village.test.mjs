import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VILLAGE_WORDS,VILLAGE_DISTRICTS,VILLAGE_STAGES,VILLAGE_TOTAL,VILLAGE_GAME_ID,
 eligibleVillageWords,planVillageMission,villageResumePoint,validVillageAnswers,villageMissionStars
} from '../src/lib/learning/familyVillageEngine.ts';
import {saveFamilyVillageMission,getFamilyVillageProgress} from '../src/lib/progress/familyVillageProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getLearningSnapshot,normalizeLearningEvidence} from '../src/lib/learning/adaptiveLearningEngine.ts';
import {MemoryEconomyStorage,getPassport} from '../src/lib/rewards/economyRepository.ts';
import {getDistrictObjects} from '../src/components/learning/world/worldLayout.ts';
const when='2026-11-01T12:00:00.000Z';
const sample=(id,kind,wrong=0,hint=false)=>({
 wordId:id,kind,mistakes:wrong,firstTryCorrect:wrong===0&&!hint,hintUsed:hint,timestamp:when
});
const answers=(district,stage)=> {
 const mission=planVillageMission({district,stage,gradeLevel:3,englishLevel:'A1',seed:100,history:[]});
 return (stage===1?mission.words:mission.questions.map(q=>q.target))
  .map(id=>sample(id,VILLAGE_STAGES[stage-1].kind));
};
test('G2 language-only curriculum has 60 distinct family/home/routine concepts in 4 playable neighborhoods',()=>{
 assert.equal(VILLAGE_WORDS.length,60);
 assert.equal(new Set(VILLAGE_WORDS.map(w=>w.id)).size,60);
 assert.equal(VILLAGE_DISTRICTS.length,4);assert.equal(VILLAGE_STAGES.length,5);assert.equal(VILLAGE_TOTAL,20);
 for(const district of VILLAGE_DISTRICTS){
  const words=VILLAGE_WORDS.filter(w=>w.district===district.id);
  assert.equal(words.length,15);
  assert.ok(words.every(w=>w.tr&&w.phrase&&w.command));
  assert.equal(words.filter(w=>w.tier===0).length,8);
  assert.equal(words.filter(w=>w.tier<=1).length,12);
 }
 for(const [grade,level,count] of [[1,'Pre-A1',8],[3,'A1',12],[7,'A2',15]]){
  for(const district of VILLAGE_DISTRICTS)
   assert.equal(eligibleVillageWords(district.id,grade,level).length,count);
 }
});
test('G2 missions deterministic and options are unique in the current English level',()=>{
 for(const district of VILLAGE_DISTRICTS)for(const step of VILLAGE_STAGES){
  const props={district:district.id,stage:step.stage,englishLevel:'A1',gradeLevel:3,history:[],seed:74};
  const plan=planVillageMission(props);
  assert.deepEqual(plan,planVillageMission(props));
  assert.equal(plan.words.length,8);
  assert.equal(plan.questions.length,step.stage===1?0:6);
  const allowed=new Set(eligibleVillageWords(district.id,3,'A1').map(w=>w.id));
  for(const question of plan.questions){
   assert.equal(question.options.length,3);
   assert.equal(new Set(question.options).size,3);
   assert.ok(question.options.includes(question.target));
   assert.ok(question.options.every(x=>allowed.has(x)));
   if(step.stage===3)assert.equal(question.prompt,'Listen carefully');
   if(step.stage===5)assert.ok(question.audio.startsWith('I ')||question.audio.startsWith('This ')||question.audio.startsWith('These '));
  }
 }
});
test('G2 repeated discovery reaches every word allowed by grade; wrong answers get priority',()=>{
 for(const district of VILLAGE_DISTRICTS)for(const [grade,level] of [[1,'Pre-A1'],[3,'A1'],[7,'A2']]){
  const history=[],seen=new Set();
  for(let visit=0;visit<7;visit++){
   const plan=planVillageMission({district:district.id,stage:1,gradeLevel:grade,
    englishLevel:level,history,seed:visit+90});
   for(const id of plan.words){seen.add(id);history.push(sample(id,'discovery'));}
  }
  assert.equal(seen.size,eligibleVillageWords(district.id,grade,level).length);
 }
 const history=[sample('mother','recognition',2,true)];
 const p=planVillageMission({district:'family',stage:2,gradeLevel:1,englishLevel:'Pre-A1',history,seed:8});
 assert.ok(p.words.includes('mother'));
 assert.equal(p.questions.length,4);
});
test('G2 P3 skill classification excludes discovery and hinted/muted listening from independent answers',()=>{
 const rows=[sample('mother','discovery'),sample('mother','listening',0,true),
  sample('mother','context',1,false),sample('mother','dialogue')];
 assert.equal(validVillageAnswers(rows),true);
 assert.equal(validVillageAnswers([{wordId:'alien',kind:'context',timestamp:when}]),false);
 const normal=normalizeLearningEvidence([],[],[],[],rows).filter(e=>e.domain==='family');
 assert.equal(normal.length,4);
 assert.equal(normal.filter(x=>x.independent).length,1);
 const snap=getLearningSnapshot({animalAnswers:[],animalWords:[],colorAnswers:[],colorWords:[],
  familyAnswers:rows,familyWords:['mother'],now:'2026-11-01T17:00:00.000Z'});
 assert.equal(snap.domainStats.family.discovered,1);
 assert.equal(snap.domainStats.family.practiced,1);
 assert.equal(snap.assistedAnswers,2);
});
test('G2 full path: 20 missions, 60 stars, 200 earned coins; no duplicate rewards after replay',async()=>{
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Village Child',avatarId:'avatar_explorer'});
 const other=await repo.createProfile({nickname:'Other Village Child',avatarId:'avatar_explorer'});
 await assert.rejects(saveFamilyVillageMission(repo,child.id,'rooms',1,0,16,answers('rooms',1),'blocked'),/önceki/i);
 await assert.rejects(saveFamilyVillageMission(repo,child.id,'family',2,0,16,answers('family',2),'skipped'),/Önceki/i);
 for(const district of VILLAGE_DISTRICTS)for(const stage of VILLAGE_STAGES){
  await saveFamilyVillageMission(repo,child.id,district.id,stage.stage,0,12,
   answers(district.id,stage.stage),`g2:${district.id}:${stage.stage}`);
 }
 const p=await getFamilyVillageProgress(repo,child.id);
 assert.equal(p.completedLevels,20);assert.deepEqual(p.completedByDistrict,{family:5,rooms:5,objects:5,routines:5});
 assert.equal(await repo.getTotalStars(child.id,VILLAGE_GAME_ID),60);
 assert.equal((await repo.getFamilyAnswerHistory(other.id)).length,0);
 assert.equal((await getFamilyVillageProgress(repo,other.id)).completedLevels,0);
 const store=new MemoryEconomyStorage();
 const wallet=await getPassport(repo,child.id,store,new Date('2026-11-01T12:30:00Z'));
 assert.equal(wallet.worldStats.find(w=>w.id===VILLAGE_GAME_ID).completed,20);
 assert.equal(wallet.balance,200);
 assert.ok(wallet.learned.family>0);
 await saveFamilyVillageMission(repo,child.id,'routines',5,0,10,answers('routines',5),'g2:routines:5');
 assert.equal((await getPassport(repo,child.id,store,new Date('2026-11-01T12:30:00Z'))).balance,200);
});
test('G2 resuming and map access are independent from other world completion',()=>{
 assert.deepEqual(villageResumePoint({family:0,rooms:0,objects:0,routines:0}),{district:'family',stage:1});
 assert.deepEqual(villageResumePoint({family:5,rooms:2,objects:0,routines:0}),{district:'rooms',stage:3});
 assert.deepEqual(villageResumePoint({family:5,rooms:5,objects:5,routines:4}),{district:'routines',stage:5});
 assert.equal(getDistrictObjects(false,false,false,true).find(x=>x.id==='family')?.unlocked,true);
 assert.equal(getDistrictObjects(false,false,false,true).find(x=>x.id==='food')?.unlocked,false);
 assert.equal(getDistrictObjects(true,true,true,true).find(x=>x.id==='sanctuary')?.unlocked,false);
});
test('G2 child-friendly interface includes authored house SVG, accessible voice completion, real stage unlocks',()=>{
 const scene=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageScenery.tsx',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageAdventure.tsx',import.meta.url),'utf8');
 const map=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 assert.match(scene,/scenes\/family-v3\.svg/);assert.match(scene,/scenes\/rooms-v3\.svg/);
 assert.match(scene,/scenes\/objects-v3\.svg/);assert.match(scene,/scenes\/routines-v3\.svg/);
 assert.match(ui,/soundService\.speakEnglish\(text/);
 assert.match(ui,/onEnd:.*setHeard\(true\)/);
 assert.match(ui,/if\(requireFullAudio\)setHeard\(true\)/);
 assert.match(ui,/stage===3&&!heard&&!hint/);
 assert.match(ui,/current\.words\.map/);
 assert.match(ui,/role="progressbar"/);
 assert.match(map,/onEnterFamily/);
 const theme=fs.readFileSync(new URL('../src/components/learning/world/gardenTheme.ts',import.meta.url),'utf8');
 assert.match(theme,/60 kavram/);
 assert.match(map,/onEnterFamily/);
});

test('G3 all 60 family/home/routine concepts have bundled illustrations and four distinct scene files',()=>{
 const sprite=fs.readFileSync(new URL('../public/assets/family-village/family-word-sprite-v3.svg',import.meta.url),'utf8');
 const ids=[...sprite.matchAll(/<symbol id="fv-([^"]+)" viewBox=/g)].map(x=>x[1]);
 assert.equal(ids.length,60);
 assert.equal(new Set(ids).size,60);
 assert.deepEqual(new Set(ids),new Set(VILLAGE_WORDS.map(w=>w.id.replace(/\s+/g,'-'))));
 assert.equal((sprite.match(/<\/symbol>/g)||[]).length,60);
 assert.doesNotMatch(sprite,/href=["']https?:/);
 const visuals=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageWordArt.tsx',import.meta.url),'utf8');
 assert.match(visuals,/family-word-sprite-v3\.svg#fv-/);
 assert.doesNotMatch(visuals,/fv-emoji-art|item\.icon|id==='table'/);
 const assets=['family','rooms','objects','routines'].map(id=>
  fs.readFileSync(new URL('../public/assets/family-village/scenes/'+id+'-v3.svg',import.meta.url),'utf8'));
 assert.equal(new Set(assets).size,4);
 for(const scene of assets){
  assert.match(scene,/viewBox="0 0 1280 720"/);
  assert.match(scene,/<\/svg>$/);
  assert.ok(scene.length>8500);
 }
});

test('G3 answer channels never duplicate the prompt in answer options',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageAdventure.tsx',import.meta.url),'utf8');
 const style=fs.readFileSync(new URL('../src/components/learning/activities/family-village-premium-v3.css',import.meta.url),'utf8');
 assert.match(ui,/fv3-featured/);
 assert.match(ui,/\(stage===2\|\|stage===5\)/);
 assert.match(ui,/task\.options\.map\(id=><WordChoice/);
 assert.doesNotMatch(ui,/stage===4\?current\.words:task\.options/);
 assert.match(ui,/mode=\{stage===2\?'english':stage===3\?\(district==='family'\?'translation':'icon'\):stage===4\?'icon':'phrase'\}/);
 assert.match(ui,/showRelation=w\.district==='family'/);
 assert.match(ui,/fv-choice-label/);
 assert.match(ui,/\(mode==='english'\|\|mode==='phrase'\|\|showRelation\)/);
 assert.doesNotMatch(ui,/stage===5\?villageWord\(task.target\)\.phrase:villageWord\(task.target\)\.tr/);
 assert.match(style,/safe-area-inset-bottom/);
 assert.match(style,/@media\(max-width:359px\)/);
 assert.match(style,/orientation:landscape/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.match(style,/touch-action:manipulation/);
 assert.match(style,/focus-visible/);
});
test('G3 native speech, auto-discovery and guarded answers retain save semantics',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/soundService\.hasEnglishSpeech\(\)/);
 assert.match(ui,/soundService\.cancelSpeech\(\)/);
 assert.match(ui,/ready:stage===1&&Boolean\(current\?\.words.length\)/);
 assert.match(ui,/onAdvance:\(\)=>\{void complete\(answers\);\}/);
 assert.match(ui,/onAdvance:advance/);
 assert.match(ui,/Boolean\(saveError\)/);
 assert.match(ui,/visitedRef\.current\.has\(id\)/);
 assert.match(ui,/visitedRef\.current\.add\(id\)/);
 assert.match(ui,/answerLock\.current=true/);
 assert.match(ui,/answerLock\.current=false/);
 assert.match(ui,/wrongRef\.current\.has\(id\)/);
 assert.match(ui,/wrongRef\.current\.add\(id\)/);
 assert.match(ui,/wrongIds\.includes\(id\)/);
 assert.match(ui,/if\(stage===3&&!heard&&!hint\)return/);
 assert.match(ui,/await onSave\(district,stage,mistakes/);
 assert.match(ui,/Kaydetmeyi Tekrar Dene/);
 assert.doesNotMatch(ui,/Hepsini Keşfettim/);
});
test('G3 family relatives are taught with relation labels when illustration alone is ambiguous',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/district==='family'&&<span className="fv3-featured-label"/);
 assert.match(ui,/mode==='translation'/);
 assert.match(ui,/showRelation/);
 const a=VILLAGE_WORDS.filter(w=>w.district==='family');
 assert.ok(a.some(w=>w.id==='aunt'));
 assert.ok(a.some(w=>w.id==='daughter'));
 assert.ok(a.some(w=>w.id==='cousin'));
});
test('G3 advanced negated context requires parsing, beginners remain simple',()=>{
 for(const district of ['rooms','objects']){
  const p=planVillageMission({district,stage:4,gradeLevel:7,englishLevel:'A2',history:[],seed:881});
  const contrasts=p.questions.filter(q=>q.prompt.startsWith("Don't "));
  assert.ok(contrasts.length>=2);
  for(const q of contrasts){
   assert.equal(q.audio,q.prompt);
   assert.ok(q.prompt.includes(q.target));
   assert.ok(q.options.some(id=>id!==q.target&&q.prompt.includes(id)));
  }
  const easy=planVillageMission({district,stage:4,gradeLevel:1,englishLevel:'Pre-A1',history:[],seed:881});
  assert.ok(easy.questions.every(q=>!q.prompt.startsWith("Don't ")));
 }
});
test('G3 assisted answers reduce star rating and independent replay can improve stars',async()=>{
 assert.equal(villageMissionStars(0,[sample('mother','recognition')]),3);
 assert.equal(villageMissionStars(0,[sample('mother','recognition',0,true)]),2);
 assert.equal(villageMissionStars(0,Array.from({length:3},()=>sample('mother','recognition',0,true))),1);
 assert.equal(villageMissionStars(3,[sample('mother','recognition')]),1);
 const repo=new MemoryProgressRepository();
 const p=await repo.createProfile({nickname:'Village assisted case',avatarId:'avatar_explorer'});
 await saveFamilyVillageMission(repo,p.id,'family',1,0,20,answers('family',1),'discovery-first');
 const hinted=answers('family',2);
 hinted[0]={...hinted[0],hintUsed:true,firstTryCorrect:false};
 await saveFamilyVillageMission(repo,p.id,'family',2,0,20,hinted,'hinted');
 assert.equal((await getFamilyVillageProgress(repo,p.id)).starsByLevel[2],2);
 await saveFamilyVillageMission(repo,p.id,'family',2,0,20,answers('family',2),'independent');
 assert.equal((await getFamilyVillageProgress(repo,p.id)).starsByLevel[2],3);
});
test('G3 question options use discovered vocabulary when enough words have been learned',()=>{
 const history=['mother','father','brother','sister'].map(id=>sample(id,'discovery'));
 for(const stage of [2,3,4,5]){
  const plan=planVillageMission({district:'family',stage,gradeLevel:1,englishLevel:'Pre-A1',history,seed:91});
  const allowed=new Set(history.map(x=>x.wordId));
  assert.ok(plan.questions.every(q=>allowed.has(q.target)));
  assert.ok(plan.questions.every(q=>q.options.every(x=>allowed.has(x))));
 }
});

test('G3.2 spoken discovery finishes after pronunciation and may replay sound safely',()=>{
 const code=fs.readFileSync(new URL('../src/components/learning/activities/FamilyVillageAdventure.tsx',import.meta.url),'utf8');
 assert.match(code,/onAdvance:\(\)=>\{void complete\(answers\);\},delayMs:950,speaking/);
 assert.match(code,/disabled=\{busy\}/);
 assert.doesNotMatch(code,/disabled=\{busy\|\|visited\.length===current\.words\.length\}/);
 assert.match(code,/visitedRef\.current\.has\(id\)/);
 assert.match(code,/disabled=\{busy\} onClick=\{\(\)=>\{cancelSpeech\(\);onBack\(\);\}\}/);
 assert.equal(VILLAGE_STAGES[2].title,'Dinle ve Bul');
});
