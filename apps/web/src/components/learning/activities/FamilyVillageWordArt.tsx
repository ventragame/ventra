'use client';
import {villageWord} from '@/lib/learning/familyVillageEngine';

/**
 * All fifteen family vocabulary concepts have their own self-hosted WebP
 * illustration. Do not reuse a different relation's portrait as a fallback:
 * that would make distinct advanced vocabulary visually indistinguishable.
 *
 * Kinship is contextual and cannot be inferred solely from someone's face;
 * family visual-choice questions therefore retain the Turkish relation label.
 */
const CHARACTER_CAMEOS:Readonly<Record<string,string>>={
  mother:'mother',father:'father',sister:'sister',brother:'brother',
  baby:'baby',grandmother:'grandmother',grandfather:'grandfather',
  family:'family',
  aunt:'aunt',uncle:'uncle',cousin:'cousin',
  parents:'parents',daughter:'daughter',son:'son',grandchild:'grandchild'
};

export function familyCharacterArtPath(id:string):string|null{
  const name=CHARACTER_CAMEOS[id];
  return name ? `/assets/family-village/characters-v6/${name}.webp` : null;
}

/** All mission views share the exact same illustration for a concept. */
export function FamilyWordArt({id}:{id:string}){
  const word=villageWord(id);
  const art=word.district==='family'?familyCharacterArtPath(id):null;
  if(art){
    return <img src={art}
      alt={word.tr} className="fv3-word-art fv6-character-art"
      width={512} height={512} draggable={false} decoding="async"/>;
  }
  const symbol=id.replace(/\s+/g,'-');
  return <svg className="fv3-word-art" viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label={word.tr} focusable="false">
    <use href={`/assets/family-village/family-word-sprite-v3.svg#fv-${symbol}`}/>
  </svg>;
}
