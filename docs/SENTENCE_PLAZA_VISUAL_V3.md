# Cümle Meydanı — V3 Pedagojik Netlik ve Özgün Meydan Görselleri

## Ekran incelemesinden çıkan kusurlar
- Eski sahneye yanlışlıkla Kelime Bahçesi'nden dev bir uçan kitap-kale resmi bağlanmıştı; kullanıcı bunu reddetti
- Bazı Türkçe soru yönergeleri (örn. “köpek evin arkasında mı?”) küçük harfle başlıyordu
- “Yanlışı bul” deyip hatalı İngilizce kelimeleri tek açıklamasız butonlar halinde vermek çocuk için anlaşılır değildi
- Henüz yanlış sözcük bulunmamışken diğer cümle kelimeleri gri/pasif görünüyordu
- Diğer cümle oyunlarında benzer ipucu, onarım ve uzun metin sorunları vardı

## Yapılanlar
1. **Gerçek özgün WebP dosyaları:** `public/assets/sentence-plaza/v3/plaza-world.webp` – çeşmeli, saat kuleli sıcak bir kent meydanı; 6 ayrı görev kapağı `mission-{1..6}.webp`. Önceki yeniden kullanılan Kelime Bahçesi WebP'leri V2'de kaldı, V3 artık bunları kullanmıyor.
2. **İlk harf standardı:** Tüm 6 görev × Pre-A1/A1/A2 cümle havuzunda Türkçe ipuçları Türkçe locale ile baş harfi büyük üretir; İngilizce cümle yuvaları/onarım cümleleri de İngilizce ilk harfi büyük gösterir. Kalıcı cevap anahtarları ve grading değişmez.
3. **Anlamlı onarım:** Yalnızca tek içerik sözcüğü farklı olan, kendi içinde anlaşılır bir İngilizce cümle gösterilir (örn. *Köpek evin arkasında mı?* hedefi için *Is the dog under the house?*). Çocuk hedef Türkçe anlamı kullanarak farklı kelimeyi bulur. Doğru yerine konduğunda asıl İngilizce cümleyi kurar.
4. **Net adımlar:** “Bu İngilizce cümlede bir kelime yanlış. Türkçe anlamla karşılaştır ve dokun.” Cümle yapma aracı ilk seçimden önce gizlenir, pasif kelime yığını yok.
5. **Çocuk dostu kısa kontroller:** “Dinle”, “İpucu”, “Canlandır”, açıklamaların açılır yardım altında tutulması, 44+px dokunma alanları.
6. **Diğer oyunlara uygulama:** Hareket Büyüsü, İstekler Meydanı ve Fener Festivali görevlerinde aynı ilk harf ve onarım gösterimi, kısa eylemler, okunabilir odak/yardım alanları.

## Değişmeyenler
- `saveSentencePlazaMission`, zorluk/kazanım politikası, soruların doğru cevapları, ilerleme ve yıldızlar
- Görevlerin kaydedilmesi, ses hizmeti ve doğru cevaptan sonra otomatik geçiş
- Profil RLS, veritabanı şemaları, ödeme sistemi
- Production deploy yapılmadı

## Test
`sentence_clarity_v3.test.mjs` test:ci kapsamında 18 dil/görev havuzunu tarar, Türkçe ilk harfi ve onarımın tam bir kelime olmasını denetler; tüm dört UI'da ortak ilk harf/onarım/yardım sözleşmesini ve 7 RIFF/WEBP dosyasını doğrular.
GitHub Actions: TypeScript, test:ci, web build, mobil export ve Android/iOS işleri gözlemlenmeli. Gerçek cihazda görsel kontrol ayrıca gereklidir.
