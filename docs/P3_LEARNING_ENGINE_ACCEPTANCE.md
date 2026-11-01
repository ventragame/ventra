# Ventra Kids | P3 Adaptive Learning Engine v1
**2026-11-01 — Technical delivery, user acceptance pending**

## Architecture / data contract
- Pure deterministic TypeScript engine; no LLM, extra payment provider, or new Supabase migration.
- Uses the existing per-profile, offline-saved, cloud-replayable game-session answer histories.
- Vocabulary catalog: Hayvan Çayırı (12 animals) and Renk Korusu (10 colors). Unknown/future content has an extensible domain/skill contract.
- **Skills are separate:** animals: word recognition, listening, command following, habitat; colors: word recognition and guided application. Old color records without skill remain recognition.
- Discovery is exposure **not mastery**. Hints and reading-only fallback never count as independent answers.
- Outcome labels: unseen, exposed, practicing, review due, progressing. `progressing` denotes promising recent evidence, **not certified mastery**. Confidence is an explicit *heuristic*, not an audited probability.
- Review intervals after repeated independent correct answers: 12 hours, 1 day, 3, 7, 14 and 30 days. Incorrect attempts are due immediately. A due item gets guaranteed priority within a stage's base questions; previous mistake-recovery questions remain limited and spaced.
- A child switching profile gets a report based only on that child's game sessions. No profile creation is triggered by opening the progress page.
- User-selected grade and English level are still independent. An optional 8-item vocabulary check recommends Pre-A1/A1 start; it **does not assess A2 or certify CEFR**. The parent/user explicitly saves the recommendation.

## Product UX
- **Player Profiles → Learning Settings:** optional starter check, result, apply.
- **Progress → English Learning Report:** exposures, attempted vocabulary, due words, strengthening evidence and due vocabulary chips by domain; a link returns to Kids World.
- **Games:** both seeded planners consult P3's skill-specific due list for guaranteed question selection without overriding unlocked content boundaries.

## Automated acceptance gates
- Determinism across shuffled event arrays; future event filtering; per-skill isolation.
- No inflated independent correctness from discovery/hints.
- Review time arithmetic and due ranking.
- Legacy colors preserved, separate new color application evidence.
- Child isolation in stored sessions.
- Incomplete placement check rejected, no A2 claim.
- TypeScript, tests, web build, Android API 36 APK + AAB, unsigned iOS Simulator CI.

## Important release limitations
- Automated tests cannot prove children's learning outcomes. Real child/parent usability, comprehension and measured retention remain unverified.
- No high-stakes CEFR assessment, AI-generated personalized curriculum, or learning-effectiveness study was claimed.
- P0/P2 security and real two-device sync acceptance remain open (see `P0_P2_KABUL_PLANI.md`).
- P4 game quality, P5 rewards, P6 school panel and P7 payments are separate development phases.
- Vercel Git deployments remain disabled. No publishing or signed store upload.
