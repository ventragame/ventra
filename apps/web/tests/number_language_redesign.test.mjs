import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {englishNumber,planNumberMission} from '../src/lib/learning/numberValleyEngine.ts';
import {numberWordParts,numberWordTiles,portalSentence} from '../src/lib/learning/numberWordQuest.ts';
import {REWARD_NOTES,rewardDuration} from '../src/lib/audio/RewardSounds.ts';

const read=(relative)=>fs.readFileSync(new URL(relative,import.meta.url),'utf8');
const ui=read('../src/components/learning/activities/NumberValleyAdventure.tsx');
test('All English number word puzzles reconstruct accurately in every difficulty band',()=>{
 for(let n=1;n<=1000;n++){
  const word=englishNumber(n).replace(/[^a-z]/g,'');
  const parts=numberWordParts(n);
  assert.equal(parts.join(''),word,'English parts for '+n);
  assert.ok(parts.length>=1&&parts.length<=10,'accessible taps '+n);
  const tiles=numberWordTiles(n,n*13);
  assert.equal(tiles.length,parts.length);
  assert.equal(new Set(tiles.map(t=>t.id)).size,parts.length);
  assert.deepEqual(tiles,numberWordTiles(n,n*13));
  assert.deepEqual(tiles.map(t=>t.part).sort(),[...parts].sort());
 }
 assert.equal(portalSentence(5),'I see five stars.');
 assert.equal(portalSentence(125),'I see one hundred twenty-five stars.');
});
test('Number stage 3 now practices written English vocabulary, not arithmetic or item counting',()=>{
 const discoveries=Array.from({length:15},(_,i)=>({
  value:i+1,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-02T14:00:00.000Z'
 }));
 const plan=planNumberMission({mission:3,seed:19,history:discoveries,englishLevel:'Pre-A1'});
 assert.ok(plan.questions.length>0);
 assert.ok(plan.questions.every(q=>q.skill==='application'));
 assert.match(ui,/chooseWordTile/);
 assert.match(ui,/numberWordParts\(current.target\)/);
 assert.match(ui,/nv-forge-choices/);
 assert.doesNotMatch(ui,/Yıldızları Teslim Et|Topladığın yıldız|NumberPlaceWorkshop|confirmCount\(/);
});
test('Portal is now an English sentence adventure without prices, arithmetic or shopping',()=>{
 assert.match(ui,/portalSentence\(value\)/);
 assert.match(ui,/choosePortalToken/);
 assert.match(ui,/choosePortalSentence/);
 assert.doesNotMatch(ui,/Which costs less|marketPrices|chooseMarket|jeton|ucuz olanı seç/);
 assert.match(ui,/\['I','see',englishNumber\(current.target\),'stars'\]/);
});
test('Correct answers automatically advance, but keep chapter success and retry safely',()=>{
 assert.match(ui,/setTimeout\(\(\)=>next\(\),1050\)/);
 assert.match(ui,/clearTimeout\(timer\)/);
 assert.doesNotMatch(ui,/Sonraki Görev →|Görevi Kaydet →/);
 assert.match(ui,/Görev Tamamlandı!/);
 assert.match(ui,/Tekrar kaydet/);
 assert.match(ui,/soundService.playSfx\('correct'\)/);
 assert.match(ui,/soundService.playSfx\('gentle_retry'\)/);
 assert.match(ui,/soundService.playSfx\('fanfare'\)/);
});
test('Feedback score uses distinct original musical motifs with restrained timing',()=>{
 assert.equal(REWARD_NOTES.correct.length,3);
 assert.equal(REWARD_NOTES.gentle_retry.length,3);
 assert.ok(REWARD_NOTES.fanfare.length>=5);
 assert.ok(rewardDuration('fanfare')>rewardDuration('correct'));
 assert.ok(REWARD_NOTES.correct[0]!==REWARD_NOTES.gentle_retry[0]);
 const mix=read('../src/lib/audio/SoundService.ts');
 assert.match(mix,/playRewardSound\(ctx,name as RewardEvent/);
 assert.match(mix,/this.settings.effects/);
 assert.match(mix,/this.isMuted/);
 assert.match(mix,/this.playChannel\(\`\/audio\/sfx\/\$\{name\}\.wav\`/);
 const music=read('../src/lib/audio/MusicDirector.ts');
 assert.match(music,/private shaker/);
 assert.match(music,/private shimmer/);
 assert.match(music,/tempo:118/);
 assert.match(music,/setPaused\(value:boolean\)/);
});
