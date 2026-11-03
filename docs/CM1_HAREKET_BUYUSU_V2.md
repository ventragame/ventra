# Cümle Meydanı — Hareket Büyüsü 2.0 | Gameplay & pedagogy contract
**Status (2026-11-03):** Production code implemented in the existing Cümle Meydanı first region. The Android/iOS and real-child QA gates must be validated separately; this is not a claim of external language certification.

## Product purpose
Unlike generic sentence-card ordering, the child makes an English action meaningful by controlling an original illustrated world. Character and grammar match: bird → fly, rabbit → jump, dog → run, cat → sleep. Correct **independent English production** causes an on-screen action. English is necessary to achieve the action. The child can retry mistakes without time penalties.

## Four interconnected chapters, one actual playable level (plaza mission 4)
1. **Hareket Kristalleri:** action detection: find the correct verb among four actions; construct a sentence about ability, or an A1 question / A2 reason.
2. **Işık Rotaları:** interactive landmarks physically placed on the world map (tree/pond/bridge/tower). Match the Turkish cue to a location; complete an English sentence expressing the target location and action. A1 adds present continuous.
3. **Bozulan Büyüler:** find the ONE incorrect token in a grammatical sentence; repair by creating the correct English version. Compare `can + base verb` and `is + -ing`, rather than randomly clicking.
4. **Gökyüzü Senfonisi:** combine movement choice, physical destination and full English sentence. No new island is unlocked as a side effect.

### Grade and placement, two independent axes

| Grade | Tasks per chapter | Total tasks | Max word tokens | Expected session |
| --- | ---: | ---: | ---: | ---: |
| 1–2 | 3 | 12 | 10 | approximately 7–10 min |
| 3–4, unselected | 4 | 16 | 13 for 3–4, 18 if unselected | approximately 9–13 min |
| 5–8 | 5 | 20 | 18 | approximately 11–16 min |

English placement remains **independent**:
- Pre-A1: can + base verb with a simple adjective or nearby location; no causal clauses; short and narrated.
- A1: can questions, present continuous (*is flying*) and explicit near + place, still with guided support.
- A2: causal *because* clauses with meaningful feelings when the grade's cognitive length permits. Early-grade A2 retains authentic A2 syntax in the broader sentence curriculum, but Movement Magic shortens sentences so finger-sized word tiles and directions remain feasible. Grade does not silently change the student's stored placement.
- `gradeLevel` and `englishLevel` come exclusively from the current active child profile; no manual fake profile/level override.

### Time, feedback, audio and evidence
- No forced countdown, heart loss or speed penalty: a time-up failure is not an English learning outcome.
- Elapsed study duration is displayed and recorded at real session completion. Episode intros explain grammar with an English model and Turkish meaning.
- Full English sentence listening is optional, makes `modelHeard=true`; hints reveal grammatical rationale, and make `hintUsed=true`. The full model is never auto-played before a response.
- Incorrect visual choices and incorrect grammar count towards `mistakes`, but errors are recoverable and understandable. Learning evidence uses `SentenceAnswerEvidence`; a child does **not** receive an independent success flag after hints or full-model playback.
- Correct English is spoken after scene success; motion and sound provide non-textual reinforcement, and the next task advances automatically.
- Response classes: verb choice, location search, incorrect grammatical token, whole sentence construction. The game deliberately uses multiple input modalities, not only word ordering.
- Replays generate deterministic (seeded) new scenes and sentences with difficulty and weak evidence prioritization, never duplicate sentence text within one session.
- Score and stars use existing **`island_sentence_square_plaza`**, level **4**, via the existing repository. Duplicate session IDs remain idempotent; old progress and P5 balance are unchanged. No DB migration.

## Art direction / implementation
- Original, multi-layer, responsive 1200×670 SVG action world: castle tower, enchanted treehouse, river, pond, walkable bridge, luminous runes, sky clouds, depth and detailed animal illustrations.
- SVG is intentionally vector instead of raster PNG: artwork is crisp at all screen sizes and has separate animatable layers. Rasterizing the scene would make movement customization and quality worse.
- Four different lighting atmospheres, distinct character actions, luminous particle effects and on-scene accessible HTML hotspots.
- New **movement** WebAudio score in the central sound system. Inherits explicit opt-in/mute/ducking/visibility safeguards. Child pronunciation uses existing controlled English speech.
- Mobile portrait, desktop, high-contrast focus, reduced-motion CSS, controls usable without drag, audio not mandatory.

## Acceptance gates

Automated:
- [ ] TS / Next.js web compilation
- [ ] Full existing regression suite and new 4-chapter tests
- [ ] All 1–8 grade × 3 placement × replay seeds, no blank missions or incorrect grammar
- [ ] Real profile progress, offline persistence, duplicate replay stars and sibling isolation
- [ ] Static Android bundle and debug APK compilation

Human:
- [ ] Product owner plays all 4 chapters on desktop and physical phone
- [ ] Children from distinct grades confirm touch/reading usability
- [ ] English teacher validates every cue, English sentence and suggested difficulty (not CEFR certification)
- [ ] Actual device sound playback and pronunciation quality; reduced motion / mute
- [ ] Two-device sync and offline/reconnect manual test
- [ ] UX final art/animation acceptance

**Outside this work:** Other 5 plaza missions retain previous mechanics and art. The four later Cümle Meydanı regions remain locked; not magically complete. No production deployment, Android publishing or SQL migration.
