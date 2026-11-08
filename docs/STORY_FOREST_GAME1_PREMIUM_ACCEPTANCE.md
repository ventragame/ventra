
# Hikâye Ormanı — Oyun 1: Hikâyeyi Keşfet / kabul sözleşmesi

**Kapsam:** Altı resimli bölüm içeren ilk oyun. Diğer beş Hikâye Ormanı oyunu henüz yayımlanmış sayılmaz.

## Öğrenme
- Altı sahne: Yaprak Patikası, Ağaç Ev, Gölet Sırrı, Çiçek Vadisi, Yıldız Kampı, Işık Köprüsü.
- Her sahne için altı hazırlanmış görev; sınıf 1–2: üç görev, 3–4 ya da sınıf bilinmiyor: dört, 5–8: beş.
- İngilizce Pre-A1/A1/A2 seçimi sınıf bilgisinden bağımsızdır, ölçülmüş yeterlilik değildir.
- Karakter bulma, konum, özellik ve eylem görevleri; üç ayrı büyük görsel hedef.
- Yanlış yapılan/hint alınan görevler tekrar oyununda öncelik kazanır.
- Arka planlar tıklanabilir hayvan/nesne içermez; doğru hedefler ayrı çizilir.

## Görsel ve ses
- Altı sahnede tutarlı SVG manzara sistemi ve bağımsız SVG karakter/nesne illüstrasyonları.
- Bölüm girişinde mevcut listening_forest.webp ada görseli kullanılır.
- İngilizce yönerge varsayılan olarak seslidir; tekrar dinleme ve isteğe bağlı yazılı yardım bulunur.
- TTS işletim sisteminin sunduğu İngilizce seslere bağlıdır; profesyonel kaydedilmiş ses kalitesi iddia edilmez.
- Ses kullanılamazsa yazılı İngilizce komut görünür, oynanış kilitlenmez.
- Yanıt doğru olduğunda manuel sonraki butonu olmaksızın ilerleme gerçekleşir.
- Animasyon azaltma sistem tercihi ve mobil dokunmatik kullanım desteklenir.

## Teknik kayıt
- Game ID: island_story_forest_discover. Altı bağımsız bölüm kaydı.
- Her cevap: questionId, selectedId, mode, mistakes, hintUsed, firstTryCorrect, placement, timestamp.
- Tamamlanmamış oyun ödül yaratmaz; hata halinde aynı oturum ID ile yeniden kayıt.
- Aynı oturum ikinci kez yıldız kazandırmaz; kardeş profilleri ayrıdır.
- Yeni üretim veritabanı migration'ı yapılmaz; mevcut IndexedDB/ProgressRepository kullanılır.

## Kod
- src/lib/learning/storyForestEngine.ts: içerik, plan, zorluk ve kanıt.
- src/components/learning/story/StoryForestArt.tsx: katmanlı, birbirinden bağımsız illüstrasyonlar.
- src/components/learning/story/StoryForestAdventure.tsx: oynanış, ses, geri bildirim, kayıt.
- src/components/learning/story/story-forest.css: mobil/masaüstü arayüz.
- src/lib/progress/storyForestProgress.ts: bölüm ilerlemesi.
- tests/story_forest.test.mjs: içerik, ilerleme, tekrar ve profil izolasyonu.

## Gerçek kabul koşulları
1. Adalar Evreni üzerinden veya /kids?open=listening_forest bağlantısı ile açılış.
2. 360×800, 390×844, 440×956, tablet, masaüstü ve yatay ekranlarda çakışma olmaması.
3. Altı bölüm, dört görev türü, doğru/yanlış geri bildirim, ses/aç-kapa ve yazılı fallback kontrolü.
4. Yanlış cevap tekrarı, ipucu, otomatik geçiş ve bölüm sonunda tek seferlik ödül.
5. Çevrimdışı oynama, kapanıp açma, iki çocuk profili ve veri bütünlüğü.
6. Fiziksel Android ve iOS cihazlarda görsel, ses ve performans değerlendirmesi.
7. Yaş grubundaki çocukların yönerge yardımı olmadan oynayabilmesi.

**Durum:** Otomatik test geçmesi, fiziksel cihaz/çocuk görsel kabulünün yerine geçmez. İkinci oyuna geçmeden önce ilk oyunun gerçek cihazda onayı alınmalıdır.
