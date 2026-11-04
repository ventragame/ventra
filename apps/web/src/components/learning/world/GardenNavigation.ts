/** Pure, deterministic, authored road network for the storybook garden.
 * All routes are world-space coordinates shared with the illustrated map.
 * No external navigation requests or child location data are involved. */
import type {Point} from './worldLayout';

export const GARDEN_ROAD_NODES={
 center:{x:675,y:647},
 bridge:{x:745,y:662},
 market:{x:598,y:566},
 meadowTurn:{x:466,y:486},
 meadowGate:{x:353,y:433},
 animals:{x:290,y:407},
 colorsFork:{x:531,y:419},
 colors:{x:505,y:280},
 numberFork:{x:717,y:449},
 numbers:{x:826,y:358},
 templeBridge:{x:972,y:336},
 sanctuary:{x:1150,y:246},
 familyBridge:{x:878,y:642},
 family:{x:1130,y:651}
} as const;
export type RoadNodeId=keyof typeof GARDEN_ROAD_NODES;
export const GARDEN_ROAD_EDGES:readonly (readonly [RoadNodeId,RoadNodeId])[]=[
 ['center','market'],['center','bridge'],['market','meadowTurn'],
 ['meadowTurn','meadowGate'],['meadowGate','animals'],
 ['meadowTurn','colorsFork'],['colorsFork','colors'],
 ['market','numberFork'],['numberFork','numbers'],
 ['numbers','templeBridge'],['templeBridge','sanctuary'],
 ['bridge','familyBridge'],['familyBridge','family'],
 ['market','colorsFork'],['bridge','numberFork']
];
export const GARDEN_DESTINATION_NODES:Record<string,RoadNodeId>={
 animals:'animals',colors:'colors',numbers:'numbers',
 food:'market',family:'family',sanctuary:'sanctuary'
};
export const ROAD_CLEARANCE=55;
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function closestRoadPoint(point:Point):{point:Point;distance:number;from:RoadNodeId;to:RoadNodeId}{
 let best:{point:Point;distance:number;from:RoadNodeId;to:RoadNodeId}|null=null;
 for(const [from,to] of GARDEN_ROAD_EDGES){
  const a=GARDEN_ROAD_NODES[from],b=GARDEN_ROAD_NODES[to];
  const vx=b.x-a.x,vy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((point.x-a.x)*vx+(point.y-a.y)*vy)/(vx*vx+vy*vy)));
  const projected={x:a.x+vx*t,y:a.y+vy*t};
  const distance=dist(point,projected);
  if(!best||distance<best.distance)best={point:projected,distance,from,to};
 }
 // Edges are a static nonempty authored graph.
 return best!;
}
export function isGardenWalkable(point:Point):boolean {
 if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
 if(point.x<55||point.y<65||point.x>1345||point.y>880)return false;
 if(closestRoadPoint(point).distance<=ROAD_CLEARANCE)return true;
 // Each image portal has a small reachable forecourt; never walk into its centre.
 return Object.values(GARDEN_ROAD_NODES).some(node=>dist(node,point)<95);
}
function shortestGraphRoute(from:RoadNodeId,to:RoadNodeId):RoadNodeId[]{
 if(from===to)return [from];
 const open=new Set<RoadNodeId>(Object.keys(GARDEN_ROAD_NODES) as RoadNodeId[]);
 const cost=new Map<RoadNodeId,number>([[from,0]]);
 const previous=new Map<RoadNodeId,RoadNodeId>();
 while(open.size){
  let current:RoadNodeId|undefined;
  for(const candidate of open)
   if(cost.has(candidate)&&(!current||cost.get(candidate)!<cost.get(current)!))current=candidate;
  if(!current)break;
  if(current===to)break;
  open.delete(current);
  for(const [a,b] of GARDEN_ROAD_EDGES){
   const neighbor=a===current?b:b===current?a:null;
   if(!neighbor||!open.has(neighbor))continue;
   const next=cost.get(current)!+dist(GARDEN_ROAD_NODES[current],GARDEN_ROAD_NODES[neighbor]);
   if(next<(cost.get(neighbor)??Infinity)){
    cost.set(neighbor,next);previous.set(neighbor,current);
   }
  }
 }
 if(!cost.has(to))return [];
 const route:RoadNodeId[]=[to];
 while(route[0]!==from){
  const prev=previous.get(route[0]);if(!prev)return [];
  route.unshift(prev);
 }
 return route;
}
function bestRoadEntry(point:Point):{entry:Point;node:RoadNodeId}{
 const nearest=closestRoadPoint(point);
 const a=GARDEN_ROAD_NODES[nearest.from],b=GARDEN_ROAD_NODES[nearest.to];
 return {entry:nearest.point,node:dist(nearest.point,a)<dist(nearest.point,b)?nearest.from:nearest.to};
}
function compactRoute(points:Point[]):Point[]{
 return points.filter((p,i)=>i===0||dist(p,points[i-1])>3);
}
/** Route from current position to a district's reachable entrance.
 * The entrance remains 76 units below its landmark for safe interaction.
 */
export function planGardenRoute(from:Point,districtId:string,destination:Point):Point[]{
 const goal=GARDEN_DESTINATION_NODES[districtId];
 if(!goal||!Number.isFinite(from.x)||!Number.isFinite(from.y))return [];
 const entrance={x:destination.x,y:destination.y+76};
 if(dist(from,entrance)<85)return [entrance];
 const start=bestRoadEntry(from);
 const segments=shortestGraphRoute(start.node,goal);
 if(!segments.length)return [];
 const route=[
  ...(dist(from,start.entry)>6?[start.entry]:[]),
  ...segments.map(id=>({...GARDEN_ROAD_NODES[id]})),
  entrance
 ];
 return compactRoute(route);
}
/** Free tapping snaps to a road, rather than guiding the character through buildings/water. */
export function planGardenTapRoute(from:Point,tap:Point):Point[]{
 const nearest=closestRoadPoint(tap);
 const target=nearest.point;
 if(dist(from,target)<24)return [];
 const start=bestRoadEntry(from);
 const finish=bestRoadEntry(target);
 const segments=shortestGraphRoute(start.node,finish.node);
 return compactRoute([
  ...(dist(from,start.entry)>6?[start.entry]:[]),
  ...segments.map(id=>({...GARDEN_ROAD_NODES[id]})),target
 ]);
}
