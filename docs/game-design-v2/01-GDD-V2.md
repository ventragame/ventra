# Kesir Köprüsü — GDD v2

**Sürüm:** 2.0 / İlk vertical slice için uygulanabilir tasarım  
**Kullanıcı onayı:** Hibrit Ventra ürün modeli + premium sahne tabanlı Kesir Köprüsü konsepti  
**Hedef oyuncu:** 4. sınıf / yaklaşık 9–10 yaş  
**Kazanım:** `M.4.1.6.2` — Birim kesirleri karşılaştırma ve sıralama (mevcut proje katalog eşleştirmesi; güncel resmi müfredat sürümü lansman öncesinde yeniden doğrulanmalı)

## Ürün içindeki rol

- **Öğrenme Merkezi:** Kavram anlatımı, modeller, örnekler ve detaylı pratik. Bunlar korunur.
- **Macera Evreni / Kesir Köprüsü:** Çocuk kesir büyüklüklerini fiziksel köprü parçalarını sıralamak için **araç olarak** kullanır. Doğrudan çoktan seçmeli test oynanışın temelini oluşturmaz.
- **Gelişim:** Öğrenme ve oyunun tek kaynaklı beceri kaydı, oyun-bölüm bazlı yıldızlar.

## Kısa oyun vaadi

> Bir kaşif ve robot arkadaşı iki ada arasındaki kırık köprüyü onarır. Çocuk ahşap köprü parçalarını doğru kesir büyüklüğüne göre yerleştirir; köprü canlanır, kaşif karşıya geçer ve yeni macera açılır.

### Oyuncu kontrolü

- Profildeki **seçilmiş avatar görünür**; öncelikle **otomatik tepki/ilerleme animasyonu** yapar. Oyuncudan platform karakterini yönlendirmesi istenmez.
- Robot, hedefi ve isteğe bağlı ipucunu görsel olarak sunar; uzun açıklama metinleri yoktur.
- Oyuncunun birincil eylemi: **kesir tahtalarını gerçek sahne üzerindeki yuvalara sürüklemek veya dokunarak yerleştirmek**.
- Başta, sahnenin ortasında, sonda sürekli gerçek dünya etkileşimi bulunur; matematik kartları bütün ekranı kaplamaz.

## Tek bölüm / vertical slice (KESIN KAPSAM)

**Seviye adı:** Yarım, Üçte Bir, Çeyrek  
**Öğrenme hedefi:** Aynı büyüklükte bir bütünün birim kesirleri için `1/2 > 1/3 > 1/4` sıralamasını görerek ve yaparak kavrama.  
**Hedef süre:** 2–4 dakika (ürün hedefi; gerçek çocuk testinde ölçülecek).  
**Yapı:** 3 parçalı bir köprü + 3 farklı kesirli ahşap tahta + 3 yuva.

### 1) Başlangıç

- Profildeki avatar sol adada, robot yakınında; karşı adada hedef bayrağı/ışıltı görünür.
- 1 cümlelik görev: **“Tahtaları büyükten küçüğe dizerek köprüyü tamamla!”**
- İlk denemede kısa, isteğe bağlı sürükle animasyonu yapılır. Oyuncu istediği zaman atlar.
- Matematiksel sıralama görsel ok/yol yönüyle belirtilir (başlangıçtan hedef adaya).

### 2) Etkileşim

- Üç ahşap parça: `1/2`, `1/3`, `1/4`. Kart değil, gerçek oyun nesnesi gibi ahşap plank.
- Parçaların **görünür matematiksel uzunlukları aynı referans bütünle orantılıdır**: `W/2`, `W/3`, `W/4`. Kalas hitbox'ı daha büyük ve şeffaf olabilir ama görünür uzunluk yanıltılamaz.
- Oyuncu parçayı yakalar, hayalet önizlemeyle bir köprü yuvasına koyar. Yanlışlıkla yuvaya yaklaşınca yumuşak snap; yuvadan geri alınabilir.
- Hem sürükle-bırak hem dokun → yuva seçme akışı bulunur.
- Destek kirişleri/parmaklıklar **köprüyü tamamlayan ayrı grafik öğelerdir**. Matematiksel tahta uzunluğunu gizlice eşit uzunluğa esnetmek yasak: gerçek kesir görselleştirmesi yanlış olur.
- İlk bölümde tüm öğeler baştan görünür; süre baskısı ve can kaybı yoktur.

