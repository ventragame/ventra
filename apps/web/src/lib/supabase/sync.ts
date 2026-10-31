import { getSupabaseClient, isSupabaseConfigured } from './client.ts';
import { getProgressRepository } from '../progress/index.ts';
import type { SyncResult, PlayerProfile } from '@ventra/shared';
import { uploadInBatches, mergeRemotePages } from './cloudTransfer.ts';

const cloudMetadataV2 = process.env.NEXT_PUBLIC_VENTRA_CLOUD_METADATA_V2 === 'true';

export class CloudSyncService {
  private inFlight = new Map<string, Promise<SyncResult>>();
  private static instance: CloudSyncService | null = null;

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  /**
   * Belirtilen çocuk profilini ve bekleyen etkinliklerini Supabase bulut veritabanıyla eşitler.
   */
  public syncProfile(profileId: string, options: { allowLink?: boolean } = {}): Promise<SyncResult> {
    const ongoing = this.inFlight.get(profileId);
    if (ongoing) return ongoing;
    const job = this.syncProfileInternal(profileId, options);
    this.inFlight.set(profileId, job);
    void job.finally(() => {
      if (this.inFlight.get(profileId) === job) this.inFlight.delete(profileId);
    }).catch(() => {});
    return job;
  }

  private async syncProfileInternal(profileId: string, options: { allowLink?: boolean } = {}): Promise<SyncResult> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Supabase yapılandırılmamış. Yerel çevrimdışı mod çalışıyor.'
      };
    }

    const client = getSupabaseClient()!;
    const { data: { user }, error: identityError } = await client.auth.getUser();
    if (identityError || !user) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Yetişkin hesabı oturumu açık değil. Önce e-posta ile giriş yapılmalıdır.'
      };
    }

    const userId = user.id;
    const repo = getProgressRepository();
    const allProfiles = await repo.getAllProfiles();
    const profile = allProfiles.find(p => p.id === profileId);

    // 1. Hesap İzolasyonu Denetimi: Profil başka bir yetişkin hesabına bağlıysa işlem reddedilir
    if (profile?.userId && profile.userId !== userId) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Hesap İzolasyonu: Bu profil başka bir yetişkin hesabına bağlıdır. Güvenlik gereği mevcut oturumla eşitlenemez.'
      };
    }

    // 2. Silinmiş Profil (Tombstone) Senkronizasyonu
    const deletedIds = (await repo.getDeletedProfileIds?.()) || [];
    if (deletedIds.includes(profileId)) {
      try {
        const { data, error } = await client.from('player_profiles')
          .update({ deleted_at: now })
          .eq('id', profileId).eq('user_id', userId)
          .is('deleted_at', null).select('id');
        if (error) throw error;
        return {
          success: true, syncedProfilesCount: data?.length ?? 0,
          uploadedEventsCount: 0, downloadedEventsCount: 0, lastSyncedAt: now
        };
      } catch (error) {
        return {
          success: false, syncedProfilesCount: 0,
          uploadedEventsCount: 0, downloadedEventsCount: 0, lastSyncedAt: now,
          errorMessage: error instanceof Error ? error.message : 'Silme işlemi buluta iletilemedi.'
        };
      }
    }

    if (!profile) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Eşitlenecek yerel profil bulunamadı.'
      };
    }

    if (!profile.userId && !options.allowLink) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Önce bu çocuk profilini yetişkin hesabına açıkça bağlamalısınız.'
      };
    }

    try {
      // İlk kez bağlanan çocuk yalnızca açık onayla bulutta oluşturulur.
      // Bağlı bir profilde tekrar upsert yaparak farklı cihazdaki avatar/ad
      // değişikliklerini sessizce ezmeyiz.
      if (!profile.userId) {
        const { error: profError } = await client
          .from('player_profiles')
          .upsert({
            id: profile.id,
            user_id: userId,
            nickname: profile.nickname,
            avatar_id: profile.avatarId,
            ...(cloudMetadataV2 ? { grade_level: profile.gradeLevel ?? null, english_level: profile.englishLevel ?? 'Pre-A1' } : {}),
            last_played_at: profile.lastPlayedAt,
            deleted_at: null,
            updated_at: now
          }, { onConflict: 'id' });
        if (profError) throw new Error(`Profil bulut bağlantısı kurulamadı: ${profError.message}`);
        await repo.updateProfile(profile.id, { userId, isCloudSynced: false });
      } else {
        // Keep both select statements statically typed. Conditional select()
        // expressions produce Supabase ParserError unions at TypeScript build time.
        let remoteExists = false;
        let remoteMetadata: {
          nickname: string;
          avatar_id: string;
          grade_level: number | null;
          english_level: 'Pre-A1' | 'A1' | 'A2' | null;
        } | null = null;
        if (cloudMetadataV2) {
          const { data, error } = await client.from('player_profiles')
            .select('id,nickname,avatar_id,grade_level,english_level,updated_at')
            .eq('id', profile.id).eq('user_id', userId).is('deleted_at', null)
            .maybeSingle();
          if (error) throw new Error('Profil sahipliği doğrulanamadı: ' + error.message);
          remoteExists = Boolean(data);
          if (data) {
            remoteMetadata = {
              nickname: data.nickname,
              avatar_id: data.avatar_id,
              grade_level: data.grade_level,
              english_level: data.english_level
            };
          }
        } else {
          const { data, error } = await client.from('player_profiles')
            .select('id')
            .eq('id', profile.id).eq('user_id', userId).is('deleted_at', null)
            .maybeSingle();
          if (error) throw new Error('Profil sahipliği doğrulanamadı: ' + error.message);
          remoteExists = Boolean(data);
        }
        if (!remoteExists) throw new Error('Bulut profili bulunamadı veya silinmiş. Yeni profil oluşturmadan işlem durduruldu.');
        if (cloudMetadataV2) {
          if (!profile.isCloudSynced) {
            const { error: metadataError } = await client.from('player_profiles')
              .update({
                nickname: profile.nickname, avatar_id: profile.avatarId,
                grade_level: profile.gradeLevel ?? null,
                english_level: profile.englishLevel ?? 'Pre-A1',
                last_played_at: profile.lastPlayedAt
              })
              .eq('id', profile.id).eq('user_id', userId).is('deleted_at', null);
            if (metadataError) throw new Error('Profil tercihleri gönderilemedi: ' + metadataError.message);
          } else if (remoteMetadata) {
            await repo.updateProfile(profile.id, {
              nickname: remoteMetadata.nickname,
              avatarId: remoteMetadata.avatar_id,
              gradeLevel: remoteMetadata.grade_level ?? profile.gradeLevel ?? null,
              englishLevel: remoteMetadata.english_level ?? profile.englishLevel ?? 'Pre-A1',
              isCloudSynced: true
            });
          }
        }
      }

      // 2. Bekleyen Yerel Olayları (Pending Events) Buluta Gönder (Upload)
      const pendingEvents = await repo.getPendingEvents(profile.id);
      let uploadedCount = 0;

      uploadedCount = await uploadInBatches(pendingEvents, async batch => {
        const rows = batch.map(e => ({
          event_id: e.eventId, profile_id: profile.id, user_id: userId,
          event_type: e.eventType, schema_version: 1,
          game_id: e.gameId, level_id: e.levelId, skill_id: e.skillId,
          score: e.score, stars_earned: e.starsEarned,
          accuracy_rate: e.accuracyRate, metrics: e.metrics,
          client_timestamp: e.clientTimestamp
        }));
        const { error } = await client.from('progress_events')
          .upsert(rows, { onConflict: 'event_id' });
        if (error) throw new Error('Etkinlik yüklenemedi: ' + error.message);
      }, async batch => {
        await repo.markEventsSynced(batch.map(e => e.eventId));
      });

      // 3. Buluttaki Diğer Cihazlardan Gelen Olayları İndir (Download & Merge)
      const downloadedCount = await mergeRemotePages(async (offset, end) => {
        const { data, error } = await client.from('progress_events')
          .select('*').eq('profile_id', profile.id).eq('user_id', userId)
          .order('server_received_at', { ascending: true })
          .order('event_id', { ascending: true })
          .range(offset, end);
        if (error) throw new Error('Bulut etkinlikleri çekilemedi: ' + error.message);
        if (!data) throw new Error('Bulut etkinlik yanıtı alınamadı.');
        return data;
      }, remote => repo.mergeRemoteEvents(remote, profile.id));

      // Only report a cloud-backed local profile after both directions finish.
      await repo.updateProfile(profile.id, { isCloudSynced: cloudMetadataV2 });
      return {
        success: true,
        syncedProfilesCount: 1,
        uploadedEventsCount: uploadedCount,
        downloadedEventsCount: downloadedCount,
        lastSyncedAt: now
      };
    } catch (err: any) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: err.message || 'Senkronizasyon sırasında beklenmeyen hata oluştu.'
      };
    }
  }

  /**
   * Yetişkin hesabına bağlı tüm profilleri buluttan sorgular, silinmiş olanları temizler
   * ve aktif olanları yerel veritabanıyla çift yönlü eşitler.
   */
  public async pullAllCloudProfiles(): Promise<PlayerProfile[]> {
    if (!isSupabaseConfigured()) throw new Error('Bulut hizmeti yapılandırılmamış.');

    const client = getSupabaseClient()!;
    const { data: { user }, error: identityError } = await client.auth.getUser();
    if (identityError || !user) throw new Error('Önce yetişkin hesabına giriş yapmalısınız.');

    const userId = user.id;
    // Supabase applies row caps to profile queries too; restoration should
    // never silently omit a child profile beyond the first page.
    const remoteProfiles: Array<Record<string, any>> = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from('player_profiles')
        .select('*').eq('user_id', userId)
        .order('id', { ascending: true }).range(offset, offset + 499);
      if (error) throw new Error('Bulut profilleri okunamadı: ' + error.message);
      if (!data) throw new Error('Bulut profilleri getirilemedi.');
      remoteProfiles.push(...data);
      if (data.length < 500) break;
    }

    const repo = getProgressRepository();
    const localProfiles = await repo.getAllProfiles();
    const deletedIds = (await repo.getDeletedProfileIds?.()) || [];
    const syncedList: PlayerProfile[] = [];

    for (const rp of remoteProfiles) {
      // 1. Bulutta silinmiş olarak işaretli ise (Tombstone) yerelde de sil
      if (rp.deleted_at) {
        const local = localProfiles.find(p => p.id === rp.id);
        // Never delete a local profile belonging to a different account.
        if (local && local.userId === userId) await repo.deleteProfile(rp.id);
        continue;
      }

      // 2. Bu cihazda daha önce silinmişse buluta silme tombstone'u ilet
      if (deletedIds.includes(rp.id)) {
        const { error: tombstoneError } = await client
          .from('player_profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', rp.id)
          .eq('user_id', userId);
        if (tombstoneError) throw new Error('Silinen profil buluta bildirilemedi: ' + tombstoneError.message);
        continue;
      }

      // 3. Yerelde henüz yoksa buluttaki kimliği (rp.id) kesin olarak koruyarak oluştur
      let local = localProfiles.find(p => p.id === rp.id);
      if (local?.userId && local.userId !== userId) {
        throw new Error('Yerel ve bulut profili farklı yetişkin hesaplarına bağlı. Güvenli birleştirme mümkün değil.');
      }
      if (!local) {
        local = await repo.createProfile({
          id: rp.id, // Kritik: Bulut UUID'si yerelde aynen korunmalıdır!
          nickname: rp.nickname,
          avatarId: rp.avatar_id,
          gradeLevel: cloudMetadataV2 ? (rp.grade_level ?? null) : null,
          englishLevel: cloudMetadataV2 ? (rp.english_level ?? 'Pre-A1') : 'Pre-A1'
        });
        local = await repo.updateProfile(local.id, {
          userId: rp.user_id,
          isCloudSynced: cloudMetadataV2,
          lastPlayedAt: rp.last_played_at
        });
      }

      // Remote identity explicitly belongs to the authenticated adult.
      // Only then repair an older local guest record with the same UUID.
      if (!local.userId) {
        local = await repo.updateProfile(local.id, {
          userId, isCloudSynced: cloudMetadataV2,
          nickname: rp.nickname, avatarId: rp.avatar_id,
          ...(cloudMetadataV2 ? { gradeLevel: rp.grade_level ?? null, englishLevel: rp.english_level ?? 'Pre-A1' } : {})
        });
      }
      // Olayları indir ve birleştir, sessiz başarısızlığı başarı gibi bildirme.
      const syncResult = await this.syncProfile(local.id);
      if (!syncResult.success) throw new Error(syncResult.errorMessage || 'Profil eşitlenemedi.');
      const current = (await repo.getAllProfiles()).find(p => p.id === local.id);
      if (current) syncedList.push(current);
    }

    return syncedList;
  }
}

