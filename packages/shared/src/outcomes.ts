/**
 * Ventra — 4. Sınıf Kesirler Kazanım Tanımları
 * Düzeltme: M.4.1.3.1 (çıkarma) yerine resmi MEB kesir kazanımı M.4.1.6.1 güncellendi.
 */

export interface LearningOutcome {
  id: string;
  code: string;
  grade: number;
  subject: string;
  unit: string;
  title: string;
  description: string;
}

export const MVP_LEARNING_OUTCOMES: Record<string, LearningOutcome> = {
  'MATH.G4.FRAC.01': {
    id: 'MATH.G4.FRAC.01',
    code: 'M.4.1.6.1',
    grade: 4,
    subject: 'Matematik',
    unit: 'Kesirler',
    title: 'Basit, Bileşik ve Tam Sayılı Kesirleri Tanıma',
    description: 'Payı paydasından küçük olan kesirlerin basit kesir, payı paydasına eşit veya büyük olan kesirlerin bileşik kesir olduğunu kavrar.'
  },
  'MATH.G4.FRAC.02': {
    id: 'MATH.G4.FRAC.02',
    code: 'M.4.1.6.2',
    grade: 4,
    subject: 'Matematik',
    unit: 'Kesirler',
    title: 'Birim Kesirleri Karşılaştırma ve Sıralama',
    description: 'Bir bütünü eş parçalara ayırarak birim kesri modeller ve ifade eder.'
  }
};
