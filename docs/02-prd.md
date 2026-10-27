# 02 — Product Requirements Document (PRD)

**Durum:** v0.1 / kararlar bekliyor  
**Öncelik sırası:** öğrenme doğruluğu → eğlenceli oynanış → erişilebilirlik/perf. → içerik ölçeği.

## 1. Hedef kullanıcılar
| Kullanıcı | Temel ihtiyaç | Durum |
|---|---|---|
| Çocuk oyuncu | Kolay başlayıp görevler yaparak öğrenmek | KABUL |
| Yetişkin / veli | İsteğe bağlı hesap, yedekleme, ilerleme görünürlüğü | KABUL (ilerleme ayrıntıları geliştirilebilir) |
| Öğretmen / okul | Sınıf, görev atama, rapor, çoklu öğrenci | ERTELENDİ |

**AÇIK:** Hedef yaş aralığı, ilk sınıflar, oturum süresi, aile/öğretmen onboarding yöntemi.

## 2. Temel akışlar
1. Çocuk takma ad + avatar ile **yerel profil** seçer/oluşturur.
2. Öğrenme Merkezi'nden sınıfına uygun içeriğe ulaşır.
3. İlgili macera veya mini oyunu açar; oyunda kazanımı uygulamaya geçer.
4. Aynı beceri kimliğiyle akademik ilerlemesi, oyun düzeyi ve yıldızları **ayrı fakat ilişkili** olarak tutulur.
5. Yetişkin isterse e-posta OTP ile hesabı bağlar ve desteklenen içerikleri buluta eşitler.

## 3. Gereksinim matrisi
| ID | İhtiyaç | Öncelik | Statü / not |
|---|---|---|---|
| PRD-01 | Hesapsız yerel profil ve çevrimdışı ilerleme | P0 | Mevcut sistem / regresyonla korunacak |
| PRD-02 | Sürüm+sınıf+ders+kazanıma bağlı eğitim kataloğu | P0 | Tasarlanacak, kaynak doğrulaması gerekli |
| PRD-03 | Konuya uygun anlatım + etkileşim + ölçme | P0 | Kesirler pilotu mevcut; içerik genişlemesi açık |
| PRD-04 | Oyun mekaniğini içerikten bağımsız konfigüre edebilme | P0 | Mimari hedef; uygulama yöntemi seçilmedi |
| PRD-05 | Oyun görevlerinin hedef kazanıma bağlanması | P0 | Ortak beceri sistemi var; yeni oyunlar için doğrulanacak |
| PRD-06 | Godot / web uygulaması arasında güvenli ilerleme akışı | P0 | Mevcut köprü korunacak |
| PRD-07 | Yetişkin hesabıyla isteğe bağlı OTP ve bulut yedekleme | P0 | Phase 3.4 canlı OTP ve ilk sync raporlandı |
| PRD-08 | Tekrarlanabilir, özgün ve dokunmatik oyun deneyimi | P0 | Kalite standardı kararlaştırılacak |
| PRD-09 | Gelişim ekranında doğru konu / oyun ayrımı | P1 | Genişleyen oyun kataloğuyla test edilmeli |
| PRD-10 | İçeriklerin gerektiğinde ayrı indirilmesi | P2 | Sadece öneri, uygulanmadı |
| PRD-11 | Öğretmen paneli, canlı yarışma, white-label | Daha sonra | İlk vertical slice kapsamında değil |

## 4. Sınıf ve müfredat mantığı
- Profil için sınıf düzeyi ayrı tutulur; sınıf değişimi eski ilerlemeyi silmez.
- Kazanım kimliği **müfredat sürümüyle** ilişkilidir. Aynı başlıklı kazanımın farklı sınıf/sürüm içeriği ezilmez.
- Görevler `game_id + level_id + curriculum_version + outcome_ids` gibi açık ilişki taşır; uygulama düzeyindeki kesin şema teknik tasarım sırasında seçilir.
- `aynı oyun mekaniği` ≠ `aynı seviye`: örn. markette 2. sınıf basit para hesabı, 4. sınıf çok adımlı bütçe.
- Müfredat eşlemeleri resmî kaynaktan **doğrulandı** statüsüne geçmeden yayınlanmaz.

## 5. Oyun kalite kapısı — ÖNERİ
Bir oyuna “tamamlandı” demek için:
- Gerçek oynanış videosu / ekran görüntüsü ve çalışan build.
- Tüm görevler matematiksel ve pedagojik olarak kontrol edilmiş.
- Öğretici geri bildirim ve yaşa uygun kontrol sistemi.
- Hem fare hem dokunmatik cihazda sınanmış oynanış.
- Öğrenme Merkezi ↔ oyun ↔ ilerleme bağlantısı doğrulanmış.
- Kapalı ağda temel oynanış ve kayıt test edilmiş (paketlenmiş içerik için).
- Yakın mevcut oyundan anlamlı bir mekanik farkı var.
- Varsa güncel paket boyutu/performans etkisi **ölçülmüş**, tahmin gibi sunulmamış.

## 6. Başarıyı nasıl ölçeceğiz? — AÇIK
| Boyut | Ölçüm önerisi | Dikkat |
|---|---|---|
| Öğrenme | Aynı beceri için kısa ön/son performans farkı | Yaşa uygun; ölçüm etkisi kontrol edilmeli |
| Eğlence | Gönüllü tekrar oynama / oturumu tamamlama | Çocuğu gereksiz uzun tutma hedefi değil |
| Zorluk | Yardım kullanma, tekrar deneme, terk edilen görev | Başarı oranından tek başına sonuç çıkmaz |
| Teknik | Kilitlenme, gecikme, indirilen MB, çevrimdışı başarı | Gerçek düşük/orta donanımda ölç |

**Veri güvenliği:** Çocuklardan gereksiz kişisel veri toplama veya üçüncü taraf izleme ekleme. KVKK / uygulama mağazası çocuk kuralları yayımdan önce ayrı kontrol gerektirir.

## 7. Bu PRD'nin bugün cevaplamadığı sorular
İlk sınıf/ders kapsamı, kalıcı oyun türleri, tamamlanmış görsel dil, ilk yayın boyut hedefi, üretim takvimi ve monetizasyon kararı. Bkz. `07-decisions.md`.
