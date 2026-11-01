# Ventra repository agent instructions

## Mandatory context — read first
- [docs/VENTRA_PRODUCT_CHARTER.md](docs/VENTRA_PRODUCT_CHARTER.md) defines the product's canonical scope and explicit exclusions.
- [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) tracks work priority and acceptance gates.
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
