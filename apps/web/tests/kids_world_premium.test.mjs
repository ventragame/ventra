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
 assert.match(page,/handleOpenLearningPath\(focusedIsland==='story_castle'\?'story_castle':'word_garden'\)/);
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
 assert.match(scene,/this.add.rectangle\(pos.x,pos.y/);
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
 assert.match(scene,/mode = this\.isOverviewMode \|\|/);
 assert.match(scene,/this\.cameras\.main\.useBounds = !this\.isOverviewMode/);
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
