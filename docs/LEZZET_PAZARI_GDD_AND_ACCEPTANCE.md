# Lezzet Pazarı — Premium İngilizce Öğrenme GDD ve Kabul Planı

**Karar:** Ventra dil öğrenme uygulamasıdır. Bu bölge **Food & Drinks İngilizce** öğretir; para hesabı, bütçe veya mağaza işletmeciliği öğretmez. Kapsamın otoritesi: [Ürün Anayasası](./VENTRA_PRODUCT_CHARTER.md).

## Oynanabilir içerik
- Üç sokak: **Meyve & Sebze Sokağı**, **Fırın Meydanı**, **Kafe & Sofra**.
- Her sokakta 15 farklı İngilizce kelime; toplam **45** farklı kelime ve bağlamsal ürün.
- Her sokakta beş özgün dil görevi; toplam **15 görev / 45 yıldız**.
- Dört aşamalı kelime zorluk gösterimi yok; ürünlerde **Pre-A1 (8), A1 (12), A2 (15)** kelime tavanı ve sınıf 1–2 için Pre-A1 başlangıç havuzu.
- İlk keşif 6–8 ürün; tekrar oynanınca daha önce keşfedilmeyen ürünlere öncelik. İzleyen görevler daha önce hata yapılan kelimelere öncelik verir.
- Beş görev: **Keşfet** (sese/görsele dokunma), **Kelimeyi Bul** (görselden İngilizce yazım), **Dinle ve İşaret Et** (İngilizce ses→görsel), **Siparişi Anla** (müşteri cümlesi→doğru İngilizce yanıt balonu), **Sepeti Doldur** (iki sözcüklü İngilizce yönerge→çoklu ürünleri dokun/sürükle ile sepete koy).
- Aynı işlevin farklı görsel kopyaları değildir: keşif, görsel-sözcük tanıma, gerçek ses dinleme, cümle anlama ve çok adımlı dil uygulaması ayrıdır.
- Ürünler sınıf ve İngilizce seviyesiyle sınırlandırılır. Cümle dili sadece A1/A2'ye özgü gramer olarak **ölçülmüş** sayılmaz: kısa sipariş kalıbının anlaşılması uygulama kanıtıdır.
- İleri pazar sokakları ilk sokağın beş, ardından ikinci sokağın beş görevi tamamlanınca açılır; ilerleme çocuk profili bazındadır. Lezzet Pazarı, Sayı Vadisi'nin **ilk İngilizce sayı yolu** tamamlanınca açılır; 1000'e kadar sayıları bitirmek zorunlu değildir.

## Öğrenme kanıtları ve ekonomi
- Tek kanonik gameId: `island_word_garden_food`; bölüm id'leri 1–15. Eski üç bölgenin ID ve yıldızları korunur.
- Her cevap `FoodAnswerEvidence` kaydı: `wordId`, `kind`, `mistakes`, `firstTryCorrect`, `hintUsed`, `timestamp`.
- Keşif = maruz kalma, ustalık değil. Ses hiç başlamadıysa/destek açıldıysa bağımsız dinleme sayılmaz. Hinted answers independent mastery değildir.
- Hatalar tekrar planında öncelik; aynı kaydın bulutta tekrar gelmesi idempotent oturum kimliği üzerinden ele alınır.
- P3 raporu food domain ve becerileri içerir. P5 Maceracı Pasaportu 15 görev ve keşfedilen yiyecek sayısını gösterir; ilk kez tamamlanan benzersiz bölüm +10 coin, tekrar coin kazandırmaz. Gerçek parayla satış hâlâ kapalı.

## Görsel ve işitsel kalite
- Orijinal çevrimdışı SVG pazar sokağı arka planı, her sokak için renk teması, sepet ilerleme gösterimi, responsive 48px üzeri butonlar, durum/feedback ve ekran okuyucu etiketleri.
- Ürün kartları renkli emoji simgeleri; stüdyo seviyesi özgün yiyecek sprite/animasyon paketi **henüz yok**. Seslendirme cihazın `en-US` TTS desteğine bağlıdır, çevrimdışı WebView her zaman ses sağlayamayabilir. Ses yoksa yazılı ipucu/yardımla etkinlik tamamlanır fakat independent listening kanıtı verilmez.

## Teknik kabul
- [x] Kelime kataloğu ve deterministic seviye/yanlış tekrar planlayıcısı.
- [x] Aynı oyunu tekrar oynama, eski ilerleme/stars korunması, P3 ve P5 veri entegrasyonu.
- [x] Harita hotspot, kiosk ve öğrenme yolu arayüzü.
- [x] Okul ve ebeveyn profil izolasyonu: mevcut repo/cocuk event modelini yeniden kullanır.
- [x] CI son kod commit'i üzerinde TypeScript, uygulama testleri, production web, Android/iOS derlemesi. [Başarılı çalıştırma](https://github.com/ventragame/ventra/actions/runs/41318977803).
- [ ] **Gerçek** Android/iPhone'da ses, dokunmatik, offline, kesinti, font ve ekran okuyucu kabulü.
- [ ] 7–12 yaş çocuk kullanıcı oturumu: anlama, dinleme ve 7 gün sonra kelime kalıcılığı.
- [ ] Özgün ürün illüstrasyonları, profesyonel çevrimdışı İngilizce ses paketi; üretim yayın kararı öncesi kalite incelemesi.

**Önemli:** 45 kelime/15 görev olan kapsamlı bir oynanabilir bölümle, müzik/sanat/stüdyo ses/mobil çocuk kabulü tamamlanmış ticari yayın ürünü farklı şeylerdir.
