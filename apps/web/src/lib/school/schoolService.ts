import {getSupabaseClient} from '../supabase/client.ts';

export type VentraSchool={id:string;name:string;brand_color:string;verified_at:string|null;owner_id:string};
export type VentraClassroom={id:string;school_id:string;name:string;grade_level:number;created_at:string};
export type TeacherRosterEntry={profile_id:string;nickname:string;grade_level:number|null;completed_levels:number;stars:number};
export type ParentClassroom={profile_id:string;classroom_id:string;school_name:string;class_name:string};
export type LinkedChild={id:string;nickname:string;grade_level:number|null;avatar_id?:string|null};
/** 1: the original tools; 2: class management, invite list, roster detail
 * (supabase/migrations/20261124000000_school_panel_management.sql). */
export type SchoolApiVersion=1|2;
export type ClassOverview=VentraClassroom&{student_count:number|null;active_invites:number|null};
export type IssuedInvite={code:string;validUntil:string;useLimit:number};
export type ActiveInvite={id:string;validUntil:string;used:number;useLimit:number};
/** The English summary a teacher sees (and the parent sees for their own child). */
export type EnglishSummary={completedLevels:number;stars:number;worlds:Record<string,number>|null;
 lastPlayedOn:string|null;levels7d:number|null};
export type RosterStudent=EnglishSummary&{profileId:string;nickname:string;gradeLevel:number|null;joinedAt:string|null};
export type InvitePreview={schoolName:string;className:string;gradeLevel:number;verified:boolean;validUntil:string;joinedProfiles:string[]};
export type ParentMembership=EnglishSummary&{profileId:string;classroomId:string;schoolName:string;className:string;
 gradeLevel:number|null;verified:boolean|null;joinedAt:string|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Inject a restricted RPC client in tests; runtime uses only the public anon key + authenticated JWT. */
export type SchoolApiClient={
 auth:{getUser:()=>Promise<{data:{user:{id:string}|null};error: {message:string}|null}>};
 from:(name:string)=>any;
 rpc:(name:string,args?:Record<string,unknown>)=>Promise<{data:any;error:{message:string;code?:string}|null}>;
};
export async function schoolClient(client:SchoolApiClient|null=getSupabaseClient() as SchoolApiClient|null):Promise<SchoolApiClient>{
 if(!client)throw new Error('Okul sistemi için Supabase bağlantısı gerekli.');
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)throw new Error('Bu işlem için yetişkin hesabına giriş yapmalısınız.');
 return client;
}
/** A class code is a UUID; parents paste it with spaces, capitals or line
 * breaks, or type it from the teacher's grouped display without dashes: 32
 * hex characters always come back in the 8-4-4-4-12 form. */
