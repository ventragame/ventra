# Hayvan Çayırı — boyalı hayvan görselleri v4 (2026-11-27)

**Kapsam:** Hayvan Çayırı'nın 40 hayvanı (`ANIMAL_MEADOW_WORDS`) artık Hikâye Ormanı ile aynı sıcak 3B tarzda, şeffaf arka planlı, tam boy WebP. Eski Microsoft Fluent Emoji PNG seti (256 px; bazı hayvanlar yalnız kafa, bazıları tam boy) kaldırıldı.

## Nerede görünür
- Hayvan Çayırı'nın beş görevi (keşif, resim–kelime, dinleme, komut, kurtarma), albüm ve siluetler: `MeadowPlayStage.tsx`, `AnimalMeadowAdventure.tsx` — görsel yolu `animalMissionEngine.ts` içindeki `image` alanından gelir.
- İlk oyun rehberi (köpek, kedi, tavşan): `firstPlayTutorial.ts`.
- Diyalog Limanı nesneleri (balık, papağan, kaplumbağa): `HarborSceneStage.tsx`.
- Dosyalar: `apps/web/public/assets/animals/painted/<id>.webp`, uzun kenar 512 px, toplam ≈ 1,45 MB (eski set 1,5 MB).

## Kural
- Her kelime kendi türünün resmidir; aynı resim iki kelimede kullanılmaz. Ders kurgusu, ses, kanıt ve ilerleme kayıtları değişmedi; yalnız görsel yolu değişti.
- Hikâye Ormanı'nda zaten boyalı olan 11 hayvan (kedi, köpek, kuş, tavşan, balık, kelebek, tilki, ayı, geyik, kirpi, sincap) aynı karakterin 512 px kopyasıdır; iki oyunda aynı hayvan aynı görünür.
- Testler: `tests/animal_visual_assets.test.mjs` (40 benzersiz, şeffaf, 512 px WebP; Fluent klasörü yok; bu belge her hayvanı listeler).

## Kaynak ve lisanslar
Görseller harici bir hizmete gönderilmeden, geliştirici bilgisayarında (RTX 4060) üretildi:
- **Model:** `stabilityai/stable-diffusion-xl-base-1.0`, lisans CreativeML Open RAIL++-M (çıktıların ticari kullanımı serbest; zararlı kullanım yasağı geçerli).
- **VAE:** `madebyollin/sdxl-vae-fp16-fix` (MIT).
- **Stil:** `h94/IP-Adapter` (Apache-2.0), yalnız stil blokları. Referanslar Ventra'nın kendi karakterleridir: `style_sheet.png` (kirpi, tavşan, sincap, turuncu kedi) ve renk kaymasını önlemek için `style_cool.png` (gri kedi, mavi kuş, beyaz kedi, tavşan). Turuncu referans yeşil/gri hayvanları turuncuya çekti (kurbağa, inek); soğuk referans sıcak renkli hayvanları beyazlattı (aslan, zürafa). Her hayvan rengine uygun referansla üretildi.
- **Arka plan:** BiRefNet general-lite (MIT), `rembg` üzerinden; kenarlardaki beyaz zemin rengi geri hesaplanarak silindi.
- Ticari kullanıma kapalı modeller (ör. BRIA RMBG) kullanılmadı; istemlerde stüdyo veya karakter adı yok.
- Ayarlar: DPM++ 2M Karras, 30 adım, CFG 6.5, 1024×1024 → uzun kenar 512 px WebP (q86, alfa q92).

## Seçilen görseller
Ortak negatif istem: `photo, realistic, lowres, blurry, deformed, bad anatomy, extra legs, missing legs, fused legs, extra ears, extra eyes, text, watermark, frame, multiple animals, cropped, grass, scenery, shadow, human, scary, clothes` (+ türe özel eklemeler).

