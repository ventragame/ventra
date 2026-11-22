import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readExactly} from '../src/lib/speech/modelDownload.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const streamed=chunks=>new Response(new ReadableStream({
 start(controller){for(const chunk of chunks)controller.enqueue(new Uint8Array(chunk));controller.close();}
}));

test('Model files stream into an exact-size buffer and report received bytes',async()=>{
 const reports=[];
 const bytes=await readExactly(streamed([[1,2,3],[4,5],[6]]),6,received=>reports.push(received));
 assert.deepEqual([...bytes],[1,2,3,4,5,6]);
 assert.equal(bytes.buffer.byteLength,6,'no oversized copy is kept');
 assert.ok(reports.length>=1&&reports.every(n=>n>0&&n<=6));
});

test('A longer or shorter model file is still an integrity error',async()=>{
 await assert.rejects(readExactly(streamed([[1,2,3],[4,5,6,7]]),6,()=>{}),/model-integrity/);
 await assert.rejects(readExactly(streamed([[1,2]]),6,()=>{}),/model-integrity/);
 await assert.rejects(readExactly(new Response(new Uint8Array([1,2,3])),2,()=>{}),/model-integrity/);
});

test('The worker keeps the SHA-256 check and reports byte progress across all model files',()=>{
 const worker=src('lib/speech/sherpaWorker.ts');
 assert.match(worker,/import \{readExactly\} from '\.\/modelDownload\.ts';/);
 assert.match(worker,/const totalBytes=models\.reduce/);
 assert.match(worker,/post\(\{type:'progress',file:name,index:i\+1,total:models\.length,loaded,bytes:totalBytes\}\)/);
 assert.match(worker,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(worker,/if\(actual!==entry\.sha256\)throw new Error\('model-integrity'\);/);
 const pool=src('lib/speech/localSherpa.ts');
 assert.match(pool,/report\(0\.95\*message\.loaded\/message\.bytes\)/,'download fills 95%, building the recognizer the rest');
 assert.match(pool,/report\(1\);resolve\(\);/);
 assert.match(pool,/done=true;controller\.abort\(\);stopAudio\(\);unsubscribeProgress\(\);/,'listeners never outlive an attempt');
 assert.match(src('lib/speech/childSpeech.ts'),/beginLocalSherpaRecognition\(ms,onStatus,onModelProgress\)/);
});

test('Academy never calls a model download "listening" and the child can always stop waiting',()=>{
 const ui=src('components/learning/academy/AcademyAdventure.tsx');
 assert.doesNotMatch(ui,/setMessage\('Dinliyorum…'\)/);
 assert.match(ui,/setMicPhase\('preparing'\);setModelProgress\(null\);/);
 assert.match(ui,/status=>\{if\(epoch===audioEpoch\.current\)setMicPhase\(academyMicPhase\(status\)\);\}/);
 assert.match(ui,/return status==='microphone-ready'\?'listening':status==='speech-detected'\?'heard':/);
 assert.match(ui,/<button type="button" className="academy-mic-stop" onClick=\{cancelListening\}>Dur ✕<\/button>/);
 assert.match(ui,/stop\(\);setMicPhase\('idle'\);setModelProgress\(null\);setBusy\(false\);/,'cancel releases the task');
 assert.match(ui,/<progress className="academy-model-progress" max=\{100\}/);
 assert.match(ui,/<span role="status" aria-live="polite">/,'only the phase is announced, not every percent');
 const css=fs.readFileSync(new URL('../src/components/learning/academy/academy-adventure.css',import.meta.url),'utf8');
 assert.match(css,/\.academy-mic-stop\{min-width:44px;min-height:44px;/);
 const harbor=src('components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(harbor,/fraction=>\{if\(run===generation\.current\)setModelProgress\(fraction<1\?fraction:null\);\}/);
 assert.match(harbor,/aria-label="Konuşma modeli indirme ilerlemesi"/);
});
