# Yazı Atölyesi L5 — Oynanabilir İngilizce yazı yolculuğu

## Kaynak ve kapsam
Kanonik `docs/PRODUCT_ROADMAP.md` ve `docs/VENTRA_ENGLISH_LEARNING_JOURNEY_V2.md` belgesindeki L5 rolü korunur. `sentence_workshop` kararlı ada ID'sidir; yeni oyun kaydı `island_sentence_workshop_writing` ile ayrı tutulur. Bu sürüm Cambridge/YL ilkeleriyle benzer etkinlikler içerir; **resmî CEFR/MEB yeterlilik sertifikası değildir**.

## Oyun tasarımı
- Beş ayrı hikâye bölümü: Harf Postanesi, Dostluk Defteri, Renkli Kartpostallar, Liman Mektupları, Küçük Hikâye Kitabı.
- Her biri Pre-A1/A1/A2 için ayrı 21 özgün soru içerir: toplam **315 içerik satırı**. Eski 225 görevin kimlikleri değiştirilmeden 90 yeni görev eklendi.
- Sınıf 1–2 için 6, sınıf 3–4 için 7, sınıf 5–8 için 8 görev; sınıfı eksik profillerde 7 görev. Önceden başlamış yarım oturumlar eski 3/4/5 görevli düzenleriyle açılır. İngilizce seviyesini sınıftan bağımsız uygular.
- **Tekrar oynama**: Her bölüm/seviyede 7 harf-yazımı, 7 cümle-sıralama ve 7 bağımsız yazma sorusu içeren üç ayrı bankadan seçim yapılır. Profilin o bölümdeki tamamlanmış deneme sayısı, üç bankanın farklı döndürülmesini yönetir. Böylece aynı bölüm ve yerleştirme düzeyi için **343 ayrı görev kombinasyonu** oluşur; ardışık iki tur hiçbir aynı soru ID'sini içermez. Bunlar 125 tamamen farklı metin değil, 21 ayrı sorudan yapılmış 343 kombinasyondur; içerik sınırlılığı korunur.
- Yarım kalan oyunda kullanılan `playIndex` ve `taskIds` yalnız kategori/ID biçiminde, profil/yerleştirme/bölüm anahtarına bağlı checkpoint'te korunur. Eski checkpoint'ler kendi sabit ya da döndürülmüş 3/4/5 görevlik setleriyle devam eder; yeni oturumlar 6/7/8 görevlidir. Çocuğun yazdığı metin kaydedilmez.
- Görsel olarak Keşfet / Deneyerek Yaz / Kendi Başına aşamaları gösterilir; ekstra ekran ya da düğme yoktur. İkinci yanlışta kelime sayısı ve başlangıç harfi/kelimesi için kısa bir ipucu görünür. Çeşitlendirme, geçmiş başarıya duyarlı aralıklı tekrar veya açık uçlu yazının öğretmen düzeyinde puanlanması değildir. Bunlar ayrıca geliştirilecek ve dil uzmanıyla doğrulanacaktır.
- `spell`: resimli harflerle sözcük inşası; `assemble`: anlamlı cümle dizme; `write`: gerçekten metin girişi. Yazma doğruluğu için yalnız açıkça kabul edilen İngilizce hedef kalıplar kullanılır; serbest metne AI veya anlamsal puan verilmez.
- Yanlış cevaplar cezalandırıcı değildir. İsteğe bağlı model telaffuzu/görünür örnek yardıma sayılır. Dokunmatik harf bankası bağımsız klavyeyle yazılmış cevap olarak sayılmaz.
- Bölüm sonunda yalnızca kaydedilmiş yıldızlar ve **bağımsız yazım** sayısı gösterilir. Serbest kısa not alanı tamamen isteğe bağlıdır, puanlanmaz, kaydedilmez ve paylaşılmaz.
- `GameCompletedPayload.metrics.writingAnswers` yalnız `taskId`, `mode`, ilk denemede doğruluk, yardım/yanlış sayısı ve bağımsız klavyeyle yazım bayrağını içerir. Çocuğun yazdığı gerçek metin hiçbir metrikte veya checkpoint'te saklanmaz.
- IndexedDB/Memory progress, mevcut Supabase event sync ve profille ayrılmış checkpoint; 30 gün TTL. Aynı kaydetme oturumu tekrar denemelerde sabit kalır. Veritabanı migration gerekmez.
- Lottie gerekmeyen öğrenme adımlarında ağır animasyon yüklemiyoruz. Önceden mevcut 3D WebP ada resmi korunur; çocuk odaklı kalem/kâğıt tasarımı ve reduced-motion kullanılır.

## Yayına geçiş ve kalite kapıları
- `contentPublished` yalnız TypeScript, web testleri, web static export, Android debug ve iOS Simulator CI kontrolünün başarılı olmasından sonra açılmıştır. Son söz yine fiziksel cihaz ve dil öğretmeni kabul testindedir.
- Gerçek cihazda 320/360/390/440 px; dokunmatik klavye, uzun A2 metni, ekran okuyucu, düşük ağ hızı, IndexedDB kapalı ve oturum kesilmesi kontrol edilmeli.
- Dil öğretmeni onayı, çocuklarla gözlemli kullanılabilirlik ve gerçek öğrenme kazanımı ölçümü otomatik testlerin yerini tutmaz.
- Production deploy yok; GitHub ve yerel kontrol üzerinden ilerlenir.
