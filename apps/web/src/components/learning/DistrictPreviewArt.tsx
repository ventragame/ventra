'use client';
import React from 'react';
import type {GardenDistrictId} from './world/gardenTheme';

/**
 * Distinct, locally hosted storybook WebP illustrations, never a remote fetch.
 * Mobile chooses an independently optimized asset. Parent world cards expose
 * the full accessible name, progress and status; artwork is decorative.
 */
export function DistrictPreviewArt({id}:{id:GardenDistrictId}){
 const description=id==='animals'?'Hayvanlarla dolu çayır':
  id==='colors'?'Işıltılı renk korusu':
  id==='numbers'?'Kristal sayı vadisi':
  id==='food'?'Meyve ve ekmek tezgâhlı pazar':
  id==='family'?'Renkli aile köyü':
  id==='sanctuary'?'Işıklı keşif tapınağı':'Kelime Bahçesi';
 const base='/assets/word-garden/modular-v4/'+id;
 return <picture className="wg-card-media" title={description}>
  <source media="(max-width: 630px)" type="image/webp" srcSet={base+'.webp'}/>
  <img className="wg-card-artwork" src={base+'.webp'} width={720} height={360}
   alt="" aria-hidden="true" loading="lazy" decoding="async"/>
 </picture>;
}
