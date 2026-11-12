# Ventra G4 – Ücretsiz konuşma etkileşimi (Kasım 2026)

## Kapsam ve sınırlamalar

- **Web:** Standart Web Speech API yalnızca **cihaz içi** tanıma ve en-US paketi kuruluysa kullanılır. Destekleyen tarayıcılarda ses paketi çocuk/veli tarafından düğmeyle indirilebilir; özellik desteklenmiyorsa herhangi bir uzak konuşma sunucusuna otomatik geçilmez. Mikrofonla sesli tekrar Web Audio API ile **yalnızca ses aktivitesi** olarak çalışır. Konuşma algılandı diye doğru İngilizce dediği iddia edilmez.
- **Android:** Android 12+ (API 31+) SpeechRecognizer.createOnDeviceSpeechRecognizer. Servis ya da İngilizce modeli yoksa dokunmatik seçenekler veya mikrofonla tekrar. Her cihazda cihaz içi İngilizce ASR yoktur. İzin yalnızca mikrofon düğmesine tıklanınca sorulur.
- **iOS:** iOS 13+ Apple Speech framework (SFSpeechRecognizer) ve requiresOnDeviceRecognition=true. Apple'ın supportsOnDeviceRecognition=false bildirdiği cihazda mikrofon etkinliği veya dokunmatik seçenek. iOS 26 SpeechAnalyzer ayrı, henüz bu sürümde **entegre değil**; geniş cihaz desteği için test edilebilir klasik cihaz içi API kullanıldı.
- **0 TL konuşma başı API ücreti:** Üretken AI, ücretli ASR, harici hesap, Vosk model dosyası veya ses sunucusu yok. Test ve bakım maliyetleri sıfır değildir.

## Çocuk güvenliği

Mikrofon varsayılan olarak kapalıdır; ekran üzerinde basılan buton dışında başlamaz. Ses kayıtları, transkriptler ve ses izi **istemciye ait kalır ve kayıt/analitiğe yazılmaz**. Oyun sadece görev başarı puanı ve yıldızları profilin mevcut ilerleme deposunda tutar. Android/iOS platform konuşma tanıması **yalnızca cihaz içi**. Browser kullanımında `processLocally=true` zorunlu; bu desteklenmiyorsa yalnızca ses seviyesi ölçülür ve ses tanıma iddia edilmez. Ebeveyn bilgilendirmesi ve resmi gizlilik metni ayrıca güncellenmelidir.

## İlerleme / değerlendirme

Her seviyede üç farklı, seviyeye özgü diyalog; 5 bölüm, Pre-A1, A1, A2.
- Kısa cevabı dinle, mikrofona tekrar et veya ekrandaki üç cümleden doğruyu seç.
- Konuşma tanıma doğrudan görevin kısa hedef ifadesine eşit/uyumlu dönüş yaptığında ilerletir; bu **telaffuz puanı değildir**.
- Mikrofon reddi, ses anlaşılmaması, cihaz eksikliği veya uçuş modu oyunu kilitlemez.
- Yanlış anlaşılan/diğer bir cümle için sert 'yanlış telaffuz' cezası verilmez.
- İlerleme çocuk profiline ayrı kaydedilir; önceki bölüm açılmadan sonraki açılamaz; aynı bölüm tekrar oynandığında ekonomi aynı level için iki kez Coin üretmez.

## Kabul testi (fiziksel cihaz zorunlu)

1. Chrome/Edge, Safari iOS, Android Chrome: mikrofon izni yok, izin reddi, ses paketi yok, cihaz içi İngilizce ses paketi kurulu.
2. Android 12–16 ve iOS 13–26: fiziksel mikrofon, izin reddi, cihaz içi tanıma yok, uygulama arka plana alınıyor, mikrofondayken geri, aynı anda 2. tıklama.
3. Pre-A1/A1/A2: 'hello' doğru; 'yellow' yanlış; aksanlı çocuk telaffuzlarında gereksiz ceza olmamalı.
4. Level tamamlanınca yıldızlar, profil geçişi ve cihaz tekrar açılınca bölüm ilerlemesi kalıcı mı?
5. Apple Info.plist izin metinleri ve Google Play Data Safety/KVKK bilgilendirmesiyle uygulama davranışı tutarlı mı?

NOT: CI'da simülatör / emülatör derlemesi ve otomatik kod sözleşmesi testleri gerçek çocuk sesindeki başarıyı kanıtlamaz.
