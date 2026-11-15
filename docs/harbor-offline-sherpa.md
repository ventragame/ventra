# Ventra — sherpa-onnx cihaz içi İngilizce konuşma tanıma

## Hedef ve kapsam
Diyalog Limanı'ndaki kısa İngilizce cevapları (Hello, Bye, vb.)
tarayıcının SpeechRecognition/SODA servisinden ve ücretli bir API'den
bağımsız olarak tanımak. Ses **başka bir sunucuya gönderilmez**.
Bunun yerine WebAssembly, yüklenen modelle cihazda çalışır. Konuşmayı
Türkçeye çevirmiyoruz; İngilizce ses → İngilizce yazı → mevcut
`matchesExpectedSpeech` sözleşmesiyle cevap eşleştirme.

## Mimari
- `@sherpaw/asr@0.3.0`, Apache 2.0 wrapper; upstream `k2-fsa/sherpa-onnx`.
- Model: İngilizce `sherpa-onnx-streaming-zipformer-en-20M-2023-02-17`,
  INT8 encoder/joiner + decoder + `tokens.txt`, `Apache-2.0`
  (model lisansını dağıtımdan önce tekrar doğrulayın).
- Model kaynağı: `csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17`
  Hugging Face revision `d42f2d9`, yalnızca gerekli 4 dosya.
- `npm run speech:prepare` model dosyalarını indirir, boyut/sha256
  manifestini yazar, npm paketinin JS/WASM dist dosyalarını aynı kökenden
  servis edilen `public/speech/sherpa-runtime/` klasörüne kopyalar.
  Büyük dosyalar Git geçmişine eklenmez. Vercel/Capacitor statik
  paketleri bunları build sırasında sunmak zorundadır.
- `localSherpa.ts`: mikrofon erişimi, AudioContext/AudioWorklet,
  uyumluluk için ScriptProcessor yedeği, 16 kHz PCM yeniden örnekleme,
  kısa cevapları reddetmeyen ses etkinliği kontrolü, sonlandırma/iptal,
  2 dakikalık worker boşta kalma sınırı.
- `sherpaWorker.ts`: modeli ilk kullanımda lazy-load, SHA-256 doğrulama,
  16 kHz offline decode, sonuçla birlikte transcript döndürme. Worker
  hesaplaması oyunun render thread'inde yapılmaz.
- `childSpeech.ts`: model hazırlanmışsa `sherpa-local` varsayılan,
  aksi hâlde native konuşma plugini (mobil) / Web Speech;
  `HarborSpeechAdventure.tsx` mevcut `matchesExpectedSpeech` kontrolünü
  korur. Yanlış/boş/sessiz kayıtlar ödül kazandırmaz.
- Web Speech ve önceden geliştirilmiş (opt-in, yetişkin kimlik doğrulamalı)
  sunucu STT yolu açıkça seçilebilir durumda kalır; sunucu STT varsayılan değildir.

## Ücretsiz ve gizlilik
Konuşma başına API ücreti **yoktur**; hiçbir servis anahtarı gerekmez.
Ancak ~73MB ilk indirme, CDN bandwidth, cihaz CPU/bellek kullanımı
bedava değildir. Model daha önceden yüklenmediyse çevrimdışı ilk
kullanım çalışmaz. Tarayıcı cache temizlenirse yeniden indirilir.
Model dosyaları tarayıcı cache ve WASM belleğinde olabilir; ses ve
transkript Ventra sunucusuna gönderilmez veya kalıcı olarak yazılmaz.

## Lokal deneme
```powershell
cd C:\active_projects\ventra
git pull --ff-only origin main
npm ci
npm run dev:web
```
`npm ci`, yeni `@sherpaw/asr` bağımlılığını kilit dosyasından kurmak için bu güncellemede bir defaya mahsus gereklidir. Sadece `git pull` mevcut `node_modules` içeriğini değiştirmez. `predev` ilk çalışmada modeli hazırlar. Yalnızca modeli hazırlamak:
```powershell
npm --workspace=apps/web run speech:prepare
```
Model dosyaları `apps/web/public/speech/sherpa-20m/` içinde,
WASM modülleri `apps/web/public/speech/sherpa-runtime/` içinde olmalıdır.
Ağ kapalı olsa bile model ve WASM dosyaları daha önce hazırlanmış ve
doğrulanmışsa kullanılabilir. İlk indirme başarısız olursa artık
`npm run dev:web` veya production derlemesi **hata verip durur**: model
eksikken çalışan bir uygulamanın başarılı sanılması engellenir.

Ayrıca şu iki bağımsız doğrulama vardır:
```powershell
npm --workspace=apps/web run speech:verify
npm --workspace=apps/web run speech:verify:export
```
İkincisi yalnızca mobil `export` yapıldıktan sonra çalıştırılır. Bu
kontrollerin her ikisi de model dosyalarını SHA-256 ile, WASM ikilisini
sabit Git kaynak özetiyle doğrular; eksik `manifest.json` varsa hata
verir. GitHub Actions web, Android ve iOS paketlerinde bu kontrolleri
zorunlu tutar.

Diyalog Limanı → Ses tanıma çalışmıyor mu? → Tanıma motoru:
`sherpa-local`. Model hazırlanırken `İngilizce tanıma modeli hazırlanıyor`
görünür. `Hello` deyip ses bitince doğru cevabı kontrol edin.
Çalışmazsa tanılama kodunu kaydedin; ses veya çocuğun transcriptini
günlüklere kaydetmeyin.

