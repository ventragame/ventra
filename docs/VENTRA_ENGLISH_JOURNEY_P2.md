# P2 — İngilizce Yolculuğum | Oynanabilir Müfredat Rehberi

**Giriş:** Adalar Evreni → Şimdi ne öğrenmeliyim? → İngilizce Yolculuğum
**Kanonik öneri motoru:** apps/web/src/lib/learning/englishCourseJourney.ts
**Ekran:** apps/web/src/components/learning/journey/EnglishJourneyDashboard.tsx
**Müfredat:** apps/web/src/lib/learning/englishCurriculum.ts
**Veritabanı migration / production deploy:** Yok.

## Ürün kapsamı
P2 yeni bir yedinci ada veya yeniden yazılmış oyun değildir. P0'daki 14 gerçek öğretim yüzeyinin çocukların seviyesine ve oyun kayıtlarına göre gösterildiği ana eğitim rehberidir. Gap olarak işaretli sistematik dersler oyun gibi sunulmaz. Mevcut altı ada kimliği korunur.

**Yedi öğrenme durağı:**
1. İlk İngilizcem: Harf Korusu + Hayvan Çayırı.
2. Rengârenk Dünyam: Renk Korusu, Sayı Vadisi, Lezzet Pazarı, Aile Köyü.
3. Cümle Kuruyorum: Keşif Tapınağı + Cümle Meydanı.
4. Hikâye Zamanı: Hikâyeyi Keşfet, Sonra Ne Oldu?, Hikâye Dedektifi.
5. Birlikte Konuşalım: Diyalog Limanı.
6. Kendi Kelimelerim: Yazı Atölyesi.
7. Büyük Keşif: Keşif Akademisi.

## Karar ve kayıt ilkeleri
- Her yüzey gerçek gameId üzerinden getAllLevelProgress ile okunur; Harf Korusu Pre-A1/A1/A2 ders kayıtları 12 ayrı sayısal levelId üzerinden ayrılır.
- Sayı Vadisi için sınıf ve İngilizce düzeyine göre erişilebilir 5/10/15 seviye üst sınırları korunur. Sınıf tek başına İngilizce yeterliliği değildir.
- Pre-A1 başlangıcında harf ve hayvan sözcükleri dönüşümlü öğretilir. A1/A2 öğrencileri zorunlu alfabetik başlangıca gönderilmez. Bütün oyunlar kendi gerçek erişim kuralları içinde elle seçilebilir.
- Renk Korusu, Hayvan Çayırı tamamlandığında; Sayı Vadisi Renk Korusu tamamlandığında açılır. Bunlar eski oyun kilitleridir. P0 pedagojik önkoşulları yeni sert erişim kilitlerine dönüşmez.
- Eski island_word_garden veya phaser_exploration_island tamamlama kayıtları doğrulanır. Eski kayıt yüzünden çocuk yeni ekranda Renk Korusu'nu yanlışlıkla kilitli görmez.
- Yükleme hatasında oyunun durumu unknown/error olur. Bu oyun '0 görev tamamlandı' olarak sunulmaz; yeniden yükleme sağlanır ve kayıtlar değiştirilmez.
- Oyun yıldızı ve bölüm tamamlama dil ustalığı, bağımsız konuşma veya resmî CEFR sertifikası değildir. Düşük oyun doğruluğu varsa yalnız destekleyici tekrar önerisi verilebilir.

## Navigasyon sözleşmesi
- kids/page.tsx: İngilizce Yolculuğum girişi, mobil araç menüsü ve harita üzerindeki rehber düğmesi.
- EnglishJourneyDashboard.onOpenSurface → P0 CURRICULUM_SURFACES içindeki doğrulanmış ada/oyun kimliği.
- LearningPathModal.initialSurface: Harf Korusu, Hayvan Çayırı, Renk Korusu, Sayı Vadisi, Lezzet Pazarı, Aile Köyü ve Keşif Tapınağı doğrudan açılır.
- StoryForestHome.initialGame: Hikâyeyi Keşfet, Sonra Ne Oldu?, Hikâye Dedektifi doğrudan açılır.
- Cümle Meydanı, Diyalog Limanı, Yazı Atölyesi ve Keşif Akademisi zaten mevcut bağımsız oyun bileşenlerine yönlenir.
- Var olan /kids?open=island deep-link davranışı, Phaser ada seçimi, altı ada ve eski çocuk profili ID/coin/yıldız kayıtları değişmez.
- Oyun Yolum (oynama modu) ile İngilizce Yolculuğum (öğrenme rehberi) farklı işlevlerdir.

## QA kapısı
1. P0'daki 14 gerçek yüzey ve altı ana ada kimliği korunur. Yeni dersler sahte linklerle işaretlenmez.
2. Sıfır Pre-A1 profilde Harf Korusu, A1/A2 profilde hayvan kelimeleri önerilir. Diğer oyunlar serbestçe seçilebilir.
3. Hayvan→renk→sayı kilidi ve eski bütün-ada kayıtları doğru yansıtılır.
4. Farklı çocuk profilleri ve üç İngilizce başlangıç düzeyi arasında yanlış kayıt karışımı olmaz.
5. Bağlantı/IndexedDB hataları sıfırmış gibi raporlanmaz; güvenli hata durumu ve tekrar yükleme bulunur.
6. Otomatik testler, TypeScript, production web, mobil export ve Android/iOS CI; ayrı ayrı kontrol edilir.
7. 320/360/390/430 piksel mobil, dokunmatik, yatay telefon, ekran okuyucu, çevrimdışı ve cihaz-yerel sesler manuel doğrulanır.
8. Eğitim kalitesi ve kalıcı İngilizce öğrenimi çocuk ve dil öğretmeni testleriyle ayrıca doğrulanmalıdır.

**Sınır:** Bu sürüm resmi, bağımsız değerlendirmeyle doğrulanmış adaptif İngilizce seviye motoru değildir. Yalnız mevcut oyuna güvenilir rehberlik ve oynanmış görev kayıtlarına dayalı öneri sağlar.