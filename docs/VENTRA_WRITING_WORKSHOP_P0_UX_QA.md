# Ventra — Yazı Atölyesi P0 · masa, ipucu, mobil klavye

## Sınırlar

Mevcut 5 bölüm, 3 Pre-A1/A1/A2 düzeyi, 315 görev, 6/7/8 görevlik seçki, checkpoint ve bağımsız yazma puanlaması korunmuştur. Görev metninin kendisi değişmemiştir. Görev başındaki emojiye dayanan tekil görsel yerine gerçek nesne resmine benzetilmeyen, CSS ile çizilmiş farklı harf, cümle ve serbest yazma çalışma masası kullanılır. Mevcut ada WebP arka planı korunur. Sahne dekoratiftir, çocuklara yanlış cevap gösterecek sahte resim değildir.

## Üç kademeli yardım

1. Yapıyı keşfet: harf ya da kelime sayısı (cevap görünmez)
2. Başlangıcı bul: ilk harf ya da ilk kelime (cevap görünmez)
3. Örnekle karşılaştır: tam yazım örneği açıkça istenirse gösterilir

Dinle butonu model sesi çalar; hem sesli yardım hem aşamalı ipuçları bir kez yardım olarak sayılır. İki yanlışın ardından tam yanıt otomatik açılmaz. Mevcut ayrı harf dizme / cümle kurma / klavye yazma beceri metrikleri değiştirilmez. Gerçek yazı ve serbest not saklanmaz.

## Mobil klavye

- `visualViewport` resize/scroll gözlenir; kapalı tarayıcılarda doğal akış korunur.
- Aktif textarea `scrollIntoView({block:'nearest'})` ile görünür tutulur; klavye nedeniyle örtülen alan için scroll boşluğu eklenir.
- İngilizce girerken mobil otomatik düzeltme, otomatik büyük harf, otomatik tamamlama ve yazım denetimi kapalıdır; 16px font zoom riskini azaltır.
- Klavyeyi kapat eylemi kullanıcıda kalır; yazı otomatik kaydedilmez, cevap ekranını kendisi gönderir.
- Mobil sahne daha kompakt, hedefler en az 44px ve reduced-motion korumalıdır.

## Test

`npm run type-check -w @ventra/web` ve `npm run test -w @ventra/web` ile otomatik kontroller. 320/360/390/430px, Android Chrome ve iOS Safari ile fiziksel klavye, emoji klavyesi, uzun A2 metni, ekran yönü değişimi, zoom ve checkpoint ayrıca elle doğrulanmalıdır.

CI başarısı cihaz QA'sı veya dil uzmanı onayı değildir; production deploy yapılmaz.
