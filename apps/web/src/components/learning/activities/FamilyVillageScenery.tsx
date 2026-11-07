'use client';
import type {VillageDistrict} from '@/lib/learning/familyVillageEngine';

const VILLAGE_WORLD_ART:Record<VillageDistrict,string>={
 family:'/assets/family-village/scenes/family-v3.svg',
 rooms:'/assets/family-village/scenes/rooms-v3.svg',
 objects:'/assets/family-village/scenes/objects-v3.svg',
 routines:'/assets/family-village/scenes/routines-v3.svg'
};
/** The family district displays exact cropped images from the approved reference (desktop and mobile). The other districts retain distinct local scenes. Decorative only. Word/answer controls
 * remain native buttons with keyboard and screen-reader accessibility. */
export function FamilyVillageScenery({district}:{district:VillageDistrict}){
 return <div className="fv3-landscape" aria-hidden="true">
  {district==='family'?<picture>
    <source media="(max-width: 680px)"
      srcSet="/assets/family-village/reference-v5/village-storybook-hero-mobile.webp" type="image/webp"/>
    <img src="/assets/family-village/reference-v5/village-storybook-hero.webp" alt="" draggable={false}
      loading="eager" decoding="async" fetchPriority="high"/>
  </picture>:<img src={VILLAGE_WORLD_ART[district]} alt="" draggable={false} decoding="async"/>}
  <span className="fv3-light fv3-light-one"/>
  <span className="fv3-light fv3-light-two"/>
 </div>;
}
