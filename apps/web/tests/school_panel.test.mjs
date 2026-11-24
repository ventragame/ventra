import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normaliseInviteCode,schoolApiVersion,classStudents,previewInvite,issueClassInviteFor,activeInvites,
 parentMemberships,isMissingFunction} from '../src/lib/school/schoolService.ts';
import {SKILL_AREAS,TOTAL_LEVELS,skillProgress,startedWorlds,classSkills,classInsight,activity,daysBetween,istanbulDay,
 sortStudents,matchesName,inviteBaseUrl,inviteLink,inviteFromHash,inviteMessage,teacherSees,TEACHER_NEVER_SEES,formatDay,
 initialOf} from '../src/lib/school/schoolInsights.ts';
import {WORLD_GAMES} from '../src/lib/rewards/economyEngine.ts';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const page=()=>read('../src/app/school/page.tsx');
const teacher=()=>read('../src/components/school/TeacherWorkspace.tsx');
const invites=()=>read('../src/components/school/InvitePanel.tsx');
const roster=()=>read('../src/components/school/ClassRoster.tsx');
const parent=()=>read('../src/components/school/ParentWorkspace.tsx');
const signIn=()=>read('../src/components/school/SchoolSignIn.tsx');
const schoolFiles=()=>[page(),teacher(),invites(),roster(),parent(),signIn(),read('../src/components/school/schoolUi.tsx'),
 read('../src/components/school/InviteShowcase.tsx'),read('../src/components/school/TeamPanel.tsx')];

test('School panel shows people what it does, not internal milestone notes',()=>{
 for(const ui of schoolFiles())assert.doesNotMatch(ui,/P6|kabul kapısı|güvenlik kabulü|kurumsal yayına/,'internal notes were shown to teachers and parents');
 const ui=page();
 assert.match(ui,/role="radiogroup" aria-label="Paneli kim kullanıyor\?"/);
 assert.match(ui,/label:'Öğretmenim'/);assert.match(ui,/label:'Veliyim'/);
 assert.match(ui,/window\.localStorage\.setItem\(ROLE_KEY,next\)/,'the chosen role is remembered');
 assert.match(ui,/Okul paneli bu kurulumda kapalı/,'an honest state when the cloud is not configured');
 // a real radio group: one tab stop, arrow keys, Home and End
 assert.match(ui,/tabIndex=\{on\?0:-1\}/);
 assert.match(ui,/\{ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1\}/);
 assert.match(ui,/event\.key==='Home'/);assert.match(ui,/event\.key==='End'/);
});

