import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
const scene=fs.readFileSync(new URL('../src/components/game/scenes/WorldScene.ts',import.meta.url),'utf8');
const phaser=fs.readFileSync(new URL('../src/components/game/PhaserGame.tsx',import.meta.url),'utf8');
const style=fs.readFileSync(new URL('../src/app/kids/kids-world-premium.css',import.meta.url),'utf8');
test('Archipelago keeps both existing maps, all six world destinations and functional world selection',()=>{
 assert.match(page,/DynamicPhaserGame/);
 assert.match(page,/LearningPathModal/);
 assert.match(page,/ARCHIPELAGO_ISLANDS_ORDERED\.map/);
 assert.match(page,/handleFocusIsland\(island.id\)/);
 assert.match(page,/handleOpenLearningPath\(focusedIsland\)/);
 assert.match(page,/isWorldLocked/);
 assert.match(page,/setIsParentGateOpen\(true\)/);
 assert.doesNotMatch(page,/6 Ada \(V2\)/);
});
test('Cinematic sky can show through Phaser transparent canvas and has reduced-motion support',()=>{
 assert.match(page,/kids-world-atmosphere/);
 assert.match(page,/kids-world-premium\.css/);
 assert.match(phaser,/transparent: true/);
 assert.match(phaser,/background: 'transparent'/);
 assert.match(scene,/createSkyDetails\(\)/);
 assert.match(scene,/isReducedMotion\(\)/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
});
test('Islands have readable labels with clickable nameplates, distinct pending states and capped camera',()=>{
 assert.match(scene,/fontSize: '21px'/);
 assert.match(scene,/fontSize: '15px'/);
 assert.match(scene,/badgeHit\.on\('pointerup'/);
 assert.match(scene,/GÖREV/);
 assert.match(scene,/YAKINDA/);
 assert.match(scene,/this\.cameras\.main\.zoomTo/);
 assert.match(scene,/this\.fitCameraToViewport/);
 assert.doesNotMatch(scene,/updateIslandProgress\('word_garden', 5, 5\)/);
});
test('UX V5 island dock labels selection honestly instead of suggesting it opens a game',()=>{
 assert.match(page,/aria-label=\{`\$\{island.nameTr\} adasını seç`\}/);
 assert.match(page,/selected\?'✓ Seçili'/);
 assert.match(page,/playable\?'✦ Ada Seç'/);
 assert.match(page,/handleFocusIsland\(island.id\)/);
 assert.match(page,/handleOpenLearningPath\(focusedIsland\)/);
});
test('Touch-screen dock and island panel retain accessible semantics with no fabricated progression',()=>{
 assert.match(page,/aria-pressed=\{selected\}/);
 assert.match(page,/role="progressbar"/);
 assert.match(page,/gardenOverall\.completed/);
 assert.match(page,/onOpenLearningPath/);
 assert.match(style, /@media\(max-width:640px\)/);
 assert.match(style,/safe-area-inset-bottom/);
 assert.match(style,/min-height:5[012]px/);
 assert.doesNotMatch(page,/Seviye Haritasını Aç/);
});

test('R2 island nameplates have explicit anchors instead of overlapping the next artwork',async()=>{
 const {ARCHIPELAGO_DESKTOP_BADGES,archipelagoBadgeAnchor,archipelagoOpticalShiftPixels}=
   await import('../src/lib/game/archipelagoPresentation.ts');
 const {ARCHIPELAGO_ISLANDS_ORDERED}=await import('../../../packages/shared/src/archipelago.ts');
 assert.equal(Object.keys(ARCHIPELAGO_DESKTOP_BADGES).length,6);
 const positions=ARCHIPELAGO_ISLANDS_ORDERED;
 // Screen-space affine camera transforms retain relative intersections.
 const boxes=positions.map(isl=>{
   const anchor=archipelagoBadgeAnchor(isl.id,false);
   return {id:isl.id,x:isl.defaultWorldPos.x+anchor.x,y:isl.defaultWorldPos.y+anchor.y};
 });
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];
   assert.ok(Math.abs(a.x-b.x)>=254||Math.abs(a.y-b.y)>=94,
     'island plaques must not overlap: '+a.id+' vs '+b.id);
 }
 assert.deepEqual(archipelagoBadgeAnchor('word_garden',true),{x:0,y:223});
 assert.equal(archipelagoOpticalShiftPixels(390),0);
 assert.equal(archipelagoOpticalShiftPixels(960),0);
 assert.ok(archipelagoOpticalShiftPixels(1773)>=80);
 assert.ok(archipelagoOpticalShiftPixels(1440)<archipelagoOpticalShiftPixels(1773));
 assert.ok(archipelagoOpticalShiftPixels(3440)<=86);
});
test('R2 independent islands use responsive labels, revised plaques and subtle fairy-dust routes',()=>{
 const map=fs.readFileSync(new URL('../src/lib/game/archipelagoPresentation.ts',import.meta.url),'utf8');
 assert.match(scene,/archipelagoBadgeAnchor\(def.id/);
 assert.match(scene,/archipelagoBadgeAnchor\(id,\s*portrait\)/);
 assert.match(scene,/archipelagoOpticalShiftPixels\(width\)\/fitZoom/);
 assert.match(scene,/const badgeContainer = this.add.container\(badgeAnchor.x,badgeAnchor.y\)/);
 assert.match(scene,/fillRoundedRect\(-127,-43,254,94/);
 // The route sparkle is now a warm firefly drifting above the planks.
 assert.match(scene,/const glint=this\.add\.circle\(first\.x,first\.y,2\.6,palette\.lamp/);
 assert.match(scene,/this.tweens.addCounter/);
 assert.match(scene,/this.isReducedMotion\(\)/);
 assert.match(map,/sentence_workshop/);
 assert.match(style,/kids-world-dock/);
 assert.match(style,/min-height:48px/);
});

test('V2 mobile camera has distinct overview and focus framing with reserved UI space',async()=>{
 const {archipelagoCameraFraming}=await import('../src/lib/game/archipelagoPresentation.ts');
 const bounds={width:1640,height:1120,centerX:1200,centerY:800};
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[800,360]]){
   const target={x:640,y:530};
   const focused=archipelagoCameraFraming({width,height,bounds,mode:'focus',target});
   const overview=archipelagoCameraFraming({width,height,bounds,mode:'overview'});
   assert.ok(overview.zoom<focused.zoom,`overview must fit six islands at ${width}x${height}`);
   assert.ok(focused.zoom>0.2&&Number.isFinite(focused.y));
   const screenY=height/2+(target.y-focused.y)*focused.zoom;
   assert.ok(screenY>55&&screenY<height-75,`island avoids controls at ${width}x${height}`);
 }
 assert.match(scene,/WORLD_OVERVIEW_CHANGED/);
 assert.match(scene,/const mode = this\.isPanoramaMode\(\)/);
 assert.match(scene,/this\.cameras\.main\.useBounds = !this\.isPanoramaMode\(\)/);
});
test('V2 mobile sheet, tools and viewport preserve access to six islands',()=>{
 assert.match(page,/height: '100dvh'/);
 assert.match(page,/kids-mobile-tools/);
 assert.match(page,/Ebeveyn ve bulut/);
 assert.match(page,/kids-island-detail--overview/);
 assert.match(page,/kids-island-expand/);
 assert.match(page,/WORLD_OVERVIEW_CHANGED/);
 assert.match(style,/safe-area-inset-top/);
 assert.match(style,/kids-mobile-menu-backdrop/);
 assert.match(style,/kids-world-dock\{scroll-padding-inline/);
 assert.match(style,/kids-island-detail:not\(\.kids-island-detail--expanded\)/);
});

test('V3 spotlight isolates selected island on phones and tablets',()=>{
 assert.match(scene,/private updateIslandPresentation\(\): void/);
 assert.match(scene,/entity\.container\.setVisible\(shown\)/);
 assert.match(scene,/entity\.badgeContainer\?\.setVisible\(showBadge\)/);
 assert.match(scene,/entity\.badgeHit\?\.input\) entity\.badgeHit\.input\.enabled = showBadge/);
 assert.match(scene,/this\.routeDecorations\.forEach/);
 assert.match(scene,/return this\.scale\.width <= 900/);
 assert.match(scene,/this\.updateIslandPresentation\(\)/);
 assert.match(scene,/this\.focusCameraOnIsland\(next/);
 assert.match(scene,/this\.isOverviewMode && this\.isCompactViewport\(\)/);
});
test('V3 desktop keeps real island art and prevents permanently overlapping labels',()=>{
 assert.match(scene,/entity\.badgeContainer\?\.setVisible\(false\)/);
 assert.match(scene,/const showBadge = hovered && !this\.isCompactViewport\(\)/);
 assert.match(style,/@media \(min-width:901px\)/);
 assert.match(page,/ARCHIPELAGO_ISLANDS_ORDERED\.map/);
});
test('V3 phone and tablet navigation remains reachable without giant dark panels',()=>{
 assert.match(style,/@media\(max-width:900px\)/);
 assert.match(style,/kids-island-detail-inner\{/);
 assert.match(style,/background:linear-gradient\(135deg,rgba\(250,255,248/);
 assert.match(style,/text-overflow:ellipsis/);
 assert.match(style,/max-width:420px/);
 const nextCfg=fs.readFileSync(new URL('../next.config.mjs',import.meta.url),'utf8');
 assert.match(nextCfg,/devIndicators: false/);
});

test('V3 six desktop islands have non-overlapping base illustration footprints',async()=>{
 const {ARCHIPELAGO_ISLANDS_ORDERED}=await import('../../../packages/shared/src/archipelago.ts');
 for(let i=0;i<ARCHIPELAGO_ISLANDS_ORDERED.length;i++){
   for(let j=i+1;j<ARCHIPELAGO_ISLANDS_ORDERED.length;j++){
     const a=ARCHIPELAGO_ISLANDS_ORDERED[i];
     const b=ARCHIPELAGO_ISLANDS_ORDERED[j];
     const distance=Math.hypot(a.defaultWorldPos.x-b.defaultWorldPos.x,a.defaultWorldPos.y-b.defaultWorldPos.y);
     assert.ok(distance>=460,`island illustration collision: ${a.id} / ${b.id}: ${distance}`);
   }
 }
});

test('Desktop panorama centers all six islands and uses the available screen height',async()=>{
 const {archipelagoCameraFraming,archipelagoOpticalShiftPixels}=
   await import('../src/lib/game/archipelagoPresentation.ts');
 const {ARCHIPELAGO_ISLANDS_ORDERED}=await import('../../../packages/shared/src/archipelago.ts');
 const bounds={width:1640,height:1120,centerX:1210,centerY:760};
 for(const [width,height] of [[901,700],[1280,720],[1764,830],[1920,1080],[2560,1440]]){
   const frame=archipelagoCameraFraming({width,height,bounds,mode:'overview'});
   const cameraX=frame.x-archipelagoOpticalShiftPixels(width)/frame.zoom;
   for(const island of ARCHIPELAGO_ISLANDS_ORDERED){
     const {x,y}=island.defaultWorldPos;
     const screenX=width/2+(x-cameraX)*frame.zoom;
     const screenY=height/2+(y-frame.y)*frame.zoom;
     const radius=230*frame.zoom;
     assert.ok(screenX-radius>=-1&&screenX+radius<=width+1,
       island.id+' horizontal crop at '+width+'x'+height);
     assert.ok(screenY-radius>=70&&screenY+radius<=height-65,
       island.id+' vertical crop at '+width+'x'+height);
   }
   if(width===1764) assert.ok(frame.zoom>=0.49,
     'Desktop islands should be legible instead of tiny');
 }
 assert.match(scene,/this\.cameras\.main\.useBounds = mode !== 'overview'/);
 assert.match(scene,/private isPanoramaMode\(\)/);
 assert.match(scene,/if \(this\.isPanoramaMode\(\)\)/);
});

test('Island portal waits for opaque coverage before mounting a region',()=>{
 const overlay=fs.readFileSync(new URL('../src/components/learning/CloudTransition.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/CloudTransition.css',import.meta.url),'utf8');
 assert.match(overlay,/const closeMs = reducedMotion \? 90 : 760/);
 assert.match(overlay,/setPhase\('covered'\);\s*onCovered\?\.\(\)/);
 assert.match(overlay,/window\.clearTimeout\(coverTimer\)/);
 assert.match(overlay,/window\.clearTimeout\(openTimer\)/);
 assert.match(overlay,/window\.clearTimeout\(completeTimer\)/);
 assert.match(css,/ventra-cloud-veil-in 760ms/);
 assert.match(css,/100% \{ opacity: 1; \}/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(page,/if \(pendingRegionRef\.current\) return/);
 assert.match(page,/const region = pendingRegionRef\.current/);
 assert.doesNotMatch(overlay,/cloud\.svg/);
});

test('Child-facing loading screen and game path no longer show technical copy',()=>{
 const welcome=fs.readFileSync(new URL('../src/components/onboarding/KidsWelcomeGate.tsx',import.meta.url),'utf8');
 const panel=fs.readFileSync(new URL('../src/components/audio/AudioSettingsPanel.tsx',import.meta.url),'utf8');
 assert.match(page,/Maceran Başlıyor!/);
 assert.match(page,/Sihirli adalar seni bekliyor/);
 assert.doesNotMatch(page,/Phaser Takımada Motoru Başlatılıyor/);
 assert.match(welcome,/Her ada yeni bir macera!/);
 assert.match(welcome,/kazandığı yıldızları birlikte kutla/);
 assert.doesNotMatch(welcome,/bulut ayarlarını yönet/);
 assert.doesNotMatch(welcome,/Yıldızlar öğrenme başarılarını gösterir; satın alma aracı değildir/);
 assert.doesNotMatch(panel,/Varsayılan kapalıdır/);
 assert.match(panel,/ilk dokunuştan sonra çalabilir/);
});

test('Premium six-island skybridge ring: one hand-built timber material on every connection',async()=>{
 const {ARCHIPELAGO_SKYBRIDGES,ARCHIPELAGO_SKYBRIDGE_MATERIAL,SKYBRIDGE_GEOMETRY,
  skybridgePoint,skybridgeNormal,skybridgeTangent,skybridgeLength,skybridgePlanks,skybridgePosts,skybridgeRope}=
  await import('../src/lib/game/archipelagoBridges.ts');
 const {ARCHIPELAGO_ISLANDS_ORDERED,ARCHIPELAGO_ISLANDS_CATALOG}=
  await import('../../../packages/shared/src/archipelago.ts');
 const order=ARCHIPELAGO_ISLANDS_ORDERED.map(x=>x.id);
 assert.equal(ARCHIPELAGO_SKYBRIDGES.length,6);
 assert.deepEqual(ARCHIPELAGO_SKYBRIDGES.map(x=>x.from),order);
 assert.deepEqual(ARCHIPELAGO_SKYBRIDGES.map(x=>x.to),[...order.slice(1),order[0]]);
 assert.equal(new Set(ARCHIPELAGO_SKYBRIDGES.map(x=>x.from)).size,6);
 // One material: a fixed wood palette, festival pennants, no per-destination colours.
 const M=ARCHIPELAGO_SKYBRIDGE_MATERIAL;
 for(const key of ['shadow','fascia','fasciaShade','stringer','plankHighlight','plankEdge','post','postShade',
  'postCap','rope','ropeShade','ropeLight','lamp','lampGlass','lampFrame','lampHalo'])
  assert.equal(typeof M[key],'number',key);
 assert.equal(M.plankTones.length,4);
 assert.equal(M.pennants.length,5);
 assert.ok(Object.isFrozen(M)&&Object.isFrozen(SKYBRIDGE_GEOMETRY));
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 for(const route of ARCHIPELAGO_SKYBRIDGES){
  const from=ARCHIPELAGO_ISLANDS_CATALOG[route.from].defaultWorldPos;
  const to=ARCHIPELAGO_ISLANDS_CATALOG[route.to].defaultWorldPos;
  const startGap=dist(route.p0,from),endGap=dist(route.p1,to);
  assert.ok(startGap>=115&&startGap<=215,'Bridge starts inside source artwork: '+route.from);
  assert.ok(endGap>=115&&endGap<=215,'Bridge terminates inside target artwork: '+route.to);
  assert.ok(dist(route.p0,route.p1)>=155,'Bridge must span a visible gap: '+route.from+' -> '+route.to);
  assert.deepEqual(skybridgePoint(route,0),route.p0);
  assert.deepEqual(skybridgePoint(route,1),route.p1);
  for(const t of [0,0.1,0.35,0.5,0.72,0.9,1]){
   const p=skybridgePoint(route,t),n=skybridgeNormal(route,t),u=skybridgeTangent(route,t);
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   assert.ok(Math.abs(Math.hypot(n.x,n.y)-1)<1e-10);
   assert.ok(Math.abs(n.x*u.x+n.y*u.y)<1e-10,'normal is perpendicular to travel');
  }
  // Planks are evenly spaced by arc length (not by t), deterministic and hand-cut.
  const planks=skybridgePlanks(route);
  assert.deepEqual(skybridgePlanks(route),planks,'same bridge on every visit');
  assert.ok(planks.length>=Math.floor(skybridgeLength(route)/SKYBRIDGE_GEOMETRY.plankPitch)-1);
  for(let i=1;i<planks.length;i++){
   const gap=dist(planks[i].point,planks[i-1].point);
   assert.ok(Math.abs(gap-SKYBRIDGE_GEOMETRY.plankPitch)<0.8,`${route.from}: plank ${i} gap ${gap.toFixed(2)}`);
  }
  for(const plank of planks){
   assert.ok(Number.isInteger(plank.tone)&&plank.tone>=0&&plank.tone<M.plankTones.length);
   assert.ok(Math.abs(plank.twist)<=0.035&&Math.abs(plank.lengthJitter)<=1.7);
  }
  // Posts: one at each end (just inside the island art), evenly spaced between.
  const posts=skybridgePosts(route);
  assert.ok(posts.length>=3,route.from);
  const length=skybridgeLength(route),inset=SKYBRIDGE_GEOMETRY.postInset;
  assert.ok(Math.abs(dist(posts[0].point,route.p0)-inset)<3);
  assert.ok(Math.abs(dist(posts.at(-1).point,route.p1)-inset)<3);
  const spans=posts.slice(1).map((p,i)=>dist(p.point,posts[i].point));
  assert.ok(Math.max(...spans)-Math.min(...spans)<4,'posts evenly spaced: '+route.from);
  assert.ok(Math.abs((length-2*inset)/(posts.length-1)-SKYBRIDGE_GEOMETRY.postSpacing)<SKYBRIDGE_GEOMETRY.postSpacing*0.35);
 }
 // Rope rails hang down on screen between two posts.
 const rope=skybridgeRope({x:0,y:0},{x:80,y:0},5);
 assert.deepEqual(rope[0],{x:0,y:0});
 assert.deepEqual(rope.at(-1),{x:80,y:0});
 assert.ok(Math.abs(rope[5].y-5)<1e-9&&Math.abs(rope[5].x-40)<1e-9);

 const bridge=scene.slice(scene.indexOf('private createProgressionPaths(): void'),
  scene.indexOf('  // --- 3. ALTI BAĞIMSIZ ADANIN'));
 assert.match(bridge,/ARCHIPELAGO_SKYBRIDGES\.forEach/);
 assert.match(bridge,/const palette=ARCHIPELAGO_SKYBRIDGE_MATERIAL/);
 for(const piece of ['skybridgePlanks(curve)','skybridgePosts(curve)','skybridgeRope(','deck.fillPoints(board,true)',
  'palette.pennants[','palette.lampGlass','geo.shadowDrop'])assert.ok(bridge.includes(piece),piece);
 // Every bridge layer stays below the island art (depth 20) so ends tuck under it.
 const depths=[...bridge.matchAll(/setDepth\((\d+)\)/g)].map(m=>Number(m[1]));
 assert.ok(depths.length>=6&&depths.every(d=>d<20),'bridge depths '+depths);
 // Additive light turned the lanterns white on the blue sky; motion only when allowed.
 assert.doesNotMatch(bridge,/BlendModes\.ADD/);
 assert.match(bridge,/const animate=!this\.isReducedMotion\(\)&&!this\.isMobileDevice\(\);/);
 assert.match(bridge,/if\(animate\)this\.tweens\.add/);
 assert.match(bridge,/this\.tweens\.addCounter/);
 assert.doesNotMatch(bridge,/isActive|gold\?|discovery_academy|0xadd8d9/);
 assert.match(scene,/this\.routeDecorations\.forEach\(\(decoration\) => decoration\.setVisible\(!spotlight\)\)/);
 // Islands get a soft aura, not a hard outline ring crossing the bridges.
 assert.doesNotMatch(scene,/haloStroke/);
 assert.match(scene,/const haloAura=this\.add\.ellipse\(/);
});

test('World HUD never overlaps: compact map button replaces the title on mid-size screens',()=>{
 assert.match(page,/className="kids-hud-icon kids-hud-map-compact" aria-label="Genel haritayı göster"/);
 assert.doesNotMatch(page,/kids-hud-icon lg:hidden/,'a Tailwind lg:hidden lost to .kids-hud-icon{display:flex}');
 assert.match(page,/\{isMuted\?'🔇':'🔊'\}/,'the sound button shows a speaker, not a slider glyph');
 assert.match(style,/\.kids-hud-icon\.kids-hud-map-compact\{display:none\}/);
 assert.match(style,/@media\(max-width:1879px\) and \(min-width:1561px\)\{\s*\.kids-world-hud\{grid-template-columns:auto minmax\(0,1fr\) auto\}/);
 assert.match(style,/@media\(max-width:1560px\) and \(min-width:901px\)\{\s*\.kids-world-hud\{grid-template-columns:1fr auto\}\s*\.kids-hud-title\{display:none\}\s*\.kids-hud-icon\.kids-hud-map-compact\{display:flex\}/);
});

test('Profile picker uses illustrated, unlocked characters without weakening profile ownership',()=>{
 const picker=fs.readFileSync(new URL('../src/components/profile/ProfileSelectorModal.tsx',import.meta.url),'utf8');
 const illustration=fs.readFileSync(new URL('../src/components/profile/AvatarPortrait.tsx',import.meta.url),'utf8');
 assert.match(picker,/purchaseAvatarWithCoins/);
 assert.match(picker,/getAvatarShop/);
 assert.match(picker,/onProfileSwitched\(updated\)/);
 assert.match(picker,/onClick=\{\(\)=>void equipAvatar\(true\)\}/);
 assert.match(picker,/if \(p\.userId\)/);
 assert.match(illustration,/ANIMAL_ART/);
 assert.match(illustration,/radialGradient/);
 assert.match(illustration,/FANTASY_ART/);
 assert.match(page,/AvatarPortrait id=\{activeProfile\?\.avatarId/);
});

test('Expanded avatar wardrobe supports thematic discovery and accessible actions',()=>{
 const picker=fs.readFileSync(new URL('../src/components/profile/ProfileSelectorModal.tsx',import.meta.url),'utf8');
 assert.match(picker,/AVATAR_COLLECTIONS\.map/);
 assert.match(picker,/type Collection='all'\|'heroes'\|'animals'\|'fantasy'\|'space'/);
 assert.match(picker,/avatar-gallery/);
 assert.match(picker,/aria-label="Önceki avatar"/);
 assert.match(picker,/aria-label="Sonraki avatar"/);
 assert.match(picker,/aria-label="Avatar ara"/);
 assert.match(picker,/aria-label="Açılmış avatarlar"/);
 assert.match(picker,/purchaseAvatarWithCoins/);
 assert.match(picker,/Coin harcayarak/);
 assert.match(picker,/onProfileSwitched\(updated\)/);
});
