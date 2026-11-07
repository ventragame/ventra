# Kelime Bahçesi — V5 sakin zemin ve modüler 3 × 2 harita

Kullanıcının gerçek tarayıcı ekranında V4 harita üzerinde altı bağımsız kartın arka plan detaylarıyla çakıştığı ve bazı kartların dar görünümde kadraja sıkıştığı görüldü.

## Değişiklikler
- Yeni, sade çayır zemini: `apps/web/public/assets/word-garden/modular-v5/garden-ground.webp`.
- **Aynı altı mevcut premium WebP**: `modular-v4/{animals,colors,numbers,food,family,sanctuary}.webp`. Oyun kartlarında ve Phaser haritasında ortak kullanılmaya devam eder.
- 3 × 2: üst sıra Hayvan Çayırı / Renk Korusu / Sayı Vadisi; alt sıra Lezzet Pazarı / Aile Köyü / Keşif Tapınağı.
- Kartlar arası boşluk ve okunabilirlik artırıldı; kenarlara görünür güvenli mesafe bırakıldı.
- Ana koridor ve altı kısa bağlantı, `GardenNavigation.ts` içindeki deterministik yol grafiğini doğrudan kullanır. Yol artık kartların *içinden* geçmez.
- Üst sıraya aşağıdan, alt sıraya yukarıdan yaklaşılır; otomatik oyuna girişte yürüme hedefinin yeterli yakınlığı kontrol edilir.
- Masaüstünde altı kartın tamamını gösterecek kadraj; mobilde karakter takibi ve harita sıfırlama korunur.
- Gereksiz sabit HUD etiketi kaldırıldı, ortam sesi düğmesi küçültüldü, ekran okuyucu bildirimleri korundu.
- Orijinal ilerleme kilitleri, ses motoru, kaydetme sistemi ve oyun mekanikleri değiştirilmedi.

## Kontrol
- GitHub Actions: TypeScript, test:ci, production web/mobile bundle, Android/iOS (sonuçlar Actions ile doğrulanmalıdır).
- Test: 6 istasyon için çakışmama, yolun gerçek grafiğe bağlı olması, ayırt edilebilir kartlar ve tüm varlıkların yerel yüklenmesi.
- Gerçek cihazlarda özellikle küçük telefonda harita reset/zoom, sesi açma ve karakterin tüm altı istasyona ulaşması kontrol edilmeli.
- Production deploy uygulanmadı.
