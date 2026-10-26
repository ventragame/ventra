import type { IProgressRepository } from './types.ts';
import { IndexedDBProgressRepository } from './IndexedDBProgressRepository.ts';
import { MemoryProgressRepository } from './MemoryProgressRepository.ts';

export * from './types.ts';
export { IndexedDBProgressRepository } from './IndexedDBProgressRepository.ts';
export { MemoryProgressRepository } from './MemoryProgressRepository.ts';

let defaultRepo: IProgressRepository | null = null;

export function getProgressRepository(): IProgressRepository {
  if (defaultRepo) return defaultRepo;

  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    defaultRepo = IndexedDBProgressRepository.getInstance();
  } else {
    defaultRepo = MemoryProgressRepository.getInstance();
  }

  return defaultRepo;
}

