# G1.5–G1.6 + G2 — Premium Aile Köyü GDD ve Kabul Kontrolleri

**Ürün kapsamı:** [VENTRA_PRODUCT_CHARTER.md](./VENTRA_PRODUCT_CHARTER.md). Ventra dil öğrenme uygulamasıdır. Mühendislik, matematik, para hesabı, ekonomi veya bağımsız simülasyon oyunu değildir.

## G1.5 Lezzet Pazarı kalite
- 45 kelime, üç pazar sokağı ve 15 görev korunuyor; özgün pastel SVG tabanlı ürün çerçeveleriyle görsel tutarlılık iyileştirildi. **Ürünlerin merkezindeki simgeler hâlâ emoji; 45 benzersiz profesyonel sprite üretildiği iddia edilmiyor.**
- WebSpeech dinleme görevi, sesin **başlamasını değil tamamen bitmesini** bekler; ses desteklenmezse yazılı yardım açılır ve yanıt bağımsız dinleme sayılmaz.
- Pre-A1, A1 ve A2 katmanlarında her uygun kelimenin tekrar keşif seanslarında erişilebilir olması otomatik test edilir.
- **Açık:** gerçek cihazda İngilizce ses kalitesi, özgün 45 ürün görseli/animasyon paketi ve çocuk oturumu QA.

## G1.6 kabul kapısı
- [x] G1.5 kelime kapsamı regression; farklı yaş/İngilizce seviyeleri.
- [x] Tamamlanan dinleme sesi / yazılı fallback statik regresyon.
- [ ] Gerçek Android/iOS ve ekran okuyucu üzerinde oynatma/kapama, ipucu, sessiz mod, mobil dokunmatik.
- [ ] 7–12 yaş çocuklarla bağımsız oynama ve 7 gün sonra kelime kalıcılığı.
- [ ] Çevrimdışı→çevrimiçi senkronizasyonun iki gerçek cihazda kabul testi.

## G2 — Aile Köyü dil müfredatı
**Dört mahalle, her biri 15 kavram ve beş dil görevi; toplam 60 İngilizce kelime/ifade, 20 bölüm, en fazla 60 yıldız.**

| Mahalle | Temel öğrenim hedefi |
| --- | --- |
| Aile Evi | mother, father, sister, brother, baby, grandmother, grandfather, family, aunt, uncle, cousin, parents, daughter, son, grandchild |
| Oda Kaşifleri | kitchen, bedroom, bathroom, living room, garden, dining room, hallway, balcony, study, garage, attic, basement, laundry room, guest room, stairs |
| Eşya Avı | door, window, table, chair, bed, lamp, sofa, clock, mirror, bookshelf, fridge, sink, pillow, wardrobe, carpet |
| Bir Günüm | wake up, brush my teeth, wash my face, get dressed, eat breakfast, go to school, read a book, go to bed, do homework, have lunch, play outside, take a shower, tidy my room, help at home, have dinner |

Pre-A1/1–2. sınıf ilk 8, A1/3–4. sınıf ilk 12, A2/üst sınıflar 15 kavrama kadar erişir. Bir oturumda 6–8 kavram çalışılır; replay ve eksik kelime keşfiyle tüm uygun içeriğe ulaşılabilir.

### Beş premium dil görevi
1. **Evi Keşfet:** Tematik ev sahnesi ve keşfedilen her kelimenin yazılı/sözlü gösterimi (maruz kalma).
2. **Kelimeyi Hatırla:** Türkçe kavram ↔ İngilizce kelime (tanıma).
3. **Kim Konuşuyor?:** Tamamlanmış ses ↔ görsel/Türkçe karşılık (dinleme).
4. **Evin İçinde Bul:** "Go to the kitchen" veya "Touch the lamp" gibi İngilizce yönergeyi sahnede uygula (bağlam).
5. **Günlük Konuşma:** "I brush my teeth", "This is my mother" gibi yaşa uygun İngilizce cümleleri doğru bağlama seç (ifade seçimi).

Öğrencinin konuşma sesinden İngilizce telaffuzunu ölçmek henüz uygulanmış **değildir**. Bu sürümde bağımsız "speaking" başarısı kaydedilmez.

### Ölçme ve ödüller
- gameId: `island_word_garden_family`; 1–20 bölüm. Mevcut oyun ID'leri değiştirilmez.
- Keşif/recognition/listening/context/dialogue kanıtı ve yardım/yanlış/ilk deneme metriği kaydedilir.
- P3 family alanındaki öğrenme durumu mevcut adaptif motorla ayrı izlenir. P5 ilk kez bitirilen bölüm +10 coin (tam yol 200); tekrar ödül oluşturmaz.
- Profil başına ilerleme izolasyonu, aynı session ID ile tekrar gelen bulut event idempotency mevcut mimariyi kullanır.
- Bölge başka oyunların bitmesini zorunlu kılmaz. Kendi 20 görevi ve mahalleleri sırayla açılır.

### Teknik/kullanıcı kabulü
- [x] Kelime, seviye, tekrar ve 20 görev modelinin kodlanması.
- [x] Dört SVG tematik ev sahnesi, responsive kartlar, mobil erişim kontrolleri.
- [x] P3, P5, profil/oturum/ileri görev kilidi bağları.
- [ ] Canlı Supabase ve iki fiziksel cihazda olay, yıldız ve profil eşitlemesi.
- [ ] Android/iPhone üzerinde TTS, dokunma, font, ekran okuyucu, kesinti testleri.
- [ ] Çocuk kullanıcı testi ve stüdyo ses/çizim paketleri.
- [ ] Canlı gerçek okul sınırları ve erişim kontrolleri son kabulü.

**CI başarılı olsa da gerçek cihaz/çocuk testi olmadan "mağazada nihai ticari premium sürüm" denemez.**
