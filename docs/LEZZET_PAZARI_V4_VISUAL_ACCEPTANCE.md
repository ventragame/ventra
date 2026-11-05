# Lezzet Pazarı — Premium V4 görsel/oynanış yenileme

## Kapsam
- Üç sokak için farklı, kendi içinde tutarlı, çevrimdışı SVG ortamı: Meyve-Sebze, Fırın, Kafe.
- Emoji bazlı 45 ürün kartının tamamı, tek ve yaklaşık 43 KB boyutlu yerel SVG sprite dosyasında 45 ayrı, özgün ve gölgeli vektör çizimle temsil edilir. Her kart kendi İngilizce kelime kimliğiyle doğru sembole bağlanır.
- Büyütülmüş ürün vitrini; müşteri siparişlerinde yiyecek simgeleri; dokunma ve sürükle-bırak destekli resimli sepet; görsel başarı, hata ve görev bitirme durumları.
- Mobil odaklı 320px ve üzeri yerleşim; kısa navigasyon, büyük dokunma hedefleri, safe-area, yatay ekran, klavye odağı ve azaltılmış hareket desteği.
- Keşif görevi son ürünle otomatik biter. Diğer görevlerde zaten var olan doğru cevap sonrası otomatik soru ilerlemesi korunur. Bölüm sonu ödül ekranından geçiş isteğe bağlı kalır.
- Android/iOS native TTS desteği, tarayıcı Web Speech olmadığı durumda da ortak ses servisi üzerinden algılanır. Ses oynatılamadıysa dinleme alanında yazılı destek bağımsız başarı sayılmaz.
- Hızlı tekrarlanan dokunuşların hem keşif kanıtını hem doğru cevap kaydını ikiye katlamasına karşı ref tabanlı koruma.
- Quiz seçeneklerinde yeterince keşfedilmiş kelime bulunduğunda öğrenilmemiş yiyecekler dikkat dağıtıcı olarak kullanılmaz.

## Değiştirilmeyen öğrenme ve güvenlik sözleşmeleri
- 45 kelime, 15 görev, 45 yıldız, üç sokak kilit zinciri, grade-aware Pre-A1/A1/A2 havuzları, zayıf kelime tekrarları.
- Canonical gameId, event/evidence şeması, sessionId bazlı idempotent kayıt, Supabase/IndexedDB ilerlemesi ve profil izolasyonu.
- Ürün dil öğrenme uygulamasıdır: aritmetik, para yönetimi veya ödeme simülasyonu eklenmedi.
- Yapılan çizimler kaynak kodu olarak repository içindedir; harici CDN ve maliyetli medya sunucusuna bağımlılık yoktur.

## Test ve yayın öncesi kabul
- [ ] npm ci + TypeScript ve node test:ci.
- [ ] Production web / statik mobil export; Android APK / iOS simülatör derlemesi.
- [ ] 320, 360, 390, 430px mobil ve landscape: taşma, yanlış kırpılma, safe-area.
- [ ] 45 görselin Safari / Android WebView içindeki harici SVG symbol-use desteği.
- [ ] Sıfırdan öğrenme ve birkaç replay: yeni kelimeler/yanlış tekrarları, hiçbir soru yabancı distractor getirmiyor.
- [ ] Sessiz mod, başarısız speech synthesis, native TTS, yazılı destek kanıt işaretlemesi.
- [ ] Son keşiften otomatik kayıt, hata sonrası manuel kayıt tekrar denemesi, ilk 5 bölümden sonra yeni sokak açılması.
- [ ] Android/iPhone cihazlar ve çocuk kullanıcılarla kullanılabilirlik doğrulaması.

**Sınır:** Çizimler boyanmış vektör illüstrasyonlarıdır, fiziksel 3D render veya stüdyo ses kayıtları değildir. Gerçek cihaz ve çocuk kullanıcı onayı gelmeden “mağazaya hazır” denmez.
