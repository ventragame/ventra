/// <reference lib="webworker" />
/**
 * Local English transcription on a dedicated Web Worker.
 * k2-fsa/sherpa-onnx via @sherpaw/asr, int8 English Zipformer (20M).
 * No speech samples, transcripts or personal identifiers leave the browser.
 */
import {createOnlineRecognizer,initASRModule} from '@sherpaw/asr';

type Message =
 | {type:'init'}
 | {type:'start';id:number}
 | {type:'audio';id:number;samples:Float32Array;sampleRate:number}
 | {type:'finish';id:number}
 | {type:'cancel';id:number}
 | {type:'shutdown'};
type Event =
 | {type:'ready'}
 | {type:'progress';file:string;index:number;total:number}
 | {type:'partial';id:number;text:string}
 | {type:'result';id:number;text:string}
 | {type:'error';id?:number;reason:string};

const worker=self as unknown as {
 postMessage:(message:Event)=>void;
 onmessage:((event:MessageEvent<Message>)=>void)|null;
 close:()=>void;
};
const MODEL_ROOT='/speech/sherpa-20m/';
const MODEL_VERSION='sherpa-onnx-zipformer-en-20m-int8-d42f2d9';
const models=['encoder.onnx','decoder.onnx','joiner.onnx','tokens.txt'] as const;
let recognizer:any=null,stream:any=null;
let running=0,previous='',segments:string[]=[];
let loading:Promise<void>|null=null;
const post=(event:Event)=>worker.postMessage(event);
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
 const module:any=await initASRModule();
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
  void ensureReady().then(()=>post({type:'ready'}),()=>fail('model-initialize'));return;
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
