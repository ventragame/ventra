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
const modelDir=resolve(base,'speech/sherpa-20m');
const runtimeDir=resolve(base,'speech/sherpa-runtime');
const expectedNames=['encoder.onnx','decoder.onnx','joiner.onnx','tokens.txt'];
const expectedVersion='sherpa-onnx-zipformer-en-20m-int8-d42f2d9';
const wasmGitBlob='5388e425a5c6fbd8a92dad2b2ea2eaa50b895100';
const wasmSize=13_788_938;
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
 for(const name of expectedNames){
  const entry=manifest.files.find(item=>item.name===name);
  ensure(entry&&typeof entry.bytes==='number'&&typeof entry.sha256==='string',
   'invalid manifest entry: '+name);
  const bytes=await readFile(resolve(modelDir,name));
  ensure(bytes.length===entry.bytes&&digest(bytes)===entry.sha256,
   'model checksum mismatch: '+name);
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
 console.log('[Ventra STT] VERIFIED: 4 English model files + index.js + ESM runtime + 13.8MB WASM in '+base);
}
await main().catch(error=>{
 console.error('[Ventra STT] Local voice recognition is NOT ready:',error.message);
 process.exitCode=1;
});
