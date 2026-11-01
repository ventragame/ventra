# Sayı Vadisi — NV0 Oyun Tasarımı ve Kabul Kapıları

**Durum:** NV0 çekirdek görev motoru uygulandı; henüz oynanabilir ekran veya harita kilidi açılmadı.

## Ürün amacı
Çocuk, İngilizce sayı kelimesini görsel miktarla ilişkilendirir. Salt kart eşleştirme değil, etkileşimli fiziksel dünyada anlama ve hatırlama ölçülür. Seçilen Pre-A1 / A1 / A2 ayarı **ölçülen** ustalık iddiası değildir.

## Premium oyun döngüsü (hedef)
1. **Kristal Keşfi:** 8 parlayan kristal / sayı levhası etkileşimi, gör–duy–öğren. İlk tur 1–8; sonraki turlar yenileri ekler.
2. **Işık Köprüsü:** İngilizce sayı komutundan doğru platformu bul; yanlış platform ilerlemeyi durdurur, soruyu tekrar açar.
3. **Yıldız Hasadı:** Söylenen sayıda yıldız topla, miktarı fiziksel eylemle göster.
4. **Yankı Kanyonu:** Sesli sayıyı duyup doğru sayı taşına ilerle. Ses yoksa erişilebilir yazılı alternatif; bağımsız sesli hatırlama başarısı gibi raporlanmaz.
5. **Portal Onarımı:** Sayılan kristalleri yuvalara yerleştir ve doğru sayıyı seç; çok adımlı görev.

## NV0 (bu commit)
- Saf seed tabanlı seçim algoritması, 1–20 sözlüğü, farklı keşif turları.
- Pre-A1 yalnızca 1–10; A1/A2 ilk kapsamda 1–20.
- Keşfedilmemiş sayı sınav sorusu olamaz.
- Yanlışların iki bağımsız doğru yanıtla toparlanması; aralıklı tekrar.
- Her soruda 3 ayrı seçenek ve deterministik test.
- Mevcut profil/oyun ilerlemesine müdahale edilmez.

## NV1–NV4 teslim planı
- **NV1** görsel dünya ve keşif sahnesi; 8 etkileşim, mobil/klavye erişimi, çevrimdışı.
- **NV2** beş ayrı mekaniğin playable implementasyonu, animasyon ve ses alternatifleri.
- **NV3** ayrı `island_word_garden_numbers` kayıt anahtarı, doğrulanmış ebeveyn/çocuk profil izolasyonu, idempotent ödüller, adaptif öğrenme geçmişi ve kilit politikası.
- **NV4** TypeScript + unit + E2E + web/Android/iOS ve fiziksel cihaz kabulü. Harita bölgesi ancak oynanabilir ve kayıt güvenilir olduğunda açılır.

**Sürüm kapısı:** NV0 motor testi geçti diye Sayı Vadisi "oynanabilir" veya "premium tamamlandı" denmez.
