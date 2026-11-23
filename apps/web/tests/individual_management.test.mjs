import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ENGLISH_LEVEL_CHOICES,GRADE_CHOICES,cleanOtpCode,cloudState,englishLevelTitle,friendlyAccountError,
 isEmailLike,lastPlayedLabel,lastSyncLabel,nicknameProblem,playerDetail
} from '../src/lib/profile/profileHub.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const now=new Date('2026-11-22T15:00:00');

test('Hub copy: levels, grade line, last mission and last sync read naturally',()=>{
 assert.deepEqual(ENGLISH_LEVEL_CHOICES.map(c=>c.id),['Pre-A1','A1','A2']);
 assert.deepEqual([...GRADE_CHOICES],[1,2,3,4,5,6,7,8]);
 assert.equal(englishLevelTitle('A1'),'Biraz biliyorum');
 assert.equal(englishLevelTitle(undefined),'Yeni başlıyorum','older profiles have no level yet');
 assert.equal(playerDetail({gradeLevel:3,englishLevel:'A2'}),'3. sınıf · Temel biliyorum');
 assert.equal(playerDetail({gradeLevel:null,englishLevel:'Pre-A1'}),'Yeni başlıyorum');
 assert.equal(lastPlayedLabel(null,now),'Henüz görev bitirmedi');
 assert.equal(lastPlayedLabel('2026-11-22T09:00:00',now),'Son görev: bugün');
 assert.equal(lastPlayedLabel('2026-11-21T20:00:00',now),'Son görev: dün');
 assert.equal(lastPlayedLabel('2026-11-18T10:00:00',now),'Son görev: 4 gün önce');
 assert.equal(lastSyncLabel(null,now),'Bu cihazda henüz eşitlenmedi');
 assert.match(lastSyncLabel('2026-11-22T14:05:00',now),/^Son eşitleme: bugün 14:05$/);
 assert.equal(nicknameProblem(' A '),'Takma ad 2–15 karakter arasında olmalı.');
 assert.equal(nicknameProblem('Ada'),null);
});

test('Parents see plain Turkish, never server text or setup notes',()=>{
 const fallback='Kod gönderilemedi.';
 assert.equal(friendlyAccountError('For security purposes, you can only request this after 37 seconds.',fallback),'Çok sık kod istendi. Bir dakika bekleyip yeniden dene.');
 assert.equal(friendlyAccountError('Email rate limit exceeded',fallback),'Çok sık kod istendi. Bir dakika bekleyip yeniden dene.');
 assert.equal(friendlyAccountError('Token has expired or is invalid',fallback),'Kod geçersiz ya da süresi dolmuş. Yeni bir kod isteyebilirsin.');
 assert.equal(friendlyAccountError(new TypeError('Failed to fetch'),fallback),'İnternet bağlantısı kurulamadı. Bağlantını kontrol edip yeniden dene.');
 assert.equal(friendlyAccountError('Bulut profilleri okunamadı: permission denied for table player_profiles',fallback),'Bulut profilleri okunamadı.','our own sentence kept, the server detail dropped');
 assert.equal(friendlyAccountError('Güvenli profil silme başarısız. SQL migration gerekli olabilir: x',fallback),fallback);
 assert.equal(friendlyAccountError('Supabase ortam değişkenleri tanımlı değil.',fallback),fallback);
 assert.equal(friendlyAccountError('relation "x" does not exist',fallback),fallback);
 assert.equal(friendlyAccountError(undefined,fallback),fallback);
});

test('E-mail codes and addresses are tidied before they are sent',()=>{
 assert.equal(cleanOtpCode(' 12 34-56 '),'123456');
 assert.equal(cleanOtpCode('12345678901234'),'1234567890','at most ten digits');
 assert.ok(isEmailLike(' veli@ornek.com '));
 assert.ok(!isEmailLike('veli@ornek'));
 assert.ok(!isEmailLike('veli ornek.com'));
});

