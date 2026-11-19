'use client';
import React from 'react';

export type StoryNarrationClasses={
 root:string;listen:string;body:string;label?:string;waves?:string;toggle?:string;
};
type StoryNarrationProps={
 text:string;
 showText:boolean;
 voiceUnavailable:boolean;
 disabled?:boolean;
 speaking?:boolean;
 onListen:()=>void;
 onToggleText?:()=>void;
 classes:StoryNarrationClasses;
 labelTag?:'span'|'small';
 /**
  * Use on silent-only prompts for which no caption toggle is necessary.
  * The story text is always literal from the active beat/question.
  */
 promptOnly?:boolean;
};
/** Picture first, optional voice, same-scene caption; deliberately no question scoring. */
export function StoryNarrationPanel({text,showText,voiceUnavailable,disabled=false,speaking=false,
 onListen,onToggleText,classes,labelTag='span',promptOnly=false}:StoryNarrationProps){
 const visible=showText||voiceUnavailable||promptOnly;
 const status=voiceUnavailable?'SES YOK · METNİ OKU':speaking?'DİNLE VE İZLE':'DİNLE · RESMİ İNCELE';
 const label=labelTag==='small'?<small className={classes.label}>{status}</small>:
  <span className={classes.label}>{status}</span>;
 return <div className={classes.root+' story-standard-narration'} data-caption-visible={visible}>
  <button type="button" className={classes.listen+' story-standard-listen'}
   onClick={onListen} disabled={disabled}
   aria-label="Bu hikâye anlatımını tekrar dinle">🔊</button>
  <div className={classes.body+' story-standard-copy'}>
   {label}
   {visible?<p lang="en" className="story-standard-caption">{text}</p>:
    <span className={(classes.waves??'')+' story-standard-waves'} aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂</span>}
  </div>
  {onToggleText&&!voiceUnavailable&&!promptOnly&&
   <button type="button" className={(classes.toggle??'')+' story-standard-toggle'}
    onClick={onToggleText} disabled={disabled}
    aria-label={showText?'İngilizce altyazıyı gizle':'İngilizce altyazıyı göster'}
    aria-pressed={showText}>Aa</button>}
 </div>;
}
type StoryGuideProps={
 mode:'watch'|'choose'|'order'|'remember';
 current:number;total:number;
 title?:string;
};
/** Text-only wayfinding for all 3 stories, never a substitute for the illustrated scene. */
export function StorySceneGuide({mode,current,total,title}:StoryGuideProps){
 const steps:{[K in StoryGuideProps['mode']]:string}={
  watch:'Resme bak, anlatımı dinle ve sonra devam et.',
  choose:'Resmi incele, anlatımı dinle ve cevabı görselden seç.',
  order:'Dinlediğin hikâyeyi hatırla; resimleri olay sırasına göre seç.',
  remember:'Hikâyedeki olayı hatırla ve doğru resmi seç.'
 };
 const max=Math.max(1,total),number=Math.max(1,Math.min(current,max));
 return <div className="story-standard-guide" role="group" aria-label="Hikâye görev rehberi">
  <div className="story-standard-guide-top">
   <strong>{title||'Hikâye görevi'}</strong>
   <span aria-label={'Adım '+number+' / '+max}>Adım {number}/{max}</span>
  </div>
  <p>{steps[mode]}</p>
 </div>;
}
export function storyDecisionFeedback(result:'correct'|'retry'|'progress',progress:string=''):string{
 if(result==='correct')return '✓ Doğru görseli seçtin!';
 if(result==='retry')return '↻ Resme yeniden bak ve bir daha dene.';
 return progress;
}
