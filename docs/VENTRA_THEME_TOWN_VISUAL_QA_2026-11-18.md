# Harf Korusu + Tema Kasabası — görsel güvenlik denetimi

- 254 tema kelimesi için açıkça atanmış, çocuğun yaşına uygun konu ipucu simgeleri bulunmaktadır. İpuçları birebir nesne çizimi gibi tanıtılmaz.
- Yalnızca doğru SVG nesne görseli bulunan kelimeler resim tanıma görevi olur; diğer kelimeler Türkçe–İngilizce eşleştirme görevinde öğrenilir.
- 8 tema sahnesi ve Harf Korusu'nun 26 harf-nesne illüstrasyonu korunur.
- Yanlış emoji yedekleri kaldırılır; görsel yükleme hatası için farklılaştırılmış konu ipucu gösterilir.
- Yeni kelime eklendiğinde konu ipucu kataloğunu zorunlu denetleyen test bulunur.

## Sınır

Bu adım 254 benzersiz tam nesne illüstrasyonu üretmez. A1/A2 soyut kelime ve cümleler bilerek konu ipuçlarıyla ve metin odaklı etkinliklerle gösterilir. Özellikle zaman, duygu, 'group work' gibi kavramları bir nesne resmiyle yanlış öğretmekten kaçınılır.

## Testler

`npm run type-check -w @ventra/web` ve `npm run test -w @ventra/web`; ayrıca 320/375/430px mobil ekran, Android ve iOS cihaz doğrulaması.
