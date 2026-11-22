'use client';

import {useEffect,useRef} from 'react';
import {focusIsLost} from '../../../lib/a11y/focusLost.ts';

/** True when keyboard focus has nowhere useful to be: on <body>, on a node that
 * was removed with the previous question, or on a control that was just disabled. */
export const questionFocusLost=focusIsLost;

/**
 * Shared Kelime Bahçesi focus rule (P1 a11y audit). When a new question
 * appears, the answer the child chose is usually gone, which left keyboard,
 * switch and screen-reader players on <body>. This moves focus to the new
 * question's prompt only in that case: it never steals focus from a control
 * that still exists, never scrolls, and does nothing on the first render.
 * Each game keeps its own markup; attach the returned ref to its prompt.
 */
export function useQuestionFocus<T extends HTMLElement>(questionKey:string|number|null|undefined){
 const target=useRef<T>(null);
 const previous=useRef(questionKey);
 useEffect(()=>{
  if(previous.current===questionKey)return;
  previous.current=questionKey;
  const frame=requestAnimationFrame(()=>{
   const node=target.current;
   if(!node?.isConnected||!questionFocusLost(document.activeElement))return;
   if(!node.hasAttribute('tabindex'))node.tabIndex=-1;
   node.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
 },[questionKey]);
 return target;
}
