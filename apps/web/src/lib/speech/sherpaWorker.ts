/// <reference lib="webworker" />
/**
 * Local English transcription on a dedicated Web Worker.
 * k2-fsa/sherpa-onnx via @sherpaw/asr, int8 English Zipformer (20M).
 * No speech samples, transcripts or personal identifiers leave the browser.
 */
import {readExactly} from './modelDownload.ts';
// The bundled initASRModule() computes its own WASM URL. In the real
// Windows/Next.js worker it resolved to an HTML fallback (<!DOCTYPE ...) and
// WebAssembly.instantiate failed. Load the *known* same-origin asset first,
// check that it is actual WASM, then inject the bytes into the pinned
// Emscripten loader. No compiled bundle can silently redirect this fetch.
async function loadRuntime():Promise<{
 module:any;createOnlineRecognizer:(module:any,options:any)=>any
}>{
 const root=new URL('/speech/sherpa-runtime/',self.location.origin);
 const wasmUrl=new URL('asr.wasm',root).href;
 const res=await fetch(wasmUrl,{cache:'force-cache'});
 if(!res.ok)throw new Error('wasm-http-'+res.status);
 const bytes=new Uint8Array(await res.arrayBuffer());
 if(bytes.byteLength!==13_788_938)throw new Error('wasm-invalid-size');
 if(bytes[0]!==0||bytes[1]!==97||bytes[2]!==115||bytes[3]!==109)
  throw new Error('wasm-html-or-invalid');
 // Dynamically import the exact source Emscripten loader that was pinned
 // and verified at build time. It accepts wasmBinary and never guesses a URL.
 const sourceUrl=new URL('asr-prebuilt.js',root).href;
 const sourceModule=await import(/* webpackIgnore: true */ sourceUrl);
 const createModule=sourceModule.default;
 if(typeof createModule!=='function')throw new Error('wasm-loader-invalid');
 const module=await createModule({
  wasmBinary:bytes,
  locateFile:()=>wasmUrl
 });
 if(!module?.FS_createDataFile)throw new Error('wasm-init-invalid');
 const indexUrl=new URL('index.js',root).href;
 const runtime=await import(/* webpackIgnore: true */ indexUrl);
 if(typeof runtime.createOnlineRecognizer!=='function')
  throw new Error('wasm-api-invalid');
 return {module,createOnlineRecognizer:runtime.createOnlineRecognizer};
}

type Message =
 | {type:'init'}
 | {type:'start';id:number}
 | {type:'audio';id:number;samples:Float32Array;sampleRate:number}
 | {type:'finish';id:number}
 | {type:'cancel';id:number}
 | {type:'shutdown'};
type SherpaWorkerEvent =
 | {type:'ready'}
 | {type:'progress';file:string;index:number;total:number;loaded:number;bytes:number}
 | {type:'partial';id:number;text:string}
 | {type:'result';id:number;text:string}
 | {type:'error';id?:number;reason:string};

const worker=self as unknown as {
 postMessage:(message:SherpaWorkerEvent)=>void;
 onmessage:((event:MessageEvent<Message>)=>void)|null;
 close:()=>void;
};
const MODEL_ROOT='/speech/sherpa-english-2023-06-26/';
const MODEL_VERSION='sherpa-onnx-zipformer-en-2023-06-26-int8-6037ea0';
const models=['encoder.onnx','decoder.onnx','joiner.onnx','tokens.txt'] as const;
let recognizer:any=null,stream:any=null;
let running=0,previous='',segments:string[]=[];
let pcmChunks:Float32Array[]=[];
let pcmFrames=0;
const MAX_REPLAY_FRAMES=16000*12; // < 768 KiB, only within active attempt

let loading:Promise<void>|null=null;
const post=(event:SherpaWorkerEvent)=>worker.postMessage(event);
const fail=(reason:string,id?:number)=>post({type:'error',id,reason});

