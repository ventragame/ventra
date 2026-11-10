#!/usr/bin/env node
/**
 * Verify that a reachable public URL actually serves Ventra's Next.js app.
 * No Vercel credentials, application data or production deployment required.
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const EXPECTED_TITLE = 'Ventra — Macera Evreni';
const PATHS = ['/', '/kids'];

export function validateBaseUrl(rawUrl) {
  if (!rawUrl) throw new Error('Site URL is required (for example https://your-project.vercel.app).');
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('Invalid site URL. Include https://.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Provide a bare HTTPS origin, such as https://your-project.vercel.app (no path or query).');
  }
  return url;
}

export async function checkPublicUrl(rawUrl, fetchImpl = globalThis.fetch) {
  const origin = validateBaseUrl(rawUrl);
  const checked = [];
  for (const path of PATHS) {
    const target = new URL(path, origin);
    let response;
    try {
      response = await fetchImpl(target, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': 'ventra-public-smoke/1.0' },
      });
    } catch (error) {
      throw new Error(`${path}: network/TLS/DNS request failed: ${error.message}`);
    }
    if (!response.ok) {
      throw new Error(`${path}: HTTP ${response.status}. Confirm a deployment exists and deployment protection allows this URL.`);
    }
    const servedUrl = new URL(response.url || target);
    if (servedUrl.origin !== origin.origin) {
      throw new Error(`${path}: redirected to another origin (${servedUrl.origin}). Check deployment protection and domain mapping.`);
    }
    if (!(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      throw new Error(`${path}: expected HTML, got ${response.headers.get('content-type') || 'unknown content type'}.`);
    }
    const html = await response.text();
    if (!html.includes(EXPECTED_TITLE)) {
      throw new Error(`${path}: HTTP 200, but this is NOT the expected Ventra learning app (missing title "${EXPECTED_TITLE}"). Check Vercel project and domain mapping.`);
    }
    checked.push(`${path}: HTTP ${response.status}, Ventra identity verified`);
  }
  return checked;
}

async function main() {
  try {
    const lines = await checkPublicUrl(process.argv[2]);
    console.log(`Ventra public URL check PASSED:\n${lines.join('\n')}`);
  } catch (error) {
    console.error(`Ventra public URL check FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
