# Cümle Meydanı — V8 Ayırt Edilebilir Hayvan Çizimleri

## Neden
Önceki konum/arkadaşlık soruları tek bir soyut kafa-gövde şeklinin üzerine sadece tavşan kulağı veya kuş gagası ekliyordu. Özellikle köpek, kedi ve tavşan küçük ekranda ayırt edilemiyordu. Çocuk görseli çözemediği için İngilizce öğrenme görevi pedagojik olarak geçersizleşebiliyordu.

## Uygulanan çözüm
- `SentenceAnimalArtwork.tsx`: Dört ayrı **özgün, ölçeklenebilir SVG çizimi** (köpek, kedi, kuş, tavşan). Render-time inline SVG; uzak resim servisi, emoji veya lisanslı stok görsel kullanılmaz.
- Her hayvanın ayrı anatomisi: köpekte aşağı sarkan kulak, geniş burun, boyunluk; kedide üçgen kulak, bıyık ve kıvrık kuyruk; kuşta gaga, kanat, tüy ve kuş ayakları; tavşanda uzun kulak, pamuk kuyruk ve dişler.
- Renk eğitiminde `red, blue, green, yellow, purple, orange` boyaları soru verisinden çizime uygulanır; doğal renkli görünüm aksi halde korunur. Boya değişse bile türün şekil özellikleri kaybolmaz.
- `SentencePlazaScene.tsx`: eski ortak hayvan SVG placeholder tamamen çıkarıldı. 240×260 ana çizimler sahne koordinatlarına yaklaşık 154×166 ölçeğinde çizilir; bu masaüstünde daha okunaklı, küçük ekranda daha net görünüm sağlar.
- Ön izleme, konum, hayvan sayısı ve mevcut doğru cevaba bağlı uçma/zıplama/koşma/uyuma animasyonları korunur.
- `behind the house` için kırpma maskesi yeni uzun kulaklara da alan bırakacak şekilde güncellendi; doğru yanıt verilene kadar başarı animasyonu gösterilmez.
- İlerleme, soruların İngilizce cevap anahtarı, sınıf farkındalığı, ses ve altı oyun kapağı/arka plan resmi değiştirilmedi.

## Teknik doğrulama
- `sentence_clarity_v3.test.mjs` V8 kaynak testleri: dört farklı tür çizimi, her türün anatomik işaretleri, altı renk, dinamik SVG entegrasyonu, eski placeholder'ın yokluğu, arka plan ve responsive animasyon kuralları.
- TypeScript, öğrenme/regresyon, web ve mobil CI.
- Cihaz testi: özellikle 320–375 px mobil genişlikte köpek/kedi/kuş/tavşanı tek bakışta tanımlama, nesne sayısı, renk, ev arkasındaki örtüşme, konum hotspotları, doğru cevap animasyonu.
- Çizimlerin görsel kalitesini ve çocukların türleri tereddütsüz ayırt edip etmediğini yalnızca otomatik testlerle kanıtlayamayız.
- Production deployment yok.
