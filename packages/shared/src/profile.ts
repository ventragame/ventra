/**
 * VENTRA — Oyuncu Profili ve Bulut Hesabı Veri Sözleşmesi (Phase 3.4)
 * 
 * İlkeler:
 * 1. Oyuncu profilleri bağımsız, yerel öncelikli (offline-first) ve UUID tabanlıdır.
 * 2. Çocuklardan gerçek isim, e-posta veya doğum tarihi asla talep edilmez.
 * 3. Çocuk profilleri ile yetişkin bulut hesabı (Supabase Auth) birbirinden kesin olarak ayrılmıştır.
 * 4. Bir yetişkin hesabına birden fazla çocuk profili bağlanabilir.
 */

export interface PlayerAvatar {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  accentColor: string;
}

export const VENTRA_AVATARS: PlayerAvatar[] = [
  { id: 'avatar_explorer', name: 'Kaşif', emoji: '🧭', bgColor: '#0284c7', accentColor: '#38bdf8' },
  { id: 'avatar_owl', name: 'Bilge Baykuş', emoji: '🦉', bgColor: '#4f46e5', accentColor: '#818cf8' },
  { id: 'avatar_fox', name: 'Çırak Tilki', emoji: '🦊', bgColor: '#ea580c', accentColor: '#fb923c' },
  { id: 'avatar_astronaut', name: 'Uzay Kaptanı', emoji: '🚀', bgColor: '#7c3aed', accentColor: '#c084fc' },
  { id: 'avatar_robot', name: 'Kod Robotu', emoji: '🤖', bgColor: '#059669', accentColor: '#34d399' },
  { id: 'avatar_wizard', name: 'Sayı Büyücüsü', emoji: '🧙‍♂️', bgColor: '#db2777', accentColor: '#f472b6' }
];

export function getAvatarById(avatarId: string): PlayerAvatar {
  const found = VENTRA_AVATARS.find(a => a.id === avatarId);
  return found || VENTRA_AVATARS[0];
}

export type EnglishPlacement = 'Pre-A1' | 'A1' | 'A2';

export interface PlayerProfile {
  id: string;                  // Kalıcı UUID
  userId: string | null;       // İsteğe bağlı yetişkin Supabase auth.users ID'si
  nickname: string;            // 2-15 karakterlik çocuk dostu takma ad
  avatarId: string;            // VENTRA_AVATARS referansı
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  lastPlayedAt: string | null; // Son etkinlik zamanı
  isActive: boolean;           // Cihazdaki aktif seçili profil mi?
  isCloudSynced: boolean;      // Buluta yedeklendi mi?
  // Optional: older profiles and cloud profiles without these fields remain valid.
  gradeLevel?: number | null;   // 1-8; independent from language proficiency
  englishLevel?: EnglishPlacement; // user/parent-selected, NOT an assessed level
}

export interface AdultAccountInfo {
  userId: string;
  email: string;
  createdAt: string;
  isConfirmed: boolean;
  linkedProfilesCount: number;
  lastSyncedAt: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedProfilesCount: number;
  uploadedEventsCount: number;
  downloadedEventsCount: number;
  lastSyncedAt: string;
  errorMessage?: string;
}

