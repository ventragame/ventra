import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normaliseInviteCode} from '../src/lib/school/schoolService.ts';
import {WORLD_GAMES} from '../src/lib/rewards/economyEngine.ts';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const page=()=>read('../src/app/school/page.tsx');

test('School panel shows people what it does, not internal milestone notes',()=>{
 const ui=page();
 assert.doesNotMatch(ui,/P6|kabul kapısı|güvenlik kabulü|kurumsal yayına/,'internal notes were shown to teachers and parents');
 assert.match(ui,/role="radiogroup" aria-label="Paneli kim kullanıyor\?"/);
 assert.match(ui,/label:'Öğretmenim'/);assert.match(ui,/label:'Veliyim'/);
 assert.match(ui,/window\.localStorage\.setItem\(ROLE_KEY,next\)/,'the chosen role is remembered');
 assert.match(ui,/Okul paneli bu kurulumda kapalı/,'an honest state when the cloud is not configured');
});

test('Teacher: the selected class loads its students; invite code is readable and copyable',()=>{
 const ui=page();
 assert.match(ui,/\/\/ The selected class shows its students straight away\.\n useEffect\(\(\)=>\{\n   if\(!signedIn\|\|mode!=='teacher'\|\|!activeClass\)return;/);
 assert.doesNotMatch(ui,/Öğrencileri Gör/,'no manual "load students" button');
 assert.match(ui,/\{groupedCode\(issuedInvite\)\.map\(/);
 assert.match(ui,/<p className="sr-only">Davet kodu: \{issuedInvite\}<\/p>/);
 assert.match(ui,/Kod 7 gün ve en fazla 30 kez geçerlidir/);
 assert.match(ui,/Gerçek ad, e-posta, ses ya da yazılan metin paylaşılmaz\./);
});

test('Parent: pasted invite codes are tidied; joining needs the whole code',()=>{
 assert.equal(normaliseInviteCode(' 0D3F5A1C-1B2C-4D5E-8F90-ABCDEF123456\n'),'0d3f5a1c-1b2c-4d5e-8f90-abcdef123456');
 assert.equal(normaliseInviteCode('0d3f 5a1c'),'0d3f5a1c');
 const ui=page();
 assert.match(ui,/onChange=\{e=>setInviteCode\(normaliseInviteCode\(e\.target\.value\)\)\}/);
 assert.match(ui,/disabled=\{!chosenChild\|\|typedCode\.length!==36\|\|busy\}/);
 assert.match(ui,/await enrollChild\(chosenChild,typedCode\);/);
});

test('Roster migration counts all twelve English worlds and keeps the same security',()=>{
 const sql=read('../../../supabase/migrations/20261122000000_teacher_roster_all_english_worlds.sql');
 for(const world of WORLD_GAMES)assert.ok(sql.includes(`'${world.id}'`),world.id);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.ventra_teacher_roster\(p_classroom_id uuid\)\nRETURNS TABLE\(profile_id uuid,nickname text,grade_level smallint,completed_levels bigint,stars bigint\)/,'same signature: the client needs no change');
 assert.match(sql,/m\.user_id=auth\.uid\(\) AND m\.role IN \('owner','teacher'\)/);
 assert.match(sql,/p\.user_id=e\.parent_id AND p\.deleted_at IS NULL/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.ventra_teacher_roster\(uuid\) FROM PUBLIC,anon;/);
 assert.doesNotMatch(sql,/kesir|fraction/i);
});

test('Signed-in school panel: codes without dashes work, leaving asks first, errors read as plain formal Turkish',async()=>{
 assert.equal(normaliseInviteCode('AAAAAAAABBBB4CCC8DDD000000000777'),'aaaaaaaa-bbbb-4ccc-8ddd-000000000777','typed from the grouped display without dashes');
 assert.equal(normaliseInviteCode(' AAAAAAAA - BBBB - 4CCC - 8DDD - 000000000777 \n'),'aaaaaaaa-bbbb-4ccc-8ddd-000000000777');
 const ui=page();
 assert.doesNotMatch(ui,/maxLength=\{36\}/,'a pasted code is never cut before it is tidied');
 assert.match(ui,/`Kod eksik görünüyor: \$\{typedHex\}\/32 harf ve rakam\.`/);
 assert.match(ui,/\{pendingLeave!==key&&<button type="button" disabled=\{busy\} onClick=\{\(\)=>setPendingLeave\(key\)\}/);
 assert.match(ui,/aria-label=\{`\$\{nickname\} sınıftan ayrılsın mı\?`\}/);
 assert.equal(ui.match(/friendlyAccountError\(e,'[^']*',\{formal:true\}\)/g).length,4,'every school error is translated, in the "siz" form');
 assert.doesNotMatch(ui,/console\.error\(/,'handled errors are warnings (no dev overlay "Issue")');
 assert.match(ui,/onChange=\{e=>setCode\(cleanOtpCode\(e\.target\.value\)\)\}/);
 const {friendlyAccountError}=await import('../src/lib/profile/profileHub.ts');
 assert.equal(friendlyAccountError(new TypeError('Failed to fetch'),'x',{formal:true}),'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.');
 assert.equal(friendlyAccountError(new TypeError('Failed to fetch'),'x'),'İnternet bağlantısı kurulamadı. Bağlantını kontrol edip yeniden dene.');
});
