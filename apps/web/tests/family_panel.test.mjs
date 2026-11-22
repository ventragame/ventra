import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFamilyReport,describeWord,isEnglishActivity,loadFamilyReport} from '../src/lib/family/familyReport.ts';
import {getLearningSnapshot} from '../src/lib/learning/adaptiveLearningEngine.ts';
import {planMarketMission,MARKET_STAGES} from '../src/lib/learning/foodMarketEngine.ts';
import {saveFoodMarketMission} from '../src/lib/progress/foodMarketProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {WORLD_GAMES} from '../src/lib/rewards/economyEngine.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const at='2026-11-22T10:00:00.000Z';
const worlds=WORLD_GAMES.map(w=>({id:w.id,label:w.label,icon:w.icon,completed:0,total:w.count}));
const empty=getLearningSnapshot({animalAnswers:[],colorAnswers:[],animalWords:['cat'],colorWords:['red'],now:at});

test('Every word in the report reads in English with its Turkish meaning, across all six garden worlds',()=>{
 assert.deepEqual(describeWord('animals','cat'),{domain:'animals',id:'cat',en:'cat',tr:'Kedi',icon:'🐾'});
 assert.equal(describeWord('colors','light blue').tr,'Açık mavi');
 assert.deepEqual([describeWord('numbers','17').en,describeWord('numbers','17').tr],['seventeen','17']);
 assert.equal(describeWord('food','apple').tr,'Elma');
 assert.equal(describeWord('family','have lunch').tr,'Öğle yemeği yemek');
 assert.deepEqual([describeWord('temple','animals:cat').en,describeWord('temple','animals:cat').tr],['cat','Kedi']);
});

test('The family report is English only: no fractions, no maths workshop records',()=>{
 assert.ok(!isEnglishActivity({title:'Kesir Atölyesi — Bölüm 2'}));
 assert.ok(!isEnglishActivity({title:'Kesir Köprüsü — Bölüm 1'}));
 assert.ok(isEnglishActivity({title:'Lezzet Pazarı — Bölüm 3'}));
 const activity=[
  {id:'1',type:'game',title:'Kesir Atölyesi — Bölüm 2',subtitle:'',timestamp:'2026-11-22T09:00:00.000Z',score:1,accuracyRate:1,status:'success'},
  {id:'2',type:'game',title:'Lezzet Pazarı — Bölüm 1',subtitle:'',timestamp:'2026-11-21T09:00:00.000Z',score:1,accuracyRate:1,status:'success',starsEarned:3}
 ];
 const report=buildFamilyReport({snapshot:empty,worlds,evidenceStars:[3],activity,gradeLevel:3,englishLevel:'A1',now:new Date(at)});
 assert.deepEqual(report.recent.map(r=>r.title),['Lezzet Pazarı — Bölüm 1']);
 assert.equal(report.lastPlayedAt,'2026-11-21T09:00:00.000Z');
 assert.deepEqual(report.activeDays,[false,false,false,false,false,true,false],'yesterday, not today');
 const page=src('app/progress/page.tsx');
 assert.doesNotMatch(page,/Kesir|FRACTION|getProgressSummary/,'the maths archive is gone');
 assert.ok(!fs.existsSync(new URL('../src/components/learning/LearningIntelligencePanel.tsx',import.meta.url)),'the two-game report was replaced');
});

