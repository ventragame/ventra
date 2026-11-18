'use client';
import React from 'react';
import {Activity,AlarmClock,AlertTriangle,Angry,Armchair,Award,Backpack,Bike,Bone,BookOpen,Boxes,Brain,Bus,CalendarDays,Camera,Car,CircleHelp,Clapperboard,ClipboardList,Clock3,Cloud,CloudDrizzle,CloudFog,CloudLightning,CloudRain,CloudSnow,CloudSun,Code2,CookingPot,Droplets,Dumbbell,Ear,Eraser,Eye,FlaskConical,Footprints,Frown,Gamepad2,GitMerge,Globe2,GraduationCap,Grid2X2,Guitar,Hand,Headphones,HeartHandshake,HeartPulse,Languages,Leaf,Library,Mail,MapPin,Meh,MessageCircle,Mic,Moon,Mountain,Music2,NotebookPen,Palette,PartyPopper,PenLine,Pencil,PersonStanding,Plane,PlaneLanding,PlaneTakeoff,Presentation,Puzzle,Rainbow,RotateCw,Route,Ruler,Scale,School,Scissors,Search,ShieldAlert,ShieldCheck,Ship,Shirt,Smile,Snowflake,Sprout,Sun,Sunrise,Table2,Target,Thermometer,Ticket,Timer,TrafficCone,TrainFront,Trees,Trophy,Truck,Umbrella,UserRound,Users,Utensils,Waves,Wind,Zap,type LucideIcon} from 'lucide-react';
import {themeScene} from '@/lib/learning/learningArt';
import {themeCueForWord,type ThemeCueName} from '@/lib/learning/themeVisualSemantics';
import type {ThemeId} from '@/lib/learning/themeQuestCatalog';
const ICONS:Record<ThemeCueName,LucideIcon>={Activity,AlarmClock,AlertTriangle,Angry,Armchair,Award,Backpack,Bike,Bone,BookOpen,Boxes,Brain,Bus,CalendarDays,Camera,Car,CircleHelp,Clapperboard,ClipboardList,Clock3,Cloud,CloudDrizzle,CloudFog,CloudLightning,CloudRain,CloudSnow,CloudSun,Code2,CookingPot,Droplets,Dumbbell,Ear,Eraser,Eye,FlaskConical,Footprints,Frown,Gamepad2,GitMerge,Globe2,GraduationCap,Grid2X2,Guitar,Hand,Headphones,HeartHandshake,HeartPulse,Languages,Leaf,Library,Mail,MapPin,Meh,MessageCircle,Mic,Moon,Mountain,Music2,NotebookPen,Palette,PartyPopper,PenLine,Pencil,PersonStanding,Plane,PlaneLanding,PlaneTakeoff,Presentation,Puzzle,Rainbow,RotateCw,Route,Ruler,Scale,School,Scissors,Search,ShieldAlert,ShieldCheck,Ship,Shirt,Smile,Snowflake,Sprout,Sun,Sunrise,Table2,Target,Thermometer,Ticket,Timer,TrafficCone,TrainFront,Trees,Trophy,Truck,Umbrella,UserRound,Users,Utensils,Waves,Wind,Zap};
/** Reviewed semantic cue, NOT an exact word illustration. */
export function ThemeWordCue({theme,english}:{theme:ThemeId;english?:string}){
 const Icon=ICONS[themeCueForWord(theme,english)];
 return <div className="tt-semantic-cue" data-visual-kind="topic-cue" aria-hidden="true">
  <img className="tt-semantic-background" src={themeScene(theme)} alt="" decoding="async"/>
  <span className="tt-semantic-emblem"><Icon size={64} strokeWidth={1.8}/></span>
  <span className="tt-semantic-caption">KONU İPUCU</span>
 </div>;
}
/** A broken exact image must never remain a broken-image glyph on the lesson page. */
export function ThemeWordArtwork({theme,english,translation,src}:{theme:ThemeId;english:string;translation:string;src:string|null}){
 const [failed,setFailed]=React.useState(false);
 if(!src||failed)return <>
  <ThemeWordCue theme={theme} english={english}/>
  {failed&&<span className="tt-art-load-warning" role="status">Görsel açılamadı. Türkçe anlamdan devam edebilirsin.</span>}
 </>;
 return <img className="tt-word-illustration" src={src} alt={translation} decoding="async" onError={()=>setFailed(true)}/>;
}
