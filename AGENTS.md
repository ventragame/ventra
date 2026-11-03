# Ventra repository agent instructions

## Mandatory context — read first
- [docs/VENTRA_PRODUCT_CHARTER.md](docs/VENTRA_PRODUCT_CHARTER.md) defines the product's canonical scope and explicit exclusions.
- [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) tracks work priority and acceptance gates.
- [docs/VENTRA_ENGLISH_LEARNING_JOURNEY_V2.md](docs/VENTRA_ENGLISH_LEARNING_JOURNEY_V2.md) is the **canonical six-island learning path, level policy and future island GDD backlog**.
- [docs/ventra-language-v1/01-PRODUCT-VISION-AND-PRD.md](docs/ventra-language-v1/01-PRODUCT-VISION-AND-PRD.md) and [docs/ventra-language-v1/03-GAME-DESIGN-DOCUMENT.md](docs/ventra-language-v1/03-GAME-DESIGN-DOCUMENT.md) are historical language-learning pedagogy/design references, not current implementation status.

## Product constraints: do not deviate
- Ventra is a **gamified LANGUAGE LEARNING product**, currently children's English. NOT a generic educational game, STEM, math, engineering or economics platform.
- Any new world/mission must explicitly teach identifiable **English vocabulary, listening, reading, recognition, understanding, directives or simple phrases** for its target grade and Pre-A1/A1/A2 level.
- A child must not be able to master the central mission without using the target language skill. Merely renaming a math game with English words does not qualify.
- Food Market (**Lezzet Pazarı**) teaches **food/drink English words, pronunciation, recognition and simple shopping phrases**. No required calculations, making change, market profit, economic strategy or budget puzzles.
- Animal Meadow = animals, Color Grove = colors, Number Valley = English numbers (not arithmetic), Family Village = family/home/daily language, Discovery Temple = integrated English review.
- Do not propose standalone math, STEM, finance or engineering worlds without explicit new product-owner approval and a dated ADR changing the charter.
- Stars/coins are language-learning motivation only; parent-only paid currency requires verified store payment and authoritative server ledger. Teacher/class administration supports this same language curriculum, not a separate subject platform.
- Preserve existing offline profiles, learner evidence, grade policy, P3 repetition, RLS/parent permissions, and payment-disabled safeguards.

## Before implementing a new game
1. Record the exact English vocabulary/phrases and listening/recognition/application skills, grade/CEFR starting scope.
2. Specify interaction mechanics that genuinely require the language, and evidence captured separately for hint/voice/text.
3. Check replay variation, parental safety, touch accessibility, offline records and backward compatibility.
4. Do not assert release readiness merely from tests/CI; require device and child-user acceptance.
5. If requirements conflict with the charter, stop and obtain the product owner's explicit strategic decision; update the dated decision record before changing scope.

This instruction file does not itself establish a new delivery/deployment authorization.

- **G3 English Temple** is playable: five chambers and 25 English transfer/review missions; it remixes earlier animal, color, number, food and family English concepts. Do not replace the English learning outcomes with generic puzzles, money/math mechanics or unrelated domains. See [G3 GDD](docs/G3_TEMPLE_PREMIUM_GDD_AND_ACCEPTANCE.md).

## Learning Journey v2: preserve forever
- Six large islands: Kelime Bahçesi → Cümle Meydanı → Hikâye Ormanı → Diyalog Limanı → Yazı Atölyesi → Keşif Akademisi. **Only the first is published**.
- Legacy IDs are permanent: `word_garden, story_castle, listening_forest, speaking_harbor, sentence_workshop, language_academy`. The visible name/art/route may change; do not migrate or silently rename progress keys.
- Every Word Garden mission must use BOTH profile grade and English placement; follow `gradeAwareLearningPolicy.ts` and `learningJourney.ts`. Do not equate grade to CEFR. New vocabulary needs an explicit tier, evidence/correct speech, first-discovery gating, age-appropriate content and tests.
- Upcoming five big islands require new actual mechanics and offline learner evidence; NEVER claim they are playable merely because labels have been renamed.

## CM1 / Uyanan Meydan playable (2026-11-02)
- `story_castle` now has **only its first production region**, Uyanan Meydan, containing 6 sequential saved English sentence missions. The other four planned Cümle Meydanı regions are still **locked**; do not report the entire island as finished.
- Canonical curriculum, art and acceptance: [docs/CM1_UYANAN_MEYDAN_GDD_ACCEPTANCE.md](docs/CM1_UYANAN_MEYDAN_GDD_ACCEPTANCE.md).
- Game ID `island_sentence_square_plaza` is permanent, 6 levels, session-idempotent, offline first. Sentence answer evidence distinguishes independent construction from listening and hint assistance; no auto CEFR upgrade.
- Always open published world through `/kids` and its existing profile, never create synthetic child profile. No release claim before real device and language-teacher testing.

### Hareket Büyüsü CM1 mission 4 (2026-11-03)
- Canonical [GDD and acceptance](docs/CM1_HAREKET_BUYUSU_V2.md). Specialized gameplay components are in `apps/web/src/components/learning/sentence/MovementMagic*`; curriculum in `apps/web/src/lib/learning/movementMagicEngine.ts`.
- Preserve old game ID `island_sentence_square_plaza` and level 4. Save the full 12/16/20-question `PlazaDeck` using existing `saveSentencePlazaMission` and never claim official CEFR placement.
- Music state `movement` inherits child opt-in; don't override global mute. Four future sentence regions remain locked. Do not deploy without approval.

### İstekler Meydanı CM1 mission 5 (2026-11-03)
- [Teaching/design/QA acceptance](docs/CM1_ISTEKLER_MEYDANI_PREMIUM_GDD.md). New curriculum `apps/web/src/lib/learning/wishFestivalEngine.ts`, original interactive stage and gameplay in `apps/web/src/components/learning/sentence/WishFestival*`.
- Mission 5 persists using **existing** game ID `island_sentence_square_plaza` and level 5. Do not create new rewards on partial sessions, invent user levels, or publish locked future islands. Respect adult opt-in to music and existing central voice controls. No production deploy.

### Fener Festivali — canonical Uyanan Meydan mission 6 (2026-11-03)
- Curriculum: `apps/web/src/lib/learning/lanternFestivalEngine.ts`. Scene and gameplay: `apps/web/src/components/learning/sentence/LanternFestival*`. [GDD & tests](docs/CM1_FENER_FESTIVALI_PREMIUM_GDD.md).
- Must preserve `island_sentence_square_plaza` level 6, answer evidence, user-approved sound opt-in, sequential unlocking and locked future regions. No simulated progress, no production deployment and no DB migrations without explicit approval.

### Mobile-first Hayvan Çayırı acceptance (2026-11-03)
- Implementation: `apps/web/src/components/learning/activities/AnimalMeadowAdventure.tsx` + `MobileMeadowWorld.tsx` + `animal-meadow.css`; teaching contract [docs/HAYVAN_CAYIRI_MOBILE_FIRST_ACCEPTANCE.md](docs/HAYVAN_CAYIRI_MOBILE_FIRST_ACCEPTANCE.md).
- At <=767px, lightweight accessible HTML animal/habitat selection uses the *same* callback as desktop Phaser; do not create a separate progress/reward system. Preserve existing 40 SVG animals, optimized `word_garden_mobile.webp`, audio/TTS fallback, Pre-A1/A1/A2 placement independent of grade.
- Real Android APK / iOS WebView acceptance is a separate gate; no production deploy or live DB migrations without user approval.
