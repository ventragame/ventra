# Ventra Kids — P0 Merkezi İngilizce Müfredat Haritası

**Sürüm:** `kids-english-p0-2026-11-16`  
**Kapsam:** 7–12 yaş çocuklarda Pre-A1 / A1 / A2 *içerik bantları* (resmî CEFR yeterlilik belgesi değildir).  
**Kodun kanonik kaynağı:** `apps/web/src/lib/learning/englishCurriculum.ts`.

## Ne değişti, ne değişmedi?

- **26 konu × 3 İngilizce içerik düzeyi = 78 öğrenme kazanımı**. 54 kazanımın öğretim etkinliği mevcut oyun kodunda var (`authored`); 24 kazanımda sistematik ilgili öğretim ünitesi henüz yok (`gap`). `authored`, dil öğretmeni ya da çocuk üzerinde doğrulanmış *mastery* anlamına gelmez.
- **13 kanıtlanmış oyun yüzeyi** altı kalıcı ada kimliğine bağlandı; her yüzeyin gerçek `gameId`, mevcut oyun motoru dosyası, kapsadığı kazanımlar ve beceri hedefi bulunuyor.
- Her kazanımın **kalıcı ID'si, Türkçe kazanım cümlesi, İngilizce model örneği, konu/tema, seviye, öğrenme becerileri, ders durumu, oyun bağlantıları ve önerilen önkoşulları** mevcut.
- Grade 1–8 **sunum ve soru miktarını** yönetir. Pre-A1/A1/A2 **İngilizce içeriğini** yönetir. İkisi birbirinden ve resmî seviyelendirmeden bağımsızdır.
- Yalnız metadata ve bağımsız sorgu araçları eklendi. Yeni harf oyunu, ek ada, kurs ekranı, SQL migration, yeni kullanıcı kaydı, mevcut oyun açma koşulunda değişiklik, yıldız/coin işlemi ve production deploy **yoktur**.

## Güncel konu kapsamı (üç seviyede)

| Konu | Durum | Mevcut öğretim bağlamı |
|---|---|---|
| Hayvanlar | Kod destekli | Kelime Bahçesi / Hayvan Çayırı + Keşif Tapınağı |
| Renkler | Kod destekli | Kelime Bahçesi / Renk Korusu + Keşif Tapınağı |
| Sayılar | Kod destekli | Sayı Vadisi + Keşif Tapınağı; grade/placement bandı uygulanır |
| Yiyecek-içecekler | Kod destekli | Lezzet Pazarı + Keşif Tapınağı |
| Aile, ev, günlük rutin | Kod destekli | Aile Köyü + Keşif Tapınağı |
| Selamlaşma, istek/nezaket | Kod destekli | Diyalog Limanı + Lezzet Pazarı |
| Betimleme, konum, eylem, tercih | Kod destekli | Cümle Meydanı, gerektiğinde Diyalog Limanı |
| Hikâye, anlama ve olay sırası | Kod destekli | Hikâye Ormanı'nın üç oyun motoru |
| Diyalog ve sıralı cevap | Kod destekli | Diyalog Limanı |
| Kelime harflerini sıralama, yazılı üretim | Kod destekli | Yazı Atölyesi |
| Karma beceri tekrarı | Kod destekli | Keşif Akademisi + Keşif Tapınağı |
| **A–Z harf adları ve büyük/küçük harf** | **Eksik** | Harf dizme görevleri sistematik alfabe öğretimi değildir |
| **Phonics: İngilizce harf–ses ve okuma** | **Eksik** | Yeni, aşamalı ses/harf öğrenimi gerektirir |
| **Okul/sınıf, kıyafet, vücut, hava durumu** | **Eksik** | Bazı oyunlarda örnek sözcük geçmesi tam ünite demek değildir |
| **Takvim/günler/aylar/saat ve hobiler** | **Eksik** | Düzenli keşif–dinleme–uygulama–tekrar akışı yok |

## Öğrenme önkoşulları — *engelleyici değil, öneri*

Kazanımlar bir **yönlü ve döngüsüz graf** oluşturur. Örneğin:

```text
en.colors.pre-a1
      └─ en.descriptions.pre-a1
               ├─ en.locations.pre-a1
               └─ en.story.pre-a1  ← en.actions.pre-a1 ← en.animals.pre-a1

en.greetings.pre-a1
      └─ en.requests.pre-a1
               └─ en.dialogue.pre-a1 ← en.greetings.pre-a1

en.story.pre-a1   ─┐
en.dialogue.pre-a1 ├─ en.integrated.pre-a1
en.writing.pre-a1 ─┘

en.animals.pre-a1 → en.animals.a1 → en.animals.a2
```

