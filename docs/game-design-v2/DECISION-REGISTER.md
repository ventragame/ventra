# Tasarım karar kaydı — Game Design v2

## Onaylı

| ID | Karar | Kaynak |
|---|---|---|
| D-01 | Ventra = Öğrenme Merkezi + gerçek eğitici oyunlar + Ortak Gelişim | Kullanıcı onayı |
| D-02 | İlk doğrulama hedefi 4. sınıf Matematik, tek bölüm | Kullanıcı onayı |
| D-03 | Önce premium oyun sahnesi, sonra 2–10 bölümlere büyüme | Kullanıcı onayı |
| D-04 | Kesir Köprüsü: avatar+robot, gerçek köprü, kesir parçalarını yerleştir, karakter karşıya geçsin | Konsept onayı |
| D-05 | Kodlamadan önce karar ve kabul dokümanları bizim tarafımızdan hazırlanacak | Kullanıcı isteği |
| D-06 | Mevcut full-stack/DB altyapısı korunsun; Phase 4 için commit/push/deploy yok | Önceki geliştirme sınırları |

## İlk vertical slice için uygulanabilir tasarım varsayımları (çocuk testiyle ayarlanabilir)

| ID | Varsayım | Nasıl sınanacak? |
|---|---|---|
| H-01 | 2–4 dakikalık bölüm uygun | Hedef yaş grubu oynanış testi |
| H-02 | Avatarı oyuncu elle yürütmesin, başarı anında otomatik geçsin | Eğlence/UX testi |
| H-03 | İlk bölüm `1/2 > 1/3 > 1/4`, 3 tahta | Eğitim doğruluğu ve anlaşılabilirlik |
| H-04 | 3 yıldız = ipucusuz ilk başarı, 2 = düzeltme/ipucu, 1 = tamamlanan diğer | Çocuk motivasyonu testi |
| H-05 | 3 yuva dolunca otomatik kontrol | İlk kullanıcı testi |
| H-06 | Mobilde köprü çapraz/dikey kadraj | Telefon UX testi |

## Bilerek ertelenen kararlar

- 2–10. bölüm tasarım ayrıntıları ve tam seviye kataloğu.
- İlk sürümdeki tüm dersler/sınıflar, diğer mini oyun türleri.
- Üretim görsellerini hangi çizim/animasyon pipeline'ıyla hazırlayacağımızın maliyet karşılaştırması.
- Seslendirme ve profesyonel müzik paketi (telif ve boyut bütçesi değerlendirmesi).
- Oyun içi ödüllerin uzun vadeli ekonomisi.
- iOS fiziksel cihaz/mağaza yayını, prod deploy, Android App Bundle ölçümü.

Önemli: Açık kararları Codex'in tek taraflı ürün kararı olarak kapatması yasaktır. İlk bölüm için başka bir ürün tercihi zorunluysa geliştirici engeli raporlanır.
