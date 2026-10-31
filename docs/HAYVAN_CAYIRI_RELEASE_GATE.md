# Ventra Kids — Hayvan Çayırı (2026-11-01) release gate

## Implemented product slice
- Twelve bespoke offline SVG character illustrations and a themed animated meadow.
- Five actual tasks: discover/tap/listen, image→English matching, audio→picture, scene-based find command, two-step animal rescue→habitat.
- Discoverable 12-character album with review/listen capability; eight starter characters plus four introduced in discovery replay.
- Question variation, nonadjacent weak-word rechecks, recovery after independent successful answers, real wrong-attempt evidence, best-stars-only rewards.
- Profile-isolated IndexedDB game events and cloud event-model compatibility; prev. four-word illustrations and WAV files preserved; TTS for new words where available.
- Accessible hit targets, status feedback, no-audio text fallback, reduced-motion and responsive viewports.
- Android target/compile API 36; Gradle/AGP upgraded for Play requirement. CI builds debug APK and unsigned release AAB, **not a signed upload artifact**.

## Release-blocking verification
- GitHub QA on the exact source SHA: TypeScript, test:ci, production web build, static export, Android debug and unsigned AAB, iOS Simulator.
- Browser gameplay on a *real* child profile: stages 1→5, stage 5's two-step rescue, errors, return/back, reload, replay, stars, profile isolation, muted audio.
- Physical Android and iPhone: small-screen hit targets, safe area, WebView sound activation; new words require either reliable English voice data or a built-in recorded pack.
- Offline cold restart and recovery, two-device sync/conflicts for family mode, children's data deletion and privacy.
- Store signing key, Play App Signing, versionCode management, reproducible signed AAB, Play prelaunch report.
- Families Policy, target audience, data safety, content rating, child-safe parent gate and privacy-policy web page.
- Official app icon, screenshots, listing and pricing via Play Console. If selling extra digital content *in-app*, Google Play Billing integration is required. A paid app download is priced by Play Console and does not by itself require a custom billing UI.

## Known commercial limitations (do not mark release ready)
- Eight new animals currently rely on device TTS instead of a verified human-recorded/offline narration pack. Four legacy WAV word samples are bundled.
- Real-child learning outcome, perceived art quality and real-device runtime have not been measured by automated tests.
- The *entire Ventra Kids catalog* currently includes planned/unavailable regions. A 12-animal + one-color-area vocabulary product is a limited paid proposition.
- No real payment processing or subscription/avatars marketplace exists and none is simulated in the child UI.
- Native app builds and unit tests cannot substitute for store policy approval and QA on physical devices.

No GitHub-to-Vercel deploy or Play/App Store publishing is authorized as part of this change.
