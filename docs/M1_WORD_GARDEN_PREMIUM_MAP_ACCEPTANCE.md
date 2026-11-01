# M1 — Kelime Bahçesi Premium Harita Revamp / Kabul

**Kapsam:** Yalnızca mevcut altı **İngilizce öğrenme dünyasının harita/hub sunumu**. Hiçbir dersin/oyunun gameId, öğrenme kanıtı, çocuk hesabı veya veri modeline müdahale edilmemiştir. Yeni Supabase migration gerekmez.

## Uygulanan bölümler
### M1.1 — Görsel dünya
- Garden alanına özel özgün çevrimdışı Phaser Graphics dünya: tepeler, göletler, taş/patika katmanları, çalılar/ağaçlar, küçük çiçekler, ışıklar ve altı oyun dünyasına özel 2B çizimler.
- Tema bazlı landmark: Hayvan Çayırı çit/ahır; Renk Korusu kristal çiçekler; Sayı Vadisi sayısal gözlemevi; Lezzet Pazarı çizgili tezgâh; Aile Köyü evler; Keşif Tapınağı kristalli taş kapı.
- Masaüstünde 6 bölgeyi birlikte görmeye öncelik veren ölçekleme; küçük ekranlarda mevcut karakter takip etme ve yön tuşları devam eder.
- Oyuncu ve çayır/hayvan oyun sahnesinin animasyon ve ilerleme mekanikleri korunur. Garden girişleri için 40 gereksiz hayvan SVG'si önceden yüklenmez.

### M1.2 — Premium HUD ve gerçek durum sistemi
- Özgün 6 farklı SVG mini dünya illüstrasyonu ve responsive bölge kartları: aşama ilerlemesi, toplam gerçek yıldız, açılabilir/henüz yükleniyor/kilitli/tamamlandı/devam et durumları.
- Üst HUD profil takma adı, sınıf, altı dünyanın yıldızları, mevcut coin bakiyesi, tıklanabilir Maceracı Pasaportu/daily/collection erişimi. Gerçek değerler mevcut `KidsPage` ve `LearningPathModal` profil kayıtlarından gelir; sahte sayılar kullanılmaz.
- Tamamlanma yüzdesi toplam uygun bölümlere göre hesaplanır. Var olan otomatik görev kilitleri korunur; açılmamış bölge `KİLİTLİ`, veri yükleniyorsa `YÜKLENİYOR`, hata varsa `YÜKLEME HATASI` olarak gösterilir.
- Harita Phaser/WebGL çalışmasa bile altı bölge için erişilebilir React kartları alternatif gezinme sunar.

### M1.3 — Etkileşim ve erişilebilirlik
- Masaüstünde landmark hover vurgusu, bölge seçilip yüründüğünde yumuşak kamera yaklaşması.
- Mobilde yön okları, masaüstünde WASD/oklar; doğrudan kart ile oyuna giriş; hover olmayan cihazlar için semantik düğmeler.
- Responsive ilk ekran, pastel/camlı HUD, ilerleme halkası, reduced-motion stili ve ARIA durum metinleri.
- Var olan WorldAmbience ortam sesi aç/kapa butonu korunur; otomatik ses çalmaz.

## Kontroller
- [x] Altı dünya ID/konum ve mevcut oyunlara giriş callback'leri.
- [x] Durum hesaplama, gerçek yıldız/ilerleme toplamları, sıfıra bölme/taşma durumları.
- [x] Phaser genel kamera ölçeği ve mobil karakter takibi statik regresyon.
- [x] Harita kartları, tıklanabilir pasaport bağlantısı ve 6 özgün kart çizimi.
- [x] Web/TypeScript/test ve iOS/Android debug derleme CI kontrolleri (referans: [GitHub Actions 41336066393](https://github.com/ventragame/ventra/actions/runs/41336066393), 145/145 otomatik test).
- [ ] Fiziksel Android/iOS'da kamera, performans, kaydırma/long press ve ses kontrolü manuel kabul.
- [ ] Desktop Chrome/Edge/Firefox farklı ekran/en-boy oranında altı landmark'ın görünürlük kontrolü ve oyunlara geçiş deneyimi.
- [ ] Çocuk kullanıcı testi: 6–12 yaşın bölgeyi bağımsız bulabilmesi, 6 oyun sonrası geri dönme, UI odak/okuma düzeyi.
- [ ] Profesyonel QA ekran görüntüleri ve performans profili: özellikle düşük bütçeli Android, 30fps hedefi.

**Not:** CI başarısı gerçek cihazda görsel uyumun veya reklam/Google Play mağaza yayınının kabulü değildir.
