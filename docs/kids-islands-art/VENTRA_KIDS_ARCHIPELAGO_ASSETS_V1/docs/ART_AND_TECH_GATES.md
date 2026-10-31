# VENTRA KIDS — ART / ARCHITECTURE QUALITY GATES

## Gate 0 — asset uygunluğu

- `source_png` ve WebP'ler **opaque** gökyüzü içeriyor; hiçbirisi hazır şeffaf sprite DEĞİL.
- `references/concept-map` sadece layout/art direction; runtime poster olarak kullanılmayacak.
- Altı ada bağımsız olarak sahnede konumlanıp etkileşimli olacak. RGB kare görselleri yan yana koyup 'modüler harita' deme.

## Gate 1 — şeffaf/uyumlu asset'ler

- Bağımsız adalar için temiz transparan kenarlı asset'ler edin; görüntüleri kesip çıkarırken doğal kaya/şelale, ağaç, bulut kenarlarını QA et.
- Mevcut kaynaklardan kusursuz RGBA elde edilemiyorsa SADECE art pipeline blocker belirt; uydurma dikdörtgen sprite sonucu 'tamamlandı' olarak sunma.
- Sabit kamera perspektifi, ölçek, ışık yönü ve keskinlik uyumu. Yüklenebilir WebP alfa varyantı.
- Ayrı sky/ocean/ambient arkaplan gerçek dünya katmanı olsun, yazısız/butonsuz.

## Gate 2 — oyun nesneleri ve navigation

- Artık `/kids` route'u tek poster değil. Her ada kendi entity'si: `id`, `position`, `hitArea`, `visualState`, `progress`, `cameraFocus`.
- Tek büyük görselin içine gömülmüş banner/label/kilit/progress kullanılmasın. React erişilebilir UI üstünde render edilir.
- İlerleme ve kilitler öğretilen dilin öğrenme metriklerinden ayrılır; adalar arası progression gerçeğe dayanır.
- Ada seç → Game Level Map; sonra etkileşim, ödül, kaldığı yerden devam.

## Gate 3 — responsive ve performans

- 360x800, 390x844, 768x1024, 1280x720, 1440x900, 1920x1080; browser 100%.
- Mobilde dünya navigasyonu için pan/zoom/scroll; adaları yalnızca 360px içine sığdırıp 30px tap target yapma.
- Lazy loading ve mobile/desktop asset seçimleri, WebGL memory texture ve FPS ölçümleri.
- Görsel preview/layer check; devam eden static poster, sıkışmış panorama veya görünür sky kareleri FAIL.
- 60 FPS hedef, garanti değil; fiziksel Android/iOS test edilmediyse NOT TESTED.

## Gate 4 — güvenlik ve regresyon

- Supabase/IndexedDB, auth/profile, offline resume ve duplicate XP/rewards testleri.
- Mevcut 24 test + export/build + navigasyon. Test sayısı tek başına başarının kanıtı değildir.
- `git commit`, `push`, `deploy`, migration, legacy Godot delete yok.
