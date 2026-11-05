# Lezzet Pazarı — Premium İngilizce Öğrenme GDD ve Kabul Planı

**Karar:** Ventra dil öğrenme uygulamasıdır. Bu bölge **Food & Drinks İngilizce** öğretir; para hesabı, bütçe veya mağaza işletmeciliği öğretmez. Kapsamın otoritesi: [Ürün Anayasası](./VENTRA_PRODUCT_CHARTER.md).

## Oynanabilir içerik
- Üç sokak: **Meyve & Sebze Sokağı**, **Fırın Meydanı**, **Kafe & Sofra**.
- Her sokakta 15 farklı İngilizce kelime; toplam **45** farklı kelime ve bağlamsal ürün.
- Her sokakta beş özgün dil görevi; toplam **15 görev / 45 yıldız**.
- Dört aşamalı kelime zorluk gösterimi yok; ürünlerde **Pre-A1 (8), A1 (12), A2 (15)** kelime tavanı ve sınıf 1–2 için Pre-A1 başlangıç havuzu.
- İlk keşif 6–8 ürün; tekrar oynanınca daha önce keşfedilmeyen ürünlere öncelik. İzleyen görevler daha önce hata yapılan kelimelere öncelik verir.
- Beş görev: **Keşfet** (sese/görsele dokunma), **Kelimeyi Bul** (üstte tek görsel → cevapta yalnızca İngilizce metin; resim-resim kopyası yok), **Dinle ve İşaret Et** (tek kelime ses→yalnızca görsel; yazı sadece bağımsız sayılmayan destek olarak gösterilir), **Siparişi Anla** (müşterinin sesli İngilizce cümlesi→ürün görseli; yazılı sipariş yalnızca destek modunda görünür), **Sepeti Doldur** (FIRST/THEN sırası açık iki ürünlük İngilizce yönerge→etiketsiz görsel tezgâhından dokun/sürükle ile sırayla sepete koy).
- Aynı işlevin farklı görsel kopyaları değildir: keşif, görsel-sözcük tanıma, gerçek ses dinleme, cümle anlama ve çok adımlı dil uygulaması ayrıdır.
- Ürünler sınıf ve İngilizce seviyesiyle sınırlandırılır. Cümle dili sadece A1/A2'ye özgü gramer olarak **ölçülmüş** sayılmaz: kısa sipariş kalıbının anlaşılması uygulama kanıtıdır.
- İleri pazar sokakları ilk sokağın beş, ardından ikinci sokağın beş görevi tamamlanınca açılır; ilerleme çocuk profili bazındadır. **Lezzet Pazarı doğrudan oynanabilir:** Diğer dil dünyalarını tamamlama koşulu yoktur. Pazarın kendi üç sokağı ve 15 göreviyse pedagojik sırayla açılır.

## Öğrenme kanıtları ve ekonomi
- Tek kanonik gameId: `island_word_garden_food`; bölüm id'leri 1–15. Eski üç bölgenin ID ve yıldızları korunur.
- Her cevap `FoodAnswerEvidence` kaydı: `wordId`, `kind`, `mistakes`, `firstTryCorrect`, `hintUsed`, `timestamp`.
- Keşif = maruz kalma, ustalık değil. Ses hiç başlamadıysa/destek açıldıysa bağımsız dinleme sayılmaz. Hinted answers independent mastery değildir.
- Hatalar tekrar planında öncelik; aynı kaydın bulutta tekrar gelmesi idempotent oturum kimliği üzerinden ele alınır. Yanlış cevaplar aynı soruda tekrar tıklanarak ceza şişirmez; ipucu veya ses yardımı alınmış cevaplar tam bağımsız 3 yıldız sayılmaz.
- P3 raporu food domain ve becerileri içerir. P5 Maceracı Pasaportu 15 görev ve keşfedilen yiyecek sayısını gösterir; ilk kez tamamlanan benzersiz bölüm +10 coin, tekrar coin kazandırmaz. Gerçek parayla satış hâlâ kapalı.

## Görsel ve işitsel kalite
- Orijinal çevrimdışı SVG pazar sokağı arka planı, her sokak için renk teması, sepet ilerleme gösterimi, responsive 48px üzeri butonlar, durum/feedback ve ekran okuyucu etiketleri.
- V4 ile üç çevrimdışı SVG pazar arka planı ve 45 ayrı ürün çizimi içeren yerel SVG sprite dosyası geldi. V5, cevap yüzeyini *gösterilen beceriyi ölçme* ilkesine göre yeniden düzenledi: aynı ürün soruda ve cevapta tekrar görsel olarak gösterilmez; müşteri siparişindeki kelime cevapta basılı görünmez. Gerçek 3D render/stüdyo ses paketi mevcut değildir. Ses cihaz TTS hizmetine bağlıdır; konuşma yoksa yazılı destekle tamamlanan cevap bağımsız dinleme olarak kaydedilmez.


## V5 — Karıştırılmaması gereken ölçüm kanalları

| Görev | Uyarıcı | Seçenek | İpucu sayılacak destek |
|---|---|---|---|
| Keşif | Görsel | Ürüne dokunma | Değerlendirme değil, maruziyet |
| Kelime tanıma | **Tek görsel** | **Yalnız İngilizce sözcükler** | Kelimenin telaffuzu / ilk harf |
| Dinleme | **İngilizce kelime sesi** | **Etiketsiz ürün görselleri** | Yazılı kelimenin açılması |
| Müşteri diyaloğu | **İngilizce istek cümlesinin sesi** | **Etiketsiz ürün görselleri** | Cümlenin yazılı açılması |
| Sipariş/sepet | **FIRST / THEN sıralı İngilizce iki ürünlük metin** | **Etiketsiz ürün görselleri** | Söyleniş / Türkçe ipucu |

- Ekran okuyucular için ürünün Türkçe adı erişilebilir isimde bulunur. Bu, görsel kullanamayan çocukların seçenekleri ayırt edebilmesine yardımcı olur; ekran okuyucuyla gerçekleştirilen yanıtların bağımsız görsel tanıma ölçümü olarak yorumlanmaması gerekir. Mevcut kanıt şeması bu ayrımı otomatik kaydedemez.
- Görev 2'de doğru sözcük, cevap verilmeden önce resmin altında görünmez. Görev 4'te müşterinin istediği nesnenin İngilizcesi hem cümlede hem cevap kartında birden yazmaz. A2 ve 5. sınıf ve üzerindeki bazı siparişlerde istenen ürün ile reddedilen ürün aynı sesli cümlede bulunur; yalnızca tek bir kelimeyi yakalamak yeterli değildir.
- Görev 5'te sıranın neden gerekli olduğu çocuk için anlaşılır hale getirildi. Yanlış ürün defalarca seçilerek yeni yanlış sayısı oluşturulamaz.
- İlk aşama dışındaki soru oturumlarında, bağımsız yanıtı destekten ayırmak için `hintUsed` ve `firstTryCorrect` bilgileri korunur. Kayıt formatı, gameId ve ödül idempotency değişmez.

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
