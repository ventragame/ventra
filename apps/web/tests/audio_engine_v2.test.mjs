import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MusicDirector,MUSIC_SCENES,musicSceneForDistrict} from '../src/lib/audio/MusicDirector.ts';

test('Original score provides a unique music state per English learning world and map',()=>{
 assert.deepEqual(MUSIC_SCENES,['archipelago','garden','animals','colors','numbers','food','family','sanctuary','plaza','movement','wishes','lantern']);
 for(const area of ['animals','colors','numbers','food','family','sanctuary'])
  assert.equal(musicSceneForDistrict(area),area);
 assert.equal(musicSceneForDistrict('overview'),'garden');
 assert.equal(musicSceneForDistrict('story_castle'),'plaza');
 assert.equal(musicSceneForDistrict(null),'archipelago');
 const m=new MusicDirector();
 assert.equal(m.getEnabled(),false); // Never auto-play to a child.
 assert.equal(m.getScene(),'archipelago');
 m.setScene('family');m.setVolume(0.4);m.setDucked(true);m.setEnabled(true);m.setPaused(false);
 assert.equal(m.getScene(),'family');assert.equal(m.getEnabled(),true);
 m.setEnabled(false);m.stop();
});

test('Capacitor TTS does not load on the Next.js server during prerender',()=>{
 const source=fs.readFileSync(new URL('../src/lib/audio/SoundService.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/^import\\s+\\{\\s*TextToSpeech\\s*\\}/m);
 assert.match(source,/await import\\('@capacitor-community\\/text-to-speech'\\)/);
 assert.match(source,/typeof window!==['"]undefined['"]/);
});
test('Music scheduler has visibility, opt-in, dynamic ducking and independent mixer safeguards',()=>{
 const sound=fs.readFileSync(new URL('../src/lib/audio/SoundService.ts',import.meta.url),'utf8');
 const music=fs.readFileSync(new URL('../src/lib/audio/MusicDirector.ts',import.meta.url),'utf8');
 assert.match(sound,/musicEnabled:false/);
 assert.match(sound,/document.hidden/);
 assert.match(sound,/setMusicEnabled\(enabled:boolean\)/);
 assert.match(sound,/setChannelVolume\(channel:AudioChannel/);
 assert.match(sound,/localStorage\.setItem\(STORAGE_KEY_AUDIO_V2/);
 assert.match(sound,/voiceActive=true/);
 assert.match(sound,/music\.setDucked\(this.voiceActive\)/);
 assert.match(sound,/utterance.volume=this.settings.voice/);
 assert.match(sound,/cancelSpeech\(\)/);
 assert.match(music,/this\.timer=setInterval/);
 assert.match(music,/this\.output\?\.disconnect\(\)/);
 assert.match(music,/setPaused\(value:boolean\)/);
});

test('Every listening world routes English playback via central volume/ducking and preserves gated completion',()=>{
 const dir=new URL('../src/components/learning/activities/',import.meta.url);
 for(const name of ['AnimalMeadowAdventure','ColorGroveAdventure','NumberValleyAdventure',
   'FoodMarketAdventure','FamilyVillageAdventure','TempleAdventure']){
  const src=fs.readFileSync(new URL(name+'.tsx',dir),'utf8');
  assert.match(src,/soundService\.speakEnglish\(/,name+' must use central English voice mixer');
  assert.doesNotMatch(src,/new SpeechSynthesisUtterance\(/,name+' must not bypass speech mixing');
 }
 const number=fs.readFileSync(new URL('NumberValleyAdventure.tsx',dir),'utf8');
 assert.match(number,/onEnd:.*?\{setHeardAudio\(true\)/s);
 assert.doesNotMatch(number,/onStart:[^\n]*setHeardAudio\(true\)/);
 const food=fs.readFileSync(new URL('FoodMarketAdventure.tsx',dir),'utf8');
 const family=fs.readFileSync(new URL('FamilyVillageAdventure.tsx',dir),'utf8');
 const temple=fs.readFileSync(new URL('TempleAdventure.tsx',dir),'utf8');
 for(const src of [food,family,temple]){
  assert.match(src,/onEnd:/);
  assert.match(src,/setHeard\(true\)/);
  assert.match(src,/setHint\(true\)/);
 }
});

test('Kid controls persist per channel and no music starts without a player action',()=>{
 const panel=fs.readFileSync(new URL('../src/components/audio/AudioSettingsPanel.tsx',import.meta.url),'utf8');
 const hub=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 const path=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 assert.match(panel,/type="range"/);
 assert.match(panel,/aria-pressed=\{settings.musicEnabled\}/);
 assert.match(panel,/setMusicEnabled\(!settings.musicEnabled\)/);
 assert.match(panel,/onClick=\{activateMusic\}/);
 assert.match(panel,/role="dialog"/);
 assert.match(hub,/setIsAudioSettingsOpen\(true\)/);
 assert.match(hub,/AudioSettingsPanel/);
 assert.match(path,/musicSceneForDistrict\(district\)/);
 assert.match(path,/setMusicScene\('archipelago'\)/);
});
