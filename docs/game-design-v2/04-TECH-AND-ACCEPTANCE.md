# Teknik sözleşme ve kabul kriterleri

## Stack ve mevcut yapıyı koruma

- Ana oynanış: **Godot 4 + GDScript**. Mevcut `FractionBridge` mantığını gerektiği kadar yeniden kullan; oyun sahnesini yama UI panelleriyle büyütme.
- Öğrenme Merkezi: **Next.js + TypeScript/React**; oradaki kazanım içeriği korunur.
- Paketleme: Mevcut **Capacitor** Android/iOS yapısı; Android build ve telefon testi öncelikli.
- Hesap/ilerleme: mevcut **IndexedDB offline-first, optional Supabase Auth/cloud** tasarımı. Auth yeniden yazılmaz.
- GDD'nin tek becerisi: `ventra.math.g4.fraction.unit_comparison` ve mevcut `fraction_bridge` gameId. Gerçek mevcut kontratlar okunup bunlarla eşleşilir.
- İlk bölüm haricinde refactoring/farklı oyun geliştirme **yok**.

## Matematiksel kabul

1. 1/2, 1/3, 1/4 ile tek doğru sıralama: `1/2 > 1/3 > 1/4`.
2. Aynı bütün referans genişliği `W` için görünür tahta uzunluğu tam `W/n`, ekran ölçekleme çarpanı hepsine aynı uygulanır.
3. Görünür min-width floor yüzünden `1/20` gibi parçalar yanlış temsil edilmesin; sonraki seviyeler ayrı inceleme. Bu vertical slice 1/2, 1/3, 1/4 ile sınırlı.
4. Geçerli yerleşim kombinasyonları ve hata açıklaması unit test ile doğrulansın.
5. Mobil dokunma hedefi için saydam hit alanı genişletilebilir, **görsel uzunluk değiştirilemez**.

## Oynanış kabul

- [ ] Dışarıdan herhangi bir yardım almadan bir oyuncu başlar ve ilk bölümü bitirir.
- [ ] Üç kalas görünür ve fiziksel sahne üzerindeki üç yuvaya yerleştirilir.
- [ ] Sürükle-bırak ve dokunarak seçim/yerleştirme ayrı ayrı çalışır.
- [ ] Kalasları değiştirme ve geri alma çalışır.
- [ ] Tam dolu doğru sırada otomatik doğrulama olur; yanlış sıralama oyuncuya geri düzeltme alanı bırakır.
- [ ] Gerçek köprü bağlantı animasyonu, gerçek avatar geçişi ve kısa başarı kutlaması vardır.
- [ ] Oyuncu hiç bir aşamada düz UI kutuları altında görünmez hâle gelmez.
- [ ] Eski `FractionWorkshop` oyunu bozulmaz; diğer bölümlerle kayıtlar çakışmaz.
- [ ] Oyunun mobil dikey kompozisyonu çalışır, kesilmeyen/taşmayan UI vardır.

## Veri ve güvenlik kabul

- [ ] Kazanılan yıldızlar **profil + gameId + levelId** kapsamında saklanır.
- [ ] Tekrarlanan sonuç olayı mükerrer ilerleme yazmaz.
- [ ] Farklı çocuk profilleri arasında ilerleme karışmaz.
- [ ] Uçak modunda oynama/kaydetme çalışır; sunucu yok diye bölüm kilitlenmez.
- [ ] Senkronizasyonun mevcut sistemleriyle regresyon testleri geçer.
- [ ] Production DB, Supabase ayarları ve gerçek kullanıcı verisi değiştirilmez.

## Build / UX kalite kapısı

- [ ] Godot sahne yükleme ve web export başarılı.
- [ ] Next.js static export ve TypeScript/build kontrolleri başarılı.
- [ ] Android debug APK build başarılı; mümkünse emülatör ve fiziksel cihaz testleri ayrı belirtilir.
- [ ] Test ekranları: 360×800, 390×844, 412×915 ve 1280×720.
- [ ] UTF-8/Türkçe karakter ve ikonlar bozulmuyor.
- [ ] Doğru, yanlış ve başarı anları çalışan uygulamadan görüntülenmiş.
- [ ] Debug APK **önce/sonra MB ölçüleri** raporlanmış; Play AAB indirme boyutu ile debug APK karıştırılmamış.
- [ ] Gerçek çocuk oyun testleri yapılmadıysa çocuklara uygunluk/öğrenme etkisi **doğrulandı** denmemiş.

## Boyut / performans kararı

- İlk Android indirme için **100 MB altı hedef**, kesin garanti veya zorunlu kabul sınırı değil.
- Mevcut APK yaklaşık 55MB bilgisi önceki rapordan gelir; **gerçek build ile yeniden ölç**.
- Asset gruplarında sıkıştırma/WebP/uygun atlas, tekrar yüklenen gereksiz görsellerin temizlenmesi.
- Godot export dosyaları ve web asset cache: gerçek byte ölçüsü raporlanır.
- Ağ yavaş/çevrimdışı iken assetler kırılmamalı; paketlemeyi sonradan indirme modeline çevirmek bu görevin dışındadır.

## Kullanıcı / çocuk testi için önerilen pratik plan

Uygun ebeveyn izniyle 5–8 çocuk (9–10 yaş) ilk bölümle oynar:
- Başlatmayı anlayabildi mi?
- En az bir kez doğru tamamlama gerçekleştirdi mi? Ne kadar yardım gerekti?
- Görevi neden doğru sıraladığını açıklayabildi mi? (gelişimi ölçmek için küçük ön/son karşılaştırma)
- Oyun bittiğinde tekrar oynamak istedi mi?

Bu örnek, bilimsel etkililik kanıtı değil, **tasarım yönünün erken saha doğrulaması**dır.

## GO / NO-GO

**GO ancak** matematik doğruluğu, mobil oynanabilirlik, gerçek karakter-köprü sahnesi, veri bütünlüğü, görsel kabul ve başarılı build kanıtlanırsa. Bir alan eksikse `PARTIAL / NO-GO`; rapor ve ekran görüntüsüyle eksikler gösterilir. Kodun varlığı tek başına GO değildir.
