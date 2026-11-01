# VENTRA — Canonical Product Roadmap v1.0

> **KAPSAM KİLİDİ — 01.11.2026:** Ventra, yalnızca **dil öğrenimi** hedefli bir ürün olarak geliştirilir (ilk dil İngilizce). Matematik/STEM/ekonomi dünyasına kayma kararı **reddedildi**. Yeni oyun açmadan önce [VENTRA_PRODUCT_CHARTER.md](./VENTRA_PRODUCT_CHARTER.md) okunmalıdır. Bu dosyanın ilk faz tablosu tarihsel durum kaydıdır; aşağıdaki tarihli kararlar önceliklidir.

**Tarih:** 31 Ekim 2026  
**Durum:** Aktif ürün planı; sprintler kanıtlanan kabul kriterleriyle tamamlanır.  
**Kapsam:** Kids World (7–12), B2C bireysel/aile ve B2B okul erişimi.  
**Ana ilke:** Tek öğrenme evreni; üç giriş/üyelik yolu. Ürün geliştirme sırası bu belgeden takip edilir.

> Bu belge, docs/ventra-language-v1/07-DECISION-REGISTER-AND-ROADMAP.md içindeki eski prototip takviminin **yerine geçen güncel ürün yol haritasıdır**. Önceki GDD ve ADR'ler tarihsel/tasarımsal referanstır. Gerçek uygulanmış özellikler yalnızca kaynak kod, testler ve manuel kabul testleriyle doğrulanır.

## 1. Değişmeyecek ürün kararları

- **D-001 | Üç giriş:** **Bireysel Oyna**, **Ailemle Oyna**, **Okulumla Oyna**. Bunlar ayrı oyunlar değil, aynı öğrenme içeriğine farklı kimlik/erişim yollarıdır. Tamamlanmamış bir giriş yolu çalışıyormuş gibi gösterilmez.
- **D-002 | Bireysel:** Çocuk anonim takma ad + avatarla hesap açmadan başlayabilir; ilk oturumda internet şart değil. Kayıt yereldir; cihaz/veri silinirse kaybolabileceği dürüstçe anlatılır. Var olan oyun kayıtlarını ebeveyn hesabına **veri kayıpsız bağlama** tasarlanır.
- **D-003 | Aile:** Yetişkin oturumu birden fazla **ayrı çocuk profili** yönetebilir. **Aynı çocuk** farklı yetkili cihazlarda aynı ilerlemeyle devam edebilir. Bu özellik canlı eşzamanlı co-op demek değildir; ebeveyn-çocuk ortak görevleri ayrı, gelecekte değerlendirilecek bir oyun modudur.
- **D-004 | Okul:** Öğrenci öğretmen/kurumun yetkilendirdiği bir sınıfa katılır. Öğretmen ve aile hesabı/rolleri ayrıdır; aynı çocuğa ait ilerlemenin iki kez kopyalanması yerine yetki ve kimlik eşleştirmesi açık tasarlanır. Okul sınıf kodları, öğretmen rolleri ve izinler tamamlanmadan giriş yolu etkinleştirilmez.
- **D-005 | Minör güvenliği:** Çocuktan zorunlu e-posta, gerçek ad veya tam doğum tarihi istenmez. Yetişkin hesabı girişi, bağlantılar ve gerçek para işlemleri çocuk arayüzünden uygun ebeveyn korumasıyla ayrılır. Veri minimizasyonu ve silme/ihracat akışları tasarımın parçasıdır. Mağaza kuralları/ülke mevzuatı lansman öncesi ayrıca denetlenir; ebeveyn kapısı yasal rızayla aynı şey değildir.
- **D-006 | Öğrenme:** Sınıf bilgisi ile İngilizce başlangıç düzeyi iki ayrı alandır. Öğrencinin seçimi ölçülmüş seviye olarak gösterilmez. Pre-A1'e öğretmediğimiz komutlarla soru sorulmaz. Rastgele soru karıştırmak tek başına adaptif öğrenme sayılmaz.
- **D-007 | Ödül ekonomisi:** **Yıldız** kalıcı öğrenme başarı göstergesidir, harcanmaz. Gelecekteki **Ventra Coin** yalnızca kozmetik/kişiselleştirme için ayrı, bakiyeli ve işlem kayıtlı ekonomi olacaktır. Tekrar oynayarak sınırsız para basılamaz. Gerçek parayla tek tek avatar satışı ilk sürüm kapsamına girmez.
- **D-008 | Teknoloji/veri koruması:** Mevcut Next.js/React, Phaser, IndexedDB, Supabase ve Capacitor yatırımı korunur. Mevcut profiller, seviyeler ve yıldızlar yıkıcı migration olmadan taşınır. **Mevcut package.json Phaser 4.2.x kullanır**; eski dokümanlardaki Phaser 3 ifadesi güncel uygulama kanıtı değildir.
- **D-009 | Premium deneyim:** 'Kartları boyamak' değil, animasyonlu/etkileşimli sahneler, görev çeşitliliği, anlamlı öğrenme kanıtı, dokunmatik erişilebilirlik, ses ve performans üzerinden değerlendirilir.
- **D-010 | İlerleme disiplini:** Bir faz kabul kapısından geçmeden sonraki fazın ana geliştirmesine başlanmaz. Yeni fikirler backlog'a alınır; öncelik değişikliği yeni ADR/roadmap revizyonuyla açıkça kayıt altına alınır. Özellik yokken 'tamamlandı' denmez.

