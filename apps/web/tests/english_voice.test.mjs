import test from 'node:test';
import assert from 'node:assert/strict';
import {preferredEnglishVoiceIndex} from '../src/lib/audio/EnglishVoice.ts';
test('English voice selector rejects unrelated languages',()=>{
 assert.equal(preferredEnglishVoiceIndex([{lang:'tr-TR',name:'Turkish'}]),-1);
 assert.equal(preferredEnglishVoiceIndex([]),-1);
});
test('Natural enhanced US voices outrank robotic English voices',()=>{
 assert.equal(preferredEnglishVoiceIndex([
  {lang:'en-US',name:'espeak basic',localService:true},
  {lang:'en-GB',name:'Natural Enhanced',localService:true},
  {lang:'en-US',name:'Natural Neural English',localService:true}
 ]),2);
});
test('US English is preferred when quality matches',()=>{
 assert.equal(preferredEnglishVoiceIndex([{lang:'en-AU',name:'Standard'},{lang:'en-US',name:'Standard'}]),1);
});
