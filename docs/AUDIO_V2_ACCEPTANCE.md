# Ventra Audio v2 — ses motoru, dünya müzikleri ve kabul planı

## Kapsam (02 Kasım 2026)
- Birleşik ses yönetimi: ayrı **müzik / efekt / İngilizce konuşma** ses seviyeleri. Cihaz üzerinde kalıcı tercihler; küresel mute. Otomatik mikrofon, kayıt veya ses yükleme **yok**.
- Müzik **ilk açılışta kapalıdır**; yalnızca kullanıcının Ses Ayarları panelinden izin verip başlatmasıyla çalışır. Sekme gizlenince askıya alınır; kullanıcı mute yaptığında kesilir.
- Sekiz orijinal WebAudio ton paleti: Adalar Evreni, Kelime Bahçesi ve altı İngilizce oyun dünyası. Sahne değişimi ile motif değişimi; TTS konuşurken müzikte ducking.
- Altı İngilizce oyunun dinleme/seslendirme çağrıları ortak servisten geçer. Dinleme görevi için 'sesi duydum' kanıtı yalnız **ses başarıyla tamamlandığında** alınmalı; kısa bir başlangıç veya hata bağımsız dinleme ustalığı sayılmaz.
- Mevcut kayıtlı WAV hayvan ve geri bildirim SFX dosyaları bozulmadan kullanılır. Aşırı tekrar tıklamaya SFX cooldown uygulanır.

## Önemli kalite sınırı
Bu v2 **teknik ses altyapısı + özgün sentez müzik** güncellemesidir, tüm içerik için profesyonel stüdyo ses kaydı veya mastering değildir. Mevcut 4 kayıtlı hayvan sözcüğü dışındaki pek çok kavram platform TTS'ine bağımlıdır. TTS sağlayıcı, ses tipi, offline kurulum ve tarayıcı izni cihaza göre değişir. Offline İngilizce ses paketleri, özgün Foley/SFX mastering ve gerçek çocuklarla değerlendirme hâlâ yayın kabul kapısıdır.

## QA / yayın kapısı
1. Web Chrome/Edge/Safari: ilk açılışta otomatik müzik yok; Ses Ayarları üzerinden kullanıcı açıkça açar, sonra 8 sahne durumu arasında geçilir.
2. Mute tüm SFX, kayıtlı ses, TTS ve müziği keser. Açılınca yalnız kullanıcının önceden etkinleştirdiği müzik geri gelir.
3. Sekme gizleme/geri dönme, kilit ekranı, ses seviyesi 0, çok hızlı tekrar dinleme, 2 çocuk profili, sayfa yenileme, cihazda depolama engeli ve uygulama offline denemeleri.
4. Ses dinlenmeden **listen mastery** verilmez; TTS hata/unsupported durumunda yazılı yardım bağımsız dinleme puanı değildir.
5. Android Chrome/WebView, iOS Safari/Capacitor ve mümkünse VoiceOver/TalkBack ile gerçek cihaz ses, CPU, kesintisiz oynanış testleri. Müzik ses yüksekliği çocuk kulağı için rahatsız edici olmayacak şekilde gerçek kulaklıkta ölçülür.
6. Kod için TypeScript, otomatik test, production web build, Android/iOS CI sonuçları; fiziksel cihaz QA'sı ayrı olarak kaydedilir.

Yeni SQL migration, ödeme, abonelik, Vercel deploy veya çocuk profil veri şeması değişikliği yok.
