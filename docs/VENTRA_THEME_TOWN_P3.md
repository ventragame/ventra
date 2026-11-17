# P3 — Ventra Tema Kasabası | İngilizce Tematik Öğrenme

**Erişim:** Adalar Evreni → Kelime Bahçesi → Tema Kasabası; veya İngilizce Yolculuğum → Rengârenk Dünyam.  
**Kalıcı oyun kimliği:** island_word_garden_theme_town  
**Altı ana ada ve altı eski Kelime Bahçesi dünyası:** Değişmedi.  
**Supabase veritabanı migration / yeni tablo / RLS değişikliği:** Yok.

## İçerik özeti

P3, altı eksik konuyu ve iki ilgili yeni konuyu aynı mini alanda oynanabilir kılar. Sekiz sokak:
- Okul Dünyası: kalem, defter, sınıf, okul yönergeleri, kütüphane, ödev, sunum
- Vücudumu Tanıyorum: vücut bölümleri, hareket yönergeleri, kas/organ ifadeleri
- Renkli Gardırop: kıyafetler, renkler, giyme ifadeleri, tercih ve gerekçe
- Hava Durumu Stüdyosu: hava durumu, mevsimsel hava ve daha ayrıntılı tahmin/uyarı ifadeleri
- Günler ve Saatler: haftanın günleri, aylar, tam saat/yarım/çeyrek/dakika, takvim cümleleri
- Hobi Parkı: basit hobiler, etkinlik tercihi, gerekçeli hobi cümleleri
- Ulaşım İstasyonu: taşıtlar, istasyon/bilet, güzergâh/gecikme
- Duygu Bahçesi: temel hisler, duyguları anlama ve uygun ifade etme

Kodda **254 İngilizce kelime veya kısa kelime grubu** ve **120 örnek günlük cümle** düzeylere göre ayrı yazılmıştır. Bu, tek oturumda çocuğa gösterilen soru sayısı değildir.

### Zorluk ve yaş

İçerik üç İngilizce bandında (Pre-A1/A1/A2) ve sınıf 1–8 için ayrıca uyarlanır. Bu bandlar resmî CEFR sertifikası ya da bağımsız yeterlik testi değildir. İngilizce seviyesi ve sınıf düzeyi ayrı tutulur; sınıf uygunsuz uzun ifadeleri sınırlar. Daha küçük sınıflar 8 soru ve iki büyük cevap seçeneği görür; orta sınıflar 10, büyük sınıflar 12 soruyla çalışır. Yeni sorular sabit havuzdan deterministik farklı sırayla gelir; sınırsız benzersiz içerik iddiası yoktur.

Öğretim akışı: **Keşfet → Deneyerek seç → Kullan**. Yedi etkinlik:
1. Resimle yeni kelime keşfi (bağımsız ölçüm değil)
2. Resim/Türkçe açıklamadan İngilizce seçme
3. Ortak İngilizce ses motorundan dinleme ve yazılışı tanıma
4. İngilizce kelimenin Türkçe anlamını ayırt etme
5. Türkçe gündelik durum için uygun İngilizce ifadeyi seçme
6. Dokunmatik İngilizce cümle bankasıyla kelimeleri sıraya koyma
7. Saatler temasında analog saati okuyup İngilizcesini seçme

Analog saatin saat ve dakika ibreleri gerçek dakikaya göre konumlanır; ilk düzeyde tam saat, orta düzeyde yarım/çeyrek, ileri düzeyde dakika ifadeleri bulunur. Saat günlük canlı zaman veya kullanıcının saat dilimi değildir.

## İlerleme ve güvenlik

Tema Kasabası yalnız kendi yeni oyun kimliğine kaydeder; başka bir dünyanın yıldız/coin veya ilerleme kayıtlarını değiştirmez. Her profil için 3 İngilizce yerleştirme × 8 tema × 3 fiilî içerik kademesi = **72 ayrık levelId** kullanılabilir. Eski kayıtlar kaybolmaz; profil sınıf veya İngilizce tercihi değiştiğinde başka içerik bitirilmiş gibi gösterilmez.

