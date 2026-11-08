# Cümle Meydanı — Yeni Dostlar V9: Anlam–Görsel Bütünlüğü

## Problem
Önceki `scene-2-friends.webp` öğrenme sahnesinde hazır köpek, kedi, tavşan ve mavi kuş bulunuyordu. Soru motoru daha sonra bir veya iki hayvanı SVG ile ekliyordu. Örneğin "iki mor kuş" sorusunda hazır mavi kuş da görünüyordu; sayma, renk ve tür öğrenmesi belirsizleşiyordu.

## Yeni tasarım
- Oyun sahnesi için `scene-2-friends-empty.webp` (1280×680, 164 KB, yerel ve çevrimdışı) kullanılır. İllüstrasyon hayvan, insan, oyuncak hayvan veya sabit cevap içermez; ortada canlı SVG karakterlerin duracağı ferah çayır vardır. Ana sahne gösterimleri farklı başlık ve kapaklardan bağımsızdır.
- Görsel eski bir Ventra için üretilmiş özgün panoramik çayır illüstrasyonundan yeniden kırpıldı/optimize edildi; yeni bir sıfırdan oluşturulmuş 3B varlık olarak pazarlanmamalıdır. Bu görselin altı oyun kapağıyla ilgisi yoktur.
- Doğru tür + renk + sayı yalnızca `task.scene.actor`, `task.scene.color` ve `task.scene.count` üzerinden gelir. Tekil soruda bir, çoğulda iki *aynı tür ve aynı renkte* karakter görüntülenir; ekstra hayvan yoktur.
- Öğrenme hedefi daha net görülsün diye hayvan boyutu artırıldı, birbirlerinden ayrıldı ve gölgelendirmeyle sahneye oturtuldu.
- Pre-A1 seçimlerinde çok farklı emoji çizimleri yerine aynı `SentenceAnimalArtwork` vektör varlıklarının küçük halleri kullanılır. Mini seçeneklerdeki renk soru sahnesindeki renkle aynıdır. SVG `defs` kimlikleri eşleşmesin diye farklı indeksler kullanılır.
- Görseldeki ortam bir bahçe olduğu için görev 2'nin `in the square / Meydanda` kalıpları `in the garden / Bahçede` yapısına güncellendi. A2 gerekçeli cümle, görünür güneş ve bahçe ile uyumlu olacak şekilde yeniden yazıldı. Soru anahtarının `key` biçimi korunur; İngilizce cevap anahtarı *bu yeni sorular için* güncellenmiştir.
- "Sahneyi seç" yerine "Resimde hangi hayvan var?" yönergesi kullanılır; yanlış seçimde çocuk nesneyi yeniden incelemeye yönlendirilir.
- Oyun dışı kapak görselleri, diğer beş dünya ve ilerleme kaydı şeması değişmemiştir.
- Oyunun büyülü anlatımı renkli hayvanları bilinçli olarak kullanır; gerçekçi biyolojik renkleri öğretme iddiasında değildir.

## Kontroller
`sentence_clarity_v3.test.mjs`: Pre-A1/A1/A2 tam soru havuzunda sahne–hedef tür/renk/sayı uyumu, tek/çift çoğul, A2 neden-sonuç, Pre-A1 gerçek SVG seçenekleri, erişilebilirlik ve responsive görünümler. Eski V6 regresyon testi yeni V9 sahne dosyasını doğrular.

CI / TypeScript / web/mobile derleme, Android ve iOS sonuçlarını ayrıca doğrulamak gerekir. Gerçek cihazda seçilen hayvanın tek bakışta tanınması, sayım ve görsel hiyerarşi insan testi gerektirir.

**Production deployment yok.**
