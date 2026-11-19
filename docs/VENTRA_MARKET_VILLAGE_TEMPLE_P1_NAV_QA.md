# Ventra — Lezzet Pazarı, Aile Köyü, Keşif Tapınağı P1

## Product decision
Keep the three different scenes, art styles and game engines. Reduce navigation density with a shared presentation-only `GardenQuestNavigator`. The wrapper does not own session state, locking, answers, completion, music or persistence.

## Navigation and semantics
- A high-contrast current location bar displays active region and 1/5…5/5 stage.
- The original zone and task navigation buttons stay mounted with their existing disabled logic, labels, click handlers and progress values. Active buttons have `aria-current`; keyboard focus remains visible.
- At widths <=767px, region and stage rows scroll independently horizontally, with cards wide enough for real stage names rather than hiding them. The active stage is centered within **its own scroll row** on step changes: the page is not scrolled.
- Safe-area padding, images and visual worlds remain intact. This is a visual refactor, not curriculum or game behavior change.

## Maintainable CSS ownership
- The original game theme files still own illustration, cards, backgrounds and characters.
- New late-imported `garden-quest-navigation.css` owns only shared navigation geometry, legibility and focus. Never copy these rules into the individual island V4/V5/V6/V7 files.
- Removed obsolete mobile label-hiding rules in Food Market, Family Village and Temple. Removed selected 8–9px zone labels in latest mobile overrides. All other decorative rules remain, avoiding a dangerous mass deletion of layered visuals.
- Some old theme-specific `!important` rules remain. Removing all of them safely requires visual snapshot comparisons, not global regex deletion.

## QA acceptance
- Phone viewport: 320, 360, 390, 430px; tablet 768px, desktop, portrait/landscape.
- All region/stage tabs reachable by touch and keyboard. Current tab, lock state and achievements understandable; no hidden stage names; no horizontal page overflow.
- Food Market: 3 aisles, 5 steps, 15 missions; food image + sound/drag/basket mechanics stay unchanged.
- Family Village: 4 districts, 5 steps, 20 missions; family picture and chapter progress stay unchanged.
- Exploration Temple: 5 chambers, 5 steps, 25 missions; rune tasks, scene art and recovery stay unchanged.
- Long German/English labels, text zoom at 200%, muted audio, save errors, partially unlocked progress, and reduced motion must be checked manually.
- Automated checks: TS, learning/progress regressions, production web and mobile bundle, Android debug, iOS simulator.
- No production deployment. Passing CI does not replace real physical-phone UI testing.