Bu bağlantılar **öğretim sıralama tavsiyesidir**. Çocuk örneğin doğrudan Diyalog Limanı'nı açabiliyorsa P0 önkoşulları bunu kilitlemez. Henüz çocuk başarısına dayalı gerçek bir kazanım tamamlama verisi çıkarılmaz; mevcut yıldızlar ve oyun bitişleri bağımsız İngilizce ustalık kanıtı sayılmaz. `missingEnglishPrerequisites(id,verifiedIds)` yalnız **açıkça doğrulanmış** kazanım ID listesi verilirse eksikleri gösterir. P2 kurs yönlendirmesinde doğru beceri kanıtları bağlanana kadar bu fonksiyon kilit açma veya otomatik seviye atlatmada kullanılmamalı.

## Geliştirici sözleşmesi ve erişim

| Arayüz | Amaç |
|---|---|
| `ENGLISH_CURRICULUM_OUTCOMES` | Bütün stabil ve seviye bazlı kazanımlar |
| `ENGLISH_CURRICULUM_TOPICS` | 26 sıralı konu kimliği ve etiketi |
| `CURRICULUM_SURFACES` | 13 gerçek oyun ve altı ada eşleşmesi |
| `getEnglishCurriculum({placement, topics?, islandId?, includeGaps?})` | Okuma amaçlı filtreleme |
| `getEnglishCurriculumByIsland(islandId, placement)` | Bir adanın mevcut seviye hedefleri |
| `getJourneyCurriculum(islandId, placement)` | Var olan `learningJourney.ts` üzerinden aynı hedefler |
| `describeLearnerRoute(...).curriculumOutcomeIds` | Mevcut Kelime Bahçesi girişine ait başlangıç hedeflerinin ID'leri |
| `missingEnglishPrerequisites(id, verifiedIds)` | Engelleyici olmayan, doğrulanmış listeye göre eksik öneriler |
| `getEnglishCurriculumCoverage()` / `validateEnglishCurriculum()` | Kapsam analizi ve bütünlük kontrolleri |

### Yeni içerik yazma kuralı

1. Önce mevcut konuya ve düzeye kazanım eklenip eklenmeyeceği belirlenir; yanlış/çift ID oluşmaz.
2. Oyun `gameId`, altı mevcut ana ada kimliğinden birine ait ve kaynak kodda gerçekten bulunur. Çalışmayan/planlanan bir oyun için sahte `gameId` yazılmaz.
3. Dil hedefi, İngilizce örneği, gerçekten ölçülebilen beceri, sınıf/düzey sınırı ve önkoşullar girilir.
4. Ses dinletilmeden listening, harf sürüklemekle bağımsız writing, dokunmatik cevapla bağımsız speaking kanıtı yazılmaz.
5. `gap` konular ancak gerçekten oynanabilir, testlenmiş bir öğretim oyunu bağlandığında `authored` durumuna geçebilir.
6. Önce `npm --workspace=apps/web run test:ci`, TypeScript, web build; sonra gerçek Android/iOS ve çocuk/dil öğretmeni kabulü.

## Güncel boşluklar ve sonraki fazlar

- **P1 Harf Korusu:** `letters` ve `phonics` kazanımları için ses, harf adı, büyük/küçük harf, kodlanabilir kısa kelime ve erişilebilir sesli oyunlar. Şu anda P0 kapsamında oynanabilir bir şey yapılmadı.
- **P2 İngilizce Yolculuğum:** Bu statik haritayı gerçek öğrenme kanıtlarıyla desteklenmiş, yanlışa hedefli geri dönüş yapan **öneri katmanına** bağlamak. Eski ilerleme korunur; erişim otomatik kilitlenmez.
- **P3 Tematik genişleme:** `school`, `clothes`, `body`, `weather`, `calendar`, `hobbies` için gerçekten öğretici oyunlar ve uzman içerik incelemesi.
- Resmî MEB/CEFR kazanım eşlemesi, güncel müfredat referansları, doğru İngilizce telaffuz incelemesi ve çocuklarla ölçülen hatırlama kazanımları **ayrı QA kapısıdır**. P0 bunları yapılmış saymaz.

**Tarihsel teknik not:** `packages/shared/src/curriculum.ts`, `packages/shared/src/outcomes.ts` ve `packages/shared/src/catalog/skills.json` içinde eski matematik örnekleri vardır; mevcut Kids English müfredatı bunlara bağlı değildir. Geriye dönük kullanım riskinden dolayı onları bu P0 işi kapsamında silmedik veya yeniden anlamlandırmadık.
