import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 advanceAfterSpokenSentence,spokenAdvanceFallbackMs
} from '../src/components/learning/sentence/sentenceAutoAdvance.ts';
import {
 plazaCurriculumPool,planPlazaMission,plazaDecoys,plazaWordTiles
} from '../src/lib/learning/sentencePlazaEngine.ts';
import {sentenceWordKey} from '../src/lib/learning/sentenceTokens.ts';
import {
 LANTERN_PLACES,LANTERN_COLORS,planLanternFestival
} from '../src/lib/learning/lanternFestivalEngine.ts';

const read=file=>fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const LEVELS=['Pre-A1','A1','A2'];

/** Fake clock + the game's single replaceable timer. */
function harness({played=true,minDwellMs=1950,silentDelayMs=4000,wordCount=13,syncError=false}={}){
 const state={now:0,timer:null,advanced:0,waiting:true,events:null,cancelled:0};
 advanceAfterSpokenSentence({
  speak:events=>{state.events=events;if(syncError)events.onError();return played;},
  wordCount,minDwellMs,silentDelayMs,
  setTimer:(run,delay)=>{if(state.timer)state.cancelled++;state.timer={run,at:state.now+delay};},
  stillWaiting:()=>state.waiting,
  advance:()=>{state.advanced++;state.waiting=false;},
  now:()=>state.now
 });
 state.tick=ms=>{
  const until=state.now+ms;
  while(state.timer&&state.timer.at<=until){const t=state.timer;state.timer=null;state.now=t.at;t.run();}
  state.now=until;
 };
 return state;
}

test('P2 auto-advance waits for the spoken sentence to finish instead of cutting it off',()=>{
 const s=harness();
 s.tick(5200); // longest old fixed timer (Movement) — the voice is still speaking
 assert.equal(s.advanced,0,'never advances (and cancels speech) while the sentence is spoken');
 s.tick(300);s.events.onEnd(); // a 13-word A2 sentence ends at ~5.5 s
 s.tick(649);assert.equal(s.advanced,0,'short pause after the voice');
 s.tick(1);assert.equal(s.advanced,1);
 s.events.onEnd();s.tick(20000);
 assert.equal(s.advanced,1,'advances exactly once');
});

test('P2 auto-advance keeps the scene visible for a short sentence and has bounded fallbacks',()=>{
 const short=harness({wordCount:4});
 short.tick(800);short.events.onEnd();
 short.tick(1149);assert.equal(short.advanced,0,'minimum dwell is kept after a quick sentence');
 short.tick(1);assert.equal(short.advanced,1);

 const silentWebView=harness({wordCount:13});
 silentWebView.tick(spokenAdvanceFallbackMs(13)+749);assert.equal(silentWebView.advanced,0);
 silentWebView.tick(1);assert.equal(silentWebView.advanced,1,'speech events never arrive: fallback still advances');
 assert.ok(spokenAdvanceFallbackMs(13)>=6000&&spokenAdvanceFallbackMs(40)===10500);

 const noVoice=harness({played:false,silentDelayMs:4000});
 noVoice.tick(3999);assert.equal(noVoice.advanced,0);
 noVoice.tick(1);assert.equal(noVoice.advanced,1,'no voice: the reading delay applies');

 const brokenVoice=harness({played:false,syncError:true,silentDelayMs:4000});
 brokenVoice.tick(3999);assert.equal(brokenVoice.advanced,0,'a voice failing at start is treated as no voice');
 brokenVoice.tick(1);assert.equal(brokenVoice.advanced,1);

 const error=harness();
 error.tick(4500);error.events.onError();
 error.tick(650);assert.equal(error.advanced,1,'a voice error mid-sentence still moves on');
});

test('P2 auto-advance never fires after the child leaves or the round is reset',()=>{
 const s=harness();
 s.tick(2000);s.waiting=false; // exit / back button / new mission
 s.events.onEnd();s.tick(30000);
 assert.equal(s.advanced,0);
 const late=harness();
 late.events.onEnd();late.waiting=false;late.tick(30000);
 assert.equal(late.advanced,0,'a pending advance re-checks the guard when it fires');
});

