/**
 * VENTRA KIDS — Adalar Evreni (Archipelago) Veri Modeli V2 (Compact Oval Layout)
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
    subtitleTr: 'Kelime öğrenme',
    emoji: '🌸',
    themeColor: '#059669',
    accentBorder: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    badgeText: '7–12 Yaş • A1.1',
    descriptionTr: 'Başlangıç kelimeleri, hayvanlar ve renklerle adayı canlandır.',
    cefrLevel: 'A1.1',
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
    nameTr: 'Dinleme Ormanı',
    subtitleTr: 'Dinleme ve anlama',
    emoji: '🎧',
    themeColor: '#4f46e5',
    accentBorder: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.45)',
    badgeText: '7–12 Yaş • A1.2',
    descriptionTr: 'Müzikli ağaç kovanları ve ses portallarıyla duyduğunu anla.',
    cefrLevel: 'A1.2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/listening_forest.webp',
    mobileAsset: '/assets/kids-islands/listening_forest_mobile.webp',
    defaultWorldPos: { x: 1240, y: 430 }, // Üst orta
    hitRadius: 210,
    order: 2,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Kelime Bahçesi tamamlandığında açılır'
  },
  speaking_harbor: {
    id: 'speaking_harbor',
    nameTr: 'Konuşma Limanı',
    subtitleTr: 'Konuşma ve telaffuz',
    emoji: '⚓',
    themeColor: '#0284c7',
    accentBorder: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    badgeText: '7–12 Yaş • A1.2',
    descriptionTr: 'Liman ve gemilerde günlük selamlaşma ve sesli diyaloglar.',
    cefrLevel: 'A1.2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/speaking_harbor.webp',
    mobileAsset: '/assets/kids-islands/speaking_harbor_mobile.webp',
    defaultWorldPos: { x: 1800, y: 590 }, // Sağ üst
    hitRadius: 210,
    order: 3,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Dinleme Ormanı tamamlandığında açılır'
  },
  sentence_workshop: {
    id: 'sentence_workshop',
    nameTr: 'Yazı Atölyesi',
    subtitleTr: 'Yazma ve dil üretimi',
    emoji: '📜',
    themeColor: '#d97706',
    accentBorder: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    badgeText: '7–12 Yaş • A2.1',
    descriptionTr: 'Tüy kalemler ve parşömenlerle ilk İngilizce kelimeleri ve cümleleri yaz.',
    cefrLevel: 'A2.1',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/sentence_workshop.webp',
    mobileAsset: '/assets/kids-islands/sentence_workshop_mobile.webp',
    defaultWorldPos: { x: 1750, y: 1000 }, // Sağ alt
    hitRadius: 210,
    order: 4,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Konuşma Limanı tamamlandığında açılır'
  },
  story_castle: {
    id: 'story_castle',
    nameTr: 'Cümle Meydanı',
    subtitleTr: 'Cümle yapıları',
    emoji: '🏰',
    themeColor: '#7c3aed',
    accentBorder: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    badgeText: '7–12 Yaş • A2.2',
    descriptionTr: 'Büyülü kulelerde ve dev masal kitaplarında doğru cümle kalıplarını keşfet.',
    cefrLevel: 'A2.2',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/story_castle.webp',
    mobileAsset: '/assets/kids-islands/story_castle_mobile.webp',
    defaultWorldPos: { x: 1160, y: 1090 }, // Alt orta
    hitRadius: 210,
    order: 5,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Yazı Atölyesi tamamlandığında açılır'
  },
  language_academy: {
    id: 'language_academy',
    nameTr: 'Keşif Akademisi',
    subtitleTr: 'Bütünleşik dil becerileri',
    emoji: '🌐',
    themeColor: '#2563eb',
    accentBorder: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.45)',
    badgeText: '7–12 Yaş • A2+',
    descriptionTr: 'Altın küre anıtında tüm dil becerilerini birleştiren büyük takımada finali.',
    cefrLevel: 'A2+',
    totalPublishedRequiredLevels: 0,
    desktopAsset: '/assets/kids-islands/language_academy.webp',
    mobileAsset: '/assets/kids-islands/language_academy_mobile.webp',
    defaultWorldPos: { x: 620, y: 930 }, // Sol alt
    hitRadius: 220,
    order: 6,
    isUnlockedDefault: false,
    contentPublished: false,
    unlockRequirementNotice: 'Tüm adalar tamamlandığında açılır'
  }
};

/**
 * Sıralı Takımada Listesi (1..6)
 */
export const ARCHIPELAGO_ISLANDS_ORDERED: IslandDefinition[] = Object.values(
  ARCHIPELAGO_ISLANDS_CATALOG
).sort((a, b) => a.order - b.order);
