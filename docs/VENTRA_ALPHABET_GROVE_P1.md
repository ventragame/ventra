# Ventra Harf Korusu P1 — Oyun ve Öğretim Kabul Belgesi

**Alan:** Kelime Bahçesi içinde küçük ve bağımsız bir mini bölge. Ana evrende altı büyük ada aynen korunur.
**Kalıcı yeni oyun kimliği:** island_word_garden_alphabet
**Kod:** apps/web/src/lib/learning/alphabetGroveEngine.ts
**Oyun:** apps/web/src/components/learning/alphabet/AlphabetGroveAdventure.tsx
**Kayıt:** alphabetProgress.ts + alphabetCheckpoint.ts
**Merkezi müfredat:** englishCurriculum.ts → garden.alphabet

## Öğrenme kapsamı

26 İngilizce harfin tamamı dokuz küçük tanıtım dersinde işlenir:
S-A-T / P-I-N / M-D-G / O-C-K / E-U-R / H-B-F / L-J-V / W-Y-Z / Q-X.
Ardından Harf Şenliği, Kelime Ormanı ve Okuma Feneri tekrar-okuma dersleri gelir. Toplam 12 oynanabilir mini ders vardır. Çocuk tamamlanan dersi farklı, deterministik görev dizileriyle yeniden oynayabilir.

Etkinlik türleri: İngilizce harf adını **tek başına** dinleyip seçme; harf ile gerçek İngilizce kelimeyi resim ve anlam üzerinden eşleştirme (ör. P → 🖊️ → pen); kelimenin ilk veya son harfini duyulan sözcük bağlamında bulma; resim ve İngilizce sesle kısa kelimeyi seçme; dokunmatik harfleri sıralayarak kelime oluşturma. Büyük/küçük yazılışlar destekleyici gösterimdir; ana oyun görevi değildir. Kısa okuma bölümünde 40 üç harfli kelimeden önce tanıtılmış harflerle yazılabilenler kullanılır. İlk derste yalnız tek doğru seçenekle sahte okuma sınavı sunulmaz.

Harf adı ve kelimedeki ses **aynı şey değildir**. Örneğin A harfinin adı /eɪ/, apple içindeki sesi /æ/; C cat kelimesinde /k/; Q çoğu zaman QU içinde /kw/; X fox sonunda /ks/ verir. Tek başına harfe cihaz TTS çıktısı alıp fonem kaydı olarak iddia edilmez. Harf sesleri *bütün İngilizce örnek kelimenin* seslendirilmesiyle tanıtılır. Cihazın TTS motoruna bağlı ses hataları mümkündür ve uzman/donanım kabulü açıktır.

## Dil düzeyi ve ölçüm sınırları

Pre-A1/A1/A2 çocuğun seçtiği **içerik bantlarıdır**, ölçülmüş CEFR puanı değildir. Harf Korusu her üç banttaki öğrenciye aynı temel İngilizce okuryazarlık yapısını, farklı soru sıralarıyla verir; sınıf 1–2 seçenek sayısı ve soru yükü açısından daha fazla görsel destek alır. İleri düzey fonem birleşimleri, uzun ünlüler, düzensiz yazım, profesyonel tekil fonem ses kayıtları ve okuma hızı ölçümü kapsamda değildir. P0 kazanım haritasında letters üç düzeyde mevcut; phonics Pre-A1 mevcut, A1 kısmi, A2 halen açıklık olarak kalır.

Başarı kanıtı: Görev bazında ilk deneme, yanlış, yardım ve **sesin gerçekten çalıp çalmadığı** farkı yerel oturumda ayrıştırılır. Kayıt verisine yalnız toplam hata, yardım, süre, yanıt sayısı ve bağımsız ilk-deneme oranı gider. Sürükleme/tıklama **bağımsız klavye yazısı** değildir; ses çalmadan görsel yanıt **bağımsız dinleme** değildir. Yıldızlar tam öğrenilmiş fonem anlamına gelmez.

## Veri ve güvenlik

Yeni gameId eski altı ana ada, mevcut altı Kelime Bahçesi dünyası ve kayıt kimliklerinin **hiçbirini değiştirmez**. Her düzey 12 ayrı sayısal levelId kullanır (toplam 36 ayrı ders kaydı). Oyun normal progress repository üzerinden sessionId ile kaydedilir. Yeni veritabanı tablosu veya SQL migration yoktur.