test('Totals are honest: number paths the child can open, all twelve worlds, stars from finished missions',()=>{
 const withNumbers=worlds.map(w=>w.id==='island_word_garden_numbers'?{...w,completed:9}:w);
 const young=buildFamilyReport({snapshot:empty,worlds:withNumbers,evidenceStars:[3,2,1],activity:[],gradeLevel:1,englishLevel:'Pre-A1',now:new Date(at)});
 const numbers=young.garden.find(g=>g.domain==='numbers');
 assert.deepEqual([numbers.completed,numbers.total],[5,5],'a Pre-A1 child has five number missions, not fifteen');
 assert.equal(young.garden.length,6);assert.equal(young.islands.length,6);
 assert.equal(young.totalMissions,117-10,"117 missions in twelve worlds; ten number missions are not open yet");
 assert.equal(young.stars,6);
 assert.equal(young.next.kind,'continue','the first unfinished garden world');
 assert.equal(young.next.title,'Sıradaki görev: Hayvan Çayırı');
 const fresh=buildFamilyReport({snapshot:empty,worlds,evidenceStars:[],activity:[],gradeLevel:null,englishLevel:'Pre-A1',now:new Date(at)});
 assert.equal(fresh.next.kind,'start');
});

test('A real profile: discovered words, review list and skills come from recorded answers',async()=>{
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Ada',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 const plan=planMarketMission({aisle:'orchard',stage:1,gradeLevel:3,englishLevel:'A1',history:[],seed:5});
 const discovery=plan.words.map(id=>({wordId:id,kind:'discovery',mistakes:0,firstTryCorrect:false,hintUsed:false,timestamp:'2026-11-01T10:00:00.000Z'}));
 await saveFoodMarketMission(repo,child.id,'orchard',1,0,30,discovery,'s1');
 const quiz=planMarketMission({aisle:'orchard',stage:2,gradeLevel:3,englishLevel:'A1',history:discovery,seed:6});
 const answers=quiz.questions.map((q,i)=>({wordId:q.target,kind:MARKET_STAGES[1].skill,mistakes:i===0?1:0,
  firstTryCorrect:i!==0,hintUsed:false,timestamp:'2026-11-01T10:05:00.000Z'}));
 await saveFoodMarketMission(repo,child.id,'orchard',2,1,40,answers,'s2');
 const report=await loadFamilyReport(repo,{...child,gradeLevel:3,englishLevel:'A1'},new Date('2026-11-22T10:00:00.000Z'));
 const food=report.garden.find(g=>g.domain==='food');
 assert.equal(food.completed,2);
 assert.equal(food.discovered,plan.words.length);
 assert.ok(report.wordsDiscovered>=plan.words.length);
 assert.equal(report.skills.find(s=>s.id==='recognition').attempts>0,true);
 assert.ok(report.due.every(w=>w.domain==='food'&&w.tr&&w.en),'review words carry their Turkish meaning');
 assert.ok(report.recent.length>=2&&report.recent.every(r=>r.title.startsWith('Lezzet Pazarı')));
});

test('The panel is for adults: parent gate first, nothing about a child before it opens',()=>{
 const page=src('app/progress/page.tsx');
 assert.match(page,/const \[gate,setGate\]=useState<'checking'\|'ask'\|'open'>\('checking'\);/);
 assert.match(page,/\{gate==='ask'&&<ParentalGateModal isOpen/);
 assert.match(page,/onClose=\{\(\)=>router\.push\('\/kids'\)\}/);
 assert.match(page,/if\(!unlocked\)return;\n  loadProfiles\(\)/,'profiles are read only after the gate');
 assert.match(page,/window\.sessionStorage\.setItem\(GATE_KEY,String\(Date\.now\(\)\)\)/);
 const dashboard=src('components/family/FamilyDashboard.tsx');
 assert.match(dashboard,/<span lang="en" className="text-sm font-black text-amber-50">\{word\.en\}<\/span>/);
 assert.match(dashboard,/Ses kaydı ya da çocuğun yazdığı metin saklanmaz\./);
});

test('Entry copy: no internal milestone notes, and the family path leads to the panel',()=>{
 const gate=src('components/onboarding/KidsWelcomeGate.tsx');
 assert.doesNotMatch(gate,/P2 kapsamında|sonraki aşamada geliştirilecek|henüz doğrulanmadı/);
 assert.match(gate,/<Link href="\/progress"/);
 assert.match(src('components/homepage/AuthModal.tsx'),/Aile Paneli/);
});
