import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const MIGRATIONS=[
 '20261026000000_player_profiles_and_sync.sql',
 '20261026000001_harden_rls_and_reconcile_history.sql',
 '20261101000000_kids_learning_metadata.sql',
 '20261101000001_delete_child_profile_atomically.sql',
 '20261101000002_school_classrooms_rls.sql',
 '20261122000000_teacher_roster_all_english_worlds.sql',
 '20261124000000_school_panel_management.sql',
 '20261125000000_school_teachers.sql'
];
const sqlFile=name=>fs.readFileSync(new URL('../../../supabase/migrations/'+name,import.meta.url),'utf8').replace(/\r\n/g,'\n');

async function database(){
 const db=new PGlite();
 await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,
   email_confirmed_at timestamptz NULL DEFAULT now(),created_at timestamptz DEFAULT now());
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
 const u={};
 for(const name of ['holder','coteacher','coowner','stranger','parent']){
  u[name]=(await db.query('INSERT INTO auth.users(email) VALUES($1) RETURNING id',[name+'@test.ventra'])).rows[0].id;
 }
 u.unconfirmed=(await db.query('INSERT INTO auth.users(email,email_confirmed_at) VALUES($1,NULL) RETURNING id',['late@test.ventra'])).rows[0].id;
 const as=async(id,role='authenticated')=>{
  await db.exec('RESET ROLE;');
  await db.query('UPDATE public._school_session SET uid=$1',[id]);
  await db.exec(role==='anon'?'SET ROLE anon;':'SET ROLE authenticated;');
 };
 const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0];
 const rows=async(sql,args=[])=>(await db.query(sql,args)).rows;
 return {db,u,as,one,rows};
}

