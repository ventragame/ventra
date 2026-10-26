import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  MEB_G4_MATH_CURRICULUM, 
  VENTRA_FRACTION_SKILLS, 
  MVP_LEARNING_OUTCOMES 
} from '../../../packages/shared/src/index.ts';

import { FRACTIONS_MODULE_DATA } from '../src/data/learning/fractions.ts';

test('Curriculum Standard Verification: M.4.1.6.1', () => {
  const standard = MEB_G4_MATH_CURRICULUM['M.4.1.6.1'];
  assert.ok(standard, 'M.4.1.6.1 kazanım tanımı mevcut olmalı');
  assert.equal(standard.code, 'M.4.1.6.1');
  assert.equal(standard.authority, 'MEB');
  assert.equal(standard.grade, 4);
  assert.equal(standard.subject, 'Matematik');
  assert.equal(standard.subLearningArea, 'Kesirler');
  assert.match(standard.statement, /Basit, bileşik ve tam sayılı kesirleri/i);

  // Eski hatalı kod M.4.1.3.1 bulunmamalı
  assert.equal(MVP_LEARNING_OUTCOMES['MATH.G4.FRAC.01'].code, 'M.4.1.6.1', 'MVP_LEARNING_OUTCOMES M.4.1.6.1 ile güncellenmiş olmalı');
});

test('Ventra Internal Skills Contract', () => {
  const skillKeys = Object.keys(VENTRA_FRACTION_SKILLS);
  assert.ok(skillKeys.length >= 4, 'En az 4 iç pedagojik beceri tanımlı olmalı');

  for (const key of skillKeys) {
    const skill = VENTRA_FRACTION_SKILLS[key];
    assert.ok(skill.id.startsWith('ventra.math.g4.fraction.'), `Beceri ID formatı doğru olmalı: ${skill.id}`);
    assert.ok(skill.title.length > 0, 'Beceri başlığı boş olamaz');
    assert.ok(skill.description.length > 0, 'Beceri açıklaması boş olamaz');
    assert.ok(skill.curriculumCodes.includes('M.4.1.6.1'), 'M.4.1.6.1 ile haritalanmış olmalı');
  }
});

test('Learning Module Content & Exercises Integrity', () => {
  const mod = FRACTIONS_MODULE_DATA;
  assert.equal(mod.curriculumStandard.code, 'M.4.1.6.1');
  assert.equal(mod.sections.length, 4, '4 pedagojik ders bölümü olmalı');
  assert.equal(mod.solvedExamples.length >= 2, true, 'En az 2 çözümlü örnek bulunmalı');
  assert.ok(mod.exercises.length >= 8, 'En az 8 alıştırma sorusu bulunmalı');

  // Her sorunun yapısı ve pedagojik doğruluğu
  mod.exercises.forEach((q, idx) => {
    assert.ok(q.id, `Soru ${idx + 1} ID içermeli`);
    assert.ok(q.question.length > 10, `Soru ${idx + 1} metni eksiksiz olmalı`);
    assert.ok(q.prompt.length > 5, `Soru ${idx + 1} yönlendirici prompt içermeli`);
    assert.equal(q.options.length, 4, `Soru ${idx + 1} 4 seçenek içermeli`);
    assert.ok(q.explanation.length > 15, `Soru ${idx + 1} detaylı açıklama içermeli`);
    assert.equal(q.curriculumCode, 'M.4.1.6.1', `Soru ${idx + 1} M.4.1.6.1 kazanımına bağlı olmalı`);

    const correctOpt = q.options.find(o => o.id === q.correctOptionId);
    assert.ok(correctOpt, `Soru ${idx + 1} doğru seçeneği (${q.correctOptionId}) seçenekler arasında bulunmalı`);
  });
});

test('Mathematical Answer Correctness Verification', () => {
  const exercises = FRACTIONS_MODULE_DATA.exercises;

  // Q1: 8 dilim karpuz, 3 dilim ikram -> Pay: 3, Payda: 8
  const q1 = exercises.find(e => e.id === 'q1');
  assert.equal(q1?.correctOptionId, 'opt-a');
  assert.match(q1?.options.find(o => o.id === 'opt-a')?.label || '', /Pay: 3, Payda: 8/);

  // Q2: Basit kesir -> 3/8 (3 < 8)
  const q2 = exercises.find(e => e.id === 'q2');
  assert.equal(q2?.correctOptionId, 'opt-c');
  assert.match(q2?.options.find(o => o.id === 'opt-c')?.label || '', /3 \/ 8/);

  // Q3: 6 eş parça, 4 boyalı -> 4/6 basit kesir
  const q3 = exercises.find(e => e.id === 'q3');
  assert.equal(q3?.correctOptionId, 'opt-a');
  assert.match(q3?.options.find(o => o.id === 'opt-a')?.label || '', /4\/6/);

  // Q4: Payı 7 olan bileşik kesirde payda en fazla 7 olabilir, 10 olamaz (7/10 basit kesir olur)
  const q4 = exercises.find(e => e.id === 'q4');
  assert.equal(q4?.correctOptionId, 'opt-d');
  assert.equal(q4?.options.find(o => o.id === 'opt-d')?.label, '10');

  // Q5: 2 tam blok + 3/4 -> 2 tam 3/4
  const q5 = exercises.find(e => e.id === 'q5');
  assert.equal(q5?.correctOptionId, 'opt-a');
  assert.match(q5?.options.find(o => o.id === 'opt-a')?.label || '', /2 tam 3\/4/);

  // Q6: 11/4 = 2 tam 3/4
  const q6 = exercises.find(e => e.id === 'q6');
  assert.equal(q6?.correctOptionId, 'opt-a');
  assert.match(q6?.options.find(o => o.id === 'opt-a')?.label || '', /2 tam 3\/4/);

  // Q7: K/9 basit kesir ise max K = 8
  const q7 = exercises.find(e => e.id === 'q7');
  assert.equal(q7?.correctOptionId, 'opt-a');
  assert.equal(q7?.options.find(o => o.id === 'opt-a')?.label, '8');

  // Q8: Sayı doğrusunda 0-1 arası 5 parça, 3. nokta -> 3/5 basit kesir
  const q8 = exercises.find(e => e.id === 'q8');
  assert.equal(q8?.correctOptionId, 'opt-a');
  assert.match(q8?.options.find(o => o.id === 'opt-a')?.label || '', /3\/5/);
});

