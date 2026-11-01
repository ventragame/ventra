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
- 40 hayvanlık katalog önceki keşifleri korur; her turda 8 hayvan gösterilir. Yeni hayvan kaldığı sürece tekrar keşifte en az 6 yeni tür seçilir.
- Her hayvan için yerel SVG bulunur; internet kesilse bile görsel boş kalmamalıdır.

## P4.3 — Beş göreve bağlı gerçek etkileşim
- Görev 2: hayvan resmi → İngilizce kelime.
- Görev 3: dinleme → hayvan seçimi. Sessiz alternatif yardımlı olarak işaretlenir.
- Görev 4: İngilizce komuta göre dünyada üç hayvandan doğru olana yürüme.
- Görev 5: önce kayıp hayvana yürüme, sonra üç farklı konumdan doğru yuvayı seçme.
- Yanlış seçimler ustalık kanıtına ve yıldız performansına yansır. Aynı oturum iki kez kaydedilip yıldız çiftlenmez.
- Görev tamamlandıktan sonra tekrar oynama farklı tohum/soru verir; P3'e göre zor kelimeler tekrar gelir.

## P4.4 — Sunum / ses
- Yerel kaşif görseli, 40 hayvan görsel varlığı, çevre ve çiçek açma tepkileri yüklenir. Son 28 hayvandan bazıları emoji tabanlı geçici SVG varlıklarıdır; tutarlı özgün premium sanat standardı henüz sağlanmamıştır.
- Genel ses kapalıysa ortam sesi başlamaz. Ortam müziği yalnızca ayrıca tıklanırsa başlar.
- Genel mute, uygulamadan çıkış ve sekme gizlenmesinde ortam sesi durur.
- Erişilebilirlik "reduce motion" ayarıyla sürekli animasyonlar devre dışı kalır.
- **Açık:** 36 hayvan için cihaz bağımsız kayıtlı İngilizce telaffuz sağlanmadı; tarayıcı TTS sesi her cihazda aynı değil.

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

## 2026-11-01 — Automated CI evidence (verified)

- GitHub Actions: https://github.com/ventragame/ventra/actions/runs/41258109583
- Source SHA: `fc6b03eeeee5437ffbba900061fb23b547585c7f`
- **TypeScript: PASS. 75/75 offline/regression tests: PASS, 0 FAIL.**
- **Web production build: PASS; mobile static export: PASS.**
- **Android API 36 native debug APK + unsigned release AAB: BUILD SUCCESSFUL.**
- **iOS unsigned Xcode Simulator build: PASS.**
- Open: Android/iPhone physical device touch/FPS/offline/TTS/VoiceOver/child-user acceptance.
- Open security gate: npm audit 7 current vulnerabilities: 1 critical, 2 high, 4 moderate. Package impact and fixes require separate triage; no unsafe `npm audit fix --force` was run.
- No production deploy, mobile store upload, app signing or purchases enabled.


## 2026-11-01 — 40 hayvanlı sürüm P4 teknik kapanış takibi
- 40 hayvan / her tur 8 keşif; en az 6 yeni keşif havuzu, zayıf kelime pekiştirmesi korunur.
- 40 hayvan büyümesinden sonra CI'da 4 test başarısızdı: 2 eski 12 sayısı beklentisi, 1 sabit tam 6 yeni hayvan beklentisi, 1 anlamsız SVG byte uzunluğu kalite eşiği. Bu committe testlerin gerçek katalog ve yeniden oynama sözleşmesine uyumu düzeltildi.
- SVG içeriğini güvenli offline kullanılabilirlik testi denetler; görünümün premium olduğu yalnızca uzunlukla doğrulanamaz.
- Testlerin yeni SHA üzerinde CI PASS sonucu görülmeden P4 teknik kabul tamamlandı sayılmaz.
- Fiziksel cihaz / pedagojik kabul ve bağımlılık güvenlik incelemesi yayın öncesi ayrı açık kapılardır.
