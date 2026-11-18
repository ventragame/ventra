# Ventra — Diyalog Limanı P0: çocuk ekranı / yetişkin ses ayarları ayrımı

## Gerçek uygulama

- Oyun görevinde **yalnızca** dinle, sesle cevapla, durdur, dokunmatik cevap ve yardım et akışları görünür.
- Sesli tanıma kullanılamazsa veya başarısız olursa çocuğa kısa yönlendirme gösterilir. Oyun, seçeneklere dokunarak tamamlanabilir. Mikrofon zorunlu değildir.
- Teknik kodlar, sağlayıcı bilgileri, yerel model kurulumu ve alternatif motorlar görev ekranındaki açılır alandan kaldırılıp ayrı **HarborSpeechAdultPanel** bileşenine taşındı.
- Yetişkin paneli önce uygulamadaki matematik tabanlı **ParentalGateModal** kontrolünden geçildikten sonra açılır; panel kapatıldığında yeniden kontrol gerekir. Bu kontrol **gerçek kimlik doğrulaması değildir**. Bağımsız sunucu STT için ayrıca geçerli yetişkin oturumu aranır.
- Yerel tanıma çalışmazsa başka bir konuşma sağlayıcısına otomatik geçiş yapılmaz. Yanlış duyulmuş İngilizce transkript, çocuk ekranında tekrar edilmez.
- Ses motoru, teknik hata ve hata nedenleri sadece yetişkin alanındadır. Veriler yalnızca durum/kod şeklindedir, çocuk konuşmasının tam metni saklanmaz.
- Browser STT cihaz dışında işleme yapabilir; bu nedenle çocuk ekranında kısa açıklama, yetişkin alanında daha ayrıntılı üçüncü taraf açıklaması vardır.

## QA / kabul kriterleri

1. 320/360/375/430 piksel genişlikte çocuk sorusu, A/B cevapları, konuşma ve yardım düğmeleri taşmadan görünür.
2. Çocuk konuşma denemesi başarısızsa teknik hata kodları, model isimleri, WASM/Chrome ayarları görünmez; dokunmatik seçim her zaman çalışır.
3. Haritadaki ses ayarları ve oyun içi yetişkin yardımı önce ebeveyn kontrolünü gösterir; doğrulama tamamlanmadan panel içeriği DOM'a eklenmez.
4. Panelde motor değiştirme, yerel İngilizce paketi, sunucu tabanlı STT (açıksa) ve hata kodları sadece yetişkin katmanındadır.
5. Ekran kapanışı, arka plana geçiş ve sahneden çıkış mikrofonu durdurur. Yetişkin panelini açmak aktif kaydı durdurur.
6. Yerel motor hata verdiğinde otomatik tarayıcı sunucusuna geçiş olmaz; yetişkin açıkça seçebilir.
7. Kullanılan gelişmiş STT SDK / ağ ve Android/iOS cihaz davranışları ayrıca gerçek cihazda test edilmelidir; static CI bunların fiilen hatasız olduğunu kanıtlamaz.

## Doğrulama

- `npm run type-check -w @ventra/web`
- `npm run test -w @ventra/web`
- GitHub Actions: Ventra Kids Slice QA; web/Android ve iOS simülatörü ayrı takip edilir.

Production'a otomatik deployment yapılmaz.