function disposeStream(){
 if(stream){try{stream.free();}catch{}stream=null;}
 previous='';segments=[];running=0;
 pcmChunks=[];pcmFrames=0;
}
function drain(id:number){
 if(!stream||!recognizer)return '';
 let count=0;
 while(recognizer.isReady(stream)){
  recognizer.decode(stream);
  if(++count>500)throw new Error('decoder-stall');
 }
 const text=String(recognizer.getResult(stream)?.text??'').trim();
 const combined=[...segments,text].filter(Boolean).join(' ').trim();
 if(recognizer.isEndpoint(stream)){
  if(text)segments.push(text);
  recognizer.reset(stream);
 }
 if(combined!==previous){
  previous=combined;
  post({type:'partial',id,text:combined.slice(0,180)});
 }
 return combined;
}
/** Rerun short/garbled output against the COMPLETE captured waveform.
 * Sherpa's live endpoint detector can finalize a tiny English interjection
 * as one letter. A fresh, bounded streaming pass with inputFinished avoids
 * accepting the first truncated partial as the child's actual answer.
 * Does NOT use answer-choice bias, phonetic guessing, or a cloud service.
 */
function replayFinalUtterance():string{
 if(!recognizer||pcmFrames<16000/4)return '';
 const trial=recognizer.createStream();
 if(!trial?.handle)return '';
 try{
  const pcm=new Float32Array(pcmFrames);
  let offset=0,power=0;
  for(const chunk of pcmChunks){pcm.set(chunk,offset);offset+=chunk.length;}
  for(let i=0;i<pcm.length;i++)power+=pcm[i]*pcm[i];
  const rms=Math.sqrt(power/Math.max(1,pcm.length));
  // Very quiet microphones need a conservative gain. Do not fabricate text
  // from digital silence or amplify ambient hiss without bounds.
  if(rms>0.0018&&rms<0.045){
   const gain=Math.min(3.5,0.075/rms);
   for(let i=0;i<pcm.length;i++)pcm[i]=Math.max(-1,Math.min(1,pcm[i]*gain));
  }
  let spins=0;
  for(let pos=0;pos<pcm.length;pos+=3200){
   trial.acceptWaveform(16000,pcm.subarray(pos,Math.min(pos+3200,pcm.length)));
   while(recognizer.isReady(trial)){
    recognizer.decode(trial);
    if(++spins>2500)throw new Error('replay-stall');
   }
  }
  trial.acceptWaveform(16000,new Float32Array(16000));
  trial.inputFinished();
  while(recognizer.isReady(trial)){
   recognizer.decode(trial);
   if(++spins>3000)throw new Error('replay-stall');
  }
  return String(recognizer.getResult(trial)?.text??'').trim().slice(0,180);
 }finally{try{trial.free();}catch{}}
}
function selectClearTranscript(first:string,replayed:string):string{
 const a=first.trim(),b=replayed.trim();
 // A single character ("Y", "H") is never evidence that "Hello" was
 // pronounced. If the second pass cannot recover a word, report uncertainty.
 const wordLike=(s:string)=>/[a-z]{2,}/i.test(s);
 if(!wordLike(a))return wordLike(b)?b:'';
 if(wordLike(b)&&b.length>a.length+2)return b;
 return a;
}

