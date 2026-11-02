# NV English gameplay & Audio V3 — 2026-11-02

## Karar
- Ventra Sayı Vadisi'nin hedefi matematik işlemi değil **İngilizce sayı kelimeleri ve günlük ifade kurabilme** yeteneğidir.
- NV3 Yıldız Hasadı artık "5 yıldız topla" matematik görevi **değil**. "Yıldız Kelime Avı": sayının **İngilizce sözcüğünü** kısa yıldız-harf/öbek parçalarıyla **doğru sırada kurma**, dinleme ve yazılı destek.
- NV5 Portal, "kristal say, en ucuzu seç" olarak oynanmıyor. İngilizce sayı adını seç, **I see five stars** cümlesini doğru sırada kur, doğru İngilizce cümleyi seç.
- NV2 sayı → İngilizce kelime tanıma, NV4 dinleme → sayı seçme; NV1 keşif/telaffuz. Beş farklı kelime görevinde ek hesaplama/pazar/bütçe sorusu kalmaz.
- NV3 yeni yanıtların P3 beceri kanıtı 'application' olarak kaydedilir. Eskiden kaydedilmiş quantity kanıtı tutulur; SQL migration yok, profil/yıldız/coin silinmez.
- Başarılı her soru sonrası 1050 ms sonra otomatik geçiş; bölümü bitirince kutlama/ödül ve isteğe bağlı tekrar ekranı kalır. Kaydetme hataları otomatik geçişe neden olmaz.
- Oyun içindeki sesler: özgün WebAudio renkli doğru üçlemesi, yumuşak yanlış üçlemesi, 6 notalı kısa görev finali; WebAudio kullanılamıyorsa eski yerel WAV. Müziklerde daha hareketli tempo, bas ve düşük seviyeli perküsyon. Önceki ayrı ses seviyesi, mute ve kullanıcı onaylı başlatma korunur.

## Yayın/test kapıları
- [ ] Gerçek mobil ses kalitesi, kulaklıkta ses yüksekliği ve anlaşılabilirliği
- [ ] 7–9 yaş çocuklarla spelling parçalarının zorluk, tekrar ve bilişsel yük testleri
- [ ] iOS Safari / Android WebView TTS, offline ses yokken yazılı yardım
- [ ] Otomatik geçiş, farklı profiller, tekrar oynama, yeni/önceki ilerleme ve idempotent ödüller
- [ ] TypeScript, CI testleri, web build, mobil build (GitHub Actions)
- Profesyonel kayıt/mastering, İngilizce ses kayıt dosyalarının tam kapsamı halen ayrı iş; mevcut sentez müziği gerçek orkestral kayıt gibi tanıtmayın.
- Vercel deployment ve canlı DB migration yapılmadı.
