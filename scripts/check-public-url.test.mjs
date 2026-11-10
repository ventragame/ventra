import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPublicUrl, validateBaseUrl } from './check-public-url.mjs';

const site = 'https://example.vercel.app/';
const expectedHtml = '<html><head><title>Ventra — Macera Evreni</title></head><body>Kids</body></html>';
const marker = 'VENTRA_KIDS_ENGLISH_LEARNING';
const goodResponse = (url) => response(url, url.pathname === '/ventra-health.txt' ? marker : expectedHtml);
const response = (url, html = expectedHtml, status = 200, type = 'text/html') => ({
  url: url.href,
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => name === 'content-type' ? type : null },
  text: async () => html,
});

test('validates a bare HTTPS origin', () => {
  assert.equal(validateBaseUrl(site).origin, 'https://example.vercel.app');
  assert.throws(() => validateBaseUrl('http://example.vercel.app/'), /HTTPS/);
  assert.throws(() => validateBaseUrl(`${site}kids`), /bare HTTPS/);
});

test('checks root and kids routes and identifies Ventra', async () => {
  const paths = [];
  const result = await checkPublicUrl(site, async (url) => {
    paths.push(url.pathname);
    return goodResponse(url);
  });
  assert.deepEqual(paths, ['/ventra-health.txt', '/', '/kids']);
  assert.equal(result.length, 3);
});

test('rejects a different website with HTTP 200', async () => {
  await assert.rejects(checkPublicUrl(site, async (url) => url.pathname === '/ventra-health.txt' ? goodResponse(url) : response(url, '<title>Ventra Fashion Store</title>')), /NOT the expected Ventra/);
});

test('rejects Vercel deployment protection or errors', async () => {
  await assert.rejects(checkPublicUrl(site, async (url) => response(url, 'Access Denied', 403)), /HTTP 403/);
});

test('rejects redirects to a foreign origin', async () => {
  await assert.rejects(checkPublicUrl(site, async (url) => ({ ...goodResponse(url), url: 'https://other.example.com/login' })), /redirected/);
});

test('rejects a DNS/TLS request error', async () => {
  await assert.rejects(checkPublicUrl(site, async () => { throw new Error('ENOTFOUND'); }), /network\/TLS\/DNS/);
});

test('rejects a mismatched or stale static deployment marker', async () => {
  await assert.rejects(checkPublicUrl(site, async (url) => response(url, 'another application')), /marker is missing/);
});
