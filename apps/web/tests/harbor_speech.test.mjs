import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HARBOR_EPISODES,HARBOR_GAME_ID,matchesExpectedSpeech,normalizeSpeech} from '../src/lib/learning/harborDialogueEngine.ts';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';
const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),'utf8');

test('Harbor dialogues contain five authored worlds with real Pre-A1/A1/A2 differentiation',()=>{
 assert.equal(HARBOR_EPISODES.length,5);
 assert.equal(new Set(HARBOR_EPISODES.map(ep=>ep.id)).size,5);
 for(const [i,episode] of HARBOR_EPISODES.entries()){
  assert.equal(episode.id,i+1);
  assert.equal(episode.prompts['Pre-A1'].length,3);
  assert.equal(episode.prompts.A1.length,3);
  assert.equal(episode.prompts.A2.length,3);
  for(const level of ['Pre-A1','A1','A2']){
   for(const challenge of episode.prompts[level]){
    assert.ok(challenge.line.length>=5);
    assert.equal(challenge.choices.length,3);
    assert.equal(new Set(challenge.choices).size,3);
    assert.ok(challenge.choices.includes(challenge.reply));
    assert.ok(challenge.accept.length>0);
    assert.equal(matchesExpectedSpeech([challenge.reply],challenge.accept),true,
      'Expected spoken answer should be accepted: '+challenge.reply);
   }
  }
  assert.notDeepEqual(episode.prompts['Pre-A1'],episode.prompts.A1);
  assert.notDeepEqual(episode.prompts.A1,episode.prompts.A2);
 }
 assert.equal(HARBOR_GAME_ID,'island_speaking_harbor_dialogue');
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.speaking_harbor.contentPublished,true);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.speaking_harbor.totalPublishedRequiredLevels,5);
});

test('Speech matching is deterministic and does not accept a partial word or arbitrary noise',()=>{
 assert.equal(normalizeSpeech(' Hello, WORLD!  '),'hello world');
 assert.equal(matchesExpectedSpeech(['Hello!'],['hello']),true);
 assert.equal(matchesExpectedSpeech(['hello there'],['hello']),true);
 assert.equal(matchesExpectedSpeech(['a yellow boat'],['hello']),false);
 assert.equal(matchesExpectedSpeech(['yellow'],['hello']),false);
 assert.equal(matchesExpectedSpeech(['no'],['yes']),false);
 assert.equal(matchesExpectedSpeech([],['hello']),false);
});

