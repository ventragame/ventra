# Aile Köyü V4 — Storybook visual system

## Design decision
The approved mockup is a direction, **not a bitmap exported as the whole application**. Text, 4-district navigation, 5-stage navigation, star counts, progress, question prompts, help, audio controls, answers and result surfaces remain live React DOM elements, accessible to keyboard and screen readers.

The earlier low-detail house SVG was a poor visual focal point. The **family** district hero now uses the existing locally bundled art:
- `/assets/word-garden/premium-v2/family.webp` (desktop ~180 KB)
- `/assets/word-garden/premium-v2/family_mobile.webp` (mobile ~53 KB)
These assets already belonged to this repository; no new external CDN, copyright-unclear download, or image-generation subscription is required. They show a cheerful flower-filled village; they are **decorative storytelling**, not answer clues. Rooms, Objects and Daily Routines retain their **distinct** local scenes until equivalent approved art for those districts is available.

## Visual primitives introduced
`family-village-showcase-v4.css` is deliberately layered after the existing V3 stylesheet, so gameplay code and other worlds are not accidentally restyled.
- `fv4-heading`: wooden village sign in scenic masthead, responsive typography
- District cards: midnight blue and softly glowing selected pink/parchment card, disabled state and lock
- Stage navigation: five tactile quest cards, active gold parchment, preserved stage unlocks
- Scene: local responsive `<picture>` art behind live context/mission badges, no baked-in UI
- Gameplay panel: violet fantasy surface, readable high-contrast headings and progress
- Question: cream parchment prompt, independent real question artwork, three interactive answers
- Correct/incorrect, discovery, audio fallback, save retries and rewards remain the same behavior
- 900/680/359px, safe areas, landscape and reduced-motion overrides

## Acceptance gates
- [ ] TypeScript + node tests + production web build pass in GitHub Actions
- [ ] Static mobile web export, Android and iOS build pass
- [ ] Desktop 1280/1440px: real text and images aligned, no overlapping buttons
- [ ] Mobile 320/360/390/430px + landscape: no cut-off or horizontal scroll
- [ ] Four districts: distinct scene/lock states, previous child progress preserved
- [ ] Stages 1–5: correct prompt, grade-restricted answer pool, voice/fallback, auto next, completion, repeat play
- [ ] Visually inspect source WebP in Chrome, mobile Chromium WebView and Safari; fallback scenery for other districts
- [ ] Parent/teacher profile and isolated child save/reload

## Reuse in other games
Visual tokens and patterns can be generalized into an optional shared `StorybookWorldShell` **after** family-world testing. Do not apply this stylesheet globally. Shared shell should own header, district nav, mission bar, cinematic hero, progress, panel and breakpoints. Domain-specific engines still own questions, speech, evidence, hints and rewards.

**Scope:** UI and art selection only. Does not imply studio-recorded voices, real-time 3D rendering, educational outcome validation, Play Store readiness or a production deployment.
