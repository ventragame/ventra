# Cümle Meydanı · Fener Festivali — final adventure
**3 November 2026 · CM1 Uyanan Meydan, mission 6 / 6**

## Goal
A visual **language-transfer** finale rather than a math game or cosmetic word-card exercise. Children reuse mastered colors, animals, actions, object descriptions and locations in full English statements, instructions, and (when appropriate) causal constructions. Every answered sentence has a curated Turkish cue, explicit correction feedback and a physical effect on an interactive night-time festival.

## Four playable chapters
| Chapter | Learning objective | Actual touch / gameplay |
|---|---|---|
| **Renk Kristalleri** | Color, lantern, description, *there is* and present continuous | Select actual lantern color among six colored magical crystals; produce a complete English sentence, awaken a dynamically colored floating lantern |
| **Işık Rotaları** | Location, near vs next to, simple instruction and request | Tap the correct in-world location: tree, bridge, tower or fountain; use English to state where or request lantern placement |
| **Rüzgârın Sırrı** | *can + base verb* versus *is + -ing*, agreement, optional A2 reason | Find **exactly one** incorrect word in a deliberately damaged sentence, then reconstruct the correct sentence; character animates its appropriate action |
| **Gökyüzü Töreni** | Combined information transfer (color, animal, verb, location, optional because) | Choose crystal color, one of four animals and physical destination, then form the whole English sentence to launch the final lantern |

The gameplay uses three distinct real mechanisms: **physical scene selection, grammatical error recovery, and complete sentence construction**. The final demands all three correct semantically meaningful choices, not random 50/50 guessing.

## Two independent difficulty axes
| Class | Prompts per chapter | Total | Maximum sentence words | Planning estimate |
|---|---:|---:|---:|---:|
| 1–2 | 3 | 12 | 10 | 8–12 min |
| 3–4 | 4 | 16 | 13 | 11–16 min |
| 5–8 | 5 | 20 | 18 | 14–19 min |
| Unselected | 4 | 16 | 18 | 11–16 min |

- **Pre-A1**: short simple color/location statements, ability with `can`, physical imperative `Put the lantern near...`; no `because` clauses.
- **A1**: `There is` and present continuous `is flying`, `next to` structures, location instructions and grammar repair.
- **A2**: longer supported descriptions and full causal explanations, including `because it feels...`; grade 1–2 compresses structural length without silently changing the child's stored placement. Grade is cognitive load, not an English placement score.
- Fresh tasks: 6 colors × 4 locations × 4 animals, task deduplication per chapter, deterministic seed, weak-evidence reintroduction and preferential use of known Word Garden vocabulary.
- No artificial countdown or reading-speed penalties; elapsed playtime recorded.

## Visual, music and sound
- Original SVG 1200×660 multilayer fantasy-night landscape: glowing moon, star field, illuminated treehouses, river, moon bridge, observatory tower, magical fountain, airborne festival lanterns. Touch targets are semantic HTML buttons over illustration, not inaccessible canvas hit tests.
- Dynamic colored lantern projection, lit lantern count grows with progress, sparkle and character action effects for correct English; original 4 character illustrations with movement animations.
- Responsive mobile portrait and desktop, keyboard outlines, user motion preferences. Existing WebP story-castle artwork on the welcome hero; original SVG used for every interactive character and location to keep animation and retina clarity.
- New original WebAudio `lantern` score respects global opt-in and mute; TTS speech is not represented as human voice recordings. Automatic transitions **wait for spoken sentence completion** (with bounded fallback) and finish after all 12–20 prompts.

## Progress integrity and privacy
- Existing game ID `island_sentence_square_plaza`, mission **6**, `skill='transfer'`, `saveSentencePlazaMission`; no SQL migrations or separate star currencies. Level 6 remains locked until levels 1–5 are complete.
- Save full set of evidence only at mission completion; session IDs are retry-safe. Stored answer evidence separates independent outcomes from mistakes, hints and full-sentence listening; record a maximum-best-star behavior through existing progress architecture.
- Same-device, grade+profile+English-placement-bound checkpoint for interrupted work; next-session recovery is best-effort and **is not cross-device checkpoint transfer**.
- No external child chat, recording, microphone or user speech transmission.
- Existing locked future Cümle Meydanı regions remain locked; completion does not pretend they were implemented.

## Automated acceptance
- [ ] TypeScript strict check and core lesson tests
- [ ] 1–8 school grades + unselected × Pre-A1/A1/A2 × many seeds, 4 complete chapters and no duplicate sentence per chapter
- [ ] One true grammar error per repair prompt, correct color/animal/landmark/meaning, child age caps
- [ ] Existing mission 1–5 save prerequisite, star idempotence, sibling separation, mission 6 profile persistence
- [ ] Next.js production build and static mobile web export
- [ ] Android debug APK compilation and iOS simulator when CI supports these

## Manual acceptance still required
- [ ] Product owner desktop and physical phone full four-chapter test, repeated twice
- [ ] Real learner age-group interactions: reading and touch accessibility
- [ ] English-teacher QA of each exact English sentence and Turkish cue
- [ ] Mute/reduced-motion, pronunciation and real audio playback
- [ ] Exit/reopen halfway, internet offline/reconnect, two-device sync
- [ ] Frame rate, memory and low-power phone performance

**Honesty:** Source implementation and compilation are not a substitute for testing the full gameplay on physical devices. No production deployment, database migration or app-store release included.
