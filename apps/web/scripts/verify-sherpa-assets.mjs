#!/usr/bin/env node
/**
 * Fail-fast release gate for the English-only Sherpa on-device recognizer.
 * A Next.js build may succeed without public/ model files unless verified:
 * that shipped a working UI with a broken microphone in Nov 2026.
 *
 * Usage from apps/web: node scripts/verify-sherpa-assets.mjs [--export]
 */
import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const webRoot=resolve(import.meta.dirname,'..');
const base=process.argv.includes('--export')?resolve(webRoot,'out'):resolve(webRoot,'public');
const modelDir=resolve(base,'speech/sherpa-english-2023-06-26');
const runtimeDir=resolve(base,'speech/sherpa-runtime');
const expectedFiles=[{"name":"encoder.onnx","bytes":71083163,"sha256":"563fde436d16cf7607cf408cd6b30909819d03162652ef389c2450ced3f45ac1"},{"name":"decoder.onnx","bytes":1307236,"sha256":"98da299f471e38bb4e1a8df579b8cc9122d6039576a77e357b3c60f17dd83b02"},{"name":"joiner.onnx","bytes":259335,"sha256":"d944208d660d67c8d72cd2acaeac971fa5ceb8c80e76c1968148846fedd6e297"},{"name":"tokens.txt","bytes":5048,"sha256":"49e3c2646595fd907228b3c6787069658f67b17377c60aeb8619c4551b2316fb"}];
const expectedVersion='sherpa-onnx-zipformer-en-2023-06-26-int8-6037ea0';
const wasmGitBlob='5388e425a5c6fbd8a92dad2b2ea2eaa50b895100';
const wasmSize=13_788_938;
const loaderSize=80_364;
const loaderBlob='5c1ce958b1117b2d78c1eec0c20e59ae4033600d';
function digest(bytes){return createHash('sha256').update(bytes).digest('hex');}
function gitBlobDigest(bytes){
 return createHash('sha1')
  .update('blob '+bytes.byteLength).update(Uint8Array.of(0)).update(bytes).digest('hex');
}
function ensure(value,message){
 if(!value)throw new Error('[Ventra STT] ASSET VERIFICATION FAILED: '+message);
}
async function main(){
 const raw=await readFile(resolve(modelDir,'manifest.json'),'utf8');
 const manifest=JSON.parse(raw);
 ensure(manifest.version===expectedVersion,'wrong or missing English model version');
 ensure(Array.isArray(manifest.files)&&manifest.files.length===4,'expected four model files');
 for(const spec of expectedFiles){
  const entry=manifest.files.find(item=>item.name===spec.name);
  ensure(entry&&entry.bytes===spec.bytes&&entry.sha256===spec.sha256,
   'missing or incorrect pinned manifest entry: '+spec.name);
  const bytes=await readFile(resolve(modelDir,spec.name));
  ensure(bytes.length===spec.bytes&&digest(bytes)===spec.sha256,
   'model checksum mismatch: '+spec.name);
 }
 const runtimeFiles=await readdir(runtimeDir);
 ensure(runtimeFiles.includes('index.js'),'missing sherpa-runtime/index.js');
 // The pinned @sherpaw/asr distribution uses an asr-* ESM chunk.
 ensure(runtimeFiles.some(name=>/^asr-.*\.js$/.test(name)),
  'missing sherpa runtime JavaScript ESM chunk');
 const wasm=await readFile(resolve(runtimeDir,'asr.wasm'));
 ensure(wasm.length===wasmSize,'incorrect sherpa runtime wasm size');
 ensure(wasm.subarray(0,4).equals(Buffer.from([0,97,115,109])),
  'invalid wasm file header');
 ensure(gitBlobDigest(wasm)===wasmGitBlob,'WASM Git object hash mismatch');
 const loader=await readFile(resolve(runtimeDir,'asr-prebuilt.js'));
 ensure(loader.length===loaderSize,'invalid pinned Emscripten loader size');
 ensure(gitBlobDigest(loader)===loaderBlob,'pinned Emscripten loader checksum mismatch');
 ensure(loader.toString('utf8').includes('export default Module'),
  'pinned Emscripten loader has no expected default export');
 console.log('[Ventra STT] VERIFIED: 4 English model files + index.js + ESM runtime + pinned Emscripten loader + 13.8MB WASM in '+base);
}
await main().catch(error=>{
 console.error('[Ventra STT] Local voice recognition is NOT ready:',error.message);
 process.exitCode=1;
});
