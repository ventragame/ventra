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
