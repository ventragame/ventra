# Oyun çerçevesi V1: her oyunda aynı yerler (2026-11-28)

## Neden

Ada ana sayfaları ortak bir iskelete geçince fark daha da göze battı: oyunların içi hâlâ 18 ayrı üründü. Her oyunun kendi sınıf öneki vardı (`sp-`, `mm-`, `wf-`, `lf-`, `harbor-`, `writing-`, `academy-`, `sj-`, `ss-`, `sd-`, `am-`, `cg-`, `nv5-`, `fm-`, `fv-`, `tp-`, `ag-`, `tt-`). Her oyun da şunları kendi çiziyordu:

- üst bar;
- geri düğmesi: "← Meydana Dön", "←", "← Bölümlere Dön", "← Bölgeler", "‹ Kelime Bahçesi", "← Geri" gibi farklı yazılarla;
- adım sekmeleri;
- ilerleme çubuğu;
- butonlar;
- sonuç kartı.

Akademi'de oyun alanı 760 px'lik dar bir sütundu. Bu yüzden geniş ekranda sol taraf boş kalıyordu. Yazı Atölyesi'nde ise adım şeridi altındaki karttan taşıyordu.

## Ne aynı

`apps/web/src/components/learning/game/GameFrame.tsx` ve `game-frame.css`. Renkler `island/island-palette.css` dosyasından gelir. Bu palet ada ana sayfalarıyla (`.ih-root`) ve oyun çerçevesiyle (`.gf-theme`) ortaktır, böylece bir oyun adasının renginden kopamaz. Çerçeve yalnızca sunum katmanıdır: ilerleme, ses ve cevap kaydı okumaz, yazmaz.

| Parça | Davranış |
|---|---|
| `GameTopBar` | Solda geri düğmesi bulunur. Etiketi, gidilen sayfanın bölüm adıdır: Bölümler, Duraklar, Görevler, Oyunlar, Bölgeler. Telefonda yalnızca ← görünür, `aria-label` kalır. Ortada ada arması, "Ada · Bölüm n" üst başlığı ve bölüm adı yer alır. Sağda seviye, "Görev n/m" ve yıldızlar, en sağda yardım, ses ve albüm düğmeleri (`gf-tool`, 46 px) vardır. Barın alt kenarında tek ilerleme çizgisi (`role="progressbar"`) bulunur. Çentik payı uygulanır. `gameExit`, Kelime Bahçesi'nde Escape tuşunun bastığı `data-game-exit` hedefidir. |
| `GameStepRail` | Aynı adım şeridi: tamamlandı ✓ · şimdi (parlayan numara) · sırada · kilitli 🔒. Şimdiki adım `aria-current="step"` taşır. Tıklanabilir sekmeler `onSelect` ile çalışır, kilitli olanlar kapalıdır. Telefonda şerit yana kayar ve şimdiki adımı ortalar; sayfayı kaydırmaz. Kısa etiketler kullanılır (Dinleme → Dinle). |
| `gf-btn` | Üç buton biçimi vardır. Ana eylem (`--primary`) krem-mint renkte ve 50 px yüksekliktedir. İkincil eylem (`--secondary`) ile araç düğmeleri (`--tool`, Dinle / İpucu) üzerinde durduğu yüzeyin rengini alır; koyu sahnede açık, açık kartta koyu görünür. |
| `GameResult` + `GameStars` | Tek sonuç kartı: üstte bölümün boyalı sahnesi, ardından "Bölüm tamamlandı" etiketi, başlık, sırayla beliren yıldızlar ve mesaj. Oyuna özel özet ve `GameFinale` kartın içinde yer alır. Butonlar her zaman aynı sırada: Sonraki → / ↻ Tekrar / Haritaya dön. |

## Ne farklı

Sahneler, karakterler, cevap mekanikleri ve oyunun kendi kartları (Liman'ın konuşan sahnesi, Atölye'nin yazı masası, Akademi'nin beceri kartı, Meydan'ın cümle kurucusu) oyunun kimliğidir ve korunur. Ortak çerçeve yalnızca bunların etrafındaki yerleri sabitler.

## Ada ada geçiş

