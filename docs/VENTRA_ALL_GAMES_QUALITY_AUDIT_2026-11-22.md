# Ventra — Tüm oyunlar kalite denetimi ve P0/P1/P2 düzeltmeleri (22 Kasım 2026)

**Kapsam:** Kelime Bahçesi (Hayvan Çayırı, Renk Korusu, Sayı Vadisi, Lezzet Pazarı, Aile Köyü, Keşif Tapınağı, Harf Korusu, Tema Kasabası), Cümle Meydanı (Uyanan Meydan, Hareket Büyüsü, İstekler Meydanı, Fener Festivali), Hikâye Ormanı (Hikâyeyi Keşfet, Sonra Ne Oldu?, Hikâye Dedektifi), Diyalog Limanı, Yazı Atölyesi, Keşif Akademisi; ortak ilerleme/ödül/Supabase katmanı ve Kids kabuğu.

**Yöntem:** Kod okuma (oyun grubu başına bağımsız denetim), her bulgunun kodda yeniden doğrulanması, motorlar için tohumlu kapsamlı testler (binlerce plan), gerçek tarayıcıda (Chrome mobil emülasyonu, 320×568 / 320×640 / 390×844) ölçüm. **Fiziksel Android/iOS cihaz testi bu çalışmada yapılmadı.** Production deploy yapılmadı. Supabase migration gerekmedi.

## Özet

| | Bulunan | Düzeltilen | Açık |
|---|---|---|---|
| P0 | 20 | 20 | 0 |
| P1 | ~35 | 26 | 9 (aşağıda) |
| P2 | ~20 | 6 | çoğu (aşağıda) |

Testler: 517 → **562** otomatik test (CI artık tüm test dosyalarını otomatik bulur). TypeScript ve production build temiz.

## P0 — oyunu bozan, veri/kanıt kaybettiren, öğrenme doğruluğunu bozan

| Oyun | Sorun | Düzeltme | Commit |
|---|---|---|---|
| QA | 5 P1 test paketi hiç çalışmıyordu; bir regex hiç eşleşemiyordu | `scripts/run-tests.mjs` testleri otomatik bulur | `3e6592c` |
| Tema Kasabası, Harf Korusu | Kayıtlı ilerleme 10. seviyenin üstünde hep **0** okunuyordu (72/36 seviye kimliği) | `levelProgressMap.ts`, anahtar aralığı okuma | `cef48a9` |
| Hikâyeyi Keşfet | Doğru cevaptan hemen sonra 🔊 → sahne kilitleniyordu | geçiş sırasında tekrar dinleme kapalı | `2f4f07a` |
| Sonra Ne Oldu? | "↻ Dinle" hata/ipucu kanıtını siliyordu | slot bazında kanıt taşınır | `2f4f07a` |
| Hikâyeyi Keşfet | "Yer" sorusunda başlangıç sahnesi (arka plan) yanlış seçenekti | çeldiriciden çıkarıldı | `2f4f07a` |
| Hikâye Dedektifi | A2 kanıt sorusunda ikinci geçerli çift | hedefin tüm ipuçları hariç | `2f4f07a` |
| Sonra Ne Oldu? (A2) | "Neden" sorusu çeldiricilerle de cevaplanabiliyordu | bölüme özel, tek cevaplı sorular | `545ca0b` |
| Cümle Meydanı (4 oyun) | "Is/is", "The/the" harf farkı doğru cümleyi reddediyordu | harf duyarsız karşılaştırma, çeldirici filtresi | `66ca8f0` |
| Uyanan Meydan | Son otomatik geçişte geri → biten görev kaydedilmeden kayboluyordu | önce kaydeder | `66ca8f0` |
| Diyalog Limanı | "I'm happy", "2 apples" reddediliyordu | `englishAnswerText.ts` | `ced2b3b` |
| Yazı Atölyesi, Akademi | Türkçe klavye ı/İ doğru cevabı bozuyordu | ı/İ katlama | `ced2b3b` |
| Yazı Atölyesi | 20 açık uçlu yönerge tek bir cümleyi kabul ediyordu | net Türkçe model cümleli yönergeler | `ced2b3b` |
| Lezzet Pazarı | 5. aşama küçük havuzda kazanılamaz hâle geliyordu | farklı hedefler + 2 açık çeldirici | `64dcb30` |
| Lezzet Pazarı | "I don't want some milk" | any | `64dcb30` |
| Keşif Tapınağı | "I can see a orange crystal" | a/an | `64dcb30` |
| Harf Korusu | C/K/Q aynı /k/ sesiyle aynı soruda | aynı başlangıç sesli harfler ayrıldı | `64dcb30` |
| Sayı Vadisi | Doğru cümle hep ilk düğme, kartlar hep aynı sırada | soru/tekrar başına değişir | `64dcb30` |
| Renk Korusu, Sayı Vadisi, Tema Kasabası | 🔊 cevabı söylüyor, cevap "bağımsız" kaydediliyordu | ses ya soruyu sorar ya da cevap destekli kaydedilir | `64dcb30` |
| Profil | Aktif profil silinince silinmiş kimlikle kayıt sürüyordu | yedek profile geçiş + depo düzeyinde red | `c8a9f57` |
| Diyalog Limanı | Dokunma ile konuşma kaydı ayırt edilemiyordu | `speakingSteps` kategorik sayılar | `c8a9f57` |

