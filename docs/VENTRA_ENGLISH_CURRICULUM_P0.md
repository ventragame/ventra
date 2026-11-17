# Ventra Kids — P0 Merkezi İngilizce Müfredat Haritası

**Sürüm:** `kids-english-p3-2026-11-17`  
**Kapsam:** 7–12 yaş çocuklarda Pre-A1 / A1 / A2 *içerik bantları* (resmî CEFR yeterlilik belgesi değildir).  
**Kodun kanonik kaynağı:** `apps/web/src/lib/learning/englishCurriculum.ts`.

## Ne değişti, ne değişmedi?

- **28 konu × 3 İngilizce içerik düzeyi = 84 öğrenme kazanımı**. 82 kazanımın kod destekli oyunu var (`authored`), 1 kazanım kısmi (`partial`), 1 kazanım ileri fonik öğretim açısından açık (`gap`). `authored`, dil öğretmeni ya da çocuk üzerinde doğrulanmış *mastery* anlamına gelmez.
- **15 oyun yüzeyi** altı kalıcı ada kimliğine bağlandı; her yüzeyin gerçek `gameId`, mevcut oyun motoru dosyası, kapsadığı kazanımlar ve beceri hedefi bulunuyor.
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
| **A–Z harf adları ve büyük/küçük harf** | **Kod destekli** | Harf Korusu: 26 harf, 9 tanıtım + 3 tekrar mini dersi |
| Ulaşım ve duygular | P3 kod destekli | Araçlar, günlük yolculuk ve duyguları ifade etme |
| **Phonics: İngilizce harf–ses ve okuma** | **Pre-A1 kod destekli / A1 kısmi / A2 açık** | Harf Korusu: kelime içindeki başlangıç/bitiş sesi ve kısa sözcük okuma; ileri ses çiftleri ve yazım kuralları yok |
| **Okul/sınıf, kıyafet, vücut, hava durumu** | **P3 kod destekli** | Tema Kasabası'nda görsel, dinleme, eşleştirme ve günlük kullanım cümleleri |
| **Takvim/günler/aylar/saat ve hobiler** | **P3 kod destekli** | Tematik dersler ve analog saati okuyarak İngilizce seçme oyunu |

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
| `ENGLISH_CURRICULUM_TOPICS` | 28 sıralı konu kimliği ve etiketi |
| `CURRICULUM_SURFACES` | 15 oyun ve altı ada eşleşmesi |
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

- **P1 Harf Korusu:** Kelime Bahçesi içinde oynanabilir mini alan eklendi; 26 harf/12 ders/40 kısa kelime. Sesin cihazın TTS çıktısına bağlı olması nedeniyle gerçek fonem kayıtları, A2 ileri phonics ve fiziksel cihaz/dil öğretmeni kabulü açık. [P1 kabul belgesi](./VENTRA_ALPHABET_GROVE_P1.md).
- **P2 İngilizce Yolculuğum:** Bu statik haritayı gerçek öğrenme kanıtlarıyla desteklenmiş, yanlışa hedefli geri dönüş yapan **öneri katmanına** bağlamak. Eski ilerleme korunur; erişim otomatik kilitlenmez.
- **P3 Tematik genişleme:** `school`, `body`, `clothes`, `weather`, `calendar`, `hobbies`, `transport`, `feelings` temaları artık Tema Kasabası'nda oynanabiliyor. Gerçek cihaz, İngilizce öğretmeni ve çocuk kabulü hâlâ gereklidir. [P3 GDD](./VENTRA_THEME_TOWN_P3.md).
- Resmî MEB/CEFR kazanım eşlemesi, güncel müfredat referansları, doğru İngilizce telaffuz incelemesi ve çocuklarla ölçülen hatırlama kazanımları **ayrı QA kapısıdır**. P0 bunları yapılmış saymaz.

**Tarihsel teknik not:** `packages/shared/src/curriculum.ts`, `packages/shared/src/outcomes.ts` ve `packages/shared/src/catalog/skills.json` içinde eski matematik örnekleri vardır; mevcut Kids English müfredatı bunlara bağlı değildir. Geriye dönük kullanım riskinden dolayı onları bu P0 işi kapsamında silmedik veya yeniden anlamlandırmadık.

### P2 — İngilizce Yolculuğum (2026-11-17)
P0 kazanım kataloğu artık 7-duraklı P2 öğrenme rehberinde 15 gerçek oyun yüzeyine yönlendirme için kullanılır. Eksik konu/gap dersleri oynanabilir diye gösterilmez. Yeni oyun kilidi oluşturulmaz; oyunun tamamlanması resmî CEFR seviyesi veya bağımsız dil becerisi olarak sayılmaz. Ayrıntılar: docs/VENTRA_ENGLISH_JOURNEY_P2.md


### 2026-11-17 — P3 güncellemesi

Kelime Bahçesi içinde Tema Kasabası mini alanı eklendi; P0 28 konu, 84 seviye hedefi, 15 gerçek oyun yüzeyi ve 82 authored / 1 partial / 1 gap olarak güncellendi. Buradaki authored etiketi **oynanabilir kod içeriği** anlamına gelir; gerçek dil ustalığı veya resmî CEFR kazanımı değildir. [P3 kabul belgesi](./VENTRA_THEME_TOWN_P3.md).
