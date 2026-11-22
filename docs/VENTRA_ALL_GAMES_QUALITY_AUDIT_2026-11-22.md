# Ventra — Tüm oyunlar kalite denetimi ve P0/P1/P2 düzeltmeleri (22 Kasım 2026)

**Kapsam:** Kelime Bahçesi (Hayvan Çayırı, Renk Korusu, Sayı Vadisi, Lezzet Pazarı, Aile Köyü, Keşif Tapınağı, Harf Korusu, Tema Kasabası), Cümle Meydanı (Uyanan Meydan, Hareket Büyüsü, İstekler Meydanı, Fener Festivali), Hikâye Ormanı (Hikâyeyi Keşfet, Sonra Ne Oldu?, Hikâye Dedektifi), Diyalog Limanı, Yazı Atölyesi, Keşif Akademisi; ortak ilerleme/ödül/Supabase katmanı ve Kids kabuğu.

**Yöntem:** Kod okuma (oyun grubu başına bağımsız denetim), her bulgunun kodda yeniden doğrulanması, motorlar için tohumlu kapsamlı testler (binlerce plan), gerçek tarayıcıda (Chrome mobil emülasyonu, 320×568 / 320×640 / 390×844) ölçüm. **Fiziksel Android/iOS cihaz testi bu çalışmada yapılmadı.** Production deploy yapılmadı. Supabase migration gerekmedi.

## Özet

| | Bulunan | Düzeltilen | Açık |
|---|---|---|---|
| P0 | 20 | 20 | 0 |
| P1 | ~35 | 33 | 2 ("Sonra Ne Oldu?" görselleri; dekoratif küçük metinler — aşağıda) |
| P2 | ~30 | ~29 | kısmi: hikâye tekrar çeşitliliği sınırları (aşağıda) |

Testler: 517 → 562 (ilk paket) → **606** (ikinci paket); CI tüm test dosyalarını otomatik bulur. TypeScript ve production build temiz.

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

## İkinci paket — açık maddelerin kapatılması (22 Kasım 2026)

İlk paketteki açık P1/P2 maddeleri ve belgeye girmemiş P2 bulguları ele alındı. Her paket: kod → test → `tsc` + `test:ci` + production build → commit → `main`. Testler 562 → **606**.

