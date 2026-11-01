# Ventra P5 — Ödül ve Ebeveyn Ödeme Kabulü

## Kodlanan yerel ekonomi
- P5.1: Kids üst çubuğu Pasaport; üç dünya ve 23 görev, yıldız, keşfedilmiş kelimeler, kozmetik ekipmanlı karakter.
- P5.2: Yıldız harcanmaz. Ayrı coin ledger'da tamamlanan her benzersiz oyun bölümü bir defa +10 coin üretir. Eskiden tamamlanan seviyeler de tek sefer tanınır.
- P5.3: 8 kozmetik eşya, satın al/tak; işlem atomik yerel IndexedDB meta kaydıdır. Eşya ikinci defa ücretlendirilmez.
- P5.4: 1, 2, 3 kayıtlı oyun hedefine bağlı günlük 5/8/12 coin, günde en fazla 25; streak ve zorunlu tekrar baskısı yok.
- P5.5: Testlerde idempotent level, günlük ödül, kozmetik harcama, profil izolasyonu ve ücretli coin engeli; profil silmede meta kaydı temizlenir.

## Ticari kararı ve zorunlu kısıtlar
Yalnızca kozmetik için kullanılan coin, çekirdek öğrenme erişiminin kapısı olamaz.
Yalnızca **yetişkin oturumunda** görülen ürün taslakları 100 / 350 / 800 Ventra Coin'dir; fiyat belirlenmedi.
Bu ürünler satılık değildir. Ödeme başlatma, makbuzdan kredi verme ve istemciden para basma kodu yok.

Yayın için tamamlanması gerekenler:
1. Yalnızca matematik ebeveyn kapısı değil, yetişkin hesap kimlik doğrulaması ve satın alma yetkilendirmesi.
2. Android için Google Play Billing, iOS için StoreKit; mağazadaki gerçek ürün kimlikleri ve fiyatlar.
3. Supabase sunucu tarafında doğrulanmış store receipt + transactionId ile tek seferlik coin kredisi, fraud önlemi ve ledger RLS.
4. İade/geri alma, yeniden yükleme, iki cihaz senkronizasyonu, hesap silme ve müşteri destek süreçleri.
5. Coin paketleri için kumar/rastgele kutu yok; fiyat ve onaylar çocuk ekranında sunulmaz.
6. Gerçek cihaz, çocuk pilotu, ödeme sandbox denemesi, hukuki ve mağaza politika kontrolleri.

Kaynaklar:
- https://support.google.com/googleplay/android-developer/answer/9858738
- https://developer.apple.com/app-store/review/guidelines/

## Gerçek kullanıcı kabul listesi
- [ ] Pasaport açılır, mevcut yıldız/oyunlar doğru; aynı seviye tekrarında coin artmaz.
- [ ] Çocuk profili değiştirilince eşya/bakiye karışmaz.
- [ ] 8 kozmetik satın alma, tekrar satın almama, yetersiz bakiye ve takma/çıkarma.
- [ ] Üç günlük görev yalnızca kayıtlı oyun etkinliği varsa açılır, ertesi gün yeni olur.
- [ ] Profil silme/yeniden oluşturma sonrası eski ödül kaydı gelmez.
- [ ] Android/iOS gerçek cihaz, offline, ekran okuyucu testleri.
- [ ] Bulut üzerinde tek authoritative coin ledger ve payment receipt testleri **ücretli satıştan önce**.

P5 yerel oyun ekonomisi ile ücretli sanal para yayını aynı kabul kapısı değildir.
