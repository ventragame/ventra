import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { saveColorGroveMission, getColorGroveProgress } from '../src/lib/progress/colorGroveProgress.ts';

test('Color Grove save retry is idempotent across identical session IDs', async () => {
  const repo = new MemoryProgressRepository();
  const profile = await repo.createProfile({ nickname: 'Ada', avatarId: 'avatar_explorer' });
  const key = 'cg_Ada_1_test_fixed';
  await saveColorGroveMission(repo, profile.id, 1, 0, 6, 40, [], key);
  const firstStars = await repo.getTotalStars(profile.id);
  await saveColorGroveMission(repo, profile.id, 1, 0, 6, 40, [], key);
  assert.equal(await repo.getTotalStars(profile.id), firstStars);
  assert.equal((await getColorGroveProgress(repo, profile.id)).completedLevels, 1);
});

test('Child grade and placement can be preserved without changing child identity', async () => {
  const repo = new MemoryProgressRepository();
  const p = await repo.createProfile({ nickname: 'Deniz', avatarId: 'avatar_owl', gradeLevel: 3, englishLevel: 'Pre-A1' });
  const before = p.id;
  const updated = await repo.updateProfile(p.id, { gradeLevel: 4, englishLevel: 'A1' });
  assert.equal(updated.id, before);
  assert.equal(updated.gradeLevel, 4);
  assert.equal(updated.englishLevel, 'A1');
  assert.equal(updated.isCloudSynced, false);
});
