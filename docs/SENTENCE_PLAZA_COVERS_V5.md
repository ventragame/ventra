# Cümle Meydanı — V5 Mission Cover Art + Responsive Layout

## User-reported defects
- 6 wide cards had blurry, over-cropped and inconsistent-looking chapter pictures.
- V3 mission covers were extremely tiny files (13–18 KB) and scaled poorly.
- At phone widths, two narrow columns impaired artwork legibility.

## Solution
- Six matching 3D storybook-style chapter images shipped as **real local WebP files** in `apps/web/public/assets/sentence-plaza/v5/mission-{1..6}.webp`.
- Each asset is 1120 × 390, roughly 70–105 KB. The six covers are individually identifiable; no separate CDN dependency.
- Artwork sourced from the six scenic cover regions of an original concept composition, then processed and encoded as individual WebP files. These are higher-quality *encoded outputs*, **not** six newly rendered independent full-resolution scenes; upsampling does not create native detail.
- Mission order: 1 color crystals, 2 new friends + dog, 3 magical hidden gate, 4 movement leap, 5 market fruit stalls, 6 night lanterns.
- The source composition contains decorative preview corner badges. These are completely covered by large opaque, live-state UI badges. The source image must never be used without those UI overlays.
- Desktop 3 columns, tablet 2 columns, phones 1 column. Image aspect ratio is preserved; chapter titles and saved states remain separate native UI.
- Completed / available / locked semantics, keyboard focus, minimum touch target, reduced-motion and screen-reader labels are preserved.
- No changes to lesson/play scenes, English question selection, model speech, scoring, saved progress or membership locks.

## Verification
- TypeScript and learning/regression suite; dedicated V5 test checks six RIFF/WebP assets (distinct, real, bounded sizes), CSS breakpoints, live dynamic-state rendering and retention of game flow.
- Production web/mobile and Android/iOS CI as applicable.
- Human visual inspection on real desktop and phone still required; compilations are not proof of visual polish.

No production deployment in this change.