30 günlük cihaz-yerel checkpoint çocuk profili/düzey/ders bazında ayrıdır; yalnız görev ID, sıra, yanlış, ipucu, ses kanıtı ve oturum kimliği saklanır. Çocuğun gerçek yazısı, fotoğrafı, sesi, transkripti kaydedilmez. Tamamlama sırasında ağ/kayıt hatası olursa aynı sessionId ile kayıt yeniden denenir; başarısız kayıt otomatik ödüllendirme yapmaz.

## QA kabul senaryoları

1. İlk dokuz bölümde 26 harfin tümü, her biri tek kez tanıtılıyor; Q ve X özel konumu yanlış seslendirilmiş tek fonem olarak gösterilmiyor.
2. İlk ders sahte tek şıklı kelime sorusu içermiyor; kelime seçme/kurma için daha önce tanıtılmış harfler kullanılıyor.
3. Pre-A1 / A1 / A2 ve sınıf 1 / 3 / 6 kombinasyonlarında tüm 12 ders açılıyor; tekrar oyunlarında görev sıraları değişiyor; doğru seçenek gerçekten listede.
4. Yanlış cevap sonrası destekleyici ipucu sunuluyor. Doğru cevapta otomatik geçiş, son görevde güvenli kaydetme, hata halinde tekrar kaydetme mümkün.
5. İki çocuk profili, İngilizce düzeyi değişimi ve mevcut diğer dünya ilerlemeleri birbirinden ayrı kalıyor. Görevleri yeniden oynatmak eski oyunların yıldızlarını silmiyor.
6. Web, Android WebView, iPhone Safari ve mümkünse iOS simülatöründe 320/360/390/440 px, TTS kesilmesi, sessiz mod, arka plana alma, çevrimdışı ağ ve reduced-motion kontrol edilmeli.
7. İngilizce öğretmeni tüm ses–harf ilişkilerini ve 7–12 yaş çocuk gözlemleriyle kullanılabilirliği ayrıca değerlendirmeli. **CI/build başarılı olması pedagojik onay değildir.**

**Yayın sınırı:** Production deploy, migration ve mağaza yayını yapılmaz. Önce GitHub CI, sonra kullanıcı tarafından yerel/fiziksel cihaz kabulü uygulanır.

## P1.1 — Öğretim revizyonu (17 Kasım 2026)

Yerel çocuk ekranı testinde tek harfin seslendirilmesine İngilizce 'Letter' sözcüğünün eklenmesi ve büyük/küçük harf eşleştirme sorularının ana öğrenme deneyimini zayıflattığı tespit edildi. Ses motoruna artık yalnız harfin **büyük tek karakteri** gönderiliyor; örnek sözcük sesi ayrı tutuluyor. Küçük-harf bulma (`case`) sorularının tümü İngilizce kelime avı (`word-link`) görevleriyle değiştirildi: harf, resim ve Türkçe anlam ile gerçek İngilizce kelime arasında bağlantı kurmak gerekiyor. Ana ders kazanımı İngilizce sözcük tanıma ve kelime içindeki ses; harfin yazım biçimini eşleştirmek değil.

**Geriye dönük uyumluluk:** 12 ders/26 harf, 3 yerleştirme düzeyi, eski `gameId`/`levelId`, kaydedilmiş yıldızlar, çocuk profil kimlikleri ve eski altı ada/dünya korunur. Önceden bitirilmiş derslerin ilerlemesi kaybolmaz. Bitmemiş bir dersin cihazdaki eski `case` görev ID'leri yeni ders dizisiyle uyumsuz olacağından yalnız o dersin yerel checkpoint'i sıfırlanıp yeni öğrenme akışından tekrar başlanabilir. TTS tekil harfleri cihazın İngilizce ses kalitesine göre farklı okuyabilir; profesyonel harf adı/phoneme ses kaydı ve gerçek cihazda ses kontrolü hâlâ açık kabul kapısıdır.

Ek P1.1 QA: Kelime avı seçenekleri bilerek aynı başlangıç harfini (X için aynı son harfi) taşır; salt ilk harfe bakarak doğru cevabı bulmak mümkün değildir. Soru, tanıtılan kelimenin görsel anlamını hatırlatır. İngilizce kelimeyi yeniden seslendirme isteğe bağlıdır ve yardım alınarak ses dinlenirse bağımsız ilk-deneme başarısı olarak sayılmaz. Örnek P seçenekleri pen/pig/pizza'dır.
