# Ventra L6 — Keşif Akademisi: Kayıp Yıldız Atlası

## Implementation scope (2026-11-16)

**Product:** children’s English language game, 7–12 years, web/Android/iOS, Pre-A1/A1/A2 internal placement. No mathematics, money, independent STEM curriculum, or official CEFR certification.

**Island identity:** preserve `language_academy` in the six-island world. New game id: `island_language_academy_atlas`. Existing island WebP assets remain the map and hero artwork. No new account, role, database migration, or direct production deployment.

## The six adventure regions

| Region | Narrative objective | Integrated practice |
| --- | --- | --- |
| 1. Atlas Kapısı | Recover the academy’s lost direction markers | Listening, comprehension, dialogue, ordering and typing |
| 2. Bulut Postanesi | Deliver messages to the right characters | Requests, reading clues, writing short messages |
| 3. Kayıp Fener | Relight the sea lighthouse | Listening to objects and places, describing a route |
| 4. Yolcular İstasyonu | Help passengers prepare for their journey | Polite turns, object requests, sentence production |
| 5. Zaman Kütüphanesi | Restore missing story clues | Reading and contextual description |
| 6. Büyük Keşif | Restore the final star-map page | Mixed skills and transfer |

Each region holds **three authored situations**, each situation has Pre-A1, A1 and A2 variants of **five interaction types**: hear, read, talk, build, write. There are **18 situations / 54 case-placement routes / 270 stable task IDs**. These are **not** 270 entirely original narrative plots, and a task ID alone is not proof of learning quality.

## Grade and level

English placement changes the language target, not just the number of answers. Grade remains a separate existing profile property; the youngest grade bands get slower speech. Pre-A1 includes optional touch-supported word building when independent keyboard writing is difficult. Touch-based completion is *never* independent writing evidence.

## Evidence and anti-inflation

Only categorical per-task evidence is saved: stable task ID, situation ID, placement, skill, first-attempt success, assistance/hints, errors, independently completed, speech-verified, and timestamp. **No child's entered text, transcript, raw microphone audio, image or identity is written to game metrics/checkpoints.**

- Listening only counts as independent when the English line really started playing and the answer is correct without hints/errors.
- A correct tap on dialogue choices completes the story but is *not* verified spoken English.
- Local speech recognition is optional and may fail; the user can always answer with touch controls.
- Supported word tiles can complete a writing task but do not create independent writing credit.
- The review scheduler is a deterministic heuristic (12 h, 1 d, 3 d, 7 d, 14 d) rather than calibrated mastery measurement.

## Progress, resume and rewards

The six regions unlock consecutively, with completed regions replayable. Each completed run cycles to the next of three distinct situations; adjacent runs never reuse the same situation within a region. The existing repository stores one game completion with a per-session UUID. The level best-stars ledger is idempotent and saves each profile separately. A device-local checkpoint stores no child text and expires in 30 days. If gameplay is complete but saving fails, the pending checkpoint offers recovery without rewriting answers.

The existing total-star calculation is extended to include Academy, Writing Workshop and Dialogue Harbor so awards already earned in those games are represented in the overall star count.

## UX and release quality gates

The academy UI now uses six region-specific scene treatments with verified, bundled Ventra WebP assets (academy island, harbor scenes, forest treehouse), a shared on-device Lottie owl guide with fallback and reduced-motion support, large mobile choices, and visible in-scene feedback. This reuses existing art and is not six separately commissioned illustrations. Dedicated academy-original scene and mascot art direction, character-authored story action and professional child-observed visual acceptance remain outstanding.

Automated acceptance includes six-region mapping, content/placement diversity, stable replay identities, hint independence, speech distinction, profile isolation and idempotency. Required separate gates: GitHub TypeScript/test/web/Android/iOS CI; real Android/iPhone keyboard and microphone; 320–440 px touch/accessibility; offline transition/restart; English teacher approval, child-observed task comprehension and long-term retention. No automated suite can establish pedagogy or user experience in actual children.

**Release status:** The code may be made locally playable after CI; passing CI does not constitute pedagogical or physical-device acceptance, and production stays undeployed.


## L6 Premium 2.0 corrective addendum (2026-11-16)

- **Anti-spoiler:** The active case's Turkish story and case title stay hidden until after the first listening task; names such as "Mavi Zarf" previously leaked the correct English answer. Children must try the English audio before choosing.
- **Assistance:** Two progressive hints: the first teaches a strategy, only the second reveals the model answer. Spoken models used for writing and sentence construction are assisted answers. Targeted A1/A2 variants accept authored alternative forms, not unrestricted natural-language grading.
- **Evidence integrity:** Per-step mistakes, hint level and audio-attempt flags survive a refresh using a strictly categorical local checkpoint. No typed response, transcript or raw microphone data is persisted.
- **Child privacy:** Academy voice recognition is permitted only on native-local, sherpa-local and web-local modes; browser-vendor recognition is not silently enabled for children. Touch controls remain the fallback, without verified speech credit.
- **Actionable review:** The weaker/due skill triggers a dedicated three-question, same-placement practice session across three authored cases. Its separate game ID is island_language_academy_review with zero stars; it cannot unlock main regions or inflate reward balances.
- **Visual response:** Verified existing WebP scenes, six illustrated region cards, the self-hosted animated owl guide, reduced-motion mode and immediate in-scene success feedback. These are reused assets, not original commissioned academy scene illustrations.
- **Release quality gates:** CI tests and web/Android/iOS builds; then physical-device performance, real microphone and no-audio fallbacks, narrow keyboard QA, teacher assessment and child-observed usability tests. School grade still changes voice speed rather than the whole curriculum.

### Manual QA scenarios

1. Enter a region at Pre-A1. Confirm the first Turkish story does not disclose the correct English listening target.
2. Hear the prompt, answer incorrectly, use a hint and exit before finishing the question. Reopen the same profile and verify hint/error counters remain while typed input is never saved.
3. Try all five interactions, A1/A2 accepted writing forms and supported vs. independent success.
4. Replay the same region for four rounds; adjacent story cases must be distinct. Check stars and checkpoints on two profiles.
5. Complete the three-task targeted review; make sure it neither awards a star nor advances the academy map.
6. Test a real Android/iPhone with offline speech, missing speech model, background/return, 320–440 px screen, reduced motion and failed save/retry.