| Madde | Sorun | Düzeltme | Doğrulama | Commit |
|---|---|---|---|---|
| P1 Veri | IndexedDB yinelenen oturum denetimi atomik değildi | Silinmiş profil + oturum + önceki seviye + tüm yazmalar tek `readwrite` işleminde (`readThenWrite`); ortak `gameCompletionPlan.ts` | Sıralı işlem taklidi: eski kod çift kayıt yazıp deneme kaybediyordu, yeni kod geçiyor | `e81b330` |
| P1 Güvenlik | Profil silme tek `confirm` ile | Mevcut `ParentalGateModal` (tehlike görünümü, profil adı ve sonucu yazılı); Escape önce kapıyı kapatır | Kaynak testi | `e81b330` |
| P1 Konuşma | Liman "What is your name?" yalnızca "Alex" | `personal:'name'` kalıbı: "My name is <kendi adı>"; hiçbir şey saklanmaz | Birim testi | `717e7bf` |
| P1 Konuşma | Akademi ~73 MB model inerken "Dinliyorum…" | Bayt düzeyi ilerleme (boyut + SHA-256 korunur), aşamalar, 44 px "Dur" düğmesi; Liman'da da ilerleme | Akış testi (Node) | `717e7bf` |
| P1 Erişilebilirlik | Cevaptan sonra odak `<body>`'ye düşüyordu (6 oyun) | `useQuestionFocus`: yeni soru / görev sonucu başlığına, yalnızca odak kaybolduysa | Chrome, yalnız klavye: Hayvan (4 soru + bitiş), Pazar (3 soru), 0 kez `<body>` | `d683071` |
| P1 Mobil | Fener pinleri 320–400 px'de üst üste | ≤660 px: harita simge işaretçisi, seçim 2×2 okunur listede | Geometri testi (bölüm yeni profilde kilitli, ekran görüntüsü alınamadı) | `3cfe744` |
| P1 Mobil | Öğretici "tekrar aç" düğmesi görev sayacını ve oyunun "?" düğmesini örtüyordu | Oyunun kendi yardım panelinde "Öğretimi tekrar oyna"; yüzen düğme yalnızca yedek | Chrome: 4 oyun × 2 genişlik | `3cfe744` |
| P1 Pedagoji | Hikâyeyi Keşfet A2 sonuç sorusu nesne resmiyle çözülüyordu | Nesneyi adlandırmayan İngilizce sonuç cümleleri (okuduğunu anlama); yeni görsel gerekmedi | Birim testi | `7fe5831` |
| P1 Okunabilirlik | 9–11 px işlevsel etiketler | Bahçe gezinme/ilerleme etiketleri 12 px, sahne etiketleri 11 px; Fener, Aile Köyü mobil metinleri | Chrome 320 px ölçümü | `3cfe744` |
| P2 | Aile Köyü başlığı 320 px'de yıldız rozetinin altında | Tabela esnek öğe, rozet kısa sayı gösterir | Chrome ölçümü: çakışma yok | `3cfe744` |
| P2 | "—. sınıf" başlığı (5 oyun) | "Sınıf seçilmedi" | Birim testi | `3cfe744` |
| P2 | Hayvan Çayırı bitişi hep ⭐⭐⭐ | Bu turun yıldızı | Kaynak testi | `13cb4d6` |
| P2 | Renk Korusu keşif kaydını yeniden denerken 0 doğru | Yeniden deneme ilk kayıtla aynı | Kaynak testi | `13cb4d6` |
| P2 | Pazar keşfi son kelimenin sesinin üstüne kaydediyordu | Konuşma bitişini bekler | Kaynak testi | `13cb4d6` |
| P2 | Tapınak renk çeldiricileri ayırt edilemiyordu (purple/violet…) | ΔE<30 renkler çeldirici olamaz | 1 440 plan: eski motor 42, yeni 0 | `13cb4d6` |
| P2 | Yardım etmeyen eylemler "destekli" sayılıyordu (Köy 4, Tapınak 5) | Yönerge tekrarı ipucu sayılmaz; 5. aşama ipucu anlamı gösterir | Kaynak testi | `13cb4d6` |
| P2 | Sayı kelimeleri "one\|hun\|dre\|dtw…" | Kelime ve anlamlı parça (one · hundred · twenty- · five) | 1–1000 testi | `13cb4d6` |
| P2 | Yazı Atölyesi'nde Enter yeni satır ekliyordu | Enter/"done" cevabı kontrol eder | Kaynak testi | `13cb4d6` |
| P2 | Liman sahne eşyası dokunuşları İngilizce puanını düşürüyordu | Ayrı izlenir, puana girmez | Kaynak testi | `13cb4d6` |
| P2 | Pasaport çocuğa teknik İngilizce hata gösteriyordu | Gerçek neden korunur, Türkçe çocuk metni | Birim testi | `13cb4d6` |
| P2 | Kullanılmayan bileşenler | `RewardModal`, `GameLevelMap`, `MobileMeadowWorld`, `NumberPlaceWorkshop` silindi | `tsc` + build | `87b80c7` |
| P2 | Modal odak yönetimi (profil, Tema, Harf) | `useDialogFocus` + `focusMemory`: içeri al, Tab'ı tut, açana geri ver | Chrome, profil penceresi: 70 Tab dışarı çıkmadı, Escape sonrası odak açan düğmede. **Düzeltme:** Tema/Harf'ten çıkışta odak açana dönmüyordu (üçüncü kontrol) | `87a8acc`, `89bdb10` |
| P2 | Meydan kelime kutuları 30×39 px | 44 px | Kaynak testi + 320 px ölçümü | `21010fe` |
| P2 | Hikâye: yükleme hatasında yeniden deneme yok; tekrar oyunları aynı; yer kartı etiketleri ham İngilizce | "↻ Tekrar dene", geçmişe göre değişen bölümler, Türkçe yer etiketleri, odak | Birim + entegrasyon testi | `5e3d7d0` |
| P2 | Uzun A2 cümleleri otomatik geçişte kesiliyordu (Meydan, Hareket) | Ses bitince geçiş (`sentenceAutoAdvance`), sesi yoksa okuma süresi | Sahte saatle zaman testi | `5e3d7d0` |
| P2 | Meydan çeldiricileri hep aynıydı | Cümleye göre çeldirici: 1 288 soruda 1 013 farklı set | Birim testi | `5e3d7d0` |
| P2 | Fener seçimleri Türkçe–Türkçe eşleme | Renk ve yer seçenekleri İngilizce | Birim testi | `5e3d7d0` |

