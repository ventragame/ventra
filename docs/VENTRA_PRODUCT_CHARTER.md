# VENTRA — DEĞİŞMEZ ÜRÜN KİMLİĞİ VE KAPSAM KARARLARI

**Durum:** ONAYLI, KANONİK ÜRÜN KAPSAMI (1 Kasım 2026)
**Kapsam sahibi:** Ventra ürün sahibi. Stratejik yön ancak ürün sahibinin açık kararı ve bu belgede kayıtlı bir ADR ile değişebilir.
**Okuma önceliği:** Bu dosya (neden/ne üretiyoruz) → [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) (ne zaman) → [ventra-language-v1/](./ventra-language-v1/) (pedagoji ve tasarım geçmişi) → mevcut kaynak kodu/testler (gerçekte ne yapıyor).

## 1. Tek cümlelik ürün tanımı

**Ventra, başlangıçta çocuklara İngilizceyi; etkileşimli, keşfedilebilir, görsel-işitsel oyun dünyaları üzerinden öğreten, ebeveynlere ve okullara da öğrenme gelişimini güvenli biçimde sunmayı hedefleyen bir dil öğrenme uygulamasıdır.**

**Ventra GENEL EĞİTİM OYUN PLATFORMU DEĞİLDİR.** Matematik, mühendislik, bilim, bağımsız ekonomi, şehir kurma ve benzeri ders alanlarına yön değiştirilmez. Oyunlar temel ürün değil, **dil edinimini sağlayan öğretim biçimidir**. Önceki matematik/Godot deneyimi ayrı, tarihsel projedir; yeniden ürün hedefi yapılmaz.

## 2. Hedef, platform ve kullanıcılar

- **Şimdiki odak:** Kids World, yaklaşık **7–12 yaş**; Pre-A1/A1/A2'ye ve **sınıf + İngilizce düzeyi** ayrımına duyarlı başlangıç **İngilizcesi**.
- **Öğrenim hedefi:** Kelime ve ifadeleri **görsel olarak tanıma, telaffuzunu duyma, dinleyerek ayırt etme, anlamlandırma, basit yönergelerde kullanma ve zaman içinde hatırlama**. Kelimeyi ilk defa görmek ustalık kanıtı değildir.
- **Gelecek vizyonu:** Life World (13+) gerçek hayat bağlamlarında yine **dil öğrenimi**; ek yabancı diller ancak ayrı karar ve kapsamdan sonra. Bunlar mevcut ürünün tamamlanmış parçaları olarak sunulamaz.
- **Girişler:** Bireysel Oyna, Ailemle Oyna, Okulumla Oyna = aynı dil içeriğine üç erişim/kimlik yolu. Aile ve öğretmen ekranları dil öğrenimini destekler; kendi başına ayrı ürün hedefi değildir.
- **Dağıtım hedefi:** Web, Android, iOS. Teknoloji/mevcut test durumu için kod ve güncel kabul belgeleri esas alınır; tarihsel GDD'deki motor sürümleriyle hüküm verilmez.

## 3. Sınırlar: ne yapılır, ne yapılmaz?

| UYGUN — dil öğrenimine hizmet eder | UYGUN DEĞİL — ürün yönünden sapmadır |
| --- | --- |
| Hayvanı görüp İngilizce adını dinlemek, işaret etmek, cümlede kullanmak | Hayvan yetiştirme/çiftlik ekonomisini ana oyun yapmak |
| İngilizce renkleri nesnelerde tanımak ve yönergede uygulamak | Renk eşleştirirken İngilizce öğrenimini yalnızca rastgele dekor olarak bırakmak |
| İngilizce sayıları 1–1000 arasında duymak, söylemek, tanımak ve uygun bağlamda kullanmak | Aritmetik işlem, bütçe hesabı veya para üstünü ana kazanım yapmak |
| Lezzet Pazarı'nda apple/bread/cheese vb. kelimeleri, sesleri ve "I want an apple" gibi basit ifadeleri öğrenmek | Kasa işletme, kâr maksimizasyonu, fiyat/indirim optimizasyonu veya tarifte gram hesabını amaç yapmak |
| Aile Köyü'nde mother/father/kitchen vb. kelimeler ve günlük İngilizce ifadeler | Ev/şehir simülasyonu, kaynak toplama veya genel hayat becerisi eğitimi |
| Keşif Tapınağı'nda önceki **İngilizce kazanımlarını** bağlamsal bulmacalarla tekrar etmek | Dilden bağımsız mantık, matematik veya escape-room bulmacalarını öğrenme hedefi yapmak |
| Öğrenmeyle açılan kozmetikler, yıldızlar ve koleksiyon | Çocukları satın alma baskısına sokan döngü, dil öğreniminden bağımsız para oyunu |