## P1 — kullanılabilirlik, mobil, erişilebilirlik, pedagojik kalite (düzeltilenler)

- Escape kayıt sırasında oyunu kapatıyordu → her oyunun kilitli çıkış düğmesine yönlendirildi (`c8a9f57`).
- IndexedDB açılış hatası kalıcı önbelleğe alınıyordu; "Yeniden Dene" çalışmıyordu (`c8a9f57`).
- 5 İngilizce oyun etkinlik kaydında "Kesir Atölyesi" görünüyor, günlük görevlere sayılmıyordu (`c8a9f57`).
- Akademi başarısız kayıttan sonra 6. cevap satırı ekleyebiliyordu; tekrar-kaydet çift dokunma (`c8a9f57`).
- Uygulama açık mikrofona konuşabiliyordu (kendi sesi cevap sayılabilirdi) (`c8a9f57`).
- iOS çentik: Liman, Yazı, Akademi ve 4 Cümle oyununda güvenli alan (`c8a9f57`).
- Ana ekran: başarısız/eski okuma önceki çocuğun yıldızlarını veya 0 gösteriyordu (`e080fff`).
- Cümle oyunları ödül ekranı en iyi değil bu turun yıldızını gösteriyor (`e080fff`).
- Ders örneği görevin birebir cevabı olabiliyordu (4 motor) (`e080fff`).
- Tema Kasabası sessiz cihazda dinleme görevleri yazılı destekle çözülebilir (`e080fff`).
- Hikâye Ormanı kontrol kartları 320 px'de 💡'yi örtüyordu (tarayıcıda ölçüldü) (`a4aa3a7`).
- Hayvan albümü soru sırasında cevap anahtarıydı; "Aa" modu bölüm boyu kalıyordu; çift dokunma iki hata (`64dcb30`).
- 44 px altı çıkış/yardım/ses düğmeleri ve 10–11 px yönergeler (tarayıcıda ölçüldü) (`3bed75b`, `5b65ab2`).
- Renk Korusu çok benzer renkleri aynı soruda sunuyordu (ΔE<30) (`9cd3275`).
- Tapınak 2. aşamada ödünç kelimeler (Pizza, Zebra) cevabı yazıyordu (`9cd3275`).
- Sayı Vadisi hep "Birler" yolunda, yol değişince 1. bölümde açılıyordu (`9cd3275`).
- Cümle oyunlarında kartların sıralı gelme koruması hiç çalışmıyordu; 1. görevde doğru renk hep ilk seçenekti (`66ca8f0`).
- Yolculuk paneli 2,8 MB görsel indiriyordu → 320 px küçük resimler (`f86a578`).

## Açık kalan riskler ve öneriler (sonraki iş paketleri)

