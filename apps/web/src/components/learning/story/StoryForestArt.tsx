
import React from 'react';
import type {ForestActorId,ForestScene} from '@/lib/learning/storyForestEngine';

/** Every animal a story game can show is a painted WebP of its real English
 * identity: a fox is never drawn as a cat, and no animal falls back to a flat
 * vector. Only the simple objects below keep vector art.
 */
const PREMIUM_ROOT='/assets/story-forest/premium/';
const STORY_OBJECTS=['red_apple','yellow_star','blue_balloon','pink_flower','purple_flower','green_leaf'] as const;
type StoryObjectId=typeof STORY_OBJECTS[number];
export type StoryAnimalId=Exclude<ForestActorId,StoryObjectId>;
/** Exhaustive on purpose: an animal without painted art is a TypeScript error. */
export const PREMIUM_STORY_CHARACTERS:Readonly<Record<StoryAnimalId,string>> = Object.freeze({
 rabbit:'characters/rabbit_adventurer.webp',
 rabbit_reading:'characters/rabbit_reading.webp',
 rabbit_tree:'characters/rabbit_tree.webp',
 rabbit_rock:'characters/rabbit_rock.webp',
 rabbit_pond:'characters/rabbit_pond.webp',
 squirrel:'characters/squirrel_acorn.webp',
 bird:'characters/blue_bird_flying.webp',
 bird_flying:'characters/blue_bird_flying.webp',
 cat:'characters/cat_orange.webp',
 cat_gray_sleeping:'characters/cat_gray_sleeping.webp',
 cat_white_bow:'characters/cat_white_bow.webp',
 hedgehog:'characters/hedgehog_happy.webp',
 fox:'characters/fox_orange.webp',
 fox_running:'characters/fox_running.webp',
 deer:'characters/deer_antlers.webp',
 bear:'characters/bear_cub.webp',
 bear_sleeping:'characters/bear_sleeping.webp',
 dog:'characters/dog_puppy.webp',
 fish:'characters/fish_orange.webp',
 butterfly:'characters/butterfly_colourful.webp'
});
function isStoryObject(id:ForestActorId):id is StoryObjectId{
 return (STORY_OBJECTS as readonly string[]).includes(id);
}
export const PREMIUM_STORY_SCENES:Readonly<Record<ForestScene,string>> = Object.freeze({
 path:'scenes/forest_path.webp',
 treehouse:'scenes/forest_treehouse.webp',
 pond:'scenes/forest_pond.webp',
 meadow:'scenes/forest_meadow.webp',
 bridge:'scenes/forest_bridge.webp',
 camp:'scenes/forest_camp.webp'
});
export const STORY_FOREST_PREMIUM_COVER=PREMIUM_ROOT+'scenes/forest_clearing.webp';

/** All six worlds use unique illustrated WebP scenes. The exhaustive map
 * makes a missing environment a TypeScript error, not a flat SVG fallback.
 * Shared by Hikayeyi Kesfet, Sonra Ne Oldu and Hikaye Dedektifi.
 */
export function StoryForestScenery({scene}: {scene:ForestScene}){
 return <img className={'sf-scenery sf-premium-scenery sf-scene-'+scene}
  src={PREMIUM_ROOT+PREMIUM_STORY_SCENES[scene]} alt="" aria-hidden="true"
  draggable={false} decoding="async" loading="eager"/>;
}
export type StoryActorMotion='idle'|'listen'|'search'|'cheer';
export function StoryForestActor({id,motion}: {id:ForestActorId;motion?:StoryActorMotion}){
 if(!isStoryObject(id)){
  // Motion is opt-in and applies to staged premium art, not assessment cards.
  // All source WebP images remain the single canonical character identity.
  const motionClass=motion?
   ' sf-actor-motion sf-actor-'+motion+
    (id==='rabbit'?' sf-rabbit-motion sf-rabbit-'+motion:''):'';
  return <img className={'sf-actor-illustration sf-premium-actor'+motionClass}
   src={PREMIUM_ROOT+PREMIUM_STORY_CHARACTERS[id]} alt="" aria-hidden="true" draggable={false}
   decoding="async" loading="eager"/>;
 }
 // Only simple objects reach the vector art.
 return <svg className="sf-actor-illustration" viewBox="0 0 320 320" role="presentation" aria-hidden="true" focusable="false">
  <ellipse cx="159" cy="291" rx="90" ry="12" fill="#264f63" opacity=".15"/>
  {id==='red_apple'&&<g>
   <path d="M162 98Q103 68 78 117Q35 185 113 250Q143 274 163 263Q184 277 215 246Q285 164 247 113Q220 76 165 100Z"
     fill="#f35e6c" stroke="#c94d63" strokeWidth="9"/>
   <path d="M166 103Q162 72 184 57" stroke="#827d52" strokeWidth="9"/>
   <path d="M167 91Q203 48 246 77Q205 108 167 91" fill="#74c58b"/>
  </g>}
  {id==='yellow_star'&&<path d="M160 29L199 112L291 125L223 191L238 282L160 236L83 281L98 192L30 126L123 112Z" fill="#ffdc7a" stroke="#edb25c" strokeWidth="11"/>}
  {id==='blue_balloon'&&<g>
   <ellipse cx="160" cy="127" rx="89" ry="103" fill="#65c7f4" stroke="#438bd2" strokeWidth="10"/>
   <ellipse cx="128" cy="89" rx="19" ry="35" fill="#fff" opacity=".4"/>
   <path d="M160 231L148 254L171 254Z" fill="#dba983"/>
   <path d="M161 255Q111 277 173 313" fill="none" stroke="#a696bf" strokeWidth="6"/>
  </g>}
  {(id==='pink_flower'||id==='purple_flower')&&<g>
   {[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="160" cy="98" rx="43" ry="72"
     transform={'rotate('+angle+' 160 164)'} fill={id==='pink_flower'?'#f5a5d3':'#b7a4f0'}
     stroke={id==='pink_flower'?'#d98eb9':'#9389d6'} strokeWidth="7"/>)}
   <circle cx="160" cy="164" r="50" fill="#ffe6a4" stroke="#e7bf68" strokeWidth="8"/>
  </g>}
  {id==='green_leaf'&&<g>
   <path d="M45 268Q7 84 281 34Q330 249 45 268Z" fill="#90d79b" stroke="#51a381" strokeWidth="11"/>
   <path d="M51 265Q159 147 274 47" stroke="#d8f9c0" fill="none" strokeWidth="10"/>
  </g>}
 </svg>;
}
