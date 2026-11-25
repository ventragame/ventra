'use client';
import React,{useEffect,useRef,useState} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {storyRewardPraise,storyRewardStats} from '@/lib/learning/storyRewardSummary';
import './story-reward-recap.css';

/** Praise and round stats, shown under the reward stars. */
export function StoryRewardSummary({stars,mistakes,hints}:{stars:number;mistakes:number;hints:number}){
 return <div className="story-recap-summary">
  <p className="story-recap-praise">{storyRewardPraise(stars)}</p>
  <p className="story-recap-stats">{storyRewardStats(mistakes,hints)}</p>
 </div>;
}

/**
 * The story's English sentences, tap to hear each again. Shown under the
 * reward buttons so the next step stays in view. It only reads the finished
 * round; nothing is stored.
 */
export function StoryRewardLines({lines,rate=.9}:{lines:readonly string[];rate?:number}){
 const [playing,setPlaying]=useState<number|null>(null);
 const request=useRef(0);
 useEffect(()=>()=>{request.current++;soundService.cancelSpeech();},[]);
 function play(index:number){
  const id=++request.current;
  soundService.unlockAudio();
  setPlaying(index);
  const done=()=>{if(request.current===id)setPlaying(null);};
  if(!soundService.speakEnglish(lines[index],{rate,onEnd:done,onError:done}))setPlaying(null);
 }
 if(!lines.length)return null;
 return <section className="story-recap-lines" aria-label="Hikâyenin İngilizce cümleleri">
  <p className="story-recap-title"><span aria-hidden="true">📖</span> Hikâyenin cümleleri · dokun ve dinle</p>
  <ol>
   {lines.map((line,i)=><li key={i}>
    <button type="button" className="story-recap-line" data-playing={playing===i||undefined}
     onClick={()=>play(i)} aria-label={line+' cümlesini dinle'}>
     <span className="story-recap-icon" aria-hidden="true">{playing===i?'🔊':'▶'}</span>
     <span lang="en">{line}</span>
    </button>
   </li>)}
  </ol>
 </section>;
}
