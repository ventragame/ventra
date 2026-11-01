import type { IProgressRepository } from '../progress/types.ts';
import { ANIMAL_MEADOW_WORDS } from './animalMissionEngine.ts';
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
  const [animalAnswers,colorAnswers,numberAnswers,foodAnswers]=await Promise.all([
    repo.getAnimalAnswerHistory(profileId),repo.getColorAnswerHistory(profileId),
    repo.getNumberAnswerHistory(profileId),repo.getFoodAnswerHistory(profileId)
  ]);
  return getLearningSnapshot({
    animalAnswers,colorAnswers,
    animalWords:ANIMAL_MEADOW_WORDS.map(w=>w.id),
    colorWords:COLOR_GROVE_WORDS.map(w=>w.id),numberWords:[],numberAnswers,
    foodWords:MARKET_WORDS.map(w=>w.id),foodAnswers,now
  });
}
