# Lezzet Pazarı V6 — Ana Meyve & Sebze Sahnesi

- Dosya: `apps/web/public/assets/foods/market-orchard-v6.webp`
- Üretim: özgün pazar illüstrasyonu; 1440 × 480 RGB WebP.
- Boyut: 115010 bayt (yaklaşık 112 KB).
- Kaynak: oyun için bu konuşmada üretilen kırmızı-beyaz tenteli pazar, ürün kasaları, ağaçlar ve sıcak gün ışığı.
- Kullanım: `FoodMarketAdventure.tsx` içindeki `MARKET_ART.orchard` artık gerçek WebP'ye işaret eder.
- Diğer iki sahne (Fırın Meydanı, Kafe & Sofra) mevcut SVG kaynaklarını korur; kaynaklar yok edilmedi.
- Öğrenme motoru, soru sayıları, seslendirme, ilerleme ve ödüllerde değişiklik yoktur.
- CI WebP'nin varlığı, imzası, dosya boyutu ve kod bağlantısını doğrular. Görsel konum mobil cihazda ayrıca kontrol edilmelidir.
- Production deployment yapılmadı.
