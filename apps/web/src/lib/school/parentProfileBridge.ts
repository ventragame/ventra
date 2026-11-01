import type {PlayerProfile} from '@ventra/shared';
import {getProgressRepository} from '../progress/index.ts';
import {getSupabaseClient} from '../supabase/client.ts';
import {CloudSyncService} from '../supabase/sync.ts';

export type LocalSchoolCandidate={
  id:string;nickname:string;gradeLevel:number|null;status:'unlinked'|'needs_sync'
};

/** Only show children owned by the current adult, or not yet linked to any adult. */
export function localSchoolCandidates(
 local:readonly Pick<PlayerProfile,'id'|'nickname'|'gradeLevel'|'userId'>[],
 cloud:readonly {id:string}[], adultId:string
):LocalSchoolCandidate[]{
 if(!adultId)return [];
 const inCloud=new Set(cloud.map(p=>p.id));
 return local.filter(p=>!inCloud.has(p.id)&&(!p.userId||p.userId===adultId))
 .map(p=>({id:p.id,nickname:p.nickname,gradeLevel:p.gradeLevel??null,
   status:p.userId===adultId?'needs_sync' as const:'unlinked' as const}));
}

/** Explicit parent approval must occur in the caller before invoking this function. */
export async function linkLocalSchoolCandidate(profileId:string,expectedAdultId:string):Promise<void>{
 if(!profileId||!expectedAdultId)throw new Error('Çocuk ve yetişkin hesabı seçilmeli.');
 const client=getSupabaseClient();
 if(!client)throw new Error('Bulut bağlantısı bulunamadı.');
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user||user.id!==expectedAdultId)
   throw new Error('Yetişkin oturumu değişti, tekrar giriş yapın.');
 const profile=(await getProgressRepository().getAllProfiles()).find(p=>p.id===profileId);
 if(!profile)throw new Error('Bu tarayıcıda çocuk profili bulunamadı.');
 if(profile.userId&&profile.userId!==expectedAdultId)
   throw new Error('Çocuk farklı bir yetişkin hesabına bağlı; aktarılamaz.');
 const result=await CloudSyncService.getInstance().syncProfile(profileId,{allowLink:!profile.userId});
 if(!result.success)throw new Error(result.errorMessage??'Buluta bağlama tamamlanamadı.');
 const {data,error}=await client.from('player_profiles').select('id')
   .eq('id',profileId).eq('user_id',expectedAdultId).is('deleted_at',null).maybeSingle();
 if(error||!data)throw new Error('Bulut profili doğrulanamadı; katılım başlatılmadı.');
}
