# Aile Köyü V7 — 15/15 Özgün WebP Karakter

## Sonuç

Aile Köyü'ndeki 15 aile/akrabalık kavramının tamamı artık aynı sanat yönetimine sahip **15 ayrı WebP dosyası** kullanıyor. V6'nın sekiz temel karakteri korunmuştur. Yeni eklenen yedi üst-seviye kavram:

| İngilizce kavram | Türkçe | Yeni dosya |
|---|---|---|
| aunt | teyze / hala | `aunt.webp` |
| uncle | amca / dayı | `uncle.webp` |
| cousin | kuzen | `cousin.webp` |
| parents | anne baba / ebeveynler | `parents.webp` |
| daughter | kız evlat | `daughter.webp` |
| son | erkek evlat | `son.webp` |
| grandchild | torun | `grandchild.webp` |

**Kaynak:** Bu konuşmada üretilmiş yedi ayrı, onaylanmış AI illüstrasyonu. Dosyalar uygulama içine gömülü yerel kaynaklardır, üçüncü taraf görsel CDN'i içermez.

**Biçim:** 512 × 512, alpha kanallı WebP. Görsel dışında kalan bağımsız artefaktlar temizlenerek yaklaşık 279 KB toplam dosya boyutuna indirildi.

**Dosya dizini:** `apps/web/public/assets/family-village/characters-v6/` (mevcut sekiz temel dosyayla aynı dizin).

## Koda bağlanma

- `FamilyVillageWordArt.tsx` içindeki `CHARACTER_CAMEOS` artık her aile kavramını aynı isimli dosyaya çözümler.
- Keşif, büyük soru görseli, dinleme/yönerge görsel seçenekleri aynı paylaşılan `FamilyWordArt` bileşenini kullanır.
- Görsel ve CSS boyutlandırma katmanlarıyla geriye dönük uyumluluk korunur. İlerleme kayıtları, oyun kimliği, profil verisi, adaptif motor ve ödüllerde değişiklik yoktur.

## Önemli pedagojik sınır

Bir akrabalık ilişkisi tek bir kişinin yüzünden belirlenemez. Örneğin *aunt* veya *daughter* portresinin farklı olması kelimenin doğruluğunu kendiliğinden kanıtlamaz. Bu yüzden aile görevlerinde Türkçe akrabalık etiketi görsel cevaplarla birlikte korunur; değerlendirme İngilizce sözcüğü tanımaya dayanır. Bu kelimeler için ilerde aile ağacı ve bağlamsal diyalog kullanmak ayrı bir pedagojik geliştirmedir.

## Kalite kapıları

- Otomatik test: 15 farklı kavram ve 15 benzersiz binary dosya; RIFF/WEBP, 512 × 512, alpha, toplam boyut
- Otomatik test: ilişkilerde anlamlı Türkçe destek, 5 görev, otomatik ilerleme, kayıt davranışının korunması
- CI: TypeScript, testler, production web, Android ve iOS derlemesi
- Yerel görsel kabul: 320, 360, 390 ve masaüstü; giriş/keşif, doğru-yanlış yanıt, seslendirme, kilitler

**Durum ilkesi:** Kodun CI'dan geçmesi gerçek cihazda ekran doğrulamasının yerine geçmez. Production deployment yapılmaz.
