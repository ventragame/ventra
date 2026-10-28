# Görsel tasarım ve çocuk dostu UX standardı

## Sanat yönü

- Fantastik **2D/2.5D sahne tabanlı** ada macerası: şelale, katmanlı bitki/taş, ahşap köprü, yumuşak gün ışığı, sıcak karakterler.
- Önceden onaylanan Ventra renkli premium karakter/robot dünyasıyla bütünlük. Görsel referans: `references/kesir-koprusu-concept-reference.png`.
- Sahnedeki parçalar **oyun nesnesi** gibi görünür; büyük kesir paneli üzerinde sürüklenen düz UI kartları gibi değil.
- Hafif ve okunaklı 2.5D; tam açık dünya/gerçekçi 3D **yok**.
- Orijinal/lisansı uygun asset kaynakları. Lisans/dosya provenansı raporlanır.

## Üretilecek gerçek asset'ler (ayrı dosyalar)

| Grup | Gereken | Not |
|---|---|---|
| Arka plan | Uzak ada/şelale/gökyüzü, orta katman kayalık, yakın ot | Parallax; mobilde farklı kadraj mümkün |
| Köprü | Sol kıyı bağlantısı, sağ kıyı, 3 yuva, ahşap kalas, korkuluk | Her nesne ayrı katman, animasyona uygun |
| Oyuncu | Mevcut seçili avatarı gösterecek uyumlu oyun içi temsiller; en az idle/walk/celebrate | Mevcut avatar sistemi farklıysa uyumluluk planı; sabit erkek çocuk çizimi dayatma |
| Robot | idle, işaret etme, sevinme, kısa geri bildirim | Oyun içi yardımcı, gereksiz diyalog yok |
| Efekt | Yerleşme/snap parıltısı, doğru bağlantı, hafif konfetiler | Kısa, göz yormayan |
| Ses | Dokunma, yerleşme, tamamlanma, ortam; sessiz seçenek | Yüksek ses/patlama yok; mute kalıcı |
| UI | Küçük HUD, ipucu, bölüm kontrolü, başarı overlay | Türkçe karakterleri doğru font ile göster |

**KRİTİK:** Kompozit konsept/poster **sprite sheet değildir**; bütün posterin tek PNG'sini oyun arka planı yapıp üstüne UI kalasları eklemek kabul edilmez. Asset yoksa bunu açıkça raporla ve üretim engeli olarak belirt; emojiler ve tek renkli dikdörtgenleri "premium" diye sunma.

## Renk / okunurluk

- Tamamlayıcı parlak turkuaz, mavi, doğal yeşil, sıcak ahşap; ana oynanış alanı kontrastlı.
- Neon çerçeveli büyük koyu paneller sahnenin çoğunu örtmez.
- Kesir sayıları düzgün Türkçe font/Unicode ile ve yüksek kontrastta.
- Kesir metni ve boyut temsili birlikte sunulur; renk tek başına doğru/yanlış sinyali olmaz.
- Çok hareketlilik görsel yük oluşturmasın; `reduced motion` / kısılmış animasyon tercihleri dikkate alınır.

## Mikro-etkileşimler

1. Plank seçilince hafif yükselir ve gölge oluşur.
2. Yuvaya yaklaşınca önizleme parlaklığı artar.
3. Yerleştirme < 300 ms süren net bir snap hissi verir.
4. Yanlış eşleşmede nazik işaret/robot ipucu, cezalandırıcı sarsıntı yok.
5. Başarıda korkuluklar tamamlanır, karakter gerçekten doğru platform yolunu izler.
6. Kutlama ve sonuç toplamda kısa; çocuk `geç` kontrolüne sahip olabilir.

## Erişilebilirlik ve çocuk tasarımı

- Basit kelimeler, tek hedefli görev, ikon + metin birlikte.
- Oyun başında zorunlu uzun metin yok; hedef oyuncu okumayı sürdürebilmeli.
- Sürükleme başarısızsa seçip yuvaya dokunma eşdeğeri var.
- Ses olmadan tamamı oynanabilir.
- Başarısız denemede ilerleme kaybı yok.
- Çocuğa reklam, hesap oluşturma veya satın alma baskısı bu bölümde gösterilmez.
- Kişisel avatar tasarımı kapsayıcıdır; profil verisi başka oyuncuya karışmaz.

## Görsel kabul kapısı

Sadece ekran görüntüsü değil: **başlangıç, sürükleme, yanlış feedback, başarı, mobil portre** için gerçek çalışan oyundan ekran/tercihen kısa kayıt. Her örnek eldeki referansla **sahne derinliği, avatar, bütünleşik tahta yerleşimi ve UI sadeliği** bakımından karşılaştırılır.
