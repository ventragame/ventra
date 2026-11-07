# Kelime Bahçesi — Modüler Keşif Haritası V4

## Kapsam ve sınırlar
- Tek, temiz 1400 × 940 WebP arazi zemini; altı ayrı 720 × 360 yarı saydam WebP dünya illüstrasyonu
- Aynı `animals/colors/numbers/food/family/sanctuary.webp` dosyaları hem Phaser haritasında hem oyun kartlarında kullanılır; ikinci bir kart seti üretilmez
- Phaser yürüme karakteri, WASD/ok kontrolleri, kilitli bölgelere giriş kontrolü, ziyaret ve progress callback'leri korunur
- Görünen krem patikalar `GardenNavigation.ts` içindeki gerçek yürünebilir graph üzerinden çizilir; konumlar ve hedef erişim noktaları değişmez
- Etiket, bitirme durumu, yıldız/ilerleme ve butonlar gerçek veriden canlı hesaplanır; WebP üzerinde sabit değildir
- 630px/360px CSS ve reduced-motion kuralları korunur

## Asset eşlemesi
`apps/web/public/assets/word-garden/modular-v4/`

| Dosya | Tema | Harita ve kart |
|---|---|---|
| `garden-ground.webp` | Boş vadiler, çayırlar, şelale | Phaser arazi |
| `animals.webp` | Hayvan Çayırı | Ortak dünya illüstrasyonu |
| `colors.webp` | Renk Korusu | Ortak dünya illüstrasyonu |
| `numbers.webp` | Sayı Vadisi | Ortak dünya illüstrasyonu |
| `food.webp` | Lezzet Pazarı | Ortak dünya illüstrasyonu |
| `family.webp` | Aile Köyü | Ortak dünya illüstrasyonu |
| `sanctuary.webp` | Keşif Tapınağı | Ortak dünya illüstrasyonu |

## Test kabulü
- 7 gerçek RIFF/WEBP binary dosya
- Oyun motoru ve player rotası üzerinde yeni iş kuralları yok
- Existing `GardenNavigation` shortest-route, walkability, tap-to-walk testleri
- Responsive ve mobile cihazda dünya odak/zoom testleri (320, 360, 390px)
- Kilitli, yükleniyor, tamamlandı, devam et ve hata durumlarının görsel ve davranışsal doğrulaması

**Durum:** Kod güncellemeleri ve assetler için CI beklenir; gerçek mobil cihaz doğrulaması olmadan tam görsel kabul beyan edilmez. Production deploy yapılmadı.
