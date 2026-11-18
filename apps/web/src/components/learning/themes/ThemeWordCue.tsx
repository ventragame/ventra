'use client';
import React from 'react';
import {BookOpen,PersonStanding,Shirt,CloudSun,CalendarDays,Palette,Bus,Smile,type LucideIcon} from 'lucide-react';
import {themeScene} from '@/lib/learning/learningArt';
import type {ThemeId} from '@/lib/learning/themeQuestCatalog';
const ICONS:Record<ThemeId,LucideIcon>={school:BookOpen,body:PersonStanding,clothes:Shirt,weather:CloudSun,calendar:CalendarDays,hobbies:Palette,transport:Bus,feelings:Smile};
/** Explicitly labelled TOPIC cue: NOT a literal depiction of a particular vocabulary word. */
export function ThemeWordCue({theme}:{theme:ThemeId;english?:string}){
 const Icon=ICONS[theme];
 return <div className="tt-semantic-cue" data-visual-kind="topic-cue" aria-hidden="true">
  <img className="tt-semantic-background" src={themeScene(theme)} alt="" decoding="async"/>
  <span className="tt-semantic-emblem"><Icon size={64} strokeWidth={1.8}/></span>
  <span className="tt-semantic-caption">KONU İPUCU</span>
 </div>;
}
/** Keep image load errors from leaving broken art on a child's lesson screen. */
export function ThemeWordArtwork({theme,english,translation,src}:{theme:ThemeId;english:string;translation:string;src:string|null}){
 const [failed,setFailed]=React.useState(false);
 if(!src||failed)return <ThemeWordCue theme={theme} english={english}/>;
 return <img className="tt-word-illustration" src={src} alt={translation} decoding="async" onError={()=>setFailed(true)}/>;
}
