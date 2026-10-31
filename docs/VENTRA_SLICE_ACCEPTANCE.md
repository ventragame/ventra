# Ventra P2 + Renk Korusu — Acceptance

## Durum
- Bu commit kaynak kodu günceller; otomatik Vercel dağıtımı kapalıdır.
- Gerçek iki cihazlı senkronizasyon ve cihaz üzerinde Android/iOS QA henüz tamamlanmadı.
- Kullanıcı Supabase SQL migration'ını SQL Editor ile uyguladığını bildirdi.
- Cloud metadata kolonlarını kullanmak için yerelde apps/web/.env.local içinde NEXT_PUBLIC_VENTRA_CLOUD_METADATA_V2=true etkinleştirilmelidir.

## Zorunlu testler
1. npm run type-check
2. npm --workspace=apps/web test
3. npm run build:web
4. npm run export:mobile
5. İki cihazla yetişkin hesabında A→B ve B→A senkronizasyonu; çocuk kimliği, yıldız, sınıf/İngilizce düzeyi.
6. Offline oyun ve tekrar kayıt; çift yıldız oluşmaması; farklı yetişkin hesaplarının izolasyonu.
7. Renk Korusu'nda doğru cevap feedback'i, bilinçli devam, replay ve sessiz mod.

Not: Gerçek Supabase veri bütünlüğü testleri ve native cihaz QA yapılmadan P2 tamamlandı sayılmaz.

## Color Grove visual slice (2026-11-01)

- Three scenes: discovery (tap and hear colors), recognition (match flower color to English word), recall/painting (read or hear English, select a colored brush, see forest change).
- Responsive self-contained SVG scene, no remote assets or additional runtime dependencies; reduced-motion handling, minimum touch targets, semantic controls, muted TTS and sound synchronization.
- Mission plan tied to child+CEFR+stage+replay instance, never stale across stage changes or async loads. Invalid plans and failed saves offer retry without deleting profile data.
- Replay introduces previously unseen discovery colors and extra spaced weak-word questions, retains best stars and per-word evidence, idempotent completion keys.
- **Still to verify locally:** type-check, complete tests, Next production build, mobile export and real-device Android/iOS touch, audio and memory behavior. Visual polish is not educational efficacy validation.

## 2026-11-01: CI verified results

- GitHub Actions: https://github.com/ventragame/ventra/actions/runs/41247022202 (all jobs success)
- Verified source commit: `0ac11c0ba6fa648f7005105ae969e4c2bce37e8b`
- TypeScript: PASS
- Offline learning/progress/privacy/RLS regression suite: **41 PASS / 0 FAIL**
- Next.js production build: PASS
- Static web export for Capacitor: PASS
- Android Capacitor sync + native Gradle `assembleDebug`: PASS (debug build only)
- iOS Capacitor sync + CocoaPods + unsigned Xcode Simulator build: PASS (Simulator only)
- Live Supabase credentials/integration are excluded from public GitHub CI. Run local full `npm --workspace=apps/web test` with configured local environment.
- Neither native build was uploaded to a store nor deployed to production.
- Manual acceptance pending: browser runtime mission 1→2→3→replay; cold restart; sound/mute; offline operation; real-device Android/iOS layout and TTS; actual two-device cloud reconciliation; child usability observation.

## 2026-11-01 — Three-stage final hardening and acceptance

The code contains the following (not a claim that physical-device QA passed):

- **Discovery:** six individually labeled colors, visual progress and optional speech, all six required before progressing.
- **English matching:** visible colored flower, three English answer options, immediate retry after a mistake without an extra dismissal tap, optional Turkish color-label hint for color-vision accessibility.
- **Painting:** six distinct trees change color on the six base correct answers; optional two extra spaced review questions add visual lights. Progress advances only after explicit correct answer confirmation and successful persistence.
- **Pedagogy:** weak words are guaranteed to appear on replays and are repeated non-adjacently; two subsequent independent first-try successes remove the weak-word flag. Previously earned stars remain best-level awards, not a repeatable balance. Opening/closing a hint records it as assisted recall, not independent mastery.
- **Mobile:** large touch targets, viewport safe areas, focus returns to activity heading on mission transitions, scrolling resets, mute reacts to global state, visible content works when TTS is unsupported, reduced-motion hover/animation fallback.
- **Tests:** unit tests cover 150 randomized plans, weak-word recovery, all six painted trees, profile separation, duplicate sessions and full three-stage save/replay integration.
- **Manual before accepting release:** first profile and returning profile, all stages, wrong answer and hints, mute persistence on refresh, replay stars, browser refresh, 320px mobile width, Android WebView TTS and scrolling, iOS WebView TTS and scrolling, airplane mode followed by reopening. Live two-device Supabase sync stays a P2 acceptance item.

A passing CI build is a build-quality gate, not evidence that all child-facing mobile interactions are flawless.
