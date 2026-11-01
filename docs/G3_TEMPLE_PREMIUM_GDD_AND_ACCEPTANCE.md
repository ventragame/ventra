# G3 — Keşif Tapınağı: İngilizce Final Dünyası / GDD & Kabul

**Ürün ilkesi:** Ventra oyunlaştırılmış **İngilizce öğrenme** platformudur. Keşif Tapınağı, Hayvan Çayırı, Renk Korusu, Sayı Vadisi, Lezzet Pazarı ve Aile Köyü'nden gelen İngilizce kazanımları yeni bağlamlarda uygulayan bir dil macerasıdır. **Bağımsız matematik, ekonomi, mühendislik veya genel escape-room oyunu değildir.**

## Ürün ve içerik
- **Beş tapınak salonu × beş görev = 25 tamamlama bölümü**, en çok **75 yıldız**, ilk kez tamamlanan bölümlerden toplam **250 kazanılan kozmetik Ventra Coin**. Coin satışı kapalıdır.
- **190 önceki İngilizce kavramın birleşik seçim havuzu:** Hayvan Çayırı 40, Renk Korusu 10, Sayı Vadisi 35 seçilmiş sayı örneği, Lezzet Pazarı 45, Aile Köyü 60. İngilizce/İngilizce olmayan türden yeni eğitim alanı eklenmez.
- **Rün Ormanı:** Animals & Colours; **Yankı Galerisi:** Numbers & Listening; **Bereket Salonu:** Food & Requests; **Hatıra Odaları:** Family & Home; **Kristal Taht:** Tüm beş alandan İngilizce finali.
- Her salonda sırasıyla **Kayıp Rünler** (8 veya 6 sembolü keşfet, öğren), **Gizemli Yazıt** (Türkçe anlam→İngilizce seçim), **Yankı Kristalleri** (tamamlanan İngilizce TTS→doğru sembol), **Cümle Köprüsü** (en az dört İngilizce kelime/işareti doğru sıraya diz), **Mühür Kapısı** (üç çift, altı İngilizce öğe; sıralı sembol toplama).
- Pre-A1/1–2. sınıf ilk kelime bantları ve 6 keşif / 4 soru; A1/3–4. sınıf orta bantlar, A2/5–8. sınıf geniş seçim. Sınıf = içerik tercihidir, gerçek dil seviye ölçümü değildir.
- Öğrencinin daha önce hata yaptığı/ipuçlu yanıtladığı kelimeler soru planlamasında önceliklidir. Tapınağın başlangıcında diğer oyunların tamamlanması **zorunlu değil**, tapınağın kendi salonları ve görevleri sırayla açılır.
- Farklı öğrenme alanlarından **aynı İngilizce yazımı/çevirisi olan** kavramlar (ör. orange, fish) aynı soruda yanıltıcı veya çift doğru olarak verilmez; testle korunur.
- İngilizce cümle örnekleri "I can see an owl.", "I would like an apple.", "This is my mother.", "Every day, I wake up."; cümle kurma çocuk için metin sıralama görevidir, sesli konuşma puanlaması değildir.

## Görsel ve oyun etkileşimi
- Beş ayrı tematik renk ve anlatım, **özgün kodla çizilmiş offline SVG tapınak girişleri**, kristaller, sütunlar, parlayan mühürler ve ilerleme göstergeleri.
- Hayvanlar için repoda varlığı doğrulanmış **40 premium SVG** illüstrasyon kullanılır. Renkler görsel kristaller, sayılar sayı rünleri, ev/gıda kalan simgelerle sunulur.
- Tam profesyonel sprite/animasyon paketi, sabit seslendirme ve sahne soundtrack'i **henüz uygulanmadı**. Mevcut cihazın Web Speech API İngilizce TTS kalitesi ve offline kapasitesi değişebilir.
- Dokunmatik/mobil ve klavye için semantik butonlar, erişilebilir durum/progress metinleri, az hareket isteğine saygı gösteren CSS. Ekran okuyucu ve gerçek cihaz kabulü açıktır.

## İlerleme ve pedagojik ölçme
- Tek kalıcı oyun anahtarı: `island_word_garden_temple`; levelId 1–25. Önceki tüm gameId ve çocuk profilleri korunur.
- Her yanıt `TempleAnswerEvidence`: `wordId`, `sourceDomain`, `kind`, `mistakes`, `firstTryCorrect`, `hintUsed`, `timestamp`; veri yalnızca mevcut çocuk profiline bağlanır.
- **Keşif=maruz kalma; ustalık değildir.** İpucu, yanlış deneme veya duyulmamış konuşma bağımsız dinleme/recall kanıtı değildir.
- P3 raporunda Temple/transfer İngilizce becerileri mevcut dünya becerilerinden **ayrı** tutulur. Tekrar oyun kayıtlarının/coin kazanımlarının idempotency ve best stars mantığı mevcut depoyu kullanır.
- Oyun alanında yeni parasal işlem yok; Google Play Billing/iOS IAP bu G3 kapsamına eklenmedi.

## Test / yayın kabul kapıları
- [x] 5 salon × 5 görev, 190 kavram, sınıf/dil düzeyi havuzu ve deterministik soru planları.
- [x] 25 aşamalı tam ilerleme, gelecekteki aşamanın kilidi, profil izolasyonu, 75 yıldız / 250 coin, tekrar coin verilmemesi.
- [x] İpucu/hata/ses tamamlama ve sentence/seal görevlerinin yapısal testleri.
- [x] Aynı İngilizce yazımlı iki doğru yanıt riskine karşı çoklu seed ile regresyon.
- [x] [GitHub Actions #41333293845](https://github.com/ventragame/ventra/actions/runs/41333293845): **140/140 test, TypeScript, web production, statik mobile, Android debug APK, iOS Simulator PASS**.
- [ ] Gerçek Android/iPhone/tablet üzerinde ses, font, ses kesilmesi, touch/pointer, güvenli alan ve eski oturumdan devam kabulü.
- [ ] Gerçek çocuklarla 5 salon oynanabilirlik süresi, kendi başına ilerleme ve 7 gün sonra kalıcılık analizi.
- [ ] Çok cihazlı gerçek Supabase offline/online merge, rol/profil izolasyonu, bağlantı kaybı kabulü.
- [ ] Stüdyo kalitesinde tüm rün/nesne çizimleri, tutarlı özgün animasyonlar, profesyonel offline İngilizce ses.
- [ ] Yayın öncesi dependency security audit, Google Play/Apple çocuk ürünleri ve gerçek satın alım politika kontrolü.

**Sonuç:** G3 kodu oynanabilir ve CI başarılı; fiziksel cihaz ve ticari yayın kabulü yapılmış değildir.