test('P2 Plaza and Movement use the shared speech-aware advance with their existing guards and timers',()=>{
 const plaza=read('components/learning/sentence/SentencePlazaAdventure.tsx');
 const move=read('components/learning/sentence/MovementMagicAdventure.tsx');
 for(const [name,ui,timer,guard] of [['Plaza',plaza,'nextTimer','awaitingTransition'],['Movement',move,'pending','advancing']]){
  assert.match(ui,/import \{advanceAfterSpokenSentence\} from '\.\/sentenceAutoAdvance';/,name);
  const call=ui.slice(ui.indexOf('advanceAfterSpokenSentence({'),ui.indexOf('\n  });',ui.indexOf('advanceAfterSpokenSentence({')));
  assert.match(call,/speak:events=>/,name);
  assert.match(call,new RegExp(timer+'\\.current=setTimeout\\('),name+' keeps its single cancellable timer');
  assert.match(call,new RegExp('stillWaiting:\\(\\)=>'+guard+'\\.current'),name+' keeps its transition guard');
  assert.match(call,new RegExp('advance:\\(\\)=>\\{\\n\\s*'+guard+'\\.current=false;'),name);
  assert.doesNotMatch(ui,/const duration=Math\.(max|min)\(/,name+': no fixed timer that cancels speech');
 }
 assert.match(move,/setIndex\(n=>n\+1\);resetRound\(\);/,'Movement advance path (and its checkpoint) unchanged');
});

test('P2 Plaza decoys vary, stay meaning-related and grammatical, and never repeat a target word',()=>{
 const sets=new Set();let questions=0;
 for(let mission=1;mission<=6;mission++)for(const level of LEVELS)for(const q of plazaCurriculumPool(mission,level)){
  questions++;
  const keys=new Set(q.tokens.map(sentenceWordKey));
  assert.equal(q.decoys.length,3,q.sentence);
  assert.equal(new Set(q.decoys).size,3,q.sentence);
  for(const decoy of q.decoys)assert.ok(!keys.has(sentenceWordKey(decoy)),`${q.sentence}: decoy "${decoy}"`);
  sets.add([...q.decoys].sort().join(','));
 }
 assert.ok(questions>500);
 assert.ok(sets.size>questions/4,`only ${sets.size} decoy sets for ${questions} questions`);

 const colours=['red','blue','yellow','green','purple','orange'];
 for(let seed=1;seed<=300;seed++){
  const random=(()=>{let x=seed*2654435761>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);})();
  assert.ok(!plazaDecoys('This is a red lantern'.split(' '),random).includes('orange'),'"a orange" is not English');
  assert.ok(plazaDecoys('I see an orange cat'.split(' '),random).every(w=>!colours.includes(w)||/^[aeiou]/.test(w)),'"an red"');
  const plural=plazaDecoys('There are two red cats in the garden'.split(' '),random);
  assert.ok(!plural.some(w=>['cat','dog','bird','rabbit'].includes(w)),'plural slot keeps plural animals');
  assert.ok(!plazaDecoys('The cat is next to the fountain'.split(' '),random).includes('near'),'no near-synonym decoy');
  const swaps=plazaDecoys('The cat is under the tree'.split(' '),random);
  assert.ok(swaps.filter(w=>['dog','bird','rabbit','behind','near','house','fountain'].includes(w)).length>=2,
   'two meaning-related swaps: '+swaps);
 }
});

test('P2 Plaza replays draw new decoys for the same sentence without changing the deck or the tiles',()=>{
 const bySentence=new Map();
 for(let seed=1;seed<=60;seed++)for(const q of planPlazaMission({mission:1,grade:3,englishLevel:'A1',seed}).questions){
  const seen=bySentence.get(q.sentence)??new Set();seen.add([...q.decoys].sort().join(','));bySentence.set(q.sentence,seen);
 }
 assert.ok([...bySentence.values()].some(sets=>sets.size>1),'a replayed sentence gets different decoys');
 const a=planPlazaMission({mission:2,grade:3,englishLevel:'A2',seed:99});
 const b=planPlazaMission({mission:2,grade:3,englishLevel:'A2',seed:99});
 assert.deepEqual(a,b,'a deck is reproducible from its seed');
 for(const q of a.questions){
  const tiles=plazaWordTiles(q,7);
  assert.deepEqual(tiles.filter(t=>!t.target).map(t=>t.word).sort(),[...q.decoys].sort());
 }
 const engine=read('lib/learning/sentencePlazaEngine.ts');
 assert.match(engine,/import \{decoysOutsideSentence,firstSentenceMismatch,withoutLessonExample\} from '\.\/sentenceTokens\.ts';/);
 assert.match(engine,/shuffle\(\[\.\.\.new Set\(decoysOutsideSentence\(related,tokens\)\)\],random\)/);
 assert.match(engine,/shuffle\(decoysOutsideSentence\(DECOY_STOCK,tokens\),random\)/);
 assert.match(engine,/const unique=withoutLessonExample\(/);
});

test('P2 Lantern choices show the English word the child builds, and errors only name visible words',()=>{
 for(const place of LANTERN_PLACES){
  assert.equal(place.label,place.id,'map pins and the place picker show the English place word');
  assert.match(place.trName,/^[a-zçğıöşü]+$/);
 }
 for(const trial of planLanternFestival({grade:3,englishLevel:'A1',seed:31}).trials){
  if(trial.chapter===2||trial.chapter===4){
   assert.ok(trial.question.tokens.includes(LANTERN_PLACES.find(p=>p.id===trial.place).label),
    'the shown place word is the one in the sentence');
   assert.ok(trial.question.cue.includes(LANTERN_PLACES.find(p=>p.id===trial.place).tr),'the cue stays Turkish');
  }
  if(trial.chapter===1)assert.ok(trial.question.cue.includes(LANTERN_COLORS.find(c=>c.id===trial.color).tr));
  const place=trial.question.vocabulary.find(v=>v.en===trial.place);
  assert.equal(place.tr,LANTERN_PLACES.find(p=>p.id===trial.place).trName,'vocabulary pairs English with Turkish');
 }
 const ui=read('components/learning/sentence/LanternFestivalAdventure.tsx');
 const colours=ui.slice(ui.indexOf('className="lf-colors"'),ui.indexOf('</div></div>}',ui.indexOf('className="lf-colors"')));
 assert.match(colours,/<small>\{c\.id\}<\/small>/,'colour choices show the English colour');
 assert.doesNotMatch(colours,/c\.tr/,'no Turkish-to-Turkish colour matching');
 const animals=ui.slice(ui.indexOf('className="lf-animals"'),ui.indexOf('</div></div>}',ui.indexOf('className="lf-animals"')));
 assert.match(animals,/<strong>\{a\.id\}<\/strong>/);
 assert.doesNotMatch(animals,/a\.tr/,'no Turkish-to-Turkish animal matching');
 assert.doesNotMatch(ui,/İngilizce renk kelimesine dikkat et/,'the colour error no longer points to an English word that is not shown');
 assert.doesNotMatch(ui,/Tree, bridge, tower ve fountain/);
 assert.doesNotMatch(ui,/Ağaç, köprü, kule veya çeşme etiketine/);
 assert.match(ui,/Yönergedeki rengin İngilizce adını seç\./);
 assert.match(ui,/Yönergedeki yerin İngilizce adını seç\./);
});
