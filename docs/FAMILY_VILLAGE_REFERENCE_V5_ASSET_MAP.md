# Aile Köyü V5 — Referans Görselin Gerçek Asset Entegrasyonu

## Kaynak
Kullanıcı tarafından 7 Kasım 2026'da tekrar gönderilen Aile Köyü referans ekranı (büyükanne, köpek, kedi ve ahşap tabela içeren görsel). V4 sürümünün düz SVG ev manzarası referansa uymadığı için gerçek referans görselinin parçaları WebP olarak çıkarıldı. Görseller V5 klasöründe yerel dosyadır; harici CDN yoktur.

## Birebir görsel parçaları (GitHub binary WebP)
Tüm dosyalar `apps/web/public/assets/family-village/reference-v5/` altında:
- `village-storybook-hero.webp`: kedi, ev, çiçekler, köpek ve büyükanne içeren orijinal sahne kırpımı
- `village-storybook-hero-mobile.webp`: mobil için ev/köpek/büyükanne odağında ayrı kadraj
- `village-wooden-brand.webp`: görseldeki gerçek ahşap Aile Köyü başlık tabelası
- `village-landscape-masthead.webp`: başlık için panoramik referans bandı
- `village-grandmother-card.webp`: gerçek referans ekranından büyükanne öğrenme portresi
- `village-flower-left.webp`, `village-flower-right.webp`: mor soru panelinin orijinal çiçekli köşe süslemeleri
- `village-ref-icons.webp`: referanstan alınan 4 mahalle ve 5 görev ikonunu içeren 9 hücrelik WebP atlası

`FamilyVillageScenery.tsx`, `FamilyVillageWordArt.tsx`, `FamilyVillageAdventure.tsx` ve `family-village-reference-v5.css` dosyaları gerçek WebP'leri kullanır. Dosyalar basit CSS taklidi değildir; GitHub blob'larında binary olarak saklanır.

## Gerçek etkileşimler korunur
- GitHub'a statik ekran görüntüsü yapıştırılmadı. React bileşenleri yıldız sayısını, kilitleri, seçili görevi, soru/cevapları, ses kontrollerini ve ilerleme durumunu üretir.
- Ahşap tabela üzerindeki `Aile Köyü` yazısı markanın sabit parçasıdır; ekran okuyucu için ayrıca `h1` bulunur.
- Köy sahnesine gömülü `Aile Evi` tabelası sadece *Aile Evi* mahallesinde gösterilir. Diğer mahalleler kendi farklı görsellerini ve dinamik etiketlerini kullanır.
- Referansın sahnesindeki görev sayacı görselin parçası olsa da gerçek görev numarası daha büyük, opak, dinamik DOM rozetiyle üstüne konur.
- Öğrenme motoru, 60 kelime/20 bölüm, RLS/profil güvenliği, kanıt kaydı, idempotent ödül ve otomatik ilerleme mantığı bu görsel revizyon sırasında değiştirilmedi.

## QA
- [ ] GitHub Actions: TypeScript + öğrenme testleri + web production + mobil export
- [ ] 1440/1280px ve mobil 390/360/320px: referansla yan yana görsel inceleme
- [ ] Tüm 4 mahalle ve 5 görev, tekrar oynatma / ilerleme / çocuk profili
- [ ] Android WebView ve iOS Safari'de gerçek WebP'lerin gösterimi
- [ ] Gerçek görselin içine gömülü statik görev numarasının hiçbir aşamada dışarıda görünmediğinin gözle doğrulanması

**Sınır:** Referans sabit çözünürlüklü bir illüstrasyondur. Farklı ekran oranları, durum verileri ve daha uzun sözcüklerde yüzde yüz piksel eşleşmesi gerçekçi değildir. V5, referansın esas görsel parçalarını doğrudan kullanarak önceki benzetim problemine somut çözüm getirir. Tüm 60 kelimenin ayrı ayrı 3D karakter çizimleri henüz bu referans görselinden üretilemez; mevcut diğer kelime çizimleri korunur. Production deployment yapılmaz.
