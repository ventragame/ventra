import { COLOR_GROVE_WORDS } from '../progress/colorGroveProgress.ts';

export type GroveMode = 'discovery' | 'matching' | 'painting';

// Six answers must produce six visible restored trees; not just the first four.
export const GROVE_TREE_POSITIONS = [87, 217, 347, 477, 607, 746] as const;
export const GROVE_PALETTE = ['#fbcfe8', '#a7f3d0', '#fde68a', '#c4b5fd', '#93c5fd', '#fda4af'] as const;

export function getGroveTreeColors(mode: GroveMode, paintedIds: string[] = []): string[] {
  const colors = new Map<string, string>(COLOR_GROVE_WORDS.map(word => [word.id, word.hex]));
  return GROVE_TREE_POSITIONS.map((_, i) => {
    const painted = paintedIds[i] ? colors.get(paintedIds[i]) : null;
    return painted ?? (mode === 'painting' ? '#b6c6c4' : GROVE_PALETTE[i]);
  });
}