async function loadModel(){
 const response=await fetch(MODEL_ROOT+'manifest.json',{cache:'force-cache'});
 if(!response.ok)throw new Error('model-missing');
 const manifest:unknown=await response.json();
 if(!manifest||typeof manifest!=='object'||!('version' in manifest)||
    manifest.version!==MODEL_VERSION||!('files' in manifest)||
    !Array.isArray(manifest.files))throw new Error('model-invalid');
 const entries=manifest.files as Array<{name:string;sha256:string;bytes:number}>;
 if(models.some(name=>!entries.some(x=>x.name===name)))
  throw new Error('model-incomplete');
 // WASM is downloaded once. No application-level audio upload occurs.
 const {module,createOnlineRecognizer}=await loadRuntime();
 // Byte progress across all files: the encoder alone is ~98% of the download,
 // so a per-file counter would sit at "1/4" for almost the whole wait.
 const totalBytes=models.reduce((sum,name)=>sum+entries.find(f=>f.name===name)!.bytes,0);
 let doneBytes=0;
 for(let i=0;i<models.length;i++){
  const name=models[i];
  const entry=entries.find(f=>f.name===name)!;
  const progress=(loaded:number)=>post({type:'progress',file:name,index:i+1,total:models.length,loaded,bytes:totalBytes});
  progress(doneBytes);
  const modelResponse=await fetch(MODEL_ROOT+name,{cache:'force-cache'});
  if(!modelResponse.ok)throw new Error('model-download');
  const bytes=await readExactly(modelResponse,entry.bytes,received=>progress(doneBytes+received));
  doneBytes+=bytes.byteLength;
  progress(doneBytes);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const actual=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
  if(actual!==entry.sha256)throw new Error('model-integrity');
  module.FS_createDataFile('/' ,name,bytes,true,true,true);
 }
 recognizer=createOnlineRecognizer(module,{
  type:0,
  featConfig:{sampleRate:16000,featureDim:80},
  modelConfig:{
   transducer:{encoder:'encoder.onnx',decoder:'decoder.onnx',joiner:'joiner.onnx'},
   tokens:'tokens.txt',numThreads:1,provider:'cpu',debug:0,
   modelType:'',modelingUnit:'cjkchar',bpeVocab:''
  },
  decodingMethod:'greedy_search',maxActivePaths:4,enableEndpoint:1,
  rule1MinTrailingSilence:2.4,rule2MinTrailingSilence:1.2,
  rule3MinUtteranceLength:20,hotwordsFile:'',hotwordsScore:1.5,
  ctcFstDecoderConfig:{graph:'',maxActive:3000},ruleFsts:'',ruleFars:''
 });
 if(!recognizer?.handle)throw new Error('model-initialize');
}
function ensureReady(){
 loading??=loadModel();
 return loading;
}
worker.onmessage=(event)=>{
 const message=event.data;
 if(message.type==='shutdown'){
  disposeStream();
  if(recognizer){try{recognizer.free();}catch{}}
  worker.close();return;
 }
 if(message.type==='init'){
  void ensureReady().then(()=>post({type:'ready'}),error=>{
   // Only a bounded diagnostic code: never log or transmit a child's voice.
   const code=error instanceof Error?error.message:'model-initialize';
   console.error('[Ventra STT] Local engine initialization failed:',code);
   fail(/^wasm-(?:http-\d{3}|invalid-size|html-or-invalid|loader-invalid|init-invalid|api-invalid)$/.test(code)
    ?code
    :/^model-(?:missing|invalid|incomplete|integrity|download|initialize)$/.test(code)
    ?code:'model-initialize');
  });return;
 }
 if(message.type==='cancel'){
  if(running===message.id)disposeStream();
  return;
 }
 if(message.type==='start'){
  if(!recognizer){fail('model-not-ready',message.id);return;}
  disposeStream();
  running=message.id;
  try{
   stream=recognizer.createStream();
   if(!stream?.handle)throw Error('stream-create');
  }catch{disposeStream();fail('stream-create',message.id);}
  return;
 }
 if(message.id!==running||!stream)return;
 if(message.type==='audio'){
  try{
   if(message.samples.length===0)return;
   // sherpa consumes float PCM. Keep the configured 16k rate invariant;
   // the device pipeline resamples before sending worker messages.
   if(message.sampleRate!==16000){fail('sample-rate',message.id);disposeStream();return;}
   if(pcmFrames<MAX_REPLAY_FRAMES){
    const clip=message.samples.subarray(0,MAX_REPLAY_FRAMES-pcmFrames);
    pcmChunks.push(clip);pcmFrames+=clip.length;
   }
   stream.acceptWaveform(16000,message.samples);
   drain(message.id);
  }catch{fail('decode-failed',message.id);disposeStream();}
  return;
 }
 if(message.type==='finish'){
  try{
   stream.acceptWaveform(16000,new Float32Array(16000));
   stream.inputFinished();
   const first=drain(message.id).slice(0,180);
   let retry='';
   // Only pay for the second pass when an output is empty or suspiciously
   // short. If the replay itself errors, retain the original result.
   if(!/[a-z]{2,}/i.test(first)){
    try{retry=replayFinalUtterance();}catch{}
   }
   const text=selectClearTranscript(first,retry);
   post({type:'result',id:message.id,text});
  }catch{fail('decode-failed',message.id);}
  finally{disposeStream();}
 }
};
