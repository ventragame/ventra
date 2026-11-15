#!/usr/bin/env node
/**
 * Actually initialize pinned Emscripten WASM + the four model files, create a
 * Sherpa online recognizer, and decode a single silent PCM fixture.
 *
 * This test runs in CI after asset verification. Static HTTP 200 and
 * TypeScript alone cannot establish that the native/WASM ABI works.
 * The synthetic silence is NOT a recognition accuracy test.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Deterministic RIFF PCM/float parser for our local English speech fixtures. */
function readWavMono(bytes){
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')
  throw Error('English speech fixture is not RIFF WAVE');
 let fmt=null,data=null;
 for(let at=12;at+8<=bytes.length;){
  const tag=bytes.toString('ascii',at,at+4),length=bytes.readUInt32LE(at+4),offset=at+8;
  if(offset+length>bytes.length)throw Error('Invalid WAV chunk length');
  if(tag==='fmt '){
   fmt={codec:bytes.readUInt16LE(offset),channels:bytes.readUInt16LE(offset+2),
    rate:bytes.readUInt32LE(offset+4),bits:bytes.readUInt16LE(offset+14)};
  }
  if(tag==='data')data=bytes.subarray(offset,offset+length);
  at=offset+length+(length%2);
 }
 if(!fmt||!data||fmt.channels<1||fmt.rate<8000||fmt.rate>192000)
  throw Error('Invalid English WAV fixture metadata');
 const bytesPerSample=fmt.bits/8,stride=fmt.channels*bytesPerSample;
 if(!Number.isInteger(stride)||stride<1||data.length<stride)throw Error('Invalid WAV stride');
 const samples=new Float32Array(Math.floor(data.length/stride));
 for(let i=0;i<samples.length;i++){
  let sum=0;
  for(let ch=0;ch<fmt.channels;ch++){
   const at=i*stride+ch*bytesPerSample;
   const n=fmt.codec===1&&fmt.bits===16?data.readInt16LE(at)/32768:
     fmt.codec===1&&fmt.bits===24?data.readIntLE(at,3)/8388608:
     fmt.codec===1&&fmt.bits===32?data.readInt32LE(at)/2147483648:
     fmt.codec===3&&fmt.bits===32?data.readFloatLE(at):NaN;
   if(!Number.isFinite(n))throw Error('Unsupported PCM WAV encoding '+fmt.codec+'/'+fmt.bits);
   sum+=n;
  }
  samples[i]=sum/fmt.channels;
 }
 return{samples,rate:fmt.rate};
}
function linearResample(input,sourceRate,targetRate){
 const count=Math.floor(input.length*targetRate/sourceRate);
 const output=new Float32Array(count);
 for(let i=0;i<count;i++){
  const at=i*sourceRate/targetRate,lo=Math.floor(at),hi=Math.min(input.length-1,lo+1);
  output[i]=(input[lo]??0)+(input[hi]-input[lo])*(at-lo);
 }
 return output;
}

const root=resolve(import.meta.dirname,'../public/speech');
const runtime=resolve(root,'sherpa-runtime');
const model=resolve(root,'sherpa-20m');
let recognizer=null,stream=null;
async function main(){
 const {default:initialize}=await import(pathToFileURL(resolve(runtime,'asr-prebuilt.js')).href);
 const bytes=new Uint8Array(await readFile(resolve(runtime,'asr.wasm')));
 const module=await initialize({wasmBinary:bytes,locateFile:()=>resolve(runtime,'asr.wasm')});
 if(typeof module.FS_createDataFile!=='function')throw Error('Emscripten filesystem missing');
 for(const file of ['encoder.onnx','decoder.onnx','joiner.onnx','tokens.txt']){
  const content=new Uint8Array(await readFile(resolve(model,file)));
  module.FS_createDataFile('/',file,content,true,true,true);
 }
 const {createOnlineRecognizer}=await import(pathToFileURL(resolve(runtime,'index.js')).href);
 if(typeof createOnlineRecognizer!=='function')throw Error('Sherpa JS decoder API missing');
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
 if(!recognizer?.handle)throw Error('Sherpa online model initialization returned no handle');
 stream=recognizer.createStream();
 if(!stream?.handle)throw Error('Sherpa streaming recognizer returned no handle');
 stream.acceptWaveform(16000,new Float32Array(16000));
 let steps=0;
 while(recognizer.isReady(stream)){
  recognizer.decode(stream);
  if(++steps>300)throw Error('Decoder stuck on silent audio');
 }
 stream.inputFinished();
 while(recognizer.isReady(stream)){
  recognizer.decode(stream);
  if(++steps>500)throw Error('Decoder stuck at end of audio');
 }
 const transcript=recognizer.getResult(stream)?.text;
 if(typeof transcript!=='string')throw Error('Sherpa result format invalid');
 console.log('[Ventra STT] PASS: pinned WASM initialized, English model loaded, silent PCM decoded, result readable.');

 // A silent buffer is NOT an accuracy test. Exercise real prerecorded English
 // waveforms already shipped with Ventra, using the same 16kHz streaming ABI
 // as the interactive microphone. These are product TTS fixtures, not child
 // recordings and are never uploaded. Record what the MODEL actually says.
 for(const [name,expected] of [
  ['great_job.wav','great job'],
  ['listen_carefully.wav','listen carefully'],
  ['find_the_cat.wav','find the cat']
 ]){
  const wav=await readFile(resolve(import.meta.dirname,'../public/audio/en/directives',name));
  const audio=readWavMono(wav);
  const pcm=linearResample(audio.samples,audio.rate,16000);
  const trial=recognizer.createStream();
  if(!trial?.handle)throw Error('WAV fixture recognizer stream invalid: '+name);
  try{
   let spins=0;
   const collected=[];
   const decode=()=>{
    while(recognizer.isReady(trial)){
     recognizer.decode(trial);
     if(++spins>3000)throw Error('WAV decode stalled: '+name);
    }
    if(recognizer.isEndpoint(trial)){
     const part=String(recognizer.getResult(trial)?.text??'').trim();
     if(part)collected.push(part);
     recognizer.reset(trial);
    }
   };
   for(let pos=0;pos<pcm.length;pos+=1600){
    trial.acceptWaveform(16000,pcm.subarray(pos,Math.min(pcm.length,pos+1600)));
    decode();
   }
   trial.acceptWaveform(16000,new Float32Array(16000));
   trial.inputFinished();
   decode();
   const current=String(recognizer.getResult(trial)?.text??'').trim();
   const recognized=[...collected,current].filter(Boolean).join(' ').trim();
   const cleaned=recognized.toLowerCase().replace(/[^a-z ]/g,' ').replace(/\\s+/g,' ').trim();
   console.log('[Ventra STT] Speech fixture',name,'expect:',expected,'actual:',JSON.stringify(cleaned));
   if(!cleaned)throw Error('Model produced NO WORDS for actual English speech: '+name);
  }finally{trial.free();}
 }
 console.log('[Ventra STT] PASS: local model decoded real prerecorded English speech fixtures.');
}
try{await main();}
catch(e){console.error('[Ventra STT] FAIL: actual WASM recognizer could not initialize/decode:',e);process.exitCode=1;}
finally{
 try{stream?.free();}catch{}
 try{recognizer?.free();}catch{}
}
