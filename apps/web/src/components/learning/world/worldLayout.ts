/** Pure world contract shared by Phaser, React accessibility controls and tests. */
export type WorldArea = 'garden' | 'meadow';
export type WorldObjectKind = 'district' | 'animal' | 'habitat';
export interface WorldObject {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: WorldObjectKind;
  unlocked?: boolean;
  image?: string;
  tint?: number;
}
export interface Point { x: number; y: number }
export const WORLD_WIDTH = 1400;
export const WORLD_HEIGHT = 940;
export const WALK_SPEED = 240;
export const INTERACTION_DISTANCE = 72;
export const PLAYER_START: Record<WorldArea,Point> = {
  garden:{x:680,y:480},
  meadow:{x:705,y:525}
};
export const DISTRICTS:readonly WorldObject[] = [
  {id:'animals',kind:'district',label:'Hayvan Çayırı',x:340,y:436,unlocked:true,tint:0x81da81},
  {id:'colors',kind:'district',label:'Renk Korusu',x:1080,y:470,unlocked:false,tint:0xec9bdb},
  {id:'numbers',kind:'district',label:'Sayı Vadisi',x:715,y:195,unlocked:false,tint:0x80cef4},
  {id:'food',kind:'district',label:'Lezzet Pazarı',x:1100,y:750,unlocked:false,tint:0xf1b577},
  {id:'family',kind:'district',label:'Aile Köyü',x:660,y:790,unlocked:false,tint:0xcab0ff},
  {id:'sanctuary',kind:'district',label:'Keşif Tapınağı',x:260,y:182,unlocked:false,tint:0x91ded2}
] as const;
export const ANIMAL_POSITIONS:Record<string,Point> = {
  cat:{x:332,y:314}, dog:{x:550,y:290}, bird:{x:795,y:248},
  rabbit:{x:1070,y:310}, cow:{x:320,y:620}, fish:{x:1100,y:703},
  horse:{x:504,y:785}, duck:{x:1000,y:650}, sheep:{x:774,y:756},
  frog:{x:1200,y:605}, bee:{x:660,y:236}, butterfly:{x:1220,y:421},
  lion:{x:150,y:215}, elephant:{x:980,y:145}, monkey:{x:180,y:710},
  penguin:{x:850,y:870}, turtle:{x:1300,y:800}, fox:{x:460,y:170},
  bear:{x:480,y:880}, owl:{x:1100,y:875},
  zebra:{x:130,y:130},
  giraffe:{x:395,y:130},
  panda:{x:660,y:130},
  tiger:{x:925,y:130},
  crocodile:{x:1190,y:130},
  hippo:{x:130,y:348},
  rhino:{x:395,y:348},
  kangaroo:{x:660,y:348},
  koala:{x:925,y:348},
  deer:{x:1190,y:348},
  wolf:{x:130,y:566},
  hedgehog:{x:395,y:566},
  squirrel:{x:660,y:566},
  snake:{x:925,y:566},
  dolphin:{x:1190,y:566},
  whale:{x:130,y:784},
  shark:{x:395,y:784},
  octopus:{x:660,y:784},
  crab:{x:925,y:784},
  parrot:{x:1190,y:784}
};
// One safe interaction point per animal. Multiple species may share
// a habitat type, but their quest targets must never overlap.
const HABITAT_POSITIONS:Record<string,Point> = {
  cat:{x:315,y:305},dog:{x:520,y:305},bird:{x:720,y:270},
  rabbit:{x:970,y:304},cow:{x:315,y:670},fish:{x:1110,y:670},
  horse:{x:520,y:772},duck:{x:1060,y:520},sheep:{x:770,y:750},
  frog:{x:1210,y:680},bee:{x:675,y:295},butterfly:{x:1150,y:400},
  lion:{x:150,y:235},elephant:{x:980,y:165},monkey:{x:180,y:730},
  penguin:{x:850,y:860},turtle:{x:1300,y:785},fox:{x:460,y:190},
  bear:{x:480,y:865},owl:{x:1100,y:860},
  zebra:{x:130,y:145},
  giraffe:{x:395,y:145},
  panda:{x:660,y:145},
  tiger:{x:925,y:145},
  crocodile:{x:1190,y:145},
  hippo:{x:130,y:363},
  rhino:{x:395,y:363},
  kangaroo:{x:660,y:363},
  koala:{x:925,y:363},
  deer:{x:1190,y:363},
  wolf:{x:130,y:581},
  hedgehog:{x:395,y:581},
  squirrel:{x:660,y:581},
  snake:{x:925,y:581},
  dolphin:{x:1190,y:581},
  whale:{x:130,y:799},
  shark:{x:395,y:799},
  octopus:{x:660,y:799},
  crab:{x:925,y:799},
  parrot:{x:1190,y:799}
};
export function clampToWorld(point:Point,margin=76):Point{
  return {x:Math.max(margin,Math.min(WORLD_WIDTH-margin,point.x)),
    y:Math.max(margin,Math.min(WORLD_HEIGHT-margin,point.y))};
}
export function distanceBetween(a:Point,b:Point):number{
  return Math.hypot(a.x-b.x,a.y-b.y);
}
/** Movement is framerate-independent, no teleportation and never exits the world. */
export function walkTowards(from:Point,to:Point,elapsedMs:number,speed=WALK_SPEED):Point {
  const dest=clampToWorld(to), start=clampToWorld(from);
  const dist=distanceBetween(start,dest);
  const step=Math.max(0,Math.min(dist,Math.min(80,elapsedMs)*speed/1000));
  if(dist===0)return start;
  return clampToWorld({x:start.x+(dest.x-start.x)*step/dist,
    y:start.y+(dest.y-start.y)*step/dist});
}
export function getAnimalObjects(ids:readonly string[], imageFor:(id:string)=>string|undefined):WorldObject[]{
  return [...new Set(ids)].filter(id=>Boolean(ANIMAL_POSITIONS[id])).map(id=>({
    id,label:id,kind:'animal' as const,...ANIMAL_POSITIONS[id],image:imageFor(id)
  }));
}
export function getHabitatObjects(ids:readonly string[],placeFor:(id:string)=>string):WorldObject[]{
  return [...new Set(ids)].filter(id=>Boolean(HABITAT_POSITIONS[id])).map(id=>({
    id,kind:'habitat' as const,label:placeFor(id),...HABITAT_POSITIONS[id]
  }));
}
export function getDistrictObjects(colorsUnlocked:boolean,numbersUnlocked=false,foodUnlocked=false,familyUnlocked=false,templeUnlocked=false):WorldObject[]{
  return DISTRICTS.map(d=>d.id==='colors'?{...d,unlocked:colorsUnlocked}:
    d.id==='numbers'?{...d,unlocked:colorsUnlocked&&numbersUnlocked}:
    d.id==='food'?{...d,unlocked:foodUnlocked}:
    d.id==='family'?{...d,unlocked:familyUnlocked}:
    d.id==='sanctuary'?{...d,unlocked:templeUnlocked}:{...d});
}
