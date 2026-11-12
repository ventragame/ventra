import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VENTRA_AVATARS} from '../../../packages/shared/src/profile.ts';

const base=new URL('../src/components/profile/',import.meta.url);
const families=[
 ['AvatarArtHeroes.tsx',7,'heroes'],
 ['AvatarArtAnimals.tsx',11,'animals'],
 ['AvatarArtFantasy.tsx',10,'fantasy'],
 ['AvatarArtSpace.tsx',8,'space']
];

test('All 36 character IDs have precisely one original vector scene and no palette-only clones',()=>{
 const ids=new Set(VENTRA_AVATARS.map(a=>a.id));
 const seen=new Set();
 const shapes=new Set();
 for(const [filename,count] of families){
  const src=fs.readFileSync(new URL(filename,base),'utf8');
  const matches=[...src.matchAll(/^ (avatar_[a-z_]+):<g>/gm)];
  assert.equal(matches.length,count,filename+' must be hand-authored for every member');
  for(let i=0;i<matches.length;i++){
   const id=matches[i][1];
   assert.ok(ids.has(id),'Orphan artwork: '+id);
   assert.ok(!seen.has(id),'Repeated artwork: '+id);
   seen.add(id);
   const fragment=src.slice(matches[i].index,i+1<matches.length?matches[i+1].index:src.lastIndexOf('};'));
   const geometry=[...fragment.matchAll(/<(?:path|ellipse|circle|rect|polygon|g|Eyes|HumanFace|Smile|SmallStar)(?:\s|\/|>)/g)];
   assert.ok(geometry.length>=6,id+' must have a distinct anatomy and readable details');
   assert.match(fragment,/<path\b/,id+' needs a hand-drawn silhouette');
   // Ignore every palette choice and text formatting. Exact same drawing
   // with a different name/color will fail this regression guard.
   const structure=fragment
     .replace(/^ avatar_[a-z_]+:/,'')
     .replace(/#[0-9A-Fa-f]{3,8}/g,'#PALETTE')
     .replace(/\s+/g,'');
   assert.ok(!shapes.has(structure),'Palette-only duplicate avatar: '+id);
   shapes.add(structure);
  }
 }
 assert.equal(seen.size,ids.size,'Every catalog avatar has character-specific vector art');
 assert.deepEqual([...seen].sort(),[...ids].sort());
});

test('Art renderer composes only the selected character, never the old generic shared mannequin',()=>{
 const src=fs.readFileSync(new URL('AvatarPortrait.tsx',base),'utf8');
 assert.match(src,/HERO_ART/);
 assert.match(src,/ANIMAL_ART/);
 assert.match(src,/FANTASY_ART/);
 assert.match(src,/SPACE_ART/);
 assert.match(src,/data-avatar-id=\{avatar\.id\}/);
 assert.match(src,/const art=VENTRA_AVATAR_ART/);
 assert.doesNotMatch(src,/const animal=animals\.has/);
 assert.doesNotMatch(src,/ellipse cx="90" cy="92" rx=\{id/);
 assert.doesNotMatch(src,/\.emoji/);
});
