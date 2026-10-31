import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';
import { getColorGroveProgress, saveColorGroveMission } from '../src/lib/progress/colorGroveProgress.ts';

// The access path is never written into a child's learning identity.
// This protects the local -> family -> local transitions against a reset.
test('One child keeps identity, avatar, grade, English level, stars and lessons across access changes', async () => {
  const repo = new MemoryProgressRepository();
  const original = await repo.createProfile({
    nickname: 'Kaşif Ada', avatarId: 'avatar_robot', gradeLevel: 4, englishLevel: 'Pre-A1'
  });
  await saveWordGardenLevelCompletion(repo, original.id, 1, 3);
  await saveWordGardenLevelCompletion(repo, original.id, 2, 2);
  const stars = await repo.getTotalStars(original.id);
  assert.equal(stars, 5);

  // The family link changes ownership, not the child ID or games.
  const linked = await repo.updateProfile(original.id, { userId: 'parent_1', isCloudSynced: false });
  assert.equal(linked.id, original.id);
  assert.equal(linked.avatarId, 'avatar_robot');
  assert.equal(linked.gradeLevel, 4);
  assert.equal(linked.englishLevel, 'Pre-A1');
  assert.equal(await repo.getTotalStars(original.id), stars);
  assert.equal((await getWordGardenProgress(repo, original.id)).completedLevels, 2);

  // Returning to individual play never detaches the parent or resets progress.
  const back = await repo.getActiveProfile();
  assert.equal(back?.id, original.id);
  assert.equal(back?.userId, 'parent_1');
  assert.equal((await repo.getAllProfiles()).length, 1);
  assert.equal(await repo.getTotalStars(original.id), stars);
});

test('Two-device event replay merges without duplicate stars or losing adaptive evidence', async () => {
  const deviceA = new MemoryProgressRepository();
  const deviceB = new MemoryProgressRepository();
  const profile = await deviceA.createProfile({
    nickname: 'Can', avatarId: 'avatar_owl', gradeLevel: 3, englishLevel: 'Pre-A1'
  });
  await saveWordGardenLevelCompletion(deviceA, profile.id, 1, 3);
  const evidence = [
    { wordId: 'red', kind: 'recall', mistakes: 2, firstTryCorrect: false, timestamp: '2026-10-31T00:00:00.000Z' }
  ];
  await saveColorGroveMission(deviceA, profile.id, 1, 2, 6, 30, evidence);

  // Cloud restores a profile using the same globally stable UUID.
  const restored = await deviceB.createProfile({
    id: profile.id, nickname: profile.nickname, avatarId: profile.avatarId
  });
  assert.equal(restored.id, profile.id);

  const events = (await deviceA.getPendingEvents(profile.id)).map(row => ({
    event_id: row.eventId, profile_id: row.profileId,
    event_type: row.eventType, game_id: row.gameId, level_id: row.levelId,
    skill_id: row.skillId, score: row.score, stars_earned: row.starsEarned,
    accuracy_rate: row.accuracyRate, metrics: row.metrics, client_timestamp: row.clientTimestamp
  }));
  assert.equal(events.length, 2);
  assert.equal(await deviceB.mergeRemoteEvents(events, profile.id), 2);
  assert.equal(await deviceB.mergeRemoteEvents(events, profile.id), 0);
  assert.equal(await deviceB.getTotalStars(profile.id), await deviceA.getTotalStars(profile.id));
  assert.equal((await getWordGardenProgress(deviceB, profile.id)).completedLevels, 1);
  assert.equal((await getColorGroveProgress(deviceB, profile.id)).completedLevels, 1);
  assert.deepEqual(await deviceB.getColorAnswerHistory(profile.id), evidence);
});

test('Device never implicitly merges two children with different IDs', async () => {
  const repo = new MemoryProgressRepository();
  const a = await repo.createProfile({ nickname: 'Ada', avatarId: 'avatar_explorer' });
  const b = await repo.createProfile({ nickname: 'Can', avatarId: 'avatar_robot' });
  await saveWordGardenLevelCompletion(repo, a.id, 1, 3);
  await repo.switchActiveProfile(b.id);
  assert.equal(await repo.getTotalStars(b.id), 0);
  assert.equal(await repo.getTotalStars(a.id), 3);
  assert.notEqual(a.id, b.id);
});
