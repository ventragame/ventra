/** True when keyboard focus has nowhere useful to be: on <body>, on a node that
 * was removed (the chosen answer, a closed game), or on a control that was just
 * disabled. Focus helpers only ever move focus in this case, so they never take
 * it away from a control the child is still using. */
export function focusIsLost(active:Element|null):boolean{
 if(!active||active===document.body||active===document.documentElement||!active.isConnected)return true;
 if(active instanceof HTMLButtonElement||active instanceof HTMLInputElement)return active.disabled;
 return active.getAttribute('aria-disabled')==='true';
}
