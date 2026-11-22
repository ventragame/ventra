'use client';
import {useEffect,type DependencyList,type RefObject} from 'react';

/**
 * When the focused control disappears (a form step or a confirmation panel is
 * replaced, a signed-in view becomes signed-out), the browser drops focus to
 * <body>: Escape no longer reaches the dialog and Tab walks the page behind
 * it. After each listed change, focus returns to the dialog itself — only if
 * it was lost, never taking it from another control or a nested dialog.
 */
export function useFocusRescue(ref:RefObject<HTMLElement|null>,active:boolean,deps:DependencyList){
 useEffect(()=>{
  if(!active)return;
  const frame=requestAnimationFrame(()=>{
   const dialog=ref.current,current=document.activeElement;
   if(!dialog||(current&&current!==document.body))return;
   if(!dialog.hasAttribute('tabindex'))dialog.tabIndex=-1;
   dialog.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[active,ref,...deps]);
}
