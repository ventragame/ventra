# Kelime Bahçesi · Keşif Haritası 2.0

Implemented: 1400×940 optimized WebP playable terrain; connected shortest-path
navigation for six zones; click/tap snapping and manual movement constraints;
eight-compass movement orientation state, procedural walk bounce, idle and
contact shadow; illuminated route breadcrumbs; desktop cinematic follow/zoom
and an accessible overview reset; progress-driven flowers, markers and locks.

Not yet equivalent to an animated studio 2.5D release: dedicated eight-direction
artist-authored sprite frames, front/back occlusion, per-region foreground tile
atlases, moving water and fully integrated audio-reactive vegetation still need
an additional art-production and optimization pass. This is a working vertical
prototype rather than a claim of final visual QA.

Test six regions from map centre, change targets mid-walk, verify locked entries
never trigger lesson navigation, tap non-road scenery, test arrow/WASD/onscreen
buttons, switch overview zoom, test reduced-motion and mobile portrait. Validate
real Android/iOS devices before any production release. No deploy/database
changes are involved.
