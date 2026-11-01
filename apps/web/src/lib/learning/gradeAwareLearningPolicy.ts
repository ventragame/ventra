import type { LearningDomain, LearningSkill, LearningSnapshot } from './adaptiveLearningEngine.ts';
import { rankVocabularyForMission } from './adaptiveLearningEngine.ts';

/** Grade is a curricular/UX preference, never a measured English ability. */
export type EnglishPlacement = 'Pre-A1' | 'A1' | 'A2';
export type GradeBand = 'unselected' | 'early' | 'middle' | 'upper';
export interface GradeAwarePolicy {
  gradeLevel:number|null;
  band:GradeBand;
  englishLevel:EnglishPlacement;
  discoveryCount:number;
  questionCount:number;
  choiceCount:number;
  maxNumber:number;
  instructionMode:'supported'|'guided'|'independent';
}
/**
 * Shared contract used by every Kids world. Missing/invalid grade is treated
 * like legacy behavior; NEVER infer a grade from correctness or silently
 * change recorded student grade.
 */
export function resolveGradeAwarePolicy(input:{
  domain:LearningDomain;
  gradeLevel?:number|null;
  englishLevel:EnglishPlacement;
}):GradeAwarePolicy {
  const grade=Number.isInteger(input.gradeLevel) && (input.gradeLevel??0)>=1 &&
    (input.gradeLevel??0)<=8 ? input.gradeLevel! : null;
  const band:GradeBand=grade===null?'unselected':grade<=2?'early':grade<=4?'middle':'upper';
  const discoveryCount=input.domain==='colors' ?
    band==='early'?4:6 : band==='early'?6:8;
  const questionCount=band==='early'?4:band==='upper'?7:6;
  const choiceCount=band==='early'?2:3;
  const englishCeiling=input.englishLevel==='Pre-A1'?10:
    input.englishLevel==='A1'?100:1000;
  const gradeCeiling=band==='unselected'?20:band==='early'?20:band==='middle'?100:1000;
  const maxNumber=Math.min(englishCeiling,gradeCeiling);
  return {gradeLevel:grade,band,englishLevel:input.englishLevel,
    discoveryCount,questionCount,choiceCount,maxNumber,
    instructionMode:band==='early'||input.englishLevel==='Pre-A1'?'supported':
      band==='upper'?'independent':'guided'};
}
/**
 * P3 sorting remains domain/skill-specific, without turning discovery or
 * hints into proficiency. Used as a common selector before seeded sampling.
 */
export function gradeAwareReviewPriority(
  snapshot:LearningSnapshot,domain:LearningDomain,skill:LearningSkill,eligible:readonly string[]
):string[] {
  return rankVocabularyForMission(snapshot,domain,skill,eligible);
}