| Hayvan | Kaynak | Tohum | Referans / ölçek | İstem (konu kısmı) |
|---|---|---|---|---|
| cat | Hikâye Ormanı `cat_orange.webp` | — | — | aynı karakter; 512 px kopya |
| dog | Hikâye Ormanı `dog_puppy.webp` | — | — | aynı karakter; 512 px kopya |
| bird | Hikâye Ormanı `blue_bird_flying.webp` | — | — | aynı karakter; 512 px kopya |
| rabbit | Hikâye Ormanı `rabbit_adventurer.webp` | — | — | aynı karakter; 512 px kopya |
| cow | yeni (`cow_m`) | 202 | `style_sheet.png`, `style:0.8` | dairy cow, white with black patches, pink muzzle, small horns, pink udder, standing on four legs, three-quarter view |
| fish | Hikâye Ormanı `fish_orange.webp` | — | — | aynı karakter; 512 px kopya |
| horse | yeni (`horse_m`) | 303 | `style_sheet.png`, `style:0.8` | young horse, chestnut brown coat, dark flowing mane and tail, hooves, standing on four legs, side view |
| duck | yeni (`duck_m`) | 303 | `style_sheet.png`, `style:0.8` | yellow duckling with orange flat beak and orange webbed feet, standing, three-quarter view |
| sheep | yeni (`sheep_m`) | 303 | `style_sheet.png`, `style:0.8` | fluffy white woolly sheep, cream face, small ears, dark hooves, standing on four legs, three-quarter view |
| frog | yeni (`frog_c`) | 303 | `style_cool.png`, `style:0.65` | bright green frog with big round eyes on top of its head, pale yellow belly, sitting, front view |
| bee | yeni (`bee_c`) | 202 | `style_cool.png`, `style:0.65` | honey bee with yellow and black striped round body, small clear wings, two antennae, flying, front view |
| butterfly | Hikâye Ormanı `butterfly_colourful.webp` | — | — | aynı karakter; 512 px kopya |
| lion | yeni (`lion_r`) | 303 | `style_sheet.png`, `style:0.65` | lion with a big fluffy brown mane, golden yellow fur, tail with a dark tuft, sitting, three-quarter view |
| elephant | yeni (`elephant_c`) | 101 | `style_cool.png`, `style:0.65` | baby elephant, grey skin, big floppy ears, long trunk raised, small white tusks, standing, three-quarter view |
| monkey | yeni (`monkey_c`) | 404 | `style_cool.png`, `style:0.65` | brown monkey with a peach face, round ears, long curly tail, sitting, waving one hand |
| penguin | yeni (`penguin_c`) | 303 | `style_cool.png`, `style:0.65` | penguin, black back, white belly, orange beak and orange feet, small flippers, standing, front view |
| turtle | yeni (`turtle_c`) | 101 | `style_cool.png`, `style:0.65` | turtle with a green patterned shell, green head and legs, walking, three-quarter view |
| fox | Hikâye Ormanı `fox_orange.webp` | — | — | aynı karakter; 512 px kopya |
| bear | Hikâye Ormanı `bear_cub.webp` | — | — | aynı karakter; 512 px kopya |
| owl | yeni (`owl_c`) | 404 | `style_cool.png`, `style:0.65` | brown owl with big round orange eyes, feather tufts on head, cream chest, small beak, perched, front view |
| zebra | yeni (`zebra_c`) | 202 | `style_cool.png`, `style:0.65` | zebra with bold black and white stripes, black mane, standing on four legs, side view |
| giraffe | yeni (`giraffe_r`) | 202 | `style_sheet.png`, `style:0.65` | one young giraffe, very long neck, golden yellow coat with brown patches, small horns, standing, side view |
| panda | yeni (`panda_c`) | 303 | `style_cool.png`, `style:0.65` | giant panda, white fur with black ears, black eye patches, black arms and legs, sitting, holding green bamboo |
| tiger | yeni (`tiger_c`) | 303 | `style_cool.png`, `style:0.65` | tiger cub, orange fur with black stripes, white muzzle and chest, standing on four legs, three-quarter view |
| crocodile | yeni (`crocodile_r`) | 606 | `style_cool.png`, `style:0.65` | green crocodile lying low on four short legs, long snout with small white teeth, bumpy back, long tail, side view |
| hippo | yeni (`hippo_c`) | 101 | `style_cool.png`, `style:0.65` | hippopotamus, round purple grey body, big wide mouth, small ears, short legs, standing, three-quarter view |
| rhino | yeni (`rhino_c`) | 101 | `style_cool.png`, `style:0.65` | rhinoceros, grey skin, one big horn on its nose, sturdy body, standing on four legs, three-quarter view |
| kangaroo | yeni (`kangaroo_r`) | 606 | `style_sheet.png`, `style:0.65` | kangaroo, light brown fur, very long hind feet, thick long tail, standing upright, small baby joey peeking from belly pouch |
| koala | yeni (`koala_c`) | 303 | `style_cool.png`, `style:0.65` | grey koala, big round fluffy ears, large black nose, hugging a green eucalyptus branch |
| deer | Hikâye Ormanı `deer_antlers.webp` | — | — | aynı karakter; 512 px kopya |
| wolf | yeni (`wolf_r`) | 202 | `style_cool.png`, `style:0.65` | grey wolf, long snout, black nose, pointed ears, white chest, plain bushy grey tail, sitting, three-quarter view |
| hedgehog | Hikâye Ormanı `hedgehog_happy.webp` | — | — | aynı karakter; 512 px kopya |
| squirrel | Hikâye Ormanı `squirrel_acorn.webp` | — | — | aynı karakter; 512 px kopya |
| snake | yeni (`snake_c`) | 404 | `style_cool.png`, `style:0.65` | green snake with yellow belly, coiled body, small tongue out, front view |
| dolphin | yeni (`dolphin_c`) | 303 | `style_cool.png`, `style:0.65` | blue grey dolphin, curved dorsal fin, light belly, jumping, side view |
| whale | yeni (`whale_c`) | 101 | `style_cool.png`, `style:0.65` | blue whale with light striped belly, small water spout on its head, swimming, side view |
| shark | yeni (`shark_c`) | 303 | `style_cool.png`, `style:0.65` | friendly grey shark, white belly, tall dorsal fin, closed smiling mouth, swimming, side view |
| octopus | yeni (`octopus_c`) | 404 | `style_cool.png`, `style:0.65` | pink octopus with eight curly tentacles, round head, front view |
| crab | yeni (`crab_r`) | 202 | `style_sheet.png`, `style:0.65` | bright red crab with a round red shell, two big red claws raised, six small legs, eyes on stalks, front view |
| parrot | yeni (`parrot_c`) | 202 | `style_cool.png`, `style:0.65` | parrot with bright red, yellow and blue feathers, curved beak, long tail, perched, three-quarter view |

