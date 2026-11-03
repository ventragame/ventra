import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIMAL_MEADOW_WORDS, findAnimal, planAnimalMission, getWeakAnimalIds, getAnimalPrompt, animalCommandFor } from '../src/lib/learning/animalMissionEngine.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { resolveRescueChoice } from '../src/lib/learning/animalRescueEngine.ts';
import fs from 'node:fs';
import path from 'node:path';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';

function evidence(wordId,kind='discovery',mistakes=0,time='2026-11-01T09:00:00.000Z') {
  return {wordId,kind,mistakes,firstTryCorrect:kind==='discovery'?false:mistakes===0,timestamp:time};
}
const starters=ANIMAL_MEADOW_WORDS.slice(0,8).map(word=>evidence(word.id));
test('Animal Meadow catalog contains forty unique animals and preserves existing audio/image references',()=>{
  assert.equal(ANIMAL_MEADOW_WORDS.length,40);
  assert.equal(new Set(ANIMAL_MEADOW_WORDS.map(w=>w.id)).size,40);
  for(const animal of ANIMAL_MEADOW_WORDS) {
    assert.ok(animal.emoji && animal.tr && animal.habitat && animal.place);
    assert.equal(findAnimal(animal.id),animal);
  }
  for(const id of ['cat','dog','bird','rabbit']){
    const animal=findAnimal(id);
    assert.ok(animal.audio?.endsWith('.wav'));
    assert.ok(animal.image?.endsWith('.svg'));
  }
});
test('New learner discovers eight; replay eventually introduces fresh additional animals',()=>{
  const intro=planAnimalMission({mission:1,history:[],seed:1});
  assert.equal(intro.animals.length,8);
  assert.equal(intro.questions.length,0);
  assert.deepEqual(new Set(intro.animals),new Set(starters.map(x=>x.wordId)));
  const replay=planAnimalMission({mission:1,history:intro.animals.map(id=>evidence(id)),seed:8});
  assert.equal(replay.animals.length,8);
  assert.ok(replay.animals.filter(id=>!intro.animals.includes(id)).length>=6, 'replay must introduce at least six unseen animals');
});
test('Quiz missions select only encountered animals, ensure valid three-choice prompts',()=>{
  for(let mission=2;mission<=5;mission++){
    for(let seed=1;seed<=80;seed++){
      const a=planAnimalMission({mission,history:starters,seed});
      const b=planAnimalMission({mission,history:starters,seed});
      assert.deepEqual(a,b);
      assert.equal(a.questions.length,6);
      for(const q of a.questions){
        assert.equal(q.choices.length,3);
        assert.ok(q.choices.includes(q.target));
        assert.equal(new Set(q.choices).size,3);
        assert.ok(q.choices.every(id=>starters.some(x=>x.wordId===id)));
        const prompt=getAnimalPrompt(mission,findAnimal(q.target),'Pre-A1');
        assert.ok(prompt.title && prompt.guide);
      }
    }
  }
});
test('Weak animal is guaranteed spaced practice and recovers after two independent recalls',()=>{
  const wrong=evidence('bird','recognition',2,'2026-11-01T10:00:00.000Z');
  const clean1=evidence('bird','listening',0,'2026-11-01T11:00:00.000Z');
  const clean2=evidence('bird','command',0,'2026-11-01T12:00:00.000Z');
  assert.deepEqual(getWeakAnimalIds([wrong]),['bird']);
  assert.deepEqual(getWeakAnimalIds([clean1,wrong]),['bird']);
  assert.deepEqual(getWeakAnimalIds([clean2,wrong,clean1]),[]);
  for(let seed=1;seed<=150;seed++){
    const plan=planAnimalMission({mission:5,history:[...starters,wrong],seed});
    const occurrences=plan.questions.flatMap((q,i)=>q.target==='bird'?[i]:[]);
    assert.equal(plan.questions.length,7);
    assert.equal(occurrences.length,2);
    assert.ok(occurrences[1]-occurrences[0]>=2);
    assert.ok(plan.questions.every(q=>new Set(q.choices).size===3));
  }
});
test('Animal Meadow full five-stage save, profile isolation, accurate stars and replay idempotency',async()=>{
  const repo=new MemoryProgressRepository();
  const first=await repo.createProfile({nickname:'Mina',avatarId:'avatar_explorer'});
  const second=await repo.createProfile({nickname:'Asya',avatarId:'avatar_owl'});
  let history=[];
  for(let mission=1;mission<=5;mission++){
    const plan=planAnimalMission({mission,history,seed:mission*31});
    const answers=mission===1
      ? plan.animals.map(id=>evidence(id))
      : plan.questions.map((q,i)=>evidence(q.target,
          mission===2?'recognition':mission===3?'listening':mission===4?'command':'habitat',
          mission===2&&i===0?2:0,new Date(Date.parse('2026-11-01T10:00:00Z')+mission*100000+i*1000).toISOString()));
    const wrong=mission===2?2:0;
    const stars=wrong?2:3;
    const sessionId='am-test-stage-'+mission;
    const after=await saveWordGardenLevelCompletion(repo,first.id,mission,stars,{
      sessionId,wrongAttempts:wrong,correctAnswers:answers.length,
      durationSeconds:44,animalAnswers:answers
    });
    assert.equal(after.completedLevels,mission);
    assert.equal(after.totalStars,mission*3-(mission>=2?1:0));
    assert.equal((await repo.getAnimalAnswerHistory(first.id)).length,history.length+answers.length);
    history=[...history,...answers];
    const duplicate=await saveWordGardenLevelCompletion(repo,first.id,mission,stars,{
      sessionId,wrongAttempts:wrong,correctAnswers:answers.length,durationSeconds:44,animalAnswers:answers
    });
    assert.equal(duplicate.totalStars,after.totalStars);
  }
  assert.equal((await getWordGardenProgress(repo,second.id)).completedLevels,0);
  assert.equal((await repo.getAnimalAnswerHistory(second.id)).length,0);
  assert.equal(await repo.getTotalStars(first.id),14);
  await saveWordGardenLevelCompletion(repo,first.id,2,3,{
    sessionId:'am-test-replay-2',wrongAttempts:0,correctAnswers:6,
    durationSeconds:30,animalAnswers:[evidence('bird','recognition')]
  });
  assert.equal(await repo.getTotalStars(first.id),15,'replay upgrades best stars, never double counts');
  assert.equal((await getWordGardenProgress(repo,first.id)).completedLevels,5);
  await assert.rejects(saveWordGardenLevelCompletion(repo,second.id,3,3),/Önceki görev/);
});

