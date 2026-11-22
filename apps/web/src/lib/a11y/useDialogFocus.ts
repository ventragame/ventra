'use client';
import {useEffect,type RefObject} from 'react';

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
 useEffect(()=>{
  const dialog=ref.current;
  if(!active||!dialog)return;
  const opener=document.activeElement instanceof HTMLElement&&!dialog.contains(document.activeElement)
   ?document.activeElement:null;
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
   if(opener?.isConnected)opener.focus({preventScroll:true});
  };
 },[ref,active]);
}