test('A child is linked, local or tied to another family; the hub never mixes them up',()=>{
 assert.equal(cloudState({userId:null},'parent-a'),'local');
 assert.equal(cloudState({userId:'parent-a'},'parent-a'),'linked');
 assert.equal(cloudState({userId:'parent-b'},'parent-a'),'foreign');
 assert.equal(cloudState({userId:'parent-b'},null),'linked','signed out: still backed up to a family');
});

test('After the family account is deleted, its children stay here as local profiles with the whole history queued',async()=>{
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Ada',avatarId:'avatar_explorer'});
 await repo.recordGameCompleted({sessionId:'s-1',profileId:child.id,gameId:'island_word_garden_colors',levelId:1,
  outcomeId:'en.colors',skillId:'en.colors',success:true,starsEarned:3,score:100,completedAt:'2026-11-20T10:00:00.000Z',
  metrics:{durationSeconds:40,attemptsCount:5,accuracyRate:1,wrongAttempts:0,hintsUsed:0}},child.id);
 await repo.updateProfile(child.id,{userId:'parent-a',isCloudSynced:true});
 const queued=await repo.getPendingEvents(child.id);
 assert.ok(queued.length>0);
 await repo.markEventsSynced(queued.map(e=>e.eventId));
 assert.equal((await repo.getPendingEvents(child.id)).length,0);
 const released=await repo.releaseProfileFromCloud(child.id);
 assert.equal(released.userId,null);
 assert.equal(released.isCloudSynced,false);
 assert.equal((await repo.getPendingEvents(child.id)).length,queued.length,'a later family link uploads everything, not only new games');
 assert.equal(await repo.getTotalStars(child.id),3,'progress itself is untouched');
 const idb=src('lib/progress/IndexedDBProgressRepository.ts');
 assert.match(idb,/public async releaseProfileFromCloud\(profileId: string\): Promise<PlayerProfile> \{/);
 assert.match(idb,/if \(session\.isCloudSynced\) store\.put\(\{ \.\.\.session, isCloudSynced: false \}\);/);
});

test('Backup window: a real dialog, inline confirmations, one sync action, honest copy',()=>{
 const ui=src('components/profile/AdultAccountModal.tsx');
 assert.doesNotMatch(ui,/window\.confirm/,'no browser confirm dialogs');
 assert.match(ui,/useDialogFocus\(dialogRef, isOpen\);/);
 assert.match(ui,/useFocusRescue\(dialogRef, isOpen,/);
 assert.match(ui,/role="dialog" aria-modal="true" aria-labelledby="adult-account-title"/);
 assert.doesNotMatch(ui,/NEXT_PUBLIC_SUPABASE|SQL migration|PLANNED_COIN_PACKS|Satın Alma Planı/,'no setup notes or unreleased purchases for parents');
 assert.equal(ui.match(/pullAllCloudProfiles\(\)/g).length,1,'one “Şimdi eşitle” action instead of two buttons doing the same');
 assert.match(ui,/setPending\(\{ kind: 'link', profileId: profile\.id \}\)/);
 assert.match(ui,/setPending\(\{ kind: 'delete', profileId: profile\.id \}\)/);
 assert.match(ui,/const emailMatches = Boolean\(account && deleteEmail\.trim\(\)\.toLowerCase\(\) === account\.email\.toLowerCase\(\)\);/);
 assert.match(ui,/disabled=\{isLoading \|\| !emailMatches\}/);
 assert.match(ui,/if \(profile\.userId === accountId\) await repo\.releaseProfileFromCloud\(profile\.id\);/);
 assert.match(ui,/inputMode="numeric" autoComplete="one-time-code"/);
 assert.match(ui,/cooldown > 0 \? `Yeni kod \(\$\{cooldown\} sn\)` : 'Kodu yeniden gönder'/);
 assert.match(ui,/Gerçek ad, ses kaydı, konuşma dökümü ya da çocuğun yazdığı metin gönderilmez\./);
 assert.match(src('app/progress/page.tsx'),/<AdultAccountModal isOpen showReportLink=\{false\}/,'the panel does not link to itself');
});

test('Player hub: three tabs, levels at creation, stars per child, phone dock for the avatar action',()=>{
 const ui=src('components/profile/ProfileSelectorModal.tsx');
 assert.match(ui,/role="tablist" aria-label="Kaşif merkezi bölümleri"/);
 assert.match(ui,/\{id:'avatar',icon:'✨',label:'Avatarım'\},\n \{id:'players',icon:'🧭',label:'Kaşiflerim'\},\n \{id:'level',icon:'📚',label:'Seviyem'\}/);
 assert.match(ui,/role="tab" id=\{'ph-tab-'\+t\.id\}\n\s*aria-selected=\{tab===t\.id\} aria-controls=\{'ph-panel-'\+t\.id\} tabIndex=\{tab===t\.id\?0:-1\}/);
 assert.match(ui,/event\.key==='ArrowRight'\?\(index\+1\)%TABS\.length/);
 assert.match(ui,/gradeLevel:newGrade\?Number\(newGrade\):null,englishLevel:newLevel\}\);/,'a sibling gets a level when created');
 assert.match(ui,/try\{return \[p\.id,await repo\.getTotalStars\(p\.id\)\] as const;\}/);
 assert.match(ui,/className="ph-dock relative/);
 assert.match(ui,/useFocusRescue\(dialogRef,isOpen&&!deleteCandidate,/);
 assert.doesNotMatch(ui,/text-\[1[01]px\]/,'12px text floor');
 const css=src('components/profile/profile-hub.css')+src('components/profile/avatar-collection.css');
 assert.doesNotMatch(css,/font-size:(?:[0-9]|1[01])px/,'12px text floor');
 assert.match(css,/\.avatar-stage-arrow\{z-index:2;display:grid;place-items:center;flex:0 0 44px;width:44px;height:52px;/);
 const welcome=src('components/onboarding/KidsWelcomeGate.tsx');
 assert.match(welcome,/ENGLISH_LEVEL_CHOICES\.map\(\(choice\) =>/,'first-run form uses the same level cards');
 assert.doesNotMatch(welcome,/text-\[11px\]/);
});

test('Parental gate: focus stays inside, numeric keyboard, a wrong answer is announced',()=>{
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/useDialogFocus\(dialogRef, isOpen\);/);
 assert.match(gate,/inputMode="numeric"/);
 assert.match(gate,/onChange=\{\(e\) => setUserAnswer\(answerOnly\(e\.target\.value\)\)\}/,'digits only');
 assert.match(gate,/<p id="ventra-parent-gate-error" role="alert"/);
 const hook=src('lib/a11y/useDialogFocus.ts');
 assert.match(hook,/const run=\+\+generation\.current;/);
 assert.match(hook,/const restore=\(\)=>\{\n\s*if\(generation\.current!==run\)return;/,'a re-run effect never pulls focus out of an open nested dialog');
 const rescue=src('lib/a11y/useFocusRescue.ts');
 assert.match(rescue,/if\(!dialog\|\|\(current&&current!==document\.body\)\)return;/,'only lost focus is moved');
});

test('World: a tap or swipe that starts on page controls never reaches the islands',()=>{
 const scene=src('components/game/scenes/WorldScene.ts');
 assert.match(scene,/return pointer\.downElement === canvas && \(pointer\.isDown \|\| pointer\.upElement === canvas\);/);
 assert.match(scene,/badgeHit\.on\('pointerup',\(pointer:Phaser\.Input\.Pointer\)=>\{\n\s*if\(this\.isInputLocked\|\|this\.hasDragged\|\|this\.isTransitioning\|\|!this\.isCanvasPress\(pointer\)\)return;/);
 assert.match(scene,/hitZone\.on\('pointerup', \(pointer: Phaser\.Input\.Pointer\) => \{\n\s*if \(this\.isInputLocked \|\| this\.hasDragged \|\| this\.isTransitioning \|\| !this\.isCanvasPress\(pointer\)\) return;/);
 assert.match(scene,/if \(this\.isInputLocked \|\| !this\.isCanvasPress\(pointer\)\) return;\n\s*this\.isPointerDown = true;/,'drags and swipes start on the canvas only');
});
