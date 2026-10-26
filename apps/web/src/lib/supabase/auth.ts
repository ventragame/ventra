import { getSupabaseClient, isSupabaseConfigured } from './client.ts';
import type { AdultAccountInfo } from '@ventra/shared';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

/**
 * Yetişkin e-posta tek kullanımlık doğrulama kodu (OTP) gönderir.
 */
export async function sendAdultOtpEmail(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase ortam değişkenleri (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) tanımlı değil. Çevrimdışı yerel mod aktif.'
    };
  }

  const client = getSupabaseClient()!;
  const cleanEmail = email.trim().toLowerCase();

  const { error } = await client.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: true
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Yetişkin e-posta doğrulama kodunu (OTP) onaylar.
 */
export async function verifyAdultOtp(email: string, token: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase yapılandırılmamış.'
    };
  }

  const client = getSupabaseClient()!;
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  const { data, error } = await client.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email'
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Mevcut yetişkin oturumunu getirir.
 */
export async function getAdultAccount(): Promise<AdultAccountInfo | null> {
  if (!isSupabaseConfigured()) return null;

  const client = getSupabaseClient()!;
  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) return null;

  const user = session.user;
  return {
    userId: user.id,
    email: user.email || '',
    createdAt: user.created_at,
    isConfirmed: Boolean(user.email_confirmed_at),
    linkedProfilesCount: 0,
    lastSyncedAt: null
  };
}

/**
 * Güvenli çıkış yapar.
 */
export async function signOutAdult(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient()!;
  await client.auth.signOut();
}

/**
 * Yetişkin hesabını ve ilişkili tüm çocuk verilerini güvenli silme isteği başlatır.
 * Sunucu tarafı SECURITY DEFINER RPC (delete_adult_user) ile auth.users kaydını siler;
 * veritabanındaki ON DELETE CASCADE kısıtları ile tüm profil ve etkinlikler ilişkisel olarak temizlenir.
 */
export async function deleteAdultAccount(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase yapılandırılmamış.' };
  }

  const client = getSupabaseClient()!;
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    return { success: false, error: 'Aktif oturum bulunamadı.' };
  }

  // 1. Sunucu tarafı RPC ile auth.users'dan kalıcı sil
  const { error: rpcError } = await client.rpc('delete_adult_user');
  if (rpcError) {
    console.warn('[Supabase Auth] delete_adult_user RPC çağrısı başarısız, profil temizliği deneniyor:', rpcError.message);
    const { error: profError } = await client
      .from('player_profiles')
      .delete()
      .eq('user_id', user.id);

    if (profError) {
      return { success: false, error: profError.message };
    }
  }

  // 2. Oturumu kapat
  await client.auth.signOut();
  return { success: true };
}

