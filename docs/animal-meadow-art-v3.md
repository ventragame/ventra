# Animal Meadow visual assets & layout v3

## What changed
- All 40 catalog entries now point to one **consistent Microsoft Fluent Emoji
  3D** illustration family, each with a 256x256 RGBA PNG committed locally
  in public/assets/animals/fluent-3d. No runtime CDN requests.
- MIT copyright and source attribution live beside the artwork in LICENSE.txt.
  The fork reorganizes original Microsoft Fluent Emoji assets by Unicode.
- We deliberately do **not** claim these are bespoke studio character models:
  some pictures show animal heads and others whole creatures. Individual
  3D sculpted / animated models would require a separately funded art pass.
- 🐿️ uses the Unicode chipmunk design for the English squirrel entry; this
  should be reviewed for strict zoological accuracy before species testing.

## Render contract
- All five tasks use the same MeadowPlayStage on desktop and mobile.
- An independently authored meadow-stage-v3.svg backdrop is decorative,
  contains no clickable animals or baked text and is displayed without blur.
- Images are isolated inside fixed-size, clipped am3-portrait slots. All
  images must use object-fit:contain and never escape card borders.
- Three choices per quiz; discovery 4 per row or 3 on narrow screens.
- Correct/incorrect animation and sound cues remain, and reduced-motion
  users see static feedback. Choices must remain full semantic buttons.
- Listening tasks never reveal the English target until explicitly asking
  for written assistance (which already counts as assisted).
- Rescue remains a single English comprehension step, not an animal habitat
  assessment. Existing saved telemetry is not rewritten.

## QA before publishing
1. Test cow, horse, butterfly, elephant, giraffe, turtle, snake, whale and
   all other animals at desktop 1440x900 and 1024x768, plus 390x844,
   360x740 and 320x568 portrait.
2. No animal must overflow its translucent card, disappear under the footer,
   be partially cropped, or appear to float outside its click target.
3. Test 8-animal discovery, image/word matching, sound and writing fallback,
   English command, single-touch rescue animation and all transitions.
4. Repeat with airplane mode, muted sound, screen reader, tab focus, and
   system prefers-reduced-motion.
5. Check Android APK and iPhone separately; CI cannot replace actual
   perceptual UI review.

## Known constraint
The source Fluent 3D icons are bitmap illustrations, not animation atlases.
We use short CSS feedback motions only; do not assert that animals have
individual skeletal animation. This increment changes neither production
deployment nor database schema.
