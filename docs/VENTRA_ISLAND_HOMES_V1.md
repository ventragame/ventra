# Ada ana sayfaları V1 — tek iskelet, altı kimlik (2026-11-28)

## Neden

Altı adanın ana sayfası altı ayrı ürün gibi görünüyordu. Her adada şunlar farklıydı:

- "kaldığın yerden devam" alanının olup olmadığı;
- ilerlemenin nasıl gösterildiği;
- kilit cümleleri ("Önceki Bölüm" / "Önceki Bölümü Bitir" / "Önceki bölümü tamamla");
- buton dili ("Oyuna Gir" / "Maceraya Gir" / "Kaldığın Yerden");
- görsel kalite: Yazı Atölyesi'nde emoji kartlar, Liman'da düz vektör Kaptan Leo.

Çocuk hangi adaya girerse girsin aynı yerleri aynı yerde bulmalı. Ada ise kendi rengi, sahnesi ve rehberiyle kendi dünyası gibi hissettirmeli.

## Ne aynı (iskelet)

`apps/web/src/components/learning/island/IslandHome.tsx` + `island-home.css`. Sunum kararları `lib/learning/islandHomeModel.ts` içinde; bu dosya hiçbir ilerleme kaydını okumaz ve yazmaz.

| Parça | Davranış |
|---|---|
| Üst bar | ← Adalar (44 px), ada arması, üst başlık, ada adı, seviye ve yıldız çipleri. Güvenli alan (çentik) payı içerir. |
| Kahraman kartı | Adanın boyalı sahnesi, rehber karakter, İngilizce karşılama balonu, sıradaki bölümün adı, ilerleme çubuğu ve tek büyük buton (Başla / Devam Et / Tekrar Oyna). |
| Bölüm kartları | Aynı ölçü ve aynı dört durum: tamamlandı ✓ · sıradaki ▶ (+"SIRADAKİ" şeridi) · açık ✦ · kilitli 🔒. Kart metinleri her adada aynı: "Tekrar oyna", "Şimdi oyna", "Kaldığın yerden", "Oyna", "Önceki bölümü bitir". |
| Yükleme ve hata | Okuma bitene kadar butonlar kapalıdır ve sayılar "…" olarak görünür; hiçbir zaman sahte 0/5 gösterilmez. Hata olursa uyarı ve "↻ Tekrar dene" çıkar (P2 kuralı). |
| Telefon (≤640 px) | Önce görsel, altında metin ve tam genişlikte buton. Kartlar tek sütunda yatay düzende: görsel solda, metin sağda. |

**Sıradaki bölümün seçimi (`islandHeroPlan`):**

1. Önce bu cihazda yarım kalmış bir tur varsa o seçilir. Kilitli bir bölümün eski kaydı sıranın önüne geçemez.
2. Yoksa açık olan ilk bitmemiş bölüm seçilir.
3. Her şey bittiyse 1. bölüm ve "Tekrar Oyna" gösterilir.

## Ne farklı (kimlik)

Her adanın kendine ait olanları:
- `data-island` ile belirlenen renk paleti (orman gündüz ve açık renkli; diğerleri koyu tonlarda);
- kahraman sahnesi;
- rehber karakter;
- ortam hareketi: meydanda altın kıvılcımlar, ormanda yaprak ve ateş böcekleri, limanda kabarcıklar, akademide parıldayan yıldızlar, atölyede sıcak ışıltılar.

