'use client';
import React from 'react';
import {visibleWord} from './sentencePresentation';
import {sameSentenceWord} from '@/lib/learning/sentenceTokens';
type Tile={id:string;word:string};
type BuilderProps={tokens:readonly string[];tiles:readonly Tile[];pickedIds:readonly string[];
 selectedWords:readonly string[];wrongIndex:number;locked:boolean;
 onAdd:(id:string)=>void;onRemove:(i:number)=>void;
 slotRowClass:string;slotClass:string;tileRowClass:string;tileClass:string};
/** Presentation only. The four engines keep their own validators, achievements and checkpoints. */
export function SentenceQuestBuilder({tokens,tiles,pickedIds,selectedWords,wrongIndex,locked,
 onAdd,onRemove,slotRowClass,slotClass,tileRowClass,tileClass}:BuilderProps){
 const complete=pickedIds.length>=tokens.length;
 return <div className="sq-builder" data-complete={complete}>
  <div className="sq-builder-heading"><strong>✦ Cümleyi Kur</strong><span>{pickedIds.length} / {tokens.length} kelime</span></div>
  <p className="sq-builder-instruction">Kelimelere sırayla dokun. Değiştirmek için cümledeki kelimeyi seç.</p>
  <div className={slotRowClass+' sq-word-slots'} role="group" aria-label="Kurduğun İngilizce cümle">
   {tokens.map((_,i)=>{
    const word=selectedWords[i]??'',filled=Boolean(word);
    return <button key={i} type="button" className={slotClass+' sq-word-slot'+(filled&&slotClass==='sp-slot'?' sp-slot-filled':'')}
     disabled={!filled||locked} data-filled={filled} data-error={wrongIndex===i} data-wrong={wrongIndex===i}
     onClick={()=>onRemove(i)} aria-label={filled?word+' kelimesini çıkar':(i+1)+'. boş kelime yuvası'}>
      {filled?visibleWord(sameSentenceWord(tokens[i],word)?tokens[i]:word,i):'✧'}</button>;
   })}
  </div>
  <div className={tileRowClass+' sq-word-tiles'} role="group" aria-label="Cümle için kelimeler">
   {tiles.map(t=><button key={t.id} type="button" className={tileClass+' sq-word-tile'}
    disabled={locked||complete||pickedIds.includes(t.id)} onClick={()=>onAdd(t.id)}
    aria-label={t.word+' kelimesini ekle'}>{t.word}</button>)}
  </div>
 </div>;
}
export function SentenceQuestProgress({index,total,label}:{index:number;total:number;label:string}){
 const max=Math.max(1,total),current=Math.max(1,Math.min(max,index));
 return <div className="sq-task-progress" aria-label={'Görev '+current+' / '+max}>
  <span>{label}</span><strong>Görev {current} / {max}</strong></div>;
}
export function SentenceQuestSuccess({detail}:{detail:string}){
 return <div className="sq-success" role="status" aria-live="polite">
  <strong>✓ Cümlen doğru!</strong><span>{detail}</span></div>;
}
export function SentenceQuestReward({independent}:{independent?:number}){
 return <p className="sq-reward-note">✓ Bölüm tamamlandı. Cümle kurma çalışman kaydedildi.
  {independent!==undefined&&<span> · {independent} bağımsız çözüm</span>}</p>;
}
