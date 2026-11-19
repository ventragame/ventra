# Ventra — Cümle Meydanı · P1 ortak etkileşim ve QA

**Sahneler:** Uyanan Meydan, Hareket Büyüsü, İstekler Meydanı, Fener Festivali.

## Ortaklaştırılanlar
- `SentenceQuestComponents.tsx`: tek görünür cümle kurma arayüzü, kelime yuvaları, kelime seçme/çıkarma ve kelime sayacı. Her oyun kendi `onAdd/onRemove` fonksiyonunu kullanmaya devam eder.
- Ortak görev sayacı `Görev X / Y`, sahneye özgü sonuçtan önce `Cümlen doğru!`, tamamlanma ekranında `Bölüm tamamlandı` bilgisi.
- `sentence-quest-language.ts` üzerinden tek ipucu biçimi: açıklama + sıradaki İngilizce kelime. Yardım kullanımının bağımsız puanlamayı etkileyen mevcut işaretleri korunur.
- `sentence-quest-unified.css` yalnızca ortak `sq-*` sınıflarını yönetir. Dört oyunun mevcut sahne görselleri, tasarımları ve buton skin'leri değiştirilmez.

## Değişmeyenler
- Cümle doğrulama, dil seviyesi görev seçimi, yanlış kelime tespiti, tekrar, süre, ilerleme, İngilizce ses, checkpoint, kaydetme ve ödül.
- Cümle başındaki büyük harf dönüşümü yalnızca `visibleWord` ile görüntü katmanındadır; doğrulama tokenları değişmez.
- Ebeveyn süreçlerinde profil ilerleme verileri aynı depoya yazılır. Production deploy yapılmaz.

## Kabul kriterleri
320–430 px Android Chrome/iOS Safari'de uzun A2 cümle, kelime ekle/geri alma, yanlış slot, kilitli kontrol, ekran okuyucu, klavye odağı ve zoom test edilmelidir. Dört dünyada ses yardımı, ilk denemede doğru, yardımlı çözüm, kayıt hatası ve replay doğrulanmalıdır. CI başarısı fiziksel cihaz UX kabulü değildir.
