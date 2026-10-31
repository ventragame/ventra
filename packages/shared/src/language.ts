/**
 * VENTRA — Dil Öğrenme Sözleşmeleri ve Müfredat Veri Modeli
 * 
 * Kids World (7–12 Yaş) ve Life World (13+ Yaş) için ortak dil edinim veri yapıları.
 * CEFR A1 Başlangıç standartlarına uygundur.
 */

export type CefrLevel = 'Pre-A1' | 'A1.1' | 'A1.2' | 'A2' | 'B1' | 'B2';

export interface VocabularyItem {
  id: string;               // örn: 'en_vocab_cat'
  word: string;             // 'cat'
  translationTr: string;    // 'kedi'
  phonetic: string;         // '/kæt/'
  audioUrl: string;         // '/audio/en/animals/cat.wav'
  imageUrl: string;         // '/assets/animals/cat.png'
  category: 'animals' | 'colors' | 'numbers' | 'food' | 'family';
  cefrLevel: CefrLevel;
  directiveExample?: string;// 'Find the cat.'
}

export type LearningStepType = 
  | 'explore'      // 1. Keşfet: Gör ve dinle
  | 'match'        // 2. Eşleştir: Kelimeyi görselle bağla
  | 'listen'       // 3. Dinle: Duyduğun kelimeyi tanı
  | 'apply'        // 4. Uygula: Yönergeyi yerine getir
  | 'mini_quest';  // 5. Mini Macera: Bahçeyi tamamla

export type LevelNodeStatus = 'locked' | 'available' | 'completed';

export interface GameLevelNode {
  id: string;               // örn: 'wg_level_1'
  order: number;            // 1 - 5
  type: LearningStepType;
  title: string;            // '1. Keşfet'
  subtitle: string;         // 'Tanışma ve Dinleme'
  description: string;      // 'Hayvanları tanı ve İngilizce seslerini dinle'
  icon: string;             // '🌱'
  status: LevelNodeStatus;
  starsEarned: number;      // 0 - 3
}

export interface IslandProgressState {
  id: string;               // örn: 'word_garden'
  title: string;
  subtitle: string;
  theme: {
    color: string;
    accent: string;
    glow: string;
  };
  status: 'locked' | 'available' | 'completed';
  totalLevels: number;
  completedLevels: number;
  progressPercent: number;
  levels: GameLevelNode[];
}

export interface LearningNode {
  id: number;               // 1 - 5
  type: LearningStepType;
  title: string;            // 'Keşfet', 'Eşleştir', vb.
  subtitle: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  starsEarned: number;      // 0 - 3
}

export interface RegionState {
  id: string;               // 'word_garden'
  name: string;             // 'Kelime Bahçesi'
  status: 'dormant' | 'blooming';
  totalNodes: number;
  completedNodes: number;
  starsEarned: number;
  unlockedAt?: string;
  bloomedAt?: string;
}

export interface LanguageGameEventPayload {
  profileId: string;
  regionId: string;
  nodeId: number;
  stepType: LearningStepType;
  score: number;
  starsEarned: number;
  accuracyRate: number;
  durationSeconds: number;
  attemptsCount: number;
  wrongAttempts?: number;
  hintsUsed?: number;
  completedAt: string;
}

/**
 * İlk Dikey Dilim: A1 Hayvanlar Müfredat Kataloğu
 */
export const A1_ANIMALS_VOCABULARY: VocabularyItem[] = [
  {
    id: 'en_vocab_cat',
    word: 'cat',
    translationTr: 'kedi',
    phonetic: '/kæt/',
    audioUrl: '/audio/en/animals/cat.wav',
    imageUrl: '/assets/animals/cat.svg',
    category: 'animals',
    cefrLevel: 'A1.1',
    directiveExample: 'Feed the cat with milk.'
  },
  {
    id: 'en_vocab_dog',
    word: 'dog',
    translationTr: 'köpek',
    phonetic: '/dɒɡ/',
    audioUrl: '/audio/en/animals/dog.wav',
    imageUrl: '/assets/animals/dog.svg',
    category: 'animals',
    cefrLevel: 'A1.1',
    directiveExample: 'Pet the friendly dog.'
  },
  {
    id: 'en_vocab_bird',
    word: 'bird',
    translationTr: 'kuş',
    phonetic: '/bɜːd/',
    audioUrl: '/audio/en/animals/bird.wav',
    imageUrl: '/assets/animals/bird.svg',
    category: 'animals',
    cefrLevel: 'A1.1',
    directiveExample: 'Help the bird fly to the tree.'
  },
  {
    id: 'en_vocab_rabbit',
    word: 'rabbit',
    translationTr: 'tavşan',
    phonetic: '/ˈræb.ɪt/',
    audioUrl: '/audio/en/animals/rabbit.wav',
    imageUrl: '/assets/animals/rabbit.svg',
    category: 'animals',
    cefrLevel: 'A1.1',
    directiveExample: 'Give the carrot to the rabbit.'
  }
];

