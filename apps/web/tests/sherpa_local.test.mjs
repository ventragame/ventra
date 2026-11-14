import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resampleTo16k} from '../src/lib/speech/localSherpa.ts';
import {advanceShortVoice,SHERPA_AUDIO_WORKLET_FRAMES,SHERPA_MIN_VOICED_MS} from '../src/lib/speech/shortUtteranceVAD.ts';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('The local 16kHz resampler handles ordinary 48kHz desktop microphone frames',()=>{
 const src=new Float32Array(480);
 for(let i=0;i<src.length;i++)src[i]=Math.sin(2*Math.PI*440*i/48000);
 const out=resampleTo16k(src,48000);
 assert.equal(out.length,160);
 assert.ok(out.every(Number.isFinite));
 assert.ok(Math.max(...out)<=1);
 assert.ok(out.some(v=>Math.abs(v)>0.1));
});

test('16kHz input is cloned to avoid transferring the recorder buffer',()=>{
 const input=Float32Array.from([0,0.2,-0.3,0]);
 const out=resampleTo16k(input,16000);
 assert.deepEqual([...out],[...input]);
 assert.notEqual(out.buffer,input.buffer);
});

test('Unsupported sample rates are not silently sent to the decoder',()=>{
 for(const value of [0,-1,NaN,Infinity,4000,999999]){
  assert.throws(()=>resampleTo16k(new Float32Array(2),value),/invalid-sample-rate/);
 }
});

test('Only a deliberate microphone click starts Sherpa; no audio leaves the device',()=>{
 const sherpa=read('../src/lib/speech/localSherpa.ts');
 const worker=read('../src/lib/speech/sherpaWorker.ts');
 const speech=read('../src/lib/speech/childSpeech.ts');
 const harbor=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(sherpa,/new Worker\(new URL\('\.\/sherpaWorker\.ts',import\.meta\.url\)/);
 assert.match(sherpa,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(sherpa,/audioWorklet\.addModule/);
 assert.match(sherpa,/resampleTo16k\(chunk,rate\)/);
 assert.match(sherpa,/requestDecode\(\)/);
 assert.match(sherpa,/stream\?\.getTracks\(\)\.forEach/);
 assert.match(sherpa,/audio-pipeline-failed/);
 assert.match(worker,/createOnlineRecognizer/);
 assert.match(worker,/SHA-256/);
 assert.match(worker,/wasm-html-or-invalid/);
 assert.match(worker,/wasmBinary:bytes/);
 assert.match(worker,/asr-prebuilt\.js/);
 assert.doesNotMatch(worker,/await initASRModule\(/);
 assert.match(worker,/stream\.acceptWaveform\(16000/);
 assert.match(worker,/post\(\{type:'result',id:message\.id,text\}\)/);
 assert.doesNotMatch(sherpa,/fetch\([^)]*audio|\.functions\.invoke|Groq|SpeechRecognition\(/);
 assert.doesNotMatch(worker,/XMLHttpRequest|\.upload\(|Authorization:|fetch\([^)]*audio/);
 assert.match(speech,/mode:'sherpa-local'/);
 assert.match(speech,/beginLocalSherpaRecognition/);
 assert.match(harbor,/Ücretsiz cihaz içi motoru dene/);
 assert.match(harbor,/Tarayıcı motorunu dene/);
});

test('20M model and WASM are lazy, versioned, integrity checked and excluded from git',()=>{
 const prepare=read('../scripts/prepare-sherpa-local.mjs');
 const worker=read('../src/lib/speech/sherpaWorker.ts');
 const ignore=read('../../../.gitignore');
 assert.match(prepare,/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/);
 assert.match(prepare,/sha256/);
 assert.match(prepare,/prepareRuntime\(\)/);
 assert.match(prepare,/manifestName/);
 assert.match(prepare,/sherpa-runtime/);
 assert.match(prepare,/throw error;/);
 assert.match(prepare,/runtimeFiles=names.filter/);
 assert.doesNotMatch(prepare,/if\s*\(process\.env\.VENTRA_REQUIRE_SHERPA_MODEL/);
 assert.match(prepare,/FAILED to prepare sherpa WASM runtime/);
 assert.match(prepare,/FAILED to prepare the English model/);
 assert.match(worker,/cache:'force-cache'/);
 assert.match(worker,/model-integrity/);
 assert.match(worker,/webpackIgnore: true/);
 assert.match(ignore,/apps\/web\/public\/speech\/sherpa-20m\//);
});

test('Release verification checks the physical runtime and four model files',()=>{
 const script=read('../scripts/verify-sherpa-assets.mjs');
 assert.match(script,/manifest\.json/);
 assert.match(script,/encoder\.onnx/);
 assert.match(script,/decoder\.onnx/);
 assert.match(script,/joiner\.onnx/);
 assert.match(script,/tokens\.txt/);
 assert.match(script,/sha256/);
 assert.match(script,/asr\.wasm/);
 assert.match(script,/asr-prebuilt\.js/);
 assert.match(script,/loaderBlob/);
 assert.match(script,/--export/);
 assert.match(script,/process\.exitCode=1/);
 const prepare=read('../scripts/prepare-sherpa-local.mjs');
 const regexLine=prepare.split('\n').find(line=>line.includes('runtimeFiles=names.filter'));
 assert.ok(regexLine);
 assert.ok(regexLine.includes(String.raw`/\\.(?:m?js)$/` )===false,
  'Double-escaped .js regex causes manifest.json to remain missing and must be rejected');
 assert.ok(regexLine.includes(String.raw`/\.(?:m?js)$/`),
  'Correct regex must match .js npm distribution files');
});

test('100–150ms English short answers are detected with 1024-frame 16kHz chunks',()=>{
 assert.equal(SHERPA_AUDIO_WORKLET_FRAMES,1024);
 assert.ok(SHERPA_MIN_VOICED_MS<=128);
 let state={voicedMs:0,detected:false};
 const voice=new Float32Array(1024).fill(.07);
 state=advanceShortVoice(state,voice,16000);
 assert.equal(state.detected,false,'One 64ms pop must not register as an utterance');
 state=advanceShortVoice(state,voice,16000);
 assert.equal(state.detected,true,'A 128ms word must trigger recognition');
 const silent=new Float32Array(1024);
 state=advanceShortVoice(state,silent,16000);
 assert.equal(state.detected,true,'A pause must not erase speech already detected');
});
test('Short speech detector resists a single impulse and quiet microphone noise',()=>{
 let state={voicedMs:0,detected:false};
 const pop=new Float32Array(1024);
 pop[0]=.8;
 state=advanceShortVoice(state,pop,16000);
 assert.equal(state.detected,false);
 for(let i=0;i<20;i++)state=advanceShortVoice(state,new Float32Array(1024).fill(.002),16000);
 assert.equal(state.detected,false);
 assert.equal(state.voicedMs,0);
});
test('Short-word capture uses small AudioWorklet chunks and no false transcript acceptance',()=>{
 const worklet=read('../public/speech/ventra-speech-processor.js');
 const capture=read('../src/lib/speech/localSherpa.ts');
 const ui=read('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(worklet,/Float32Array\(1024\)/);
 assert.doesNotMatch(worklet,/Float32Array\(4096\)/);
 assert.match(capture,/advanceShortVoice\(voiceState,chunk,rate\)/);
 assert.match(capture,/voiceState\.detected/);
 assert.match(ui,/matchesExpectedSpeech\(result\.alternatives,prompt\.accept\)/);
});
