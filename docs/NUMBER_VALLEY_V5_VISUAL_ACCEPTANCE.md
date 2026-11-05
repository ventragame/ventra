# Ventra — Sayı Vadisi V5: Görsel yenileme ve test kapıları

## Kapsam
- Beş özgün ve çevrimdışı SVG oyun sahnesi: Kristal Vadisi, Işık Köprüsü, Yıldız Bahçesi, Yankı Kanyonu, Portal Tapınağı.
- Mobil öncelikli oyun yüzeyi: kısaltılmış bölüm navigasyonu, büyük renkli kristal butonlar, sonuç/ödül ekranı, açıklayıcı doğru/yanlış görsel geribildirimleri.
- SVG dosyaları yerel public/assets/numbers dizinindedir. Harici CDN, ücretli görsel sunucusu veya WebGL gerekmez.
- Oyun kimliği, 15 seviyeli üç sayı yolu, öğrenme geçmişi, adaptif tekrar, sınıf/İngilizce sınırları ve yıldız kayıtları korunur.
- Son kristal keşfedildiğinde kayıt otomatik başlar; doğru cevap sonrası sonraki soruya geçiş görünürlük koşullarını izleyen ortak hook ile gerçekleşir.
- Ses uygunluğu yalnızca Web Speech üzerinden değil, ortak ses servisi üzerinden Native Capacitor desteğiyle de kontrol edilir.

## Korunan güvenlik ve pedagojik ilkeler
- Kayıt başarısızsa başarı ilan edilmez; aynı oturum kimliğiyle yeniden kaydetme seçeneği korunur.
- Önceki yol keşfedilmeden onluklar ve yüzlükler açılmaz.
- Renk/ışık yanında sayı yazıları ve erişilebilir kontrol etiketleri korunur.
- Küçük ekran, yatay yön, safe-area, klavye odağı ve azaltılmış hareket stilleri vardır.

## Gerçek cihaz ve yayın öncesi kontrol
- [ ] npm ci, TypeScript denetimi ve öğrenme testleri geçiyor.
- [ ] Production web + statik mobil export + Android/iOS derlemeleri geçiyor.
- [ ] 320/360/390/430px telefonlar ve yatay yönde yatay kayma/kırpılma yok.
- [ ] 1. sınıf Pre-A1 ve 7. sınıf A2 ile kilitli sayı yolları doğru davranıyor.
- [ ] Son kristal, otomatik sonraki soru, hata ve tekrar kaydetme gerçek cihazda çalışıyor.
- [ ] Android Capacitor / iOS Safari / iOS Capacitor üzerinde sesli ve sessiz kullanım denendi.
- [ ] İki çocuk profilinde veri izolasyonu; tekrar oynama ve adaptif zayıf sözcük kontrol edildi.

Sınır: Bu sürüm stüdyo seslendirmesi veya bilimsel pedagojik doğrulama değildir. CI başarılı olması mağaza yayın onayı anlamına gelmez.
