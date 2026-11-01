import type { IProgressRepository } from '../progress/types.ts';
import { ANIMAL_MEADOW_WORDS } from './animalMissionEngine.ts';
import { TEMPLE_WORDS } from './templeEngine.ts';
import { VILLAGE_WORDS } from './familyVillageEngine.ts';
import { MARKET_WORDS } from './foodMarketEngine.ts';
import { COLOR_GROVE_WORDS } from '../progress/colorGroveProgress.ts';
import { getLearningSnapshot, type LearningSnapshot } from './adaptiveLearningEngine.ts';

/**
 * Single source of truth for a child's learning report. Read committed session
 * evidence only. A cloud replay remains idempotent under the repository's
 * existing session keys. No additional remote personal-data collection.
 */
export async function loadLearningReport(
  repo:IProgressRepository,profileId:string,now:string=new Date().toISOString()
):Promise<LearningSnapshot>{
  const [animalAnswers,colorAnswers,numberAnswers,foodAnswers,familyAnswers,templeAnswers]=await Promise.all([
    repo.getAnimalAnswerHistory(profileId),repo.getColorAnswerHistory(profileId),
    repo.getNumberAnswerHistory(profileId),repo.getFoodAnswerHistory(profileId),repo.getFamilyAnswerHistory(profileId),repo.getTempleAnswerHistory(profileId)
  ]);
  return getLearningSnapshot({
    animalAnswers,colorAnswers,
    animalWords:ANIMAL_MEADOW_WORDS.map(w=>w.id),
    colorWords:COLOR_GROVE_WORDS.map(w=>w.id),numberWords:[],numberAnswers,
    foodWords:MARKET_WORDS.map(w=>w.id),foodAnswers,
    familyWords:VILLAGE_WORDS.map(w=>w.id),familyAnswers,
    templeWords:TEMPLE_WORDS.map(w=>w.id),templeAnswers,now
  });
}
