# Hayvan Çayırı — Visual-first learning game v2

## Scope
- Phaser's *second* navigable map is removed from the Animal Meadow learning
  activity on desktop and phone. The outer Word Garden exploration map stays.
- All five stages use **one accessible React/CSS visual stage**. Tapping a real
  foreground animal image directly triggers the same progress engine.
- The environment reuses the existing premium Word Garden animal WebP as a
  deliberately defocused **background**. Answers use the catalog's forty local
  animal SVG illustrations. Baked background animals are not treated as answers.
- Stage 1: discover an animal, hear its English name, reveal its word. Completing
  the discovery set saves automatically.
- Stage 2: inspect a large animal and choose its English written name.
- Stage 3: listen to native/browser English speech and choose the animal
  picture. If speech is unavailable, the explicit written-assistance mode
  does not count as unaided recall.
- Stage 4: act on a short age/level-aware English instruction, no movement map.
- Stage 5: "Help the cow!" — **one correct animal selection** initiates a
  short rescue-to-home animation, then automatically advances. The old
  intermediate Turkish "find the home" question no longer exists.

## Learning semantics
Stage 5 now records `command` evidence, **not** `habitat`. No child
is assessed for habitat knowledge merely for selecting the named animal.
Existing `habitat` historical records are not rewritten or deleted.
Adaptive targeting and grade-aware question counts are retained.

## Accessibility and QA
- Real <button> elements, keyboard focus, minimum touch areas, audio replay,
  semantic choices, visible written assistance for speech engine failures and
  reduced-motion support.
- Test all five activities, progress save/reload, double taps, early exits,
  switching stages, muted/offline and missing English TTS engine.
- Test desktop, 320px/390px portrait and tablet, both Android APK and iPhone.
- Final art direction still calls for a consistent newly commissioned
  **40-animal** sprite set; the current forty SVGs are not magically
  upgraded to studio 3D models by this UI overhaul.

No production deploy or database migration is included.
