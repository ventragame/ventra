/// <reference lib="webworker" />
/**
 * Local English transcription on a dedicated Web Worker.
 * k2-fsa/sherpa-onnx via @sherpaw/asr, int8 English Zipformer (20M).
 * No speech samples, transcripts or personal identifiers leave the browser.
 */
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
 | {type:'progress';file:string;index:number;total:number}
 | {type:'partial';id:number;text:string}
 | {type:'result';id:number;text:string}
 | {type:'error';id?:number;reason:string};

const worker=self as unknown as {
 postMessage:(message:SherpaWorkerEvent)=>void;
 onmessage:((event:MessageEvent<Message>)=>void)|null;
 close:()=>void;
};
const MODEL_ROOT='/speech/sherpa-20m/';
const MODEL_VERSION='sherpa-onnx-zipformer-en-20m-int8-d42f2d9';
const models=['encoder.onnx','decoder.onnx','joiner.onnx','tokens.txt'] as const;
let recognizer:any=null,stream:any=null;
let running=0,previous='',segments:string[]=[];
let loading:Promise<void>|null=null;
const post=(event:SherpaWorkerEvent)=>worker.postMessage(event);
const fail=(reason:string,id?:number)=>post({type:'error',id,reason});

function disposeStream(){
 if(stream){try{stream.free();}catch{}stream=null;}
 previous='';segments=[];running=0;
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
 for(let i=0;i<models.length;i++){
  const name=models[i];
  const entry=entries.find(f=>f.name===name)!;
  post({type:'progress',file:name,index:i+1,total:models.length});
  const modelResponse=await fetch(MODEL_ROOT+name,{cache:'force-cache'});
  if(!modelResponse.ok)throw new Error('model-download');
  const buffer=await modelResponse.arrayBuffer();
  if(buffer.byteLength!==entry.bytes)throw new Error('model-integrity');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));
  const actual=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
  if(actual!==entry.sha256)throw new Error('model-integrity');
  module.FS_createDataFile('/' ,name,new Uint8Array(buffer),true,true,true);
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
   stream.acceptWaveform(16000,message.samples);
   drain(message.id);
  }catch{fail('decode-failed',message.id);disposeStream();}
  return;
 }
 if(message.type==='finish'){
  try{
   stream.acceptWaveform(16000,new Float32Array(16000));
   stream.inputFinished();
   const text=drain(message.id).slice(0,180);
   post({type:'result',id:message.id,text});
  }catch{fail('decode-failed',message.id);}
  finally{disposeStream();}
 }
};
