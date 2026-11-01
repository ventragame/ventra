# Ventra Kids — P4 Premium Oyun Dünyası Kabul Testi

Bu belge P4.1–P4.4 yazılım teslimi ile P4.5 son kullanıcı / fiziksel cihaz kabulünü ayırır.

## P4.1 — Gezilebilir Kelime Bahçesi
- /kids → Kelime Bahçesi; yeni büyük Phaser haritası görünür.
- Yön tuşları, WASD, mobil 4 yön düğmesi ve hedef tabelaya dokunarak yürüme çalışır.
- Hayvan Çayırı açılır; Renk Korusu ancak daha önceki beş hayvan görevi tamamlandığında açılır.
- Sayı Vadisi, Lezzet Pazarı, Aile Köyü ve Keşif Tapınağı aktif değildir. Alternatif kartlar da aynı kilit durumunu korur.
- Haritadan çıkış eski takımadalara geri döner; avatar/profil/öğrenme kaydı değişmez.

## P4.2 — Çayır keşfi
- İlk görev 8 hayvan sunar. Çocuk hayvanın yanına yürüyünce ses ve keşif işlenir.
- Keşfedilmiş hedefin tekrarlanan yakınlaşması ikinci kanıt veya yıldız oluşturmaz.
- 12 hayvan albümü önceki keşifleri korur; yeniden keşifte yeni dört hayvan tanıtılabilir.
- Her hayvan için yerel SVG bulunur; internet kesilse bile görsel boş kalmamalıdır.

## P4.3 — Beş göreve bağlı gerçek etkileşim
- Görev 2: hayvan resmi → İngilizce kelime.
- Görev 3: dinleme → hayvan seçimi. Sessiz alternatif yardımlı olarak işaretlenir.
- Görev 4: İngilizce komuta göre dünyada üç hayvandan doğru olana yürüme.
- Görev 5: önce kayıp hayvana yürüme, sonra üç farklı konumdan doğru yuvayı seçme.
- Yanlış seçimler ustalık kanıtına ve yıldız performansına yansır. Aynı oturum iki kez kaydedilip yıldız çiftlenmez.
- Görev tamamlandıktan sonra tekrar oynama farklı tohum/soru verir; P3'e göre zor kelimeler tekrar gelir.

## P4.4 — Sunum / ses
- Yerel özgün kaşif görseli, 12 hayvan çizimi, çevre ve çiçek açma tepkileri yüklenir.
- Genel ses kapalıysa ortam sesi başlamaz. Ortam müziği yalnızca ayrıca tıklanırsa başlar.
- Genel mute, uygulamadan çıkış ve sekme gizlenmesinde ortam sesi durur.
- Erişilebilirlik "reduce motion" ayarıyla sürekli animasyonlar devre dışı kalır.
- **Açık:** Sekiz yeni hayvan için cihaz bağımsız profesyonel telaffuz kaydı sağlanmadı; tarayıcı TTS sesi her cihazda aynı değil.

## P4.5 — Yayın öncesi zorunlu kabul (henüz PASS değil)
1. Windows Chromium, Android WebView ve iOS Safari/Capacitor: 320px, 360px, tablet, yatay ekran.
2. 20 dakika kesintisiz oyun, 5 görev, tekrar, sayfa yenileme, geri/ileri, farklı çocuk profili.
3. Bağlantı kapalıyken yeniden açma ve kayıt; sonra online veri senkronizasyonu. Bu ayrıca açık P2 testidir.
4. Mobilde ölçülmüş ortalama FPS hedefi: uygun cihazlarda en az 30 FPS; en uzun oyun oturumunda bellek/sıcaklık kontrolü. Hedef doğrulanmış sonuç değildir.
5. Bir çocuk kullanıcı üzerinde yönergeleri okuyabilme, hayvanı bulma süresi, yanlışlıkla dokunmalar ve tamamlama oranı gözlemi.
6. Ekran okuyucu / klavye / azaltılmış hareket kullanımı. Phaser sahnesi erişilemiyorsa alternatif listelerden aynı görevler bitebilmelidir.
7. Play Store için imzalı AAB, Privacy Policy, Families Policy, Data Safety ve mağaza politikaları ayrıca gözden geçirilir.

## Kabul kararı
- TypeScript + Node test + web production build + Android API 36 APK/AAB ve iOS Simulator: GitHub Actions'ta aynı kaynak SHA üzerinde yeşil olması gerekir.
- Fiziksel cihaz ve çocuk kabulü geçmeden `P4 = RELEASE READY` etiketi konulmaz.
- Sadece kullanıcı açıkça istediğinde yayın. Otomatik Vercel dağıtımı kapalı.
