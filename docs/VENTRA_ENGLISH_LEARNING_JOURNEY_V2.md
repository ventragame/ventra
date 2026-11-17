# VENTRA — English Learning Journey v2 (canonical, 2026-11-02)

**Status (updated 2026-11-02):** Word Garden and the FIRST region of Cümle Meydanı (Uyanan Meydan) are playable. Other four sentence regions and four other big islands remain unpublished. No formal MEB/CEFR certification claim.

## Non-negotiable product direction
- Ages approximately 7–12; grades 1–8 and English starting placements **Pre-A1, A1, A2** are **different variables**.
- Grade influences amount, UX scaffolding and age-appropriate presentation; placement controls **English linguistic complexity**. A 7th-grader at Pre-A1 gets beginner English in age-respectful packaging.
- Child progress is per profile and per English skill; discovery, listening with text fallback, and hint-assisted attempts must never inflate independent mastery. A wrong word should return for spaced practice.
- Six large-island IDs and all Word Garden internal game IDs are persistent; never rename them. Legacy art filename is not curriculum.
- The curriculum examples below are **Ventra's instructional intent**, not a claim of formal MEB/CEFR equivalence. Real teachers, native-speaker linguistic review, device QA and 7–12-year-old user testing must still validate it.

## Six large islands (the product's learning path)

| Journey order | Stable ID | Visible name | Real outcome, beyond merely selecting answers | Status |
| --- | --- | --- | --- | --- |
| 1 | `word_garden` | **Kelime Bahçesi** | Recognize, hear and apply English vocabulary across 6 existing worlds | Playable |
| 2 | `story_castle` | **Cümle Meydanı** | Build meaningful English sentences with known words and increasing independence | **Uyanan Meydan (1/5) playable** |
| 3 | `listening_forest` | **Hikâye Ormanı** | Follow and sequence English stories, explain events, infer meanings in context | Planned |
| 4 | `speaking_harbor` | **Diyalog Limanı** | Use English in character dialogues and context-appropriate turns | Planned |
| 5 | `sentence_workshop` | **Yazı Atölyesi** | Write/spell English from guided phrases to short original texts | Planned |
| 6 | `language_academy` | **Keşif Akademisi** | Practice vocabulary, comprehension, dialogue and writing in integrated adventures | **Six-zone L6 implementation; device/pedagogy acceptance pending** |

**Important:** `story_castle` and `sentence_workshop` have intentionally retained their legacy **IDs** despite the new curricular order and location. No SQL/profile migration. The existing WebP island art is reused; the new story/sentence/writing art and a wider art coherence review remain separate art sprints. Locked islands must not be presented as playable or as earned achievements.

### Language progression by placement

| Island | Pre-A1 | A1 | A2 |
| --- | --- | --- | --- |
| Kelime Bahçesi | image + spoken word + direct instruction | short phrase and context with word | subtle choices and transfer of known words |
| Cümle Meydanı | "This is a cat." / "It is red." | "There is a cat under the table." | "I went home because…" |
| Hikâye Ormanı | sequence 2–3 illustrated events | follow a short dialogue and find cause | infer motive/alternative endings |
| Diyalog Limanı | greeting, yes/no, introductions | shopping and directions, multi-turn response | polite requests, preferences and reasons |
| Yazı Atölyesi | supported spelling and one short phrase | guided short message | short paragraph with sequence/cohesion |
| Keşif Akademisi | independent image/listen/select | sentence/dialogue applied in story | multi-step transfer without memorized scripts |

**Age/grade axis, independent of placement**
- Grades 1–2: fewer answers, short tasks, narrated and illustrated scaffolds.
- Grades 3–4: guided choices, middle-length tasks and sentence support.
- Grades 5–8: age-respectful presentation; longer tasks when language placement allows. Do **not** assume an older beginner knows A2 English.
- Missing grade: preserve existing profile/default task sizing, never fabricate or silently infer grade.

## Word Garden v2 status and QA

