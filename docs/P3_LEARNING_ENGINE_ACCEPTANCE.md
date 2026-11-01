# Ventra Kids | P3 Adaptive Learning Engine v1
**2026-11-01 — Technical delivery, user acceptance pending**

## Architecture / data contract
- Pure deterministic TypeScript engine; no LLM, extra payment provider, or new Supabase migration.
- Uses the existing per-profile, offline-saved, cloud-replayable game-session answer histories.
- Vocabulary catalog: Hayvan Çayırı (12 animals) and Renk Korusu (10 colors). Unknown/future content has an extensible domain/skill contract.
- **Skills are separate:** animals: word recognition, listening, command following, habitat; colors: word recognition and guided application. Old color records without skill remain recognition.
- Discovery is exposure **not mastery**. Hints and reading-only fallback never count as independent answers.
- Outcome labels: unseen, exposed, practicing, review due, progressing. `progressing` denotes promising recent evidence, **not certified mastery**. Confidence is an explicit *heuristic*, not an audited probability.
- Review intervals after repeated independent correct answers: 12 hours, 1 day, 3, 7, 14 and 30 days. Incorrect attempts are due immediately. A due item gets guaranteed priority within a stage's base questions; previous mistake-recovery questions remain limited and spaced.
- A child switching profile gets a report based only on that child's game sessions. No profile creation is triggered by opening the progress page.
- User-selected grade and English level are still independent. An optional 8-item vocabulary check recommends Pre-A1/A1 start; it **does not assess A2 or certify CEFR**. The parent/user explicitly saves the recommendation.

## Product UX
- **Player Profiles → Learning Settings:** optional starter check, result, apply.
- **Progress → English Learning Report:** exposures, attempted vocabulary, due words, strengthening evidence and due vocabulary chips by domain; a link returns to Kids World.
- **Games:** both seeded planners consult P3's skill-specific due list for guaranteed question selection without overriding unlocked content boundaries.

## Automated acceptance gates
- Determinism across shuffled event arrays; future event filtering; per-skill isolation.
- No inflated independent correctness from discovery/hints.
- Review time arithmetic and due ranking.
- Legacy colors preserved, separate new color application evidence.
- Child isolation in stored sessions.
- Incomplete placement check rejected, no A2 claim.
- TypeScript, tests, web build, Android API 36 APK + AAB, unsigned iOS Simulator CI.

## Important release limitations
- Automated tests cannot prove children's learning outcomes. Real child/parent usability, comprehension and measured retention remain unverified.
- No high-stakes CEFR assessment, AI-generated personalized curriculum, or learning-effectiveness study was claimed.
- P0/P2 security and real two-device sync acceptance remain open (see `P0_P2_KABUL_PLANI.md`).
- P4 game quality, P5 rewards, P6 school panel and P7 payments are separate development phases.
- Vercel Git deployments remain disabled. No publishing or signed store upload.

### 2026-11-01 — P3 adaptif öğrenme motoru v1 teknik kabul

- Saf/çevrimdışı/deterministik beceri modeli: 12 hayvan + 10 renk; ayrı tanıma, dinleme, komut, yaşam alanı ve renk uygulama kanıtları. Eski kayıtlar uyumlu.
- Keşif, ipucu ve yazılı ses alternatifi bağımsız başarı sayılmaz. Cevaplardan ayrı aralıklı tekrar tarihi ve beceri önerisi hesaplanır. Her iki oyun P3 tekrar önceliğini görev planlarına aktarır.
- Profil Ayarları'nda 8 soruluk **isteğe bağlı** kelime başlangıç kontrolü (yalnız Pre-A1/A1 önerisi; A2 veya resmî CEFR iddiası yok). Öneri ancak kullanıcı kaydederse profilde tutulur.
- `/progress` içinde P3 İngilizce Öğrenme Karnesi görünür; eski matematik raporu arşiv altında tutulur. Raporu açmak yeni çocuk profili oluşturmaz.
- GitHub Actions run: https://github.com/ventragame/ventra/actions/runs/41255893312 — kaynak SHA `1b4355f0b748e21b9e1021de8fe9ca63f31e2e4e`; **71/71 çevrimdışı test, TypeScript, Next.js production build, mobil statik export, Android API 36 debug APK + unsigned release AAB ve iOS Simulator derlemesi PASS**.
- Gerçek çocuk, ebeveyn ve fiziksel cihaz kabul testleri henüz yapılmadı; kullanılan periyotlar/üst sınırlar pedagojik olarak doğrulanmış değildir. Bu nedenle **P3 v1 teknik olarak teslim**, tüm P3 ürün/pedagoji kabulü henüz kapanmadı.
- P0/P2 gerçek iki cihaz senkronizasyonu ve P0 npm audit açık kalır. Kullanıcı onayı olmadan Vercel veya mağazaya yayın yok.