test('Several teachers in one school: invites by e-mail, class-scoped access, owners, leaving and parents',async()=>{
 const t=await database();const {db,u,as,one,rows}=t;
 const no=async(sql,args,pattern,what)=>assert.rejects(db.query(sql,args),pattern,what);
 try{
  await as(u.holder);
  assert.equal((await one('SELECT public.ventra_school_api_version() AS v')).v,3);
  const sid=(await one('SELECT public.ventra_create_school($1,$2) AS id',['Martı İlkokulu','#2563eb'])).id;
  await no('SELECT public.ventra_create_school($1,$2)',['İkinci Okul','#2563eb'],/zaten bir okul alanı var/,'one school area per account');
  const a3=(await one('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'3-A',3])).id;
  const b4=(await one('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'4-B',4])).id;
  await db.query('SELECT public.ventra_set_my_display_name($1,$2)',[sid,'  Ayşe   Yılmaz ']);
  await no('SELECT public.ventra_set_my_display_name($1,$2)',[sid,'A'],/2-60/);

  // Owner invites: e-mail tidied, classes checked, nothing secret returned
  const inv=await one('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,' CoTeacher@Test.Ventra ','teacher',[a3,'00000000-0000-4000-8000-000000000000']]);
  assert.ok(inv.invite_id&&inv.valid_until);
  assert.deepEqual(Object.keys(inv).sort(),['invite_id','valid_until']);
  await db.query('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'coowner@test.ventra','owner',[]]);
  await db.query('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'late@test.ventra','teacher',[]]);
  await no('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'not-an-email','teacher',[]],/E-posta adresi geçersiz/);
  await no('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'x@y.zz','principal',[]],/Rol geçersiz/);
  await no('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'HOLDER@test.ventra','teacher',[]],/zaten okulunuzda/);
  let pending=await rows('SELECT * FROM public.ventra_staff_invites_pending($1)',[sid]);
  assert.equal(pending.length,3);
  const co=pending.find(p=>p.email==='coteacher@test.ventra');
  assert.deepEqual([co.role,co.class_names],['teacher',['3-A']],'unknown class ids dropped');

  // Strangers get nothing; invite tables are closed to clients
  await as(u.stranger);
  await no('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'evil@x.yz','owner',[]],/yalnızca okul yöneticisi/);
  await no('SELECT * FROM public.ventra_staff_invites_pending($1)',[sid],/yalnızca okul yöneticisi/);
  await no('SELECT * FROM public.ventra_staff_invites',[],/permission denied/);
  await no('SELECT * FROM public.ventra_classroom_teachers',[],/permission denied/);
  await no('SELECT public.ventra_accept_staff_invite($1,$2)',[co.invite_id,'Sahte Ad'],/Davet bulunamadı/,'another address cannot accept');
  assert.equal((await rows('SELECT * FROM public.ventra_my_staff_invites()')).length,0);
  await no(`SELECT public.ventra_school_role('${sid}')`,[],/permission denied/,'internal helper');

  // An unconfirmed address cannot see or accept its invitation
  await as(u.unconfirmed);
  assert.equal((await rows('SELECT * FROM public.ventra_my_staff_invites()')).length,0);
  const lateId=pending.find(p=>p.email==='late@test.ventra').invite_id;
  await no('SELECT public.ventra_accept_staff_invite($1,$2)',[lateId,'Geç Kalan'],/Davet bulunamadı/);

  // The invited teacher sees the invitation and accepts with a name
  await as(u.coteacher);
  const mine=await rows('SELECT * FROM public.ventra_my_staff_invites()');
  assert.equal(mine.length,1);
  assert.deepEqual([mine[0].school_name,mine[0].role,mine[0].invited_by_name,mine[0].class_names,mine[0].verified],
   ['Martı İlkokulu','teacher','Ayşe Yılmaz',['3-A'],false]);
  await no('SELECT public.ventra_accept_staff_invite($1,$2)',[mine[0].invite_id,' x '],/2-60/);
  assert.equal((await one('SELECT public.ventra_accept_staff_invite($1,$2) AS id',[mine[0].invite_id,'Mehmet Kaya'])).id,sid);
  assert.equal((await rows('SELECT * FROM public.ventra_my_staff_invites()')).length,0,'invitation used');

  // A teacher opens only their own classes, everywhere
  let classes=await rows('SELECT * FROM public.ventra_school_classes($1)',[sid]);
  assert.deepEqual(classes.map(c=>[c.name,c.mine]),[['3-A',true]]);
  assert.deepEqual((await rows('SELECT name FROM public.ventra_classrooms ORDER BY name')).map(r=>r.name),['3-A'],'row policy');
  assert.deepEqual((await rows('SELECT * FROM public.ventra_class_overview($1)',[sid])).map(c=>c.name),['3-A']);
  assert.equal((await rows('SELECT * FROM public.ventra_teacher_roster_detail($1)',[a3])).length,0);
  for(const [call,args] of [['SELECT * FROM public.ventra_teacher_roster_detail($1)',[b4]],['SELECT * FROM public.ventra_teacher_roster($1)',[b4]],
   ['SELECT public.ventra_create_class_invite($1)',[b4]],['SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[b4,7]],
   ['SELECT * FROM public.ventra_class_invites_active($1)',[b4]],['SELECT public.ventra_update_classroom($1,$2,$3)',[b4,'4-Z',4]],
   ['SELECT public.ventra_teacher_remove_student($1,$2)',[b4,u.parent]]]){
   await no(call,args,/öğretmen yetkisi yok/,call);
  }
  await no('SELECT public.ventra_delete_classroom($1)',[a3],/yalnızca okul yöneticisi silebilir/,'even their own class');
  await no('SELECT public.ventra_update_school($1,$2,$3)',[sid,'Ele Geçirilen','#000000'],/sahibi/);
  await no('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'friend@x.yz','owner',[]],/yalnızca okul yöneticisi/);
  await no('SELECT public.ventra_set_staff_role($1,$2,$3)',[sid,u.coteacher,'owner'],/yalnızca okul yöneticisi/,'no self-promotion');
  await no('SELECT public.ventra_assign_teacher($1,$2)',[b4,u.coteacher],/yalnızca okul yöneticisi/);
  const code=(await one('SELECT * FROM public.ventra_create_class_invite_for($1,$2)',[a3,7])).invite_code;
  const c5=(await one('SELECT public.ventra_create_classroom($1,$2,$3) AS id',[sid,'5-C',5])).id;
  classes=await rows('SELECT * FROM public.ventra_school_classes($1)',[sid]);
  assert.deepEqual(classes.map(c=>c.name),['3-A','5-C'],'a class they open is theirs');
  let staff=await rows('SELECT * FROM public.ventra_school_staff_list($1)',[sid]);
  assert.deepEqual(staff.map(s=>[s.display_name,s.role,s.email]),[['Ayşe Yılmaz','owner',null],['Mehmet Kaya','teacher','coteacher@test.ventra']],
   'teachers see names; only their own e-mail');
  assert.deepEqual(staff[0].classroom_ids,[a3],'only classes the teacher can open');

  // Owners see everything, with teachers per class and e-mail addresses
  await as(u.holder);
  classes=await rows('SELECT * FROM public.ventra_school_classes($1)',[sid]);
  assert.deepEqual(classes.map(c=>[c.name,c.mine,c.teachers.map(x=>x.name)]),
   [['3-A',true,['Ayşe Yılmaz','Mehmet Kaya']],['4-B',true,['Ayşe Yılmaz']],['5-C',false,['Mehmet Kaya']]]);
  staff=await rows('SELECT * FROM public.ventra_school_staff_list($1)',[sid]);
  assert.deepEqual(staff.map(s=>[s.email,s.is_me,s.is_holder]),[['holder@test.ventra',true,true],['coteacher@test.ventra',false,false]]);
  assert.equal(staff[1].classroom_ids.length,2);

  // A parent with a class code sees the class's teachers by name
  await as(u.parent);
  assert.deepEqual((await rows('SELECT * FROM public.ventra_preview_class_teachers($1)',[code])).map(r=>r.display_name),['Ayşe Yılmaz','Mehmet Kaya']);
  assert.equal((await rows('SELECT * FROM public.ventra_preview_class_teachers($1)',['00000000-0000-4000-8000-000000000000'])).length,0);
  await as(null,'anon');
  for(const call of ['SELECT * FROM public.ventra_my_staff_invites()',`SELECT * FROM public.ventra_preview_class_teachers('${code}')`,
   `SELECT * FROM public.ventra_school_classes('${sid}')`,`SELECT * FROM public.ventra_school_staff_list('${sid}')`]){
   await no(call,[],/permission denied/,call);
  }

  // Assignments: owners add and remove; a teacher can step off their own class
  await as(u.holder);
  await db.query('SELECT public.ventra_assign_teacher($1,$2)',[b4,u.coteacher]);
  await no('SELECT public.ventra_assign_teacher($1,$2)',[b4,u.stranger],/okulun öğretmeni değil/);
  await as(u.coteacher);
  assert.equal((await rows('SELECT * FROM public.ventra_school_classes($1)',[sid])).length,3);
  assert.equal((await one('SELECT public.ventra_unassign_teacher($1,$2) AS ok',[c5,u.coteacher])).ok,true);
  await no('SELECT public.ventra_unassign_teacher($1,$2)',[a3,u.holder],/yalnızca okul yöneticisi/);
  await as(u.holder);
  await db.query('SELECT public.ventra_unassign_teacher($1,$2)',[a3,u.coteacher]);
  await as(u.coteacher);
  assert.deepEqual((await rows('SELECT * FROM public.ventra_school_classes($1)',[sid])).map(c=>c.name),['4-B']);
  await no('SELECT * FROM public.ventra_teacher_roster_detail($1)',[a3],/öğretmen yetkisi yok/,'access ends at once');

  // Owners: a second owner joins; the last owner can never disappear
  await as(u.holder);
  await no('SELECT public.ventra_remove_staff($1,$2)',[sid,u.holder],/en az bir yönetici/,'sole owner cannot leave');
  await no('SELECT public.ventra_set_staff_role($1,$2,$3)',[sid,u.holder,'teacher'],/en az bir yönetici/);
  await as(u.coowner);
  const ownerInvite=(await rows('SELECT * FROM public.ventra_my_staff_invites()'))[0];
  assert.equal(ownerInvite.role,'owner');
  await db.query('SELECT public.ventra_accept_staff_invite($1,$2)',[ownerInvite.invite_id,'Zeynep Ak']);
  assert.equal((await rows('SELECT * FROM public.ventra_school_classes($1)',[sid])).length,3,'owners open every class');
  await db.query('SELECT public.ventra_set_staff_role($1,$2,$3)',[sid,u.coteacher,'owner']);
  await db.query('SELECT public.ventra_set_staff_role($1,$2,$3)',[sid,u.coteacher,'teacher']);

  // The account holder leaves: the school moves to the remaining owner
  await as(u.holder);
  assert.equal((await one('SELECT public.ventra_remove_staff($1,$2) AS ok',[sid,u.holder])).ok,true);
  assert.equal((await rows('SELECT * FROM public.ventra_schools')).length,0,'the holder no longer sees the school');
  await db.exec('RESET ROLE;');
  assert.equal((await one('SELECT owner_id FROM public.ventra_schools WHERE id=$1',[sid])).owner_id,u.coowner);
  assert.equal((await one('SELECT count(*)::int AS n FROM public.ventra_classrooms WHERE school_id=$1',[sid])).n,3,'classes stay');
  await as(u.holder);
  assert.ok((await one('SELECT public.ventra_create_school($1,$2) AS id',['Yeni Okulum','#16a34a'])).id,'can open a new school area');
  await as(u.coowner);
  await no('SELECT public.ventra_create_school($1,$2)',['Bir Okul Daha','#16a34a'],/zaten bir okul alanı var/,'now holds Martı İlkokulu');
  await no('SELECT public.ventra_set_staff_role($1,$2,$3)',[sid,u.coowner,'teacher'],/en az bir yönetici/);

  // Removing a teacher ends their access; their assignments go with them
  await db.query('SELECT public.ventra_remove_staff($1,$2)',[sid,u.coteacher]);
  await db.exec('RESET ROLE;');
  assert.equal((await one('SELECT count(*)::int AS n FROM public.ventra_classroom_teachers WHERE user_id=$1',[u.coteacher])).n,0);
  await as(u.coteacher);
  assert.equal((await rows('SELECT * FROM public.ventra_schools')).length,0);
  await no('SELECT * FROM public.ventra_school_classes($1)',[sid],/yetkisi gerekli/);

  // Decline and cancel
  await as(u.coowner);
  await db.query('SELECT * FROM public.ventra_invite_staff($1,$2,$3,$4)',[sid,'coteacher@test.ventra','teacher',[]]);
  await as(u.coteacher);
  const again=(await rows('SELECT * FROM public.ventra_my_staff_invites()'))[0];
  assert.equal((await one('SELECT public.ventra_decline_staff_invite($1) AS ok',[again.invite_id])).ok,true);
  await as(u.coowner);
  pending=await rows('SELECT * FROM public.ventra_staff_invites_pending($1)',[sid]);
  assert.deepEqual(pending.map(p=>p.email),['late@test.ventra']);
  assert.equal((await one('SELECT public.ventra_cancel_staff_invite($1) AS ok',[pending[0].invite_id])).ok,true);
  assert.equal((await rows('SELECT * FROM public.ventra_staff_invites_pending($1)',[sid])).length,0);
 }finally{await db.close();}
});

test('Migration: role checks are explicit and every new function is closed to anonymous users',()=>{
 const sql=sqlFile('20261125000000_school_teachers.sql');
 const created=[...sql.matchAll(/CREATE OR REPLACE FUNCTION public\.(ventra_[a-z_]+)\(/g)].map(m=>m[1]);
 const revoked=sql.slice(sql.indexOf('-- 6. Grants'));
 for(const fn of created)assert.ok(revoked.includes('public.'+fn+'('),fn+' has explicit grants');
 assert.match(sql,/SECURITY DEFINER SET search_path=pg_catalog,pg_temp/);
 assert.doesNotMatch(sql,/SECURITY DEFINER\s*\n\s*AS/,'every definer function pins its search_path');
 assert.match(sql,/REVOKE ALL ON public\.ventra_classroom_teachers,public\.ventra_staff_invites FROM PUBLIC,anon,authenticated;/);
 assert.match(sql,/u\.email_confirmed_at IS NOT NULL/,'only confirmed addresses accept');
});