test('Teacher: the selected class loads its students; invite code is readable and copyable',()=>{
 const ui=teacher();
 assert.match(ui,/\/\/ The selected class shows its students straight away\.\n const loadRoster=useCallback\(async\(\)=>\{/);
 assert.match(ui,/useEffect\(\(\)=>\{void loadRoster\(\);\},\[loadRoster\]\);/);
 assert.match(ui,/<ClassDetail key=\{current\.id\}/,'switching class starts fresh');
 assert.doesNotMatch(ui,/Öğrencileri Gör/,'no manual "load students" button');
 const inv=invites();
 assert.match(inv,/\{issued\.code\.toUpperCase\(\)\.split\('-'\)\.map\(/);
 assert.match(inv,/<p className="sr-only">Davet kodu: \{issued\.code\}<\/p>/);
 assert.match(inv,/Kod 7 gün ve en fazla 30 kez geçerlidir/,'the older database keeps its honest limits');
 assert.match(inv,/Bir davetle en fazla 40 çocuk katılabilir\./);
 assert.match(ui,/Gerçek ad, e-posta, ses ya da yazılan metin paylaşılmaz\./);
});

test('Parent: pasted invite codes are tidied; joining needs the whole code',()=>{
 assert.equal(normaliseInviteCode(' 0D3F5A1C-1B2C-4D5E-8F90-ABCDEF123456\n'),'0d3f5a1c-1b2c-4d5e-8f90-abcdef123456');
 assert.equal(normaliseInviteCode('0d3f 5a1c'),'0d3f5a1c');
 const ui=parent();
 assert.match(ui,/onChange=\{e=>setInviteCode\(normaliseInviteCode\(e\.target\.value\)\)\}/);
 assert.match(ui,/disabled=\{!chosenChild\|\|typedCode\.length!==36\|\|busy\|\|blocked\}/);
 assert.match(ui,/await enrollChild\(chosenChild,typedCode\);/);
});

test('Signed-in school panel: codes without dashes work, leaving asks first, errors read as plain formal Turkish',async()=>{
 assert.equal(normaliseInviteCode('AAAAAAAABBBB4CCC8DDD000000000777'),'aaaaaaaa-bbbb-4ccc-8ddd-000000000777','typed from the grouped display without dashes');
 assert.equal(normaliseInviteCode(' AAAAAAAA - BBBB - 4CCC - 8DDD - 000000000777 \n'),'aaaaaaaa-bbbb-4ccc-8ddd-000000000777');
 const ui=parent();
 assert.doesNotMatch(ui,/maxLength=\{36\}/,'a pasted code is never cut before it is tidied');
 assert.match(ui,/`Kod eksik görünüyor: \$\{typedHex\}\/32 harf ve rakam\.`/);
 assert.match(ui,/\{pendingLeave!==key&&<button type="button" disabled=\{busy\} onClick=\{\(\)=>setPendingLeave\(key\)\}/);
 assert.match(ui,/<ConfirmBox label=\{`\$\{nickname\} sınıftan ayrılsın mı\?`\} confirm="Evet, ayrılsın"/);
 for(const source of schoolFiles()){
  const calls=source.match(/friendlyAccountError\(/g)?.length??0;
  const formal=source.match(/friendlyAccountError\([^;]*\{formal:true\}\)/g)?.length??0;
  assert.equal(formal,calls,'every school error is translated, in the "siz" form');
  assert.doesNotMatch(source,/console\.error\(/,'handled errors are warnings (no dev overlay "Issue")');
 }
 assert.match(signIn(),/onChange=\{e=>setCode\(cleanOtpCode\(e\.target\.value\)\)\}/);
 assert.match(signIn(),/cooldown>0\?`Yeni kod \(\$\{cooldown\} sn\)`:'Kodu yeniden gönder'/,'a resend timer');
 const {friendlyAccountError}=await import('../src/lib/profile/profileHub.ts');
 assert.equal(friendlyAccountError(new TypeError('Failed to fetch'),'x',{formal:true}),'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.');
 assert.equal(friendlyAccountError(new TypeError('Failed to fetch'),'x'),'İnternet bağlantısı kurulamadı. Bağlantını kontrol edip yeniden dene.');
 assert.equal(friendlyAccountError(new Error('Bu adla bir sınıf zaten var'),'x',{formal:true}),'Bu adla bir sınıf zaten var.');
});

test('Skill areas: every English world counted once; progress never exceeds a world',()=>{
 const ids=SKILL_AREAS.flatMap(a=>a.worlds.map(w=>w.id));
 assert.deepEqual([...ids].sort(),WORLD_GAMES.map(w=>w.id).sort());
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(TOTAL_LEVELS,WORLD_GAMES.reduce((n,w)=>n+w.count,0));
 assert.equal(SKILL_AREAS.reduce((n,a)=>n+a.total,0),TOTAL_LEVELS);
 const p=skillProgress({island_word_garden_steps:99,island_speaking_harbor_dialogue:2,unknown_world:5});
 assert.deepEqual(p.map(s=>[s.id,s.done]),[['words',5],['sentences',0],['reading',0],['speaking',2],['writing',0]]);
 assert.deepEqual(skillProgress(null).map(s=>s.done),[0,0,0,0,0]);
 assert.deepEqual(startedWorlds({island_speaking_harbor_dialogue:2,island_word_garden_colors:1}).map(w=>`${w.label} ${w.done}/${w.total}`),
  ['Renk Korusu 1/3','Diyalog Limanı 2/5'],'curriculum order');
});

const student=(id,nickname,worlds,extra={})=>({profileId:id,nickname,gradeLevel:3,joinedAt:null,completedLevels:Object.values(worlds).reduce((n,x)=>n+x,0),
 stars:0,worlds,lastPlayedOn:null,levels7d:0,...extra});

test('Class summary: averages per skill and one sentence a teacher can act on',()=>{
 assert.equal(classInsight(classSkills([]),0),null);
 const fresh=[student('a','Ada',{}),student('b','Bora',{})];
 assert.match(classInsight(classSkills(fresh),2),/henüz İngilizce görev yapmadı.*🐾 Hayvan Çayırı/);
 const kids=[student('a','Ada',{island_word_garden_steps:5,island_story_forest_discover:3}),student('b','Bora',{island_word_garden_steps:1})];
 const skills=classSkills(kids);
 const words=skills.find(s=>s.id==='words');
 assert.equal(words.students,2);
 assert.equal(words.percent,Math.round(100*((5/83)+(1/83))/2));
 assert.equal(skills.find(s=>s.id==='reading').students,1);
 const sentence=classInsight(skills,2);
 assert.match(sentence,/^Sınıf en çok (Kelime|Okuma) alanında ilerliyor\./);
 assert.match(sentence,/Cümle alanında henüz görev yok; derste 🏰 Uyanan Meydan ile başlayabilirsiniz\./);
});

test('Last mission labels count Turkish calendar days',()=>{
 assert.equal(daysBetween('2026-11-20','2026-11-24'),4);
 assert.deepEqual(activity(null,'2026-11-24'),{label:'Henüz görev yok',tone:'none'});
 assert.equal(activity('2026-11-24','2026-11-24').label,'Bugün');
 assert.equal(activity('2026-11-23','2026-11-24').label,'Dün');
 assert.equal(activity('2026-11-19','2026-11-24').label,'5 gün önce');
 assert.equal(activity('2026-11-14','2026-11-24').tone,'quiet');
 assert.equal(activity('2026-11-03','2026-11-24').label,'3 hafta önce');
 assert.equal(activity('2026-08-01','2026-11-24').label,'2 aydan uzun süre önce');
 assert.equal(activity('2026-11-25','2026-11-24').label,'Bugün','a future day is never "in -1 days"');
 assert.equal(istanbulDay(new Date('2026-11-24T22:30:00Z')),'2026-11-25','evening in UTC is the next day in Turkey');
 assert.equal(formatDay('2026-12-01'),'1 Aralık');
 assert.equal(formatDay('2026-12-01T20:59:00Z',true),'1 Ara');
});

test('Roster sorting and search follow Turkish rules',()=>{
 const list=[student('1','İpek',{island_word_garden_steps:1},{stars:3,lastPlayedOn:'2026-11-20'}),
  student('2','ali',{island_word_garden_steps:4},{stars:9,lastPlayedOn:null}),
  student('3','Çağan',{island_word_garden_steps:2},{stars:9,lastPlayedOn:'2026-11-24'})];
 assert.deepEqual(sortStudents(list,'name').map(s=>s.nickname),['ali','Çağan','İpek']);
 assert.deepEqual(sortStudents(list,'missions').map(s=>s.nickname),['ali','Çağan','İpek']);
 assert.deepEqual(sortStudents(list,'stars').map(s=>s.nickname),['ali','Çağan','İpek']);
 assert.deepEqual(sortStudents(list,'recent').map(s=>s.nickname),['Çağan','İpek','ali']);
 assert.ok(matchesName('İpek','ipe'));assert.ok(matchesName('Işık','ışı'));assert.ok(!matchesName('Ada','b'));
 assert.equal(initialOf('ipek'),'İ');
});

test('Invite links carry the code after "#", read back exactly, and the message says what is shared',()=>{
 const code='0d3f5a1c-1b2c-4d5e-8f90-abcdef123456';
 assert.equal(inviteBaseUrl('https://ventra.example/',null,true),'https://ventra.example','a configured address wins, even in the app');
 assert.equal(inviteBaseUrl(undefined,'https://okul.ventra.example',false),'https://okul.ventra.example');
 assert.equal(inviteBaseUrl(undefined,'https://localhost',true),null,'no link from inside the app');
 assert.equal(inviteBaseUrl('',null,false),null);
 const link=inviteLink('https://ventra.example',code);
 assert.equal(link,`https://ventra.example/school#davet=${code}`);
 assert.equal(inviteFromHash(new URL(link).hash),code);
 assert.equal(inviteFromHash('#davet='+code.toUpperCase().replace(/-/g,'')),code);
 assert.equal(inviteFromHash('#davet=1234'),null);
 assert.equal(inviteFromHash('#x=1&davet='+code),code);
 assert.equal(inviteLink(null,code),null);
 const message=inviteMessage({schoolName:'Martı İlkokulu',className:'3-A',code,link,validUntil:'2026-12-01T09:00:00Z'});
 assert.match(message,/^Merhaba! Martı İlkokulu · 3-A sınıfımız/);
 assert.ok(message.includes(link)&&message.includes(code));
 assert.match(message,/Davet 1 Aralık tarihine kadar geçerli\./);
 assert.match(message,/gerçek ad, ses ve yazılan metinler paylaşılmaz/);
 const noLink=inviteMessage({schoolName:'Martı İlkokulu',className:'3-A',code,link:null,validUntil:null});
 assert.doesNotMatch(noLink,/http/);assert.match(noLink,/Okul Paneli → Veliyim bölümüne bu kodu yazın:\n0d3f5a1c/);
 assert.equal(teacherSees(1).length,2);
 assert.ok(teacherSees(2).some(s=>/Son İngilizce görev günü/.test(s)));
 assert.ok(TEACHER_NEVER_SEES.some(s=>/Ses kaydı/.test(s))&&TEACHER_NEVER_SEES.some(s=>/Yazdığı metinler/.test(s)));
});

const adult='11111111-1111-4111-8111-111111111111';
const klass='33333333-3333-4333-8333-333333333333';
const code='55555555-5555-4555-8555-555555555555';
function stub(answer){
 const log=[];
 return {log,client:{auth:{getUser:async()=>({data:{user:{id:adult}},error:null})},from:()=>({}),
  rpc:async(name,args)=>{log.push({name,args});return answer(name,args);}}};
}

test('Service: the database version decides which tools are offered; old databases keep working',async()=>{
 let s=stub(()=>({data:null,error:{code:'PGRST202',message:'Could not find the function public.ventra_school_api_version without parameters in the schema cache'}}));
 assert.equal(await schoolApiVersion(s.client),1);
 s=stub(()=>({data:2,error:null}));
 assert.equal(await schoolApiVersion(s.client),2);
 s=stub(()=>({data:null,error:{message:'Failed to fetch'}}));
 await assert.rejects(schoolApiVersion(s.client),/Failed to fetch/,'a network error is not mistaken for an old database');
 assert.equal(isMissingFunction(new Error('function public.x(uuid) does not exist')),true);
 assert.equal(isMissingFunction(new Error('Davet kodu geçersiz')),false);

 s=stub(name=>({data:name==='ventra_teacher_roster'?[{profile_id:adult,nickname:'Deniz',grade_level:3,completed_levels:'14',stars:38}]:null,error:null}));
 const legacy=await classStudents(klass,1,s.client);
 assert.equal(s.log[0].name,'ventra_teacher_roster');
 assert.deepEqual(legacy[0],{completedLevels:14,stars:38,worlds:null,lastPlayedOn:null,levels7d:null,profileId:adult,nickname:'Deniz',gradeLevel:3,joinedAt:null});
 s=stub(()=>({data:[{profile_id:adult,nickname:'Deniz',grade_level:9,joined_at:'2026-11-20T10:00:00Z',completed_levels:3,stars:7,
  worlds:{island_word_garden_steps:2,island_speaking_harbor_dialogue:'1',evil_key:3,island_x:-2},last_played_on:'2026-11-24',levels_7d:2}],error:null}));
 const detail=await classStudents(klass,2,s.client);
 assert.equal(s.log[0].name,'ventra_teacher_roster_detail');
 assert.deepEqual(detail[0].worlds,{island_word_garden_steps:2,island_speaking_harbor_dialogue:1},'only English world ids, whole positive numbers');
 assert.equal(detail[0].gradeLevel,null,'an impossible grade is dropped');
 assert.equal(detail[0].lastPlayedOn,'2026-11-24');assert.equal(detail[0].levels7d,2);
});

test('Service: invites, preview and the parent view are validated before they reach the screen',async()=>{
 let s=stub(()=>({data:[{invite_code:code,valid_until:'2026-12-01T09:00:00Z',use_limit:40}],error:null}));
 await assert.rejects(issueClassInviteFor(klass,5,s.client),/1, 7 ya da 30 gün/);
 assert.equal(s.log.length,0,'nothing sent for a bad choice');
 assert.deepEqual(await issueClassInviteFor(klass,30,s.client),{code,validUntil:'2026-12-01T09:00:00Z',useLimit:40});
 assert.deepEqual(s.log[0],{name:'ventra_create_class_invite_for',args:{p_classroom_id:klass,p_days:30}});
 s=stub(()=>({data:[{invite_id:code,valid_until:'2026-12-01T09:00:00Z',used:3,use_limit:40},{invite_id:'bad',valid_until:'x'}],error:null}));
 assert.deepEqual(await activeInvites(klass,s.client),[{id:code,validUntil:'2026-12-01T09:00:00Z',used:3,useLimit:40}]);
 s=stub(()=>({data:[],error:null}));
 assert.equal(await previewInvite(code,s.client),null,'unknown or expired code');
 await assert.rejects(previewInvite('1234',s.client),/Kimlik/);
 s=stub(()=>({data:[{school_name:'Martı',class_name:'3-A',grade_level:3,verified:false,valid_until:'2026-12-01T09:00:00Z',joined_profiles:[adult,7]}],error:null}));
 assert.deepEqual(await previewInvite(code,s.client),{schoolName:'Martı',className:'3-A',gradeLevel:3,verified:false,
  validUntil:'2026-12-01T09:00:00Z',joinedProfiles:[adult]});
 s=stub(name=>({data:[{profile_id:adult,classroom_id:klass,school_name:'Martı',class_name:'3-A',...(name==='ventra_my_classrooms_detail'?
  {grade_level:3,verified:true,joined_at:'2026-11-20T10:00:00Z',completed_levels:4,stars:9,worlds:{island_word_garden_colors:3},last_played_on:'2026-11-23',levels_7d:1}:{})}],error:null}));
 const old=await parentMemberships(1,s.client);
 assert.equal(s.log[0].name,'ventra_my_classrooms');
 assert.equal(old[0].worlds,null);assert.equal(old[0].verified,null);
 const now=await parentMemberships(2,s.client);
 assert.equal(s.log[1].name,'ventra_my_classrooms_detail');
 assert.deepEqual([now[0].completedLevels,now[0].stars,now[0].verified,now[0].lastPlayedOn],[4,9,true,'2026-11-23']);
});

test('UI contract: invite links prefill the parent view, destructive steps ask first, feedback is announced',()=>{
 const p=page();
 assert.match(p,/const linked=inviteFromHash\(window\.location\.hash\);/);
 assert.match(p,/window\.history\.replaceState\(window\.history\.state,'',window\.location\.pathname\+window\.location\.search\)/,'the code leaves the address bar');
 assert.match(p,/if\(waiting\)\{setInvite\(waiting\);setFromLink\(true\);\}/);
 assert.match(p,/try\{window\.localStorage\.setItem\(ROLE_KEY,'parent'\);\}/,'a fresh link remembers the parent view; a kept code never overrides a later choice');
 assert.match(p,/forgetIssuedInvites\(\);/,'codes shown in this tab are forgotten on sign-out');
 assert.match(p,/<div role="status" aria-live="polite"/);assert.match(p,/<div role="alert"/);
 const inv=invites();
 assert.match(inv,/inviteMessage\(\{schoolName:school\.name,className:klass\.name,code:issued\.code,link,validUntil:issued\.validUntil\}\)/);
 assert.match(inv,/matchMedia\?\.\('\(pointer: coarse\)'\)/,'the share sheet on phones, a copied message on computers');
 assert.match(inv,/<ConfirmBox label="Davet iptal edilsin mi\?"/);
 assert.match(teacher(),/<ConfirmBox label=\{`\$\{klass\.name\} sınıfı silinsin mi\?`\}/);
 assert.match(roster(),/<ConfirmBox label=\{`\$\{student\.nickname\} sınıftan çıkarılsın mı\?`\}/);
 assert.match(teacher(),/window\.sessionStorage\.setItem\(ISSUED_KEY/,'an issued code is kept for this tab only');
 const par=parent();
 assert.match(par,/previewInvite\(typedCode\)/);
 assert.match(par,/Bu okul alanı henüz kurum tarafından doğrulanmadı\./);
 assert.match(par,/teacherSees\(version\)\.map/);assert.match(par,/TEACHER_NEVER_SEES\.map/);
 assert.match(par,/Öğretmenin gördüğü/);
 const show=read('../src/components/school/InviteShowcase.tsx');
 assert.match(show,/role="dialog" aria-modal="true"/);assert.match(show,/useDialogFocus\(ref,true\)/);
 assert.match(show,/event\.key==='Escape'/);
});

test('Several teachers: version 3, roles per school, classes with teachers, invitations validated',async()=>{
 const {mySchools,schoolClasses,staffList,inviteStaff,myStaffInvites,acceptStaffInvite,previewClassTeachers,isEmailAddress}=
  await import('../src/lib/school/schoolService.ts');
 let s=stub(()=>({data:3,error:null}));
 assert.equal(await schoolApiVersion(s.client),3);
 const school={id:klass,name:'Martı',brand_color:'javascript:x',verified_at:null,owner_id:adult};
 const client={auth:{getUser:async()=>({data:{user:{id:adult}},error:null})},rpc:async()=>({data:null,error:null}),
  from:name=>({select:()=>{const rows=name==='ventra_schools'?[school]:[{school_id:klass,role:'teacher'}];
   const chain={order:()=>chain,eq:()=>chain,limit:async()=>({data:rows,error:null})};return chain;}})};
 const v3=await mySchools(3,client);
 assert.equal(v3[0].role,'teacher');assert.equal(v3[0].brand_color,'#2563eb','a bad colour never reaches a style');
 assert.equal((await mySchools(2,client))[0].role,'owner','before version 3 every member is the owner');
 s=stub(()=>({data:[{id:klass,school_id:adult,name:'3-A',grade_level:3,created_at:'x',student_count:2,active_invites:0,mine:false,
  teachers:[{user_id:adult,name:'Ayşe Yılmaz'},{user_id:code,name:null},{bad:1}]}],error:null}));
 const [c]=await schoolClasses(adult,s.client);
 assert.deepEqual(c.teachers,[{userId:adult,name:'Ayşe Yılmaz'},{userId:code,name:null}]);assert.equal(c.mine,false);
 s=stub(()=>({data:[{user_id:adult,display_name:'',email:null,role:'owner',joined_at:'2026-11-20T10:00:00Z',classroom_ids:[klass,'bad'],is_me:true,is_holder:true}],error:null}));
 assert.deepEqual(await staffList(klass,s.client),[{userId:adult,displayName:null,email:null,role:'owner',joinedAt:'2026-11-20T10:00:00Z',
  classroomIds:[klass],isMe:true,isHolder:true}]);
 s=stub(()=>({data:[{invite_id:code,valid_until:'2026-12-08T10:00:00Z'}],error:null}));
 await assert.rejects(inviteStaff(klass,'yanlış adres','teacher',[],s.client),/E-posta adresi geçersiz/);
 await assert.rejects(inviteStaff(klass,'a@b.co','principal',[],s.client),/Rol geçersiz/);
 assert.equal(s.log.length,0,'nothing sent before the address and role are right');
 assert.deepEqual(await inviteStaff(klass,' Ogretmen@Okul.K12.tr ','teacher',[klass],s.client),{id:code,validUntil:'2026-12-08T10:00:00Z'});
 assert.deepEqual(s.log[0].args,{p_school_id:klass,p_email:'ogretmen@okul.k12.tr',p_role:'teacher',p_classroom_ids:[klass]});
 assert.ok(isEmailAddress('a.b@okul.k12.tr'));assert.ok(!isEmailAddress('a@b'));
 s=stub(()=>({data:[{invite_id:code,school_id:klass,school_name:'Martı',brand_color:'#7c3aed',verified:false,role:'owner',invited_by_name:'Ayşe',
  class_names:['3-A',4],valid_until:'2026-12-08T10:00:00Z'},{invite_id:'x'}],error:null}));
 const invites=await myStaffInvites(s.client);
 assert.equal(invites.length,1);assert.deepEqual([invites[0].role,invites[0].classNames],['owner',['3-A']]);
 await assert.rejects(acceptStaffInvite(code,' A ',s.client),/2-60/,'a name is required to join');
 s=stub(()=>({data:[{display_name:'Ayşe Yılmaz'},{display_name:''}],error:null}));
 assert.deepEqual(await previewClassTeachers(code,s.client),['Ayşe Yılmaz']);
});

test('Several teachers: labels, the invitation message and what the screens promise',async()=>{
 const {ROLE_INFO,staffLabel,staffInviteMessage}=await import('../src/lib/school/schoolInsights.ts');
 assert.equal(ROLE_INFO.owner.label,'Yönetici');assert.equal(ROLE_INFO.teacher.label,'Öğretmen');
 assert.equal(staffLabel({displayName:null,email:'mehmet.kaya@okul.k12.tr'}),'mehmet.kaya');
 assert.equal(staffLabel({displayName:'Mehmet Kaya',email:null}),'Mehmet Kaya');
 const msg=staffInviteMessage({schoolName:'Martı İlkokulu',email:'mehmet@okul.k12.tr',role:'teacher',link:'https://ventra.example',validUntil:'2026-12-08T10:00:00Z',inviter:'Ayşe Yılmaz'});
 assert.match(msg,/^Merhaba! Ayşe Yılmaz, sizi Ventra'da Martı İlkokulu okul alanına öğretmen olarak davet etti\./);
 assert.match(msg,/https:\/\/ventra\.example\/school adresini açın, “Öğretmenim” bölümünden mehmet@okul\.k12\.tr adresiyle giriş yapın/);
 assert.match(msg,/Davet 8 Aralık tarihine kadar geçerli\./);
 assert.doesNotMatch(staffInviteMessage({schoolName:'X Okulu',email:'a@b.co',role:'owner',link:null,validUntil:'2026-12-08T10:00:00Z',inviter:null}),/http/);
 const team=read('../src/components/school/TeamPanel.tsx');
 const ws=teacher();
 assert.match(team,/const lastOwner=member\.role==='owner'&&owners<=1;/,'the last owner cannot be demoted or removed');
 assert.match(team,/disabled=\{busy\|\|lastOwner\}/);
 assert.match(team,/<ConfirmBox label=\{member\.isMe\?'Okuldan ayrılmak istiyor musunuz\?':`\$\{label\} okuldan çıkarılsın mı\?`\}/);
 assert.match(team,/<ConfirmBox label="Davet reddedilsin mi\?"/);
 assert.match(team,/href=\{`mailto:\$\{encodeURIComponent\(sent\.email\)\}/);
 assert.match(ws,/role="tablist" aria-label="Okul bölümleri"/);assert.match(ws,/role="tabpanel" id="school-panel-team"/);
 assert.match(ws,/\(version<3\|\|school\.role==='owner'\)&&<button type="button" onClick=\{\(\)=>setMode\('delete'\)\}/,'only owners delete a class');
 assert.match(ws,/version>=2&&school\.role==='owner'&&!editing&&<button/,'only owners edit the school');
 assert.match(parent(),/previewClassTeachers\(typedCode\)/);
 assert.match(parent(),/Okul yöneticileri de aynı özeti görebilir; başka sınıfların öğretmenleri göremez\./);
});
