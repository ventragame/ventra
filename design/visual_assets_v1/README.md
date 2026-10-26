# Ventra — Visual Assets v1

This package contains the first generated visual assets and style references for the Ventra adventure world.

## Assets (candidate production art)
- `assets/ocean_background.png` — 1672×941, RGB panoramic background; includes baked-in ocean/cloud elements, so internal water motion requires an additional effect/layer.
- `assets/exploration_hub_island.png` — 1254×1254 RGBA, isolated island with alpha transparency.
- `assets/math_island.png` — 1254×1254 RGBA, isolated island with alpha transparency.

## References (NOT production UI)
- `references/ui_elements_reference.png` — rendered UI kit concept, including text and decorative artwork baked into a single image. Rebuild buttons, labels and dynamic data as real Godot UI controls.
- `references/world_map_interaction_reference.png` — storyboard reference for choosing an island and approaching it. Not an animation file.

## Implementation rules
- Import art into `apps/game/assets/` and build a permanent modular scene (`WorldMap`, reusable `WorldIsland`, and HUD).
- Keep islands as independent sprites with separately defined interactions and responsive layout.
- Do not use the UI reference image directly as a functional interface or pretend the flat sprites provide true 3D/parallax within each island.
- Animate camera position/zoom, island hover/tap feedback and overlay effects with Godot's engine.
- The first map should include only the two supplied islands; future worlds can be added as assets become available.
- Do not replace genuine Godot rendering with an HTML simulation or mock gameplay.
