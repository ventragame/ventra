# 04 — Game Mechanics Catalog ve seçim matrisi

**Durum:** Oyun türlerinin hiçbiri henüz nihai olarak seçilmedi. Aşağıdakiler **aday**.

## Kural
Bir **oyun ailesi/mekaniği** farklı sınıf ve kazanımlar için veriyle değişen görev paketlerine sahip olabilir. Mekanik ve müfredat içeriği birbirinden ayrılmalı; sırf konu değişti diye yeni oyun yazılmamalı.

## Kısa liste — AÇIK
| Kod | Oyun ailesi | 1 dakikalık oynanış | Uyarlama örnekleri | Risk / dikkat |
|---|---|---|---|---|
| GM-01 | İnşa / fiziksel bulmaca | Nesneleri yerleştir, sistemi çalıştır | Kesirlerden köprü; şekillerden yapı | Mekanik gerçekten eğlenceli olmalı; düz sürükle-bırak testine düşmemeli |
| GM-02 | Yönetim / simülasyon | Siparişi al, kaynakları planla, sonucu gör | Para, dört işlem; fen deneyleri | Arayüz ve okuma yükü küçük yaşa uygun olmalı |
| GM-03 | Keşif / görev macerası | Karakteri yönet, çevreyle etkileş, engeli çöz | Ölçü, yön, akıl yürütme | İçerik üretim ve hareket kontrolü maliyeti |
| GM-04 | Hızlı arcade / refleks | Kısa turlarda doğru karar ver, ritmi koru | Akıcı hesap, örüntü, kelime eşleme | Süre baskısı öğrenmeyi/güvenliği olumsuz etkileyebilir; erişilebilir seçenek gerek |
| GM-05 | Dedektif / çıkarım | İpuçlarını birleştir, doğru hipotezi test et | Problem çözme, Türkçe anlam, fen | Yazı yoğunluğu ve yaşa uygun anlatım |
| GM-06 | Deney / keşfet-yanıl | Değişkenleri değiştir, sonucu gözle | Fen ve matematik ilişkileri | Simülasyon bilimsel olarak doğru olmalı |

## Seçim yöntemi: önceden sabitlenmiş puanlama — ÖNERİ
Her mekanik için **1–5** puan verin; puanların gerçek ölçümleri olmadan sonuçları 'kanıtlanmış' ilan etmeyin.

| Kriter | Önerilen ağırlık | Kanıt örneği |
|---|---:|---|
| Öğrenme değeri / kavramsal doğruluk | %30 | Öğretmen incelemesi, öğrenme hedefiyle gerçek etkileşim |
| Eğlence ve tekrar oynanabilirlik | %25 | Çocuklarla kısa oynanış testi; gönüllü tekrar isteği |
| Farklı sınıflara/kazanımlara uyarlanabilirlik | %15 | En az iki gerçek görev varyantı |
| Yapım maliyeti ve risk (düşük = yüksek puan) | %15 | Görev taslağı, varlık/sahne ihtiyacı |
| Mobil kullanım ve erişilebilirlik | %10 | Dokunma, ekran yoğunluğu, okuma yükü |
| Tahmini paket boyutu etkisi (düşük = yüksek puan) | %5 | Ölçülen varlık boyutları ve build farkı |

**Toplam =** Σ(`puan / 5 × ağırlık`), 100 üzerinden.

## Karar tablosu — doldurulacak
| Oyun kodu | Öğrenme (1–5) | Eğlence | Yeniden kullanım | Maliyet | Mobil | Boyut | Kanıt bağlantısı | Karar |
|---|---:|---:|---:|---:|---:|---:|---|---|
| GM-01 | — | — | — | — | — | — | — | AÇIK |
| GM-02 | — | — | — | — | — | — | — | AÇIK |
| GM-03 | — | — | — | — | — | — | — | AÇIK |
| GM-04 | — | — | — | — | — | — | — | AÇIK |
| GM-05 | — | — | — | — | — | — | — | AÇIK |
| GM-06 | — | — | — | — | — | — | — | AÇIK |

## Oyun seçimi öncesi zorunlu çıktılar
1. **30–60 saniyelik oynanış senaryosu:** Çocuk neye dokunur, ne görür, sonucu ne olur?
2. **Mekanik farkı:** Halihazırdaki Kesir Atölyesi'nden hangi davranış açısından ayrılıyor?
3. **İki uyarlama örneği:** Aynı oyun ailesi iki sınıf/konuda nasıl değişiyor?
4. **Teknik prototip boyutu:** Godot mu, React/TS mi? Neden?
5. **Hedef kazanım ve yanlış cevap geri bildirimi:** Soru kaplaması mı, gerçek bir mekanik mi?
6. **Oynanış geri bildirimi:** En az kısa bir hedef yaş kullanıcı testi planı.

**Önemli:** Önce 3–4 oyun üretmeye karar verip sonra hangi oyunlar olduğunu aramayın. **Önce adayları değerlendirip tek bir vertical slice seçin.** Oyun sayısı daha sonra sabitlenebilir.