## 2. Kanonik kullanıcı akışları

### Giriş kapısı (hedef UI)
1. **Bireysel Oyna →** güvenli yerel çocuk profili (takma ad + avatar) → sınıf/İngilizce başlangıç tercihi (atlatılabilir) → kısa yönlendirmeli ilk görev → ana dünya. Kayıt/giriş ekranı zorunlu değildir.
2. **Ailemle Oyna →** yetişkin alanı (kayıt/giriş) → çocuk profili seç/oluştur veya yerel profili bağla → birden fazla cihazda yetkili aynı profile erişim → ebeveyn raporu. Yetişkin doğrulaması ve çocuk verisi izinleri açık şekilde ayrılır.
3. **Okulumla Oyna →** uygun okul daveti/sınıf kodu ve yetki kontrolü → var olan çocuk profiliyle güvenli ilişki → atanmış görevler ve aynı oyun evreni → öğretmen ilerleme görünümü. Okul entegrasyonu gelene kadar bu yol dürüstçe 'hazırlanıyor' gösterilir.

**Hesap tipi ≠ çocuk profil kimliği.** Aynı çocuk yerel başlayıp aile hesabına taşınabilmelidir; okul üyeliği çocuğun sahip olduğu ilerleme verisini sessizce başka hesaba transfer etmemelidir.

## 3. Fazlar, durumlar ve kabul kapıları

| Faz | Durum | Teslimat | Geçiş/çıkış kriteri |
|---|---|---|---|
| **P0 — Baseline ve riskler** | **AKTİF / ön koşul** | Mevcut akış envanteri, veri kaybı riskleri, bağımlılık güvenlik raporu | Önceki kullanıcı bildiriminde 32/32 test, TS ve build başarılı; buna ek olarak 7 npm audit bulgusu şiddet/yol bakımından incelenmeli. Ön koşul riskleri yazılı hale gelmeden kimlik modeli değiştirilmez. |
| **P1 — Onboarding ve çocuk profili** | **UYGULANIYOR — P1.1/P1.2 kodlandı; yerel kabul bekliyor** | Üç seçenekli net giriş UI; sorunsuz bireysel akış; avatar/takma ad; bağımsız sınıf+İngilizce tercihi; profil değiştirme/silme; ebeveyn yönlendirmesi; mevcut kullanıcı migration | Yeni ve mevcut kullanıcı, sayfa yenileme, mobil, offline, profil değişimi; hiçbir ilerleme ve yıldız kaybı yok; henüz kullanılamayan okul/aile işlemleri açıkça belirtilir. |
| **P2 — Aile, güvenli bulut ve çoklu cihaz** | **KISMİ UYGULAMA — iki cihazlı gerçek kabul testi bekliyor** | Ebeveyn giriş/çıkış; çocuk profilini bağlama; çoklu çocuk; eşitleme/çakışma kuralları; hesap değiştirme; veri kurtarma | Aynı çocuk için cihaz A→B ve B→A, eşzamanlı/offline kayıt, tekrar/aynı event, iki farklı aile hesabı izolasyonu, unlink/silme senaryoları **gerçek testle** geçer. Supabase RLS açık doğrulanır. |
| **P3 — Learning Engine v2** | **v1 TEKNİK TESLİM: 71 test ve web/Android/iOS CI başarılı; pedagojik/kullanıcı kabulü açık** | Ölçülmüş seviye başlangıcı, içerik önkoşulları, kelime bazlı ustalık, aralıklı tekrar, görev çeşitliliği, öğrenme analitiği | Pre-A1/A1 içerik uygunsuzluğu yok; replay varyantları testte farklı; zayıf kelime geri gelir; kullanıcı yanlış anlamadığı komutla sınanmaz; metrikler ölçülür. |
| **P4 — Premium oyun / world loop** | **P4.1–P4.4 GEZİLEBİLİR SÜRÜM KODLANDI; P4.5 gerçek cihaz ve çocuk kabulü açık** | Gezilebilir Kelime Bahçesi, etkileşimli sahneler, karakter ve çevre tepkisi, tekrar oynanabilir mekanikler, ses/görsel set | Mobil dokunmatik, düşük cihaz FPS/bellek, tamamlanma/tekrar oynama, 5–10 yaşa uygun kullanıcı testi; 'premium' ilanından önce somut sahne ve kalite kriterleri. |
| **P5 — Ödül ve kişiselleştirme** | PLANLI | Harcanmayan yıldız; ayrı Ventra Coin ledger; avatar/kozmetik kazanma; idempotent ödüller; mağaza UI | Çevrimdışı tekrar ve çift cihazla para çoğaltma yok; yanlış hesaptan harcama yok; öğrenme erişimi kozmetik harcamaya bağlanmaz. Ücretli avatarlar yok. |
| **P6 — Okul / öğretmen MVP** | PLANLI | Öğretmen paneli, sınıf/davet, ders ataması, okul marka teması, öğrenci ilerlemesi, rol/izin sınırları | Bir okul başka okulun öğrencilerini göremez; öğretmen yetkileri kısıtlı; ebeveyn hesabıyla bağlantı, sınıftan ayrılma ve silme/aktarım senaryoları doğrulanır. |
| **P7 — Gelir, mobil yayın ve operasyon** | PLANLI | Ebeveyn üzerinden B2C premium üyelik; B2B okul lisansı; Android/iOS QA, billing/abonelik, gizlilik, destek ve incident planı | Gerçek cihazlarda QA; ödeme ve ebeveyn kapısı; mağaza politikası ve gizlilik uyumluluğu; veri ihracı/silme; destek ve sürüm rollback süreçleri doğrulanır. |