Kayıt mevcut oyun event/ilerleme deposuna yapılır. Her cevapta gerçek metin saklanmaz; oturumda görev türü, yanlış/ipuçları ve dinlemenin başlayıp başlamadığı türünden kategorik kanıtlar tutulur. 30 günlük cihaz-yerel checkpoint profil + dil seviyesi + yaşa uygun içerik bandı + tema bazında ayrılır. Kayıt başarısızlığı tekrar denenebilir. Çocuğun ses kaydı, transkripti veya serbest metni kaydedilmez.

P0 artık **28 konu / 84 seviye kazanımı / 15 gerçek oyun yüzeyi** içerir. Bunların **82'sinde kodlanmış etkinlik**, **1'inde kısmi etkinlik**, **1'inde ileri düzey fonik kapsam açığı** vardır. Kod destekli etkinlik tam pedagojik yeterlik demek değildir. Kalan ileri A2 phonics açığı P3'ün konusu değildir.

P2 İngilizce Yolculuğum'un 7 öğrenme durağı ve mevcut altı ada kimliği aynı kalır; yeni P3 yüzeyi Rengârenk Dünyam bölümüne eklenir. Okul, kıyafet, vücut, hava, takvim, hobiler, ulaşım ve duygular kazanımları artık Tema Kasabası oyununa bağlıdır. Mevcut Hayvan Çayırı → Renk Korusu → Sayı Vadisi erişim sırası değiştirilmedi.

## Otomatik ve manuel kabul kriterleri

- Sekiz tema, üç düzey, dört sınıf örneği, on iki tekrar = 1152 soru planı için görev sayısı, cevap, tekrar, saat verisi ve seçenek doğruluğu otomatik test edilir.
- Sınıf ile İngilizce düzeyi karışmaz; ilgili 72 oyun ID'si farklıdır.
- Türkçe I/ı/İ/i ile İngilizce I/i cevap doğrulaması kendi dilinde yapılır.
- Eksik/veri okunamayan profil sahte sıfır ilerleme olarak gösterilmez; doğru yeniden deneme/uyarı çalışır.
- Android WebView ve iPhone Safari üzerinde 320/360/390/440 piksel mobil, uzun A2 seçenekleri, dokunmatik hedefler, sağ-sol taşma, azaltılmış hareket ve ekran okuyucu ayrıca incelenmelidir.
- İngilizce konuşma sentezi cihazın kendi kalite/ses olanaklarına bağlıdır. Tekil fonem kaydı, telaffuz puanlama veya garantili aksan doğruluğu sunulmaz.
- Gerçek çocuk ve dil öğretmeniyle kelime, ifade, saat telaffuzu ve oyun içi öğrenme değerlendirmesi ayrı QA kapısıdır.
- Yalnız CI TypeScript, web/Android/iOS derlemesi "çocuklar için pedagojik olarak tamamen doğrulanmış" demek değildir.

## Kod ve test rotası

- apps/web/src/lib/learning/themeQuestCatalog.ts: içerik bankaları, tema/düzey ve 72 kimlik
- apps/web/src/lib/learning/themeQuestEngine.ts: deterministik sorular, sınıf/İngilizce karmaşıklığı, saat okuma
- apps/web/src/lib/learning/themeQuestProgress.ts: profil ayrımı ve mevcut game event kayıtları
- apps/web/src/lib/learning/themeQuestCheckpoint.ts: 30 günlük kategorik checkpoint
- apps/web/src/components/learning/themes/ThemeTownAdventure.tsx ve theme-town.css: oynanabilir arayüz
- apps/web/src/components/learning/themes/theme-entry.css: Kelime Bahçesi mini bölge kartı
- apps/web/tests/theme_town.test.mjs: 8 tema, 3 düzey, kayıt ayrımı ve mobil/erişim testi
