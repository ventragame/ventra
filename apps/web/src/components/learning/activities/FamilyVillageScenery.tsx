'use client';
import type {VillageDistrict} from '@/lib/learning/familyVillageEngine';

const VILLAGE_WORLD_ART:Record<VillageDistrict,string>={
 family:'/assets/family-village/scenes/family-v3.svg',
 rooms:'/assets/family-village/scenes/rooms-v3.svg',
 objects:'/assets/family-village/scenes/objects-v3.svg',
 routines:'/assets/family-village/scenes/routines-v3.svg'
};
/** Four locally bundled fantasy scenes; decorative only. Word/answer controls
 * remain native buttons with keyboard and screen-reader accessibility. */
export function FamilyVillageScenery({district}:{district:VillageDistrict}){
 return <div className="fv3-landscape" aria-hidden="true">
  <img src={VILLAGE_WORLD_ART[district]} alt="" draggable={false} decoding="async"/>
  <span className="fv3-light fv3-light-one"/>
  <span className="fv3-light fv3-light-two"/>
 </div>;
}
