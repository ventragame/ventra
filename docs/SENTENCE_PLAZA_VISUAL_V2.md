# Cümle Meydanı — V2 visual-first release

## Scope
- Ana ada: metin yoğunluğu azaltıldı, altı görselli görev kartı, dört aşamalı Gör → Dinle → Kur → Canlandır yönlendirmesi.
- Görev 1–3 (Renklerin Uyanışı, Yeni Dostlar, Gizli Yerler): canlı sahne, daha kısa yönergeler, şıklar, kelime yuvaları ve büyük Canlandır eylemi.
- Dil yapısı ve kelime desteği kaldırılmadı; erişilebilir açılır yardım alanlarında tutuldu.
- Sahnedeki statik SVG çizimi yerini WebP çevre görüntüsüne bıraktı. Cevapla değişen hayvan, balon, çiçek ve diğer öğeler aynı SVG etkileşim katmanında kaldı.
- Mobil 359/610/950px, reduced-motion ve klavye odağı kuralları eklendi.
- Özgün V2 görselleri üretilmiş olsa da GitHub'a binary aktarım başarısız olduğundan bu committe **Ventra deposunda zaten bulunan, yerel premium WebP'lerin dosya içeriği yeniden kullanıldı**. Yedi dosya `assets/sentence-plaza/v2` altında fiziksel olarak mevcut ve özgün görsellerle karıştırılmamalı.

## Bilinçli olarak değiştirilmedi
- Sınıf seviyesi ve İngilizce seviye politikası; görev ve kelime seçimi; cümle değerlendirmesi; yardım/bağımsız başarı kanıtları; seslendirme; otomatik geçiş ve ilerleme kaydetme.
- Hareket Büyüsü, İstekler Meydanı ve Fener Festivali ayrı bileşenlerinde çalışmaya devam ediyor; aynı görsel sadeleştirmeyi sonraki aşamada gerektiriyor.
- Yeni görev, satın alma, prod deploy veya veri migrasyonu yok.

## Kabul
GitHub CI: TypeScript, sentence_plaza Node testleri, web/mobile build, iOS/Android derlemeleri. Gerçek tarayıcı ve telefon testi ayrıca yapılmalıdır.