### Already implemented in code
- Each of six games gets grade + English placement from `/kids` active profile via `LearningPathModal`.
- `resolveVocabularyTier`: common **lower of grade and placement** tier; color, animal, food, family, temple catalogs use it. Animal catalog has **explicit tier metadata for all 40 animals**; advanced/unseen items no longer appear without placement eligibility.
- Color catalog 30 shades in 3 tiers; animals 40 in 3 tiers; food 45; family 60; number words in grade-capped 1–1000 bands; temple remixes eligible items. All count examples describe available catalogs, not the number automatically introduced in one session.
- Number game uses English numeral spelling and language sentences, not mathematics; progressed number bands are separately gated.
- P3 previously introduced vocabulary, weak word review and independent/assisted evidence continue to determine mission selection and repetition. Legacy progress, stars, economy, player IDs, Supabase schema unchanged.
- Garden map shows **both** grade and placement and a language objective; this is a personalized learning target, not proof of a measured level.

### Honest unresolved issues; do not mark as done without evidence
1. **Curriculum mastery:** Current unit structure is grade-aware heuristics, not a complete 1–8 grade mapping to officially published MEB outcomes. Teachers should validate per-grade phrases and grammar. English placement check uses 8 vocabulary items and does not measure CEFR.
2. **True age-appropriate difficulty:** Pre-A1 for an 8th-grader needs different story, illustration and challenge style than Pre-A1 for a 1st-grader; current games largely share presentation and only adjust counts/content.
3. **Language production:** Word Garden still has recognition/tap interactions. Independent speaking/writing cannot be claimed from selection tasks. Future Sentence Square must add assessment of genuine production.
4. **Reliability:** Physical Android/iPhone audio, touch, offline sync conflicts, parent/teacher boundaries and device-to-device restoration require hands-on acceptance. CI alone is insufficient.
5. **Audio/art:** Much content remains platform TTS and existing illustrations. Studio-recorded native English and reviewed SFX mastering are open.
6. **Learning measurement:** Need longitudinal retention checks, real children and linguistic/pedagogical evaluation; a completion star is not evidence of mastery.
7. **Cross-world launch:** Only `word_garden` and the first region of `story_castle` have playable content. Locked islands do not become playable merely when Word Garden is completed; each needs a separate actual game, save flow, validation and launch gate.

## Phased development after Word Garden baseline

### L0 — World identities and learning contract [technical implementation]
- [x] New six-island learning order, names, descriptions, world map navigation, stable storage IDs.
- [x] Code manifest `apps/web/src/lib/learning/learningJourney.ts` and this canonical roadmap reference.
- [x] Legacy-art preservation and correct "coming soon" notices for 5 unpublished worlds.

### L1 — Word Garden level integration [technical implementation]
- [x] Shared tier policy, explicit 40 animal classifications, catalog policy across five lexical worlds.
- [x] Grade and placement visibly displayed on the Garden map.
- [x] Grade/level cross-product regression tests for visibility, eligible words, no A2 leakage, six island ordering.
- [ ] Independent full browser session and physical devices on all grade/level combinations.
- [ ] Pedagogically validated age-specific **directions** and grade-by-grade official outcome crosswalk.
- [ ] Expand language-use tasks and validate adaptive recall without false mastery.
- [ ] Teacher review of every word/phrase, English pronunciation, pictures and sentence grammar.

### L2 — Cümle Meydanı [Uyanan Meydan playable; 4 other regions still planned]
- GDD: language objectives, Pre-A1/A1/A2 sentence templates, grade cognitive scaffolds, verbs/nouns, safe distractors, meaningful context.
- Gameplay: physically assemble sentence parts on a scene, respond to an event, drag objects based on English instructions, correct sentence semantics rather than merely order.
- Reuse learned Word Garden vocabulary; preserve novel sentence evidence per learner/domain. Offline, P3, stars, replay, classroom progress.
- Gate: correct sentence meaning and use; user cannot win without processing English.

### L3 — Hikâye Ormanı [planned]
- Branching short stories with character/scene reactions; listen/read, arrange events, context inference; no copy-pasted listening multiple-choice quiz.

### L4 — Diyalog Limanı [planned]
- Human-like turn taking with character goals. Begin privacy-safe branch choices; do NOT collect or upload children's microphone recordings by default.

