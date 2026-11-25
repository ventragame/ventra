'use client';
import React,{useEffect,useRef,useState} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {type RecapWord} from '@/lib/learning/recapWords';
import './word-recap.css';
export {uniqueRecapWords,type RecapWord} from '@/lib/learning/recapWords';

/**
 * End-of-lesson recap for Harf Korusu and Tema Kasabası, like the other
 * Kelime Bahçesi worlds: the round's English words, tap to hear each again.
 * It only reads the finished round; nothing is stored.
 */
export function WordRecap({title,words,rate=.88}:{title:string;words:readonly RecapWord[];rate?:number}){
 const [playing,setPlaying]=useState<number|null>(null);
 const request=useRef(0);
 useEffect(()=>()=>{request.current++;soundService.cancelSpeech();},[]);
 function play(index:number){
  const id=++request.current;
  soundService.unlockAudio();
  setPlaying(index);
  const done=()=>{if(request.current===id)setPlaying(null);};
  if(!soundService.speakEnglish(words[index].en,{rate,onEnd:done,onError:done}))setPlaying(null);
 }
 if(!words.length)return null;
 return <section className="word-recap" aria-label={title}>
  <p className="word-recap-title">{title}</p>
  <div className="word-recap-list">
   {words.map((word,i)=><button key={word.en+i} type="button" className="word-recap-chip"
    data-playing={playing===i||undefined} onClick={()=>play(i)}
    aria-label={word.tr+', İngilizce '+word.en+', dinle'}>
    {word.icon&&<span className="word-recap-icon" aria-hidden="true">{word.icon}</span>}
    <span className="word-recap-text"><span className="word-recap-en" lang="en">{word.en}</span>
     <span className="word-recap-tr">{word.tr}</span></span>
   </button>)}
  </div>
 </section>;
}