export const WORD_GARDEN_DEFAULT_NODES: LearningNode[] = [
  {
    id: 1,
    type: 'explore',
    title: '1. Keşfet',
    subtitle: 'Hayvanları tanı ve seslerini dinle',
    isUnlocked: true,
    isCompleted: false,
    starsEarned: 0
  },
  {
    id: 2,
    type: 'match',
    title: '2. Eşleştir',
    subtitle: 'Kelimeleri doğru resimlerle bağla',
    isUnlocked: false,
    isCompleted: false,
    starsEarned: 0
  },
  {
    id: 3,
    type: 'listen',
    title: '3. Dinle',
    subtitle: 'Duyduğun hayvanı sahnede bul',
    isUnlocked: false,
    isCompleted: false,
    starsEarned: 0
  },
  {
    id: 4,
    type: 'apply',
    title: '4. Uygula',
    subtitle: 'İngilizce yönergeleri tamamla',
    isUnlocked: false,
    isCompleted: false,
    starsEarned: 0
  },
  {
    id: 5,
    type: 'mini_quest',
    title: '5. Mini Macera',
    subtitle: 'Bahçeyi kurtar ve canlandır',
    isUnlocked: false,
    isCompleted: false,
    starsEarned: 0
  }
];

/**
 * Kelime Bahçesi — Game Level Map 5 Düğümlü Pedagojik Oyun Seviyeleri
 */
export const WORD_GARDEN_LEVELS: GameLevelNode[] = [
  {
    id: 'wg_level_1',
    order: 1,
    type: 'explore',
    title: '1. Keşfet',
    subtitle: 'Gör ve Dinle',
    description: 'Hayvan dostlarımıza dokun ve İngilizce adlarını dinle.',
    icon: '🌱',
    status: 'available',
    starsEarned: 0
  },
  {
    id: 'wg_level_2',
    order: 2,
    type: 'match',
    title: '2. Eşleştir',
    subtitle: 'Kelime & Görsel',
    description: 'Resimleri doğru İngilizce kelimelerle birleştir.',
    icon: '🧩',
    status: 'locked',
    starsEarned: 0
  },
  {
    id: 'wg_level_3',
    order: 3,
    type: 'listen',
    title: '3. Dinle',
    subtitle: 'Duyduğunu Tanı',
    description: 'Duyduğun İngilizce sesin hangi hayvana ait olduğunu bul.',
    icon: '🎧',
    status: 'locked',
    starsEarned: 0
  },
  {
    id: 'wg_level_4',
    order: 4,
    type: 'apply',
    title: '4. Uygula',
    subtitle: 'Harekete Geç',
    description: 'Kediye süt verme ve kuşu yuvaya koyma yönergelerini uygula.',
    icon: '🎯',
    status: 'locked',
    starsEarned: 0
  },
  {
    id: 'wg_level_5',
    order: 5,
    type: 'mini_quest',
    title: '5. Mini Macera',
    subtitle: 'Bahçeyi Canlandır',
    description: 'Tüm dostlarımızı doğru yuvalarına yerleştirip bahçeyi uyandır.',
    icon: '🌟',
    status: 'locked',
    starsEarned: 0
  }
];

export function calculateIslandProgress(levels: GameLevelNode[]): {
  totalLevels: number;
  completedLevels: number;
  progressPercent: number;
  status: 'locked' | 'available' | 'completed';
} {
  const totalLevels = levels.length;
  const completedLevels = levels.filter((l) => l.status === 'completed').length;
  const progressPercent = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
  const status = completedLevels === totalLevels && totalLevels > 0 ? 'completed' : 'available';
  return {
    totalLevels,
    completedLevels,
    progressPercent,
    status
  };
}

