# Aile Köyü V6 — Premium Character Cameos

> **Arşiv / V7 ile güncellendi:** Bu dosya sekiz temel karakterin ilk teslimini açıklar. Artık yedi ileri seviye kavramın da kendine ait görseli vardır; güncel kabul ve dosya haritası için `FAMILY_VILLAGE_V7_ADVANCED_CHARACTERS.md` belgesine bakın.


## Shipped files
Eight generated illustrations are integrated as separate, **actual alpha WebP binaries** at `apps/web/public/assets/family-village/characters-v6/`:

| Concept | File | Source |
|---|---|---|
| mother | mother.webp | generated portrait |
| father | father.webp | generated portrait |
| sister | sister.webp | generated portrait |
| brother | brother.webp | generated portrait |
| baby | baby.webp | generated portrait |
| grandmother | grandmother.webp | generated portrait |
| grandfather | grandfather.webp | generated portrait |
| family | family.webp | generated family group |

Each file is 512 × 512, compressed with transparent areas preserved. Total ≈ 378 KB (8 images). No third-party URL, license dependency or network image host.

## Implementation
- `FamilyVillageWordArt.tsx` selects the relevant bundled character WebP for the family district and keeps existing SVG art for rooms, objects and daily routines.
- `FamilyVillageAdventure.tsx` uses the same `FamilyWordArt` component in discovery, illustrated choices, and the featured question image. All family concepts use the consistent cameo framing, instead of one grandmother portrait in a different style.
- `family-village-characters-v6.css` ensures 512px source images scale down to accessible touch-friendly cards and featured tiles on 320px–desktop screens.
- Original stage navigation, plan generation, grade policy, speech service, progress events, stars and idempotent rewards are unchanged.

## Relation concepts and pedagogical limitation
The eight character illustrations are **eight unique authored art assets**, not fifteen unique people. Advanced kinship terms (aunt, uncle, cousin, parents, daughter, son, grandchild) reuse a suitable existing family cameo as a generic illustration to avoid mixing 2D and 3D character styles. For these abstract relationships, the Turkish kinship label remains visible in family visual choices and the recognition question, so they aren't scored on the basis of an inherently ambiguous portrait. These reused portraits should be replaced with seven unique, intentionally designed character illustrations for a truly complete advanced roster. Do not claim fifteen independent portraits exist.

## Acceptance
- [ ] Main GitHub CI passes TypeScript, family tests and production web build
- [ ] New binary asset tests verify all eight actual WebP files
- [ ] Check discovery first six/eight family cards: all use the same 3D cameo family
- [ ] Check stage 2 featured image, stages 3/4 visual-choice images and stage 5
- [ ] Check 320/360/390px and desktop; no clipping, pixelation, excessive vertical scroll or misaligned labels
- [ ] Verify children can still tap an already discovered card to replay English audio
- [ ] Verify saved rewards and profiles unaffected

No production deployment was performed in this change.
