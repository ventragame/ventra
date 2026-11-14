#!/usr/bin/env node
/**
 * Download ONLY the four int8 English model files used by Ventra.
 *
 * The upstream Sherpa-ONNX demo bundles a ~191MB multilingual dataset; shipping
 * it to young learners would be unjustifiable. This script instead pins an
 * Apache-2.0 English 20M Zipformer model to a specific Hugging Face revision
 * and installs only its int8 encoder/joiner, fp32 decoder and token vocabulary.
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

const root = resolve(import.meta.dirname, '../public/speech/sherpa-20m');
const runtimeRoot = resolve(import.meta.dirname,'../public/speech/sherpa-runtime');
const require = createRequire(import.meta.url);
// The npm 0.3.0 archive omitted asr.wasm even though package exports it.
// Pin the binary to the upstream release commit instead of silently using a
// moving main branch or an unauthenticated external CDN at runtime.
const wasmRevision='2b12da09ab0cf45894e9565c386bf003cf44a106';
const wasmBlobSha='5388e425a5c6fbd8a92dad2b2ea2eaa50b895100';
const wasmSize=13_788_938;
function validWasm(bytes){
 return bytes.byteLength===wasmSize&&
  createHash('sha1').update('blob '+bytes.byteLength).update(Uint8Array.of(0)).update(bytes).digest('hex')===wasmBlobSha;
}
async function prepareWasm(source){
 const wasmOutput=resolve(runtimeRoot,'asr.wasm');
 for(const candidate of [resolve(source,'asr.wasm'),wasmOutput]){
  try{
   const bytes=await readFile(candidate);
   if(validWasm(bytes)){if(candidate!==wasmOutput)await writeFile(wasmOutput,bytes);return;}
  }catch{}
 }
 const url='https://raw.githubusercontent.com/moeru-ai/sherpaw/'+wasmRevision+
  '/packages/asr/src/prebuilt/asr.wasm';
 const response=await fetch(url,{signal:AbortSignal.timeout(90_000)});
 if(!response.ok)throw Error('Sherpa WASM download HTTP '+response.status);
 const declared=Number(response.headers.get('content-length')||'0');
 if(declared&&declared!==wasmSize)throw Error('Sherpa WASM download size mismatch');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!validWasm(bytes))throw Error('Sherpa WASM Git blob checksum mismatch');
 await writeFile(wasmOutput+'.download',bytes);
 await rm(wasmOutput,{force:true});
 await rename(wasmOutput+'.download',wasmOutput);
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
 await prepareWasm(source);
 // Serving ESM and WASM from one origin avoids Webpack's bare asr.wasm
 // resolution and keeps model inference entirely on the learner's device.
 console.log('[Ventra STT] Local sherpa ESM/WASM runtime ready ('+runtimeFiles.length+' JS files).');
}

const base = 'https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/resolve/d42f2d9';
const files = [
 { name: 'encoder.onnx', source: 'encoder-epoch-99-avg-1.int8.onnx', min: 38e6, max: 48e6 },
 { name: 'decoder.onnx', source: 'decoder-epoch-99-avg-1.onnx', min: 1.8e6, max: 2.5e6 },
 { name: 'joiner.onnx', source: 'joiner-epoch-99-avg-1.int8.onnx', min: 200e3, max: 400e3 },
 { name: 'tokens.txt', source: 'tokens.txt', min: 3000, max: 10000 },
];
const manifestName = 'manifest.json';
const stamp = 'sherpa-onnx-zipformer-en-20m-int8-d42f2d9';
const timeoutMs = 90_000;
function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

async function checkExisting() {
 try {
  const data = JSON.parse(await readFile(resolve(root, manifestName), 'utf8'));
  if (data.version !== stamp || !Array.isArray(data.files)) return false;
  for (const spec of files) {
   const item = data.files.find(file => file.name === spec.name);
   if (!item || item.bytes < spec.min || item.bytes > spec.max) return false;
   const file = await readFile(resolve(root, spec.name));
   if (file.length !== item.bytes || sha(file) !== item.sha256) return false;
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
  if (declared && (declared < spec.min || declared > spec.max))
   throw new Error('Unexpected response size for ' + spec.name + ': ' + declared);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
  const bytes = await readFile(partial);
  if (bytes.byteLength < spec.min || bytes.byteLength > spec.max)
   throw new Error('Unexpected downloaded size for ' + spec.name + ': ' + bytes.byteLength);
  const item = {name:spec.name,bytes:bytes.length,sha256:sha(bytes)};
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
  console.log('[Ventra STT] English offline model verified (cached).');
  return;
 }
 await mkdir(root, {recursive:true});
 await rm(resolve(root, manifestName), {force:true});
 console.log('[Ventra STT] Preparing English-only sherpa-onnx INT8 model (~46 MB).');
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
   engine: 'sherpa-onnx-zipformer-20m',
   language: 'en',
   sampleRate: 16000,
   license: 'Apache-2.0',
   source: 'csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17@d42f2d9',
   files: records
  };
  await writeFile(resolve(root, manifestName), JSON.stringify(manifest, null, 2) + '\n');
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
