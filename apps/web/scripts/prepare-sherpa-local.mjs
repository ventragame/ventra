#!/usr/bin/env node
/**
 * Download ONLY the four int8 English model files used by Ventra.
 *
 * The upstream Sherpa-ONNX demo bundles a ~191MB multilingual dataset; shipping
 * it to young learners would be unjustifiable. This script instead pins an
 * Apache-2.0 English 2023-06-26 Zipformer model to a specific Hugging Face revision
 * and installs only the verified int8 transducer weights and token vocabulary.
 * This model recovered 7/7 words in the benchmark; the earlier 20M model
 * produced severely truncated English even from known clean WAV fixtures.
 *
 * This is required for a working local speech recognizer: fail the dev
 * startup or production build if any runtime/model asset cannot be prepared.
 * Do not silently fall back while telling the developer the setup passed.
 */
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile, readdir, copyFile } from 'node:fs/promises';
import {createRequire} from 'node:module';
import { resolve, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const root = resolve(import.meta.dirname, '../public/speech/sherpa-english-2023-06-26');
const runtimeRoot = resolve(import.meta.dirname,'../public/speech/sherpa-runtime');
const require = createRequire(import.meta.url);
// The npm 0.3.0 archive omitted asr.wasm even though package exports it.
// Pin the binary to the upstream release commit instead of silently using a
// moving main branch or an unauthenticated external CDN at runtime.
const wasmRevision='2b12da09ab0cf45894e9565c386bf003cf44a106';
const wasmBlobSha='5388e425a5c6fbd8a92dad2b2ea2eaa50b895100';
const wasmSize=13_788_938;
const loaderBlobSha='5c1ce958b1117b2d78c1eec0c20e59ae4033600d';
const loaderSize=80_364;
function validGitBlob(bytes,expectedSize,expectedHash){
 return bytes.byteLength===expectedSize&&
  createHash('sha1').update('blob '+bytes.byteLength).update(Uint8Array.of(0)).update(bytes).digest('hex')===expectedHash;
}
async function downloadPinnedRuntimeAsset(sourceName,outputName,size,gitHash){
 const output=resolve(runtimeRoot,outputName);
 try{
  const existing=await readFile(output);
  if(validGitBlob(existing,size,gitHash))return;
 }catch{}
 const url='https://raw.githubusercontent.com/moeru-ai/sherpaw/'+wasmRevision+
  '/packages/asr/src/prebuilt/'+sourceName;
 const response=await fetch(url,{signal:AbortSignal.timeout(90_000)});
 if(!response.ok)throw Error(sourceName+' download HTTP '+response.status);
 // Content-Length may describe the compressed transfer (gzip/br) instead
 // of the decompressed bytes returned by fetch(). The verified Git blob hash
 // is authoritative; compare actual bytes after decompression.
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!validGitBlob(bytes,size,gitHash))throw Error(sourceName+' pinned Git blob checksum mismatch');
 await writeFile(output+'.download',bytes);
 await rename(output+'.download',output);
}
async function prepareWasm(){
 await downloadPinnedRuntimeAsset('asr.wasm','asr.wasm',wasmSize,wasmBlobSha);
}
async function prepareLoader(){
 // Do not call the bundled initASRModule(): its WASM URL may be rewritten
 // by the JS bundler and resolve to an HTML 404 page. Import this exact
 // pinned Emscripten module and supply verified wasmBinary explicitly.
 await downloadPinnedRuntimeAsset('asr.js','asr-prebuilt.js',loaderSize,loaderBlobSha);
}
async function prepareRuntime(){
 const packageRoot=dirname(require.resolve('@sherpaw/asr/package.json'));
 const source=resolve(packageRoot,'dist');
 const names=await readdir(source);
 const runtimeFiles=names.filter(name=>/\.(?:m?js)$/.test(name));
 if(!runtimeFiles.includes('index.js'))
  throw Error('Sherpa ESM runtime missing from pinned npm distribution');
 await mkdir(runtimeRoot,{recursive:true});
 for(const name of runtimeFiles)await copyFile(resolve(source,name),resolve(runtimeRoot,name));
 await prepareWasm();
 await prepareLoader();
 // Serving ESM and WASM from one origin avoids Webpack's bare asr.wasm
 // resolution and keeps model inference entirely on the learner's device.
 console.log('[Ventra STT] Pinned Sherpa ESM, raw Emscripten loader and WASM verified ('+runtimeFiles.length+' JS chunks).');
}