**Bağlam ile öğrenme hedefi farklıdır:** Tezgâhta fiyat etiketi bulunabilir; fakat ödüllendirilen/ölçülen beceri İngilizce kelime veya ifadenin anlaşılıp kullanılabilmesi olmalıdır. Sayı Vadisi'nde yer alan basamak blokları ve mevcut pazar fiyat karşılaştırması tarihsel uygulama gerçekliğidir; bunlar **genel matematik/economy vizyonuna genişlemek için emsal değildir**. Sonraki içerik kalite geçişinde bu tür soruların İngilizce öğrenimini ne ölçtüğü ayrıca incelenecektir.

## 4. Onaylı öğrenme döngüsü — her yeni oyun için asgari kalite

1. **Keşfet:** Net görsel + doğru İngilizce yazım + anlaşılır İngilizce telaffuz + basit bağlam. Yeni kelime erişilebilir seviyede sunulur.
2. **İlişkilendir:** Kelime ↔ görsel, yazılı biçim ↔ ses veya kelime ↔ gerçek bağlam eşleştirme; yalnızca rastgele şıkları sıralamak yetmez.
3. **Dinle ve ayırt et:** Öğrenci sesi gerçekten duyduysa bağımsız dinleme kanıtı; ses yoksa metin/ipucu ile destek, fakat dinleme ustalığı iddia edilmez.
4. **Uygula:** İngilizce yönerge veya kısa cümle ile **sahne içinde eylem**. Görev çözümünün dil becerisine bağlı olması gerekir.
5. **Pekiştir ve tekrar et:** Bağlamsal mini görev, farklı oturumlarda çeşitlenen örnekler; P3 hata/ipuçları, bağımsız doğrular ve aralıklı tekrar verileri korunur.

Beş aşama her sahnede aynı görsel şablonu kullanmak zorunda değildir. **Oyun çeşitliliği etkileşimde ve dil becerisinde ölçülür.** Bir dünyada 50 görsel eklemek tek başına premium eğitim içeriği değildir. Çocuk testleriyle kullanılabilirlik ve öğrenme iddiaları doğrulanmadan "tamamlandı / yayın hazır" denmez.

## 5. Mevcut dünya haritası ve planlanan içerik sırası

| Bölge | Ana **İngilizce** kazanımı | Karar |
| --- | --- | --- |
| Hayvan Çayırı | Animals; tanıma, dinleme, basit hayvan eylemleri | Mevcut oynanabilir içerik |
| Renk Korusu | Colors; renkleri tanıma, dinleme, nesneye uygulama | Mevcut oynanabilir içerik |
| Sayı Vadisi | Numbers (yaşa/düzeye göre 1–1000); İngilizce biçim, telaffuz, yönerge | Mevcut oynanabilir içerik |
| **Lezzet Pazarı** | **Food & drinks**; yiyecek/içecek isimleri, sesler, basit istek/sipariş ifadeleri | **Bir sonraki içerik geliştirmesi** |
| Aile Köyü | Family, home, daily routines; kısa günlük yaşam ifadeleri | Sonraki içerik |
| Keşif Tapınağı | Önceki İngilizce sözcük/ifadelerin karışık ve bağlamsal tekrarı | Sonraki içerik |

### G1 — Lezzet Pazarı için değişmez kapsam

**Dil hedefi:** Yiyecek ve içecek söz varlığını ve yaşa uygun kısa İngilizce ifadeleri öğrenmek. İlk yayın kapsamının kesin ürün listesi, seviye bantları ve kelime hedefleri **ayrı GDD'de kararlaştırılacak**; "50–60 kelime", "20–25 görev" gibi rakamlar şimdilik taahhüt değildir.

Beş **örnek** premium etkileşim (tasarım onayı ve GDD sonrası uygulanır):

1. **Pazarı keşfet:** Ürünleri bul, İngilizce adını ve sesini öğren.
2. **Doğru ürünü seç:** "Find the apple" veya "Choose the bread" gibi İngilizce isteğe göre ürün seç.
3. **Dinle ve sepete koy:** "Milk, please" sesini dinleyip doğru ürünü ayırt et; işitsel kanıt ayrı kaydedilir.
4. **Mini sipariş diyalogu:** "What would you like?" → "I want a banana, please" gibi yaş/düzeye uygun alışveriş ifadeleri.
5. **Tezgâhı tamamla:** Öğrenilen İngilizce isimleri/ifadeleri doğru bağlamda kullanarak pazarı canlandır.

**Yapılmayacaklar:** Zorunlu toplama/çıkarma, para üstü hesaplama, gerçek kâr/zarar, enflasyon, mağaza ekonomisi, bütçe optimizasyonu ve İngilizceye bağımlı olmayan yemek yapma simülasyonu. İngilizce sayılar "two apples" gibi çok basit ifade bağlamında kullanılabilir; değerlendirilen beceri İngilizce söyleneni anlamaktır.