export function normaliseInviteCode(value:string):string{
 const hex=value.replace(/[^0-9a-fA-F]/g,'').toLowerCase();
 if(hex.length===32)return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
 return value.replace(/[^0-9a-fA-F-]/g,'').toLowerCase();
}
function validUUID(id:string){
 if(!uuid.test(id))throw new Error('Kimlik biçimi geçersiz.');
 return id;
}
function checkedName(value:string,minimum:number,maximum:number,label:string):string{
 const name=value.trim().replace(/\s+/g,' ');
 if(name.length<minimum||name.length>maximum)throw new Error(`${label} ${minimum}-${maximum} karakter olmalı.`);
 return name;
}
class SchoolRpcError extends Error{
 code:string;
 constructor(message:string,code=''){super(message);this.name='SchoolRpcError';this.code=code;}
}
async function rpc<T>(client:SchoolApiClient,name:string,args:Record<string,unknown>):Promise<T>{
 const {data,error}=await client.rpc(name,args);
 if(error)throw new SchoolRpcError(error.message,error.code);
 if(data==null)throw new Error('Sunucudan doğrulanabilir yanıt alınamadı.');
 return data as T;
}
/** PostgREST answers PGRST202 for a function the database does not have yet. */
export function isMissingFunction(error:unknown):boolean{
 const code=error instanceof SchoolRpcError?error.code:'';
 const message=error instanceof Error?error.message:'';
 return code==='PGRST202'||code==='42883'||/could not find the function|function .* does not exist/i.test(message);
}
const count=(value:unknown):number=>{const n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0;};
const text=(value:unknown):string=>typeof value==='string'?value:'';
const day=(value:unknown):string|null=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}/.test(value)?value.slice(0,10):null;
const time=(value:unknown):string|null=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null;
const grade=(value:unknown):number|null=>{const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=8?n:null;};
/** Per-world counts from the server: only English world ids and whole numbers. */
function worldCounts(value:unknown):Record<string,number>{
 const out:Record<string,number>={};
 if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const [key,n] of Object.entries(value as Record<string,unknown>)){
  if(/^island_[a-z_]{3,60}$/.test(key)&&count(n)>0)out[key]=count(n);
 }
 return out;
}
function summary(row:Record<string,unknown>,detailed:boolean):EnglishSummary{
 return {completedLevels:count(row.completed_levels),stars:count(row.stars),
  worlds:detailed?worldCounts(row.worlds):null,
  lastPlayedOn:detailed?day(row.last_played_on):null,
  levels7d:detailed?count(row.levels_7d):null};
}
/** Which tools this database offers (see SchoolApiVersion). */
export async function schoolApiVersion(client?:SchoolApiClient):Promise<SchoolApiVersion>{
 const db=await schoolClient(client);
 try{return Number(await rpc<number>(db,'ventra_school_api_version',{}))>=2?2:1;}
 catch(error){if(isMissingFunction(error))return 1;throw error;}
}
export async function schoolDashboard(client?:SchoolApiClient){
 const db=await schoolClient(client);
 const {data,error}=await db.from('ventra_schools').select('id,name,brand_color,verified_at,owner_id').order('created_at',{ascending:true}).limit(10);
 if(error)throw new Error(error.message);
 const schools=(data??[]) as VentraSchool[];
 const selected=schools[0];
 if(!selected)return {schools,classes:[] as VentraClassroom[]};
 const classes=await schoolClassrooms(selected.id,db);
 return {schools,classes};
}
export async function schoolClassrooms(schoolId:string,client?:SchoolApiClient):Promise<VentraClassroom[]>{
 const db=await schoolClient(client);
 const {data,error}=await db.from('ventra_classrooms').select('id,school_id,name,grade_level,created_at')
   .eq('school_id',validUUID(schoolId)).order('name',{ascending:true}).limit(200);
 if(error)throw new Error(error.message);
 return (data??[]) as VentraClassroom[];
}
export async function createSchool(name:string,brandColor:string,client?:SchoolApiClient):Promise<string>{
 const db=await schoolClient(client);
 if(!/^#[0-9a-fA-F]{6}$/.test(brandColor))throw new Error('Okul rengi geçersiz.');
 return rpc<string>(db,'ventra_create_school',{p_name:checkedName(name,3,90,'Okul adı'),p_brand_color:brandColor});
}
/** Classes with student and active-invite counts (version 2). */
export async function classOverview(schoolId:string,client?:SchoolApiClient):Promise<ClassOverview[]>{
 const db=await schoolClient(client);
 const rows=await rpc<Record<string,unknown>[]>(db,'ventra_class_overview',{p_school_id:validUUID(schoolId)});
 if(!Array.isArray(rows))throw new Error('Sınıf listesi doğrulanamadı.');
 return rows.map(row=>({id:text(row.id),school_id:text(row.school_id),name:text(row.name),
  grade_level:grade(row.grade_level)??1,created_at:text(row.created_at),
  student_count:count(row.student_count),active_invites:count(row.active_invites)}));
}
export async function updateSchool(schoolId:string,name:string,brandColor:string,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 if(!/^#[0-9a-fA-F]{6}$/.test(brandColor))throw new Error('Okul rengi geçersiz.');
 return rpc<boolean>(db,'ventra_update_school',{p_school_id:validUUID(schoolId),
  p_name:checkedName(name,3,90,'Okul adı'),p_brand_color:brandColor});
}
export async function updateClassroom(classroomId:string,name:string,grade:number,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 if(!Number.isInteger(grade)||grade<1||grade>8)throw new Error('Sınıf düzeyi 1–8 arasında olmalı.');
 return rpc<boolean>(db,'ventra_update_classroom',{p_classroom_id:validUUID(classroomId),
  p_name:checkedName(name,2,60,'Sınıf adı'),p_grade_level:grade});
}
export async function deleteClassroom(classroomId:string,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 return rpc<boolean>(db,'ventra_delete_classroom',{p_classroom_id:validUUID(classroomId)});
}
export const INVITE_DAYS=[1,7,30] as const;
export type InviteDays=typeof INVITE_DAYS[number];
/** A new invite valid for 1, 7 or 30 days (version 2). The code is shown once. */
export async function issueClassInviteFor(classroomId:string,days:InviteDays,client?:SchoolApiClient):Promise<IssuedInvite>{
 const db=await schoolClient(client);
 if(!INVITE_DAYS.includes(days))throw new Error('Davet süresi 1, 7 ya da 30 gün olmalı.');
 const rows=await rpc<Record<string,unknown>[]>(db,'ventra_create_class_invite_for',
  {p_classroom_id:validUUID(classroomId),p_days:days});
 const row=Array.isArray(rows)?rows[0]:null;
 const validUntil=time(row?.valid_until);
 if(!row||!validUntil)throw new Error('Davet kodu doğrulanamadı.');
 return {code:validUUID(text(row.invite_code)),validUntil,useLimit:count(row.use_limit)||40};
}
export async function activeInvites(classroomId:string,client?:SchoolApiClient):Promise<ActiveInvite[]>{
 const db=await schoolClient(client);
 const rows=await rpc<Record<string,unknown>[]>(db,'ventra_class_invites_active',{p_classroom_id:validUUID(classroomId)});
 if(!Array.isArray(rows))throw new Error('Davet listesi doğrulanamadı.');
 return rows.flatMap(row=>{
  const validUntil=time(row.valid_until);
  return validUntil&&uuid.test(text(row.invite_id))
   ?[{id:text(row.invite_id),validUntil,used:count(row.used),useLimit:count(row.use_limit)}]:[];
 });
}
export async function revokeInvite(inviteId:string,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 return rpc<boolean>(db,'ventra_revoke_class_invite',{p_invite_id:validUUID(inviteId)});
}
export async function removeStudent(classroomId:string,profileId:string,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 return rpc<boolean>(db,'ventra_teacher_remove_student',
  {p_classroom_id:validUUID(classroomId),p_profile_id:validUUID(profileId)});
}
/** Students of a class: the detailed summary on version 2, totals only on 1. */
export async function classStudents(classroomId:string,version:SchoolApiVersion,client?:SchoolApiClient):Promise<RosterStudent[]>{
 const db=await schoolClient(client);
 const detailed=version>=2;
 const rows=await rpc<Record<string,unknown>[]>(db,detailed?'ventra_teacher_roster_detail':'ventra_teacher_roster',
  {p_classroom_id:validUUID(classroomId)});
 if(!Array.isArray(rows))throw new Error('Öğrenci listesi doğrulanamadı.');
 return rows.map(row=>({...summary(row,detailed),profileId:text(row.profile_id),nickname:text(row.nickname)||'Öğrenci',
  gradeLevel:grade(row.grade_level),joinedAt:detailed?time(row.joined_at):null}));
}
/** Which school and class a code opens, before the parent agrees (version 2).
 * Null for a code that is unknown, used up or expired; nothing is used up. */
export async function previewInvite(code:string,client?:SchoolApiClient):Promise<InvitePreview|null>{
 const db=await schoolClient(client);
 const rows=await rpc<Record<string,unknown>[]>(db,'ventra_preview_class_invite',{p_code:validUUID(code.trim())});
 const row=Array.isArray(rows)?rows[0]:null;
 if(!row)return null;
 return {schoolName:text(row.school_name),className:text(row.class_name),gradeLevel:grade(row.grade_level)??1,
  verified:row.verified===true,validUntil:time(row.valid_until)??'',
  joinedProfiles:Array.isArray(row.joined_profiles)
   ?row.joined_profiles.filter((id:unknown):id is string=>typeof id==='string'):[]};
}
/** The parent's classes; on version 2 with exactly what the teacher sees. */
export async function parentMemberships(version:SchoolApiVersion,client?:SchoolApiClient):Promise<ParentMembership[]>{
 const db=await schoolClient(client);
 const detailed=version>=2;
 const rows=await rpc<Record<string,unknown>[]>(db,detailed?'ventra_my_classrooms_detail':'ventra_my_classrooms',{});
 if(!Array.isArray(rows))throw new Error('Sınıf kaydı okunamadı.');
 return rows.map(row=>({...summary(row,detailed),profileId:text(row.profile_id),classroomId:text(row.classroom_id),
  schoolName:text(row.school_name),className:text(row.class_name),gradeLevel:detailed?grade(row.grade_level):null,
  verified:detailed?row.verified===true:null,joinedAt:detailed?time(row.joined_at):null}));
}
export async function createClassroom(schoolId:string,name:string,grade:number,client?:SchoolApiClient){
 const db=await schoolClient(client);
 if(!Number.isInteger(grade)||grade<1||grade>8)throw new Error('Sınıf düzeyi 1–8 arasında olmalı.');
 return rpc<string>(db,'ventra_create_classroom',{p_school_id:validUUID(schoolId),
   p_name:checkedName(name,2,60,'Sınıf adı'),p_grade_level:grade});
}
export async function issueClassInvite(classroomId:string,client?:SchoolApiClient){
 const db=await schoolClient(client);
 const code=await rpc<string>(db,'ventra_create_class_invite',{p_classroom_id:validUUID(classroomId)});
 return validUUID(code);
}
export async function teacherRoster(classroomId:string,client?:SchoolApiClient):Promise<TeacherRosterEntry[]>{
 const db=await schoolClient(client);
 const result=await rpc<TeacherRosterEntry[]>(db,'ventra_teacher_roster',{p_classroom_id:validUUID(classroomId)});
 if(!Array.isArray(result))throw new Error('Öğrenci listesi doğrulanamadı.');
 return result;
}
export async function parentLinkedChildren(client?:SchoolApiClient):Promise<LinkedChild[]>{
 const db=await schoolClient(client);
 const {data,error}=await db.from('player_profiles').select('id,nickname,grade_level,avatar_id')
 .is('deleted_at',null).order('nickname',{ascending:true}).limit(50);
 if(error)throw new Error(error.message);
 return data??[];
}
export async function enrollChild(profileId:string,inviteCode:string,client?:SchoolApiClient){
 const db=await schoolClient(client);
 return rpc<string>(db,'ventra_enroll_child',{p_profile_id:validUUID(profileId),p_code:validUUID(inviteCode.trim())});
}
export async function parentClassrooms(client?:SchoolApiClient):Promise<ParentClassroom[]>{
 const db=await schoolClient(client);
 const result=await rpc<ParentClassroom[]>(db,'ventra_my_classrooms',{});
 if(!Array.isArray(result))throw new Error('Sınıf kaydı okunamadı.');
 return result;
}
export async function leaveClassroom(profileId:string,classroomId:string,client?:SchoolApiClient):Promise<boolean>{
 const db=await schoolClient(client);
 return rpc<boolean>(db,'ventra_leave_class',{p_profile_id:validUUID(profileId),p_classroom_id:validUUID(classroomId)});
}
