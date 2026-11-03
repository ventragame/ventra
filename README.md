# Ventra — Oyunlaştırılmış Dil Öğrenme Platformu

> **Ürün odağı: DİL ÖĞRENİMİ (ilk hedef İngilizce).**
> Ventra genel bir matematik/STEM/eğitsel oyun koleksiyonu değildir.
> Yeni bir oyun, öncelikle **İngilizce kelime, ifade, dinleme, anlama veya kullanma becerisi** öğretmelidir.

**Kodlamaya veya yeni bir dünya önermeye başlamadan önce:**
1. [**Ürün Kimliği ve Kapsam Kararları — KANONİK**](docs/VENTRA_PRODUCT_CHARTER.md)
2. [**Ürün Yol Haritası**](docs/PRODUCT_ROADMAP.md)
3. [**Dil Öğrenme Vizyonu ve PRD**](docs/ventra-language-v1/01-PRODUCT-VISION-AND-PRD.md)
4. [**Dil Öğrenme GDD'si**](docs/ventra-language-v1/03-GAME-DESIGN-DOCUMENT.md)
5. [**Kodlama Ajanları için Talimatlar**](AGENTS.md)

## Ürün nedir?

Ventra'nın **Kids World (7–12 yaş)** deneyiminde çocuk, haritadaki oyun bölgelerini keşfeder; görsel, ses ve eylemlerle İngilizce kelime/ifadeleri öğrenir. P3 öğrenme motoru yeni öğrenilenleri, ipuçlarını, bağımsız yanıtları ve tekrar ihtiyacını takip eder. Aile ve okul hesapları aynı öğrenim dünyasına farklı erişim ve raporlama yollarıdır.

**Oynanabilir dil bölgeleri:** Hayvan Çayırı (animals), Renk Korusu (colors), Sayı Vadisi (English numbers, düzeye göre 1–1000), **Lezzet Pazarı** (Food & Drinks; 45 kelime, 3 sokak, 15 görev) ve **Aile Köyü** (Family/Home/Routines; 60 kavram, 4 mahalle, 20 dil görevi). **Keşif Tapınağı** (önceki 190 İngilizce kavramdan seçilen birleşik içerik, 5 salon, 25 görev, 75 yıldız) final dünyası olarak oynanabilir.

Lezzet Pazarı'nda çocuk İngilizce "apple", "bread", "milk" gibi sözcükleri keşfedecek, sesi tanıyacak, doğru ürünü sahnede seçecek ve "I want an apple" gibi ifadeleri kullanacaktır. **Para üstü, bütçe ve mağaza ekonomisi öğretmek bu projenin hedefi değildir.**

**Gelecek vizyonu:** 13+ Life World yine dil öğrenimi içindir; matematik/mühendislik oyun platformuna dönüşüm planlanmamıştır.

## Yerel geliştirme

```bash
npm ci
npm run dev:web
```

Yerel web arayüzü geliştirme sunucusunda başlar. Ortam değişkenleri ve gerçek Supabase entegrasyonu için projeye özel yapılandırma gereklidir; gizli anahtarlar Git'e eklenmez.

Önemli komutlar:

```bash
npm run type-check
npm run build:web
npm run export:mobile
```

Mobil cihaz ve gerçek çocuk/ebeveyn kabul testleri CI'nin yerini tutar; derlemenin geçmesi ürünün mağazaya hazır olduğu anlamına gelmez.

## Ürün geliştirme ilkeleri

- Dil hedefi olmadan bir mini oyun ekleme. Eğlence, ölçülebilir **dil becerisini** desteklemeli.
- Yaşa/seviyeye uygun İngilizce; ilk öğrenme ile ustalık ayrı; dinleme kanıtı gerçek ses olmadan verilmez.
- Çevrimdışı ilerleme, mevcut çocuk profilleri, stars/coins, RLS ve ebeveyn onayı korunur.
- Yeni bölge için önce GDD ve kelime/ifade müfredatı, sonra etkileşim ve görseller, sonra kod/test/kabul.
- Ürün yönünü değiştirecek öneri, ürün sahibinin açık onayı ve tarihli karar kaydı olmadan uygulanmaz.

Daha ayrıntılı kurallar: [VENTRA_PRODUCT_CHARTER.md](docs/VENTRA_PRODUCT_CHARTER.md).

### G1.5–G1.6 ve G2 kabul durumu (01.11.2026)
- Lezzet Pazarı'nda ürün kartlarının SVG sahne çerçeveleri yenilendi; dinleme başarısı sesin tamamlanmasını bekler. Her yaş/düzeyde tüm uygun kelimeler tekrar oturumlarıyla keşfedilebilir.
- Aile Köyü 60 İngilizce kavram, 20 oynanabilir görev, dört özgün SVG ev/mahalle sahnesi, P3 ve P5 oyun kanıtları ile kodlandı.
- **Otomatik doğrulama:** [GitHub Actions 41329515175](https://github.com/ventragame/ventra/actions/runs/41329515175). TypeScript, testler, web, Android debug APK ve iOS Simulator başarıyla derlendi.
- **Eksik kullanıcı kabulü:** gerçek telefon/tablet testleri, profesyonel özgün ürün çizimleri/ses paketi, çocuklarla kullanım ve kalıcılık testi. Emoji kullanılan sahneler nedeniyle kod başarılı olsa da tam stüdyo sanatı bitmiş sayılmaz.
- [GDD ve kabul raporu](docs/G1_5_G1_6_G2_FAMILY_VILLAGE_ACCEPTANCE.md).

### G3 Keşif Tapınağı (01.11.2026)
- Beş salon: Rün Ormanı, Yankı Galerisi, Bereket Salonu, Hatıra Odaları ve Kristal Taht. Toplam **25 İngilizce görev**: rün keşfi, yazı eşleştirme, tam ses dinleme, kelimeleri doğru sırayla İngilizce cümle kurma ve ikili mühürlü final.
- 40 hayvan SVG'si ve 5 orijinal vektör tapınak sahnesi, düzeye göre kelime havuzu, yanlış kelimeleri yeniden sorma, bağımsız/ipuçlu yanıt ayrımı, yıldız/coin ve çocuk profili kayıtları.
- [CI #41333293845](https://github.com/ventragame/ventra/actions/runs/41333293845): **140/140 test, TypeScript, web, Android debug APK ve iOS Simulator PASS**. Gerçek cihaz/çocuk pedagojik kabulü ve profesyonel offline ses/sprite çalışmaları açık.
- [G3 tasarım, sınır ve kabul belgesi](docs/G3_TEMPLE_PREMIUM_GDD_AND_ACCEPTANCE.md).

### M1 — Kelime Bahçesi premium keşif haritası (01.11.2026)
- Altı ayrı orijinal Phaser landmark girişi ve responsive SVG dünya kartları; parıltılı, katmanlı dünya yüzeyi, masaüstü tüm-dünya görünümü, mobil karakter takibi, hover/kamera yaklaşması.
- Gerçek çocuk profili görev/yıldız ilerlemesi ve mevcut coin bakiyesi; Maceracı Pasaportu/günlük görev erişimi. `GardenWorldArt.ts` ve `gardenTheme.ts` görsel ve durum sözleşmeleridir.
- [M1 harita kabul ve kontrol rehberi](docs/M1_WORD_GARDEN_PREMIUM_MAP_ACCEPTANCE.md). Yeni SQL yok, mağaza dağıtımı yok. Fiziksel cihaz görsel kabulü açık.

### English Learning Journey v2 (02.11.2026)
Altı büyük adanın yeni öğrenme sırası: **Kelime Bahçesi → Cümle Meydanı → Hikâye Ormanı → Diyalog Limanı → Yazı Atölyesi → Keşif Akademisi**. Sadece Kelime Bahçesi oynanabilir; sonraki beşi konsept ve müfredat sözleşmesi olarak belirlendi. Kayıt/görsel asset ID'leri değişmedi.

Kelime Bahçesi'nde çocuk profili sınıfı ve İngilizce seviyesi bağımsız uygulanır. Sınıf ve seviye aynı şey değildir. Kataloglar sınıf düzeyi+Pre-A1/A1/A2 filtresiyle sınırlandırılır, P3 tekrar ve ilerleme kayıtları korunur.

> **Her yeni sprint öncesi:** [English Learning Journey v2 — Canonical GDD, fazlar ve kalite kapıları](docs/VENTRA_ENGLISH_LEARNING_JOURNEY_V2.md) belgesini oku. Resmî müfredat eşleşmesi ve gerçek çocuk testleri henüz doğrulanmadı.

### CM1 — Cümle Meydanı / Uyanan Meydan (02.11.2026)
Cümle Meydanı'nın **ilk bölgesi** kullanıma açıldı: 6 sıralı İngilizce cümle görevi, özgün etkileşimli SVG şehir sahnesi, sınıf/Pre-A1/A1/A2 duyarlı cümle şablonları, isteğe bağlı ses ve ipuçları, yanlışları ayrı kaydetme, otomatik soru akışı, profil bazlı kalıcı ilerleme ve tekrar oynanabilirlik. Sadece ilk bölge; diğer dört bölge açık değil. [GDD, müfredat ve kabul](docs/CM1_UYANAN_MEYDAN_GDD_ACCEPTANCE.md).

**Cümle Meydanı CM1 v2:** Yaşa uygun 3/4/5 görev ve kelime uzunluğu tavanları, Pre-A1/A1/A2 ayrı dil politikası, sekiz iletişim işlevi, cümle kurma / hata onarma / sahne anlamını eşleştirme. Kelime Bahçesi'ndeki tanınan sözcükler seçimde öncelik alır. Tamamlanan ilk bölümün kayıtları korunur. [Ayrıntılı kabul](docs/CM1_UYANAN_MEYDAN_GDD_ACCEPTANCE.md).

**Hareket Büyüsü 2.0 (Cümle Meydanı, 03.11.2026):** İlk ada bölümünün dördüncü görevi dört aşamalı gerçek oyun deneyimine dönüştürüldü: karakter hareketini seç, sahnede hedefe dokun, hatalı İngilizceyi onar, finalde hepsini birleştir. Sınıf ve İngilizce seviyesi ayrı, süre cezası yok, yıldızlar aynı kayıtta. [Oyun tasarımı ve kabul planı](docs/CM1_HAREKET_BUYUSU_V2.md).

**Hareket Büyüsü aynı cihazda devam:** 12–20 soruluk oturumun ortasında çıkıldığında yarım kalan bölüm tarayıcıda saklanır; ilerleme ve yıldızlar yalnızca bütün bölüm tamamlanınca mevcut profile kaydedilir. Farklı cihazda yarım oturum devri henüz yoktur.

**İstekler Meydanı 2.0 / Dilekler Festivali (03.11.2026):** Cümle Meydanı'nın 5. görevinde dört ayrı dil-oyun dünyası (beğeni, kibar sipariş, diyalog, karşılaştırmalı festival), 8 resimli yiyecek, 4 karakter, 12–20 görev, sınıf ve Pre-A1/A1/A2 ayrı politikası, sahne tepkisi ve duraklat-devam. Mevcut 5. seviye ve yıldız kimliği korunur. [GDD ve kalite kabul](docs/CM1_ISTEKLER_MEYDANI_PREMIUM_GDD.md).
