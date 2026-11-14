#!/usr/bin/env node
/**
 * Download ONLY the four int8 English model files used by Ventra.
 *
 * The upstream Sherpa-ONNX demo bundles a ~191MB multilingual dataset; shipping
 * it to young learners would be unjustifiable. This script instead pins an
 * Apache-2.0 English 20M Zipformer model to a specific Hugging Face revision
 * and installs only its int8 encoder/joiner, fp32 decoder and token vocabulary.
 *
 * This is an optional build asset: a download failure must not break the rest
 * of Ventra, and the runtime will never claim sherpa is ready without manifest.
 */
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const root = resolve(import.meta.dirname, '../public/speech/sherpa-20m');
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
  console.log('[Ventra STT] Model preparation skipped by environment.');
  return;
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
  console.warn('[Ventra STT] Model download unavailable; browser mode remains available:', String(error));
  await rm(resolve(root, manifestName), {force:true});
  if (process.env.VENTRA_REQUIRE_SHERPA_MODEL === '1') throw error;
 }
}
await main();