**Kural:** Tasarlanmış ≠ kodlanmış ≠ test edilmiş ≠ üretime hazır. Her durum ayrı raporlanır.

## 4. P1 — İlk uygulama sprinti alt görevleri

1. **P1.1 Akış haritası ve erişim matrisi:** üç yol için ekran, geri dönüş, offline, kayıtlı profil ve kayıt yokken senaryoları; ebeveyn işlemlerini ve uygulama içi bağlantıları ayrıştır.
2. **P1.2 İlk karşılama ve oturum seçici:** Bireysel ana CTA; Aile ve Okul seçenekleri; tamamlanmamış sunucu yeteneklerinde yanlış başarı vaadi yok. Ayrı oynama modları, aynı oyunlar.
3. **P1.3 Çocuk profil onboarding:** takma ad, seçilebilir ücretsiz avatar, atlatılabilir sınıf (1–8) ve başlangıç İngilizce düzeyi (Pre-A1/A1/A2); bunların 'ölçülmüş seviye' olmadığını belirt.
4. **P1.4 Mevcut profillerle uyumluluk:** eski profiller için no-reset; yerel anonim ilerleme yedekleme/hesaba bağlama tasarımı; doğru ebeveyn kapısı; profil ve cihaz kaybı açıklaması.
5. **P1.5 Test + kapanış:** E2E ilk açılış, tekrar açılış, iki çocuk profili, yıldızlar, profil değiştirme, offline, mobil ve erişilebilir etiketler. Test çıktıları/commit kaydıyla bu kapı kapanır.

### P1 kapsam dışı
- Gerçek zamanlı ailece co-op, canlı arkadaş sohbeti, açık çocuk sosyal ağı.
- Coin mağazası, ücretli avatarlar, abonelik/ödemeler.
- Tam okul öğrenci hesabı ve öğretmen paneli (P6).
- 13+ Life World genişlemesi; kendi ürün planına ihtiyaç duyar.

## 5. P2 çoklu cihaz için açık teknik kabul senaryoları

- **Kimlik ve izin:** ebeveyn, yalnızca kendi çocuk profiline erişir; yerel profili bir aileye bağlamak explicit, geri alınabilir karardır.
- **Idempotency:** aynı oyun olayının iki cihazdan tekrar gönderilmesi iki ödül yaratmaz.
- **Conflict resolution:** öğrenme olayı geçmişi birleşir; yıldız 'en iyi seviye' mantığıyla hesaplanır; avatar seçimi gibi çakışmalar kullanıcıya anlaşılır kural ile sunulur.
- **Offline-first:** A ve B bağlantısızken çalışır, sonra senkronize olur; sonradan gelen events kaybolmaz.
- **Security:** RLS, farklı ebeveyn oturumları, oturumdan çıkış, profil silme, yeniden kurulum ve yetki iptali cihaz düzeyinde test edilir.
- **Gözlemlenebilirlik:** son sync zamanı, başarısız sync uyarısı, yeniden deneme; çocuklar ve veliler yanlış 'buluta kaydedildi' mesajı görmez.

## 6. Karar değişikliği ve doğrulama protokolü

- Her geliştirmede önce **faz + alt görev + mevcut davranış** belirtilir.
- Ardından kod, minimum kapsamlı test, TypeScript ve production build kontrolü yapılır; mobil test gerekiyorsa ayrıca işaretlenir.
- Doğrulanmayan davranış 'test edildi' diye yazılmaz. GitHub'a push edilmiş olmak deploy'un başarılı olduğunu kanıtlamaz.
- Kullanıcı tarafından yerelde onaylanan akışlar kabul listesine eklenir; elde edilen bulgularla bu dosyadaki durum güncellenir.
- Yol haritası değişikliği gerekiyorsa gerekçe, etkilediği faz ve kabul kriteri açıkça belgelenir. Yeni fikirler rastgele P1'e eklenmez.

## 7. Güvenlik ve ticarileştirme notları