## Üçüncü kontrol — GitHub Actions ve geliştirme modu (22 Kasım 2026)

Test yöntemi: her push'tan sonra GitHub Actions (TypeScript, regresyon testleri, production web build, Android APK + release bundle, iOS Simulator); ardından yerelde `npm run dev:web` ile manuel test. Otomatik testler gerçek cihaz testi değildir; hiçbir oyun yerelde kontrol edilmeden onaylanmış sayılmaz.

- `eec8ce9` için Actions'taki tüm işler yeşildi: web, Android, iOS ve konuşma QA. "cancelled" görünen koşular, `cancel-in-progress` ayarı nedeniyle bir sonraki push'un iptal ettiği ara koşulardır.
- Manuel test `next dev` ile, yani React StrictMode açıkken yapıldığı için odak kancaları bu modda yeniden ölçüldü. Harf ve Tema açılışta odağı içeri alıyor ve 30 Tab'da bir kez bile dışarı çıkmıyor; StrictMode'un sahte kapanışı odağı kaçırmıyor.

| Madde | Sorun | Düzeltme | Doğrulama | Commit |
|---|---|---|---|---|
| P1 Oyun/veri | Dünyaya girdikten sonraki ilk ~2 saniyede ya da `?open=` bağlantısıyla bir ada açılınca, alttaki ada haritası (Phaser) kilitsiz kalıyordu. Bahçe'de fareyle Lezzet Pazarı'na tıklamak alttaki Keşif Akademisi adasına da gidiyor, 1,5 saniye sonra oyun kapanıp Akademi açılıyordu; kaydedilmemiş oyun durumu kayboluyordu. | Kilidin son değeri ortak durumda tutuluyor (`setWorldInputLocked` / `isWorldInputLocked`). Sahne başlarken bu değeri okuyor; uyutma sahne çalışmaya başlayınca uygulanıyor; ada isabet alanları kilit değiştiğinde iki yönde de yeniden hesaplanıyor. | Chrome, eski kod: dev'de 3/3; production'da hızlı giriş 2/2 ve `?open=` her seferinde hatalı, 3 saniye sonra giriş sorunsuz. Düzeltmeden sonra dev ve production'da: kilit tutuyor, Bahçe kapanınca dünya açılıyor, haritadaki adaya tıklama çalışıyor. | `8d88e07` |
| P2 Erişilebilirlik | Bahçe oyunlarından çıkınca odak `<body>`'ye düşüyordu. İkinci paketteki "Tema/Harf açana geri verir" iddiası yanlıştı: açan düğme oyun açılınca DOM'dan kalkıyor. | `useReturnFocus` + `data-return-focus`: odak oyunu açan karta ya da düğmeye dönüyor. Klavye kullanıcısı için hedef görünmüyorsa ortalanıyor; fare ve dokunmatikte kaydırma ve halka yok. | Chrome, dev ve production, 1280 ve 390 px: klavye 4/4, fare 2/2 | `429931c` |

## Açık kalan riskler ve öneriler

1. **"Sonra Ne Oldu?" görselleri:** 1. bölümde iki kare neredeyse aynı. Tavşan resimsel 3D WebP; tilki, geyik ve ayı SVG. Projedeki `fluent-3d` emoji PNG'leri bu kitap üslubuna uymadığı için kullanılmadı. Yeni görsel gerekir.
2. **Fener Festivali konum seçicisi** gerçek tarayıcıda görülmedi (bölüm yeni profilde kilitli). Geometri ve kaynak testleriyle doğrulandı; cihazda bakılmalı.
3. **Akademi model indirme ilerlemesi** gerçek indirmeyle tarayıcıda görülmedi (masaüstü Chrome farklı konuşma moduna geçebiliyor); akış Node testleriyle doğrulandı.
4. **12 px altı dekoratif metinler:** ada ana ekranlarında (Yazı Atölyesi 22, Liman 16 öğe) ve oyun alt bilgilerinde duruyor. İşlevsel olanlar düzeltildi.
5. **Hikâye tekrar çeşitliliği:** 4. bölümün 4 kareli ve tüm 5 kareli destelerde alternatif alıntı yok; A2 1. ve 4. bölüm yalnızca karışır.
6. **İstekler Meydanı ve Fener Festivali** otomatik geçiş için hâlâ kendi satır içi kopyalarını kullanıyor; davranış aynı, ileride `sentenceAutoAdvance`'a taşınabilir.

