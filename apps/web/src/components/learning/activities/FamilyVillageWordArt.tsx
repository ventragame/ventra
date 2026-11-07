'use client';
import {villageWord} from '@/lib/learning/familyVillageEngine';

/**
 * Eight production WebP cameos replace the inconsistent flat SVG / cut-out
 * portraits in Aile Köyü. All tier-0 roles have distinct authored artwork.
 *
 * More advanced kinship words express a relationship, not a unique appearance.
 * They intentionally reuse a familiar family member's cameo AND retain their
 * Turkish relationship label throughout visual-choice activities. Never infer
 * aunt, cousin, son etc. from appearance alone.
 */
const CHARACTER_CAMEOS:Readonly<Record<string,string>>={
  mother:'mother',father:'father',sister:'sister',brother:'brother',
  baby:'baby',grandmother:'grandmother',grandfather:'grandfather',
  family:'family',
  aunt:'mother',uncle:'father',cousin:'sister',
  parents:'family',daughter:'sister',son:'brother',grandchild:'baby'
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
