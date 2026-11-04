import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIMAL_MEADOW_WORDS, findAnimal, planAnimalMission, getWeakAnimalIds, getAnimalPrompt, animalCommandFor, animalRescueCommandFor } from '../src/lib/learning/animalMissionEngine.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
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
test('All animal words have mobile native speech and browser fallback instead of silent audio null',()=>{
 const source=fs.readFileSync(new URL('../src/components/learning/activities/AnimalMeadowAdventure.tsx',import.meta.url),'utf8');
 const sound=fs.readFileSync(new URL('../src/lib/audio/SoundService.ts',import.meta.url),'utf8');
 assert.equal(ANIMAL_MEADOW_WORDS.filter(word=>word.audio===null).length,36);
 assert.match(source,/soundService\.speakEnglish\(/);
 assert.match(source,/setTextMode\(true\);setAssisted\(true\)/);
 assert.match(sound,/Capacitor\.isPluginAvailable\('TextToSpeech'\)/);
 assert.match(sound,/plugin\.speak\(/);
 assert.match(sound,/this\.speakInBrowser\(text,options,id\)/);
 for(const word of ANIMAL_MEADOW_WORDS)assert.match(word.id,/^[a-z]+$/);
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
          mission===2?'recognition':mission===3?'listening':'command',
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
test('Animal Meadow uses one accessible visual stage for every mission on every screen',()=>{
 const view=fs.readFileSync(new URL('../src/components/learning/activities/AnimalMeadowAdventure.tsx',import.meta.url),'utf8');
 const stage=fs.readFileSync(new URL('../src/components/learning/activities/MeadowPlayStage.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/activities/animal-meadow.css',import.meta.url),'utf8');
 assert.doesNotMatch(view,/ExplorerCanvas|MobileMeadowWorld|worldObjects|getHabitatObjects|rescueSelected|resolveRescueChoice|chooseHabitat/);
 assert.match(view,/MeadowPlayStage mode="discover"/);
 assert.match(view,/mode=\{stage===2\?'match':stage===3\?'listen':stage===4\?'command':'rescue'\}/);
 assert.match(view,/onSelect=\{choose\}/);
 assert.match(view,/useAutoQuestionAdvance\(/);
 assert.match(view,/setTextMode\(true\);setAssisted\(true\)/);
 assert.match(view,/kind=stage===2\?'recognition':stage===3\?'listening':'command'/);
 assert.match(view,/if\(stage===1&&activePlan&&discovered.length===activePlan.animals.length/);
 assert.match(stage,/role="group"/);
 assert.match(stage,/onSelect\?\.\(animal.id\)/);
 assert.match(stage,/aria-pressed=\{isDiscovery\?found:right\}/);
 assert.match(stage,/target.image/);
 assert.match(stage,/noAudioMode&&isListening/);
 assert.match(stage,/data-rescued=\{isRescue&&right\}/);
 assert.match(css,/assets\/word-garden\/premium-v2\/animals.webp/);
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/safe-area-inset-bottom/);
});
test('Single-choice rescue measures English command recognition, not a second habitat quiz',()=>{
 for(const level of ['Pre-A1','A1','A2']){
  const word=findAnimal('cow');
  const command=animalRescueCommandFor(word,level,4);
  assert.match(command,/cow/);
  assert.ok(!command.includes(word.habitat));
 }
 assert.equal(animalRescueCommandFor(findAnimal('cow'),'Pre-A1',1),'Help the cow!');
 assert.equal(animalRescueCommandFor(findAnimal('cow'),'A1',4),'Can you help the cow?');
 assert.equal(animalRescueCommandFor(findAnimal('cow'),'A2',6),'Please help the cow get home!');
 const prompt=getAnimalPrompt(5,findAnimal('duck'),'Pre-A1');
 assert.match(prompt.title,/Help the duck!/);
 const view=fs.readFileSync(new URL('../src/components/learning/activities/AnimalMeadowAdventure.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(view,/Şimdi doğru yuvayı seç|YUVASINI BUL|Find its home/);
 assert.match(view,/setAwaiting\(true\)/);
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
test('Visual answer IDs and pre-answer disclosure are pedagogically safe',()=>{
 const stage=fs.readFileSync(new URL('../src/components/learning/activities/MeadowPlayStage.tsx',import.meta.url),'utf8');
 assert.match(stage,/isMatch\?animal.id\+' İngilizce kelimesini seç'/);
 assert.match(stage,/showImage=!isMatch/);
 assert.match(stage,/isDiscovery&&found/);
 assert.match(stage,/right\?<span className="am-v2-animal-name/);
 assert.match(stage,/animals.map\(\(animal,i\)=>/);
 assert.match(stage,/className="am-v2-hero-sound"/);
 const plan=planAnimalMission({mission:5,history:starters,seed:123});
 assert.ok(plan.questions.every(q=>q.choices.includes(q.target)));
 assert.equal(plan.questions.length,6);
});