## Görsel varlık ihtiyaçları (üretim altyapısı yok — sahte/düşük kaliteli görsel eklenmedi)
- Hikâyeyi Keşfet: anahtarla açılan sandık ve "kuş ailesine kavuşur" bitiş sahneleri (isteğe bağlı; A2 sonuç sorusu artık yazılı cümlelerle çalışıyor, görsel gerektirmiyor).
- Sonra Ne Oldu?: 1. bölüm "elmayı ağaca taşır" karesi için belirgin ağaç/poz; tüm bölümlerde tavşan, tilki, geyik için tutarlı 3D WebP.

## Gerçek cihazda kontrol edilmesi gerekenler
- iPhone (çentik/Dynamic Island): Liman, Yazı, Akademi ve 4 Cümle oyununda çıkış düğmesi durum çubuğunun altında mı?
- Android Chrome + iOS Safari: Türkçe klavye ile "ı" yazıp Yazı Atölyesi/Akademi cevapları; mikrofon izni reddi.
- Sherpa/Chrome konuşma tanıma: "I'm happy", "Let's go", "I need two apples" Liman'da kabul ediliyor mu?
- Sessize alınmış cihazda Tema Kasabası dinleme görevleri.
- 320×568 telefonda Hikâyeyi Keşfet A1/A2 yer/sonuç kontrolünde 💡'ye dokunma.
- Profil silme → ebeveyn kapısı → kalan profille oynayıp uygulamayı yeniden başlatma.
- İlk kez Akademi/Liman mikrofonu: model indirme yüzdesi ilerliyor mu, "Dur" düğmesi çalışıyor mu (yavaş mobil ağ).
- Liman "What is your name?" sorusuna kendi adıyla "My name is …" demek.
- Fener Festivali 2. ve 4. bölüm: telefonda 2×2 konum seçicisi.
- Yazı Atölyesi: telefon klavyesinin "Bitti/Git" tuşu cevabı kontrol ediyor mu.
- İki sekmede aynı oyunu bitirmek: etkinlik listesinde tek satır.
- Uygulamayı açar açmaz (ilk 1–2 saniyede) bir adaya girip oyunda dokunmak: başka bir adaya atlamamalı (özellikle yavaş telefonda).

## Yeni ortak modüller (korunmalı)
- `lib/progress/levelProgressMap.ts` — seviye haritası; yeni oyun 10'dan fazla seviye kullanıyorsa sayısını buraya ekleyin.
- `lib/progress/activityTitles.ts` — etkinlik başlıkları; `WORLD_GAMES` etiketleriyle aynı olmalı.
- `lib/learning/sentenceTokens.ts` — cümle kelime karşılaştırma, çeldirici ve ders örneği filtresi.
- `lib/learning/englishAnswerText.ts` — yazılı/konuşulan cevap normalizasyonu (bulanık eşleştirme değildir).
- `lib/progress/gameCompletionPlan.ts` — iki depo için ortak yıldız/deneme/etkinlik planı; IndexedDB'de `readThenWrite` ile tek işlemde uygulanır.
- `components/learning/activities/useQuestionFocus.ts`, `lib/a11y/useDialogFocus.ts`, `lib/a11y/focusMemory.ts`, `lib/a11y/useReturnFocus.ts`, `lib/a11y/focusLost.ts` — odak sözleşmesi.
- `lib/game/EventBus.ts` → `setWorldInputLocked` / `isWorldInputLocked` — ada haritası kilidi ortak durumdur; doğrudan `SET_WORLD_INPUT_LOCKED` yayınlamayın.
- `components/learning/tutorialReplay.tsx` — öğreticiyi oyunun kendi yardımından tekrar açma.
- `lib/speech/modelDownload.ts` — bayt ilerlemeli, bütünlük denetimli model indirme.
- `components/learning/sentence/sentenceAutoAdvance.ts` — ses bitince otomatik geçiş.
- `lib/learning/gradeLabel.ts` — sınıf etiketi.
- `components/learning/activities/garden-child-legibility.css` — 44 px / okunabilirlik tabanı.
- `scripts/run-tests.mjs` — tüm testleri bulur; `scripts/mobile-audit.mjs` — gerçek tarayıcı mobil denetimi (`npm --workspace=apps/web run qa:mobile`, bir kez `npm i -D playwright-core -w apps/web` gerekir).