### L5 — Yazı Atölyesi [planned]
- Age-/placement-responsive constrained phrase construction then guided independent writing; review for meaningful spelling and communication, not keyboard dexterity.

### L6 — Keşif Akademisi [playable code, physical QA and pedagogy acceptance pending]
- Cross-island transfer, independent mastery trials and spaced retrieval. No fake score for mere completion/assisted answers.

### Release gates (all future phases)
TypeScript, automated unit/integration tests, production web build, Android and iOS CI, device QA, child/teacher pedagogy acceptance, RLS/cross-profile isolation, offline/sync, audio accessibility, documented rollback. No production deployment or schema migrations as part of this learning-contract update.

#### CM1, implemented independently
- First six consecutive missions: Renklerin Uyanışı, Yeni Dostlar, Gizli Yerler, Hareket Büyüsü, İstekler Meydanı, Fener Festivali.
- 3/4/5 meaningful questions depending on selected grade; language templates selected by separate Pre-A1/A1/A2 placement. No language grade conflation.
- Full visible on-screen explanation, pronunciation/model support, semantic world effect after English sentence construction; hints, mistakes, and independent recall recorded separately.
- Same repository offline event/session persistence, 3 stars per unique level, retry-safe session ID, P5 coin compatibility.
- [CM1 full GDD](./CM1_UYANAN_MEYDAN_GDD_ACCEPTANCE.md).


### 2026-11-16 — L6 implementation addendum

- Six academy regions and a sequential integrated-English quest runner, using the stable `language_academy` island ID and `island_language_academy_atlas` game ID.
- 18 authored contexts × three language placements × five task kinds = 270 stable task IDs, not 270 independent narrative stories.
- Profile-isolated local/cloud categorical evidence, resumable 30-day checkpoint, no written child text or microphone audio stored. Touch-based dialogue is not spoken proficiency, and tile-built writing is not independent writing evidence.
- Existing academy island WebP and mobile-responsive UI used; dedicated narrative art, teacher-led curricular review, real child usability and physical device acceptance still open.
- See [L6 academy GDD](./ACADEMY_L6_GDD_ACCEPTANCE.md). This dated addendum supersedes older *planned* statements for L6 only.

### 2026-11-16 — P0 English curriculum registry

The runtime English outcome catalog is now `apps/web/src/lib/learning/englishCurriculum.ts`, with 26 topics and three placement-specific goals each. This is **separate from** the older shared math curriculum skeleton and does not override six-island persistent IDs or gameplay availability. Existing authored/implemented lesson coverage is classified separately from planned gap topics; 13 existing teaching surfaces are mapped by current game IDs. Advisory prerequisite edges never unlock/lock a game or infer mastery from progress/stars. See [P0 English curriculum contract](./VENTRA_ENGLISH_CURRICULUM_P0.md). The earlier v2 date/status entries are historical; inspect latest code for actual availability.

### 2026-11-16 — P1 Harf Korusu mini-area

Word Garden now includes an optional alphabet/initial-reading mini-area, not a seventh main island. A separate game ID island_word_garden_alphabet preserves all original six-island and subworld keys. Twelve short lessons introduce 26 letter names/forms, spoken whole-word onset/ending examples and curated three-letter words. Three grade/placement bands use the same foundational content (with different task load); this is not formal CEFR mastery. The P0 registry now maps fourteen game surfaces: letter names authored at all placements; Pre-A1 basic phonics authored, A1 partial and A2 advanced phonics an explicit gap. See docs/VENTRA_ALPHABET_GROVE_P1.md. Device TTS cannot be presented as a verified isolated-phoneme recording.

### 2026-11-17 — P2 guided course navigation
The English Journey dashboard exposes seven learning chapters linked to all fourteen real P0 teaching surfaces across six existing islands, without copying any games. Suggestions use saved playable level status, not mastery claims. Real Garden locks, grade-aware number ceilings and legacy whole-island completion remain intact. See docs/VENTRA_ENGLISH_JOURNEY_P2.md.
