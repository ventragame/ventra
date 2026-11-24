import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {WORLD_GAMES} from '../src/lib/rewards/economyEngine.ts';

const MIGRATIONS=[
 '20261026000000_player_profiles_and_sync.sql',
 '20261026000001_harden_rls_and_reconcile_history.sql',
 '20261101000000_kids_learning_metadata.sql',
 '20261101000001_delete_child_profile_atomically.sql',
 '20261101000002_school_classrooms_rls.sql',
 '20261122000000_teacher_roster_all_english_worlds.sql',
 '20261124000000_school_panel_management.sql'
];
const sqlFile=name=>fs.readFileSync(new URL('../../../supabase/migrations/'+name,import.meta.url),'utf8').replace(/\r\n/g,'\n');

async function database(){
 const db=new PGlite();
 await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,created_at timestamptz DEFAULT now());
  CREATE TABLE public._school_session(uid uuid NULL);
  INSERT INTO public._school_session(uid) VALUES(null);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT uid FROM public._school_session LIMIT 1';
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS 'SELECT current_user::text';
  DO $$ BEGIN
   IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
   IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  END $$;
  GRANT SELECT,UPDATE ON public._school_session TO authenticated,anon;
  GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;
 `);
 for(const file of MIGRATIONS)await db.exec(sqlFile(file));
 const users={};
 for(const name of ['teacher','parent','otherParent','stranger','otherTeacher']){
  users[name]=(await db.query('INSERT INTO auth.users(email) VALUES($1) RETURNING id',[name+'@test.ventra'])).rows[0].id;
 }
 const as=async(id,role='authenticated')=>{
  await db.exec('RESET ROLE;');
  await db.query('UPDATE public._school_session SET uid=$1',[id]);
  await db.exec(role==='anon'?'SET ROLE anon;':'SET ROLE authenticated;');
 };
 const admin=async()=>{await db.exec('RESET ROLE;');};
 const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0];
 const rows=async(sql,args=[])=>(await db.query(sql,args)).rows;
 return {db,users,as,admin,one,rows};
}
let eventNo=0;
async function played(t,profile,user,game,level,stars,at){
 await t.admin();
 await t.db.query(`INSERT INTO public.progress_events(event_id,profile_id,user_id,event_type,game_id,level_id,stars_earned,client_timestamp)
  VALUES($1,$2,$3,'game_level',$4,$5,$6,$7)`,['ev-'+(++eventNo),profile,user,game,level,stars,at]);
}
const days=n=>new Date(Date.now()-n*86400000).toISOString();

test('Okul Paneli v2 SQL: world list matches the game, helpers are internal, anonymous users are shut out',async()=>{
 const sql=sqlFile('20261124000000_school_panel_management.sql');
 for(const world of WORLD_GAMES)assert.ok(sql.includes(`('${world.id}',${world.count})`),`${world.id} with ${world.count} levels`);
 assert.equal((sql.match(/\('island_[a-z_]+',\d+\)/g)||[]).length,WORLD_GAMES.length,'no extra worlds');
 assert.doesNotMatch(sql.replace(/--.*$/gm,''),/accuracy_rate|metrics|transcript|audio|score/i,'no answer, accuracy or voice data is read');
 const t=await database();
 try{
  await t.as(t.users.teacher);
  assert.equal((await t.one('SELECT public.ventra_school_api_version() AS v')).v,2);
  for(const call of ['SELECT * FROM public.ventra_english_worlds()',
   `SELECT * FROM public.ventra_child_english_summary('${t.users.parent}','${t.users.parent}')`,
   `SELECT public.ventra_is_school_staff('${t.users.parent}')`,
   `SELECT public.ventra_staff_classroom('${t.users.parent}')`]){
   await assert.rejects(t.db.query(call),/permission denied/i,call);
  }
  await t.as(null,'anon');
  for(const call of ['SELECT public.ventra_school_api_version()','SELECT * FROM public.ventra_my_classrooms_detail()',
   `SELECT * FROM public.ventra_preview_class_invite('${t.users.parent}')`,`SELECT * FROM public.ventra_class_overview('${t.users.parent}')`]){
   await assert.rejects(t.db.query(call),/permission denied/i,call);
  }
 }finally{await t.db.close();}
});

test('Okul Paneli v2 SQL: school settings, classes, invites, preview, roster detail, removal and parent view',async()=>{
 const t=await database();
 const {teacher,parent,otherParent,stranger,otherTeacher}=t.users;
 try{
  // School and classes
  await t.as(teacher);
  const sid=(await t.one('SELECT public.ventra_create_school($1,$2) AS id',['Martı İlkokulu','#2563eb'])).id;
  const cid=(await t.one('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'3-A',3])).id;
  await assert.rejects(t.db.query('SELECT public.ventra_create_classroom($1,$2,$3)',[sid,' 3-A ',3]),/Bu adla bir sınıf zaten var/);
  const cid2=(await t.one('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'4-B',4])).id;
  assert.equal((await t.one('SELECT public.ventra_update_classroom($1,$2,$3) AS ok',[cid2,'  4-C ',5])).ok,true);
  assert.deepEqual({...await t.one('SELECT name,grade_level FROM public.ventra_classrooms WHERE id=$1',[cid2])},{name:'4-C',grade_level:5});
  await assert.rejects(t.db.query('SELECT public.ventra_update_classroom($1,$2,$3)',[cid2,'3-A',3]),/Bu adla bir sınıf zaten var/);
  await assert.rejects(t.db.query('SELECT public.ventra_update_classroom($1,$2,$3)',[cid2,'x',3]),/geçersiz/);
  await assert.rejects(t.db.query('SELECT public.ventra_update_classroom($1,$2,$3)',[cid2,'4-C',9]),/geçersiz/);

  // School settings: owner only; renaming drops a verification
  assert.equal((await t.one('SELECT public.ventra_update_school($1,$2,$3) AS ok',[sid,'Martı İlkokulu','#0f766e'])).ok,true);
  await t.admin();await t.db.query('UPDATE public.ventra_schools SET verified_at=now() WHERE id=$1',[sid]);
  await t.as(teacher);
  await t.db.query('SELECT public.ventra_update_school($1,$2,$3)',[sid,'Martı İlkokulu','#7c3aed']);
  assert.ok((await t.one('SELECT verified_at FROM public.ventra_schools WHERE id=$1',[sid])).verified_at,'colour change keeps the badge');
  await t.db.query('SELECT public.ventra_update_school($1,$2,$3)',[sid,'Martı Koleji','#7c3aed']);
  assert.equal((await t.one('SELECT verified_at FROM public.ventra_schools WHERE id=$1',[sid])).verified_at,null,'a new name is not verified');
  await assert.rejects(t.db.query('SELECT public.ventra_update_school($1,$2,$3)',[sid,'Ok','#7c3aed']),/3-90/);
  await assert.rejects(t.db.query('SELECT public.ventra_update_school($1,$2,$3)',[sid,'Martı Koleji','red']),/Renk/);

  // Invites: chosen validity, 40 uses, code only at creation
  const invite=await t.one('SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[cid,7]);
  assert.match(invite.invite_code,/^[0-9a-f-]{36}$/);
  assert.equal(invite.use_limit,40);
  const hours=(new Date(invite.valid_until)-Date.now())/3600000;
  assert.ok(hours>167&&hours<=168.1,'valid for seven days: '+hours);
  await assert.rejects(t.db.query('SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[cid,5]),/1, 7 ya da 30 gün/);
  const spare=await t.one('SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[cid,1]);
  let active=await t.rows('SELECT * FROM public.ventra_class_invites_active($1)',[cid]);
  assert.equal(active.length,2);
  assert.deepEqual(Object.keys(active[0]).sort(),['invite_id','use_limit','used','valid_until'],'no code column');
  let overview=await t.rows('SELECT * FROM public.ventra_class_overview($1)',[sid]);
  assert.deepEqual(overview.map(c=>[c.name,c.grade_level,Number(c.student_count),Number(c.active_invites)]),[['3-A',3,0,2],['4-C',5,0,0]]);

  // Strangers and other teachers get nothing
  for(const who of [stranger,otherTeacher]){
   await t.as(who);
   if(who===otherTeacher)await t.db.query('SELECT public.ventra_create_school($1,$2)',['Başka Okul','#111111']);
   for(const [call,args] of [
    ['SELECT public.ventra_update_classroom($1,$2,$3)',[cid,'Hack',3]],
    ['SELECT public.ventra_delete_classroom($1)',[cid]],
    ['SELECT * FROM public.ventra_class_overview($1)',[sid]],
    ['SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[cid,30]],
    ['SELECT * FROM public.ventra_class_invites_active($1)',[cid]],
    ['SELECT public.ventra_revoke_class_invite($1)',[active[0].invite_id]],
    ['SELECT public.ventra_teacher_remove_student($1,$2)',[cid,cid]],
    ['SELECT * FROM public.ventra_teacher_roster_detail($1)',[cid]],
    ['SELECT public.ventra_update_school($1,$2,$3)',[sid,'Hacked School','#000000']]]){
    await assert.rejects(t.db.query(call,args),/yetki|sahibi/i,call);
   }
  }

  // Parent: preview first (does not use the code), then join
  await t.as(parent);
  const deniz=(await t.one('INSERT INTO public.player_profiles(user_id,nickname,avatar_id,grade_level) VALUES($1,$2,$3,$4) RETURNING id',[parent,'Deniz','avatar_fox',3])).id;
  const ece=(await t.one('INSERT INTO public.player_profiles(user_id,nickname,avatar_id,grade_level) VALUES($1,$2,$3,$4) RETURNING id',[parent,'Ece','avatar_owl',1])).id;
  let preview=await t.rows('SELECT * FROM public.ventra_preview_class_invite($1)',[invite.invite_code]);
  assert.equal(preview.length,1);
  assert.equal(preview[0].school_name,'Martı Koleji');assert.equal(preview[0].class_name,'3-A');
  assert.equal(preview[0].grade_level,3);assert.equal(preview[0].verified,false);
  assert.deepEqual(preview[0].joined_profiles,[]);
  assert.equal((await t.rows('SELECT * FROM public.ventra_preview_class_invite($1)',['00000000-0000-4000-8000-000000000000'])).length,0,'unknown code: nothing');
  await t.db.query('SELECT public.ventra_enroll_child($1,$2)',[deniz,invite.invite_code]);
  preview=await t.rows('SELECT * FROM public.ventra_preview_class_invite($1)',[invite.invite_code]);
  assert.deepEqual(preview[0].joined_profiles,[deniz],'the parent sees Deniz is already in');
  await t.admin();
  assert.equal((await t.one('SELECT used_count FROM public.ventra_class_invites WHERE code=$1',[invite.invite_code])).used_count,1,'preview did not use the code');
  await t.as(otherParent);
  const mavi=(await t.one('INSERT INTO public.player_profiles(user_id,nickname,avatar_id,grade_level) VALUES($1,$2,$3,$4) RETURNING id',[otherParent,'Mavi','avatar_cat',3])).id;
  preview=await t.rows('SELECT * FROM public.ventra_preview_class_invite($1)',[invite.invite_code]);
  assert.deepEqual(preview[0].joined_profiles,[],'another parent never learns who else is in the class');
  await t.db.query('SELECT public.ventra_enroll_child($1,$2)',[mavi,invite.invite_code]);

  // English progress: best stars per level, only the twelve worlds and real levels
  await played(t,deniz,parent,'island_word_garden_steps',1,2,days(0.01));
  await played(t,deniz,parent,'island_word_garden_steps',1,3,days(0.02));
  await played(t,deniz,parent,'island_word_garden_steps',2,1,days(3));
  await played(t,deniz,parent,'island_speaking_harbor_dialogue',1,3,days(9));
  await played(t,deniz,parent,'island_word_garden_steps',99,3,days(1));
  await played(t,deniz,parent,'some_other_game',1,3,days(1));
  await played(t,mavi,otherParent,'island_story_forest_discover',1,1,days(20));

  await t.as(teacher);
  const roster=await t.rows('SELECT * FROM public.ventra_teacher_roster_detail($1)',[cid]);
  assert.deepEqual(roster.map(r=>r.nickname),['Deniz','Mavi']);
  const d=roster[0];
  assert.equal(Number(d.completed_levels),3,'three real English levels');
  assert.equal(Number(d.stars),3+1+3,'best stars per level');
  assert.deepEqual(d.worlds,{island_word_garden_steps:2,island_speaking_harbor_dialogue:1});
  assert.equal(Number(d.levels_7d),2,'two levels in the last 7 days');
  assert.ok(d.last_played_on instanceof Date&&Date.now()-d.last_played_on<3*86400000,'last mission day: '+d.last_played_on);
  assert.ok(d.joined_at,'joined date');
  assert.deepEqual(Object.keys(d).sort(),['completed_levels','grade_level','joined_at','last_played_on','levels_7d','nickname','profile_id','stars','worlds'],
   'only the summary: no answers, accuracy, audio or text');
  assert.equal(Number(roster[1].levels_7d),0);
  overview=await t.rows('SELECT * FROM public.ventra_class_overview($1)',[sid]);
  assert.equal(Number(overview[0].student_count),2);
  // The older roster agrees on the totals for real levels (it also counted the out-of-range level)
  const old=await t.rows('SELECT * FROM public.ventra_teacher_roster($1)',[cid]);
  assert.equal(old.length,2);

  // The parent sees exactly what the teacher sees, for their own child only
  await t.as(parent);
  const mine=await t.rows('SELECT * FROM public.ventra_my_classrooms_detail()');
  assert.equal(mine.length,1);
  assert.equal(mine[0].profile_id,deniz);assert.equal(mine[0].school_name,'Martı Koleji');assert.equal(mine[0].class_name,'3-A');
  assert.equal(Number(mine[0].completed_levels),Number(d.completed_levels));
  assert.equal(Number(mine[0].stars),Number(d.stars));
  assert.deepEqual(mine[0].worlds,d.worlds);
  assert.equal(Number(mine[0].levels_7d),Number(d.levels_7d));
  await t.as(stranger);
  assert.equal((await t.rows('SELECT * FROM public.ventra_my_classrooms_detail()')).length,0);

  // Revoking a code stops it at once
  await t.as(teacher);
  const spareId=(await t.rows('SELECT * FROM public.ventra_class_invites_active($1)',[cid])).find(i=>Number(i.used)===0).invite_id;
  assert.equal((await t.one('SELECT public.ventra_revoke_class_invite($1) AS ok',[spareId])).ok,true);
  active=await t.rows('SELECT * FROM public.ventra_class_invites_active($1)',[cid]);
  assert.equal(active.length,1,'one code left');
  await t.as(parent);
  await assert.rejects(t.db.query('SELECT public.ventra_enroll_child($1,$2)',[ece,spare.invite_code]),/geçersiz veya süresi dolmuş/);
  assert.equal((await t.rows('SELECT * FROM public.ventra_preview_class_invite($1)',[spare.invite_code])).length,0);

  // A teacher takes a child out of the class; the child's progress stays
  await t.as(teacher);
  assert.equal((await t.one('SELECT public.ventra_teacher_remove_student($1,$2) AS ok',[cid,mavi])).ok,true);
  assert.equal((await t.one('SELECT public.ventra_teacher_remove_student($1,$2) AS ok',[cid,mavi])).ok,false,'already out');
  assert.deepEqual((await t.rows('SELECT * FROM public.ventra_teacher_roster_detail($1)',[cid])).map(r=>r.nickname),['Deniz']);
  await t.admin();
  assert.equal((await t.one('SELECT count(*)::int AS n FROM public.progress_events WHERE profile_id=$1',[mavi])).n,1,'progress kept');

  // Deleting a class removes its invites and enrollments, never progress
  await t.as(teacher);
  assert.equal((await t.one('SELECT public.ventra_delete_classroom($1) AS ok',[cid])).ok,true);
  await t.admin();
  assert.equal((await t.one('SELECT count(*)::int AS n FROM public.ventra_class_invites WHERE classroom_id=$1',[cid])).n,0);
  assert.equal((await t.one('SELECT count(*)::int AS n FROM public.ventra_class_enrollments WHERE classroom_id=$1',[cid])).n,0);
  assert.equal((await t.one('SELECT count(*)::int AS n FROM public.progress_events WHERE profile_id=$1',[deniz])).n,6,'progress kept');
  await t.as(parent);
  assert.equal((await t.rows('SELECT * FROM public.ventra_my_classrooms_detail()')).length,0);
  await t.as(teacher);
  assert.deepEqual((await t.rows('SELECT * FROM public.ventra_class_overview($1)',[sid])).map(c=>c.name),['4-C']);
 }finally{await t.db.close();}
});
