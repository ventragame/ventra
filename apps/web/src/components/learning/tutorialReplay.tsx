'use client';
import React,{createContext,useContext,useEffect,useLayoutEffect} from 'react';
import './tutorial-replay.css';

/**
 * Lets a game's own help panel replay the first-play tutorial. While at least
 * one in-game panel offers it, the floating "reopen tutorial" button is not
 * shown: measured at 320/390px it covered the quest counter (Food Market,
 * Family Village, Temple) and Animal Meadow's own help button. Games without
 * an in-game help panel keep the floating button as a fallback.
 */
export interface TutorialReplay{replay:()=>void;registerHost:()=>()=>void}
export const TutorialReplayContext=createContext<TutorialReplay|null>(null);

// Register before paint so the floating fallback never flashes over the game.
const useIsomorphicLayoutEffect=typeof window==='undefined'?useEffect:useLayoutEffect;

export function TutorialReplayButton(){
 const tutorial=useContext(TutorialReplayContext);
 useIsomorphicLayoutEffect(()=>tutorial?.registerHost(),[tutorial]);
 if(!tutorial)return null;
 return <button type="button" className="tutorial-replay-button" onClick={event=>{
  event.currentTarget.closest('details')?.removeAttribute('open');
  tutorial.replay();
 }}><span aria-hidden="true">🎓</span> Öğretimi tekrar oyna</button>;
}
