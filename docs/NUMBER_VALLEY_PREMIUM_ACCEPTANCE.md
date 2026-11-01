# Ventra Kids — Sayı Vadisi premium içerik / teknik kabul (2026-11-01)

## Durum
Kodda **NV1–NV3 ve görsel kalite sprinti uygulandı**. Güncel `main` workflow'unun gerçek sonucuna göre CI kabulü ayrıca doğrulanır. Bunlar **mağaza yayını için onay** anlamına gelmez.

## Oynanabilir beş görev
| Bölüm | Gerçek etkileşim | Öğrenme kanıtı | Kaydedilen ilerleme |
|---|---|---|---|
| 1. Kristal Keşfi | 6–8 sayı kristaline tek tek dokunma, telaffuz | discovery (yalnızca tanışma) | Birinci görev yıldızları, keşfedilmiş sayılar |
| 2. Işık Köprüsü | Arap rakamından İngilizce kelime seçimi, köprü taşlarının ışıldaması | recognition | hata, bağımsız doğru, süre, yıldız |
| 3. Yıldız Hasadı | Sınıf/İngilizce sınırına göre 1–20 tekil yıldızları seçip geri bırakma | quantity | miktar bilgisi ve doğru/yanlış |
| 4. Yankı Kanyonu | Sesli İngilizce sayı duyma, sayı taşına dokunma | listening; gerçek TTS playback başlamadıysa bağımsız sayılmaz | yardım/yanlış/ses durumu |
| 5. Portal Onarımı | Önce fiziksel kristal sayma, sonra İngilizce şifre çözme | application | iki aşama sonrası cevap kanıtı |

## Görsel ve kullanılabilirlik
- Her bölüme özgü, koddan çizilen çevrimdışı SVG dünya: kristal tapınağı, ışık köprüsü, yıldız arazisi, yankı kanyonu ve portal.
- Arkaplan, navigasyon ve erişilebilir HTML kontrolleri ayrıdır; düşük donanımda oyun mekaniği Phaser/WebGL gerektirmez.
- Köprü taşları, portal ilerlemesi ve yalnızca **gerçekte konuşma sürerken** canlanan ses dalgaları vardır.
- 320px ekran, dokunma hedefleri, safe-area, klavye odağı, semantik etiketler ve reduced-motion stili için kod önlemleri uygulanmıştır. Gerçek cihaz ve ekran okuyucu kabul testleri ayrıca gerekir.
- Metinsel/yazılı yardım ses bulunmadığında oyunu durdurmaz. Bu yardım kendi başına dinleme yeterliliği sayılmaz.

## Tekrar oynama / pedagojik sınırlar
- Aynı görev tekrar oynanır; 1–20 havuzundan farklı sayılar ve geçmiş hatalardan tekrarlar seçilir.
- Pre-A1: 1–10, 1–2. sınıf: daha az keşif / 2 seçenek, üst sınıflarda 1–20 ve ek sorular; mevcut profilsiz sınıf davranışı korunur.
- Yalnızca keşfedilmiş sayı quiz havuzuna girer; tek bir yıldız toplamı öğrenme ustalığı olarak yorumlanmaz.
- Yanlışlar sonraki oturumlarda P3 sayılar alanına aktarılır; ipucuyla doğru bağımsız başarı sayılmaz.

## Veri bütünlüğü
- `gameId: island_word_garden_numbers` ile hayvan/renk ilerlemesinden bağımsızdır.
- Her bölüm için en iyi 3 yıldız: aynı sessionId yeniden gönderildiğinde çift ödül oluşmaz.
- Cevap kanıtları `metrics.numberAnswers` üzerinden Memory/IndexedDB ve profile bağlı olay eşitlemesinde saklanır.
- Kelime Bahçesi yüzdesi artık **13 toplam görev** üzerinden hesaplanır (5 hayvan, 3 renk, 5 sayı).

## QA kapıları / gerçek cihaz kontrolü
- [ ] 1. sınıf Pre-A1 ile beş görev 320px telefon ekranında tamamlandı.
- [ ] 7. sınıf A2 ile 13–20 sayıları miktar toplama + portala girebiliyor.
- [ ] 3 ayrı yeniden oynama turunda kelime çeşitliliği ve zayıf sayı tekrarı gözlendi.
- [ ] Sessiz / ses sentezi olmayan cihazda dinleme yordamı yanıltıcı mastery kaydetmiyor.
- [ ] Sayfa yenileme, çevrimdışı/çevrimiçi geçiş ve farklı çocuk profili arasında veri tutarlılığı onaylandı.
- [ ] Android WebView + iOS Safari/Capacitor gerçek cihazlarda ses, FPS, 20 dakika kullanım ve erişilebilirlik testleri tamamlandı.
- [ ] Çocuk kullanım testi, yaş uygunluğu, uygulama mağazası Families/Data Safety ve güvenlik denetimi onaylandı.

**Not:** TTS sesinin aksanı/kalitesi cihaza bağlıdır; profesyonel kayıtlı 1–20 telaffuz dosyaları bu sürüme dahil değildir. Yüksek ses kalitesi ve cihazlar arası tutarlılık için ayrı offline ses paketi hazırlanmalıdır. Bu gerçek cihaz/yayın kapısını gizleyerek “RELEASE READY” denmemelidir.

## 2026-11-01 — Genişletilmiş premium kapsam 1–1000
- **Kristal Patikası:** 1–20; tüm profillerin temel keşif yolu. Pre-A1 1–10 ile sınırlandırılır.
- **Onluklar Geçidi:** 21–100; orta/üst sınıf A1/A2 öğrencileri için, temel yoldaki en az sekiz keşiften sonra.
- **Binlikler Zirvesi:** 101–1000; 5–8. sınıf A2 için, onluk yolunda en az altı keşiften sonra.
- 1000 tane buton çizilmez: 1–20 tekil nesne toplama; 21–1000 yüzlük/onluk/birlik bloklarıyla fiziksel sayı inşa etme.
- 0–1000 İngilizce yazı ve cihazda TTS telaffuzu üretilir; oynanabilir soru hedefi 1–1000'dir.
- Portalın üçüncü adımında sanal pazarda iki fiyat karşılaştırılır; gerçek ödeme içermez.
- Her yolda beş ayrı tamamlanabilir görev; ayrı kayıt ID'leri: 1–5, 6–10, 11–15. Toplam en fazla 45 yıldız. Eski 1–5 kayıtları aynen korunur.
- Tekrar, hatalı cevaplar, çocuk profili izolasyonu, keşfedilmemiş sayı sınavı yasağı ve P3 zamanlama kuralları korunur.
- **Dikkat:** Yüksek sayıların oynanabilmesi her sınıfta uygun olduğu anlamına gelmez. Sınıf ve İngilizce seviyesine bağlı açılma kuralları kullanılır. 1–1000 aralığının her üyesi öğrenme havuzuna dahil olsa da, tek oturumda tamamının öğretilmesi hedeflenmez.
- Gerçek cihaz ve bağımsız pedagojik değerlendirme yine yayın kabul kapısıdır.
