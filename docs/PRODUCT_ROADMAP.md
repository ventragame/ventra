# VENTRA — Canonical Product Roadmap v1.0

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
| **P1 — Onboarding ve çocuk profili** | PLANLI — ilk ürün sprinti | Üç seçenekli net giriş UI; sorunsuz bireysel akış; avatar/takma ad; bağımsız sınıf+İngilizce tercihi; profil değiştirme/silme; ebeveyn yönlendirmesi; mevcut kullanıcı migration | Yeni ve mevcut kullanıcı, sayfa yenileme, mobil, offline, profil değişimi; hiçbir ilerleme ve yıldız kaybı yok; henüz kullanılamayan okul/aile işlemleri açıkça belirtilir. |
| **P2 — Aile, güvenli bulut ve çoklu cihaz** | PLANLI | Ebeveyn giriş/çıkış; çocuk profilini bağlama; çoklu çocuk; eşitleme/çakışma kuralları; hesap değiştirme; veri kurtarma | Aynı çocuk için cihaz A→B ve B→A, eşzamanlı/offline kayıt, tekrar/aynı event, iki farklı aile hesabı izolasyonu, unlink/silme senaryoları **gerçek testle** geçer. Supabase RLS açık doğrulanır. |
| **P3 — Learning Engine v2** | PLANLI | Ölçülmüş seviye başlangıcı, içerik önkoşulları, kelime bazlı ustalık, aralıklı tekrar, görev çeşitliliği, öğrenme analitiği | Pre-A1/A1 içerik uygunsuzluğu yok; replay varyantları testte farklı; zayıf kelime geri gelir; kullanıcı yanlış anlamadığı komutla sınanmaz; metrikler ölçülür. |
| **P4 — Premium oyun / world loop** | PLANLI | Gezilebilir Kelime Bahçesi, etkileşimli sahneler, karakter ve çevre tepkisi, tekrar oynanabilir mekanikler, ses/görsel set | Mobil dokunmatik, düşük cihaz FPS/bellek, tamamlanma/tekrar oynama, 5–10 yaşa uygun kullanıcı testi; 'premium' ilanından önce somut sahne ve kalite kriterleri. |
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
**Son güncelleme:** 31.10.2026 · **Aktif sonraki iş:** P0 risk envanteri ve P1.1 giriş/kimlik akış haritası.  
