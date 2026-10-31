import { getSupabaseClient, isSupabaseConfigured } from './client.ts';
import { getProgressRepository } from '../progress/index.ts';
import type { SyncResult, PlayerProfile } from '@ventra/shared';

export class CloudSyncService {
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
  public async syncProfile(profileId: string, options: { allowLink?: boolean } = {}): Promise<SyncResult> {
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
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        syncedProfilesCount: 0,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now,
        errorMessage: 'Yetişkin hesabı oturumu açık değil. Önce e-posta ile giriş yapılmalıdır.'
      };
    }

    const userId = session.user.id;
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
      await client
        .from('player_profiles')
        .update({ deleted_at: now })
        .eq('id', profileId)
        .eq('user_id', userId);

      return {
        success: true,
        syncedProfilesCount: 1,
        uploadedEventsCount: 0,
        downloadedEventsCount: 0,
        lastSyncedAt: now
      };
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
            last_played_at: profile.lastPlayedAt,
            deleted_at: null,
            updated_at: now
          }, { onConflict: 'id' });
        if (profError) throw new Error(`Profil bulut bağlantısı kurulamadı: ${profError.message}`);
        await repo.updateProfile(profile.id, { userId, isCloudSynced: false });
      } else {
        const { data: remoteOwner, error: ownerError } = await client
          .from('player_profiles')
          .select('id')
          .eq('id', profile.id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .maybeSingle();
        if (ownerError) throw new Error(`Profil sahipliği doğrulanamadı: ${ownerError.message}`);
        if (!remoteOwner) throw new Error('Bulut profili bulunamadı veya silinmiş. Yeni profil oluşturmadan işlem durduruldu.');
      }

      // 2. Bekleyen Yerel Olayları (Pending Events) Buluta Gönder (Upload)
      const pendingEvents = await repo.getPendingEvents(profile.id);
      let uploadedCount = 0;

      if (pendingEvents.length > 0) {
        const rowsToInsert = pendingEvents.map(e => ({
          event_id: e.eventId,
          profile_id: profile.id,
          user_id: userId,
          event_type: e.eventType,
          schema_version: 1,
          game_id: e.gameId,
          level_id: e.levelId,
          skill_id: e.skillId,
          score: e.score,
          stars_earned: e.starsEarned,
          accuracy_rate: e.accuracyRate,
          metrics: e.metrics,
          client_timestamp: e.clientTimestamp
        }));

        const { error: evError } = await client
          .from('progress_events')
          .upsert(rowsToInsert, { onConflict: 'event_id' });

        if (evError) {
          throw new Error(`Etkinlik bulut yükleme hatası: ${evError.message}`);
        }

        // Başarıyla yüklenenleri yerelde işaretle
        await repo.markEventsSynced(pendingEvents.map(e => e.eventId));
        uploadedCount = pendingEvents.length;
      }

      // 3. Buluttaki Diğer Cihazlardan Gelen Olayları İndir (Download & Merge)
      const { data: remoteEvents, error: fetchError } = await client
        .from('progress_events')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('user_id', userId);

      if (fetchError) {
        throw new Error(`Bulut etkinlikleri çekme hatası: ${fetchError.message}`);
      }

      let downloadedCount = 0;
      if (remoteEvents && remoteEvents.length > 0) {
        downloadedCount = await repo.mergeRemoteEvents(remoteEvents, profile.id);
      }

      // Only report a cloud-backed local profile after both directions finish.
      await repo.updateProfile(profile.id, { isCloudSynced: true });
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
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) throw new Error('Önce yetişkin hesabına giriş yapmalısınız.');

    const userId = session.user.id;
    const { data: remoteProfiles, error } = await client
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error('Bulut profilleri okunamadı: ' + error.message);
    if (!remoteProfiles) throw new Error('Bulut profilleri getirilemedi.');

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
        await client
          .from('player_profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', rp.id)
          .eq('user_id', userId);
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
          avatarId: rp.avatar_id
        });
        await repo.updateProfile(local.id, {
          userId: rp.user_id,
          isCloudSynced: false,
          lastPlayedAt: rp.last_played_at
        });
      }

      // Remote identity explicitly belongs to the authenticated adult.
      // Only then repair an older local guest record with the same UUID.
      if (!local.userId) {
        local = await repo.updateProfile(local.id, { userId, isCloudSynced: false });
      }
      // Olayları indir ve birleştir, sessiz başarısızlığı başarı gibi bildirme.
      const syncResult = await this.syncProfile(local.id);
      if (!syncResult.success) throw new Error(syncResult.errorMessage || 'Profil eşitlenemedi.');
      syncedList.push(local);
    }

    return syncedList;
  }
}

