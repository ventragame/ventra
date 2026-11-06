# Aile Köyü V3 — Görsel, pedagojik ve mobil kabul

## Teslim edilen kapsam

- Dört farklı yerel, çevrimdışı SVG sahne (Aile Evi, Oda Kaşifleri, Eşya Avı, Bir Günüm), tek evin rengini değiştiren varyasyonlar değil.
- **60 ayrı kavrama** ait, bütünlüklü renk/gölge sisteminde 60 yerel SVG sembolü. Piktogramlar `public/assets/family-village/family-word-sprite-v3.svg` içinden kullanılır; emoji fallback ve dış görsel sunucusu kullanılmaz.
- Dar ekranda kısa başlık, yatay taşmayan 4 mahalle/5 görev navigasyonu, büyük dokunma alanları, baskın ürün kartları ve yeniden tasarlanmış sonuç sayfası.
- Görev 1: 6–8 nesne keşfet; zaten keşfedilen karta yeniden dokununca ses tekrar çalar ama kanıt **bir kez** eklenir. Son karttan sonra görev otomatik kaydedilir.
- Görev 2: büyük görsel (aile ilişkileri için ayrıca Türkçe ilişki etiketi) → yalnızca İngilizce kelime seçenekleri.
- Görev 3: tamamlanmış İngilizce ses → görsel seçenekleri. Aile üyelerinde ilişkiler yalnızca görselden güvenilir biçimde anlaşılamadığı için **Türkçe aile bağı etiketi** de kullanılır; sırf çizime göre akrabalık sınavı yapılmaz.
- Görev 4: İngilizce yönerge → görsel seçenekleri, A2/5. sınıf ve üzerinde (ev/eşya mahallelerinde) yer yer *Don't touch X; touch Y* karşılaştırmalı yönergeler.
- Görev 5: büyük görsel → doğru İngilizce cümle; aile ilişkilerinde ilişki etiketi eklenir. Çocuk boşlukta rastgele tahmin etmeye zorlanmaz.
- Seste ortak `soundService.hasEnglishSpeech()` kullanılmaktadır; desteklenmiyorsa yazılı fallback açılır. Başarılı dinleme kaydı **sadece sesin bitmesinden sonra** veya `hintUsed` destekli fallback ile olur.
- Tekrar tıklanan yanlış cevap yeniden hata sayılmaz, hızlı çift dokunuş çift kanıt eklemez. İpucu ve cevap veren telaffuz sesi kullanımı `hintUsed` olarak kaydedilir ve üç yıldız için bağımsız başarı sayılmaz.

## Değişmeyenler

- Kanonik `gameId`: `island_word_garden_family`; 20 bölüm, 60 kavram, maksimum 60 yıldız, 200 ilk kez tamamlanan bölüm coin ödülü.
- Pre-A1 / A1 / A2 sınıf kısıtları, adaptif zayıf kelime tekrarı, ilerleme kayıt şeması, çocuk profiline özgü olaylar, kilit açma ve idempotent session ID korunur.
- Ses kaydı/mikrofondan gerçek telaffuz ölçümü, stüdyo seslendirmesi ve öğretmen tarafından onaylanmış pedagojik değerlendirme bu commit ile eklenmemiştir.

## Kabul testleri

- [ ] TypeScript type-check, full `test:ci`, production web ve statik mobil build PASS.
- [ ] Android debug APK ve iOS Simulator build PASS.
- [ ] Android gerçek cihaz + iOS Safari/Capacitor: dört görsel sahne ve 60 kelime ikonunun dış SVG `<use>` ile doğru çizimi.
- [ ] 320, 360, 390, 430px / landscape: taşıp kesilen soru, sekme, kart ve güvenli ekran alanı yok.
- [ ] İlk keşif son kartta otomatik kayıt; başarısız kayıt/retry sonrası tekrar ödül kazanılmıyor.
- [ ] Sesli/sessiz kullanım, background/foreground ses kesilmesi, offline TTS fallback ve destekli cevap kanıtı.
- [ ] 1. sınıf Pre-A1 / 4. sınıf A1 / 7. sınıf A2: 4 mahalle erişimi, çeldirici kalitesi, sıralı unlock.
- [ ] Ebeveyn/okul farklı çocuk profillerinde öğrenme geçmişi ayrışması ve bulut yedek.
- [ ] 7–12 yaş öğrenci testi ve 7 gün sonra öğrenme kalıcılığı.

**Not:** 60 özgün vektör ikonun hepsinin pedagojik temsil gücü eşit değildir. Özellikle *cousin/aunt/daughter* gibi akrabalık ilişkilerini tek bir portreden ayırt etmek mümkün değildir. Bu yüzden soru tasarımında ilişki etiketleri gerekir. CI, gerçek kullanıcı testinin yerine geçmez. Production'a otomatik deployment bu görev kapsamında yapılmaz.

### G3.2 tamamlayıcı akış denetimi
- Keşifte son kartın telaffuzu tamamlanmadan sonuç ekranına otomatik geçilmez (en fazla ortak hook ses bekleme sınırı uygulanır).
- Keşfedilen karta tekrar dokunularak aynı kelimenin telaffuzu yenilenebilir; kanıtı tekrarlanmadan.
- Kayıt sırasında Köy'den geri çıkma düğmesi pasifleşir.
- Üçüncü aşamanın adı 'Kim Konuşuyor?' yerine 'Dinle ve Bul' olarak değiştirilmiştir; etkinlik sadece insan seslerini değil oda/eşya/rutinleri de öğretir.