| Ada | Kahraman sahnesi | Rehber | Bölümler |
|---|---|---|---|
| Cümle Meydanı (`story_castle`) | `kids-islands/story_castle.webp` | Hikâye Ormanı'nın boyalı köpeği | 6 görev, `sentence-plaza/v5` kapakları; Gör → Dinle → Kur → Canlandır adımları, kilitli 4 bölge |
| Hikâye Ormanı (`listening_forest`) | `story-forest/premium/scenes/forest_clearing.webp` | Maceracı tavşan | 3 oyun (hepsi açık); kartlarda canlı boyalı karakterler; ilerleme 18 hikâye |
| Diyalog Limanı (`speaking_harbor`) | `kids-islands/speaking_harbor.webp` | **Boyalı Kaptan Leo (yeni)** | 5 bölüm, liman sahneleri; yetişkin ses ayarları ebeveyn kapısının arkasında |
| Yazı Atölyesi (`sentence_workshop`) | `kids-islands/sentence_workshop.webp` | **Postacı kedi (yeni)** | 5 bölüm, **boyalı bölüm sahneleri (yeni)**; serbest metnin saklanmadığı notu |
| Keşif Akademisi (`language_academy`) | `kids-islands/language_academy.webp` | Hayvan Çayırı'nın boyalı baykuşu | 6 durak; "bugünün keşif önerisi" paneli |
| Kelime Bahçesi (`word_garden`) | (kendi merkezi korunur) | — | Yalnızca üst bara karşılama düğmesi eklendi |

## Varış anı

- **Sıralı giriş animasyonu:** üst bar iner; kahraman kartı açılır; sahne 1,2 kattan 1,04 kata yaklaşarak netleşir ve ardından çok yavaş kayar. Rehber zıplayarak gelir, balon belirir, metinler ve kartlar sırayla yükselir.
- **Derinlik efekti:** yalnızca fareyle çalışır. Sahne ve rehber, imlece göre ters yönde hafifçe kayar. Dokunmatik ekranda hareket yoktur.
- **İngilizce karşılama:** her ada için A1 düzeyinde kısa bir cümle ve Türkçe anlamı, `ISLAND_GREETINGS` içinde. Örneğin "Welcome to the harbor, sailor!". Liman'da bilerek "Hello" yok, çünkü 1. bölümün ilk sorusunun cevabı "Hello!".
  - Uygulama oturumu başına bir kez, girişten 0,95 sn sonra kendiliğinden okunur; 🔊 düğmesi tekrar okur.
  - `soundService.speakEnglish` kullanılır. Merkezi sessiz modu, ses düzeyini ve mikrofonun açık olup olmadığını dikkate alır.
  - Değerlendirilen hiçbir cevabı söylemez ve hiçbir kayıt tutmaz.
- **Azaltılmış hareket:** tüm animasyonlar ve geçişler kapanır; sahne sabit durur.

## Liman kadrosu: Lottie'den boyalı görsele

`HarborCharacterAvatar` artık düz vektör Lottie kuklası değil, boyalı WebP kullanıyor. Kadro ve görseller:

| Karakter | Görsel |
|---|---|
| Kaptan Leo | `characters/painted/harbor-leo.webp` (yeni) |
| Denizci Luna | `characters/painted/harbor-luna.webp` (yeni) |
| Mimi | Hayvan Çayırı'ndaki papağan |
| Nino | Hayvan Çayırı'ndaki kaplumbağa |
| Liman esnafı | Hikâye Ormanı'ndaki tilki |

**Duygular beden diliyle verilir:**
- CSS döngüleri: nefes alma (idle), konuşma salınımı (talk), dinlerken eğilme (listen).
- Tek seferlik tepkiler (Web Animations): sevinç zıplaması (happy), hafif baş sallama (try_again), kutlama sıçraması (celebrate). Yeni bir tepki gelince eskisi iptal edilir.

**Bilerek verilen ödün:** Eski kuklalarda ayrı ağız ve göz katmanları vardı (dudak hareketi). Boyalı görselde dudak senkronu yok; konuşma vücut salınımıyla gösteriliyor. Bu tercih, Hikâye Ormanı'ndaki boyalı karakterlerle aynı. Eski 5 JSON ve 5 SVG kaldırıldı. `meadow-owl` ve `village-fox` Lottie'leri başka oyunlarda kullanıldığı için duruyor.

## Üretilen görseller

