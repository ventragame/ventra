# CM1 — Cümle Meydanı / Uyanan Meydan — Production GDD & Acceptance
**Date:** 2026-11-02 · **Scope:** First of five big-island sentence regions. Not a demo. Not the entire island.

## Product thesis
> Kelimeleri öğrendin. Şimdi onlarla dünyayı inşa et.

The child must **construct meaningful English syntax** to alter a responsive city scene. Child should learn how subject, article, adjective, preposition, capability, and cause change a sentence's **meaning**. English is essential for victory, not a label on an unrelated clicker.

## First region: the complete six-mission course
1. **Renklerin Uyanışı (describing)** — It is red / The lantern is blue / The lantern is blue, and the square looks bright. Visual scene recolors corresponding object.
2. **Yeni Dostlar (introducing)** — This is a blue cat / There is a blue cat in the square / ... and it looks happy. Animal appears in the specified color.
3. **Gizli Yerler (location)** — The cat is under the tree / behind the house / next to the fountain. Animal appears in the described location.
4. **Hareket Büyüsü (action)** — The bird can fly / The dog is running near the tree / ... because it feels safe. Animal moves according to its action.
5. **İstekler Meydanı (preference)** — I like apples / I like apples, but I do not like lemons / I like apples because they are sweet. Fruit stand visibly gets relevant goods.
6. **Fener Festivali (transfer)** — The red bird can fly / The blue rabbit is jumping in the square / ... because it is happy. Requires combined noun/adjective/action language.

**Each mission:** dedicated teacher-written grammar teaching card and a spoken *different* example, then 3/4/5 varied challenge sentences based on grade, respective child profile English placement and stable seed, interactive tap-to-assemble tiles, short sound/animation and auto-next. Last mission results in an earned reward, without fake future-area unlocks.

### Pedagogical contract
- Grade controls quantity: grades 1–2 three questions, grades 3–4 or unselected four, grades 5–8 five. English complexity independent: Pre-A1 / A1 / A2. Upper-grade beginners never forced into A2.
- Lesson mode explicitly explains the sentence rule in Turkish, presents English model + native-device English pronunciation. Child may replay model.
- Challenge shows real-world meaning in Turkish, selected word translations as needed, and shuffled **English cards with distractors**. It doesn't show the complete correct sentence unless child explicitly requests voice assistance or hints.
- The child constructs the entire sentence in order and cannot win by repeatedly selecting any option. Incorrect order triggers formative feedback. Hint reveals grammatical structure and the next needed token; assistance is explicitly recorded.
- **Independent evidence:** first try, no mistake, no hint, no full model heard. Scaffolded completion is recorded but never treated as independent performance. Duplicate mission replays upgrade only existing best stars, never unlimited currency.
- Level mastery remains a *separate assessment*: GameCompleted is not a formal CEFR score. For accurate independent grammar mastery the application must consider stored sentenceAnswers, not stars alone.
- No child microphone, AI text-to-generation or unmoderated responses, third-party audio upload or user-written free-text content.
- Teacher/language specialist review pending: exact age suitability, A2 complexity, safe phrases, preposition visual relation and native audio.

### Original premium visual and audio
- Interactive layered, responsive, resolution-independent original SVG painted city. Clock tower, building roofs, lights, trees, plaza, fountains, pennants and magical effects have separate shapes and layers. Avoid blurry/rasterized scene.
- Before success, the scene stays untransformed; after correctly built English, a color, actor position, actor motion, or food stand changes visibly.
- Full action/reaction sequences are respectful of prefers-reduced-motion and touch screen accessibility; semantics visible even without movement/audio.
- Custom `plaza` WebAudio music score, enabled only when child/adult previously opted in, with TTS ducking and global mute. Correct/try-again/final motif reused from Ventra audio v3.
- Reuse existing world-level WebP art file for island overview. The playable scene is original vector artwork; WebP is not intrinsically a higher-quality way to represent interactive independent shapes.

