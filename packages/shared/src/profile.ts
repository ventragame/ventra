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
  price: number; // earned Ventra Coin; zero means a starter avatar
  rarity: 'starter' | 'rare' | 'legendary';
  tagline: string;
}

/** Stable IDs preserve existing profiles and cloud references.
 * Real-money purchases are intentionally not connected to this catalog. */
export const VENTRA_AVATARS: PlayerAvatar[] = [
  {id:'avatar_explorer',name:'Cesur Kaşif',emoji:'🧭',bgColor:'#116f93',accentColor:'#66e4ed',price:0,rarity:'starter',tagline:'Her adada yeni bir macera!'},
  {id:'avatar_owl',name:'Bilge Baykuş',emoji:'🦉',bgColor:'#6850ad',accentColor:'#d9b7ff',price:0,rarity:'starter',tagline:'Soruların peşinde uç!'},
  {id:'avatar_fox',name:'Meraklı Tilki',emoji:'🦊',bgColor:'#b35a2d',accentColor:'#ffd39c',price:0,rarity:'starter',tagline:'Gizemleri birlikte çözelim!'},
  {id:'avatar_astronaut',name:'Yıldız Kaptanı',emoji:'🚀',bgColor:'#3558a4',accentColor:'#a5ddff',price:65,rarity:'rare',tagline:'Gökyüzü senin oyun alanın!'},
  {id:'avatar_robot',name:'Parlak Robot',emoji:'🤖',bgColor:'#15686b',accentColor:'#8effe2',price:55,rarity:'rare',tagline:'Her kelime yeni bir keşif!'},
  {id:'avatar_wizard',name:'Yıldız Büyücüsü',emoji:'🧙',bgColor:'#8544a8',accentColor:'#edb8ff',price:110,rarity:'legendary',tagline:'Kelimelerle sihir yap!'},
  {id:'avatar_rabbit',name:'Pamuk Tavşan',emoji:'🐰',bgColor:'#8d6eb5',accentColor:'#f9ccf8',price:45,rarity:'rare',tagline:'Hızlı adımlarla öğren!'},
  {id:'avatar_panda',name:'Panda Pilot',emoji:'🐼',bgColor:'#4d698c',accentColor:'#b9f5fb',price:75,rarity:'rare',tagline:'Yeni yerlere birlikte uçalım!'},
  {id:'avatar_dragon',name:'Minik Ejder',emoji:'🐉',bgColor:'#138f85',accentColor:'#b9fdbb',price:95,rarity:'rare',tagline:'Dostça bir macera ateşi!'},
  {id:'avatar_unicorn',name:'Ay Işığı',emoji:'🦄',bgColor:'#9664ae',accentColor:'#f1d1ff',price:135,rarity:'legendary',tagline:'Hayallerine kanat aç!'},
  {id:'avatar_lion',name:'Altın Yele',emoji:'🦁',bgColor:'#9f6929',accentColor:'#fff0a7',price:125,rarity:'legendary',tagline:'Cesaretinle yıldızları topla!'},
  {id:'avatar_princess',name:'Masal Prensesi',emoji:'👑',bgColor:'#bb6898',accentColor:'#ffd5ee',price:105,rarity:'legendary',tagline:'Kendi masalını keşfet!'}
];
export const VENTRA_STARTER_AVATARS = VENTRA_AVATARS.filter(a=>a.price===0);
export const LEGACY_AVATAR_IDS = Object.freeze([
  'avatar_explorer','avatar_owl','avatar_fox',
  'avatar_astronaut','avatar_robot','avatar_wizard'
] as const);

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

