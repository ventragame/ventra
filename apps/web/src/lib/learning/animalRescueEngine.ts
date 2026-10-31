import type { AnimalId } from './animalMissionEngine.ts';

export type RescuePhase = 'find' | 'home' | 'done';
export type RescueOutcome = 'wrong' | 'found' | 'rescued' | 'ignore';

/**
 * Quest 5 has two meaningful actions. A successful animal identification
 * cannot finish the question until its habitat is also correctly identified.
 * This pure transition contract is shared by tests and the interactive scene.
 */
export function resolveRescueChoice(args: {
  phase: RescuePhase;
  selected: AnimalId;
  target: AnimalId;
}): { phase: RescuePhase; outcome: RescueOutcome; complete: boolean } {
  if (args.phase === 'done') {
    return { phase: 'done', outcome: 'ignore', complete: true };
  }
  if (args.selected !== args.target) {
    return { phase: args.phase, outcome: 'wrong', complete: false };
  }
  if (args.phase === 'find') {
    return { phase: 'home', outcome: 'found', complete: false };
  }
  return { phase: 'done', outcome: 'rescued', complete: true };
}