test('Voice is child-initiated, local-first with touch fallback and no Ventra audio storage',()=>{
 const speech=read('../src/lib/speech/childSpeech.ts');
 const browser=read('../src/lib/speech/webLocalRecognition.ts');
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const android=read('../../mobile/android/app/src/main/java/com/ventra/app/VentraSpeechPlugin.java');
 const manifest=read('../../mobile/android/app/src/main/AndroidManifest.xml');
 const ios=read('../../mobile/ios/App/App/VentraSpeechPlugin.swift');
 const plist=read('../../mobile/ios/App/App/Info.plist');
 const story=read('../../mobile/ios/App/App/Base.lproj/Main.storyboard');
 assert.match(speech,/processLocally:true/);
 assert.match(browser,/recognition\.processLocally=true/);
 assert.match(speech,/installLocalEnglish/);
 assert.match(speech,/getUserMedia/);
 assert.match(speech,/stream\?\.getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
 assert.doesNotMatch(speech,/fetch\(|XMLHttpRequest|localStorage|MediaRecorder/);
 assert.match(ui,/matchesExpectedSpeech/);
 assert.match(ui,/Yerel konuşma motoru sesi algıladı ancak metin üretmedi/);
 assert.match(ui,/Doğru ifadeyi söyle veya seç!/);
 assert.match(ui,/onClick=\{\(\)=>tap\(option\)\}/);
 assert.match(android,/createOnDeviceSpeechRecognizer/);
 assert.match(android,/isOnDeviceRecognitionAvailable/);
 assert.match(android,/RECORD_AUDIO/);
 assert.match(android,/previous\.cancel\(\); previous\.destroy\(\)/);
 assert.match(manifest,/android\.permission\.RECORD_AUDIO/);
 assert.match(ios,/requiresOnDeviceRecognition = true/);
 assert.match(ios,/supportsOnDeviceRecognition/);
 assert.match(ios,/installTap/);
 assert.match(ios,/removeTap/);
 assert.match(plist,/NSMicrophoneUsageDescription/);
 assert.match(plist,/NSSpeechRecognitionUsageDescription/);
 assert.match(story,/VentraBridgeViewController/);
});

test('Harbor completion uses existing per-child game repository, no transcripts',()=>{
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const economy=read('../src/lib/rewards/economyEngine.ts');
 assert.match(ui,/recordGameCompleted\(payload,profileId\)/);
 assert.match(ui,/gameId:HARBOR_GAME_ID/);
 assert.match(ui,/onSaved\(\)/);
 assert.match(ui,/stopSpeechCapture\(\)/);
 assert.doesNotMatch(ui,/metrics:\{[^}]*transcripts/);
 assert.match(economy,/island_speaking_harbor_dialogue/);
 assert.match(ui,/id>completed\+1/);
});

test('Voice capture pauses music without changing user settings and always cleans up',()=>{
 const sound=read('../src/lib/audio/SoundService.ts');
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(sound,/private captureActive=false/);
 assert.match(sound,/this\.music\.setPaused\(!playable\|\|this\.captureActive\)/);
 assert.match(sound,/setCaptureActive\(active:boolean\)/);
 assert.match(ui,/soundService\.setCaptureActive\(true\)/);
 assert.match(ui,/finally\{\s*if\(run===generation\.current\)soundService\.setCaptureActive\(false\);/);
 assert.match(ui,/visibilitychange/);
});

test('Harbor achievements reach the correct island badge, dock and player card',()=>{
 const kids=read('../src/app/kids/page.tsx');
 const game=read('../src/components/game/PhaserGame.tsx');
 const scene=read('../src/components/game/scenes/WorldScene.ts');
 assert.match(kids,/getAllLevelProgress\(HARBOR_GAME_ID,profile\.id\)/);
 assert.match(kids,/setHarborCompleted\(harborCount\)/);
 assert.match(kids,/focusedIsland==='speaking_harbor'\?Math\.round\(100\*harborCompleted\/5\)/);
 assert.match(kids,/harborCompletedLevels=\{harborCompleted\}/);
 assert.match(kids,/island\.id==='speaking_harbor'\?harborCompleted===5/);
 assert.match(game,/islandId:'speaking_harbor',completed:harborCompletedLevels,total:5/);
 assert.match(scene,/def\.id==='speaking_harbor'\?this\.harborCompletedLevels:0/);
});

test('Harbor tells the parent when the browser recognizer generates no words',()=>{
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const engine=read('../src/lib/speech/webLocalRecognition.ts');
 assert.match(ui,/konuşma motoru metin üretmedi/);
 assert.match(engine,/recognition\?\.stop\(\)/);
 assert.match(engine,/if\(provisional\.length\)/);
 assert.match(engine,/interim-result/);
});

test('Harbor offers real speech without a custom guardian modal',()=>{
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const capability=read('../src/lib/speech/childSpeech.ts');
 const web=read('../src/lib/speech/webLocalRecognition.ts');
 assert.match(ui,/Ses tanıma çalışmıyor mu/);
 assert.match(ui,/Tarayıcı sağlayıcısı sesi işleyebilir/);
 assert.match(ui,/speechAvailable/);
 assert.match(ui,/onClick=\{\(\)=>void mic\(\)\}/);
 assert.doesNotMatch(ui,/ParentalGateModal|parentConsentOpen|parentGateOpen|setBrowserServiceApproved/);
 assert.doesNotMatch(capability,/parentApprovedBrowserService/);
 assert.match(capability,/beginWebBrowserRecognition\(ctor,ms,onStatus\)/);
 assert.match(web,/recognition\.processLocally=false/);
 assert.doesNotMatch(web,/recognition\.phrases=/);
});

test('A microphone that cannot transcribe is never presented as a speech answer',()=>{
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const capability=read('../src/lib/speech/childSpeech.ts');
 const style=read('../src/components/learning/harbor/harbor-speech.css');
 assert.match(ui,/speechAvailable/);
 assert.match(ui,/disabled=\{busy\|\|listening\|\|locked\.current\|\|!canAnswer\|\|!speechAvailable\}/);
 assert.match(ui,/Ses tanıma çalışmıyor mu/);
 assert.match(ui,/İngilizce yanıt çözümleniyor/);
 assert.match(ui,/mode='\+result\.mode/);
 assert.match(ui,/network-error/);
 assert.match(capability,/mode:'web-browser'/);
 assert.match(style,/harbor-parent-tools/);
 assert.doesNotMatch(ui,/Bakalım ne söyledin|parentAcknowledged/);
});

test('Real browser speech is the default even if an installed local pack falsely reports available',()=>{
 const capability=read('../src/lib/speech/childSpeech.ts');
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(capability,/speechCapability\(preferLocal=false\)/);
 assert.match(capability,/if\(preferLocal&&localAvailable\)/);
 assert.match(capability,/return \{mode:'web-browser',installable,localAvailable/);
 assert.match(ui,/result\.kind==='unrecognized'/);
 assert.match(ui,/if\(result\.mode==='web-local'\)/);
 assert.match(ui,/setCapability\(\{mode:'web-browser',installable:false,localAvailable:true/);
 assert.match(ui,/Cihaz içi tanımayı dene/);
 assert.match(ui,/speechCapability\(true\)/);
 assert.match(ui,/Sonraki deneme farklı motorla yapılacak/);
 assert.doesNotMatch(ui,/ParentalGateModal|parentConsentOpen|parentGateOpen/);
});
