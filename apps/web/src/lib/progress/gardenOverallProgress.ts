import type { IProgressRepository } from './types.ts';
import { getWordGardenProgress, type WordGardenProgressSnapshot } from './wordGardenProgress.ts';
import { getColorGroveProgress } from './colorGroveProgress.ts';
import { getNumberValleyProgress, type NumberValleyProgress } from './numberValleyProgress.ts';
import { getFoodMarketProgress } from './foodMarketProgress.ts';
import { getFamilyVillageProgress } from './familyVillageProgress.ts';
import { getTempleProgress } from './templeProgress.ts';

export type GardenEnglishLevel = 'Pre-A1' | 'A1' | 'A2';
export interface GardenOverallProgress {
  completed: number;
  total: number;
  percent: number;
  completedWorlds: number;
  totalWorlds: 6;
  animals: WordGardenProgressSnapshot;
}

/** Keep the visible denominator identical to the number paths this child can access. */
export function accessibleNumberLevels(gradeLevel:number|null, englishLevel:GardenEnglishLevel): 5|10|15 {
  if (englishLevel==='Pre-A1' || gradeLevel===null || !Number.isInteger(gradeLevel) || gradeLevel<1 || gradeLevel<=2) return 5;
  return gradeLevel<=4 || englishLevel==='A1' ? 10 : 15;
}
export function tallyGardenProgress(input:{
  animals:WordGardenProgressSnapshot;
  colors:{completedLevels:number;totalLevels:number};
  numbers:NumberValleyProgress;
  food:{completedLevels:number;totalLevels:number};
  family:{completedLevels:number;totalLevels:number};
  temple:{completedLevels:number;totalLevels:number};
  gradeLevel:number|null;
  englishLevel:GardenEnglishLevel;
}):GardenOverallProgress {
  const clamp=(value:number,max:number)=>Math.max(0,Math.min(max,Number.isFinite(value)?Math.trunc(value):0));
  const numberTotal=accessibleNumberLevels(input.gradeLevel,input.englishLevel);
  const numberCompleted=clamp(input.numbers.completedByBand.ones,5)
    +(numberTotal>=10?clamp(input.numbers.completedByBand.tens,5):0)
    +(numberTotal>=15?clamp(input.numbers.completedByBand.hundreds,5):0);
  const counts=[
    [clamp(input.animals.completedLevels,5),5],
    [clamp(input.colors.completedLevels,3),3],
    [numberCompleted,numberTotal],
    [clamp(input.food.completedLevels,15),15],
    [clamp(input.family.completedLevels,20),20],
    [clamp(input.temple.completedLevels,25),25],
  ] as const;
  const completed=counts.reduce((sum,[count])=>sum+count,0);
  const total=counts.reduce((sum,[,count])=>sum+count,0);
  return {completed,total,percent:Math.round(100*completed/total),
    completedWorlds:counts.filter(([count,max])=>count===max).length,
    totalWorlds:6,animals:input.animals};
}
/** Persisted records only. No synthetic completions, rewards, or schema changes. */
export async function getGardenOverallProgress(repo:IProgressRepository,profileId:string,
 gradeLevel:number|null,englishLevel:GardenEnglishLevel):Promise<GardenOverallProgress>{
  const [animals,colors,numbers,food,family,temple]=await Promise.all([
    getWordGardenProgress(repo,profileId),
    getColorGroveProgress(repo,profileId),
    getNumberValleyProgress(repo,profileId),
    getFoodMarketProgress(repo,profileId),
    getFamilyVillageProgress(repo,profileId),
    getTempleProgress(repo,profileId)
  ]);
  return tallyGardenProgress({animals,colors,numbers,food,family,temple,gradeLevel,englishLevel});
}
