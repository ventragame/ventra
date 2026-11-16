# Yazı Atölyesi L5 — Oynanabilir İngilizce yazı yolculuğu

## Kaynak ve kapsam
Kanonik `docs/PRODUCT_ROADMAP.md` ve `docs/VENTRA_ENGLISH_LEARNING_JOURNEY_V2.md` belgesindeki L5 rolü korunur. `sentence_workshop` kararlı ada ID'sidir; yeni oyun kaydı `island_sentence_workshop_writing` ile ayrı tutulur. Bu sürüm Cambridge/YL ilkeleriyle benzer etkinlikler içerir; **resmî CEFR/MEB yeterlilik sertifikası değildir**.

## Oyun tasarımı
- Beş ayrı hikâye bölümü: Harf Postanesi, Dostluk Defteri, Renkli Kartpostallar, Liman Mektupları, Küçük Hikâye Kitabı.
- Her biri Pre-A1/A1/A2 için ayrı 5 özgün soru içerir: toplam 75 içerik satırı.
- Sınıf 1–2 için 3, sınıf 3–4 için 4, sınıf 5–8 için 5 görev; sınıfı eksik profillerde 4 görev. İngilizce seviyesini sınıftan bağımsız uygular.
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
