import { ARCHIPELAGO_ISLANDS_CATALOG, type IslandId } from '@ventra/shared';

/** Fixed six-stop learning journey, authored in illustration-local offsets.
 * The island sprites may be repositioned without leaving the bridges behind.
 * Every segment uses one material palette regardless of destination progress.
 */
export interface SkybridgePoint { x:number; y:number }
export interface SkybridgeRoute {
 from:IslandId;
 to:IslandId;
 p0:SkybridgePoint;
 p1:SkybridgePoint;
 ctrl:SkybridgePoint;
}
interface SkybridgePlan {
 from:IslandId;
 to:IslandId;
 exit:SkybridgePoint;
 entry:SkybridgePoint;
 bend:SkybridgePoint;
}
const PLANS:readonly SkybridgePlan[]=[
 {from:'word_garden',to:'story_castle',exit:{x:130,y:-35},entry:{x:-130,y:10},bend:{x:0,y:-108}},
 {from:'story_castle',to:'listening_forest',exit:{x:130,y:35},entry:{x:-130,y:-40},bend:{x:15,y:-88}},
 // Lands on the harbour's right-hand quay (it used to stop in the sky above the town).
 {from:'listening_forest',to:'speaking_harbor',exit:{x:10,y:125},entry:{x:130,y:-80},bend:{x:118,y:0}},
 {from:'speaking_harbor',to:'sentence_workshop',exit:{x:-130,y:-40},entry:{x:130,y:-10},bend:{x:-5,y:105}},
 {from:'sentence_workshop',to:'language_academy',exit:{x:-130,y:-30},entry:{x:120,y:-70},bend:{x:-3,y:105}},
 {from:'language_academy',to:'word_garden',exit:{x:-12,y:-135},entry:{x:-30,y:160},bend:{x:-141,y:0}}
];
export const ARCHIPELAGO_SKYBRIDGES:readonly SkybridgeRoute[]=PLANS.map(plan=>{
 const from=ARCHIPELAGO_ISLANDS_CATALOG[plan.from].defaultWorldPos;
 const to=ARCHIPELAGO_ISLANDS_CATALOG[plan.to].defaultWorldPos;
 const p0={x:from.x+plan.exit.x,y:from.y+plan.exit.y};
 const p1={x:to.x+plan.entry.x,y:to.y+plan.entry.y};
 return {
  from:plan.from,to:plan.to,p0,p1,
  ctrl:{x:(p0.x+p1.x)/2+plan.bend.x,y:(p0.y+p1.y)/2+plan.bend.y}
 };
});

/**
 * One hand-built timber material for all six segments (no faded placeholders):
 * honey planks over dark stringers, a visible deck thickness, oak posts with
 * hemp rope rails, warm lanterns and one festival pennant span per bridge.
 * Tones are sampled from the illustrated islands' own wooden docks and decks.
 */
export const ARCHIPELAGO_SKYBRIDGE_MATERIAL=Object.freeze({
 shadow:0x2f5f80,
 fascia:0x7c4a25,
 fasciaShade:0x5a3318,
 stringer:0x4f2d15,
 plankTones:Object.freeze([0xd29752,0xc4843f,0xdca865,0xbf7c3c] as const),
 plankHighlight:0xf6cf8e,
 plankEdge:0x5e3517,
 post:0x8d5a30,
 postShade:0x633b1c,
 postCap:0xc58f52,
 rope:0xe0bd84,
 ropeShade:0x7b5a33,
 ropeLight:0xfff0cc,
 lamp:0xffe7a6,
 lampGlass:0xffb547,
 lampFrame:0x4a2c14,
 lampHalo:0xffc764,
 pennants:Object.freeze([0xff6b5a,0xffc23d,0x3fcf8e,0x3aa8ff,0xb07cff] as const)
});

/** Construction sizes in world units (the camera shows them at ~0.55 on desktop). */
export const SKYBRIDGE_GEOMETRY=Object.freeze({
 deckHalf:21,        // half the deck width, edge to edge
 thickness:10,       // visible front face of the deck
 shadowDrop:46,      // the soft shadow cast on the sky below
 plankPitch:13,      // centre-to-centre plank distance along the bridge
 plankDepth:9.6,     // plank size along the bridge (gap = pitch - depth)
 postSpacing:78,     // rope posts, evenly spaced between the two end posts
 postInset:16,       // end posts stand just inside the island art
 postHeight:30,
 endPostHeight:40,
 ropeSag:5
});

