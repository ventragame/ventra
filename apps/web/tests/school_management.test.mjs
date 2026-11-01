import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSchool,createClassroom,issueClassInvite,enrollChild,teacherRoster,
  parentLinkedChildren,schoolClient} from '../src/lib/school/schoolService.ts';

const adult='11111111-1111-4111-8111-111111111111';
const school='22222222-2222-4222-8222-222222222222';
const klass='33333333-3333-4333-8333-333333333333';
const child='44444444-4444-4444-8444-444444444444';
const code='55555555-5555-4555-8555-555555555555';
function stub(log=[],asUser=true){
  return {
   auth:{getUser:async()=>({data:{user:asUser?{id:adult}:null},error:null})},
   rpc:async(name,args)=>{log.push({name,args});return {
     data:name==='ventra_teacher_roster'?[]:name==='ventra_enroll_child'?'Test School · 3-A':code,error:null};},
   from:()=>({select:()=>({
     is:()=>({order:()=>({limit:async()=>({data:[{id:child,nickname:'Ada',grade_level:3}],error:null})})}),
     order:()=>({limit:async()=>({data:[],error:null})})
   })})
  };
}
test('P6: authenticated adult and strict grade/name/id validation before RPC',async()=>{
 const log=[],db=stub(log);
 await assert.rejects(schoolClient(stub([],false)),/yetişkin/);
 await assert.rejects(createSchool('x','#123456',db),/3-90/);
 await assert.rejects(createSchool('Valid','#xyz',db),/renk/);
 await assert.rejects(createClassroom(school,'3-A',0,db),/1–8/);
 await assert.rejects(issueClassInvite('fake-id',db),/Kimlik/);
 await assert.rejects(enrollChild(child,'123',db),/Kimlik/);
 assert.equal(log.length,0);
 await createSchool('  Example School  ','#123abc',db);
 assert.equal(log[0].name,'ventra_create_school');
 assert.equal(log[0].args.p_name,'Example School');
 await createClassroom(school,'3-A',3,db);
 assert.equal(log[1].args.p_grade_level,3);
 assert.equal(await issueClassInvite(klass,db),code);
 assert.equal(await enrollChild(child,code,db),'Test School · 3-A');
 assert.deepEqual(await teacherRoster(klass,db),[]);
 assert.ok((await parentLinkedChildren(db))[0].nickname==='Ada');
});
test('P6: database migration defines server-owned RLS and parent-opt-in enrollment',()=>{
 const sql=fs.readFileSync(new URL('../../../supabase/migrations/20261101000002_school_classrooms_rls.sql',import.meta.url),'utf8');
 for(const table of ['ventra_schools','ventra_school_staff','ventra_classrooms','ventra_class_invites','ventra_class_enrollments']){
   assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS public\\.'+table));
   assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' ENABLE ROW LEVEL SECURITY'));
   assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' FORCE ROW LEVEL SECURITY'));
 }
 for(const fn of ['ventra_create_school','ventra_create_classroom','ventra_create_class_invite',
    'ventra_enroll_child','ventra_leave_class','ventra_teacher_roster','ventra_my_classrooms']){
   assert.ok(sql.includes('FUNCTION public.'+fn+'('));
 }
 assert.match(sql,/e\.parent_id=auth\.uid\(\)/);
 assert.match(sql,/p\.user_id=uid AND p\.deleted_at IS NULL/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/REVOKE ALL ON public\.ventra_schools/);
 assert.match(sql,/CREATE TRIGGER trg_ventra_cleanup_deleted_child/);
 assert.match(sql,/School|school/i);
});
test('P6: missing server RPC denies actions, no implicit local school',async()=>{
 const db=stub();
 db.rpc=async()=>({data:null,error:{message:'Could not find function public.ventra_create_school'}});
 await assert.rejects(createSchool('Ventra School','#2563eb',db),/Could not find function/);
});
