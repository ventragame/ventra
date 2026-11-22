'use client';
import {useEffect,useRef,type RefObject} from 'react';
import {installFocusMemory,lastFocusedElement} from './focusMemory.ts';

installFocusMemory();

const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),'+
 'textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

/** Visible, enabled controls inside the dialog, in tab order. */
export function dialogFocusables(dialog:ParentNode):HTMLElement[]{
 return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
  .filter(el=>!el.closest('[inert],[hidden],[aria-hidden="true"]')&&el.getClientRects().length>0);
}

/**
 * Modal dialog focus contract (P2 a11y audit): on open, focus moves into the
 * dialog unless it is already there (never scrolling the page); Tab and
 * Shift+Tab stay inside; on close, focus returns to the control that opened
 * it. Nested dialogs rendered outside `ref` (e.g. a parental gate) keep their
 * own focus handling.
 */
export function useDialogFocus(ref:RefObject<HTMLElement|null>,active=true){
 // The opener is read while rendering the opening frame: by the time effects
 // run, an autoFocus control inside the dialog has already taken focus.
 const opener=useRef<HTMLElement|null>(null);
 const wasActive=useRef(false);
 if(active&&!wasActive.current&&typeof document!=='undefined'){
  const current=document.activeElement;
  opener.current=current instanceof HTMLElement&&current!==document.body?current:lastFocusedElement();
 }
 wasActive.current=active;
 // Each activation gets a number; a restore scheduled by an earlier cleanup is
 // dropped when the same dialog was activated again in between (React Strict
 // Mode runs effects twice in development, which used to pull focus out of a
 // freshly opened nested dialog and back onto its opener).
 const generation=useRef(0);
 useEffect(()=>{
  const dialog=ref.current;
  if(!active||!dialog)return;
  const run=++generation.current;
  const openedFrom=opener.current;
  if(!dialog.contains(document.activeElement)){
   if(!dialog.hasAttribute('tabindex'))dialog.tabIndex=-1;
   dialog.focus({preventScroll:true});
  }
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key!=='Tab')return;
   const items=dialogFocusables(dialog);
   if(!items.length){event.preventDefault();return;}
   const first=items[0],last=items[items.length-1],current=document.activeElement;
   if(event.shiftKey&&(current===first||current===dialog)){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&current===last){event.preventDefault();first.focus();}
  };
  dialog.addEventListener('keydown',onKeyDown);
  return()=>{
   dialog.removeEventListener('keydown',onKeyDown);
   // Give focus back only while it is still lost (never steal it). The page
   // may need a few frames to unlock its background (inert/visibility), during
   // which focus() is refused, so retry for up to ~0.5 s.
   if(!openedFrom)return;
   let frames=0;
   const restore=()=>{
    if(generation.current!==run)return;
    const now=document.activeElement;
    const lost=!now||now===document.body||!now.isConnected||dialog.contains(now);
    if(!lost||!openedFrom.isConnected)return;
    if(!openedFrom.closest('[inert]'))openedFrom.focus({preventScroll:true});
    if(document.activeElement!==openedFrom&&++frames<30)requestAnimationFrame(restore);
   };
   requestAnimationFrame(restore);
  };
 },[ref,active]);
}
