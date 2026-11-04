# Kelime Bahçesi — coherent map / Hayvan Çayırı vertical slice (v3)

This pass removes the six oval picture islands and the blank turquoise column.
A single art-directed landscape uses the original complete Word Garden cover
illustration, exported as a 1400×940 WebP with transparent foreground foliage.
It has no baked labels, stars or achievement metadata. Real game state renders
as compact native Phaser signs over six landmarks.

The first route to audit is **the player on the bridge → central market trail →
meadow fence → Hayvan Çayırı**. Coordinates in worldLayout and GardenNavigation
are aligned to the unified painting; the walk network does not claim a full
collision mesh. Other five regions remain clickable and progression-gated.

The explorer retains its original design but is separated into torso, left and
right boots with independent Phaser gait animation and mirrored facing.
This is a rigged two-leg animation, **not** eight distinct hand-animated poses.

Desktop cameras use a full-bleed cover-fit instead of contain-fit; mobile follows
the avatar. Traditional keyboard and touch navigation remain, and reduced-motion
eliminates nonessential animation. The full-map reset remains accessible.

Manual QA: start at bridge; touch Hayvan Çayırı, check walking, leg swing,
foot placement and entry; cancel/redirect mid-walk, test locked world selection,
reset map, use arrow keys and mobile taps; check 320/390/768/1280 viewport
widths and slow devices. Importantly, verify areas covered by the art really
match walkable corridors. This prototype is not final studio character art.

No database migrations, production deploy, or child-data changes.
