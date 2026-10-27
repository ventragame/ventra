import type { CurriculumStandard, VentraInternalSkill } from '@ventra/shared';
import { MEB_G4_MATH_CURRICULUM, VENTRA_FRACTION_SKILLS } from '@ventra/shared';

export interface FractionLessonSection {
  id: string;
  title: string;
  subtitle: string;
  skillId: string;
  badge: string;
  content: {
    explanation: string;
    keyRule: string;
    visualType: 'anatomy' | 'proper' | 'improper' | 'mixed' | 'number_line';
    visualData: {
      numerator: number;
      denominator: number;
      whole?: number;
      label?: string;
    };
    realLifeExample: {
      title: string;
      story: string;
      fraction: string;
    };
    funFact?: string;
  };
}

export interface SolvedExample {
  id: string;
  title: string;
  problem: string;
  skillId: string;
  model: {
    numerator: number;
    denominator: number;
    whole?: number;
    type: 'pie' | 'strip';
  };
  steps: {
    stepNumber: number;
    title: string;
    description: string;
  }[];
  finalConclusion: string;
}

export interface ExerciseQuestion {
  id: string;
  skillId: string;
  curriculumCode: string;
  question: string;
  prompt: string;
  model?: {
    type: 'pie' | 'strip' | 'number_line' | 'mixed_bars';
    numerator: number;
    denominator: number;
    whole?: number;
    totalParts?: number;
    shadedParts?: number;
  };
  options: {
    id: string;
    label: string;
    sublabel?: string;
    fractionValue?: { n: number; d: number; w?: number };
  }[];
  correctOptionId: string;
  explanation: string;
  misconceptionAlert?: string;
}

export interface LearningModuleData {
  id: string;
  title: string;
  grade: number;
  subject: string;
  unit: string;
  curriculumStandard: CurriculumStandard;
  targetSkills: VentraInternalSkill[];
  sections: FractionLessonSection[];
  solvedExamples: SolvedExample[];
  exercises: ExerciseQuestion[];
}

