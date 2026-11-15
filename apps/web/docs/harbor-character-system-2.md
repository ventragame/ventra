# Dialogue Harbor Character System 2.0 — Art direction and QA

## Child-friendly character guidelines

- Warm, obvious smiles and clearly readable dark pupils are required; a white eye area without an iris is a release-blocking visual bug.
- Both eyes carry their own iris and catchlight above the eye white. Brims, hair and caps must not cover the pupils. Avoid frowning, sharp teeth or exaggerated dark mouths.
- Characters use generous face/body proportions, soft outlines, distinct rounded costumes and friendly blush. Mood changes must remain welcoming, even in `try_again`.
- Captain Leo: navy-and-cream captain's uniform and a lifted, unobstructed hat brim. Mimi: turquoise parrot with warm golden beak. Nino: mint turtle with patterned shell. Fox: orange market vendor with apron and chef cap. Luna: ivory rabbit with long ears and blue jacket.
- Standard segmented moods: `idle`, `listen`, `talk`, `happy`, `try_again`, `celebrate`. Idle and talk loop gently; `celebrate` remains brief. Real speech status controls mouth motion, not a fake fixed-duration timer.

## Gameplay, privacy and performance

- All five actual dialogue NPCs have their own authored Lottie geometry and their own matching SVG static illustrations, stored under `public/assets/characters/`.
- One Lottie speaker at a time in the gameplay scene. A switching actor releases the previous player; there are no simultaneously animated characters hidden behind answer cards.
- Keep richly illustrated backgrounds and 2-choice/3-choice English assessments stable. All dialogue text, voice recognition, progress and safe microphone behavior remain untouched.
- Use local files and MIT-licensed `lottie-web`. There are no paid animation subscriptions, hosted API calls, or third-party source images.
- A static SVG fallback is shown while loading, if animation fails, or under `prefers-reduced-motion`.

## Quality checks

- Test every cast member in responsive layouts at 320, 360, 390, 430, and 768 CSS px; verify the character never covers the speech card or tappable answer options.
- Node tests check actual iris stacking, independent limb/mouth animation, frame markers and upper asset size. GitHub Actions checks that every Lottie JSON and SVG serves over HTTP.
- Automated build success does **not** mean the art is visually approved. Perform real Android and iPhone device review for FPS, rendering, expressions and child-facing comprehension before treating the art as final.

## Diyalog Limanı 2.2 — Öğrenme ve oyun standardı

- 15 görev için 45 ayrı, üç aşamalı hikâye vuruşu: sahne etiketi, ilerleme durumu ve seçili liman efektleri.
- Doğru cevabı sesli örnek olarak dinlemek isteğe bağlıdır ve aynı soru için en fazla bir ipucu sayılır; öğrenme ile konuşmanın gerçekten tanınması kesinlikle karıştırılmaz.
- İpucu sıralaması: (1) soruyu tekrar duy; (2) doğru İngilizce ses örneğini duy; (3) örnek metni oku. Anında doğru cevabı göstermek yerine öğrenmeyi yönlendirir.
- Yanlış cevaplar çocuk dostu biçimde işaretlenir; aynı yanlış seçeneğe tekrar basmak gereksiz ek yanlış hakkı saymaz. Ses tanıma hataları ise çocuğun hatası olarak puanlanmaz.
- Tamamlama panelinde **kaydedilmiş** puan ve yıldız gösterilir; kayıt başarısızlığında sahte başarı ekranı açılmaz. Beş eski bölüm ID'si ve dokuz-adımlı checkpoint sistemi korunur.
- Mobilde 320–440 px responsive cevap seçenekleri, 44+ px kontroller, reduced-motion ve uzun A2 replikleri için kaydırılabilir konuşma balonu korunur.
