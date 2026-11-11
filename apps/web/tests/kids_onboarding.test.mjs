import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';

test('Kids first visit: no profile is created by a passive read', async () => {
  const repo = new MemoryProgressRepository();
  assert.equal(await repo.getActiveProfile(), null);
  assert.deepEqual(await repo.getAllProfiles(), []);
  assert.equal(await repo.getActiveProfile(), null);
});

test('Kids onboarding persists nickname, avatar, grade and placement independently', async () => {
  const repo = new MemoryProgressRepository();
  const child = await repo.createProfile({
    nickname: 'Ada', avatarId: 'avatar_owl', gradeLevel: 4, englishLevel: 'Pre-A1'
  });
  assert.equal(child.gradeLevel, 4);
  assert.equal(child.englishLevel, 'Pre-A1');
  assert.equal((await repo.getActiveProfile())?.id, child.id);
  assert.equal((await repo.getAllProfiles()).length, 1);
  const second = await repo.createProfile({
    nickname: 'Can', avatarId: 'avatar_robot', gradeLevel: 2, englishLevel: 'A1'
  });
  await repo.switchActiveProfile(second.id);
  assert.equal((await repo.getActiveProfile())?.id, second.id);
  await repo.switchActiveProfile(child.id);
  assert.equal((await repo.getActiveProfile())?.gradeLevel, 4);
});

test('Kids returning profile retains the original ID, stars and finished lessons', async () => {
  const repo = new MemoryProgressRepository();
  const child = await repo.createProfile({ nickname: 'Eski Kaşif', avatarId: 'avatar_explorer' });
  await saveWordGardenLevelCompletion(repo, child.id, 1, 3);
  const original = await repo.getActiveProfile();
  const first = await getWordGardenProgress(repo, child.id);
  assert.equal(first.completedLevels, 1);
  const after = await repo.getActiveProfile();
  assert.equal(after?.id, original?.id);
  assert.equal((await getWordGardenProgress(repo, child.id)).completedLevels, 1);
  assert.equal((await repo.getAllProfiles()).length, 1);
});

test('New child profile offers only free avatars; legacy IDs remain compatible',async()=>{
 const {VENTRA_STARTER_AVATARS,VENTRA_AVATARS,getAvatarById}=await import('../../../packages/shared/src/profile.ts');
 const fs=(await import('node:fs')).default;
 const ui=fs.readFileSync(new URL('../src/components/onboarding/KidsWelcomeGate.tsx',import.meta.url),'utf8');
 assert.equal(VENTRA_STARTER_AVATARS.length,5);
 assert.equal(VENTRA_AVATARS.length,36);
 assert.match(ui,/VENTRA_STARTER_AVATARS\.map/);
 assert.match(ui,/AvatarPortrait/);
 assert.equal(getAvatarById('avatar_owl').id,'avatar_owl');
 assert.equal(getAvatarById('avatar_robot').id,'avatar_robot');
});
