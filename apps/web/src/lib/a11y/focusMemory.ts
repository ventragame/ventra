'use client';

/**
 * Page-wide memory of the last focused element. Pages make their background
 * `inert` as soon as a modal opens, which blurs the opener before a lazily
 * loaded dialog renders; the dialog asks here whom to give focus back to.
 * Installed by the pages that open modal dialogs (side-effect import).
 */
let last:HTMLElement|null=null;
let installed=false;
export function installFocusMemory():void{
 if(installed||typeof document==='undefined')return;
 installed=true;
 document.addEventListener('focusin',event=>{
  if(event.target instanceof HTMLElement)last=event.target;
 },true);
}
export function lastFocusedElement():HTMLElement|null{
 return last?.isConnected?last:null;
}
installFocusMemory();
