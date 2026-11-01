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

**Oynanabilir dil bölgeleri:** Hayvan Çayırı (animals), Renk Korusu (colors), Sayı Vadisi (English numbers, düzeye göre 1–1000), **Lezzet Pazarı** (Food & Drinks; 45 kelimelik katalog, 3 sokak, 15 dil görevi). Aile Köyü ve Keşif Tapınağı sonraki dil içerikleridir.

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
