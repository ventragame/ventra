# Ventra public mobile-network access — November 10, 2026

Target hostname, confirmed by the product owner: **https://ventraapp.vercel.app/**.

## What was verified and what was not

- The GitHub repository is **ventragame/ventra**, with a Next.js 15 app under `apps/web`.
- Both Vercel config files, `/vercel.json` and `/apps/web/vercel.json`, keep `git.deploymentEnabled: false`. A GitHub push **does not deploy**. This setting is intentionally preserved because a production release requires owner authorization.
- Direct external HTTP checks of `https://ventraapp.vercel.app/` and `/kids` could not be completed from the assistant's execution environment. This is **not** proof that the hostname fails on all networks; DNS, HTTP status, Vercel protection and live deployed commit remain unverified.
- A user reported that the URL does not open via phone/mobile data. The actual browser message was not provided; **DNS failure, domain mapping, deployment protection, TLS failure and slow-client JavaScript load are distinct failure classes**.

## Repository-side hardening delivered

- Homepage responsive `next/image` optimization on Vercel for three originally large PNGs (about 1.45 MiB combined original images), with original SVG fallback. `OUTPUT_EXPORT`/Capacitor keeps local assets unoptimized, so static export remains possible.
- Dynamic imports for rarely used homepage modals and heavyweight Kids world feature panels. This defers code until needed; it does not fix unreachable DNS or a failed deployment.
- Minimal static `/ventra-health.txt` marker for recognizing an authorized deployment of this repository without hitting IndexedDB, Supabase or child data.
- `node scripts/check-public-url.mjs https://ventraapp.vercel.app` verifies marker, home route and `/kids`; distinguish 403/404, wrong host, HTML identity mismatch and network/TLS/DNS errors. The GitHub Actions **Ventra Public Website Smoke (manual)** workflow has the known hostname prefilled.

## Vercel-side diagnosis

1. In the correct Vercel team/project, verify the **production deployment** and that its deployed Git commit includes the recent GitHub changes. If not, request product-owner approval for an explicit deployment; do not silently enable automatic deployments.
2. Under **Settings > Domains**, verify that `ventraapp.vercel.app` is assigned to that project and to the intended production deployment.
3. Under **Settings > Deployment Protection**, confirm whether anonymous mobile browsers are allowed. Do not disable protections globally to solve a preview problem.
4. Check Vercel build and runtime logs, bandwidth/usage quotas, firewall and custom rules. A browser page reporting 401/403 is different from a DNS timeout.
5. Once an authorized deployment of this commit exists, open `https://ventraapp.vercel.app/ventra-health.txt` using **Wi-Fi** and then **cellular data**, and run the GitHub smoke workflow. Marker visibility confirms CDN/static file serving, not interactive game readiness.
6. On a real mobile device open both `/` and `/kids`. Record the exact browser error and the difference between Wi-Fi and cellular; if one network fails, inspect carrier DNS, private DNS, VPN/ad blocking, phone clock/TLS and Vercel edge security. Do not clear IndexedDB/local storage because doing so can destroy offline child progress.

## Do not conflate these outcomes

- **DNS failure**: no HTTP response; no change to Next.js source fixes it.
- **403/auth challenge**: deployment protection or Vercel firewall, not responsive design.
- **404/wrong website**: deployment or domain mismatch.
- **200 HTML but blank view / long wait**: inspect JavaScript requests, error console, chunks, memory, and network speed. Lazy loading and responsive images can help.
- **Offline use**: local IndexedDB may preserve progress, but a previously unvisited public URL still needs internet to download its web assets. No service-worker/offline support guarantee is implied.
