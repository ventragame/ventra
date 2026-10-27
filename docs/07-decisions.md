# 07 — Karar kayıtları ve açık sorular

**Durum:** v0.1, 27.10.2026. Bu dosya **tek karar kaynağıdır**.

## Kabul edilmiş temel kararlar
| ID | Karar | Durum | Gerekçe / sınır |
|---|---|---|---|
| DEC-001 | Öğrenme Merkezi + Macera Evreni + ortak ilerleme | KABUL | Ürün modelinin temeli |
| DEC-002 | Oynama için hesap zorunlu değil; yerel çocuk profili | KABUL | Erişilebilir başlangıç |
| DEC-003 | Yetişkin e-posta OTP + isteğe bağlı bulut yedekleme | KABUL | Phase 3.4 kuruldu ve ilk canlı akış raporlandı |
| DEC-004 | 40 konu için 40 ayrı mini oyun geliştirilmeyecek | KABUL | Tekrar kullanılabilir mekanik + müfredat görev paketleri |
| DEC-005 | Sınıflar arasında aynı oyun ailesi, farklı görev/zorluk | KABUL (prensip) | Pedagoji sınıfa özel kalır; her mekanik tüm sınıflara zorlanmaz |
| DEC-006 | Godot ana oyun motoru; Next.js/TS öğrenme ve web uygulaması, Capacitor mobil kabuk, Supabase sync | KABUL (mevcut temel) | Oyun bazında React/TS seçimi vaka bazında değerlendirilecek |
| DEC-007 | İlk çalışan pilot: 4. sınıf kesirler | KABUL (pilot) | İlk ticari sürüm kapsamı anlamına gelmez |
| DEC-008 | Push/commit/deploy/canlı migration için ayrı onay | KABUL (çalışma kuralı) | Phase 3.4 push'u için kullanıcı onayı vardı; geleceğe otomatik izin vermez |

## Henüz verilmemiş kararlar — öncelik sırasıyla
| ID | Soru | Mevcut adaylar | Karar yöntemi | Durum |
|---|---|---|---|---|
| OPEN-01 | İlk ticari sürümde hangi sınıflar? | Tek sınıf / 2–4 / başka kapsam | Üretim maliyeti, müfredat, hedef kitle | AÇIK |
| OPEN-02 | İlk sürümde hangi dersler? | Önce matematik / iki ders / çoklu ders | İçerik kalite ve kaynak kapasitesi | AÇIK |
| OPEN-03 | Hedef yaş ve oturum tasarımı? | Pilot 4. sınıf / daha geniş yaş | Yaş uygunluğu, kullanılabilirlik testi | AÇIK |
| OPEN-04 | Hangi oyun mekanikleri? | GM-01…GM-06 | Katalogdaki puanlama + test | AÇIK |
| OPEN-05 | İlk vertical slice hangisi? | En yüksek puanlı aday | 1 dakikalık oynanış, pedagojik değer, maliyet | AÇIK |
| OPEN-06 | Dünya ve oyunların görsel standardı? | 2D / 2.5D / karma | Referans pano + test build | AÇIK |
| OPEN-07 | Oyun görev yapısı / ilerleme ekonomisi? | Sabit seviye, görev paketi, tekrar oturumu | Yaşa uygun test, pedagojik ihtiyaç | AÇIK |
| OPEN-08 | Boyut bütçesi ve içerik indirimi? | Öneri: ilk indirme 100 MB altı; opsiyonel paketler | Release build ölçümleri | AÇIK |
| OPEN-09 | Ana oyunlarda Godot/React dağılımı? | Godot dinamik sahne; React hafif etkileşim | Performans ve geliştirilebilirlik | AÇIK |
| OPEN-10 | B2B/B2C fiyatlama/monetizasyon? | Abonelik / lisans / başka modeller | İş modeli analizi + çocuk politikaları | ERTELENDİ |
| OPEN-11 | Müfredat sürümü ve resmî kaynak doğrulama süreci? | Sınıf ve okul yılı bazlı katalog | MEB belge kontrolü | AÇIK |

## Karar değişikliği şablonu
```text
Karar ID:
Tarih:
Konu:
Mevcut durum:
Seçenekler:
Karşılaştırma kriteri ve kanıt:
Seçilen:
Neden:
Etkilenen dosyalar / modüller:
Sahip / onay:
```

## Öncelikli karar atölyesi
**Önce OPEN-01 ve OPEN-02:** İlk ürünün sınıf + ders kapsamını kararlaştırın. Ardından OPEN-03–06 ile oyun prototipini seçin. Bunlar olmadan bir oyunu tamamlamaya yatırım yapmak tekrar iş doğurabilir.
