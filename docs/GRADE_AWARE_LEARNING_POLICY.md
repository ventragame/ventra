# Ventra Kids — Ortak Sınıf Duyarlı Öğrenme Politikası (P3.1)

## Sözleşme / mimari
- **Sınıf (1–8):** Kullanıcının isteğe bağlı profil alanı. Sınıf İngilizce yeterliliği değildir, sınav sonucu değildir ve mevcut oyun ilerlemesini silmez.
- **İngilizce seviyesi:** Pre-A1 / A1 / A2, başlangıç öz beyanıdır. Yüksek sınıf öğrencisi Pre-A1 seçtiyse ileri İngilizceye zorlanmaz.
- **Ölçülen öğrenme:** P3'ün bağımsız doğru, ipucuyla yanıt, hata, tekrar tarihi ve alan/beceri düzeyine göre kalıcı kanıtı. Discovery ve ipuçları bağımsız ustalık değildir.
- **Ortak politika:** `src/lib/learning/gradeAwareLearningPolicy.ts` sınıfı bir kez değerlendirir, görevin keşif/soru/seçenek kapasitesini ve sayılar için erişilebilir kelime havuzunu verir. Tüm dünyalar aynı arayüzü kullanır.
- **P3 bağdaştırıcısı:** `adaptiveLearningEngine.ts` hayvan/renk yanında sayılar alanını da destekler. `gradeAwareReviewPriority` her alanda yalnızca ilgili becerinin P3 öncelik sırasını kullanır.
- **Kalıcı kayıt:** Hayvan/renk mevcut `gameId`, level ve yıldız verileri değişmez. Sayı Vadisi NV0'da sadece saf görev planlayıcıdır; yeni `gameId` kalıcı kayıt NV3 kapsamındadır.

## Politika matrisi (ilk sürüm)

| Sınıf bandı | Keşif: hayvan / sayı | Keşif: renk | Temel soru | Seçenek | A1/A2 sayı üst sınır |
| --- | ---: | ---: | ---: | ---: | ---: |
| Seçilmemiş (eski profil) | 8 | 6 | 6 | 3 | 20 |
| 1–2 | 6 | 4 | 4 | 2 | 10 |
| 3–4 | 8 | 6 | 6 | 3 | 15 |
| 5–8 | 8 | 6 | 7 | 3 | 20 |

**Pre-A1 tüm sınıflarda 1–10 sayılarıyla sınırlandırılır.** Eşiği yüksek olan seçili sınıf İngilizce düzeyini otomatik yükseltmez. Hata tekrarları bazı görevlere birden fazla soru ekleyebilir. Bunlar ürüne ait başlangıç heuristikleridir; resmi müfredat eşdeğerliği veya psikometrik doğrulama iddiası değildir.

## Entegrasyon
`Kids page.activeProfile.gradeLevel` → `LearningPathModal.gradeLevel` → `AnimalMeadowAdventure` ve `ColorGroveAdventure` → kendi görev motoru → ortak politika + P3 snapshot.

`numberValleyEngine.planNumberMission({gradeLevel,englishLevel,history,...})` aynı sözleşmeyi kullanır; NV1 sahnesi ve NV3 kalıcı sayı kanıtı bundan sonra bağlanacak.

Eski profillerde sınıf yoksa kod legacy zorluğunu korur; yeni profil sınıfı değiştirirse yalnızca yeni plan üretilir, kazanımlar silinmez.

## Kabul testleri
- 1. sınıf A2 çocuğa yine 1–10 sayılar / 2 seçenek; 7. sınıf A2 için 1–20 / 3 seçenek.
- 7. sınıf Pre-A1 yine 1–10 (yaşa göre içerik sunumu ayrı; dil zorlaştırılmaz).
- Her dünyada düşük sınıf için daha küçük görev boyutu.
- Hiç keşfedilmemiş kelimeye sınav verilmez; yanlış kelimeler P3 ile yeniden öne çıkar.
- P3 farklı becerileri ayırır: listening başarısı recognition mastery olarak kaydedilmez.
- Sınıfı eksik/eski profillerde önceki soru sayıları ve veri anahtarları değişmez.

## Açık işler / dürüst sınırlar
- NV1 dünyasında gerçek oynanabilir sahne henüz geliştirilmedi; NV3 sayı oturumu depolama ve senkronizasyon da açık.
- Bulut eşitlemede sınıf ve İngilizce tercihleri hâlâ P2 kapsamındaki açık metadata senkronu sorunudur.
- Sınıf bazlı resmi kazanım haritası, pedagojik içerik onayı ve çocuklar üzerinde validasyon bu heuristiğin ötesinde tasarlanacak. Bu sürüm otomatik seviye sınavı değildir.
