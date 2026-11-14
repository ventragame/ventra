# Ventra animation system — first production pilot

- The original WebP and 3D PNG learning imagery remains authoritative.
- `LearningMotion` is one self-hosted Lottie JSON player per interactive stage, loaded lazily, stopped when the game event clears and destroyed on unmount. All animation assets are original vectors in `public/assets/motion`.
- Hayvan Çayırı: discovery / correct answer triggers `success`; completed mission triggers `victory`.
- Hikâye Ormanı: correct-answer feedback and final story celebration use the same shared player.
- The premium 3D rabbit now has phase-aware CSS choreography; **this is not Rive**. True face/eye/mouth/body rigging requires authoring and shipping a licensed, production-ready .riv character asset with a compatible runtime. Do not create placeholder .riv files or brand CSS movement as Rive.
- No change to scoring, voice, data persistence, student level decisions or answer identity.
- Every animation is decorative (`aria-hidden`, `pointer-events:none`); screen-reader text feedback stays unchanged. Reduced-motion mode falls back to a static star. No third-party CDN calls.

## Next gated task: full Rive character

1. Produce an original character rig with identifiable rabbit look aligned with existing premium art.
2. Export a real .riv file; verify its behavior state machine and commercial license.
3. Introduce the Rive runtime behind a per-character flag with static WebP fallback.
4. Profile Android WebView and iOS WebView for load time, FPS, main-thread cost and battery.
5. Keep Rive only if it passes visual coherence and mobile performance tests.

## Local validation

```bash
npm ci
npm --workspace=apps/web run type-check
npm --workspace=apps/web test
npm run build:web
```
