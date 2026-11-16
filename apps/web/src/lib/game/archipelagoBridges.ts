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
 {from:'listening_forest',to:'speaking_harbor',exit:{x:10,y:125},entry:{x:30,y:-170},bend:{x:149,y:0}},
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
/** One premium bridge material for all six segments. No faded placeholders. */
export const ARCHIPELAGO_SKYBRIDGE_MATERIAL=Object.freeze({
 shadow:0x436b83,
 underside:0x94683d,
 stoneEdge:0xc48d4b,
 deck:0xf2d49b,
 highlight:0xffebbf,
 rails:0xfff5da,
 plankSeam:0x976a43,
 lampPost:0xb47a47,
 lamp:0xffe4a2,
 lampHalo:0xffd78b
});
export function skybridgePoint(route:SkybridgeRoute,t:number):SkybridgePoint{
 const u=1-t;
 return {
  x:u*u*route.p0.x+2*u*t*route.ctrl.x+t*t*route.p1.x,
  y:u*u*route.p0.y+2*u*t*route.ctrl.y+t*t*route.p1.y
 };
}
export function skybridgeNormal(route:SkybridgeRoute,t:number):SkybridgePoint{
 const dx=2*(1-t)*(route.ctrl.x-route.p0.x)+2*t*(route.p1.x-route.ctrl.x);
 const dy=2*(1-t)*(route.ctrl.y-route.p0.y)+2*t*(route.p1.y-route.ctrl.y);
 const length=Math.max(0.0001,Math.hypot(dx,dy));
 return {x:-dy/length,y:dx/length};
}
