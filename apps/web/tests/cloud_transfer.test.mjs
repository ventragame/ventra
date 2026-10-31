import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uploadInBatches, mergeRemotePages, assertChildTombstoneAcknowledged } from '../src/lib/supabase/cloudTransfer.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';

test('1,203 cloud events are downloaded without the Supabase 1,000-row truncation', async () => {
  const remote = Array.from({ length: 1203 }, (_, i) => ({ event_id: 'offline-' + i }));
  const local = new Set();
  const requested = [];
  const merge = events => {
    let added = 0;
    for (const row of events) if (!local.has(row.event_id)) {
      local.add(row.event_id);
      added++;
    }
    return Promise.resolve(added);
  };
  const fetchPage = (offset, end) => {
    requested.push([offset, end]);
    return Promise.resolve(remote.slice(offset, end + 1));
  };
  assert.equal(await mergeRemotePages(fetchPage, merge), 1203);
  assert.deepEqual(requested, [[0, 499], [500, 999], [1000, 1499]]);
  assert.equal(await mergeRemotePages(fetchPage, merge), 0);
  assert.equal(local.size, 1203);
});

test('Interrupted bulk upload leaves unsuccessful batch pending and permits retry', async () => {
  const pending = Array.from({length: 230}, (_, i) => 'event-'+i);
  const sent = [];
  const acked = new Set();
  let calls = 0;
  await assert.rejects(uploadInBatches(pending, async batch => {
    calls++;
    if (calls === 2) throw new Error('network offline');
    sent.push(...batch);
  }, async batch => batch.forEach(id => acked.add(id))), /network offline/);
  assert.equal(acked.size, 100);
  assert.equal(sent.length, 100);
  const remaining = pending.filter(id => !acked.has(id));
  assert.equal(await uploadInBatches(remaining, async batch => {
    sent.push(...batch);
  }, async batch => batch.forEach(id => acked.add(id))), 130);
  assert.equal(acked.size, 230);
  assert.equal(new Set(sent).size, 230);
});

test('Server page failure rejects and does not silently report successful full restore', async () => {
  let merged = 0;
  await assert.rejects(mergeRemotePages(async offset => {
    if (offset >= 500) throw new Error('page two failed');
    return Array.from({length: 500}, (_, i) => ({id:i}));
  }, async batch => { merged += batch.length; return batch.length; }), /page two failed/);
  assert.equal(merged, 500);
  await assert.rejects(mergeRemotePages(async () => null, async () => 0), /okunamadı/);
  await assert.rejects(uploadInBatches([1], async () => {}, async () => {}, 0), /paket boyutu/);
});

test('Child-data deletion must not masquerade as successful deletion of the adult account', () => {
  const auth = fs.readFileSync('src/lib/supabase/auth.ts', 'utf8');
  const tail = auth.slice(auth.indexOf('export async function deleteAdultAccount'));
  assert.match(tail, /if \(rpcError\)\s*\{\s*return \{ success: false/);
  assert.doesNotMatch(tail, /\.from\('player_profiles'\)\s*\.delete\(/);
});

test('Cloud sync has ownership checks, explicit link and checked deletion responses', () => {
  const source = fs.readFileSync('src/lib/supabase/sync.ts', 'utf8');
  assert.match(source, /profile\.userId !== userId/);
  assert.match(source, /!profile\.userId && !options\.allowLink/);
  assert.match(source, /\.is\('deleted_at', null\)\.select\('id'\)/);
  assert.match(source, /mergeRemotePages\(/);
  assert.match(source, /uploadInBatches\(/);
});

test('Wrong child cloud events cannot enter another child progress history', async () => {
  const repo = new MemoryProgressRepository();
  const alice = await repo.createProfile({nickname:'Ada',avatarId:'avatar_explorer'});
  const bob = await repo.createProfile({nickname:'Can',avatarId:'avatar_owl'});
  await assert.rejects(repo.mergeRemoteEvents([{
    event_id: 'foreign-event',
    profile_id: bob.id,
    event_type: 'game_level',
    game_id: 'island_word_garden_steps',
    level_id: 1, stars_earned: 3,
    client_timestamp: '2026-11-01T12:00:00Z'
  }], alice.id), /başka bir çocuk/);
  assert.equal(await repo.getTotalStars(alice.id), 0);
  assert.equal(await repo.getTotalStars(bob.id), 0);
});

test('Family-linked child removal requires the parent area and cloud confirmation', () => {
  const modal = fs.readFileSync('src/components/profile/ProfileSelectorModal.tsx','utf8');
  const adult = fs.readFileSync('src/components/profile/AdultAccountModal.tsx','utf8');
  assert.match(modal, /if \(p\.userId\)/);
  assert.match(adult, /handleDeleteLinkedChild/);
  assert.match(adult, /\.rpc\('delete_child_profile'/);
  assert.match(adult, /await getProgressRepository\(\)\.deleteProfile\(profile\.id\)/);
});

test('Child profile SQL deletion purges learning events atomically and keeps only a tombstone', () => {
  const sql = fs.readFileSync('../../supabase/migrations/20261101000001_delete_child_profile_atomically.sql', 'utf8');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.delete_child_profile/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /parent_id := auth\.uid\(\)/);
  assert.match(sql, /WHERE id = p_profile_id\s+AND user_id = parent_id/);
  assert.match(sql, /DELETE FROM public\.progress_events\s+WHERE profile_id = p_profile_id\s+AND user_id = parent_id/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.delete_child_profile\(uuid\) FROM PUBLIC, anon/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.delete_child_profile\(uuid\) TO authenticated/);
});

test('Child tombstones cannot silently succeed when RLS matches zero rows', () => {
  const child = 'child-123';
  assert.doesNotThrow(() => assertChildTombstoneAcknowledged(child, [{id:child}]));
  assert.throws(() => assertChildTombstoneAcknowledged(child, []), /doğrulamadı/);
  assert.throws(() => assertChildTombstoneAcknowledged(child, null), /doğrulamadı/);
  assert.throws(() => assertChildTombstoneAcknowledged(child, [{id:'another-child'}]), /doğrulamadı/);
  assert.throws(() => assertChildTombstoneAcknowledged(child, [{id:child},{id:child}]), /doğrulamadı/);
});
