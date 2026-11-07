# Word Garden V6 — floating 3D illustrated worlds

## Review motivation
V5 put 6 rectangular image cards on a bare grassy map. This did not resemble the illustrated reference. V6 uses open, separate mini-worlds and small LIVE status plaques. The approved six original game card covers stay untouched.

## Assets
- `apps/web/public/assets/word-garden/modular-v6/garden-ground.webp`: original scenic background with flowers, mountains and a river, without fixed UI labels or progress.
- `modular-v6/{animals,colors,numbers,food,family,sanctuary}.webp`: six matching transparent, feathered illustrated landmarks; no hard rectangular borders.
- All visual elements are local optimized WebP. Progress text remains runtime data; it is not painted into bitmap files.

## Engine
- `ExplorerScene.ts`: 3D diorama images instead of image cards. Ground platforms, native live labels and click targets.
- `GardenNavigation.ts`: gently curved promenade with the same navigation graph used by walk animation.
- Existing gameplay/save callbacks, audio behavior, district locks and child progress remain unchanged.
- Camera overview adjusted to preserve top/bottom of worlds on desktop.

## Validation
TypeScript, Node tests, web production bundle, mobile export, Android/iOS CI. Visual inspection on real phone/tablet remains necessary. Production deployment not made.
