# Hayvan Çayırı — Mobile-first premium gameplay acceptance (2026-11-03)

## Objective and scope
Turn the **actual Kelime Bahçesi → Hayvan Çayırı** five-stage game into a touch-first, playable child-friendly mobile experience, without inventing a second learning database, changing the saved game IDs, or downgrading desktop functionality. The first reference implementation for future mobile-first conversions.

### What changed
- **Mobile-only native-feeling world** in `apps/web/src/components/learning/activities/MobileMeadowWorld.tsx`: scenic full-width portrait meadow, layered CSS landscape, eight-position animal discovery, large touch-native illustrated animal buttons, correct/incorrect/discovered visual statuses, and visually different habitat locations for the two-step rescue phase.
- Uses existing **`word_garden_mobile.webp`** for small-screen background, with the existing 40 individually drawn premium animal SVGs. Vector assets remain crisp at Retina/Android screen densities, while backdrop remains bandwidth-efficient and available offline in the bundled static web assets. No pointless large PNG downloads.
- **Desktop keeps Phaser** `ExplorerCanvas`; mobile width 767px or below mounts the lightweight, directly clickable HTML game world instead of pretending that a miniature joystick is a native app experience. The mobile scenes call the exact existing `onWorldInteract` and `choose`/ `chooseHabitat`/ `discover` callbacks, so no parallel scoring or fake quiz.
- Compact sticky top HUD with back, child grade and English placement, saved stars, album and sound; five pictogram stages; collapsed Pufi guidance and optional album/accessibility alternatives.
- **Primary short prompt placed before the scene** with one large replay-audio and optional hint control; visually prominent scene and bottom answer choices. The verbose explanatory panel underneath the scene has been removed.
- Stages 2/3 have one primary set of large mobile word/image answers. Stages 4/5 use touchable scene animals/habitats as primary choices, with accessible equivalent answer controls inside an optional disclosure. Stage 1 discovery maintains a fixed visual scene layout; collected animals remain visible with checkmarks.
- Existing safe-area insets, one-hand portrait navigation, narrow phones (320–360px), landscape, focus indicators and `prefers-reduced-motion` rules.
- English instruction is read and spoken consistently from `animalCommandFor` by true Pre-A1/A1/A2 placement, with short A2 sentence for younger grades. Grade-aware learning policy still independently controls vocabulary ceilings, discovery count, question count and choice count.
- Existing `useAutoQuestionAdvance` ensures progress only after successful response; **no change** to `onSave`, `AnimalAnswerEvidence`, replay idempotence, existing stars, offline syncing or parent/school profiles.
- No production deployment, database changes, app-store upload or new permissions.

## Playability and learning rules
1. **Keşfet**: Find 6 or 8 illustrated animals, tap each to hear its English name (device audio capability/mute permitting). Taps preserve discovery events and do not create duplicate mastery records. Album remembers all discovered species.
2. **Eşleştir**: See a clear large illustrated animal in the scene and select its English word; optional Turkish clue marks assisted evidence.
3. **Dinle**: Hear English pronunciation and select the correct illustrated animal, with optional written fallback (supported, not independent recall). Sound-off or unsupported TTS must not create a dead-end.
4. **Uygula**: Understand a grade/placement-suitable English instruction and touch the corresponding creature in the meadow, not the tiny joystick.
5. **Mini Macera**: First find the animal, then select its true habitat represented by a touch target; the first correct response alone never finishes the rescue.

All missions use the original adaptive target planner and stored profile-specific history; more English vocabulary is not unlocked merely by school grade. Do **not** treat these word-recognition games as proof of spontaneous A2 production or CEFR accreditation.

## Automated QA
- [ ] TS typecheck, web tests, Next.js production static build
- [ ] Regression tests of 5 missions, original 40 animal word assets and history/stars
- [ ] Grade × placement command checks; mobile scene reacts to real ID and mode
- [ ] Android web package, APK build and iOS simulator CI where supported

## Physical device acceptance — not automatically proved by compilation
- [ ] Phone browser 320, 360, 390 and 430 CSS px, portrait: no overlapping top bar, no horizontal scrolling, task before scene, scene tap targets >=44px, answers visible without excessive scrolling
- [ ] Android Capacitor WebView APK: Google sign-in/profile, app safe areas, audio TTS, offline handling, background/return, touch gesture accuracy; 5-stage completion, saved stars and replay
- [ ] iOS Capacitor WKWebView on actual iPhone: safe areas/notch, audio after gesture, Mute, VoiceOver, home indicator, Safari/WebView differences and full 5-stage play
- [ ] Tablet and desktop: Phaser area still usable, sound/joystick and keyboard accessibility preserved
- [ ] Each 1–8 class grade and Pre-A1/A1/A2: learning tier and prompt changes
- [ ] Low-end device frame rate and asset loading; browser reduced-motion; portrait <620px tall
- [ ] Two child profiles on same device + offline/cloud restore regression

## Release gate
The CSS/React implementation, static web CI and test suite do **not** replace device acceptance. Only promote this layout to other Ventra islands after product-owner Android + iOS review. Keep production deployment off until explicitly authorized.

## GitHub Actions test APK delivery
After a successful `Ventra Kids Slice QA` workflow run, open its **Artifacts** section and download `ventra-android-debug-apk` (ZIP containing `app-debug.apk`). This is a debug build for internal physical-device acceptance, not a production-signed Play Store release. Release AAB validation is a separate step. The CI iOS job builds an **unsigned simulator application**, not a distributable IPA for iPhone. Real iOS-device installation requires an Apple signing/provisioning workflow and a Mac or suitable distribution service.
