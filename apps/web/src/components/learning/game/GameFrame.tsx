'use client';
import React,{useEffect,useRef} from 'react';
import '../island/island-palette.css';
import './game-frame.css';

/**
 * One in-game frame for every Ventra game. Every game used to draw its own
 * header, step tabs, buttons and reward card (eighteen class prefixes), so a
 * child moving between islands met a new layout each time. The frame keeps
 * the places fixed — back button top-left, where you are, how far along, stars,
 * help and sound top-right, steps under it, one result card at the end — and
 * takes its colours from the island palette (data-island). The game's own
 * scene, characters and answer mechanics stay inside the stage.
 *
 * Presentational only: it never reads or writes progress, audio or answers.
 */
export type GameFrameIsland='sentence'|'story'|'harbor'|'writing'|'academy'|'garden';

export interface GameTopBarProps{
 island:GameFrameIsland;
 onBack:()=>void;
 /** Short visible label, e.g. "Bölümler"; hidden on phones (icon + aria stay). */
 backLabel:string;
 backAriaLabel?:string;
 backClassName?:string;
 /** Marks the back button as the Escape target of garden games. */
 gameExit?:boolean;
 /** Locks the back button while the game is saving. */
 backDisabled?:boolean;
 crest?:React.ReactNode;
 eyebrow?:string;
 title:string;
 titleAs?:'h1'|'h2'|'p';
 titleRef?:React.Ref<HTMLElement>;
 /** Where the child is in the current round. */
 progress?:{current:number;total:number;label?:string};
 stars?:{earned:number;total?:number};
 chips?:React.ReactNode[];
 /** Help / sound / album buttons. Give buttons className="gf-tool". */
 tools?:React.ReactNode;
 accent?:string;
 className?:string;
}

export function GameTopBar(props:GameTopBarProps){
 const {progress,stars}=props;
 const Title=props.titleAs??'h1';
 const percent=progress&&progress.total>0?Math.round(Math.min(1,Math.max(0,progress.current/progress.total))*100):0;
 const style=props.accent?{'--ih-accent':props.accent} as React.CSSProperties:undefined;
 return <header className={'gf-bar gf-theme'+(props.className?' '+props.className:'')} data-island={props.island} style={style}>
  <div className="gf-bar-inner">
   <button type="button" className={'gf-back'+(props.backClassName?' '+props.backClassName:'')}
    onClick={props.onBack} aria-label={props.backAriaLabel??props.backLabel} disabled={props.backDisabled}
    {...(props.gameExit?{'data-game-exit':''}:{})}>
    <span aria-hidden="true">←</span><span className="gf-back-label">{props.backLabel}</span>
   </button>
   <div className="gf-identity">
    {props.crest&&<span className="gf-crest" aria-hidden="true">{props.crest}</span>}
    <div>
     {props.eyebrow&&<small>{props.eyebrow}</small>}
     <Title className="gf-title" ref={props.titleRef as React.Ref<HTMLHeadingElement>} tabIndex={props.titleRef?-1:undefined}>{props.title}</Title>
    </div>
   </div>
   {(progress||stars||(props.chips&&props.chips.length>0))&&<div className="gf-meta">
    {props.chips?.map((chip,index)=><span key={index} className="gf-chip gf-chip--extra">{chip}</span>)}
    {progress&&<span className="gf-chip gf-chip--progress">
     <span className="gf-chip-label">{(progress.label??'Görev')+' '}</span><b>{Math.min(progress.current,progress.total)}/{progress.total}</b>
    </span>}
    {stars&&<span className="gf-chip gf-chip--stars" aria-label={stars.total?stars.earned+' / '+stars.total+' yıldız':stars.earned+' yıldız'}>
     <span aria-hidden="true">⭐</span> <b>{stars.total?stars.earned+'/'+stars.total:stars.earned}</b>
    </span>}
   </div>}
   {props.tools&&<div className="gf-tools">{props.tools}</div>}
  </div>
  {progress&&<div className="gf-bar-progress" role="progressbar" aria-label={(progress.label??'Görev')+' ilerlemesi'}
   aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={Math.min(progress.current,progress.total)}>
   <span style={{width:percent+'%'}}/>
  </div>}
 </header>;
}

