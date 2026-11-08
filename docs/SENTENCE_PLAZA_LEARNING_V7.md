# Cümle Meydanı — V7 Pedagoji ve Sahne Uyumu

## Hata kaynağı
- `sentencePlazaEngine.ts` Türkçe yönergeleri çoğu zaman kök biçim ve yer bildiren ekleri doğrudan birleştiriyordu. Örnek hatalı: "Kuş ağacın altında yerleştir."
- Scene (konum seçimi) sorularında hayvan, cümle doğrulanana kadar görünmüyordu. Çocuk görselle değil Türkçe yönergeden çıkarımla cevap veriyordu.
- Aynı dört konum seçeneği hem görselin üzerinde hem de sağ panelde tekrarlanıyordu.
- Bazı olumsuz renk yönergeleri "mavi OLMASIN" ile `is not blue`yu eşitliyordu.
- Hareket Büyüsü'nün fiil şablonlarında "uçmak yapabilir"; İstekler Meydanı'nda "biraz elmaları iste" gibi yazımlar üretilebiliyordu.

## Uygulanan pedagogik kurallar
- **Bildirim** `The bird is under the tree.` ↔ "Kuş ağacın altında."
- **Emir** `Put the bird under the tree.` ↔ "Kuşu ağacın altına yerleştir."
- Yer bildirme (bulunma) ile hareket hedefi (yönelme) farklı ayrı verilerle modellenir: `tr` + `trDestination`. Hayvanların belirtme biçimleri `trAcc` alanında tutulur.
- Scene okuma sorusunda hayvan önceden hedef konumda görünür; önce "Kuş nerede? Resimde bul." denir. Sahneden doğru konum seçilince Türkçe hedef cümle açılır ve çocuk İngilizcesini oluşturur.
- Emir cümlelerinde hayvan önce başlangıçta görünür. Ancak doğru İngilizce emir onaylandıktan sonra hedefe hareket eder; animasyonları açan doğrulama mekanizması `awaken` kalır.
- M3'te konum seçmek için yalnızca sahnedeki gerçek düğmeler etkindir. Sağda ikinci bir buton listesi yoktur. Yer etiketleri dokunmatik ekranda da görünür ve erişilebilir.
- Evin arkası için hayvanın alt kısmı maskelenerek "önde duruyor" izlenimi azaltıldı. Gerçek cihazda yerleşim kabul testi hâlâ gerekir.
- M1 renk sorularında ilgili nesne bütün soru türlerinde önceden renklendirilmiş olarak görünür. M2'de hayvanlar bütün soru türlerinde resimde bulunur.
- M4 (ortak motor + bağımsız Hareket Büyüsü) `uçabilir/uçuyor` gibi doğal fiil biçimleri kullanır.
- M5 (ortak motor + bağımsız İstekler Meydanı) yiyeceklerin genel isim, belirtme ve yönelme biçimlerini karıştırmaz.
- M6 ortak motorundaki `Put` komutları da nesnenin belirtme ve konumun yönelme ekini doğru kullanır. Bağımsız Fener Festivali şablonları da test kapsamındadır.

## Korunan değişmezler
- Kaydedilmiş görevlere ait `questionId` değerleri ve İngilizce cevap anahtarları değişmedi.
- Yanlış deneme, ipucu, ses yardımı, bağımsız çözüm, sınıf/dil seviyesi kuralları ve otomatik ilerleme korunuyor.
- 6 görev kapağı ve 6 WebP oyun sahnesi değiştirilmedi.
- Yeni fiyatlandırma, veri migrasyonu veya production deployment yok.

## Test
`sentence_clarity_v3.test.mjs`: 6 görev × 3 dil seviyesi soru havuzları; Türkçe belirtme/yönelme çekimleri; ayrı M4/M5/M6 motorları × 3 sınıf × 3 dil seviyesi; hayvan önizlemesi, sahne konum seçimi, no-duplicate UI, mobil/erişilebilirlik ve kayıt/otomatik geçiş invariants. Diğer mevcut regresyon testleri ve web/Android/iOS CI.
**Sınırlama:** Otomatik testler çocukla yapılan gerçek kullanılabilirlik testinin veya görsel derinlik doğrulamasının yerine geçmez.
