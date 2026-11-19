# Ventra — Hayvan Çayırı, Renk Korusu ve Sayı Vadisi P1 CSS/etkileşim denetimi

## Sınır ve mimari
Değişiklikler yalnızca sunum, dokunma ve stil katmanındadır. Hayvan kelime kataloğu, görev sıralaması, ödüller, ses motoru, progress/checkpoint, Renk Korusu boyama ve Sayı Vadisi 5 bölüm / sayı bandı değiştirilmedi. Her oyunun var olan SVG, WebP ve farklı mobil sahnesi aynen kullanılır.

## Ortak opt-in kurallar
Üç ada bileşeni `garden-game-foundation.css` üzerinden sadece `gg-game-shell` / `gg-game-control` / `gg-game-scene` sınıflarını alır. En az 44 px dokunma hedefi, touch-action manipulation, klavyede görünen fokus halkası, kaydırma kapsaması, sahne küçülme sınırları ve reduced motion kapsanır. Ortak CSS, oyun renklerini ve veri mantığını belirlemez.

## Sayı Vadisi CSS revizyonu
`number-valley.css` temel görsel/sayı kristali/forge/animasyon stillerini korur. Kullanılmayan eski `main>div.py-6` düzenini zorla geçersiz kılan blok çıkarıldı. `number-valley-v5.css` sonundaki 20 satırlık acil selector override bloğu kaldırıldı. Bu bloktaki hâlen gerekli değerler kendi V5 bileşen kurallarının yanına yerleştirildi: sahne üst başlığı, mobil başlık, forge sayı etiketi, finale görsel konumu. Tailwind yardımcı sınıflarıyla doğrudan çatışan diğer V5 `!important` stilleri, testli görsel karşılaştırması yapılmadan topluca silinmedi.

## QA
- 320, 360, 390, 430 px mobil; tablet, masaüstü; yatay mod
- 44px tıklanabilir alanlar, sabit HUD, yatay taşma olmaması, klavye ile focus-visible
- Hayvan: 5 görev, albüm, doğru/yanlış sesli öğrenme
- Renk: özgün desktop SVG ve mobil sahne, 3 görev, keşif ve renklendirme
- Sayı: 5 bölüm, sayı kristalleri, kelime forge, portal, sesle dinleme
- Mute, reduced motion, offline varlıklar, kısmi ilerleme ve tekrar turu
- TypeScript, regresyon testleri, production web ve Android/iOS derleme CI kontrolü.
CI'nın yeşil olması fiziksel Android/iOS QA sonucunu kanıtlamaz. Production deployment yapılmaz.
