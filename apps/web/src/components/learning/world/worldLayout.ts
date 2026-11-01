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
  frog:{x:1200,y:605}, bee:{x:660,y:236}, butterfly:{x:1220,y:421}
};
const HABITAT_POSITIONS:Record<string,Point> = {
  Ev:{x:315,y:330},Bahçe:{x:505,y:295},Ağaç:{x:730,y:275},
  Çayır:{x:905,y:335},Çiftlik:{x:380,y:750},Gölet:{x:1100,y:670},
  Çiçeklik:{x:950,y:790}
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
  return [...new Set(ids)].filter(id=>Boolean(HABITAT_POSITIONS[placeFor(id)])).map(id=>({
    id,kind:'habitat' as const,label:placeFor(id),...HABITAT_POSITIONS[placeFor(id)]
  }));
}
export function getDistrictObjects(colorsUnlocked:boolean):WorldObject[]{
  return DISTRICTS.map(d=>d.id==='colors'?{...d,unlocked:colorsUnlocked}:({...d}));
}
