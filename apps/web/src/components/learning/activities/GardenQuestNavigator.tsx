'use client';
import React from 'react';
import {GameStepRail,type GameStep} from '../game/GameFrame';

type Props={zoneLabel:string;stageLabel:string;zones:GameStep[];stages:GameStep[]};

/**
 * UI-only: Lezzet Pazarı, Aile Köyü and Keşif Tapınağı keep their own locks,
 * session state and progress callbacks. This draws their two levels of choice
 * — the zone (street, district, chamber) and that zone's five language tasks —
 * as the shared game step rails, so all three read like every other game.
 */
export function GardenQuestNavigator({zoneLabel,stageLabel,zones,stages}:Props){
 return <div className="gg-quest-navigation">
  <GameStepRail island="garden" className="gg-quest-zone-nav" ariaLabel={zoneLabel} showNotes
   steps={zones.map(zone=>({...zone,className:'gg-quest-zone gg-game-control'+(zone.className?' '+zone.className:'')}))}/>
  <GameStepRail island="garden" className="gg-quest-stage-nav" ariaLabel={stageLabel}
   steps={stages.map(item=>({...item,className:'gg-quest-step gg-game-control'+(item.className?' '+item.className:'')}))}/>
 </div>;
}
