import test from 'node:test';
import assert from 'node:assert/strict';
import {beginWebLocalRecognition,mapWebRecognitionError} from '../src/lib/speech/webLocalRecognition.ts';

class FakeSpeechRecognition {
 static mostRecent=null;
 lang=''; continuous=true;interimResults=false;maxAlternatives=1;
 processLocally=false;
 onstart=null;onaudiostart=null;onspeechstart=null;onsoundstart=null;onspeechend=null;
 onnomatch=null;onresult=null;onerror=null;onend=null;
 aborted=false;started=false;stopped=false;
 constructor(){FakeSpeechRecognition.mostRecent=this;}
 start(){this.started=true;}
 stop(){this.stopped=true;}
 abort(){this.aborted=true;}
}
const spoken=(words,isFinal=true)=>{
 const result=Array.from(words.map(transcript=>({transcript})));
 result.isFinal=isFinal;
 return {resultIndex:0,results:[result]};
};

test('Local recognition starts on-device, reports readiness before listening, and accepts final English speech',async()=>{
 const statuses=[];
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000,s=>statuses.push(s));
 const rec=FakeSpeechRecognition.mostRecent;
 assert.equal(rec.started,true);
 assert.equal(rec.lang,'en-US');
 assert.equal(rec.processLocally,true);
 assert.equal(rec.interimResults,true);
 assert.deepEqual(statuses,['starting']);
 rec.onstart();
 rec.onaudiostart();
 rec.onspeechstart();
 rec.onspeechend();
 rec.onresult(spoken(['Bye!','bye bye']));
 const result=await session.result;
 assert.equal(result.kind,'recognized');
 assert.deepEqual(result.alternatives,['Bye!','bye bye']);
 assert.deepEqual(statuses,['starting','starting','microphone-ready','speech-detected','processing']);
 assert.equal(rec.onend,null,'all browser callbacks should be removed on completion');
});

test('Recognition end cannot incorrectly win a late final result',async()=>{
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();
 rec.onend();
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(typeof rec.onresult,'function','onresult should be retained briefly after onend');
 rec.onresult(spoken(['Hello!']));
 assert.equal((await session.result).kind,'recognized');
});

test('Device errors are never mislabeled as the child speaking silently',async()=>{
 const examples=[
  ['audio-capture','unavailable','microphone-error'],
  ['language-not-supported','unavailable','language-pack'],
  ['service-not-allowed','unavailable','service-unavailable'],
  ['network','unavailable','service-unavailable'],
  ['not-allowed','denied','permission-denied'],
  ['no-speech','no-speech','no-speech'],
  ['aborted','cancelled','cancelled']
 ];
 for(const [error,kind,reason] of examples){
  assert.deepEqual(mapWebRecognitionError(error),{kind,reason});
  const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
  FakeSpeechRecognition.mostRecent.onerror({error});
  const result=await session.result;
  assert.equal(result.kind,kind,error);
  assert.equal(result.reason,reason,error);
 }
 assert.deepEqual(mapWebRecognitionError('no-speech',true),{
  kind:'unrecognized',reason:'speech-unrecognized'
 });
});

test('Real microphone audio and detected speech are not mistaken for speech recognition success',async()=>{
 const capture=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();rec.onspeechstart();rec.onerror({error:'no-speech'});
 const result=await capture.result;
 assert.equal(result.kind,'unrecognized');
 assert.deepEqual(result.alternatives,[]);
});

test('An engine that closes before capturing audio is an unavailable recognizer, not silence',async()=>{
 const capture=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 FakeSpeechRecognition.mostRecent.onend();
 const result=await capture.result;
 assert.equal(result.kind,'unavailable');
 assert.equal(result.reason,'not-started');
});

test('Cancellation releases the speech engine even if the browser has not produced a result',async()=>{
 const capture=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 capture.cancel();
 assert.equal(rec.aborted,true);
 assert.equal((await capture.result).kind,'cancelled');
});

test('An engine without mandatory local-only support never starts a remote recognizer',async()=>{
 class LegacySpeechRecognition extends FakeSpeechRecognition{
  constructor(){super();delete this.processLocally;}
 }
 const capture=beginWebLocalRecognition(LegacySpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 assert.equal(rec.started,false);
 assert.deepEqual(await capture.result,{
  kind:'unavailable',reason:'service-unavailable',alternatives:[],mode:'web-local'
 });
});

test('Short English speech is finalized with stop() instead of abort(), then accepts a final result',async()=>{
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();
 rec.onspeechstart();
 rec.onspeechend();
 await new Promise(resolve=>setTimeout(resolve,620));
 assert.equal(rec.stopped,true,'speechend must trigger stop() to request final words');
 assert.equal(rec.aborted,false,'never abort before trying to obtain the transcript');
 rec.onresult(spoken(['Hello!']));
 const result=await session.result;
 assert.equal(result.kind,'recognized');
 assert.equal(result.source,'final');
 assert.deepEqual(result.alternatives,['Hello!']);
});

test('Last interim transcript is recovered if a local engine disconnects without a final event',async()=>{
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();rec.onspeechstart();
 rec.onresult(spoken(['Bye!'],false));
 rec.onend();
 const result=await session.result;
 assert.deepEqual(result,{
  kind:'recognized',reason:'interim-result',alternatives:['Bye!'],
  mode:'web-local',source:'interim'
 });
});

test('On-device recognizer no-speech error cannot discard an already identified phrase',async()=>{
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();rec.onspeechstart();
 rec.onresult(spoken(['Good morning'],false));
 rec.onerror({error:'no-speech'});
 const result=await session.result;
 assert.equal(result.kind,'recognized');
 assert.equal(result.source,'interim');
 assert.deepEqual(result.alternatives,['Good morning']);
});

test('An interim phrase is not invented when only raw sound is detected',async()=>{
 const session=beginWebLocalRecognition(FakeSpeechRecognition,5000);
 const rec=FakeSpeechRecognition.mostRecent;
 rec.onaudiostart();rec.onspeechstart();
 rec.onend();
 const result=await session.result;
 assert.equal(result.kind,'unrecognized');
 assert.deepEqual(result.alternatives,[]);
});