export function skybridgePoint(route:SkybridgeRoute,t:number):SkybridgePoint{
 const u=1-t;
 return {
  x:u*u*route.p0.x+2*u*t*route.ctrl.x+t*t*route.p1.x,
  y:u*u*route.p0.y+2*u*t*route.ctrl.y+t*t*route.p1.y
 };
}
/** Unit direction of travel at t. */
export function skybridgeTangent(route:SkybridgeRoute,t:number):SkybridgePoint{
 const dx=2*(1-t)*(route.ctrl.x-route.p0.x)+2*t*(route.p1.x-route.ctrl.x);
 const dy=2*(1-t)*(route.ctrl.y-route.p0.y)+2*t*(route.p1.y-route.ctrl.y);
 const length=Math.max(0.0001,Math.hypot(dx,dy));
 return {x:dx/length,y:dy/length};
}
export function skybridgeNormal(route:SkybridgeRoute,t:number):SkybridgePoint{
 const tangent=skybridgeTangent(route,t);
 return {x:-tangent.y,y:tangent.x};
}

const SAMPLES=240;
/** Cumulative arc length at SAMPLES+1 evenly spaced t values. */
function arcTable(route:SkybridgeRoute):number[]{
 const table=[0];
 let previous=skybridgePoint(route,0);
 for(let i=1;i<=SAMPLES;i++){
  const p=skybridgePoint(route,i/SAMPLES);
  table.push(table[i-1]+Math.hypot(p.x-previous.x,p.y-previous.y));
  previous=p;
 }
 return table;
}
export function skybridgeLength(route:SkybridgeRoute):number{
 const table=arcTable(route);
 return table[table.length-1];
}
/** t at a given distance along the bridge (a quadratic's t is not evenly spaced). */
function tAtLength(table:number[],distance:number):number{
 const total=table[table.length-1];
 const d=Math.min(Math.max(distance,0),total);
 let lo=0,hi=table.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(table[mid]<d)lo=mid;else hi=mid;}
 const span=table[hi]-table[lo]||1;
 return (lo+(d-table[lo])/span)/SAMPLES;
}

export interface SkybridgeStation{
 t:number;
 point:SkybridgePoint;
 tangent:SkybridgePoint;
 normal:SkybridgePoint;
}
function station(route:SkybridgeRoute,t:number):SkybridgeStation{
 const tangent=skybridgeTangent(route,t);
 return {t,point:skybridgePoint(route,t),tangent,normal:{x:-tangent.y,y:tangent.x}};
}
/** Deterministic 0..1 value so every bridge looks the same on every visit. */
function grain(seed:number):number{
 const x=Math.sin(seed*12.9898+78.233)*43758.5453;
 return x-Math.floor(x);
}
function routeSeed(route:SkybridgeRoute):number{
 let seed=0;
 for(const ch of route.from+route.to)seed=(seed*31+ch.charCodeAt(0))%100003;
 return seed;
}

export interface SkybridgePlank extends SkybridgeStation{
 /** Index into ARCHIPELAGO_SKYBRIDGE_MATERIAL.plankTones. */
 tone:number;
 /** Hand-cut variation: extra half-length (world units) and a tiny twist (radians). */
 lengthJitter:number;
 twist:number;
}
/** Planks evenly spaced along the whole bridge, ends included (they tuck under the islands). */
export function skybridgePlanks(route:SkybridgeRoute):SkybridgePlank[]{
 const table=arcTable(route),total=table[table.length-1];
 const pitch=SKYBRIDGE_GEOMETRY.plankPitch;
 const count=Math.max(2,Math.floor(total/pitch));
 const start=(total-(count-1)*pitch)/2;
 const seed=routeSeed(route);
 const planks:SkybridgePlank[]=[];
 for(let k=0;k<count;k++){
  const base=station(route,tAtLength(table,start+k*pitch));
  planks.push({
   ...base,
   tone:Math.floor(grain(seed+k*7.1)*ARCHIPELAGO_SKYBRIDGE_MATERIAL.plankTones.length),
   lengthJitter:(grain(seed+k*3.7)-0.5)*3.4,
   twist:(grain(seed+k*5.3)-0.5)*0.07
  });
 }
 return planks;
}
/** Rope posts: one at each end and evenly spaced between, ~postSpacing apart. */
export function skybridgePosts(route:SkybridgeRoute):SkybridgeStation[]{
 const table=arcTable(route),total=table[table.length-1];
 const {postInset,postSpacing}=SKYBRIDGE_GEOMETRY;
 const span=total-2*postInset;
 const gaps=Math.max(2,Math.round(span/postSpacing));
 const posts:SkybridgeStation[]=[];
 for(let i=0;i<=gaps;i++)posts.push(station(route,tAtLength(table,postInset+span*i/gaps)));
 return posts;
}
/** A rope hung between two points, sagging downwards on screen by `sag` at its middle. */
export function skybridgeRope(a:SkybridgePoint,b:SkybridgePoint,sag:number,segments=10):SkybridgePoint[]{
 const control={x:(a.x+b.x)/2,y:(a.y+b.y)/2+2*sag};
 const points:SkybridgePoint[]=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,u=1-t;
  points.push({x:u*u*a.x+2*u*t*control.x+t*t*b.x,y:u*u*a.y+2*u*t*control.y+t*t*b.y});
 }
 return points;
}