| Oyun | Üst bar | Adım şeridi | Sonuç kartı |
|---|---|---|---|
| Diyalog Limanı | Bölüm adı, "Adım n/9", ⭐ n/5 | Bölümün 3 görevi; şimdikinde "2/3 görev" yazar | Kaptan Leo kutlaması, istatistikler, ipucu |
| Yazı Atölyesi | Bölüm adı, "Görev n/m", seviye · tur | Keşfet → Deneyerek Yaz → Kendi Başına | Bölümün boyalı sahnesi, istatistikler, saklanmayan serbest not |
| Keşif Akademisi | Durak adı, "Görev n/5" | Beş beceri, lucide ikonlarıyla | Durağın sahnesi, beceri özeti; kayıt bekleyen tur için de aynı kart |
| Cümle Meydanı 1–3 | "← Görevler", görev adı, ⭐ n/18 | Bak → Kur → Canlandır | Görevin boyalı kapağı, kutlama ışıltısı, cümle özeti |
| Hareket Büyüsü, İstek Festivali, Fener Festivali | "← Görevler", süre çipi | Oyunun dört bölümü, notlarla | `sentence-plaza/v5` kapağı, öğrenme özeti; finalde `GameFinale` |
| Hikâyeyi Keşfet | Listede "← Oyunlar", oyunda "← Hikâyeler", "Sahne x/y" | Yok (aşamalar iç adlar; sayaç barda) | Boyalı bitiş sahnesi |
| Sonra Ne Oldu? | "← Hikâyeler"; sayaç sayfaya göre Sahne / Sıra / Soru | İzle ve dinle → Resimleri sırala → Anladığını göster | Son boyalı kare; hikâye cümleleri kartın altında |
| Hikâye Dedektifi | "← Dosyalar", dosya adı, "Adım x/y" | Yok | Çözülen gizemin sahnesi ve karakterler |
| Hayvan Çayırı | "← Bölgeler"; ? yardım (eğitimi tekrar oynatma), 📖 albüm, ses | Beş aşama, tıklanabilir, kilitler korunur | Çayırın bitiş sahnesi ve kelime tekrarı |
| Renk Korusu, Sayı Vadisi | "← Bölgeler"; yardım, ses | Renk görevleri; Sayı Vadisi'nde sayı yolları + bölümler | Koru ve vadi sahneleri |
| Lezzet Pazarı, Aile Köyü, Keşif Tapınağı | "← Bölgeler"; yardım, ses | `GardenQuestNavigator` iki şerit çizer: boyalı küçük resimli sokak / mahalle / oda şeridi ve görev şeridi | Sokağın / köyün / odanın boyalı sahnesi |
| Harf Korusu, Tema Kasabası | "← Bölgeler", derste "← Dersler" / "← Temalar" | Tema Kasabası: Keşfet → Dene → Kullan | Açık renkli sonuç kartı |

Kelime Bahçesi oyunlarında geri düğmesi `data-game-exit` taşır (Escape tuşu ona basar) ve kayıt sırasında kapalıdır. Üst bar tek ilerleme göstergesidir. Keşif aşamalarında bulunanlar ("Keşif 0/6"), soru aşamalarında sıradaki soru ("Soru 1/4") sayılır.

Geniş ekranda (≥1100 px) Akademi'de sahne solda sabit kalır, görev kartı sağda durur. Telefonda düzen tek sütundur.

## Doğrulama ve açık riskler

- **Tarayıcı kontrolü:** Chrome ve Playwright ile, ayrı bir git worktree üzerinde, 1440×900 ve 390×844 boyutlarında yapıldı. Kırık görsel, yatay taşma ve 44 px'ten küçük düğme yok.
  - Açılan oyun ekranları: Liman, Atölye, Akademi, Cümle Meydanı 1. görev, Hikâyeyi Keşfet listesi, Sonra Ne Oldu? ve bahçenin sekiz oyunu.
  - Hareket Büyüsü, İstek Festivali ve Fener Festivali yeni profilde kilitli olduğu için tarayıcıda görülmedi.
  - Sonuç kartı test kopyasındaki geçici bir önizleme sayfasında görüldü (bu sayfa ana depoya girmedi). Oynanarak açılan tek sonuç ekranı Sonra Ne Oldu?'nunki.
  - Gerçek bir turun sonuna kadar oynanmadı.
- **Cihaz ve kullanıcı:** gerçek Android/iOS cihazda ve gerçek çocuk kullanıcıyla deneme yapılmadı.
- **Eski CSS:** değiştirilen başlıklara, butonlara ve sonuç kartlarına ait oyun CSS'i silindi. Birden çok sürüm dosyası (v2…v9) olan oyunlarda gözden kaçan kurallar kalmış olabilir. Ortak görünümü bozan bir kural görülürse silinmeli, üzerine yazılmamalı.
- **Kullanılmayan görsel:** Aile Köyü'nün tahta tabelası (`village-wooden-brand.webp`) artık hiçbir yerde kullanılmıyor; üst bar onun yerini aldı. Dosya silinmedi.
- **Renk uyumu:** Harf Korusu ve Tema Kasabası gündüz renkli sayfalar, ama üst barları bahçenin koyu yeşilinde kalıyor. Bilerek böyle bırakıldı; adanın kimliği bardan okunuyor.
