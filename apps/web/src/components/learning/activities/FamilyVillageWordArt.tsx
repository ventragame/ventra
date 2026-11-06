'use client';
import {villageWord} from '@/lib/learning/familyVillageEngine';

/** 60 original, coherent, self-hosted vector illustrations with no emoji
 * fallback, external image host or expensive rendering dependency. */
export function FamilyWordArt({id}:{id:string}){
 const word=villageWord(id);
 const symbol=id.replace(/\s+/g,'-');
 return <svg className="fv3-word-art" viewBox="0 0 200 200"
   xmlns="http://www.w3.org/2000/svg" role="img" aria-label={word.tr} focusable="false">
   <use href={`/assets/family-village/family-word-sprite-v3.svg#fv-${symbol}`}/>
 </svg>;
}
