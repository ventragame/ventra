import test from 'node:test';
import assert from 'node:assert/strict';
import {
 VENTRA_AVATARS,VENTRA_STARTER_AVATARS,AVATAR_COLLECTIONS,
 LEGACY_AVATAR_IDS,getAvatarById,avatarCatalogByCollection
} from '../../../packages/shared/src/profile.ts';
import {initialEconomy,migrateLegacyAvatar,avatarIsOwned,buyAvatar,economyBalance} from '../src/lib/rewards/economyEngine.ts';

test('Avatar wardrobe has 36 distinct characters across four themed worlds',()=>{
 assert.equal(VENTRA_AVATARS.length,36);
 assert.equal(VENTRA_STARTER_AVATARS.length,5);
 assert.equal(AVATAR_COLLECTIONS.length,4);
 assert.equal(new Set(VENTRA_AVATARS.map(a=>a.id)).size,36);
 assert.equal(new Set(VENTRA_AVATARS.map(a=>a.name)).size,36);
 for(const category of AVATAR_COLLECTIONS){
  const group=avatarCatalogByCollection(category.id);
  assert.ok(group.length>=6,category.id+' collection must be meaningful');
 }
 for(const avatar of VENTRA_AVATARS){
  assert.match(avatar.id,/^avatar_[a-z_]+$/);
  assert.ok(avatar.price===0||avatar.price>=25);
  assert.equal(Number.isInteger(avatar.price),true);
  assert.ok(['starter','rare','legendary'].includes(avatar.rarity));
  assert.ok(AVATAR_COLLECTIONS.some(x=>x.id===avatar.collection));
  assert.ok(avatar.tagline.trim().length>=12);
  assert.ok(avatar.bgColor.startsWith('#')&&avatar.accentColor.startsWith('#'));
  assert.equal(getAvatarById(avatar.id).id,avatar.id);
 }
 assert.ok(Math.max(...VENTRA_AVATARS.map(a=>a.price))<=160);
});

test('Older avatar IDs and prior coin expenses survive larger catalog',()=>{
 assert.equal(LEGACY_AVATAR_IDS.length,6);
 const current=initialEconomy('before-expansion');
 const legacy=migrateLegacyAvatar(current,'avatar_wizard');
 assert.equal(avatarIsOwned(legacy,'avatar_wizard'),true);
 assert.equal(migrateLegacyAvatar(legacy,'avatar_phoenix').ownedAvatars.length,1);
 assert.equal(avatarIsOwned(legacy,'avatar_phoenix'),false);
 const earn={...legacy,entries:[{id:'earn',kind:'daily',amount:200,at:'2026-11-11T00:00:00Z'}]};
 const bought=buyAvatar(earn,'avatar_star_sprite','2026-11-11T00:00:00Z');
 assert.equal(economyBalance(bought),60);
 assert.equal(economyBalance(buyAvatar(bought,'avatar_star_sprite','2026-11-11T00:00:01Z')),60);
 assert.equal(avatarIsOwned(bought,'avatar_star_sprite'),true);
});
