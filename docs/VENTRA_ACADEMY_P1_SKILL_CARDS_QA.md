# Ventra — Keşif Akademisi P1: Beceri kartları ve görev geçişleri

## Doğrulanmış ürün kapsamı
- Altı bölüm x üç kurgulanmış senaryo x üç seviye x beş beceri = **270 görev kimliği**. Bu, 270 bağımsız hikâye anlamına gelmez.
- Ana plan: `hear → read → talk → build → write`.
- Hedefli tekrar: üç farklı durum, fakat **aynı beceri**; ana bölge yıldız ödülünü artırmaz.

## Bu revizyon
- `AcademySkillSystem.tsx` içinde beceri kartları, aktif görev başlığı ve başarı/yardım geri bildirimi ortaklaştırıldı. Kartlar planın `tasks` dizisinden üretildiği için tekrar akışını beş göreve zorlamaz.
- Tamamlanan / şimdi / sırada durumu; kilitli görevi atlatmayan, salt gösterim kartları. Mobilde bağımsız yatay kaydırma ve seçili görevi şeritte görünür tutma.
- Her becerinin sade görev yönergesi: dinle, oku, konuş, cümle kur, yaz. Konuşma ekranında dokunmanın bağımsız ses başarısı olmadığı açıkça ifade edilir. Pre-A1 klavye yerine kartla tamamlama yardımlı kabul edilir.
- Üst üste iki başarı mesajı yerine tek görev durum paneli. Otomatik geçiş 700 ms'den 1400 ms'ye çıkarıldı. Yeni görevde oyun içi kaydırma bölgesi gerekli konuma kayar; tüm tarayıcı sayfasının odağı değişmez.
- Klavye girişi 16 px, otomatik düzeltme/otomatik büyük harf kapalı, Enter ile boş cevap gönderimi engellendi. Min. 44 px dokunma yüzeyi ve düşük hareket tercihi.
- Eski sahne üstü başarı katmanı ve artık kullanılmayan stili kaldırıldı. Mevcut WebP sahneler, karakter, müfredat, özgün soru formatları korunur.

## Değişmeyen veri ve puanlama
- `academyEngine` ve `academyCheckpoint` değiştirilmedi.
- Mikrofon yalnızca desteklenen yerel konuşma tanıma modlarında etkin; dokunma yolu konuşma kanıtı sayılmaz.
- İpucu seviyeleri, bağımsız cevap koşulları, kayıt idempotence, profil izolasyonu, yarım oyun checkpoint koruması aynı.
- Yazılı öğrenci yanıtları, mikrofon sesleri ve transkriptler checkpoint'te tutulmaz.

## QA
- 320, 360, 390, 430 px mobil ekranlar; tablet ve masaüstü; yatay / dikey görünüm.
- Beşli ana plan, üçlü tekrar, önce dinle sonra seç, mikrofon izni reddi, yanlış cevap ve iki ipucu aşaması, yazma/kart desteği, yıldız kayıtları.
- Klavye açılıp kapandığında girdi odağı, uzun A2 metinleri, 200% yazı yakınlaştırma, 44px kontrol alanı, düşük hareket.
- Kayıt kesintisi, checkpoint geri yükleme, hızlı geri dönüş ve yeniden başlatma.
- CI TypeScript, regresyon testleri, production web, Android debug ve iOS simülatör. CI yeşil olsa bile fiziksel cihazda ve çocuklarla UX testi ayrıca gereklidir.
- Production deploy yapılmaz.
