# Hikâye Ormanı — hayvan görselleri v2 (2026-11-26)

**Kapsam:** Hikâye Ormanı'nın üç oyununda (Hikâyeyi Keşfet, Sonra Ne Oldu?, Hikâye Dedektifi) görünebilen her hayvan artık boyalı, şeffaf arka planlı WebP. Düz SVG "blob" hayvanlar kaldırıldı; vektör çizim yalnızca basit nesnelerde (elma, yıldız, balon, çiçekler, yaprak) kaldı.

## Kural
- `StoryForestArt.tsx` içindeki `PREMIUM_STORY_CHARACTERS`, `StoryAnimalId` için **eksiksiz** bir `Record`. Görseli olmayan yeni bir hayvan TypeScript hatasıdır; sessiz düz çizim olmaz.
- Her tür kendi resmidir: tilki kedi resmiyle, geyik köpek resmiyle gösterilmez. Testler: `tests/story_forest_premium_art.test.mjs`.
- Oyunda nerede görünürler: Sonra Ne Oldu? (tilki, koşan tilki, geyik, balık, kelebek, kitap okuyan tavşan, gölet kenarındaki tavşan), Dedektif ipuçları (balık, kelebek). Ayı, uyuyan ayı, köpek, ağaç altındaki ve kaya üstündeki tavşan bugün yalnızca eski `storyForestEngine` satırlarında var; tamlık için onlar da boyandı.

## Kaynak ve lisanslar
Görseller harici bir hizmete gönderilmeden, geliştirici bilgisayarında (RTX 4060) üretildi:
- **Model:** `stabilityai/stable-diffusion-xl-base-1.0`, lisans CreativeML Open RAIL++-M. Çıktıların ticari kullanımı serbest; lisansın kullanım kısıtları (zararlı kullanım yasağı) geçerli.
- **VAE:** `madebyollin/sdxl-vae-fp16-fix` (MIT).
- **Stil / kimlik:** `h94/IP-Adapter` (Apache-2.0), ViT-H görüntü kodlayıcı. Stil referansı Ventra'nın kendi karakterleridir (kirpi, tavşan, sincap, turuncu kedi); kitap okuyan, ağaç altındaki ve kaya üstündeki tavşan mevcut `rabbit_adventurer` tavşanından kimlik referansıyla türetildi.
- **Arka plan:** BiRefNet general-lite (MIT), `rembg` üzerinden; kenarlarda beyaz zemin rengi geri hesaplanarak silindi (koyu sahnelerde hale yok). Gölet tavşanında su, beyaz-anahtar maskesiyle korundu.
- Ticari kullanıma kapalı modeller (ör. BRIA RMBG) kullanılmadı. Belirli bir stüdyo veya karakter adı istemde yok.
- Ayarlar: DPM++ 2M Karras, 30 adım, CFG 6.5, 1024×1024; uzun kenar 768 px WebP (q86), her biri ≤ 155 KB.

## Seçilen görseller (tohum ve istem)
Ortak negatif istem: `photo, realistic, lowres, blurry, deformed, bad anatomy, extra legs, missing legs, fused legs, extra ears, extra eyes, text, watermark, frame, multiple animals, cropped, …`

| Dosya | Tohum | Adaptör | İstem |
|---|---|---|---|
| `deer_antlers.webp` | 303 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.65`, ref `style_sheet.png` | deer with large branching antlers on its head, young buck, tan fur, cream belly, white spots on back, slender legs, standing, three-quarter view, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `fox_orange.webp` | 303 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `style_sheet.png` | red fox, bright orange fur, white chest, white tail tip, dark paws, pointed ears, big fluffy tail, sitting, three-quarter view, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `fox_running.webp` | 18 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `fox_orange.png` | red fox running fast, side view, galloping, front and back legs stretched apart, tail flowing behind, bright orange fur, white chest, white tail tip, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `fish_orange.webp` | 202 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.5`, ref `style_sheet.png` | little orange fish, white belly, smooth glossy scales, flowing translucent fins and tail, swimming, side view, 3d animated film character, cute, big glossy eyes, eyebrows, happy smile, soft studio light, full body, plain white background |
| `butterfly_colourful.webp` | 505 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.5`, ref `style_sheet.png` | butterfly with a smiling face, four large colourful wings in pink, purple and sky blue, curly antennae, fuzzy body, front view, wings open, 3d animated film character, cute, big glossy eyes, eyebrows, happy smile, soft studio light, full body, plain white background |
| `bear_cub.webp` | 404 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `style_sheet.png` | brown bear cub, round ears, light tan muzzle and belly, chubby, sitting, waving one paw, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `bear_sleeping.webp` | 28 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `bear_cub.png` | brown bear cub lying down fast asleep, eyes closed, curled up on its side, head resting on its paws, round ears, light tan muzzle, 3d animated film character, cute, eyes closed, peaceful smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `dog_puppy.webp` | 303 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `style_sheet.png` | puppy dog, floppy ears, golden tan fur, white chest, tongue out, wagging tail, sitting, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `rabbit_reading.webp` | 7 | IP-Adapter Plus SDXL ViT-H, scale `0.55`, ref `rabbit_adventurer.png` | white bunny with long ears, red neckerchief, brown leather satchel, sitting, reading an open storybook held in its paws, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `rabbit_pond.webp` | 8 | IP-Adapter SDXL ViT-H (style blocks), scale `style:0.8`, ref `rabbit_adventurer.png` | white bunny with red neckerchief and brown satchel sitting at the edge of a small round blue water pond with green lily pads, pond in front, tiny diorama, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `rabbit_tree.webp` | 7 | IP-Adapter Plus SDXL ViT-H, scale `0.55`, ref `rabbit_adventurer.png` | white bunny with red neckerchief and brown satchel sitting under a small leafy green tree, tiny diorama, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
| `rabbit_rock.webp` | 27 | IP-Adapter Plus SDXL ViT-H, scale `0.55`, ref `rabbit_adventurer.png` | white bunny with red neckerchief and brown satchel standing on top of a big grey rock, tiny diorama, 3d animated film character, cute, big glossy brown eyes, eyebrows, happy open smile, rosy cheeks, fluffy fur, soft studio light, full body, plain white background |
Her tür için 4–6 aday üretildi; seçim ölçütleri: tam boy, doğru tür özelliği (geyikte belirgin boynuz, kelebekte dört kanat ve anten, balıkta yüzgeçler, uyuyan ayıda kapalı gözler, koşan tilkide koşu hareketi), anatomi hatası olmaması ve mevcut setle aynı sıcak 3B görünüm. Elenenler: kırpılmış kareler, halkalı (rakun gibi) kuyruklar, iki kuyruk, gölet yerine çiçek/çerçeve, kimliği kopyalayıp hareketi kaçıran adaylar.

## Açık riskler
- Görseller yapay zekâ ile üretildi; bir illüstratörün son rötuşu yapılmadı. Kullanıcı/öğretmen kabulü gerekir.
- Koşan tilki çizgi film tarzında iki ayak üstünde koşuyor; gölet tavşanında boyun bağı fiyonk (macera tavşanındaki atkı değil) ve çanta yok.
- Gerçek Android/iOS cihazda görsel kabul yapılmadı; kontroller tarayıcı emülasyonudur.
