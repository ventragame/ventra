import {getSupabaseClient} from '../supabase/client.ts';

export type VentraSchool={id:string;name:string;brand_color:string;verified_at:string|null;owner_id:string};
export type VentraClassroom={id:string;school_id:string;name:string;grade_level:number;created_at:string};
export type TeacherRosterEntry={profile_id:string;nickname:string;grade_level:number|null;completed_levels:number;stars:number};
export type ParentClassroom={profile_id:string;classroom_id:string;school_name:string;class_name:string};
export type LinkedChild={id:string;nickname:string;grade_level:number|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Inject a restricted RPC client in tests; runtime uses only the public anon key + authenticated JWT. */
export type SchoolApiClient={
 auth:{getUser:()=>Promise<{data:{user:{id:string}|null};error: {message:string}|null}>};
 from:(name:string)=>any;
 rpc:(name:string,args?:Record<string,unknown>)=>Promise<{data:any;error:{message:string}|null}>;
};
export async function schoolClient(client:SchoolApiClient|null=getSupabaseClient() as SchoolApiClient|null):Promise<SchoolApiClient>{
 if(!client)throw new Error('Okul sistemi için Supabase bağlantısı gerekli.');
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)throw new Error('Bu işlem için yetişkin hesabına giriş yapmalısınız.');
 return client;
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
async function rpc<T>(client:SchoolApiClient,name:string,args:Record<string,unknown>):Promise<T>{
 const {data,error}=await client.rpc(name,args);
 if(error)throw new Error(error.message);
 if(data==null)throw new Error('Sunucudan doğrulanabilir yanıt alınamadı.');
 return data as T;
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
 const {data,error}=await db.from('player_profiles').select('id,nickname,grade_level')
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
