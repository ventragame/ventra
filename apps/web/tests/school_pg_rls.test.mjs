import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const migrations=[
 '20261026000000_player_profiles_and_sync.sql',
 '20261026000001_harden_rls_and_reconcile_history.sql',
 '20261101000000_kids_learning_metadata.sql',
 '20261101000001_delete_child_profile_atomically.sql',
 '20261101000002_school_classrooms_rls.sql'
];
test('P6 real PostgreSQL RLS: owner-only school, parent-only enroll, teacher-only roster and child delete cleanup',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`
   CREATE SCHEMA IF NOT EXISTS auth;
   CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,created_at timestamptz DEFAULT now());
   CREATE TABLE public._school_session(uid uuid NULL);
   INSERT INTO public._school_session(uid) VALUES(null);
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
     'SELECT uid FROM public._school_session LIMIT 1';
   CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
     'SELECT current_user::text';
   DO $$ BEGIN
     IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
       CREATE ROLE authenticated;
     END IF;
     IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
       CREATE ROLE anon;
     END IF;
   END $$;
   GRANT SELECT,UPDATE ON public._school_session TO authenticated,anon;
   GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;
 `);
 for(const file of migrations){
   const sql=fs.readFileSync(new URL('../../../supabase/migrations/'+file,import.meta.url),'utf8');
   await db.exec(sql);
 }
 const ids=[];
 for(let i=0;i<3;i++){
  const row=await db.query('INSERT INTO auth.users(email) VALUES($1) RETURNING id',[ 'adult'+i+'@test.ventra' ]);
  ids.push(row.rows[0].id);
 }
 const as=async(id,role='authenticated')=>{
  await db.exec('RESET ROLE;');
  await db.query('UPDATE public._school_session SET uid=$1',[id]);
  await db.exec(role==='anon'?'SET ROLE anon;':'SET ROLE authenticated;');
 };
 const owner=ids[0],parent=ids[1],stranger=ids[2];
 await as(owner);
 const sid=(await db.query('SELECT public.ventra_create_school($1,$2) AS id',['Ventra Private School','#2863eb'])).rows[0].id;
 const cid=(await db.query('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'3-A',3])).rows[0].id;
 const code=(await db.query('SELECT public.ventra_create_class_invite($1) AS code',[cid])).rows[0].code;
 assert.ok(code);
 const ownerSchool=await db.query('SELECT id FROM public.ventra_schools');
 assert.equal(ownerSchool.rows.length,1);
 await as(stranger);
 assert.equal((await db.query('SELECT * FROM public.ventra_schools')).rows.length,0);
 assert.equal((await db.query('SELECT * FROM public.ventra_classrooms')).rows.length,0);
 await assert.rejects(db.query('SELECT public.ventra_create_classroom($1,$2,$3)',[sid,'Fake',3]),/yetkisi|permission/i);
 await assert.rejects(db.query('SELECT public.ventra_create_class_invite($1)',[cid]),/yetkisi|permission/i);
 await assert.rejects(db.query('INSERT INTO public.ventra_school_staff(school_id,user_id,role) VALUES($1,$2,$3)',[sid,stranger,'teacher']),/permission denied|row-level security/i);
 await as(parent);
 const child=(await db.query('INSERT INTO public.player_profiles(user_id,nickname,avatar_id,grade_level) VALUES($1,$2,$3,$4) RETURNING id',
  [parent,'Ada','avatar_explorer',3])).rows[0].id;
 const joined=(await db.query('SELECT public.ventra_enroll_child($1,$2) AS name',[child,code])).rows[0].name;
 assert.match(joined,/Ventra Private School/);
 const again=await db.query('SELECT public.ventra_enroll_child($1,$2) AS name',[child,code]);
 assert.match(again.rows[0].name,/3-A/);
 // Direct SELECT from this private table is intentionally forbidden to parents.
 await assert.rejects(db.query('SELECT used_count FROM public.ventra_class_invites WHERE code=$1',[code]),/permission denied/);
 await db.exec('RESET ROLE;');
 const invitedCount=(await db.query('SELECT used_count FROM public.ventra_class_invites WHERE code=$1',[code])).rows[0].used_count;
 await as(parent);
 assert.equal(Number(invitedCount),1);
 await as(stranger);
 assert.equal((await db.query('SELECT * FROM public.ventra_class_enrollments')).rows.length,0);
 await assert.rejects(db.query('SELECT public.ventra_enroll_child($1,$2)',[child,code]),/ebeveyn yetkisi/i);
 await assert.rejects(db.query('SELECT * FROM public.ventra_teacher_roster($1)',[cid]),/erişim yetkisi/i);
 await as(owner);
 const roster=await db.query('SELECT * FROM public.ventra_teacher_roster($1)',[cid]);
 assert.equal(roster.rows.length,1);
 assert.equal(roster.rows[0].nickname,'Ada');
 assert.equal(Number(roster.rows[0].completed_levels),0);
 await as(parent);
 assert.equal((await db.query('SELECT * FROM public.ventra_my_classrooms()')).rows.length,1);
 const removed=await db.query('SELECT public.ventra_leave_class($1,$2) AS ok',[child,cid]);
 assert.equal(removed.rows[0].ok,true);
 assert.equal((await db.query('SELECT * FROM public.ventra_my_classrooms()')).rows.length,0);
 await db.query('SELECT public.ventra_enroll_child($1,$2)',[child,code]);
 await db.query('SELECT public.delete_child_profile($1)',[child]);
 assert.equal((await db.query('SELECT * FROM public.ventra_my_classrooms()')).rows.length,0);
 await as(owner);
 assert.equal((await db.query('SELECT * FROM public.ventra_teacher_roster($1)',[cid])).rows.length,0);
 await as(null,'anon');
 await assert.rejects(db.query('SELECT * FROM public.ventra_schools'),/permission denied/i);
 await assert.rejects(db.query('SELECT public.ventra_create_school($1,$2)',['Unsafe','#000000']),/permission denied/i);
 }finally{await db.close();}
});
