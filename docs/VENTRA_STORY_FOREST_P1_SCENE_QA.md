# Ventra · Hikâye Ormanı P1 — Ortak sahne ve dinleme standardı

## Oyunlar ve mevcut davranış
Hikâyeyi Keşfet (resimli seçim, yol, arkadaş ve sonuç), Sonra Ne Oldu? (beş kare izleme, sıralama ve anlama) ve Hikâye Dedektifi (resim ipuçları, sahne ve dedektif kararları) mevcut ayrı değerlendirme ve kayıt motorlarıyla kalır. Oyun katalogları, WebP/SVG varlıkları, görsel cevap kimlikleri ve puanlama kuralları değiştirilmez.

## Ortak deneyim
- `StoryNarrationPanel`: gösterilen resme/göreve ait **tam o sahnenin** İngilizce anlatımını tekrar dinletme; `Aa` altyazı aç/kapat; konuşma servisi kullanılamazsa okunabilir metni zorunlu gösterme. Ses kullanıcı eylemiyle tekrar oynar; önceki otomatik ses akışları korunur.
- `StorySceneGuide`: Uyanan oyunlara göre *Resme bak → Dinle → Görsel karar* sırasını tek, kısa yönergeyle gösterir. Bölüm sayacı her adımda aynı dilde görünür.
- `storyDecisionFeedback`: Doğru görsel ve yeniden deneme mesajları tutarlı, sakin ve teknik koda dayanmayan ifadeler kullanır.
- Sıralama oyununda izleme ve dinlediğini anlama görevleri de aynı İngilizce anlatım paneliyle sunulur; resimleri sıraya koyma görevleri görsel karar olarak kalır.
- Erişilebilirlik: konuşma düğmesine etiket, `Aa` için `aria-pressed`, İngilizce `lang=en`, 44 px kontrol yüzeyleri, klavye focus-visible ve küçük ekranda okunabilir metin.
- Ortak CSS `story-scene-standard.css` sadece paylaşılan davranış/görsel hiyerarşiyi tanımlar; karakter ve arka plan tasarımlarına müdahale etmez.

## Önemli sınırlar ve QA
- İngilizce görev yönergesi, ilgili hikâye beat'i veya soru fonksiyonundan gelir: `narrativeFor`, `watchFrame.narration[englishLevel]`, `sequenceComprehensionPrompt`, `detectiveAdventurePrompt` / `detectiveAdventureNarration`.
- Test 320/360/390/430px mobil, 768px tablet, masaüstü. Özellikle kısa ekranlarda seçim kartlarının, ses/altyazı düğmelerinin ve sonraki sahne eyleminin görünürlüğü kontrol edilmeli.
- Ses kapalı/cihaz desteği yok, hızlı sahne geçişi, çok uzun A2 anlatım, yanıt hatası, ipucu sonrası skor, oyun tekrar, kayıt hatası ve kısmi profil ilerlemesi.
- CI: TypeScript, öğrenme/ilerleme regresyonları, web build, Android debug ve iOS simülatör build. Bunlar fiziksel cihaz ve çocuk kullanılabilirlik testinin yerine geçmez.
- Production deployment yapılmaz.
