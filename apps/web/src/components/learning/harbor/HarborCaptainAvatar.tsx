'use client';

import {useEffect,useRef} from 'react';
import './harbor-captain-avatar.css';

/** The harbor speakers, painted in the same style as the harbor scenes and the
 * other islands' characters. Moods are body language (breathing, talking bob,
 * listening lean, hop, gentle shake, celebration jump), not lip sync. */
export type HarborCaptainMood='idle'|'listen'|'talk'|'happy'|'try_again'|'celebrate';
export const HARBOR_CAPTAIN_MOODS:readonly HarborCaptainMood[]=['idle','listen','talk','happy','try_again','celebrate'];
export type HarborActorId='leo'|'parrot'|'turtle'|'fox'|'rabbit';

/** Leo and Luna are harbor originals; Mimi, Nino and the shopkeeper fox are the
 * same painted animals children meet in Hayvan Çayırı and Hikâye Ormanı. */
export const HARBOR_CAST_ART:Readonly<Record<HarborActorId,string>>={
 leo:'/assets/characters/painted/harbor-leo.webp',
 parrot:'/assets/animals/painted/parrot.webp',
 turtle:'/assets/animals/painted/turtle.webp',
 fox:'/assets/story-forest/premium/characters/fox_orange.webp',
 rabbit:'/assets/characters/painted/harbor-luna.webp'
};

/** One-shot reactions; looping moods (idle/listen/talk) live in CSS. */
const REACTIONS:Partial<Record<HarborCaptainMood,{frames:Keyframe[];duration:number}>>={
 happy:{duration:700,frames:[
  {transform:'translateY(0) scale(1,1)'},{transform:'translateY(0) scale(1.06,.92)',offset:.18},
  {transform:'translateY(-9%) scale(.97,1.04)',offset:.48},{transform:'translateY(0) scale(1.03,.97)',offset:.8},
  {transform:'translateY(0) scale(1,1)'}]},
 try_again:{duration:760,frames:[
  {transform:'rotate(0)'},{transform:'rotate(-4deg)',offset:.2},{transform:'rotate(3.5deg)',offset:.45},
  {transform:'rotate(-2deg)',offset:.7},{transform:'rotate(0)'}]},
 celebrate:{duration:1100,frames:[
  {transform:'translateY(0) rotate(0) scale(1)'},{transform:'translateY(0) scale(1.07,.9)',offset:.12},
  {transform:'translateY(-14%) rotate(-6deg) scale(1.03)',offset:.38},{transform:'translateY(0) scale(1.05,.94)',offset:.6},
  {transform:'translateY(-6%) rotate(5deg)',offset:.8},{transform:'translateY(0) rotate(0) scale(1)'}]}
};

interface Props {
 mood:HarborCaptainMood;
 /** Changes when something new happens, so the same reaction can play again. */
 cue?:string|number;
 className?:string;
}
interface CastProps extends Props{ actor:HarborActorId; }

/** Decorative only: the spoken line is always in the speech card next to it.
 * This visual component has no access to child recordings or transcripts. */
export function HarborCharacterAvatar({actor,mood,cue,className=''}:CastProps){
 const body=useRef<HTMLSpanElement|null>(null);
 useEffect(()=>{
  const reaction=REACTIONS[mood];
  const element=body.current;
  if(!reaction||!element||typeof element.animate!=='function'||document.hidden)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const animation=element.animate(reaction.frames,{duration:reaction.duration,easing:'cubic-bezier(.3,.7,.3,1)'});
  return()=>animation.cancel();
 },[mood,cue]);
 return <span className={'harbor-captain-avatar '+className}
  aria-hidden="true" data-actor={actor} data-mood={mood}>
   <span ref={body} className="harbor-captain-avatar-motion">
    <img src={HARBOR_CAST_ART[actor]} alt="" draggable={false} decoding="async"
     className="harbor-captain-avatar-static"/>
   </span>
  </span>;
}

/** Map/finale keep the canonical captain without creating another speaker. */
export function HarborCaptainAvatar(props:Props){
 return <HarborCharacterAvatar actor="leo" {...props}/>;
}
