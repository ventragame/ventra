# VENTRA KIDS — ARCHIPELAGO VISUAL ASSET PACK v1

**İçerik:** 1 genel kompozisyon referansı + 6 ayrı ada görseli. PNG kaynakları, masaüstü WebP ve daha küçük mobil WebP sürümleri.

## Dosya yapısı

- `references/concept-map.png` ve `.webp`: **YALNIZCA ART DIRECTION/kompozisyon referansı.** Bu resmin üstüne tıklanabilir buton koyup tamamlandı deme.
- `source_png/*.png`: Her adanın orijinal **RGB, opak** görseli. Kodda üzerine yazı/bar/buton gömülü değildir.
- `webp/desktop/*.webp`: Görsellerin optimizasyon amaçlı yüksek kalite sürümleri (1254x1254).
- `webp/mobile/*.webp`: 768x768 çözünürlüğe küçültülmüş sürümler.
- `docs/ASSET_MANIFEST.json`: Dosya/rol/boyut/hash eşleştirme.
- `docs/PRODUCT_FLOW.md`: Onaylanan ekran ve oyun akışı.
- `docs/ART_AND_TECH_GATES.md`: Görsel üretilebilirlik, performans ve doğrulama koşulları.
- `docs/VS_CODE_PROMPT.md`: Geliştirme ajanına gönderebileceğin uygulama görevi.

## ÖNEMLİ: ayrı ada != şeffaf sprite

Bu görsellerin her birinde **gökyüzü ve bulutlar resmin içine çizilidir**. PNG dosyaları da WebP dosyaları da **alpha kanalı içermemektedir**. Bunları bir arka plan üzerine altı kare görsel olarak koymak gerçek, akıcı bir takımada hissi vermez. Keskin kenarlar, değişik perspektifler ve birbirini tutmayan gökler oluşabilir. **Yeni tek-poster hatasına düşmeyin.**

Kalıcı dünya için aynı sanat dilindeki **şeffaf RGBA/WebP alfa kenarlı ada cutout'ları** ve ayrı sky/ocean/cloud background üretmek, mevcut görselleri doğru şekilde maskelemek veya stil uyumlu yeni kaynak varlıklar hazırlamak gerekir. Maskelerde bulut/şelale/su kenarları kontrol edilmeli. Pixel-perfect tüm asset'ler hazır olmadan 'premium final' denmemeli.

## Oyun içi kullanım kararı

Tek runtime dokusu olarak **concept-map.png** kullanılmayacak. Altı adanın her biri veri tanımlı, bağımsız hit-area/camera focus/level progress/locked-state ile çalışan ada nesnesi olacak. Mobile'da yalnızca ekranın tamamına küçültme yok: pan/zoom veya kaydırılabilir world camera gerekir. HUD React; dünya Phaser veya mevcut proje mimarisine uygun sahne katmanıyla çizilecek.

## WebP

WebP dosyaları bu ZIP içinde hazır. `desktop` ve `mobile` varyantlarını gerçek render ihtiyacına göre lazy load et. **WebP daha küçük indirme demektir; WebGL'e decode olduktan sonraki bellek maliyeti hâlâ pixel count x 4 byte civarındadır.** Bütçe ölçülmeli; 60 FPS garanti edilmez.

## Kurulum önerisi

ZIP'i depo köküne rastgele dağıtma. İncele, sonra `apps/web/public/assets/kids-islands/` içine yalnızca runtime için gerekli varyantları aktar. Kaynak PNG ve konsept resmi `docs/kids-islands-art/` altında tut; gerekirse manifestte path güncelle. Build/Capacitor içine kaynak PNG'leri yanlışlıkla iki kere alma.

## Güvenlik

Mevcut `/`, `/kids`, profil, Auth, IndexedDB, Supabase, level kayıtları korunur. Commit, push, deploy, migration veya eski Godot dosyalarını silme ancak açık onayla yapılır.
