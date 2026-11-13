import {QUESTS_A,type HarborQuest,type HarborLevel,type HarborAction} from './harborQuestContentA.ts';
import {QUESTS_B} from './harborQuestContentB.ts';
import {QUESTS_C} from './harborQuestContentC.ts';
export type {HarborQuest,HarborLevel,HarborAction};
export type HarborStep={
 line:string;reply:string;choices:readonly [string,string,string];accept:readonly string[];
};
export const HARBOR_QUESTS:readonly HarborQuest[]=[...QUESTS_A,...QUESTS_B,...QUESTS_C];
export const HARBOR_TOTAL_MISSIONS=15;
export const HARBOR_STEPS_PER_EPISODE=9;
/** Parsing at module load validates authored content before starting gameplay. */
export function parseHarborStep(row:string):HarborStep{
 const bits=row.split('|').map(s=>s.trim());
 if(bits.length!==4||bits.some(x=>!x))throw new Error('Invalid harbor quest step');
 const [line,reply,wrong1,wrong2]=bits;
 if(new Set([reply,wrong1,wrong2].map(s=>s.toLowerCase())).size!==3)
  throw new Error('Duplicated speech choices');
 return {line,reply,choices:[reply,wrong1,wrong2],accept:[reply]};
}
export function getHarborEpisodeQuests(episode:number):readonly HarborQuest[]{
 return HARBOR_QUESTS.filter(q=>q.episode===episode);
}
export function getHarborQuestSteps(quest:HarborQuest,level:HarborLevel):readonly HarborStep[]{
 const source=level==='Pre-A1'?quest.pre:level==='A1'?quest.a1:quest.a2;
 return source.map(parseHarborStep);
}
export function getHarborEpisodeSteps(episode:number,level:HarborLevel):readonly {quest:HarborQuest;step:HarborStep;index:number;questStep:number}[]{
 const quests=getHarborEpisodeQuests(episode);
 return quests.flatMap(quest=>getHarborQuestSteps(quest,level).map((step,questStep)=>({quest,step,questStep,index:0})))
  .map((entry,index)=>({...entry,index}));
}
/** Alternate choice positions on repeats, never modify correct speech. */
export function harborChoiceOrder(step:HarborStep,level:HarborLevel,index:number,replay:number):readonly string[]{
 const items=level==='Pre-A1'?step.choices.slice(0,2):step.choices.slice();
 const offset=(index*7+replay*5+3)%items.length;
 return [...items.slice(offset),...items.slice(0,offset)];
}
export function harborSceneEvent(action:HarborAction,questStep:number):string{
 const effects:Record<HarborAction,readonly string[]>={
  meet:['wave','smile','friends'],crew:['approach','perch','sing'],board:['rope','sail','depart'],
  deliver:['pick','carry','give'],trade:['inspect','pick','trade'],help:['spot','lift','thank'],
  chart:['unroll','mark','discover'],navigate:['left','straight','right'],rescue:['search','find','reunite'],
  light:['dark','spark','shine'],repair:['key','tools','fix'],signal:['beam','turn','safe'],
  invite:['invite','gather','cheer'],decorate:['hang','light','dance'],celebrate:['crew','sail','fireworks']
 };
 return effects[action][questStep]??'cheer';
}
