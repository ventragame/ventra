#!/usr/bin/env node
/** Research-only QA. This does NOT change the model deployed to children.
 * Compare a stronger Apache-2.0 Zipformer transducer against the existing
 * 20M model using three prerecorded English WAVs shipped with the product.
 * All model weights are SHA-256 pinned; do not log or send user audio.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'../public/speech');
const manifest='https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26/resolve/6037ea0/';
const specs=[
 {key:'encoder.onnx',origin:'encoder-epoch-99-avg-1-chunk-16-left-128.int8.onnx',
  bytes:71083163,sha:'563fde436d16cf7607cf408cd6b30909819d03162652ef389c2450ced3f45ac1'},
 {key:'decoder.onnx',origin:'decoder-epoch-99-avg-1-chunk-16-left-128.int8.onnx',
  bytes:1307236,sha:'98da299f471e38bb4e1a8df579b8cc9122d6039576a77e357b3c60f17dd83b02'},
 {key:'joiner.onnx',origin:'joiner-epoch-99-avg-1-chunk-16-left-128.int8.onnx',
  bytes:259335,sha:'d944208d660d67c8d72cd2acaeac971fa5ceb8c80e76c1968148846fedd6e297'},
 {key:'tokens.txt',origin:'tokens.txt',
  bytes:5048,sha:'49e3c2646595fd907228b3c6787069658f67b17377c60aeb8619c4551b2316fb'}
];
function readWav(buffer){
 if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')
  throw Error('Invalid English fixture RIFF header');
 let meta=null,frames=null;
 for(let p=12;p+8<=buffer.length;){
  const type=buffer.toString('ascii',p,p+4),len=buffer.readUInt32LE(p+4),start=p+8;
  if(start+len>buffer.length)throw Error('Damaged wave chunk');
  if(type==='fmt '){
   meta={format:buffer.readUInt16LE(start),channels:buffer.readUInt16LE(start+2),
    rate:buffer.readUInt32LE(start+4),bits:buffer.readUInt16LE(start+14)};
  }
  if(type==='data')frames=buffer.subarray(start,start+len);
  p=start+len+(len%2);
 }
 if(!meta||!frames||meta.bits!==16||meta.format!==1)
  throw Error('Expected 16-bit signed PCM fixture');
 const {channels,rate}=meta;
 const count=Math.floor(frames.length/2/channels);
 const src=new Float32Array(count);
 for(let i=0;i<count;i++){
  let sample=0;for(let ch=0;ch<channels;ch++)sample+=frames.readInt16LE((i*channels+ch)*2)/32768;
  src[i]=sample/channels;
 }
 const output=new Float32Array(Math.floor(src.length*16000/rate));
 for(let i=0;i<output.length;i++){
  const x=i*rate/16000,j=Math.floor(x),k=Math.min(j+1,src.length-1);
  output[i]=src[j]+(src[k]-src[j])*(x-j);
 }
 return output;
}
function decode(recognizer,samples){
 const stream=recognizer.createStream();
 if(!stream?.handle)throw Error('Strong model stream not created');
 let segments=[],steps=0;
 try{
  const drain=()=>{
   while(recognizer.isReady(stream)){
    recognizer.decode(stream);
    if(++steps>4000)throw Error('Decoder stalled');
   }
   if(recognizer.isEndpoint(stream)){
    const text=String(recognizer.getResult(stream)?.text??'').trim();
    if(text)segments.push(text);
    recognizer.reset(stream);
   }
  };
  for(let i=0;i<samples.length;i+=1600){
   stream.acceptWaveform(16000,samples.subarray(i,Math.min(i+1600,samples.length)));
   drain();
  }
  stream.acceptWaveform(16000,new Float32Array(16000));
  stream.inputFinished();
  drain();
  const tail=String(recognizer.getResult(stream)?.text??'').trim();
  return [...segments,tail].filter(Boolean).join(' ').replace(/\\s+/g,' ').trim().toLowerCase();
 }finally{stream.free();}
}
async function run(){
 const runtime=resolve(root,'sherpa-runtime');
 const {default:init}=await import(pathToFileURL(resolve(runtime,'asr-prebuilt.js')).href);
 const bytes=new Uint8Array(await readFile(resolve(runtime,'asr.wasm')));
 const module=await init({wasmBinary:bytes,locateFile:()=>resolve(runtime,'asr.wasm')});
 for(const spec of specs){
  const response=await fetch(manifest+spec.origin,{signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error(spec.origin+' HTTP '+response.status);
  const buffer=new Uint8Array(await response.arrayBuffer());
  if(buffer.byteLength!==spec.bytes||
   createHash('sha256').update(buffer).digest('hex')!==spec.sha)
    throw Error('Model hash/size mismatch '+spec.origin+' '+buffer.byteLength);
  module.FS_createDataFile('/',spec.key,buffer,true,true,true);
  console.log('[Ventra STT] Strong model verified '+spec.key+' '+buffer.byteLength+' bytes');
 }
 const {createOnlineRecognizer}=await import(pathToFileURL(resolve(runtime,'index.js')).href);
 const recognizer=createOnlineRecognizer(module,{
  type:0,featConfig:{sampleRate:16000,featureDim:80},
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
 if(!recognizer?.handle)throw Error('Stronger model failed to initialize');
 const tasks=[
  ['great_job.wav','great job'],
  ['listen_carefully.wav','listen carefully'],
  ['find_the_cat.wav','find the cat']
 ];
 let exact=0,wordHits=0,totalWords=0;
 try{
  for(const [filename,expected] of tasks){
   const wave=await readFile(resolve(import.meta.dirname,'../public/audio/en/directives',filename));
   const start=performance.now();
   const words=decode(recognizer,readWav(wave));
   const duration=Math.round(performance.now()-start);
   if(words===expected)exact++;
   for(const token of expected.split(' ')){
    totalWords++;if(words.split(' ').includes(token))wordHits++;
   }
   console.log('[Ventra STT] STRONG comparison',filename,JSON.stringify({
    expected,recognized:words,decodeMs:duration,exact:words===expected
   }));
  }
 }finally{recognizer.free();}
 console.log('[Ventra STT] STRONG summary',JSON.stringify({
  exact,fixtures:tasks.length,wordRecall:wordHits+'/'+totalWords,
  prior20m:['y job','ly','t']
 }));
}
await run().catch(error=>{console.error('[Ventra STT] STRONG comparison failed:',error);process.exitCode=1});