- Çocuk uygulamalarında harici yönlendirmeler ve satın alma erişimi için ebeveyn kapısı planlanır. Apple Kids ve Google Play Families kuralları ayrıca uygulamaya özel denetlenir.
- Hukuki uyumluluk yalnızca kapı koymakla sağlanmış sayılmaz; çocuk verisi işleme amacı/erişim yetkisi/saklama/silme kontrolü incelenir.
- Çocukla doğrudan parasal işlem kurmak yerine hesap sahibinin yetişkin olduğu model korunur.

Kaynaklar:
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/kids/
- https://support.google.com/googleplay/android-developer/answer/9893335

---
**Son güncelleme:** 31.10.2026 · **Aktif sonraki iş:** P1.1–P1.3 onboarding doğrulaması (yeni profil, eski profil, yenileme, offline); ardından P1.4 veri kayıpsızlık ve P1.5 mobil kabul.

### P1 uygulama notu (31.10.2026)

- İlk kez Kids açıldığında otomatik varsayılan profil üretme kaldırıldı; kullanıcı açıkça giriş yolu ve çocuk profilini seçiyor.
- Mevcut profil bulunduğunda onboarding atlanıyor; profil verileri ve oyun kayıtları korunuyor.
- Bireysel başlangıçta takma ad + ücretsiz avatar + isteğe bağlı sınıf + başlangıç İngilizce tercihi yerel profile kaydediliyor.
- Aile seçimi, mevcut yetişkin kapısı/hesabına yönlendiriliyor. Gerçek otomatik profil bağlama ve cihazlar arası garanti **P2 aşamasına ait**, bu ekranda eksiksizmiş gibi sunulmuyor.
- Okul seçimi yalnızca bilgilendirme; okul kodu/kurum hesabı **P6** aşamasında.
- P0 **açık risk:** önceki yerel npm audit sonucunda 7 bulgu (1 kritik, 2 yüksek, 4 orta); etkilenen paket zincirleri incelenmeden kapatılmış sayılmayacak.
- Kod push/CI sonucu, gerçek mobil E2E ve ebeveyn akışı kabul testi yerine geçmez.  

### Erişim yolu değiştirme ve aile bağlantısı — kod uygulaması (31.10.2026)

- Mevcut oyuncunun Kids ekranından **Oyun Yolum** menüsünü tekrar açması ve aynı profille bireysel oyuna dönmesi kodlandı. Bu işlem profil yaratmaz, oyun kayıtlarını sıfırlamaz ve bağlı aile hesabını koparmaz.
- Ebeveyn alanında yerel profili **açık onayla tek tek aile hesabına bağlama**, bağlı profilleri eşitleme ve ikinci cihazdan **profilleri buluttan getirme** işlemleri kodlandı.
- Profil sahipliği uzak sunucuda doğrulanmadan bulut olaylarına müdahale edilmez. Diğer hesaba bağlı yerel profil aileye sessizce aktarılamaz.
- İlerleme olayları birleştirilirken Renk Korusu kelime bazlı doğru/yanlış kanıtları saklanır; aynı olayın iki kez sayılması engellenir. Profile ait ID değişmez.
- **Kısıt:** Bulut yedekleme şimdilik ebeveyn alanından manuel tetiklenir; otomatik cihaz eşitliği veya gerçek eşzamanlı oyun iddia edilmez.
- **Kısıt:** İngilizce düzeyi ve sınıf tercihi hâlen yerel profil alanlarıdır; bulut meta veri senkronu henüz tamamlanmadı. Diğer cihazda öğrenme tercihleri kullanıcı tarafından tekrar seçilmelidir.
- **Kısıt:** Okul/sınıf üyeliği ve yetki altyapısı P6 kapsamındadır; “Okulumla Oyna” geçerli oyun profiline erişimi engellemeyen hazırlanıyor ekranı olarak kalır.
- **Kabul eksikleri:** yerel `npm run type-check`, web testleri, production build, gerçek Supabase hesabıyla iki ayrı cihazda A→B ve B→A, offline tekrar, hesap sahipliği testi. Bu doğrulamalar tamamlanmadan P2 **DONE** olarak işaretlenmeyecek.

### 2026-11-01 — Renk Korusu vertical slice (CI kabul kaydı)