### 3) Denetim ve geri bildirim

- 3 yuva dolduğunda kısa bir kontrol animasyonu oynatılır; tercihen **ayrı büyük `Kontrol Et` düğmesi olmadan** otomatik doğrulama. Kullanıcı ilerlemek için onay düğmesine basmak zorunda değildir.
- Doğru sıra: yürüyüş yolunu oluşturan bağlantı ve korkuluklar tamamlanır, ışık/parçacık efekti; avatar yol üzerinden karşıya **otomatik** geçer.
- Yanlış sıra: kalaslar güvenli biçimde yerinde kalır, hatalı ilk ilişki hafifçe belirir; robot **“Yarım mı daha büyük, çeyrek mi? Parçaların uzunluklarına bak.”** gibi kısa öğretici bir ipucu gösterir. Çocuk düzenleyebilir.
- Yanlış için düşme, korkutucu animasyon, ceza, bölüm kilitleme veya alaycı dil yoktur.

### 4) Sonuç

- 3 yıldızlık animasyon ve net seviye tamamlandı durumu.
- Yıldız puanlama için v1 kural: ilk doğrulamada ipuçsuz `3`, bir ipucuyla/düzeltmeyle `2`, tamamlanan diğer denemelerde `1`. Asla kazanılmış yıldız azaltılmaz; daha iyi tekrar sonucu artırabilir.
- `Devam Et` ile harita/sonraki bölüm kartı gösterilir. 2–10. seviyeleri **bu görevde yeniden geliştirme**. Mevcut prototip içerikleri kaybolmaz, ancak premium onayı verilmeyen bölümler yeni görsel akışın doğal devamı gibi gösterilmez.
- `Tekrar Oyna` aynı bölümü sıfırlar ve kayıtları bozmaz.

## Oyun döngüsü

1. Bölüme gir; hedefi gör.
2. Parçaların kesirlerini/uzunluklarını incele.
3. Köprü yuvalarına yerleştir.
4. Otomatik kontrol ve görsel geri bildirim al.
5. Hatalıysa düzenle, doğruysa karakteri geçir.
6. Kazanımı ve yıldızları profil ilerlemesine yaz; sonraki göreve yönlen.

## Eğitim ilkeleri

- Aynı bütün üzerinden karşılaştırma; her kesir 1/n olup pay tam olarak 1.
- İlk görev matematiksel olarak `1/2 > 1/3 > 1/4`.
- Temsiller açıkça görülsün; sadece etiket okumaya dayalı cevap verilmesin.
- Sadece doğru-yanlış değil, **neden** gösteren geri bildirim.
- İlk bölümden sonra kazanım ustalığı iddiası yapma; basit öğrenme öncesi/sonrası kontrolü gerçek kullanıcı testinde yapılır.
- Öğrenme Merkezi kazanım içeriği ve seviye sözleşmesi tutarlı olmalı.

## Başarı tanımı

Üç ahşap kalası ekrandaki bir kart paneline değil **sahnedeki köprü yuvalarına** taşıyabiliyorum; matematiksel oranları gerçekten görebiliyorum; doğru çözümde avatar köprünün üzerinden geçiyor; sonuç profil ilerlemesine doğru kaydediliyor; oyun gerçek telefonda rahat oynanıyor.

## Kapsam dışı

Yeni dersler, yeni oyun türleri, 2–10. bölümün premium dönüşümü, serbest dolaşım/joystick, açık dünya, okul paneli, ödeme, Auth/DB mimari değişimi, prod deploy.
