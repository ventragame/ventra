# Word Garden premium illustration pack v2

The 7 original visual concepts are processed into 14 **real WebP image files**.
No runtime image-generation API or external CDN is used.

| World | Desktop | Mobile |
| --- | --- | --- |
| Cover | cover.webp | cover_mobile.webp |
| Animal Meadow | animals.webp | animals_mobile.webp |
| Color Grove | colors.webp | colors_mobile.webp |
| Number Valley | numbers.webp | numbers_mobile.webp |
| Food Market | food.webp | food_mobile.webp |
| Family Village | family.webp | family_mobile.webp |
| Exploration Temple | sanctuary.webp | sanctuary_mobile.webp |

Source artwork: original images generated for Ventra on 2026-11-04.
Desktop world images are 1040×488, mobile images 520×244, and covers
1440×810 and 760×428. All assets are committed in
`apps/web/public/assets/word-garden/premium-v2/`.

The six world cards use the responsive `DistrictPreviewArt` picture element.
The compact top journey banner uses the new master illustration with a
high-contrast gradient. Navigation, map scene positions, stars, unlock logic,
adaptive question selection and persistence are unchanged.

**Validation:** desktop 1280/1440 width, tablet 768, Android/iOS 390/375,
compact 320, browser WebP loading, card cropping, hover/focus and reduced
motion. Test both unlocked and locked cards and real game entry. The Phaser
exploration map remains an interactive scene; the new banner illustrations
must not be mistaken for clickable map hot spots.

For future artwork edits, keep each world's subject unmistakable, avoid text
baked into images, and export responsive variants with sensible file-size
limits. Do not add proprietary external assets without checking usage rights.
