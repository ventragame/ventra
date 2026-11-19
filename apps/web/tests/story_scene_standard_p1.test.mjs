import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/story/'+file,import.meta.url),'utf8');
test('Story discovery, sequencing and detective share the same illustrated narration contract',()=>{
 const core=read('StorySceneStandard.tsx');
 assert.match(core,/export function StoryNarrationPanel/);
 assert.match(core,/export function StorySceneGuide/);
 assert.match(core,/export function storyDecisionFeedback/);
 assert.match(core,/onListen:()=>void/);
 assert.match(core,/onToggleText\?:\(\)=>void/);
 assert.match(core,/lang="en"/);
 assert.match(core,/aria-pressed=\{showText\}/);
 assert.match(core,/voiceUnavailable/);
 assert.match(core,/story-standard-listen/);
 assert.match(core,/story-standard-caption/);
 for(const name of ['StoryForestAdventure.tsx','StorySequenceAdventure.tsx','StoryDetectiveAdventure.tsx']){
  const game=read(name);
  assert.match(game,/import \{StoryNarrationPanel,StorySceneGuide,storyDecisionFeedback\}/);
  assert.match(game,/story-scene-standard\.css/);
  assert.match(game,/<StoryNarrationPanel/);
  assert.match(game,/<StorySceneGuide/);
  assert.match(game,/storyDecisionFeedback\('retry'\)/);
 }
});
test('Illustrated response choices remain governed by original engines and saving logic',()=>{
 const forest=read('StoryForestAdventure.tsx');
 assert.match(forest,/<StoryScene plan=\{plan\}/);
 assert.match(forest,/JourneyObjectArt object=\{object\}/);
 assert.match(forest,/tapObject\(object\)/);
 assert.match(forest,/tapFriend\(id\)/);
 assert.match(forest,/tapChallenge\(value\)/);
 assert.match(forest,/saveForestJourney/);
 const sequence=read('StorySequenceAdventure.tsx');
 assert.match(sequence,/StorySequenceFrame frame=\{watchFrame\}/);
 assert.match(sequence,/selectFrame\(id\)/);
 assert.match(sequence,/selectCheck\(id\)/);
 assert.match(sequence,/sequenceComprehensionPrompt\(activeCheck.kind,englishLevel\)/);
 assert.match(sequence,/saveSequenceStory/);
 assert.equal((sequence.match(/<StoryNarrationPanel/g)||[]).length,3);
 assert.equal((sequence.match(/<StorySceneGuide/g)||[]).length,3);
 const detective=read('StoryDetectiveAdventure.tsx');
 assert.match(detective,/<ChoiceArt kind=\{step.kind\} value=\{choice\}/);
 assert.match(detective,/answerChoice\(id\)/);
 assert.match(detective,/saveDetectiveCase/);
 assert.match(detective,/detectiveAdventurePrompt/);
 assert.match(detective,/detectiveAdventureNarration/);
});
test('Shared illustrated narration is readable on phones with accessible controls',()=>{
 const css=read('story-scene-standard.css');
 assert.match(css,/min-height:44px/);
 assert.match(css,/min-width:44px/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 const core=read('StorySceneStandard.tsx');
 assert.match(core,/mode:'watch'\|'choose'\|'order'\|'remember'/);
 assert.match(core,/Resmi incele, anlatımı dinle/);
 assert.match(core,/Resme bak, anlatımı dinle/);
 assert.match(core,/role="group" aria-label="Hikâye görev rehberi"/);
});

test('Caption preference persists through story beats; sequence narration distinguishes first and next',()=>{
 const forest=read('StoryForestAdventure.tsx'),seq=read('StorySequenceAdventure.tsx');
 const det=read('StoryDetectiveAdventure.tsx');
 assert.doesNotMatch(forest,/setCaption\(false\);setVoiceUnavailable\(false\)/);
 assert.doesNotMatch(seq,/setWatchIndex\(next\);setShowCaption\(false\)/);
 assert.match(seq,/slot===0\?'What happened first\?'\:'What happened next\?'/);
 assert.match(seq,/showText=\{true\} promptOnly/);
 assert.doesNotMatch(det,/setWrong\(null\);setCorrect\(false\);setCaption\(false\)/);
 const css=read('story-scene-standard.css');
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-height:550px\)/);
});

test('Forest narration wave remains legible after reusing the shared span control',()=>{
 const css=read('story-scene-standard.css');
 assert.match(css,/\.sj-root \.sj-spoken>\.story-standard-waves\{/);
 assert.match(css,/font-size:20px/);
});