const base = 'https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26/resolve/6037ea0/';
const files = [
 { name:'encoder.onnx',source:'encoder-epoch-99-avg-1-chunk-16-left-128.int8.onnx',bytes:71083163,sha256:'563fde436d16cf7607cf408cd6b30909819d03162652ef389c2450ced3f45ac1' },
 { name:'decoder.onnx',source:'decoder-epoch-99-avg-1-chunk-16-left-128.int8.onnx',bytes:1307236,sha256:'98da299f471e38bb4e1a8df579b8cc9122d6039576a77e357b3c60f17dd83b02' },
 { name:'joiner.onnx',source:'joiner-epoch-99-avg-1-chunk-16-left-128.int8.onnx',bytes:259335,sha256:'d944208d660d67c8d72cd2acaeac971fa5ceb8c80e76c1968148846fedd6e297' },
 { name:'tokens.txt',source:'tokens.txt',bytes:5048,sha256:'49e3c2646595fd907228b3c6787069658f67b17377c60aeb8619c4551b2316fb' }
];
const manifestName = 'manifest.json';
const stamp = 'sherpa-onnx-zipformer-en-2023-06-26-int8-6037ea0';
const timeoutMs = 120_000;
const legacyRoot=resolve(import.meta.dirname,'../public/speech/sherpa-20m');
async function cleanLegacyModel(){
 // After a successful new model verification, avoid packaging BOTH weights
 // into Android/iOS export or Next.js static builds.
 await rm(legacyRoot,{recursive:true,force:true});
}
function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

async function checkExisting() {
 try {
  const data = JSON.parse(await readFile(resolve(root, manifestName), 'utf8'));
  if (data.version !== stamp || !Array.isArray(data.files)) return false;
  for (const spec of files) {
   const item = data.files.find(file => file.name === spec.name);
   if (!item || item.bytes !== spec.bytes || item.sha256 !== spec.sha256) return false;
   const file = await readFile(resolve(root, spec.name));
   if (file.length !== spec.bytes || sha(file) !== spec.sha256) return false;
  }
  return true;
 } catch { return false; }
}
async function download(spec) {
 const output = resolve(root, spec.name);
 const partial = output + '.download';
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), timeoutMs);
 try {
  const response = await fetch(base + '/' + encodeURIComponent(spec.source), {
   redirect: 'follow', signal: controller.signal,
   headers: { 'user-agent': 'Ventra-English-local-ASR-assets/1' }
  });
  if (!response.ok || !response.body) throw new Error('HTTP ' + response.status);
  const declared = Number(response.headers.get('content-length') || '0');
  if (declared && declared !== spec.bytes)
   throw new Error('Unexpected response size for ' + spec.name + ': ' + declared);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
  const bytes = await readFile(partial);
  if(bytes.byteLength !== spec.bytes || sha(bytes)!==spec.sha256)
   throw new Error('Pinned English model size or SHA-256 mismatch for '+spec.name);
  const item={name:spec.name,bytes:spec.bytes,sha256:spec.sha256};
  await rename(partial, output);
  return item;
 } finally {
  clearTimeout(timeout);
  await rm(partial, {force:true}).catch(() => {});
 }
}
async function main() {
 if (process.env.VENTRA_SKIP_SHERPA_PREPARE === '1') {
  console.warn('[Ventra STT] WARNING: Optional local speech model preparation explicitly disabled.');
  return;
 }
 // A voice-learning product must not boot or deploy with half-installed
 // speech assets while claiming local recognition is ready.
 try {
  await prepareRuntime();
 } catch(error) {
  console.error('[Ventra STT] FAILED to prepare sherpa WASM runtime. Local recognition cannot work.');
  console.error('[Ventra STT] Confirm raw.githubusercontent.com is accessible. After git pull, run npm ci once from the project root to install @sherpaw/asr.');
  throw error;
 }
 if (await checkExisting()) {
  await cleanLegacyModel();
  console.log('[Ventra STT] English offline model verified (cached).');
  return;
 }
 await mkdir(root, {recursive:true});
 await rm(resolve(root, manifestName), {force:true});
 console.log('[Ventra STT] Preparing verified English 2023-06-26 INT8 model (~73 MB).');
 const records = [];
 try {
  // Download sequentially to cap installer memory/network and avoid partial
  // deployments. The manifest is written only after ALL files are valid.
  for (const spec of files) {
   console.log('[Ventra STT] Loading ' + spec.name + '...');
   records.push(await download(spec));
  }
  const manifest = {
   version: stamp,
   engine: 'sherpa-onnx-zipformer-english-2023-06-26',
   language: 'en',
   sampleRate: 16000,
   license: 'Apache-2.0',
   source: 'csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26@6037ea0',
   files: records
  };
  await writeFile(resolve(root, manifestName), JSON.stringify(manifest, null, 2) + '\n');
  await cleanLegacyModel();
  console.log('[Ventra STT] Local English model ready.');
 } catch (error) {
  // A missing model must never pretend to be ready; on failure Web Speech and
  // touch input remain available, including when the build has no network.
  console.error('[Ventra STT] FAILED to prepare the English model; manifest.json cannot be served:', String(error));
  await rm(resolve(root, manifestName), {force:true});
  throw error;
 }
}
await main();