test('Muted listening fallback and optional hints are neutral, not permanent weakness', () => {
  const assisted={wordId:'cow',kind:'listening',mistakes:0,firstTryCorrect:false,hintUsed:true,timestamp:'2026-11-01T10:00:00.000Z'};
  assert.deepEqual(getWeakAnimalIds([assisted]),[]);
  const missed={...assisted,kind:'recognition',mistakes:2,timestamp:'2026-11-01T11:00:00.000Z'};
  assert.deepEqual(getWeakAnimalIds([assisted,missed]),['cow']);
});

test('All forty illustrated characters exist and are self-contained safe SVGs',()=>{
  for(const word of ANIMAL_MEADOW_WORDS){
    assert.equal(typeof word.image,'string');
    const file=path.join(process.cwd(),'public',word.image.replace(/^\//,''));
    assert.ok(fs.existsSync(file),'missing art for '+word.id);
    const svg=fs.readFileSync(file,'utf8');
    assert.match(svg,/<svg[^>]+viewBox="0 0 320 320"/);
    assert.match(svg,/<\/svg>\s*$/);
    assert.doesNotMatch(svg,/<script\b|<foreignObject\b|<image\b|(?:href|xlink:href)=["']https?:\/\//i,'no external scripts or image links');
    assert.ok(svg.length>900,'nonempty offline asset; byte count is not a visual-quality score');
    assert.match(svg, /aria-label="[a-z]+"/, 'accessible asset label');
  }
});
test('Two-step animal rescue cannot award a star after only identifying the animal',()=>{
  for(const target of ANIMAL_MEADOW_WORDS.map(x=>x.id)){
    const wrong=ANIMAL_MEADOW_WORDS.find(x=>x.id!==target).id;
    assert.deepEqual(resolveRescueChoice({phase:'find',selected:wrong,target}),
      {phase:'find',outcome:'wrong',complete:false});
    assert.deepEqual(resolveRescueChoice({phase:'find',selected:target,target}),
      {phase:'home',outcome:'found',complete:false});
    assert.deepEqual(resolveRescueChoice({phase:'home',selected:wrong,target}),
      {phase:'home',outcome:'wrong',complete:false});
    assert.deepEqual(resolveRescueChoice({phase:'home',selected:target,target}),
      {phase:'done',outcome:'rescued',complete:true});
    assert.deepEqual(resolveRescueChoice({phase:'done',selected:target,target}),
      {phase:'done',outcome:'ignore',complete:true});
  }
});

test('Mobile-first Meadow has separate real touch scene and retains desktop Phaser instead of web-panel duplication',()=>{
 const view=fs.readFileSync(new URL('../src/components/learning/activities/AnimalMeadowAdventure.tsx',import.meta.url),'utf8');
 const mobile=fs.readFileSync(new URL('../src/components/learning/activities/MobileMeadowWorld.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/activities/animal-meadow.css',import.meta.url),'utf8');
 assert.match(view,/window\.matchMedia\('\(max-width:767px\)'\)/);
 assert.match(view,/<MobileMeadowWorld objects=\{worldObjects\} discovery/);
 assert.match(view,/mobile\?<MobileMeadowWorld objects=\{worldObjects\}/);
 assert.match(view,/<ExplorerCanvas/);
 assert.match(view,/onInteract=\{onWorldInteract\}/);
 assert.match(view,/am-story-guide/);
 assert.match(view,/am-missions/);
 assert.match(view,/am-task-title/);
 assert.match(view,/am-compact-details/);
 assert.match(view,/awaiting\&\&target\.id===id/);
 assert.match(mobile,/word\.image/);
 assert.match(mobile,/onInteract\(object\)/);
 assert.match(mobile,/aria-pressed=\{done\|\|correct\}/);
 assert.match(mobile,/HOME_ICONS\[word\.place\]/);
 assert.match(mobile,/aria-label=\{habitatMode\?/);
 assert.match(css,/word_garden_mobile\.webp/);
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/focus-visible/);
});
test('Animal spoken commands honor actual English placement and use short child-appropriate language',()=>{
 const word=findAnimal('elephant');
 assert.equal(animalCommandFor(word,'Pre-A1',1),'Find the elephant!');
 assert.equal(animalCommandFor(word,'Pre-A1',8),'Find the elephant!');
 assert.equal(animalCommandFor(word,'A1',1),'Can you find the elephant?');
 assert.equal(animalCommandFor(word,'A1',8),'Can you find the elephant?');
 assert.equal(animalCommandFor(word,'A2',1),'Find the elephant, please.');
 assert.equal(animalCommandFor(word,'A2',7),'Please find the elephant in the meadow.');
});
test('Mobile scene objects preserve answer IDs, including the distinct two-phase habitat rescue',async()=>{
 const {getAnimalObjects,getHabitatObjects}=await import('../src/components/learning/world/worldLayout.ts');
 const ids=['rabbit','cow','fish'];
 const objects=getAnimalObjects(ids,id=>findAnimal(id).image);
 assert.deepEqual(objects.map(o=>o.id),ids);
 assert.ok(objects.every(o=>o.kind==='animal'&&o.image?.endsWith('.svg')));
 const homes=getHabitatObjects(ids,id=>findAnimal(id).habitat);
 assert.deepEqual(homes.map(o=>o.id),ids);
 assert.ok(homes.every(o=>o.kind==='habitat'&&o.label));
 assert.equal(resolveRescueChoice({phase:'find',selected:'rabbit',target:'rabbit'}).phase,'home');
 assert.equal(resolveRescueChoice({phase:'home',selected:'rabbit',target:'rabbit'}).complete,true);
});
