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
}
try{await main();}
catch(e){console.error('[Ventra STT] FAIL: actual WASM recognizer could not initialize/decode:',e);process.exitCode=1;}
finally{
 try{stream?.free();}catch{}
 try{recognizer?.free();}catch{}
}