**P1**
1. **Odak yönetimi:** Cevaptan sonra seçilen düğme kaybolunca klavye/anahtar kullanıcısının odağı `<body>`'ye düşüyor (Pazar, Köy, Tapınak, Hayvan, Renk, Sayı). Soru başlığına odak taşıma önerilir.
2. **IndexedDB yinelenen oturum denetimi atomik değil:** iki sekme aynı checkpoint'i aynı anda kaydederse yinelenen etkinlik satırı oluşabilir; yıldız/coin etkilenmez (en iyi değer + seviye başına coin).
3. **Profil silme ebeveyn kapısı gerektirmiyor:** tek `confirm` ile kardeş profili silinebilir. Ürün kararı gerekir.
4. **Akademi mikrofonu:** ~86 MB yerel model inerken "Dinliyorum…" gösteriliyor; ilerleme/iptal yok.
5. **Hikâyeyi Keşfet A2 sonuç sorusu:** seçenek resimleri nesneyi gösterdiği için nesne eşlemesiyle çözülebiliyor; iki bitiş anlatımı (sandık, kuş ailesi) resimde görünmüyor. Yeni görsel gerektirir.
6. **Sonra Ne Oldu?** 1. bölümde iki kare neredeyse aynı; bazı karakterler 3D WebP, bazıları düz SVG (tutarsız görünüm). Yeni görsel gerektirir.
7. **Fener Festivali** harita pinleri 320–400 px'de üst üste binebilir (ölçülmedi).
8. **Diyalog Limanı** "What is your name?" yalnızca "My name is Alex." kabul ediyor.
9. **Dekoratif küçük metinler** (8–11 px etiketler/sayaçlar) birçok ekranda duruyor; işlevsel olanlar düzeltildi.

**P2:** Hayvan Çayırı bitiş ekranı her zaman ⭐⭐⭐; Renk Korusu keşif kaydı tekrarında yanlış doğru sayısı; sayı kelimesi parçalama ("hun|dre|d"); bazı kullanılmayan bileşenler (`RewardModal`, `GameLevelMap`, `MobileMeadowWorld`, `NumberPlaceWorkshop`); Aile Köyü başlığı 320 px'de yıldız rozetinin altında kalıyor.

## Görsel varlık ihtiyaçları (üretim altyapısı yok — sahte/düşük kaliteli görsel eklenmedi)
- Hikâyeyi Keşfet: anahtarla açılan sandık ve "kuş ailesine kavuşur" bitiş sahneleri; nesnesiz sonuç kartları.
- Sonra Ne Oldu?: 1. bölüm "elmayı ağaca taşır" karesi için belirgin ağaç/poz; tüm bölümlerde tavşan, tilki, geyik için tutarlı 3D WebP.

## Gerçek cihazda kontrol edilmesi gerekenler
- iPhone (çentik/Dynamic Island): Liman, Yazı, Akademi ve 4 Cümle oyununda çıkış düğmesi durum çubuğunun altında mı?
- Android Chrome + iOS Safari: Türkçe klavye ile "ı" yazıp Yazı Atölyesi/Akademi cevapları; mikrofon izni reddi.
- Sherpa/Chrome konuşma tanıma: "I'm happy", "Let's go", "I need two apples" Liman'da kabul ediliyor mu?
- Sessize alınmış cihazda Tema Kasabası dinleme görevleri.
- 320×568 telefonda Hikâyeyi Keşfet A1/A2 yer/sonuç kontrolünde 💡'ye dokunma.
- Profil silme → kalan profille oynayıp uygulamayı yeniden başlatma.

## Yeni ortak modüller (korunmalı)
- `lib/progress/levelProgressMap.ts` — seviye haritası; yeni oyun 10'dan fazla seviye kullanıyorsa sayısını buraya ekleyin.
- `lib/progress/activityTitles.ts` — etkinlik başlıkları; `WORLD_GAMES` etiketleriyle aynı olmalı.
- `lib/learning/sentenceTokens.ts` — cümle kelime karşılaştırma, çeldirici ve ders örneği filtresi.
- `lib/learning/englishAnswerText.ts` — yazılı/konuşulan cevap normalizasyonu (bulanık eşleştirme değildir).
- `components/learning/activities/garden-child-legibility.css` — 44 px / okunabilirlik tabanı.
- `scripts/run-tests.mjs` — tüm testleri bulur; `scripts/mobile-audit.mjs` — gerçek tarayıcı mobil denetimi (`npm --workspace=apps/web run qa:mobile`, bir kez `npm i -D playwright-core -w apps/web` gerekir).