Her tür için 4–6 aday üretildi (toplam ~150) ve tek tek seçildi. Ölçütler: tam boy ve kırpılmamış, türün ayırt edici özelliği (zebrada çizgi, zürafada uzun boyun ve lekeler, gergedanda burundaki boynuz, balinada fıskiye, timsahta yere yakın uzun ağız), doğru renk, tek hayvan. Elenenler: kırpılmış kareler, iki hayvan, mavi lekeli zürafa, dik duran dinozor benzeri timsahlar, kedi yüzlü ya da halkalı kuyruklu kurtlar, beyaz gövdeli aslanlar ve yengeç.

## Açık riskler
- Yapay zekâ üretimi; illüstratör rötuşu yok. Çocuk ve öğretmen kabulü gerekir.
- Kanguruda kese yavrusu yok; kulakları iri. Ahtapotun başı beyazımsı (kollar pembe). Baykuş istenen kahverengiden açık. Kurt husky yavrusuna benzer. Köpek balığı gülümserken küçük dişleri görünür.
- Tavşan, Hikâye Ormanı'nın atkılı/çantalı kahraman tavşanıdır.
- Masaüstü Phaser `ExplorerScene` içindeki kullanılmayan `meadow` dalı eski `animals/premium/*.svg` dosyalarını yüklemeye devam eder (bugün yalnız `garden` alanı açılıyor).
- Gerçek Android/iOS cihazda bakılmadı.
