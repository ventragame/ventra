# Keşif Tapınağı — V7 görsel dönüşümü

**Kapsam:** yalnızca görsel tasarım, salon illüstrasyonları, WebP optimizasyonu ve responsive iyileştirme. Yeni macera, yeni öğrenme mantığı, soru planı, skor veya kayıt şeması yok.

- Salonlar: Rün Ormanı (rune), Yankı Galerisi (echo), Bereket Salonu (feast), Hatıra Odaları (home), Kristal Taht (crown).
- Yeni sahneler: `apps/web/public/assets/temple/temple-{rune,echo,feast,home,crown}-v7.webp` (1600×600). Gerçek RIFF/WEBP dosyaları, yerel/offline, her biri 350 KB altı.
- Görsellerde başlığın iki kez çıkmaması için kaynak resimlerdeki başlık alanı çıkarıldı.
- `TempleScenery.tsx` sahneleri yeni WebP dosyalarına bağlıyor; V6 SVG'ler referans ve geri alma için repoda tutuluyor.
- Salon seçimi minyatür olarak aynı WebP sahnelerini kullanıyor; navigasyon ve kilitler özgün kodda.
- `temple-v7.css` yalnızca `tp7-screen` altında renk, çerçeve, tipografi, panel, sahne, kart, mobil ve reduced-motion kurallarını değiştiriyor.
- Görev sayıları, kullanıcıya özel ilerleme, doğru-yanlış, konuşma/ses, otomatik ilerleme, kazanımlar ve veri saklama aynen korunuyor.

**Doğrulama:** GitHub Actions üzerinde TypeScript, Node testleri ve production build; gerçek Android/iOS UI kontrolü ayrıca gereklidir. Production deployment yapılmaz.
