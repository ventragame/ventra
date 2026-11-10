# Ventra — Vercel public URL and mobile-network access

## Diagnosis (2026-11-10)

- The Ventra repository `ventragame/ventra` has **Git-triggered deployments disabled** in BOTH `/vercel.json` and `/apps/web/vercel.json` (`git.deploymentEnabled: false`). Git push builds CI artifacts but does **not** publish a website.
- `https://ventra.vercel.app` must **not** be assumed to be our URL. A public web index has shown an unrelated Ventra fashion storefront there, although that index can be stale. Vercel's actual **Project > Domains** or **Deployments > Visit** is the source of truth for URL ownership.
- Browser access via 4G/5G needs a publicly reachable Vercel deployment; the local `npm run dev:web` server is not a public deployment. This is independent of the responsive/mobile UI.

## Checklist — no production release without owner approval

1. In Vercel, identify the project connected to **`ventragame/ventra`**, not a similarly named project. If none exists, **import the GitHub repository**. Check that its framework is **Next.js** and the **Root Directory** points to `apps/web`; this is an npm-workspaces monorepo, with shared package `@ventra/shared`, so verify that workspace dependencies are installed correctly.
2. Check the Vercel build logs and **Environment Variables** for the target environment. Public Supabase settings come from `apps/web/.env.example`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy public anon key). Never commit production secrets, and never expose `service_role` keys in `NEXT_PUBLIC_*`.
3. Obtain the **actual URL** from **Project > Domains** or **Deployments > Visit**. Do not assume `ventra.vercel.app` belongs to this project. If the short name is already claimed, use the assigned Vercel URL or a separately owned custom domain. Domain ownership cannot be changed by GitHub code.
4. Check **Settings > Deployment Protection**. A preview URL may require Vercel authentication; for unauthenticated phone testing use an authorized sharable preview link, or — only with approval — a public production domain. Do not disable protection for all environments just to make a preview public.
5. Once there is an **authorized** deployment, check that `/` and `/kids` both return the **Ventra — Macera Evreni** Next.js app. Run locally:

   ```bash
   node --test scripts/check-public-url.test.mjs
   node scripts/check-public-url.mjs https://ACTUAL-ASSIGNED-HOST.vercel.app
   ```

   Or use **GitHub > Actions > Ventra Public Website Smoke (manual) > Run workflow**, entering the URL from Vercel. This workflow only checks an existing deployment; it **does not deploy or change production**.
6. On the physical device: open the validated HTTPS URL in an incognito tab **with Wi-Fi disabled**. Check both `/` and `/kids`; repeat on Wi-Fi and mobile data. If only cellular fails, capture the exact browser error and examine DNS, VPN/private DNS, TLS, regional filtering and Vercel firewall logs. If both fail, inspect deployment status/domain/protection first.

## Policy

Automatic Git deploy remains **OFF**, intentionally, until the product owner explicitly authorizes public production deployment. Do not flip `git.deploymentEnabled` in either configuration or push a deployment-triggering change as a workaround. Build success in GitHub Actions does not imply that any site is published. Child privacy, access-control and Supabase policy checks are required before exposing a public release.
