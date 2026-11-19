'use client';
import React from 'react';
import {BookOpen,Blocks,NotebookPen,PenLine,Sparkles} from 'lucide-react';
import type {WorkshopMode} from '@/lib/learning/writingWorkshopEngine';
/** Decorative, original CSS bookmaking scene. No false object/answer pictures. */
export function WritingDeskScene({mode}:{mode:WorkshopMode}){
 const Mark=mode==='spell'?Blocks:mode==='assemble'?BookOpen:NotebookPen;
 return <div className="writing-workbench" data-scene-mode={mode} aria-hidden="true">
  <div className="writing-workbench-glow"/>
  <div className="writing-workbench-paper">
   <span className="writing-workbench-binding"/>
   <div className="writing-workbench-page">
    <Mark className="writing-workbench-watermark" size={72} strokeWidth={1.5}/>
    <span className="writing-workbench-line"/><span className="writing-workbench-line"/><span className="writing-workbench-line"/>
   </div>
  </div>
  <div className="writing-workbench-ink"><Sparkles size={26} strokeWidth={2}/></div>
  <div className="writing-workbench-pencil"><PenLine size={40} strokeWidth={2}/></div>
  <span className="writing-workbench-shadow"/>
 </div>;
}
