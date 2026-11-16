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

The academy UI uses the existing six-island WebP in a new dark-blue/lavender/gold hero, mobile-adaptive cards, accessible large tap areas, atmospheric CSS scene layers, a simple glowing Lumi guide motif and reduced-motion safeguards. **The prototype scenes still use icon/emoji representations**: dedicated professional illustration/character assets, actual child-friendly story animations and production art direction are outstanding.

Automated acceptance includes six-region mapping, content/placement diversity, stable replay identities, hint independence, speech distinction, profile isolation and idempotency. Required separate gates: GitHub TypeScript/test/web/Android/iOS CI; real Android/iPhone keyboard and microphone; 320–440 px touch/accessibility; offline transition/restart; English teacher approval, child-observed task comprehension and long-term retention. No automated suite can establish pedagogy or user experience in actual children.

**Release status:** The code may be made locally playable after CI; passing CI does not constitute pedagogical or physical-device acceptance, and production stays undeployed.