export type GameStepState='done'|'current'|'upcoming'|'locked';
export interface GameStep{
 key:string;
 label:string;
 /** Shorter label for phones. */
 short?:string;
 /** Small caption under the label, e.g. "Şimdi" / "Sırada". */
 note?:string;
 icon?:React.ReactNode;
 state:GameStepState;
 onSelect?:()=>void;
 disabled?:boolean;
 className?:string;
 ariaLabel?:string;
}

const STEP_NOTE:Record<GameStepState,string>={done:'Tamam',current:'Şimdi',upcoming:'Sırada',locked:'Kilitli'};

/** Step tabs under the top bar: the same pill track in every game. */
export function GameStepRail({steps,ariaLabel,island,showNotes=false,className}:{
 steps:GameStep[];ariaLabel:string;island:GameFrameIsland;showNotes?:boolean;className?:string;
}){
 const list=useRef<HTMLOListElement>(null);
 const currentIndex=steps.findIndex(step=>step.state==='current');
 useEffect(()=>{
  const rail=list.current;if(!rail||currentIndex<0)return;
  const item=rail.children[currentIndex] as HTMLElement|undefined;if(!item)return;
  // Scroll only the rail sideways, never the page.
  const left=item.offsetLeft-(rail.clientWidth-item.offsetWidth)/2;
  rail.scrollLeft=Math.max(0,left);
 },[currentIndex]);
 return <ol ref={list} className={'gf-steps gf-theme'+(className?' '+className:'')} data-island={island} aria-label={ariaLabel}>
  {steps.map((step,index)=>{
   const mark=step.state==='done'?'✓':step.state==='locked'?'🔒':step.icon??String(index+1);
   const inner=<>
    <span className="gf-step-mark" aria-hidden="true">{mark}</span>
    <span className="gf-step-copy">
     <span className="gf-step-label">{step.short?<><span className="gf-step-long">{step.label}</span><span className="gf-step-short">{step.short}</span></>:step.label}</span>
     {showNotes?<small>{step.note??STEP_NOTE[step.state]}</small>:<span className="gf-sr">{' · '+STEP_NOTE[step.state]}</span>}
    </span>
   </>;
   const common={className:'gf-step'+(step.className?' '+step.className:''),'data-state':step.state,
    'aria-current':step.state==='current'?'step' as const:undefined};
   return <li key={step.key}>
    {step.onSelect
     ?<button type="button" {...common} onClick={step.onSelect} disabled={step.disabled||step.state==='locked'}
       aria-label={step.ariaLabel??step.label+' · '+STEP_NOTE[step.state]}>{inner}</button>
     :<span {...common}>{inner}</span>}
   </li>;
  })}
 </ol>;
}

/** A row of earned / empty stars that pop in one after another. */
export function GameStars({earned,total=3,className}:{earned:number;total?:number;className?:string}){
 return <div className={'gf-stars'+(className?' '+className:'')} role="img" aria-label={total+' yıldızdan '+earned}>
  {Array.from({length:total},(_,index)=><span key={index} className="gf-star" data-earned={index<earned}
   style={{'--i':index} as React.CSSProperties}>★</span>)}
 </div>;
}

/** The one end-of-round card. Game-specific recaps go in children. */
export function GameResult({island,art,kicker,title,titleLang,titleRef,stars,message,children,actions,className,ariaLabel}:{
 island:GameFrameIsland;art?:React.ReactNode;kicker:string;title:string;
 /** Mark an English title ("Well done!") as English for screen readers. */
 titleLang?:string;titleRef?:React.Ref<HTMLHeadingElement>;
 stars?:{earned:number;total?:number};message?:React.ReactNode;children?:React.ReactNode;actions:React.ReactNode;
 className?:string;ariaLabel?:string;
}){
 return <section className={'gf-result gf-theme'+(className?' '+className:'')} data-island={island} aria-label={ariaLabel??title}>
  {art&&<div className="gf-result-art">{art}</div>}
  <div className="gf-result-body">
   <p className="gf-result-kicker">{kicker}</p>
   <h2 className="gf-result-title" ref={titleRef} tabIndex={titleRef?-1:undefined} lang={titleLang}>{title}</h2>
   {stars&&<GameStars earned={stars.earned} total={stars.total}/>}
   {message&&<p className="gf-result-message">{message}</p>}
   {children}
   <div className="gf-result-actions">{actions}</div>
  </div>
 </section>;
}
