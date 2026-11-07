# Cümle Meydanı — V6 Mission Scenes & Semantic Interactions

## What changed
The repeated clock-tower/plaza bitmap was removed from `SentencePlazaScene`. Six playable mission-specific paintings are now shipped in `public/assets/sentence-plaza/scenes-v6`:

1. **Renklerin Uyanışı** — three color crystal / paint stations and balloons.
2. **Yeni Dostlar** — warm meadow with child and animal friends.
3. **Gizli Yerler** — garden home, big tree, fountain and bench. Location options have touch-friendly visual hotspots that call the existing `selectScene` evaluator.
4. **Hareket Büyüsü** — motion playground; overlays retain tree, pond, bridge and tower as explicitly labeled selectable destinations and keep SVG creatures + animations.
5. **İstekler Meydanı** — warm market and children; existing guest, basket, eight selectable food items and completion celebrations stay interactive.
6. **Fener Festivali** — atmospheric lantern town; existing place markers, chosen-color lantern, progressive reward lights and animals remain dynamic.

Assets are offline RIFF/WebP 1280×680, approximately 140–175 KB each. **Visual provenance:** six separate responsive paintings were extracted from one original 2×3 scene atlas and expanded with soft peripheral fill to fit the 1280×680 stage; 1280×680 is output dimensions, not native six-image generation resolution. No bitmap has user progress, interactive controls, correct-answer markers or localizable text.

## Interaction contract
- Child answers, grade/placement policy, evidence, scoring, voice and progress persistence remain in the previous engines.
- The `SentencePlazaScene` stage has accessible hotspot controls only when location-choice mode is active. These call `selectScene(choice.id)`, the same validator as the explicit answer choices.
- Do not show an actor's new location or color as a successful outcome before the answer is checked. `awaken` exclusively gates new effects.
- Descriptive labels and color choices stay native DOM controls; WebP assets are scenery, not answer storage.
- The specialized movement, wish and lantern stages retain their respective independent response and accessibility logic. Location markers remain explicit even where the illustrated background is atmospheric rather than literal geography.

## Technical / validation
- `SentencePlazaScene.tsx`: chapter artwork map, dynamic actor/house/flower/balloon/lantern effects and location hotspots.
- `sentence-plaza-scenes-v6.css`: picture sizing, mobile 740/400px, focus styles, 44px touch hotspots and reduced-motion.
- Specialized SVG stages: static old artwork replaced with WebP base while their dynamic UI/effects remain.
- `sentence_plaza.test.mjs`: six genuine distinct WebP assets, matching stage refs, interaction invariants, responsive CSS, and unchanged progress/auto-advance behavior.
- CI: TypeScript, learning/regression tests, production web and mobile builds, Android/iOS bundle workflows.
- Real device and child-usability acceptance is still required: image quality, text legibility, click accuracy, semantic location comprehension.

No production deployment or data migration performed.