## Kritik kabul testleri (CI tek başına yeterli değildir)
1. İlk model yüklemesi ve sonradan cache üzerinden 2. konuşma.
2. Windows Chrome'da `Hello`, `Bye`, `Good morning` ve yanlış cevap.
3. Android Chrome'da aynı kısa kelimeler ve daha düşük RAM'li cihaz.
4. iPhone Safari ve Capacitor Android/iOS: model yükleme, WASM uyumluluğu,
   RAM, ısınma, CPU, bellekte kalan iz, dönüş/geçiş.
5. Sessizlik, öksürük, yanlış/benzer ses, arka plan müziği ve kulaklık.
6. Mikrofon reddi, oyun ekranı kapanışı, arka plan, 3G düşük hız,
   yetersiz RAM, yarım model indirme, SHA uyuşmazlığı, offline.
7. Doğru kelimeyi söylediği hâlde reddedilme oranı ve yanlış kelimeyi
   kabul etme oranı gerçek çocuk sesleriyle ölçülmeli.
8. Bu ASR **telaffuz puanlama sistemi değildir**; tanınan kelimenin
   doğru telaffuz edildiğine dair pedagojik kanıt sayılmamalıdır.

## Bilinen sınırlar
GitHub Actions yalnızca statik paketleme, TypeScript ve birim testlerini
doğrular. Gerçek tarayıcıda model initialize/decode edildiği ve
çocuk sesleriyle doğru/yanlış oranı **ayrıca sınanmalıdır**.
Ses kaydı uygulama sunucusuna gönderilmiyor ancak kamuya açık model
varlıklarını indirirken dosya sunucusu normal bağlantı bilgilerini görebilir.

## 14 Kasım 2026 — 404 manifest düzeltmesi

Önceki `prepare-sherpa-local.mjs` sürümünde JavaScript varlıklarını
seçen regex yanlışlıkla çift kaçışla yazılmıştı. Sonuç olarak npm
dağıtımındaki `.js` dosyaları bulunamıyor, kurulum hata veriyor, ancak
istisna yakalanıp işlem başarıyla sonlandırılıyordu. Kullanıcılar
`/speech/sherpa-20m/manifest.json` için 404 alırken Web Speech API'ye
sessizce dönülüyordu. Bu durum uygulamanın konuşma özelliğini
çalıştırmıyordu.

Düzeltmede regex, fail-fast davranışı ve üretim varlık bütünlük
kontrolleri eklendi. Derlemenin geçmesi konuşmanın gerçek bir cihazda
anlaşıldığını **kanıtlamaz**. İngilizce çocuk sesleriyle cihaz kabul
testleri yine zorunludur.

## 15 Kasım 2026 — kısa çocuk konuşmalarının doğrulanması

- Eski enerji-eşiği davranışı düşük sesli konuşmaları modele göndermeden reddedebiliyordu; artık yeterli PCM ve ölçülebilir giriş olduğunda gerçek decode yapılır.
- Ses işleyici 44.1/48 kHz girişleri parçaların sınırında fazı koruyarak sürekli 16 kHz'e dönüştürür.
- Kısa/boş (ör. tek harf) çıktı için tam kısa konuşma, yüklenmiş yerel modelle ikinci kez denenir; en fazla 12 saniyelik PCM geçici Worker belleğinde tutulur ve sonlandırmada silinir. Bu bir "doğru cevap seçme" hilesi değildir.
- GitHub Actions smoke testi artık yalnızca sessizlik değil, ürünün içindeki gerçek İngilizce WAV örnekleriyle de modeli çalıştırır; metin sonuçları CI'da görünür (bunlar çocuk kayıtları değildir).
- Bu önlemler gerçek çocuk konuşmaları üzerinde bir doğruluk garantisi değildir. Modelin küçük olması, mikrofon kalitesi, aksan, gürültü ve ilk model indirmesi hâlâ ölçülmesi gereken sınırlamalardır.

## 15 Kasım 2026 — 2023-06-26 güçlü model terfisi

Daha küçük 20M model, gerçek yerel İngilizce ses dosyalarında 'great job' -> 'y job', 'listen carefully' -> 'ly', 'find the cat' -> 't' gibi kabul edilemez sonuçlar üretti. Ses seviyesini artırmak veya modele sessizlik eklemek bunu düzeltmedi. Daha güçlü, 2023-06-26 Apache-2.0 Zipformer INT8 modeli aynı WAV testlerinde 7/7 beklenen kelimeyi yakaladı (ilk kaydın sonunda fazladan 'and' üretildi). Üç WAV testi gerçek çocuk konuşması doğruluğunu garanti etmez. CI bunu doğru kelimelerin tümünü yakalayabilme koşulu olarak zorlar.

Üretim dosyaları `public/speech/sherpa-english-2023-06-26/` içinde oluşturulur. İndirme yaklaşık 73 MB + 13.8 MB WASM ve runtime olup ücretsiz API kullanımına sahiptir; ilk indirme, barındırma/veri aktarımı ve cihaz RAM/CPU tüketimi ücretsiz değildir. Eski `sherpa-20m` yerel klasörü başarılı hazırlık sonunda silinir, böylece Android/iOS paketlerine çift model girmez. Model dosyaları sabit upstream revizyona bağlı SHA-256 değerleriyle doğrulanır. Yeni bir ses tanıma servisine çocuk sesi gönderilmez. İlk kullanımda hazırlık aşaması geçmeden konuşma başlanmamalıdır.