- **Yöntem:** Yerel SDXL base 1.0 (CreativeML Open RAIL++-M), sdxl-vae-fp16-fix (MIT) ve h94 IP-Adapter SDXL (Apache-2.0).
  - Yalnızca stil blokları kullanıldı; karakterlerin dekupajı rembg BiRefNet-lite (MIT) ile yapıldı.
  - İş tanımı: `C:\tmp\ventra-imagegen\make_island_jobs.py`.
  - Karakterlerin stil referansı mevcut boyalı karakter tabakalarıdır. Bölüm sahnelerinin stil referansı `kids-islands/sentence_workshop.webp`'tir (style 0.5).
- **Seçim kriterleri:** doğru tür ve kıyafet; tam vücut; fazla uzuv olmaması; çocuk dostu yüz; sahnelerde okunabilir sahte yazı olmaması (negatif istemde text/letters/words var).

| Dosya | İş / tohum | Konu |
|---|---|---|
| `characters/painted/harbor-leo.webp` (595×768, 57 KB) | leo / 606 · style_cool 0.6 | Sakallı, lacivert-beyaz ceketli, el sallayan kaptan |
| `characters/painted/harbor-luna.webp` (434×768, 44 KB) | luna / 303 · style_cool 0.6 | Denizci şapkalı, çizgili gömlekli beyaz tavşan |
| `characters/painted/writing-postcat.webp` (451×768, 58 KB) | postcat / 202 · style_sheet 0.65 | Mavi şapkalı, elinde zarf olan turuncu tekir postacı |
| `writing-workshop/chapter-1.webp` (960×540) | ch1_post / 404 | Kırmızı posta kutulu, raflı postane içi |
| `writing-workshop/chapter-2.webp` | ch2_friends / 303 | Kalp çıkartmalı defter, oyuncak ayı, boya kalemleri |
| `writing-workshop/chapter-3.webp` | ch3_postcards / 404 | Masada kartpostallar ve suluboya |
| `writing-workshop/chapter-4.webp` | ch4_harbor / 202 | İskelede mektup yığınları, martı, deniz feneri |
| `writing-workshop/chapter-5.webp` | ch5_storybook / 404 | Açık kitaptan yükselen şato, şelale, gökkuşağı |

Her konu için 6 karakter ya da 4 sahne adayı üretildi. Elenenler arasında yarım boy kaptan, yerde duran ikinci bir şapka, bir karede birden çok karakter ve ayrı duran çapa vardı.
- Leo'nun göğsündeki büyük madalyonda belirsiz bir işaret var; okunabilir bir yazı değil.
- Postacı kedinin şapkası, Hikâye Ormanı'ndaki kediden farklı bir karakter olduğunu gösteriyor.

## Değişmeyenler

- Oyun kimlikleri, seviye kimlikleri, ilerleme kaydı, yıldız ve kilit kuralları, kontrol noktaları, ebeveyn kapısı, ses ve mikrofon kuralları. Ana sayfa yalnızca sunum katmanı.
- Ada oyun ekranları (ders, oyun, sonuç) kendi başlıklarını ve sahnelerini koruyor.

## Doğrulama ve açık riskler

- Tarayıcı kontrolü (Chrome, Playwright; 1440×900 ve 390×844): beş ada ana sayfası açıldı, önerilen bölüme girildi ve geri dönüldü; kırık görsel, yatay taşma ve 44 px altı düğme yok.
- Gerçek Android/iOS cihazda ve gerçek çocuk kullanıcıyla deneme yapılmadı.
- Sesli karşılama yalnızca masaüstü Chrome'un konuşma sentezine bağlı; cihaz TTS'i cihazda denenmeli.
- Kelime Bahçesi'nin merkezi yeni iskelete taşınmadı; yalnızca karşılama düğmesi eklendi. Telefonda üst bar dolu olduğu için düğme gizli, karşılama sesi yine çalıyor.
- Eski ada ana sayfalarına ait bazı CSS kuralları (harbor/writing/academy/story dosyalarında) artık kullanılmıyor. Cümle Meydanı'nın iki ana sayfa CSS dosyası tamamen silindi; diğerleri karışık dosyalarda kaldı.
