# Codex uygulama talimatı — Kesir Köprüsü ilk premium vertical slice

Bu görev bir **tasarım yazma görevi değildir**. Oyun tasarımı ve kabul şartları bu klasörde zaten hazırlanmıştır.

## BAĞLAM

Proje: `C:\active_projects\Ventra`.

Önce sırayla oku:
1. `docs/game-design-v2/README.md`
2. `docs/game-design-v2/DECISION-REGISTER.md`
3. `docs/game-design-v2/01-GDD-V2.md`
4. `docs/game-design-v2/02-PLAYER-FLOW-AND-WIREFRAMES.md`
5. `docs/game-design-v2/03-ART-AND-UX-SPEC.md`
6. `docs/game-design-v2/04-TECH-AND-ACCEPTANCE.md`
7. `docs/game-design-v2/references/kesir-koprusu-concept-reference.png`
8. Mevcut proje `docs/` v0.1 ve oyun/ilerleme kodlarını.

## GÖREV

**Yalnızca ilk Kesir Köprüsü bölümünü** belirtilen premium vertical slice kalitesinde gerçekleştir. Mevcut `FractionBridge` sahne/kurallarından faydalı kodu al, gerekiyorsa sahneyi köklü biçimde yeniden düzenle. Matematik kartlarının hâkim olduğu eski koyu panel arayüzünü oyun sahnesi diye sunma.

### Kesin sonuç

- Seçilmiş profil avatarı + robot sol adada görünür (avatar entegrasyonu sınırını raporla).
- İki fantastik ada arasında görünen eksik köprü; üç yuva; kesir uzunluğu doğru üç ahşap tahta.
- 1/2 > 1/3 > 1/4 sıralaması etkileşimli drag/drop veya dokunma ile tamamlanır.
- 3 yuva dolunca nazik otomatik geri bildirim, hata düzeltme, başarıda gerçek köprü kurulum ve avatar geçiş animasyonu.
- Kısa sonuç ve gerçek ilerleme kaydı; aynı profilde tekrar oynanabilirlik.
- Masaüstünde ve **dikey mobilde tasarlanmış** gerçek oynanış (aynı ekranın küçültülmüş kopyası değil).
- İlk bölümün çalışır ekranlarından görüntüler; gerçek APK/build ölçümleri.

### Asset üretimi hakkında

Konsept kolajını sahne arka planı/sprite atlası olarak kullanma. Gerekli gerçek assetleri ayrı ayrı **oluştur veya geçerli lisansla edin ve belgede kaynak belirt**. Kullanılabilir çizimler üretilemezse emoji/placeholder ile "premium tamamlandı" deme: bunu blocker/partial olarak raporla. UI screenshot makyajı yerine gerçek animasyon/sahne elde edilmeli.

### Mevcut mimariyi koru

Godot + Next.js + Capacitor + IndexedDB + Supabase. Mevcut 10 seviye/öğrenme sistemi bozulmasın, ama yalnızca 1. seviyenin premium dönüşümünü kapsamına al. RLS, Auth, production DB değişmesin.

## YÖNTEM / KALİTE KAPISI

1. Belgelerin mevcut kodla çeliştiği somut teknik engelleri en fazla kısa bir tabloda belirt (yeni ürün kararı verme).
2. İlk bölümü gerçek oynanır şekilde geliştir, testleri uygula.
3. Gerçek uygulamadan masaüstü + mobil dikey + yanlış durum + başarı görselleri üret.
4. Math unit tests, Godot export, Next build, Capacitor Android APK ve ilerleme regresyonlarını çalıştır; yapılmayan testi dürüstçe belirt.
5. Gerçek ölçülmüş eski/yeni MB değerlerini ver (debug APK / Web asset ayrı).
6. Onay kriterleri `04-TECH-AND-ACCEPTANCE.md` üzerinde PASS / FAIL / NOT RUN olarak raporlansın.
7. Kod çalışma sonucu görsel referansla anlamlı ölçüde örtüşmüyorsa **GO verme**.

**YASAK:** Git commit/push, deploy, canlı Supabase migration/Auth ayarı, gerçek kullanıcı verisini değiştirmek. Yeni mini oyun veya bölüm geliştirmek. PRD/vizyonu kendi başına değiştirmek.

Teslim: Kısa teknik rapor + çalıştırma komutları + gerçek oyun ekran görüntüsü dosya yolları + kalan görsel/teknik borçlar. İlk bölümün kullanıcı onayı alınmadan diğer seviyelere geçme.