export const FRACTIONS_MODULE_DATA: LearningModuleData = {
  id: 'g4-math-fractions-intro',
  title: 'Kesirlerin Büyülü Dünyası: Basit, Bileşik ve Tam Sayılı Kesirler',
  grade: 4,
  subject: 'Matematik',
  unit: 'Kesirler',
  curriculumStandard: MEB_G4_MATH_CURRICULUM['M.4.1.6.1'],
  targetSkills: [
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.anatomy'],
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.proper'],
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.improper'],
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.mixed'],
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.visual_reading']
  ],
  sections: [
    {
      id: 'sec-anatomy',
      title: 'Pay ve Payda: Kesrin Anatomisi',
      subtitle: 'Bütünü Eşit Paylaşmanın Matematik Dili',
      skillId: 'ventra.math.g4.fraction.anatomy',
      badge: 'Temel Kavram',
      content: {
        explanation: 'Bir bütünü (örneğin lezzetli bir pizzayı veya bir çikolata kalıbını) birbirine tıpatıp eşit parçalara böldüğümüzde kesirleri kullanırız. Kesir çizgisi, bütün ile seçtiğimiz parçalar arasındaki oranı gösterir.',
        keyRule: 'Payda (alttaki sayı): Bütünün kaç EŞİT parçaya bölündüğünü söyler.\nPay (üstteki sayı): Bu eş parçalardan kaç tanesini aldığımızı veya boyadığımızı söyler.',
        visualType: 'anatomy',
        visualData: {
          numerator: 3,
          denominator: 4,
          label: '3/4 (Dörtte Üç)'
        },
        realLifeExample: {
          title: 'Doğum Günü Pastası',
          story: 'Mert doğum günü pastasını 8 eşit dilime ayırdı. Arkadaşlarına 5 dilim ikram etti.',
          fraction: 'Pastanın 5/8\'i (sekizde beşi) dağıtılmıştır.'
        },
        funFact: 'Unutma! Parçaların mutlaka birbirine "EŞİT" olması gerekir. Eşit olmayan parçalar kesir oluşturmaz!'
      }
    },
    {
      id: 'sec-proper',
      title: 'Basit Kesirler',
      subtitle: 'Bir Bütünden Daha Az Parçalar',
      skillId: 'ventra.math.g4.fraction.proper',
      badge: 'Pay < Payda',
      content: {
        explanation: 'Payı, paydasından küçük olan kesirlere "Basit Kesir" denir. Basit kesirler daima 0 ile 1 arasındadır; yani elimizde henüz tam bir bütün yoktur, sadece bütünün bir parçası vardır.',
        keyRule: 'Kural: Pay < Payda (Örn: 1/2, 3/5, 7/10)\nPayı 1 olan basit kesirlere aynı zamanda "Birim Kesir" denir (1/4, 1/8 gibi).',
        visualType: 'proper',
        visualData: {
          numerator: 2,
          denominator: 5,
          label: '2/5 Basit Kesir'
        },
        realLifeExample: {
          title: 'Su Matarası',
          story: 'Zeynep spor yaparken 6 eşit bölmeye ayrılmış su matarasının 4 bölmesini içti.',
          fraction: 'Zeynep suyun 4/6\'sını içti (1 bütünden azdır).'
        },
        funFact: 'Bir kesir basit kesirse, sayı doğrusunda kesinlikle 0 ile 1 bütününün arasında durur.'
      }
    },
    {
      id: 'sec-improper',
      title: 'Bileşik Kesirler',
      subtitle: 'Bir Bütün veya Bütünden Daha Fazlası',
      skillId: 'ventra.math.g4.fraction.improper',
      badge: 'Pay ≥ Payda',
      content: {
        explanation: 'Payı, paydasına EŞİT veya paydasından BÜYÜK olan kesirlere "Bileşik Kesir" denir. Burada en az 1 tam bütün tamamlanmıştır ya da birden fazla bütünden parçalar birleşmiştir.',
        keyRule: 'Kural: Pay ≥ Payda\n• Pay = Payda ise kesir tam 1 bütündür (4/4 = 1 tam, 6/6 = 1 tam)\n• Pay > Payda ise kesir 1 bütünden daha büyüktür (7/4 = 1 bütün + 3 çeyrek parça)',
        visualType: 'improper',
        visualData: {
          numerator: 7,
          denominator: 4,
          label: '7/4 Bileşik Kesir'
        },
        realLifeExample: {
          title: 'Piknik Elmaları',
          story: 'Her biri 4 dilime ayrılmış elmalardan çocuklar toplam 7 dilim yediler.',
          fraction: 'Yenen elma 7/4 dilimdir (1 tam elma + 3 dilim).'
        },
        funFact: '5/5 veya 10/10 gibi kesirler de bileşik kesirdir! Çünkü tam 1 bütünü temsil ederler.'
      }
    },
    {
      id: 'sec-mixed',
      title: 'Tam Sayılı Kesirler',
      subtitle: 'Bütünler ve Yanındaki Parçaların Dostluğu',
      skillId: 'ventra.math.g4.fraction.mixed',
      badge: 'Tam Kısım + Basit Kesir',
      content: {
        explanation: 'Bir sayma sayısı (tam kısım) ile bir basit kesrin bir araya gelmesiyle oluşan kesirlere "Tam Sayılı Kesir" denir. Örneğin 2 tam ekmek ve yanına yarım ekmek aldığınızda tam sayılı kesir kullanırsınız.',
        keyRule: 'Biçim: [Tam Kısım] + [Basit Kesir]\nÖrnek: 2 tam 1/3 (İki tam, üçte bir)\nDikkat: Tam sayılı kesirdeki kesir kısmı mutlaka basit kesir olmalıdır.',
        visualType: 'mixed',
        visualData: {
          whole: 2,
          numerator: 1,
          denominator: 3,
          label: '2 Tam 1/3'
        },
        realLifeExample: {
          title: 'Kare Çikolatalar',
          story: 'Can 2 tam çikolata tableti ve 3. tabletin de 4 eş parçasından 1\'ini yedi.',
          fraction: 'Can 2 tam 1/4 çikolata yemiştir.'
        },
        funFact: 'Her tam sayılı kesir aslında bir bileşik kesrin daha düzenli yazılmış hâlidir: 2 tam 1/4 = 9/4!'
      }
    }
  ],
  solvedExamples: [
    {
      id: 'ex-1',
      title: 'Örnek 1: Kesir Türünü Belirleme',
      problem: '8/5 kesrinin türünü belirleyiniz ve modelleyerek açıklayınız.',
      skillId: 'ventra.math.g4.fraction.improper',
      model: {
        numerator: 8,
        denominator: 5,
        type: 'strip'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Pay ve Paydayı İncele',
          description: 'Kesrimizin payı 8, paydası 5\'tir.'
        },
        {
          stepNumber: 2,
          title: 'Matematiksel Kuralı Uygula',
          description: '8 > 5 olduğu için (Pay > Payda), bu kesir 1 bütünden büyüktür.'
        },
        {
          stepNumber: 3,
          title: 'Modelleme ve Yorum',
          description: 'Her biri 5 eş parçaya ayrılmış şeritlerden 1 tam şerit (5 parça) ve 2. şeritten 3 parça taranmıştır.'
        }
      ],
      finalConclusion: 'Sonuç: 8/5 bir BİLEŞİK KESİRDİR (aynı zamanda 1 tam 3/5\'e eşittir).'
    },
    {
      id: 'ex-2',
      title: 'Örnek 2: Modellenen Şekli Tam Sayılı Kesirle Yazma',
      problem: 'Masada 3 adet tam portakal ve dörde bölünmüş bir portakalın 3 dilimi bulunmaktadır. Bunu kesirle ifade ediniz.',
      skillId: 'ventra.math.g4.fraction.mixed',
      model: {
        whole: 3,
        numerator: 3,
        denominator: 4,
        type: 'pie'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Tam Bütünleri Say',
          description: 'Eksiksiz duran 3 tane tam portakal vardır -> Tam kısım = 3'
        },
        {
          stepNumber: 2,
          title: 'Parçalı Bütünü Kesir Olarak Yaz',
          description: 'Son portakal 4 eşit dilime ayrılmış ve 3 dilimi alınmıştır -> Kesir kısmı = 3/4'
        },
        {
          stepNumber: 3,
          title: 'Birleştirerek Oku',
          description: 'Tam kısım ile basit kesir yan yana yazılır: 3 tam 3/4.'
        }
      ],
      finalConclusion: 'Sonuç: Portakalların miktarı 3 tam 3/4 (Üç tam dörtte üç) tam sayılı kesridir.'
    }
  ],
  exercises: [
    {
      id: 'q1',
      skillId: 'ventra.math.g4.fraction.anatomy',
      curriculumCode: 'M.4.1.6.1',
      question: 'Bir karpuz 8 eşit dilime kesilmiş ve 3 dilimi misafirlere ikram edilmiştir.',
      prompt: 'İkram edilen karpuz miktarını gösteren kesirde PAY ve PAYDA hangisidir?',
      model: {
        type: 'pie',
        numerator: 3,
        denominator: 8
      },
      options: [
        { id: 'opt-a', label: 'Pay: 3, Payda: 8', sublabel: '3/8 kesri' },
        { id: 'opt-b', label: 'Pay: 8, Payda: 3', sublabel: '8/3 kesri' },
        { id: 'opt-c', label: 'Pay: 5, Payda: 8', sublabel: '5/8 kesri' },
        { id: 'opt-d', label: 'Pay: 8, Payda: 5', sublabel: '8/5 kesri' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Bütünün bölündüğü eşit parça sayısı (8) PAYDA olarak alta yazılır. Alınan/ikram edilen parça sayısı (3) PAY olarak üste yazılır. Doğru kesir 3/8\'dir.',
      misconceptionAlert: 'Pay ile paydanın yerini karıştırmayın: Üstteki parça sayısı (pay), alttaki bütün parça sayısıdır (payda).'
    },
    {
      id: 'q2',
      skillId: 'ventra.math.g4.fraction.proper',
      curriculumCode: 'M.4.1.6.1',
      question: 'Aşağıdaki kesirlerden hangisi bir BASİT KESİRDİR?',
      prompt: 'Basit kesir kuralını hatırlayarak doğru seçeneği bulunuz.',
      options: [
        { id: 'opt-a', label: '7 / 4', sublabel: 'Pay (7) > Payda (4)' },
        { id: 'opt-b', label: '5 / 5', sublabel: 'Pay (5) = Payda (5)' },
        { id: 'opt-c', label: '3 / 8', sublabel: 'Pay (3) < Payda (8)' },
        { id: 'opt-d', label: '9 / 2', sublabel: 'Pay (9) > Payda (2)' }
      ],
      correctOptionId: 'opt-c',
      explanation: 'Basit kesirlerde pay, paydadan mutlaka küçük olmalıdır (Pay < Payda). 3/8 kesrinde 3 < 8 olduğu için basit kesirdir. Diğerleri ise bileşik kesirdir.',
      misconceptionAlert: '5/5 kesri pay ve paydası eşit olduğu için 1 tam bütündür ve bileşik kesir sınıfına girer.'
    },
    {
      id: 'q3',
      skillId: 'ventra.math.g4.fraction.visual_reading',
      curriculumCode: 'M.4.1.6.1',
      question: 'Yukarıdaki şerit modelinde bir bütün 6 eş parçaya bölünmüş ve 4 parçası maviye boyanmıştır.',
      prompt: 'Bu modelin temsil ettiği kesir ve türü aşağıdakilerden hangisidir?',
      model: {
        type: 'strip',
        numerator: 4,
        denominator: 6
      },
      options: [
        { id: 'opt-a', label: '4/6 — Basit Kesir', sublabel: 'Pay paydadan küçük' },
        { id: 'opt-b', label: '6/4 — Bileşik Kesir', sublabel: 'Ters yazım' },
        { id: 'opt-c', label: '2/6 — Birim Kesir', sublabel: 'Boyanmayan kısım' },
        { id: 'opt-d', label: '1 tam 4/6 — Tam Sayılı Kesir', sublabel: 'Hatalı bütün sayısı' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Toplam parça sayısı 6 (payda), boyalı parça sayısı 4 (pay) olduğundan kesir 4/6\'dır. 4 < 6 olduğundan bu bir basit kesirdir.',
      misconceptionAlert: 'Soruda boyalı parça sorulmaktadır, kalan beyaz parçalar (2/6) ile karıştırmayınız.'
    },
    {
      id: 'q4',
      skillId: 'ventra.math.g4.fraction.improper',
      curriculumCode: 'M.4.1.6.1',
      question: 'Payı 7 olan bir kesrin BİLEŞİK KESİR olması istenmektedir.',
      prompt: 'Buna göre bu kesrin paydası aşağıdakilerden hangisi OLAMAZ?',
      options: [
        { id: 'opt-a', label: '3', sublabel: '7/3 kesri' },
        { id: 'opt-b', label: '5', sublabel: '7/5 kesri' },
        { id: 'opt-c', label: '7', sublabel: '7/7 kesri' },
        { id: 'opt-d', label: '10', sublabel: '7/10 kesri' }
      ],
      correctOptionId: 'opt-d',
      explanation: 'Bileşik kesirde Pay ≥ Payda olmalıdır. Pay 7 olduğuna göre payda 7 veya 7\'den küçük (7, 6, 5, 4, 3, 2, 1) olmalıdır. Eğer payda 10 olursa kesir 7/10 olur ve bu bir BASİT KESİR haline gelir.',
      misconceptionAlert: 'Payda 7 olduğunda 7/7 = 1 tamdır ve bileşik kesir kuralını (Pay = Payda) sağlar.'
    },
    {
      id: 'q5',
      skillId: 'ventra.math.g4.fraction.mixed',
      curriculumCode: 'M.4.1.6.1',
      question: 'Görselde 2 tam blok tamamen dolu, 3. blok ise 4 eş parçaya bölünüp 3 parçası boyanmıştır.',
      prompt: 'Bu model hangi TAM SAYILI KESRİ temsil eder?',
      model: {
        type: 'mixed_bars',
        whole: 2,
        numerator: 3,
        denominator: 4
      },
      options: [
        { id: 'opt-a', label: '2 tam 3/4', sublabel: 'İki tam, dörtte üç' },
        { id: 'opt-b', label: '3 tam 2/4', sublabel: 'Hatalı tam kısım' },
        { id: 'opt-c', label: '2 tam 1/4', sublabel: 'Boyanmayan parça alınmış' },
        { id: 'opt-d', label: '11/4', sublabel: 'Bileşik kesir yazımı (soru tam sayılı soruyor)' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Tamamen boyalı 2 bütün "2 tam" kısmını, son kutudaki 4 parçadan 3\'ü ise "3/4" kesir kısmını oluşturur. Tam sayılı kesir: 2 tam 3/4.',
      misconceptionAlert: 'Soru tam sayılı kesir biçiminde istemektedir; 11/4 matematiksel olarak eşdeğer olsa da tam sayılı formatı 2 tam 3/4\'tür.'
    },
    {
      id: 'q6',
      skillId: 'ventra.math.g4.fraction.improper',
      curriculumCode: 'M.4.1.6.1',
      question: 'Bir pastacı 11/4 porsiyon pasta satmıştır.',
      prompt: 'Bu satılan miktar kaç tam pasta ve kaç parça pastaya eşittir?',
      options: [
        { id: 'opt-a', label: '2 tam pasta ve 3 parça (2 tam 3/4)', sublabel: '8 parça + 3 parça = 11' },
        { id: 'opt-b', label: '3 tam pasta ve 1 parça (3 tam 1/4)', sublabel: '12 parça - 1 parça' },
        { id: 'opt-c', label: '1 tam pasta ve 7 parça (1 tam 7/4)', sublabel: 'Geçersiz tam sayılı' },
        { id: 'opt-d', label: '2 tam pasta ve 1 parça (2 tam 1/4)', sublabel: 'Eksik parça hesabı' }
      ],
      correctOptionId: 'opt-a',
      explanation: '11 sayısını 4\'e böleriz: 11 ÷ 4 = 2 (bölüm) ve kalan 3\'tür. Yani 2 tam bütün oluşur ve geriye 3 parça kalır. 11/4 = 2 tam 3/4.',
      misconceptionAlert: 'Payı paydaya bölerek tam kısmı (bölüm) ve yeni payı (kalan) rahatça bulabilirsiniz.'
    },
    {
      id: 'q7',
      skillId: 'ventra.math.g4.fraction.proper',
      curriculumCode: 'M.4.1.6.1',
      question: 'K / 9 kesrinin bir BASİT KESİR olduğu bilinmektedir.',
      prompt: '"K" yerine yazılabilecek EN BÜYÜK doğal sayı kaçtır?',
      options: [
        { id: 'opt-a', label: '8', sublabel: '8 < 9 şartını sağlayan en büyük sayı' },
        { id: 'opt-b', label: '9', sublabel: '9/9 bileşik kesir olurdu' },
        { id: 'opt-c', label: '10', sublabel: '10 > 9 bileşik kesir' },
        { id: 'opt-d', label: '7', sublabel: 'En büyük değil' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'K/9\'un basit kesir olması için K < 9 olmalıdır. 9\'dan küçük en büyük doğal sayı 8\'dir. K = 8 olduğunda 8/9 en büyük basit kesir olur.',
      misconceptionAlert: 'Eğer K = 9 seçilirse 9/9 = 1 tam olur ve kesir bileşik kesre dönüşür.'
    },
    {
      id: 'q8',
      skillId: 'ventra.math.g4.fraction.visual_reading',
      curriculumCode: 'M.4.1.6.1',
      question: 'Sayı doğrusunda 0 ile 1 arası 5 eşit parçaya bölünmüş ve 0\'dan itibaren 3. çizgi işaretlenmiştir.',
      prompt: 'İşaretlenen bu nokta hangi kesri gösterir ve türü nedir?',
      model: {
        type: 'number_line',
        numerator: 3,
        denominator: 5
      },
      options: [
        { id: 'opt-a', label: '3/5 — Basit Kesir', sublabel: '0 ile 1 arasında' },
        { id: 'opt-b', label: '5/3 — Bileşik Kesir', sublabel: '1\'den büyük' },
        { id: 'opt-c', label: '2/5 — Birim Kesir', sublabel: 'Kalan aralık' },
        { id: 'opt-d', label: '1 tam 3/5 — Tam Sayılı Kesir', sublabel: '1\'in sağında değil' }
      ],
      correctOptionId: 'opt-a',
      explanation: '0 ile 1 arası 5 eşit parçaya bölündüğü için payda 5\'tir. 3 adım ilerlendiği için pay 3\'tür. 3/5 kesri 0 ile 1 arasında yer aldığı için bir BASİT KESİRDİR.',
      misconceptionAlert: 'Sayı doğrusunda 0 ile 1 arasındaki tüm kesirler basit kesirdir.'
    }
  ]
};

export const UNIT_FRACTIONS_MODULE_DATA: LearningModuleData = {
  id: 'g4-math-unit-fractions',
  title: 'Birim Kesirler ve Karşılaştırma: Kesir Köprüsü Macerası',
  grade: 4,
  subject: 'Matematik',
  unit: 'Kesirler',
  curriculumStandard: MEB_G4_MATH_CURRICULUM['M.4.1.6.2'],
  targetSkills: [
    VENTRA_FRACTION_SKILLS['ventra.math.g4.fraction.unit_comparison']
  ],
  sections: [
    {
      id: 'unit-concept',
      title: 'Birim Kesir Nedir?',
      subtitle: 'Bir bütünün eş parçalarından bir tanesi',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      badge: 'Temel Kavram',
      content: {
        explanation: 'Payı daima "1" olan ve bir bütünün eş parçalarından sadece bir tanesini gösteren basit kesirlere BİRİM KESİR denir. Örneğin 1/2, 1/3, 1/4, 1/8, 1/12, 1/20 birer birim kesirdir.',
        keyRule: 'Birim kesrin payı mutlaka 1\'dir. Paydası ise bütünün kaç eş parçaya bölündüğünü belirtir.',
        visualType: 'proper',
        visualData: {
          numerator: 1,
          denominator: 4,
          label: '1/4 Birim Kesir'
        },
        realLifeExample: {
          title: 'Doğum Günü Pastası',
          story: 'Bir doğum günü pastasını 4 arkadaş eşit olarak dilimlediğinde, sana düşen tek bir dilim pastanın 1/4\'üdür.',
          fraction: '1/4'
        },
        funFact: 'Her kesir aslında birim kesirlerin yan yana gelmesiyle oluşur! Örneğin 3/5 kesri, 3 adet 1/5 birim kesrinin toplamıdır.'
      }
    },
    {
      id: 'denominator-effect',
      title: 'Payda Büyüdükçe Parça Neden Küçülür?',
      subtitle: 'Daha çok parça, daha küçük dilimler demektir',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      badge: 'Kritik Kural',
      content: {
        explanation: 'Aynı büyüklükteki bir çikolatayı 2 arkadaş paylaşırsanız kocaman bir parça (1/2) alırsınız. Ancak aynı çikolatayı 8 arkadaş paylaşırsanız her birinize düşen parça (1/8) çok daha küçük olur! Bütün ne kadar çok parçaya bölünürse, her bir dilim o kadar ufak olur.',
        keyRule: 'Birim kesirlerde payda BÜYÜDÜKÇE kesrin değeri KÜÇÜLÜR! Payda KÜÇÜLDÜKÇE kesrin değeri BÜYÜR!',
        visualType: 'proper',
        visualData: {
          numerator: 1,
          denominator: 8,
          label: '1/8 Dilimi (1/2\'den çok daha küçüktür)'
        },
        realLifeExample: {
          title: 'Karpuz Paylaşımı',
          story: 'Kocaman bir karpuzu 2 parçaya bölerseniz yarım karpuz (1/2) yersiniz. 20 parçaya bölerseniz incecik küçük bir dilim (1/20) alırsınız.',
          fraction: '1/2 > 1/20'
        },
        funFact: 'Doğal sayıların aksine, kesirlerde paydadaki sayının büyük olması dilimin büyük olduğu anlamına gelmez, tam aksine parçanın daha ufak olduğunu gösterir!'
      }
    },
    {
      id: 'compare-units',
      title: 'Birim Kesirleri Karşılaştırma',
      subtitle: 'Büyüktür (>) ve Küçüktür (<) Sembolleri',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      badge: 'Karşılaştırma',
      content: {
        explanation: 'İki birim kesri karşılaştırırken yalnızca paydalarına bakarız. Paydası küçük olan bütün daha az parçalandığı için dilimi daha büyüktür. Örneğin 1/3 ile 1/6 karşılaştırılırken: 3 < 6 olduğu için parça boyutu olarak 1/3 > 1/6 olur.',
        keyRule: 'Paydası küçük olan birim kesir daima DAHA BÜYÜKTÜR: 1/3 > 1/7, 1/5 > 1/15, 1/2 > 1/20.',
        visualType: 'proper',
        visualData: {
          numerator: 1,
          denominator: 3,
          label: '1/3 > 1/6'
        },
        realLifeExample: {
          title: 'Koşu Parkuru',
          story: 'Parkurun 1/2\'sini koşan bir sporcu, parkurun 1/5\'ini koşan sporcudan çok daha fazla mesafe katetmiştir.',
          fraction: '1/2 > 1/5'
        },
        funFact: 'Sayı doğrusunda 0 ile 1 arasında, 1/2 noktası tam ortadadır; 1/10 ise 0\'a çok daha yakındır!'
      }
    },
    {
      id: 'ordering-bridge',
      title: 'Birim Kesirleri Sıralama: Köprü Kuralı',
      subtitle: 'Büyükten küçüğe ve küçükten büyüğe kusursuz dizilim',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      badge: 'Sıralama Stratejisi',
      content: {
        explanation: 'Birim kesirleri büyükten küçüğe sıralarken paydası en küçük olandan en büyük olana doğru yazarız (Köprüde en geniş kalastan en dar kalasa geçiş gibi). Küçükten büyüğe sıralarken ise tam tersi yapılır: paydası en büyük olan en küçük parçadır.',
        keyRule: 'Büyükten küçüğe: 1/2 > 1/5 > 1/9 > 1/16. Küçükten büyüğe: 1/20 < 1/12 < 1/6 < 1/3.',
        visualType: 'proper',
        visualData: {
          numerator: 1,
          denominator: 2,
          label: '1/2 > 1/4 > 1/8'
        },
        realLifeExample: {
          title: 'Kesir Köprüsü Mimarı',
          story: 'Köprü ustası en sağlam geçişi yapmak için kalasları boyut sırasına göre yan yana dizer. 1/2 en geniş kalas, 1/20 ise en dar kalastır.',
          fraction: '1/2 > 1/4 > 1/10'
        },
        funFact: 'Kesir Köprüsü mini oyunumuzda kalasların boyu paydalarıyla ters orantılıdır: 1/2 dev gibi bir kalasken, 1/20 ince bir çıtadır!'
      }
    }
  ],
  solvedExamples: [
    {
      id: 'ex-u1',
      title: 'Örnek 1: İki Birim Kesri Karşılaştırma',
      problem: '1/4 ile 1/9 birim kesirlerini karşılaştırarak araya ">" veya "<" sembollerinden uygun olanını koyunuz.',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      model: {
        numerator: 1,
        denominator: 4,
        type: 'strip'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Payları İncele',
          description: 'Her iki kesrin de payı 1\'dir. Yani iki kesir de birer birim kesirdir.'
        },
        {
          stepNumber: 2,
          title: 'Paydaları Karşılaştır',
          description: 'Paydalar 4 ve 9\'dur. Bir bütün 4 eş parçaya bölündüğünde elde edilen dilim, 9 parçaya bölündüğündeki dilimden çok daha büyüktür (4 < 9).'
        },
        {
          stepNumber: 3,
          title: 'Sonucu Belirle',
          description: 'Paydası küçük olan birim kesir daha büyük olduğu için 1/4 > 1/9 olur.'
        }
      ],
      finalConclusion: '1/4 > 1/9 (1/4 büyüktür 1/9\'dan)'
    },
    {
      id: 'ex-u2',
      title: 'Örnek 2: Üç Birim Kesri Büyükten Küçüğe Sıralama',
      problem: '1/6, 1/2 ve 1/10 birim kesirlerini BÜYÜKTEN KÜÇÜĞE doğru sıralayınız.',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      model: {
        numerator: 1,
        denominator: 2,
        type: 'strip'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Bütünlerin Parçalanma Sayısını Belirle',
          description: 'Paydalarımız: 6, 2 ve 10. En az bölünen bütün en büyük parçayı verir.'
        },
        {
          stepNumber: 2,
          title: 'En Büyük ve En Küçük Kesri Bul',
          description: 'Paydası en küçük olan 2\'dir, yani 1/2 en büyük birim kesirdir. Paydası en büyük olan 10\'dur, yani 1/10 en küçük birim kesirdir.'
        },
        {
          stepNumber: 3,
          title: 'Sıralamayı Yaz',
          description: 'Büyükten küçüğe doğru paydaları küçükten büyüğe dizeriz: 1/2 > 1/6 > 1/10.'
        }
      ],
      finalConclusion: '1/2 > 1/6 > 1/10'
    },
    {
      id: 'ex-u3',
      title: 'Örnek 3: Küçükten Büyüğe Sıralama (MEB Üst Sınırı: Payda 20)',
      problem: '1/20, 1/15, 1/5 birim kesirlerini KÜÇÜKTEN BÜYÜĞE doğru sıralayınız.',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      model: {
        numerator: 1,
        denominator: 20,
        type: 'strip'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'En Küçük Parçayı Tespit Et',
          description: 'Bir bütün ne kadar çok parçaya ayrılırsa parça o kadar küçülür. 20 parçaya bölünen bütünün tek parçası (1/20) en küçük parçadır.'
        },
        {
          stepNumber: 2,
          title: 'Ortanca ve En Büyük Parçayı Bul',
          description: '15 parçaya bölünen (1/15) ortancadır. 5 parçaya bölünen (1/5) ise içlerindeki en büyük parçadır.'
        },
        {
          stepNumber: 3,
          title: 'Küçükten Büyüğe Sembolle Göster',
          description: 'Küçükten büyüğe sıralama için "<" işareti kullanılır: 1/20 < 1/15 < 1/5.'
        }
      ],
      finalConclusion: '1/20 < 1/15 < 1/5'
    }
  ],
  exercises: [
    {
      id: 'qu-1',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: 'Aşağıdaki kesirlerden hangisi bir "BİRİM KESİR"dir?',
      prompt: 'Birim kesir tanımını hatırla ve doğru seçeneği işaretle.',
      options: [
        { id: 'opt-a', label: '1/7', sublabel: 'Payı 1 olan basit kesir' },
        { id: 'opt-b', label: '3/7', sublabel: 'Payı 1\'den büyük' },
        { id: 'opt-c', label: '7/1', sublabel: 'Payı 7, paydası 1 olan bileşik kesir' },
        { id: 'opt-d', label: '2/7', sublabel: '2 adet birim kesir' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Payı "1" olan tüm basit kesirler birim kesirdir. 1/7 bir birim kesirdir.',
      misconceptionAlert: 'Paydası 1 olan kesirler (7/1 gibi) tam sayıdır, birim kesir değildir. Birim kesrin payı 1 olmalıdır.'
    },
    {
      id: 'qu-2',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: '1/5 ... 1/8 karşılaştırmasında noktalı yere hangi sembol gelmelidir?',
      prompt: 'Paydaları karşılaştırarak doğru ilişkiyi seç.',
      options: [
        { id: 'opt-a', label: '>', sublabel: '1/5 büyüktür 1/8\'den' },
        { id: 'opt-b', label: '<', sublabel: '1/5 küçüktür 1/8\'den' },
        { id: 'opt-c', label: '=', sublabel: 'Eşit' },
        { id: 'opt-d', label: 'Belirlenemez', sublabel: 'Bütünler farklı' }
      ],
      correctOptionId: 'opt-a',
      explanation: '5 < 8 olduğu için aynı bütün 5 parçaya bölündüğünde elde edilen dilim, 8 parçaya bölündüğündekinden daha büyüktür. Dolayısıyla 1/5 > 1/8.',
      misconceptionAlert: '8 > 5 olduğu için 1/8\'i daha büyük zannetmek en yaygın yanılgıdır! Kesirlerde payda büyüdükçe parçanın boyutu küçülür.'
    },
    {
      id: 'qu-3',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: 'Özdeş iki doğum günü pizzasından birincisi 6 eşit dilime, ikincisi 12 eşit dilime ayrılmıştır.',
      prompt: 'Bu pizzalardan birer dilim alan Ece ve Mert için hangisi DOĞRUDUR?',
      options: [
        { id: 'opt-a', label: 'Ece\'nin aldığı 1/6 dilimi, Mert\'in aldığı 1/12 diliminden daha büyüktür.', sublabel: '1/6 > 1/12' },
        { id: 'opt-b', label: 'Mert\'in aldığı dilim daha büyüktür çünkü 12 daha büyüktür.', sublabel: 'Ters kavram yanılgısı' },
        { id: 'opt-c', label: 'İkisinin de dilimleri birbirine eşittir.', sublabel: 'Dilim sayıları farklı' },
        { id: 'opt-d', label: 'Karşılaştırma yapılamaz.', sublabel: 'Pizzalar özdeştir' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Aynı pizza 6\'ya bölündüğünde dilimler daha geniş kalır (1/6). 12\'ye bölündüğünde dilimler yarı yarıya incelir (1/12). 1/6 > 1/12 doğrudur.',
      misconceptionAlert: 'Bütün ne kadar çok parçaya bölünürse her dilim o kadar küçülür.'
    },
    {
      id: 'qu-4',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: '1/3, 1/9, 1/15 birim kesirlerinin BÜYÜKTEN KÜÇÜĞE doğru sıralanışı hangisidir?',
      prompt: 'Paydaları küçükten büyüğe sıralayarak en büyük kesri başa al.',
      options: [
        { id: 'opt-a', label: '1/3 > 1/9 > 1/15', sublabel: 'Doğru sıralama' },
        { id: 'opt-b', label: '1/15 > 1/9 > 1/3', sublabel: 'Küçükten büyüğe ters dizilim' },
        { id: 'opt-c', label: '1/9 > 1/3 > 1/15', sublabel: 'Karışık dizilim' },
        { id: 'opt-d', label: '1/3 > 1/15 > 1/9', sublabel: 'Yanlış son iki sıra' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Birim kesirlerde en küçük payda (3) en büyük kesri verir: 1/3. Ardından 1/9 ve en küçük olarak 1/15 gelir. 1/3 > 1/9 > 1/15.',
      misconceptionAlert: 'Büyükten küçüğe sıralarken paydalar küçükten büyüğe doğru olmalıdır.'
    },
    {
      id: 'qu-5',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: '1/18, 1/10, 1/4 birim kesirlerinin KÜÇÜKTEN BÜYÜĞE doğru sıralanışı hangisidir?',
      prompt: 'En çok parçaya bölünen en küçük kesri en başa yerleştir.',
      options: [
        { id: 'opt-a', label: '1/18 < 1/10 < 1/4', sublabel: 'Doğru küçükten büyüğe sıralama' },
        { id: 'opt-b', label: '1/4 < 1/10 < 1/18', sublabel: 'Büyükten küçüğe yanlış sembol' },
        { id: 'opt-c', label: '1/10 < 1/18 < 1/4', sublabel: 'Hatalı sıra' },
        { id: 'opt-d', label: '1/18 < 1/4 < 1/10', sublabel: 'Hatalı sıra' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Paydası en büyük olan 1/18 en küçük parçadır. Paydası en küçük olan 1/4 en büyük parçadır. Küçükten büyüğe: 1/18 < 1/10 < 1/4.',
      misconceptionAlert: 'Küçükten büyüğe sıralarken paydalar büyükten küçüğe doğru sıralanır.'
    },
    {
      id: 'qu-6',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: 'Üç arkadaş aynı boyuttaki çikolataların birim kesir kadarını yemiştir: Canan 1/4, Kerem 1/6, Selin 1/2.',
      prompt: 'En çok çikolatayı kim yemiştir?',
      options: [
        { id: 'opt-a', label: 'Selin (1/2)', sublabel: 'Yarım çikolata en büyük parçadır' },
        { id: 'opt-b', label: 'Kerem (1/6)', sublabel: '6 en büyük sayı yanılgısı' },
        { id: 'opt-c', label: 'Canan (1/4)', sublabel: 'Ortanca parça' },
        { id: 'opt-d', label: 'Hepsi eşit yemiştir', sublabel: 'Paydalar farklı' }
      ],
      correctOptionId: 'opt-a',
      explanation: '1/2, 1/4 ve 1/6 birim kesirleri karşılaştırıldığında en küçük payda 2 olduğu için en büyük parça 1/2\'dir. Dolayısıyla en çok çikolatayı Selin yemiştir.',
      misconceptionAlert: '1/2 bir bütünün yarısıdır ve 1/6 diliminden tam 3 kat daha büyüktür!'
    },
    {
      id: 'qu-7',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: '1/2 > 1/□ > 1/8 sıralamasında "□" kutusu yerine aşağıdaki sayılardan hangisi yazılabilir?',
      prompt: 'Kutunun değerinin hangi aralıkta olması gerektiğini düşün.',
      options: [
        { id: 'opt-a', label: '5', sublabel: '2 < 5 < 8 aralığındadır' },
        { id: 'opt-b', label: '1', sublabel: '1/1 = 1 tam, 1/2\'den büyüktür' },
        { id: 'opt-c', label: '10', sublabel: '1/10, 1/8\'den küçüktür' },
        { id: 'opt-d', label: '2', sublabel: 'Eşitlik olamaz' }
      ],
      correctOptionId: 'opt-a',
      explanation: '1/2 > 1/□ > 1/8 olması için paydanın 2 ile 8 arasında olması gerekir (2 < □ < 8). Seçeneklerdeki 5 sayısı bu aralıktadır (1/2 > 1/5 > 1/8).',
      misconceptionAlert: 'Paydalar sıralanırken eşitsizlik yönünün tersine döndüğüne dikkat edin: 1/2 > 1/□ > 1/8 ise 2 < □ < 8 olmalıdır.'
    },
    {
      id: 'qu-8',
      skillId: 'ventra.math.g4.fraction.unit_comparison',
      curriculumCode: 'M.4.1.6.2',
      question: 'MEB 4. Sınıf müfredat sınırında (payda en çok 20): 1/20 birim kesri ile ilgili hangisi KESİNLİKLE DOĞRUDUR?',
      prompt: '1/20 kesrinin parça büyüklüğünü değerlendir.',
      options: [
        { id: 'opt-a', label: '1/20, paydası 20\'den küçük olan tüm birim kesirlerden daha küçüktür.', sublabel: 'Örn: 1/20 < 1/19 < ... < 1/2' },
        { id: 'opt-b', label: '1/20 en büyük birim kesirdir çünkü 20 sayısı büyüktür.', sublabel: 'Büyük payda yanılgısı' },
        { id: 'opt-c', label: '1/20 kesri 1/10 kesrinden daha büyüktür.', sublabel: '20 parçaya bölünüş daha ufaktır' },
        { id: 'opt-d', label: '1/20 birim kesir değildir.', sublabel: 'Payı 1 olduğu için birim kesirdir' }
      ],
      correctOptionId: 'opt-a',
      explanation: 'Paydası 20 olan 1/20 kesri, bütünün 20 eş parçaya ayrıldığını gösterir. Bütün daha çok parçalandığı için 1/20, paydası 20\'den küçük tüm birim kesirlerden (1/2, 1/3, ..., 1/19) daha küçüktür.',
      misconceptionAlert: 'Payda 20 MEB 4. sınıf için en üst sınırdır ve bu seviyedeki en küçük birim kesir dilimidir.'
    }
  ]
};

export const ALL_LEARNING_MODULES: Record<string, LearningModuleData> = {
  'M.4.1.6.1': FRACTIONS_MODULE_DATA,
  'M.4.1.6.2': UNIT_FRACTIONS_MODULE_DATA
};

