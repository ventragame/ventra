/**
 * Ventra — Öğretim Programı ve İç Beceri Veri Sözleşmesi
 * 
 * Bu modelde resmi müfredat kazanımları (örn. MEB M.4.1.6.1) ile 
 * Ventra'nın iç pedagojik beceri kimlikleri (skill IDs) kesin olarak ayrıştırılmıştır.
 * Öğretim programı sürümü (2018 / 2024 Türkiye Yüzyılı Maarif Modeli) ve kaynak bilgisi
 * veri seviyesinde temsil edilir.
 */

export type CurriculumAuthority = 'MEB' | 'IB' | 'CAMBRIDGE';

export interface CurriculumStandard {
  code: string;                     // örn: 'M.4.1.6.1'
  authority: CurriculumAuthority;   // örn: 'MEB'
  programVersion: string;           // örn: '2018' veya '2024_TYMM'
  grade: number;                    // 4
  subject: string;                  // 'Matematik'
  learningArea: string;             // 'Sayılar ve İşlemler'
  subLearningArea: string;          // 'Kesirler'
  statement: string;                // 'Basit, bileşik ve tam sayılı kesirleri tanır ve modellerle gösterir.'
  sourceUrl?: string;
  notes?: string;
}

export interface VentraInternalSkill {
  id: string;                       // örn: 'ventra.math.g4.fraction.recognize_types'
  title: string;                    // 'Kesir Türlerini Ayırt Etme'
  description: string;              // 'Basit, bileşik ve tam sayılı kesirlerin matematiksel koşullarını anlama'
  domain: 'math' | 'science' | 'engineering' | 'logic';
  curriculumCodes: string[];        // ['M.4.1.6.1']
  order?: number;
  targetWorkshopLevels?: number[];
  targetBridgeLevels?: number[];
}

export interface ExerciseAttemptDetail {
  questionId: string;
  skillId: string;
  curriculumCode: string;
  givenAnswer: string | number;
  expectedAnswer: string | number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface LearningSessionResult {
  sessionId: string;
  profileId?: string;               // Phase 3.4: Oyuncu Profili UUID
  moduleId: string;
  topicTitle: string;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;             // 0.0 - 1.0
  score: number;
  skillMastery: Record<string, {
    attempts: number;
    correct: number;
    accuracy: number;
    mastered: boolean;
  }>;
  attempts: ExerciseAttemptDetail[];
  /** Supabase bağlantısı henüz yapılmadığından yerel durum belirtilir */
  isPersistedToBackend: boolean;
}

/**
 * Resmi MEB 4. Sınıf Kesirler Kazanımları
 */
export const MEB_G4_MATH_CURRICULUM: Record<string, CurriculumStandard> = {
  'M.4.1.6.1': {
    code: 'M.4.1.6.1',
    authority: 'MEB',
    programVersion: '2018',
    grade: 4,
    subject: 'Matematik',
    learningArea: 'Sayılar ve İşlemler',
    subLearningArea: 'Kesirler',
    statement: 'Basit, bileşik ve tam sayılı kesirleri tanır ve modellerle gösterir.',
    notes: 'a) Birim kesirlerin payı 1 olan basit kesir olduğu belirtilir. b) Basit, bileşik ve tam sayılı kesir modellerle temsil edilir.'
  },
  'M.4.1.6.2': {
    code: 'M.4.1.6.2',
    authority: 'MEB',
    programVersion: '2018',
    grade: 4,
    subject: 'Matematik',
    learningArea: 'Sayılar ve İşlemler',
    subLearningArea: 'Kesirler',
    statement: 'Birim kesirleri karşılaştırır ve sıralar.',
    notes: 'Paydası küçük olan birim kesrin daha büyük olduğu modellerle incelenir.'
  }
};

/**
 * Ventra İç Pedagojik Beceri Kataloğu
 */
export const VENTRA_FRACTION_SKILLS: Record<string, VentraInternalSkill> = {
  'ventra.math.g4.fraction.anatomy': {
    id: 'ventra.math.g4.fraction.anatomy',
    title: 'Pay ve Payda Kavramı',
    description: 'Bütünün eş parçalara bölünüşünü (payda) ve seçilen parça adedini (pay) kavrama.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.1'],
    order: 1,
    targetWorkshopLevels: [1]
  },
  'ventra.math.g4.fraction.proper': {
    id: 'ventra.math.g4.fraction.proper',
    title: 'Basit Kesirleri Tanıma ve Modelleme',
    description: 'Payı paydasından küçük olan ve bir bütünden azı temsil eden kesirleri kavrama.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.1'],
    order: 2,
    targetWorkshopLevels: [2, 3]
  },
  'ventra.math.g4.fraction.improper': {
    id: 'ventra.math.g4.fraction.improper',
    title: 'Bileşik Kesirleri Tanıma ve Modelleme',
    description: 'Payı paydasına eşit veya paydasından büyük olan kesirleri modellerle ifade etme.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.1'],
    order: 3,
    targetWorkshopLevels: [5, 6, 7]
  },
  'ventra.math.g4.fraction.mixed': {
    id: 'ventra.math.g4.fraction.mixed',
    title: 'Tam Sayılı Kesirleri Tanıma ve Modelleme',
    description: 'Bir veya birden fazla bütün ile bir basit kesrin birleşimini ifade etme.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.1'],
    order: 4,
    targetWorkshopLevels: [8, 9, 10]
  },
  'ventra.math.g4.fraction.visual_reading': {
    id: 'ventra.math.g4.fraction.visual_reading',
    title: 'Görsel Modellerden Kesir Değeri Çıkarımı',
    description: 'Şerit, daire ve sayı doğrusu modellerinden doğru kesir değerini belirleme.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.1'],
    order: 5,
    targetWorkshopLevels: [4]
  },
  'ventra.math.g4.fraction.unit_comparison': {
    id: 'ventra.math.g4.fraction.unit_comparison',
    title: 'Birim Kesirleri Karşılaştırma ve Sıralama',
    description: 'Payı 1 olan birim kesirlerin modellerini karşılaştırarak payda büyüdükçe parçanın küçüldüğünü kavrama ve sıralama.',
    domain: 'math',
    curriculumCodes: ['M.4.1.6.2'],
    order: 6,
    targetBridgeLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
};

