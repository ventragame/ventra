/**
 * VENTRA KIDS — English Learning Journey v2: stable island IDs, new learning roles
 * 
 * 6 Bağımsız Fantastik Ada Manifestosu ve Kompakt Takımada Sözleşmesi.
 */

export type IslandId =
  | 'word_garden'
  | 'listening_forest'
  | 'speaking_harbor'
  | 'sentence_workshop'
  | 'story_castle'
  | 'language_academy';

export interface IslandDefinition {
  id: IslandId;
  nameTr: string;
  subtitleTr: string;
  emoji: string;
  themeColor: string;
  accentBorder: string;
  glowColor: string;
  badgeText: string;
  descriptionTr: string;
  cefrLevel: string;
  totalPublishedRequiredLevels: number;
  desktopAsset: string;
  mobileAsset: string;
  defaultWorldPos: { x: number; y: number };
  hitRadius: number;
  order: number;
  isUnlockedDefault: boolean;
  contentPublished: boolean;
  unlockRequirementNotice?: string;
}

export interface IslandRuntimeProgress {
  islandId: IslandId;
  isUnlocked: boolean;
  contentPublished: boolean;
  completedRequiredLevels: number;
  totalPublishedRequiredLevels: number;
  progressPercent: number;
  isCompleted: boolean;
  starsEarned: number;
}

/**
 * 6 Tematik Adanın Kompakt Dairesel/Oval Takımada Kataloğu
 */
export const ARCHIPELAGO_ISLANDS_CATALOG: Record<IslandId, IslandDefinition> = {
  word_garden: {
    id: 'word_garden',
    nameTr: 'Kelime Bahçesi',
    subtitleTr: 'Kelimeleri keşfet, dinle ve hatırla',
    emoji: '🌸',
    themeColor: '#059669',
    accentBorder: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Hayvanlar, renkler, sayılar, yiyecekler ve günlük ifadelerle İngilizce temelini kur.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 5,
    desktopAsset: '/assets/kids-islands/word_garden.webp',
    mobileAsset: '/assets/kids-islands/word_garden_mobile.webp',
    defaultWorldPos: { x: 640, y: 530 }, // Sol üst
    hitRadius: 210,
    order: 1,
    isUnlockedDefault: true,
    contentPublished: true
  },
  listening_forest: {
    id: 'listening_forest',
    nameTr: 'Hikâye Ormanı',
    subtitleTr: 'Hikâye ve bağlam içinde anlama',
    emoji: '📖',
    themeColor: '#4f46e5',
    accentBorder: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Karakterleri takip et, olayları sırala ve hikâyenin devamını İngilizce seç.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 12,
    desktopAsset: '/assets/kids-islands/listening_forest.webp',
    mobileAsset: '/assets/kids-islands/listening_forest_mobile.webp',
    defaultWorldPos: { x: 1800, y: 590 }, // Üst orta
    hitRadius: 210,
    order: 3,
    isUnlockedDefault: true,
    contentPublished: true,
    unlockRequirementNotice: 'Hikâyeyi Keşfet ve Sonra Ne Oldu? oynanabilir. Diğer Hikâye Ormanı oyunları hazırlanıyor.'
  },
  speaking_harbor: {
    id: 'speaking_harbor',
    nameTr: 'Diyalog Limanı',
    subtitleTr: 'Karşılıklı konuşma ve iletişim',
    emoji: '⚓',
    themeColor: '#0284c7',
    accentBorder: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Karakterlerle selamlaş, soru sor, istekte bulun ve uygun İngilizce yanıtı seç.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/speaking_harbor.webp',
    mobileAsset: '/assets/kids-islands/speaking_harbor_mobile.webp',
    defaultWorldPos: { x: 1750, y: 1070 }, // Sağ alt: forest art stays separate
    hitRadius: 210,
    order: 4,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Diyalog görevleri henüz geliştirme aşamasında.'
  },
  sentence_workshop: {
    id: 'sentence_workshop',
    nameTr: 'Yazı Atölyesi',
    subtitleTr: 'Okuma, yazma ve kendini ifade etme',
    emoji: '📜',
    themeColor: '#d97706',
    accentBorder: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Kelime kartlarından kısa notlara ve yaratıcı metinlere uzanan İngilizce yazılar üret.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/sentence_workshop.webp',
    mobileAsset: '/assets/kids-islands/sentence_workshop_mobile.webp',
    defaultWorldPos: { x: 1160, y: 1090 }, // Sağ alt
    hitRadius: 210,
    order: 5,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Yazma görevleri henüz geliştirme aşamasında.'
  },
  story_castle: {
    id: 'story_castle',
    nameTr: 'Cümle Meydanı',
    subtitleTr: 'Kelimeden anlamlı cümleye',
    emoji: '🏰',
    themeColor: '#7c3aed',
    accentBorder: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Bildik kelimelerle cümle kur, nesneleri tarif et ve kısa sorulara cevap ver.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 6,
    desktopAsset: '/assets/kids-islands/story_castle.webp',
    mobileAsset: '/assets/kids-islands/story_castle_mobile.webp',
    defaultWorldPos: { x: 1240, y: 430 }, // Alt orta
    hitRadius: 210,
    order: 2,
    isUnlockedDefault: true,
    contentPublished: true,
    unlockRequirementNotice: 'Uyanan Meydan oynanabilir. Diğer dört şehir bölgesi geliştirme aşamasındadır.'
  },
  language_academy: {
    id: 'language_academy',
    nameTr: 'Keşif Akademisi',
    subtitleTr: 'İngilizce ustalık ve birleşik görevler',
    emoji: '🌐',
    themeColor: '#2563eb',
    accentBorder: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.45)',
    badgeText: 'Pre-A1 · A1 · A2',
    descriptionTr: 'Önceki adaların kelime, cümle, hikâye ve diyaloglarını macerada birleştir.',
    cefrLevel: 'Pre-A1–A2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/language_academy.webp',
    mobileAsset: '/assets/kids-islands/language_academy_mobile.webp',
    defaultWorldPos: { x: 620, y: 1030 }, // Sol alt: clear of Word Garden art
    hitRadius: 220,
    order: 6,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Bütünleşik ustalık görevleri henüz geliştirme aşamasında.'
  }
};

/**
 * Sıralı Takımada Listesi (1..6)
 */
export const ARCHIPELAGO_ISLANDS_ORDERED: IslandDefinition[] = Object.values(
  ARCHIPELAGO_ISLANDS_CATALOG
).sort((a, b) => a.order - b.order);
