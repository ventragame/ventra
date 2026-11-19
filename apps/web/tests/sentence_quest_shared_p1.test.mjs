import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/sentence/'+file,import.meta.url),'utf8');
const worlds=['SentencePlazaAdventure.tsx','MovementMagicAdventure.tsx','WishFestivalAdventure.tsx','LanternFestivalAdventure.tsx'];
test('Every sentence world reuses one word builder, progress, hint and correct feedback',()=>{
 for(const name of worlds){
  const s=read(name);
  for(const token of ['<SentenceQuestBuilder tokens=','<SentenceQuestProgress index=','<SentenceQuestSuccess detail=','<SentenceQuestReward independent=','sentenceQuestHint(','sentenceQuestCorrect(','sentence-quest-unified.css','saveSentencePlazaMission']){
   assert.ok(s.includes(token),name+' missing '+token);
  }
  assert.ok(s.includes('onRemove={'),name+' must preserve ability to remove words');
  assert.ok(s.includes('onAdd={'),name+' must preserve word choice callback');
  assert.ok(s.includes('firstTryCorrect'),name+' must preserve independent scoring');
 }
 const ui=read('SentenceQuestComponents.tsx');
 assert.ok(ui.includes('visibleWord(word,i)'));
 assert.ok(ui.includes('onRemove(i)'));
 assert.ok(ui.includes('onAdd(t.id)'));
 assert.ok(ui.includes('data-error={wrongIndex===i}'));
 assert.ok(ui.includes('aria-label="Kurduğun İngilizce cümle"'));
 assert.ok(ui.includes('locked||complete||pickedIds.includes(t.id)'));
 assert.ok(!ui.includes('saveSentencePlazaMission'));
 assert.ok(!ui.includes('localStorage'));
});
test('Hint copy is shared while game-specific validators remain independent',async()=>{
 const {sentenceQuestHint,sentenceQuestCorrect}=await import('../src/components/learning/sentence/sentence-quest-language.ts');
 assert.equal(sentenceQuestHint('Özneye bak.','runs'),'💡 İpucu: Özneye bak. Sıradaki kelime: “runs”.');
 assert.match(sentenceQuestCorrect('The dog runs.','Sahne canlanıyor.'),/Cümlen doğru! The dog runs/);
 for(const name of worlds){
  const s=read(name);
  assert.ok(s.includes('hintUsed')||s.includes('assisted'));
  assert.ok(s.includes('modelHeard')||s.includes('heardModel'));
 }
});
test('Shared sentence UI uses touch targets, keyboard focus, overflow protection and reduced-motion',()=>{
 const css=read('sentence-quest-unified.css');
 for(const x of ['min-height:46px','min-width:44px','touch-action:manipulation',':focus-visible','overflow-wrap:anywhere','max-width:520px','prefers-reduced-motion:reduce']){
  assert.ok(css.includes(x),x);
 }
});