### Persistent state & backward compatibility
- Stable island ID: `story_castle`. New game ID: `island_sentence_square_plaza`. Six levels under existing profile event store and Supabase sync.
- Session IDs unique; same ID replay save is idempotent. Per-profile `sentenceAnswers` evidence is saved in generic GameMetrics and readable in Memory and IndexedDB.
- P5 economy reward source has six levels; existing game counts, profiles, school RLS and Word Garden records do not change.
- Other four large-island locations unchanged; within Cümle Meydanı 4 unreleased areas stay locked. No new SQL, Vercel production deploy or store publication.

## QA / acceptance
Automated quality:
- [ ] TS type check (GitHub Actions)
- [ ] All web test suite and new CM1 English curriculum/scene/progress tests
- [ ] Next.js production build; Android static bundle and optional debug APK
- [ ] Real local profile grade/placement and reward state

Human/device and pedagogical gates **remain open**:
- [ ] User product-owner acceptance on local website (a child can independently understand UI)
- [ ] 1st grade Pre-A1 and older grade Pre-A1 understand grammar and no A2 leakage
- [ ] English teacher verifies every template and its on-screen visual semantics (including color, place, action and preference)
- [ ] iPhone Safari/Android Chrome, portrait/landscape screen space and low-end FPS
- [ ] Offline/reconnect, two devices, merged sync records, account isolation
- [ ] English voice comprehension, muted/reduced-motion behavior, screen reader and motor access
- [ ] Real kids retention / transfer; no claim "completed premium" just because CI is green

## Roadmap
- CM1 = **Uyanan Meydan**, six missions, delivered as the first fully programmed region.
- CM2 = **Büyülü Yapı Atölyesi**, construction from English descriptions (NOT a reskin of word ordering).
- CM3 = **Konumlar Parkı**, physically place 3D/2.5D scene objects based on spatial language.
- CM4 = **Soru İstasyonu**, build interrogatives and negatives based on characters' information goals.
- CM5 = **Gökyüzü Köprüsü**, solve multi-step English semantic missions blending all earlier sentence structures.
- After pedagogical and product acceptance, next region can be built. Do not unlock future regions prematurely.

## CM1 v2 — Sentence variety and active language evidence (2026-11-02)
- Existing **6 missions and all saved progress remain compatible**; do not reset profiles or rename `island_sentence_square_plaza`.
- Grade 1–2: 3 prompts/session and maximum **10 English word tokens**; grades 3–4: 4 prompts and max 13 tokens; grades 5–8: 5 prompts and max 22 tokens; missing grade: 4 prompts. These limits only adapt cognitive load, **not automatically change placement**.
- English level independently controls grammatical construction: Pre-A1 supported short descriptions, seeing and wanting, location and can; A1 adds `is ... ?`, `There is / There are`, location instructions, present continuous, negation, polite requests; A2 adds `because` and `but` reasoning/contrast and longer instructions. Formal CEFR proficiency is **not claimed**.
- Three true challenge modes: **construct** (build a full English sentence, submit as a whole), **repair** (first identify a grammatical error in a corrupted sentence, then rebuild), **scene** (select the object, color, location or action that matches meaning, then build).
- More than one communicative form per session when placement/content permits: positive statements, questions, negatives, instructions, reasons, contrasts, wants, preferences. Explicit curated Turkish cues align with English meaning; do not use word-shuffle grammatically invalid content.
- True assessment after full sentence submission: errors are not revealed token-by-token while selecting; wrong word/order prompts explanation and correction. Hint and full-sentence model audio explicitly lower independence evidence. Answer records include optional **sentenceKind** and **challengeMode** for future learning reports.
- Profile's Word Garden animal, color and food evidence prioritizes known vocabulary when scheduling new sentence challenges. New words remain supported by vocabulary notes; unfamiliar words do not block a session.
- More varied interactive visuals: six colors including purple and orange, animal count with `There are two`, empty fruit tray when saying `do not want`, distinct color-choice swatches and scene reactions.
- Tests: all mission/placement combinations, 1–8 grades, unique patterns, three modes, repaired sentence semantics, correct scene options, grade ceilings, replay/star/child separation and grammar correctness.
- **Not done:** independently authored voice recordings, review by an English teacher, real children and device interaction testing, real writing or open dialogue, four future Cümle Meydanı regions.