- Geliştirildi: keşif renk taşları, çiçeğin rengini İngilizce eşleştirme, renklenecek koru, vektörel çevre, ses kontrolü, 3 aşamalı geçiş, yeniden oynama, zayıf kelimelerin ek tekrar soruları, idempotent kayıt ve stage/profile bazlı async soru planı izolasyonu.
- GitHub QA: [41247022202](https://github.com/ventragame/ventra/actions/runs/41247022202), kaynak SHA `0ac11c0ba6fa648f7005105ae969e4c2bce37e8b` — **iki job başarılı**: TypeScript, 41 çevrimdışı/regresyon testi, Next.js production build, statik mobil export, Android Capacitor sync, Android `assembleDebug`, iOS CocoaPods sync ve imzasız Simulator `xcodebuild`.
- Kanıtın kapsamı: derleme ve testler. **Gerçek Android/iPhone cihazında oynanış, tarayıcı E2E, farklı ekran boyutları, TTS ve çocuk kullanıcı testi henüz yapılmadı**; bunlar geçmeden P4 son kullanıcı release için DONE sayılamaz.
- P2 ayrıca devam ediyor: gerçek iki cihazlı canlı Supabase A↔B, profil silme/eşitlenme ve offline conflict kabul testleri bu Renk Korusu UI değişikliğiyle tamamlanmış sayılmaz.
- Vercel Git auto deployment config devre dışı; istemeden production deploy yok. Herhangi bir release için kullanıcıdan ayrıca onay alınır.

### 2026-11-01 — Renk Korusu final hardening

- Six painted trees (formerly only four), responsive stage transitions and touch targets, in-game mute and unsupported-TTS fallback, optional color-label accessibility hint.
- Guaranteed but recoverable weak-word practice, non-adjacent repeats, stage-level star integrity, full three-stage/save/replay regression suite.
- Release gate: browser manual end-to-end + physical Android/iPhone interaction checks required in addition to automated web/Android/iOS CI. P4 remains partial until those checks pass.

### 2026-11-01 — Hayvan Çayırı v2 ürün dilimi
- Onaylı sıra: Renk Korusu'ndan sonra Hayvan Çayırı. Beş aktivite tek macerada birleştirildi, 12 hayvan kataloğu, kayıt temelli adaptif tekrar, 1–3 gerçek yıldız puanı ve offline duyarlı görev ilerlemesi geliştirildi.
- Eski dört hayvanın görsel/ses varlıkları aynen korunuyor; yeni sekiz hayvanın profesyonel sanat ve kayıtlı ses paketleri henüz yerlerini almadı.
- **Release durumu:** CI TypeScript + test + web/Android/iOS build ve gerçek cihaz/oyun kabul testleri tamamlanana kadar kısmi. Canlı Supabase cihaz senkronizasyonu P2'de ayrıca ele alınır.

### 2026-11-01 — P0/P1/P2 güvenilirlik sprinti; doğrulanmış teknik sonuçlar
- Tekil çocuk profili senkron çağrıları birleştirildi; yetişkin sahipliği Supabase Auth sunucusunda doğrulanıyor.
- 100 kayıtlık güvenli bulut yükleme paketleri, 500 kayıtlık sayfalı uzaktan indirme ve profil geri yükleme; ağ kesintilerinde yerel bekleyen kayıtlar korunuyor.
- Silme işlemleri kontrol edildi: yetişkin RPC hatasında başarısızlık, bağlı çocuk silmede ebeveyn alanı ve uzak sunucu doğrulaması, tombstone senkronizasyonu.
- İki farklı çocuğa ait event'lerin yanlışlıkla birleştirilmesi her iki yerel repository'de reddediliyor.
- Bulut göstergesi bekleyen olayları dikkate alıyor; ebeveyn hesabında son başarılı *bu cihazdaki* eşitleme zamanı gösteriliyor.
- GitHub Actions [41253543619](https://github.com/ventragame/ventra/actions/runs/41253543619), kaynak `e1960672bd3cbbe8b48ebcb9760d85b45add15fc`: **60/60 çevrimdışı test**, TypeScript, production web build, Android API 36 debug APK + unsigned AAB ve iOS Simulator: PASS.
- **P0 AÇIK:** `npm ci` taramasında toplam **7** (4 orta/2 yüksek/1 kritik). CI `npm audit --omit=dev` raporunda **2 üretim-bağımlılığı bulgusu** (1 orta, 1 yüksek), Next.js→PostCSS zinciri. `npm audit fix --force` Next 16.4.3 kırıcı yükseltmesine gider; otomatik uygulanmadı. Güncel uyumlu paket yükseltmesi, yeniden test ve güvenlik incelemesi gerekir.
- **P1 AÇIK:** ilk/geri dönen kullanıcı, eski profil ve gerçek mobil/offline kabul doğrulamaları.
- **P2 KISMİ:** 2 fiziksel cihaz ile A→B/B→A, offline çakışma, profil silme ve ayrı yetişkin hesabı izolasyonu gerçek Supabase oturumlarıyla kullanıcı kabulü olmadan DONE sayılmaz. `docs/P0_P2_ACCEPTANCE_2026-11-01.md` izle.
- Production deploy / App Store / Play Store yayını yapılmadı; Vercel Git auto-deployment kapalı.

### P2 privacy migration — requires Supabase SQL editor (2026-11-01)
- New `20261101000001_delete_child_profile_atomically.sql`: parent-scoped, transactional event purge + anonymised profile tombstone for cross-device deletion propagation.
- The migration is committed, **not executed** against the actual Supabase environment. Until the owner runs it, parent-initiated permanent child deletion will show a safe error; P2 must remain open.

### 2026-11-01 — P3 adaptif öğrenme motoru v1 teknik kabul

- Saf/çevrimdışı/deterministik beceri modeli: 12 hayvan + 10 renk; ayrı tanıma, dinleme, komut, yaşam alanı ve renk uygulama kanıtları. Eski kayıtlar uyumlu.
- Keşif, ipucu ve yazılı ses alternatifi bağımsız başarı sayılmaz. Cevaplardan ayrı aralıklı tekrar tarihi ve beceri önerisi hesaplanır. Her iki oyun P3 tekrar önceliğini görev planlarına aktarır.
- Profil Ayarları'nda 8 soruluk **isteğe bağlı** kelime başlangıç kontrolü (yalnız Pre-A1/A1 önerisi; A2 veya resmî CEFR iddiası yok). Öneri ancak kullanıcı kaydederse profilde tutulur.
- `/progress` içinde P3 İngilizce Öğrenme Karnesi görünür; eski matematik raporu arşiv altında tutulur. Raporu açmak yeni çocuk profili oluşturmaz.
- GitHub Actions run: https://github.com/ventragame/ventra/actions/runs/41255893312 — kaynak SHA `1b4355f0b748e21b9e1021de8fe9ca63f31e2e4e`; **71/71 çevrimdışı test, TypeScript, Next.js production build, mobil statik export, Android API 36 debug APK + unsigned release AAB ve iOS Simulator derlemesi PASS**.
- Gerçek çocuk, ebeveyn ve fiziksel cihaz kabul testleri henüz yapılmadı; kullanılan periyotlar/üst sınırlar pedagojik olarak doğrulanmış değildir. Bu nedenle **P3 v1 teknik olarak teslim**, tüm P3 ürün/pedagoji kabulü henüz kapanmadı.
- P0/P2 gerçek iki cihaz senkronizasyonu ve P0 npm audit açık kalır. Kullanıcı onayı olmadan Vercel veya mağazaya yayın yok.

### 2026-11-01 — P4.1–P4.5 tek paket çalışma durumu

- **P4.1:** Kelime Bahçesi altı bölgeyi sunan, yürünen Phaser haritasına dönüştürüldü. Hayvan Çayırı ve açılmışsa Renk Korusu oynanabilir; diğer dört bölge yanlışlıkla oynanabilir görünmez.
- **P4.2:** Hayvan Çayırı ortak yürüyüş motoruna bağlandı; 12 özgün SVG karakter sahnede kullanılabilir, kaşif karakterin ayrıca çevrimdışı SVG'si vardır.
- **P4.3:** İlk görevde hayvanların yanına yürüyerek keşfetme; dördüncü görevde sahnede doğru hayvanı bulma; beşinci görevde hayvanı bulup ayrı yaşam alanına götürme. 2–3. görevlerde mevcut eşleştirme/dinleme mekanikleri ve P3 verileri korunur.
- **P4.4:** Çiçeklerle ilerlemeye tepki veren sahne, hafif animasyonlar, özgün kaşif, isteğe bağlı orijinal ortam tınıları, global mute ve düşük hareket tercihine saygı. 4 eski kayıtlı WAV dışında seslendirmeler cihaz TTS'sine bağlı kalmaktadır.
- **P4.5:** Klavye/WASD, dokunarak yürüme, büyük mobil yön tuşları, erişilebilir alternatif seçimler, pencere gizlenince pausing ve arka plandaki takımadaların uyutulması, dünya koordinat/model regresyon testleri. Gerçek Android/iPhone ve 5–10 yaş çocuk kabulü **bekliyor**.
- **Kısıt:** Gerçek pathfinding/engel çarpışmaları, profesyonel bütün hayvan ses paketi, oyuncu üzerinde ölçülmüş FPS ve pedagojik saha testi henüz yok; bu sürümün mağaza seviyesinde kesin "premium/bitmiş" ilan edilmesi uygun değildir.
- **Git / dağıtım:** Kod `main` dalında, Vercel otomatik dağıtım kapalı, hiçbir mağaza yayını yapılmaz.

## 2026-11-01 — Automated CI evidence (verified)

- GitHub Actions: https://github.com/ventragame/ventra/actions/runs/41258109583
- Source SHA: `fc6b03eeeee5437ffbba900061fb23b547585c7f`
- **TypeScript: PASS. 75/75 offline/regression tests: PASS, 0 FAIL.**
- **Web production build: PASS; mobile static export: PASS.**
- **Android API 36 native debug APK + unsigned release AAB: BUILD SUCCESSFUL.**
- **iOS unsigned Xcode Simulator build: PASS.**
- Open: Android/iPhone physical device touch/FPS/offline/TTS/VoiceOver/child-user acceptance.
- Open security gate: npm audit 7 current vulnerabilities: 1 critical, 2 high, 4 moderate. Package impact and fixes require separate triage; no unsafe `npm audit fix --force` was run.
- No production deploy, mobile store upload, app signing or purchases enabled.


### 2026-11-01 — Onaylı öncelik revizyonu: Sayı Vadisi
- **Karar:** P4'ün 40 hayvanlık kod regresyonları kısa teknik sprintte kapatılır; fiziksel cihaz, pedagojik kabul, geçici SVG sanat kalitesi ve güvenlik analizleri yayın öncesi açık risk olarak izlenir. Bunlar çözülmeden `RELEASE READY` denmez.
- **Yeni dünya önceliği:** P5 ödül ekonomisinin geliştirilmesinden önce üçüncü Kelime Bahçesi bölgesi **Sayı Vadisi** geliştirilecek. Kullanıcı bu sırayı 01.11.2026 tarihinde onayladı.
- **NV0:** `apps/web/src/lib/learning/numberValleyEngine.ts` ve testler eklendi; 1–20 İngilizce sayılar, 8'li keşif, 3 seçenekli ve yanlışları yeniden soran seed'li soru planlayıcı var. Henüz dünya kartı açılmaz.
- **NV1:** Görsel keşif sahnesi ve erişilebilir mobil etkileşim.
- **NV2:** Işık Köprüsü, Yıldız Hasadı, Yankı Kanyonu, Portal Onarımı özgün mekanikleri.
- **NV3:** Yeni ayrı oyun kaydı `island_word_garden_numbers`, yıldız koruması ve profil bazlı kalıcı öğrenme kanıtı.
- **NV4:** QA ve cihaz kabulü; tüm kapılar geçilince Sayı Vadisi haritada oynanabilir olur.
- **İlke:** NV0 teknik temel `Sayı Vadisi tamamlandı` anlamına gelmez; P2 aile senkronizasyonu ve P4 fiziksel cihaz doğrulaması yayın kapısı olarak kalır.

### 2026-11-01 Sayı Vadisi genişletme kararı
- 1–20 içeriği, 21–100 ve 101–1000 yollarına genişletildi; Pre-A1 ve sınıf politikaları korunur.
- 15 görev bölümü / 45 yıldız, eski 5 görev kaydının devamıdır; her düzey beş orijinal görev mekaniğinin uyarlanmış varyantıdır.
- Günlük yaşam fiyat karşılaştırma ve yüzlük/onluk/birlik atölyesi eklendi.
- CI ve fiziksel cihaz kalite kapıları başarı ölçütüdür; mağaza yayın kararı değildir.

### 2026-11-01 — P5 ödül ve kişiselleştirme yerel MVP
- P5.1 Maceracı Pasaportu: çocuk bazlı yıldızlar, öğrenilen sayı/renk/hayvan sayıları, üç dünya ilerlemesi ve rozetleri.
- P5.2 Ventra Coin: ayrı ledger'da benzersiz bölüm başına ilk tamamlama +10; tekrar oynama coin üretmez. Gerçek paradan bağımsız earned-only v1.
- P5.3 Koleksiyon: 8 kozmetik; satın alma/sahiplik/takma işlemleri atomik yerel IndexedDB işleminde. Öğrenme içeriği paywall'a bağlanmaz.
- P5.4 Günlük hedef: 1/2/3 kayıtlı oyun için 5/8/12 coin, gün bazlı idempotent. Streak ve kaçırma cezası yok.
- P5.5 Replay, profil izolasyonu, bakiye testleri. AÇIK: Ledger ve envanter buluta eşitlenmiyor; cihazda değiştirilebilir. **Ücretli coin için güvenilir değil**.
- Ücretli coin 100/350/800 paketler yalnızca yetişkin hesabı alanında satış dışı taslaktır. Android Play Billing + iOS StoreKit, server-side makbuz doğrulama, iade, idempotent grant ve parental authorization olmadan aktif edilmez.
- Gerçek cihaz, çocuk kabulü ve politikalar hâlâ açık; bu bir yayın onayı değildir.


### 2026-11-01 — ADR-LANG-002: Dil öğrenimi odağı ve yeni içerik önceliği (ÜRÜN SAHİBİ KARARI)

- **Ürün vizyonu tekrar onaylandı:** Ventra, etkileşimli **İngilizce/dil öğrenme uygulamasıdır**, tüm derslere yönelik genel oyunlaştırılmış eğitim platformu değildir. Önceki matematik, mühendislik, ekonomi oyunu genişleme önerileri reddedildi.
- **KANONİK kapsam:** [VENTRA_PRODUCT_CHARTER.md](./VENTRA_PRODUCT_CHARTER.md). Genel ürün önerileri, GDD'ler ve kodlama ajanları bu kapsama uymalıdır. Bu yeni karar, üstteki 31 Ekim faz tablosundaki eski durum etiketlerinden daha yenidir.
- **Mevcut içerik:** Hayvan Çayırı = İngilizce hayvan adları; Renk Korusu = İngilizce renkler; Sayı Vadisi = İngilizce sayılar (düzeye göre 1–1000). Üçü de aynı P3 dil öğrenme motorunun dünyalarıdır.
- **Sıradaki G1:** **Lezzet Pazarı (Food & Drinks)**. İlgili İngilizce kelimeleri görsel, ses, tanıma, dinleme, basit ürün seçme ve kısa alışveriş ifadeleri üzerinden öğretir. **Zorunlu para hesaplama, bütçe, fiyat/para üstü, kâr/zarar ve mağaza işletme mekaniği YOK.** Beş tema-özel dil oyunu/etkileşimi GDD'de belirlenecek. Daha önce telaffuz edilen “50–60 ürün/20–25 görev” yalnızca öneri; onaylanmış içerik veya geliştirilmiş özellik değildir.
- **Sonraki içerik:** Aile Köyü (family/home/daily English), Keşif Tapınağı (birikmiş İngilizce kazanımlarını tekrarlama). Başka yabancı diller/13+ ileride, ayrı kapsam kararıyla.
- **Okul fazı:** P6.1 okul ve sınıf kodları yazıldı ve kullanıcı veli-bağlama akışını denedi; ileri öğretmen ödevi/raporlama **erteledi**. Kod ve canlı kabul farkı korunur.
- **Ücretli coin:** Ebeveyn tarafı Play Billing/StoreKit + doğrulanmış sunucu ledger ileride; çocuklara ödeme baskısı yok, satış şu anda kapalı.
- **Kalite kapıları:** Her yeni dünya önce hedef **İngilizce kelimeler/ifadeler, pedagojik akış, yanlış/ipuçları, P3 kanıtı, cihaz ve çocuk kabulü** ile tanımlanır; ardından kodlanır.

### 2026-11-01 — G1 Lezzet Pazarı oynanabilir kod teslimi
- **VENTRA DİL ODAĞI KORUNDU.** Matematik, kasa, para üstü, bütçe ve ticari mağaza simülasyonu içerik hedefi değildir.
- Meyve & Sebze, Fırın, Kafe & Sofra için toplam **45** Türkçe karşılıklı İngilizce yiyecek/içecek kelimesi; Pre-A1/A1/A2 için 8/12/15 kelime üst sınırı. Sınıfa göre bir oturumda 6–8 kelime tanıtılır, tekrar keşiflerde yeni kelimeler öne alınır.
- **3 sokak × 5 oynanabilir dil görevi = 15 bölüm, en çok 45 yıldız**: keşfet, görselden İngilizce adı eşleştir, TTS dinle/görsel bul, İngilizce müşteri diyaloğuna cevap ver, çok ürünlü alışveriş listesini dokun/sürükle ile tamamla.
- **Erişim düzeltmesi (01.11.2026):** Lezzet Pazarı, Hayvan Çayırı/Renk Korusu/Sayı Vadisi tamamlanmadan **doğrudan oynanabilir**; diğer dünyaları bitirme şartı yoktur. Lezzet Pazarı'nda yalnız kendi üç sokağı ve 15 görevi sırayla açılır. Profil izolasyonu ve önceki oyun kayıtları korunur. İlk sürümün yalnızca Number Valley ilk beş görevine bağlandığı ve haritada hatalı biçimde **PLANLANIYOR** gösterdiği senaryo giderildi.
- P3 food domain kanıtı: keşif/recognition/listening/dialogue/application, hata/ipuçları, duyulmayan ses için bağımsız dinleme notu verilmez. P5 coin'de sadece benzersiz bölümün ilk bitişi +10 (tüm pazar 150), günlük oyun kayıtları ile uyumlu.
- CI: https://github.com/ventragame/ventra/actions/runs/41318977803 — testler, TypeScript, Next.js production build, mobil statik paket, Android debug APK, iOS Simulator derlemesi başarılı (kaynak SHA `212b3679dd36b949984bc57c0d4a0112983e53eb`).
- **Açık yayın kapısı:** çocuk gerçek kullanım denemesi, gerçek Android/iPhone dokunmatik ve offline TTS, kayıt silme/senkronizasyon kabulü, özgün her ürünün illüstrasyonları/profesyonel offline İngilizce ses. Ürün sprite'ları şu anda emoji ikonlar ve orijinal SVG pazar sahnesinden oluşur. CI başarı = mağaza yayın onayı değildir.
- GDD/kabul: [LEZZET_PAZARI_GDD_AND_ACCEPTANCE.md](./LEZZET_PAZARI_GDD_AND_ACCEPTANCE.md).

### 2026-11-01 — Lezzet Pazarı harita erişim kabulü
- Ekran görüntüsünde oynanabilir G1 Lezzet Pazarı'nın **PLANLANIYOR** olarak görünmesine yol açan `foodUnlocked` kapısı ve `getDistrictObjects` içindeki çapraz dünya bağımlılığı kaldırıldı.
- Durumlar gerçek içerik durumuna göre ayrıldı: **OYNANABİLİR**, **KİLİTLİ**, **YÜKLENİYOR**, **YÜKLEME HATASI**, **YAKINDA**. Yeni bölümde eski çocuğun verisi/yıldızları değişmedi.
- Regresyon: Number Valley tamamlanmamışken Lezzet Pazarı açılabilmeli; henüz kodlanmamış Aile Köyü/Keşif Tapınağı kapalı kalmalı.
- Kanıt: [GitHub Actions 41323749347](https://github.com/ventragame/ventra/actions/runs/41323749347) — TypeScript, 2D harita testleri, production web, statik mobil export, Android debug APK ve iOS Simulator derlemesi başarılı. Fiziksel cihaz kabulü hâlâ açık.