## 6. P3 / profil / ticaret ve okul sınırı

- **P3:** Dil kanıtı; kelime/ifade bazlı keşif, tanıma, dinleme, uygulama ve tekrar. Yıldız/coin tek başına ustalık değildir.
- **P5:** Kozmetik/ödül katmanı dil öğrenimini motive eder; ayrı bir ekonomik strateji oyunu haline gelmez. Ücretli coin ileride yalnız ebeveyn üzerinden; Android için Google Play Billing, iOS için StoreKit/uygun mağaza mekanizması ve doğrulanmış sunucu muhasebesi gerekir. Şimdilik ödeme kapalı.
- **P6:** Okul/öğretmen sınıf ve ilerleme raporu sağlar, **İngilizce öğrenme oyunlarının kendisi değildir**. Öğretmen ödev/ileri analitik işi mevcut karar gereği sonraya bırakıldı.
- **P2:** Çocuk kimliği, ebeveyn onayı, Supabase RLS, cihazlar arası eşitleme ve çocuk verisi güvenliği; gerçek cihaz kabulü yine gereklidir.

## 7. Ürün kapsamı için zorunlu geliştirici kontrolü

Her yeni oyun/dünya önerisi, kodlamadan önce aşağıdaki sorulara yazılı cevap vermelidir:

- **Hangi İngilizce kelimeler/ifadeler ve hangi dil becerileri** öğretiliyor? Hedef yaş ve Pre-A1/A1/A2 seviyesi ne?
- Çocuk hedef İngilizceyi **görmeden/duymadan/anlamadan** oyunu aynı başarıyla bitirebilir mi? **Evetse mekanik uygun değil.**
- Yeni oynanış sahnede nasıl farklı etkileşim yaratıyor? Sadece görselleri veya soru şıklarını mı değiştiriyoruz?
- Doğru telaffuz, alternatif erişilebilirlik, hatalarda öğrenme desteği, tekrar çeşitliliği ve P3 kanıtı nasıl korunuyor?
- Yıldız, coin, eski kayıtlar, profil izolasyonu ve çevrimdışı/bulut davranışı bozuluyor mu?
- Bu öneri ürünü matematik, genel STEM, alışveriş yönetimi, bağımsız simülasyon veya başka derse kaydırıyor mu? **Evetse geliştirmeyi durdur ve kullanıcıdan açık stratejik karar al.**

GDD → görsel/etkileşim tasarımı → kod → otomatik test → mobil/çocuk kabul testi sırası uygulanır. **Yeni tema için hazır kod yazmak, onaylanmamış yeni ürün stratejisi yaratma yetkisi vermez.**

## 8. Karar kaydı

- **ADR-LANG-001 (30 Ekim 2026):** Eski matematik/Godot odağından, Phaser/React temelli **dil öğrenme platformuna** geçiş. [İlk kararlar](./ventra-language-v1/07-DECISION-REGISTER-AND-ROADMAP.md), [PRD](./ventra-language-v1/01-PRODUCT-VISION-AND-PRD.md).
- **ADR-LANG-002 (1 Kasım 2026):** Ürün sahibi, dil öğrenimi kapsamının korunmasını **yeniden ve açıkça teyit etti**. Genel eğitim/Matematik/Mühendislik dünyaları önerisi reddedildi. **Lezzet Pazarı = İngilizce gıda/alışveriş ifadeleri**, hesaplama oyunu değil. Okul ödev sistemi şimdilik ertelendi; oyun içerik derinliği öncelikli.
- **Değişiklik protokolü:** Bu iki kararın dışına çıkmak için kullanıcıdan açık yeni ürün kararı + bu dosyada tarihli ADR + [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) revizyonu gerekir.

## 9. Dokümanların otoritesi

- **Vizyon ve yasak kapsam:** BU DOSYA.
- **Güncel sıradaki iş:** [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) en son tarihli kapsam/öncelik kaydı. Roadmap'in 31 Ekim faz tablosu *tarihsel anlık görüntüdür*, sonraki kararları geçersiz kılamaz.
- **Pedagojik referans:** [01-PRODUCT-VISION-AND-PRD.md](./ventra-language-v1/01-PRODUCT-VISION-AND-PRD.md), [03-GAME-DESIGN-DOCUMENT.md](./ventra-language-v1/03-GAME-DESIGN-DOCUMENT.md), [04-LEARNING-SYSTEM.md](./ventra-language-v1/04-LEARNING-SYSTEM.md). Eski durum etiketleri ve motor sürümü varsayımları güncel kod kanıtı değildir.
- **Olan biteni kanıtlama:** Kaynak kod, testler, CI ve gerçek kullanıcı kabulü. Tasarımsal hedefler tamamlanmış özellik olarak sunulmaz.
