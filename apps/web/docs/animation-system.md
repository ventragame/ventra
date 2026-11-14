# Ventra animation system — self-hosted, no paid animation services

- The original WebP and 3D PNG learning imagery remains authoritative.
- `LearningMotion` is one self-hosted Lottie JSON player per interactive stage, loaded only when triggered, paused when the page is hidden, stopped when the game event clears and destroyed on unmount. All animation assets are original vectors in `public/assets/motion`.
- Hayvan Çayırı: discovery / correct answer triggers `success`; completed mission triggers `victory`.
- Hikâye Ormanı · Hikâyeyi Keşfet: correct-answer feedback and final story celebration use the shared player.
- Hikâye Ormanı · Sonra Ne Oldu?: the validated chronological picture slot plays `success`, a comprehension check plays `discovery`, and a **successfully saved** episode plays `victory`. The child-facing answer-card illustrations remain static; only the story playback / reward scene opts into character motion.
- Hikâye Ormanı · Hikâye Dedektifi: each accepted clue plays `success`, recovered finale plays `discovery`, and **persisted** reward plays `victory`. Premium characters express listen/search/cheer via subtle CSS transform choreography; quiz option cards do not move.
- Renk Korusu: completing a mission triggers the original, self-hosted `victory` animation.
- Sayı Vadisi: correct answers trigger `success`; completed missions trigger `victory`.
- Keşif Tapınağı: correct answers trigger `success`; completing a chamber task triggers `victory`.
- Aile Köyü: first-time word discovery has gentle `discovery` motion, correct answers have `success`, and saved missions have `victory`.
- Lezzet Pazarı: discovery, correct answers and saved milestones use the same three event-specific effects.
- Cümle Meydanı: newly completed English sentences trigger `discovery` as the scene awakens; saved missions trigger `victory`.
- Diyalog Limanı: `victory` is shown only after the completed speaking/choice episode is successfully persisted.
- These integrations reuse the existing learning screens. They do not change grade adaptation, score, persistence, voice output, or correct-answer behavior.
- The original premium 3D rabbit and staged story characters have phase-aware CSS choreography; **this is not Rive**. True face/eye/mouth/body rigging requires authoring and shipping a licensed, production-ready .riv character asset with a compatible runtime. Do not create placeholder .riv files or brand CSS movement as Rive.
- No change to scoring, voice, data persistence, student level decisions or answer identity.
- Every animation is decorative (`aria-hidden`, `pointer-events:none`); screen-reader text feedback stays unchanged. Reduced-motion mode falls back to a static star. No third-party CDN calls.

## Commercial use and licensing — no animation subscription

- The runtime is pinned to `lottie-web@5.13.0`, **MIT** licensed by Bodymovin/Airbnb; retain its license notice with distributed application dependencies. License: https://github.com/airbnb/lottie-web/blob/master/LICENSE.md
- `success.json`, `victory.json` and `discovery.json` are original vector animations authored directly for Ventra, not files downloaded from any LottieFiles catalog. Their usage does not require any third-party animation licenses.
- No LottieFiles login, SaaS subscription, cloud API key, or CDN is used for animation playback. `lottie-web` and these local files do not charge per animation play, user or download.
- This means zero additional **animation license/subscription** cost, **not** literally zero cost to host or distribute Ventra; normal application bandwidth, storage, devices and infrastructure still have costs.
- Do not introduce Rive, LottieFiles commercial editors, marketplace packs or unverified animated assets without separately reviewing license and production cost.
- The original premium rabbit remains CSS-based and needs no paid Rive runtime. Full skeleton/face animation can instead use authored SVG layers and Phaser sprite sheets if we maintain the zero-subscription requirement.

## Quality gates

- Node tests parse all three local vector JSON files, require no external animation assets, and verify the MIT package lock. They also guard story sequencing, detective rewards, reduced-motion, and identity-safe stage-only character motion.
- GitHub Actions verifies the animation JSON files are reachable from the real Next.js HTTP server and checks key animation metadata. This catches missing-file/404 failures not covered by source tests.
- Keep Lottie from loading before a real game event; respect reduced motion and hidden pages; handle animation failures without blocking controls or progress.

## Optional future task: full interactive character (no subscription)

1. Produce an original character rig with identifiable rabbit look aligned with existing premium art.
2. Prioritize native SVG layer rigs or Phaser sprite sheets, with original artwork, before evaluating any additional animation runtime.
3. Keep the static WebP fallback and add React/Phaser-triggered character states behind a per-character flag.
4. Profile Android WebView and iOS WebView for load time, FPS, main-thread cost and battery.
5. Adopt only solutions that pass visual coherence, licensing and mobile performance tests.

## Local validation

```bash
npm ci
npm --workspace=apps/web run type-check
npm --workspace=apps/web test
npm run build:web
```
