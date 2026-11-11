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
  collection: 'heroes' | 'animals' | 'fantasy' | 'space';
}

export const AVATAR_COLLECTIONS = [
  {id:'heroes',name:'Kahramanlar',icon:'🧭',description:'Cesur kaşifler ve sanatçılar'},
  {id:'animals',name:'Hayvan Dostlar',icon:'🐾',description:'Ormandan gelen arkadaşlar'},
  {id:'fantasy',name:'Masal Dünyası',icon:'✨',description:'Büyülü masal kahramanları'},
  {id:'space',name:'Uzay Takımı',icon:'🚀',description:'Gezegenler ve robotlar'}
] as const;

/** Stable IDs preserve existing profiles and cloud references.
 * Real-money purchases are intentionally not connected to this catalog. */
export const VENTRA_AVATARS: PlayerAvatar[] = [
  {id:'avatar_explorer',collection:'heroes',name:'Cesur Kaşif',emoji:'🧭',bgColor:'#116f93',accentColor:'#66e4ed',price:0,rarity:'starter',tagline:'Her adada yeni bir macera!'},
  {id:'avatar_owl',collection:'animals',name:'Bilge Baykuş',emoji:'🦉',bgColor:'#6850ad',accentColor:'#d9b7ff',price:0,rarity:'starter',tagline:'Soruların peşinde uç!'},
  {id:'avatar_fox',collection:'animals',name:'Meraklı Tilki',emoji:'🦊',bgColor:'#b35a2d',accentColor:'#ffd39c',price:0,rarity:'starter',tagline:'Gizemleri birlikte çözelim!'},
  {id:'avatar_astronaut',collection:'space',name:'Yıldız Kaptanı',emoji:'🚀',bgColor:'#3558a4',accentColor:'#a5ddff',price:65,rarity:'rare',tagline:'Gökyüzü senin oyun alanın!'},
  {id:'avatar_robot',collection:'space',name:'Parlak Robot',emoji:'🤖',bgColor:'#15686b',accentColor:'#8effe2',price:55,rarity:'rare',tagline:'Her kelime yeni bir keşif!'},
  {id:'avatar_wizard',collection:'fantasy',name:'Yıldız Büyücüsü',emoji:'🧙',bgColor:'#8544a8',accentColor:'#edb8ff',price:110,rarity:'legendary',tagline:'Kelimelerle sihir yap!'},
  {id:'avatar_rabbit',collection:'animals',name:'Pamuk Tavşan',emoji:'🐰',bgColor:'#8d6eb5',accentColor:'#f9ccf8',price:45,rarity:'rare',tagline:'Hızlı adımlarla öğren!'},
  {id:'avatar_panda',collection:'animals',name:'Panda Pilot',emoji:'🐼',bgColor:'#4d698c',accentColor:'#b9f5fb',price:75,rarity:'rare',tagline:'Yeni yerlere birlikte uçalım!'},
  {id:'avatar_dragon',collection:'fantasy',name:'Minik Ejder',emoji:'🐉',bgColor:'#138f85',accentColor:'#b9fdbb',price:95,rarity:'rare',tagline:'Dostça bir macera ateşi!'},
  {id:'avatar_unicorn',collection:'fantasy',name:'Ay Işığı',emoji:'🦄',bgColor:'#9664ae',accentColor:'#f1d1ff',price:135,rarity:'legendary',tagline:'Hayallerine kanat aç!'},
  {id:'avatar_lion',collection:'animals',name:'Altın Yele',emoji:'🦁',bgColor:'#9f6929',accentColor:'#fff0a7',price:125,rarity:'legendary',tagline:'Cesaretinle yıldızları topla!'},
  {id:'avatar_princess',collection:'fantasy',name:'Masal Prensesi',emoji:'👑',bgColor:'#bb6898',accentColor:'#ffd5ee',price:105,rarity:'legendary',tagline:'Kendi masalını keşfet!'},
  {id:'avatar_adventurer',name:'Lina Kaşif',emoji:'🧢',bgColor:'#286e9a',accentColor:'#ffe8a4',price:0,rarity:'starter',tagline:'Bilinmeyen adalar bizi bekliyor!',collection:'heroes'},
  {id:'avatar_inventor',name:'Minik Mucit',emoji:'🔧',bgColor:'#536c9c',accentColor:'#9bdfff',price:45,rarity:'rare',tagline:'Her fikir yeni bir macera!',collection:'heroes'},
  {id:'avatar_painter',name:'Renk Ustası',emoji:'🎨',bgColor:'#b15988',accentColor:'#ffdb95',price:55,rarity:'rare',tagline:'Dünyanı renklendir!',collection:'heroes'},
  {id:'avatar_musician',name:'Melodi Gezgini',emoji:'🎵',bgColor:'#5769bd',accentColor:'#f7b1ec',price:70,rarity:'rare',tagline:'Yeni kelimelere ritim kat!',collection:'heroes'},
  {id:'avatar_gardener',name:'Çiçek Bekçisi',emoji:'🌼',bgColor:'#348b68',accentColor:'#e1f69f',price:80,rarity:'rare',tagline:'Öğrendikçe çiçek aç!',collection:'heroes'},
  {id:'avatar_diver',name:'Deniz Kaşifi',emoji:'🤿',bgColor:'#157e9c',accentColor:'#a6f5f1',price:95,rarity:'rare',tagline:'Dalgaların altında keşfet!',collection:'heroes'},
  {id:'avatar_cat',name:'Mırmır Kedi',emoji:'🐱',bgColor:'#ad657c',accentColor:'#ffd5c1',price:0,rarity:'starter',tagline:'Birlikte merak edelim!',collection:'animals'},
  {id:'avatar_koala',name:'Uykuş Koala',emoji:'🐨',bgColor:'#67789b',accentColor:'#dce4ff',price:40,rarity:'rare',tagline:'Sakin sakin, neşeyle öğren!',collection:'animals'},
  {id:'avatar_otter',name:'Neşeli Su Samuru',emoji:'🦦',bgColor:'#a77251',accentColor:'#ffe3ae',price:60,rarity:'rare',tagline:'Yeni oyunlara dalalım!',collection:'animals'},
  {id:'avatar_penguin',name:'Buz Pengueni',emoji:'🐧',bgColor:'#346d9d',accentColor:'#d2f4ff',price:70,rarity:'rare',tagline:'Buz gibi eğlenceli görevler!',collection:'animals'},
  {id:'avatar_deer',name:'Orman Geyiği',emoji:'🦌',bgColor:'#a66a67',accentColor:'#ffdfc4',price:90,rarity:'rare',tagline:'Orman yollarını birlikte aş!',collection:'animals'},
  {id:'avatar_bear',name:'Bal Dostu Ayı',emoji:'🐻',bgColor:'#91724a',accentColor:'#f9df99',price:105,rarity:'rare',tagline:'Büyük maceralara hazır mısın?',collection:'animals'},
  {id:'avatar_phoenix',name:'Alev Kuşu',emoji:'🔥',bgColor:'#bd633e',accentColor:'#fff29b',price:130,rarity:'legendary',tagline:'Parıldayan bir yolculuk!',collection:'fantasy'},
  {id:'avatar_mermaid',name:'Mercan Perisi',emoji:'🧜',bgColor:'#278c9a',accentColor:'#baf8e3',price:115,rarity:'legendary',tagline:'Denizin sırlarını keşfet!',collection:'fantasy'},
  {id:'avatar_fairy',name:'Işık Perisi',emoji:'🧚',bgColor:'#8670c1',accentColor:'#f4e6ff',price:120,rarity:'legendary',tagline:'Küçük bir ışık, büyük keşif!',collection:'fantasy'},
  {id:'avatar_cloud',name:'Pamuk Bulut',emoji:'☁️',bgColor:'#5f98bc',accentColor:'#e0faff',price:75,rarity:'rare',tagline:'Gökyüzünde kelime avı!',collection:'fantasy'},
  {id:'avatar_star_sprite',name:'Yıldızcık',emoji:'🌟',bgColor:'#9270be',accentColor:'#fff2a6',price:140,rarity:'legendary',tagline:'Gecenin en parlak dostu!',collection:'fantasy'},
  {id:'avatar_moon_fox',name:'Ay Tilkisi',emoji:'🌙',bgColor:'#525da7',accentColor:'#f5d1ff',price:150,rarity:'legendary',tagline:'Ay ışığında masallar!',collection:'fantasy'},
  {id:'avatar_cyborg',name:'Neon Mucit',emoji:'⚡',bgColor:'#256b82',accentColor:'#b8ffdc',price:100,rarity:'rare',tagline:'Parlayan fikirler üret!',collection:'space'},
  {id:'avatar_satellite',name:'Mini Uydu',emoji:'🛰️',bgColor:'#3b6db0',accentColor:'#b5e6ff',price:85,rarity:'rare',tagline:'Yeni kelimelerin izinde!',collection:'space'},
  {id:'avatar_cosmic',name:'Kozmik Kaşif',emoji:'🌌',bgColor:'#7660ad',accentColor:'#ffcff1',price:145,rarity:'legendary',tagline:'Yıldızların ardına yolculuk!',collection:'space'},
  {id:'avatar_alien',name:'Minik Uzaylı',emoji:'👽',bgColor:'#368b8b',accentColor:'#d6ffb6',price:95,rarity:'rare',tagline:'Dostluk her gezegende!',collection:'space'},
  {id:'avatar_astro_cat',name:'Uzay Kedisi',emoji:'🐈',bgColor:'#587cb6',accentColor:'#e9e4ff',price:125,rarity:'legendary',tagline:'Pati patiye yıldızlara!',collection:'space'},
  {id:'avatar_planet',name:'Halka Gezegeni',emoji:'🪐',bgColor:'#6687c1',accentColor:'#ffe4b8',price:160,rarity:'legendary',tagline:'Evrenin sırlarını keşfet!',collection:'space'}
];
export const VENTRA_STARTER_AVATARS = VENTRA_AVATARS.filter(a=>a.price===0);
export const avatarCatalogByCollection = (collection: PlayerAvatar['collection']) => VENTRA_AVATARS.filter(a=>a.collection===collection);
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

