'use client';
import {villageWord} from '@/lib/learning/familyVillageEngine';

/** 60 original, coherent, self-hosted vector illustrations with no emoji
 * fallback, external image host or expensive rendering dependency. */
export function FamilyWordArt({id}:{id:string}){
 const word=villageWord(id);
 // This portrait is extracted from the approved Aile Köyü reference, not a
 // generic vector substitute. Other words retain their own bundled art.
 if(id==='grandmother')return <img className="fv3-word-art fv5-grandmother-art"
   src="/assets/family-village/reference-v5/village-grandmother-card.webp"
   alt={word.tr} draggable={false} decoding="async"/>;
 const symbol=id.replace(/\s+/g,'-');
 return <svg className="fv3-word-art" viewBox="0 0 200 200"
   xmlns="http://www.w3.org/2000/svg" role="img" aria-label={word.tr} focusable="false">
   <use href={`/assets/family-village/family-word-sprite-v3.svg#fv-${symbol}`}/>
 </svg>;
}
