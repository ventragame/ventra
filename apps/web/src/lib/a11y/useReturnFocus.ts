'use client';
import {useEffect,useRef} from 'react';
import {focusIsLost} from './focusLost.ts';

/** Stable key of the control focus was on, if it (or its ancestor) carries `data-return-focus`. */
export function returnFocusKey(active:Element|null):string|null{
 const owner=active&&typeof active.closest==='function'?active.closest('[data-return-focus]'):null;
 return owner?.getAttribute('data-return-focus')||null;
}

/** First connected, enabled control carrying one of `keys` (in key order). */
export function findReturnTarget(root:ParentNode,keys:readonly string[]):HTMLElement|null{
 const candidates=[...root.querySelectorAll<HTMLElement>('[data-return-focus]')]
  .filter(el=>el.isConnected&&!(el as HTMLButtonElement).disabled&&!el.closest('[inert]'));
 for(const key of keys){
  const match=candidates.find(el=>el.getAttribute('data-return-focus')===key);
  if(match)return match;
 }
 return null;
}

/** Fully on screen with room for its focus ring (a card flush with the bottom edge is not). */
export function comfortablyVisible(el:Element,margin=16):boolean{
 const r=el.getBoundingClientRect(),height=document.documentElement.clientHeight||window.innerHeight;
 return r.top>=margin&&r.bottom<=height-margin;
}

/**
 * View-switch focus contract (P2 a11y audit). Screens like the Word Garden
 * replace their overview with a full-screen game, so the button that opened the
 * game no longer exists when the child comes back and keyboard focus used to
 * fall to <body>. While the overview is still rendered, this remembers the
 * opener's stable `data-return-focus` key; when `view` returns to `home`, it
 * focuses the new control with that key, else the entry `view:<game>`, and only
 * while focus is lost. Keyboard users get it centred when it is off screen or
 * flush with an edge (it matches :focus-visible); pointer and touch users see
 * no scroll and no ring.
 */
export function useReturnFocus(view:string,home:string){
 const previous=useRef(view);
 const opener=useRef<string|null>(null);
 // Read while rendering the switch: after commit the opener is already gone.
 if(previous.current===home&&view!==home&&typeof document!=='undefined')opener.current=returnFocusKey(document.activeElement);
 useEffect(()=>{
  const from=previous.current;
  previous.current=view;
  if(view!==home||from===home)return;
  const keys=[opener.current,'view:'+from].filter((key):key is string=>!!key);
  opener.current=null;
  let frames=0,frame=0;
  const restore=()=>{
   if(!focusIsLost(document.activeElement))return;
   const target=findReturnTarget(document,keys);
   if(target){
    target.focus({preventScroll:true});
    let keyboard=false;
    try{keyboard=target.matches(':focus-visible');}catch{/* older engines: no scroll */}
    if(keyboard&&document.activeElement===target&&!comfortablyVisible(target))target.scrollIntoView({block:'center'});
    return;
   }
   // The overview may still be loading its progress (buttons disabled).
   if(++frames<30)frame=requestAnimationFrame(restore);
  };
  frame=requestAnimationFrame(restore);
  return()=>cancelAnimationFrame(frame);
 },[view,home]);
}
